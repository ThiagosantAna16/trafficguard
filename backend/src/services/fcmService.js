import { messaging, db, USE_SQLITE } from '../config/firebase.js';
import { secondsToHumanTime } from '../utils/timeUtils.js';

export const fcmService = {
  async sendTrafficAlert({ userId, alert, route }) {
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return false;

    const { fcmToken } = userSnap.data();
    if (!fcmToken && !USE_SQLITE) {
      console.warn(`[FCM] Usuário ${userId} sem FCM token — notificação não enviada`);
      return false;
    }

    const delayMin = Math.round(alert.delay / 60);
    const timeToSaida = route.alertAdvance;
    const bestAlt = alert.alternatives[0];
    const altTimeStr = secondsToHumanTime(bestAlt.duration);

    const severity = delayMin >= 30 ? '🚨' : '⚠️';
    const title = `${severity} Saída para ${route.name} em ${timeToSaida} min`;
    const body = `Trânsito com +${delayMin} min de atraso. Alternativa: ${bestAlt.description} — ${altTimeStr}.`;

    // Modo SQLite: simula envio no console
    if (USE_SQLITE) {
      console.log(`[FCM MOCK] ─────────────────────────────`);
      console.log(`[FCM MOCK] Título : ${title}`);
      console.log(`[FCM MOCK] Corpo  : ${body}`);
      console.log(`[FCM MOCK] UserId : ${userId}`);
      console.log(`[FCM MOCK] AlertId: ${alert.alertId}`);
      console.log(`[FCM MOCK] ─────────────────────────────`);
      return true;
    }

    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'TRAFFIC_ALERT',
        alertId: alert.alertId,
        routeId: route.routeId,
        routeName: route.name,
        delay: String(alert.delay),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'traffic_alerts',
          sound: 'default',
          clickAction: 'OPEN_ALERT_DETAIL',
        },
      },
    };

    try {
      await messaging.send(message);
      console.log(`[FCM] Notificação enviada: "${title}"`);
      return true;
    } catch (err) {
      if (err.code === 'messaging/registration-token-not-registered') {
        await db.collection('users').doc(userId).update({ fcmToken: null });
        console.warn(`[FCM] Token inválido para ${userId} — removido`);
      } else {
        console.error('[FCM] Erro ao enviar:', err.message);
      }
      return false;
    }
  },
};
