import cron from 'node-cron';
import { randomUUID } from 'crypto';
import { db } from '../config/db.js';
import { mapsService } from './mapsService.js';
import { pushService } from './pushService.js';
import { buildCronExpression, isWithinQuotaLimit, incrementDailyUsage } from '../utils/timeUtils.js';

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

  /** Cria o cron job para uma rota. Substitui se já existir. */
  async scheduleRoute(route) {
    const routeId = route.routeId ?? route.id;
    if (!route.isActive) return;

    this.unscheduleRoute(routeId);

    const cronExpr = buildCronExpression(
      route.departureTime,
      route.alertAdvance,
      route.daysOfWeek
    );
    if (!cronExpr) {
      console.warn(`[CronService] Expressão cron inválida para rota ${routeId}`);
      return;
    }

    // node-cron usa America/Sao_Paulo diretamente para evitar bug de horário de verão
    const task = cron.schedule(cronExpr, async () => {
      await this.checkRouteAndNotify(routeId);
    }, { timezone: 'America/Sao_Paulo' });

    jobs.set(routeId, task);
    console.log(`[CronService] Agendado: "${route.name}" (${routeId}) — cron: ${cronExpr}`);
  },

  /** Cancela e reagenda (usado ao editar horário/dias). */
  async rescheduleRoute(route) {
    const routeId = route.routeId ?? route.id;
    this.unscheduleRoute(routeId);
    if (route.isActive) await this.scheduleRoute(route);
  },

  /** Para e remove o cron job de uma rota. */
  unscheduleRoute(routeId) {
    const task = jobs.get(routeId);
    if (task) {
      task.stop();
      jobs.delete(routeId);
    }
  },

  /** Verificação manual imediata (botão "Verificar agora" da T07). */
  async checkRouteNow(route) {
    return this.checkRouteAndNotify(route.routeId ?? route.id);
  },

  /**
   * Núcleo do motor de alertas.
   * Executado pelo cron job ou manualmente.
   * RN01–RN06, RN13, RN14.
   */
  async checkRouteAndNotify(routeId) {
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
    const currentTime = mainRoute.durationSeconds;

    // Estabelece tempo base na primeira verificação (usa staticDuration — sem tráfego)
    let baseTime = route.baseTime;
    if (!baseTime) {
      baseTime = mainRoute.staticDurationSeconds || currentTime;
      await db.collection('routes').doc(routeId).update({ baseTime, lastCheckedAt: new Date() });
    } else {
      await db.collection('routes').doc(routeId).update({ lastCheckedAt: new Date() });
    }

    const delay = currentTime - baseTime;
    const toleranceSeconds = route.alertTolerance * 60;

    // RN04 — alerta só dispara se atraso ≥ tolerância
    if (delay < toleranceSeconds) {
      console.log(`[CronService] "${route.name}": trânsito normal (atraso: ${Math.round(delay / 60)} min)`);
      return { notified: false, reason: 'traffic_normal', delaySeconds: delay };
    }

    // Monta alternativas: rotas 1..N da resposta (rota 0 é a congestionada)
    const alternatives = trafficData.routes.slice(1).map(r => ({
      description: r.description,
      duration: r.durationSeconds,
      distanceM: r.distanceMeters,
    }));

    // Se não houver alternativa, informa a rota original com a demora
    if (!alternatives.length) {
      alternatives.push({
        description: mainRoute.description,
        duration: currentTime,
        distanceM: mainRoute.distanceMeters,
      });
    }

    alternatives.sort((a, b) => a.duration - b.duration);

    const alertId = randomUUID();
    const alertData = {
      alertId,
      userId: route.userId,
      routeId,
      routeName: route.name,
      triggeredAt: new Date(),
      baseTime,
      currentTime,
      delay,
      incidentType: null, // futuramente: extrair de travelAdvisory
      alternatives,
      notificationSent: false,
      openedByUser: false,
    };

    // Salva o alerta antes de enviar (backend escreve — regra Firestore)
    await db.collection('alerts').doc(alertId).set(alertData);

    // RN14 — disparo via Expo Push (funciona com app fechado)
    const sent = await pushService.sendTrafficAlert({ userId: route.userId, alert: alertData, route });
    if (sent) {
      await db.collection('alerts').doc(alertId).update({ notificationSent: true });
    }

    console.log(`[CronService] "${route.name}": ALERTA disparado (atraso: ${Math.round(delay / 60)} min)`);
    return { notified: true, alertId, delaySeconds: delay, alternatives };
  },
};
