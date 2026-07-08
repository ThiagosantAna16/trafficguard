import cron from 'node-cron';
import { randomUUID } from 'crypto';
import { db } from '../config/db.js';
import { mapsService } from './mapsService.js';
import { pushService } from './pushService.js';
import { buildCronExpression, isWithinQuotaLimit, incrementDailyUsage, secondsToHumanTime } from '../utils/timeUtils.js';

// Map de routeId → task do node-cron (em memória durante o runtime do servidor)
const jobs = new Map();

export const cronService = {
  /**
   * Carrega todas as rotas ativas do Firestore ao iniciar o servidor
   * e cria os cron jobs correspondentes.
   */
  async initialize() {
    const snap = await db.collection('routes').where('isActive', '==', true).get();
    let count = 0;
    for (const doc of snap.docs) {
      await this.scheduleRoute({ id: doc.id, ...doc.data() });
      count++;
    }
    console.log(`[CronService] ${count} rota(s) agendada(s)`);
  },

  /** Cria os cron jobs para uma rota. Substitui se já existir. */
  async scheduleRoute(route) {
    const routeId = route.routeId ?? route.id;
    if (!route.isActive) return;

    this.unscheduleRoute(routeId);

    const tz = { timezone: 'America/Sao_Paulo' }; // evita bug de horário de verão

    // Uma notificação na antecedência configurada, SEMPRE com o status
    // (trânsito normal ✅ ou atraso ⚠️).
    const expr = buildCronExpression(route.departureTime, route.alertAdvance, route.daysOfWeek);
    if (!expr) {
      console.warn(`[CronService] Expressão cron inválida para rota ${routeId}`);
      return;
    }

    const task = cron.schedule(expr, () => this.checkRouteAndNotify(routeId, { alwaysNotify: true, record: true }), tz);
    jobs.set(routeId, [task]);
    console.log(`[CronService] Agendado: "${route.name}" (${routeId}) — ${route.alertAdvance} min antes da saída`);
  },

  /** Cancela e reagenda (usado ao editar horário/dias). */
  async rescheduleRoute(route) {
    const routeId = route.routeId ?? route.id;
    this.unscheduleRoute(routeId);
    if (route.isActive) await this.scheduleRoute(route);
  },

  /** Para e remove os cron jobs de uma rota. */
  unscheduleRoute(routeId) {
    const tasks = jobs.get(routeId);
    if (tasks) {
      tasks.forEach(t => t.stop());
      jobs.delete(routeId);
    }
  },

  /**
   * Verificação manual/inicial (botão "Verificar agora" e ao criar a rota):
   * calcula e devolve o status para a tela, mas NÃO envia push e NÃO grava
   * no histórico (só as verificações agendadas alimentam a média de 7 dias).
   */
  async checkRouteNow(route) {
    return this.checkRouteAndNotify(route.routeId ?? route.id, { silent: true, record: false });
  },

  /**
   * Núcleo do motor de alertas.
   * Executado pelo cron job ou manualmente.
   * RN01–RN06, RN13, RN14.
   */
  async checkRouteAndNotify(routeId, { alwaysNotify = false, silent = false, record = false } = {}) {
    const snap = await db.collection('routes').doc(routeId).get();
    if (!snap.exists) return { notified: false, reason: 'route_not_found' };

    const route = { id: snap.id, ...snap.data() };

    // RN03 — rota pausada não é verificada
    if (!route.isActive) return { notified: false, reason: 'route_paused' };

    // P4 — circuit breaker: para ao atingir 80% da quota diária
    if (!(await isWithinQuotaLimit())) {
      console.warn(`[CronService] Quota diária atingida — pulando ${route.name}`);
      return { notified: false, reason: 'quota_limit' };
    }

    let trafficData;
    try {
      trafficData = await mapsService.getTrafficData(route);
      await incrementDailyUsage();
    } catch (err) {
      console.error(`[CronService] Erro na Maps API para "${route.name}":`, err.message);
      return { notified: false, reason: 'api_error', error: err.message };
    }

    if (!trafficData.hasData || !trafficData.routes.length) {
      return { notified: false, reason: 'no_data' };
    }

    const mainRoute = trafficData.routes[0];
    const currentTime = mainRoute.durationSeconds; // tempo do trajeto HOJE (com trânsito)
    const now = new Date();

    // Base de comparação = MÉDIA dos tempos medidos nos últimos 7 dias para este
    // trajeto. Enquanto não houver histórico, usa o tempo sem trânsito como base
    // provisória.
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    const priorHistory = (Array.isArray(route.history) ? route.history : [])
      .filter(h => Date.parse(h.at) >= cutoff);

    const baseTime = priorHistory.length
      ? Math.round(priorHistory.reduce((sum, h) => sum + h.t, 0) / priorHistory.length)
      : (mainRoute.staticDurationSeconds || currentTime);

    const delay = currentTime - baseTime;
    const toleranceSeconds = route.alertTolerance * 60;
    const delayMin = Math.round(delay / 60);

    // Persiste o resultado (tela Início) e, se for verificação agendada, grava a
    // medição de hoje no histórico (1 por dia) para compor a média dos 7 dias.
    const updates = {
      baseTime,
      lastCheckedAt: now,
      lastCheck: { currentTime, delay, checkedAt: now },
    };
    if (record) {
      const today = now.toISOString().slice(0, 10);
      const kept = (Array.isArray(route.history) ? route.history : [])
        .filter(h => Date.parse(h.at) >= cutoff && h.at.slice(0, 10) !== today);
      updates.history = [...kept, { at: now.toISOString(), t: currentTime }].slice(-14);
    }
    await db.collection('routes').doc(routeId).update(updates);

    // Trânsito normal (dentro da média): notifica só na verificação agendada
    if (delay < toleranceSeconds) {
      console.log(`[CronService] "${route.name}": normal (hoje ${Math.round(currentTime / 60)}min vs média ${Math.round(baseTime / 60)}min)`);
      if (alwaysNotify && !silent) {
        await pushService.sendToUser(route.userId, {
          title: `✅ ${route.name}: trânsito normal`,
          body: `Saída ${route.departureTime} · trajeto ~${secondsToHumanTime(currentTime)} (na média). Pode sair no horário.`,
          data: { type: 'TRAFFIC_OK', routeId, routeName: route.name, departureTime: route.departureTime },
        });
      }
      return { notified: alwaysNotify && !silent, reason: 'traffic_normal', delaySeconds: delay };
    }

    // Atraso acima da média + tolerância → monta alternativas
    const alternatives = trafficData.routes.slice(1).map(r => ({
      description: r.description,
      duration: r.durationSeconds,
      distanceM: r.distanceMeters,
    }));
    if (!alternatives.length) {
      alternatives.push({ description: mainRoute.description, duration: currentTime, distanceM: mainRoute.distanceMeters });
    }
    alternatives.sort((a, b) => a.duration - b.duration);

    // Modo silencioso (verificação manual/inicial): devolve os dados sem push nem alerta
    if (silent) {
      return { notified: false, reason: 'delay', delaySeconds: delay, baseSeconds: baseTime, currentSeconds: currentTime, alternatives };
    }

    const alertId = randomUUID();
    const alertData = {
      alertId,
      userId: route.userId,
      routeId,
      routeName: route.name,
      triggeredAt: new Date(),
      baseTime,          // média dos últimos 7 dias
      currentTime,       // tempo de hoje
      delay,
      incidentType: null,
      alternatives,
      notificationSent: false,
      openedByUser: false,
    };
    await db.collection('alerts').doc(alertId).set(alertData);

    const bestAlt = alternatives[0];
    const sent = await pushService.sendToUser(route.userId, {
      title: `${delayMin >= 30 ? '🚨' : '⚠️'} ${route.name}: +${delayMin} min acima do normal`,
      body: `Hoje ~${secondsToHumanTime(currentTime)} vs média ~${secondsToHumanTime(baseTime)}. Alternativa: ${bestAlt.description} — ${secondsToHumanTime(bestAlt.duration)}.`,
      data: { type: 'TRAFFIC_ALERT', alertId, routeId, routeName: route.name, delay },
    });
    if (sent) {
      await db.collection('alerts').doc(alertId).update({ notificationSent: true });
    }

    console.log(`[CronService] "${route.name}": ALERTA (hoje ${Math.round(currentTime / 60)}min vs média ${Math.round(baseTime / 60)}min, +${delayMin}min)`);
    return { notified: true, alertId, delaySeconds: delay, alternatives };
  },
};
