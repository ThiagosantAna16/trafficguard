import axios from 'axios';
import { db, USE_LOCAL } from '../config/db.js';
import { secondsToHumanTime } from '../utils/timeUtils.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const pushService = {
  /**
   * Envia o alerta de trânsito via Expo Push API (funciona com o app fechado).
   * Substitui o FCM — o token é o Expo Push Token gerado no app.
   */
  async sendTrafficAlert({ userId, alert, route }) {
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return false;

    const { pushToken } = userSnap.data();

    const delayMin = Math.round(alert.delay / 60);
    const bestAlt = alert.alternatives[0];
    const altTimeStr = secondsToHumanTime(bestAlt.duration);

    const severity = delayMin >= 30 ? '🚨' : '⚠️';
    const title = `${severity} Saída para ${route.name} em ${route.alertAdvance} min`;
    const body = `Trânsito com +${delayMin} min de atraso. Alternativa: ${bestAlt.description} — ${altTimeStr}.`;

    // Sem token (ex.: modo local/dev): apenas registra no console
    if (!pushToken) {
      if (USE_LOCAL) {
        console.log('[Push MOCK] ─────────────────────────────');
        console.log(`[Push MOCK] Título : ${title}`);
        console.log(`[Push MOCK] Corpo  : ${body}`);
        console.log(`[Push MOCK] UserId : ${userId} | AlertId: ${alert.alertId}`);
        console.log('[Push MOCK] ─────────────────────────────');
        return true;
      }
      console.warn(`[Push] Usuário ${userId} sem pushToken — notificação não enviada`);
      return false;
    }

    const message = {
      to: pushToken,
      title,
      body,
      sound: 'default',
      priority: 'high',
      channelId: 'traffic_alerts',
      data: {
        type: 'TRAFFIC_ALERT',
        alertId: alert.alertId,
        routeId: route.routeId ?? route.id,
        routeName: route.name,
        delay: alert.delay,
      },
    };

    try {
      const { data } = await axios.post(EXPO_PUSH_URL, message, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: 10000,
      });

      const ticket = data?.data;
      // Token inválido/desregistrado → limpa do usuário
      if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
        await db.collection('users').doc(userId).update({ pushToken: null });
        console.warn(`[Push] Token inválido para ${userId} — removido`);
        return false;
      }

      console.log(`[Push] Notificação enviada: "${title}"`);
      return true;
    } catch (err) {
      console.error('[Push] Erro ao enviar:', err.message);
      return false;
    }
  },
};
