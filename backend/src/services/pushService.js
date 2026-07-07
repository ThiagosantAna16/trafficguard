import axios from 'axios';
import { db, USE_LOCAL } from '../config/db.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const pushService = {
  /**
   * Envia uma notificação push para o usuário via Expo Push API.
   * Funciona com o app fechado. No modo local (sem token) apenas loga.
   */
  async sendToUser(userId, { title, body, data = {} }) {
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists) return false;

    const { pushToken } = userSnap.data();

    if (!pushToken) {
      if (USE_LOCAL) {
        console.log('[Push MOCK] ─────────────────────────────');
        console.log(`[Push MOCK] Título : ${title}`);
        console.log(`[Push MOCK] Corpo  : ${body}`);
        console.log(`[Push MOCK] UserId : ${userId}`);
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
      data,
    };

    try {
      const { data: resp } = await axios.post(EXPO_PUSH_URL, message, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: 10000,
      });

      const ticket = resp?.data;
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
