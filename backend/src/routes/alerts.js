import { authMiddleware } from '../middleware/auth.js';
import { db } from '../config/db.js';

export default async function alertRoutes(app) {
  // Histórico dos últimos 7 dias (RN06 — não reenvia após o horário de saída)
  app.get('/alerts', { preHandler: authMiddleware }, async (request) => {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const snap = await db.collection('alerts')
      .where('userId', '==', request.userId)
      .where('triggeredAt', '>=', since)
      .orderBy('triggeredAt', 'desc')
      .get();

    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        alertId: data.alertId,
        routeId: data.routeId,
        routeName: data.routeName,
        triggeredAt: data.triggeredAt?.toDate?.() ?? data.triggeredAt,
        delay: data.delay,
        alternatives: data.alternatives,
        openedByUser: data.openedByUser,
        notificationSent: data.notificationSent,
      };
    });
  });

  // Marca o alerta como aberto pelo usuário (para métricas Firebase Analytics)
  app.patch('/alerts/:alertId/open', { preHandler: authMiddleware }, async (request, reply) => {
    const { alertId } = request.params;
    const alertRef = db.collection('alerts').doc(alertId);
    const snap = await alertRef.get();

    if (!snap.exists || snap.data().userId !== request.userId) {
      return reply.status(404).send({ error: 'Alerta não encontrado' });
    }

    await alertRef.update({ openedByUser: true });
    return { openedByUser: true };
  });
}
