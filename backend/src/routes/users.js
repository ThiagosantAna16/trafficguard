import { authMiddleware } from '../middleware/auth.js';
import { db } from '../config/firebase.js';

export default async function userRoutes(app) {
  // Cria ou atualiza perfil do usuário e FCM token após login
  app.post('/users/me', { preHandler: authMiddleware }, async (request, reply) => {
    const { name, email, fcmToken } = request.body ?? {};
    const userRef = db.collection('users').doc(request.userId);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        uid: request.userId,
        name: name ?? '',
        email: email ?? '',
        fcmToken: fcmToken ?? null,
        plan: 'free',
        routesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return reply.status(201).send({ message: 'Usuário criado' });
    }

    const updates = { updatedAt: new Date() };
    if (name) updates.name = name;
    if (fcmToken) updates.fcmToken = fcmToken;
    await userRef.update(updates);
    return { message: 'Usuário atualizado' };
  });

  // Retorna dados do usuário autenticado
  app.get('/users/me', { preHandler: authMiddleware }, async (request, reply) => {
    const snap = await db.collection('users').doc(request.userId).get();
    if (!snap.exists) return reply.status(404).send({ error: 'Usuário não encontrado' });
    const { uid, name, email, plan, routesCount } = snap.data();
    return { uid, name, email, plan, routesCount };
  });

  // Exclui conta e todos os dados do usuário
  app.delete('/users/me', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId;
    const batch = db.batch();

    const routesSnap = await db.collection('routes').where('userId', '==', userId).get();
    routesSnap.docs.forEach(doc => batch.delete(doc.ref));

    const alertsSnap = await db.collection('alerts').where('userId', '==', userId).get();
    alertsSnap.docs.forEach(doc => batch.delete(doc.ref));

    batch.delete(db.collection('users').doc(userId));
    await batch.commit();

    return reply.status(204).send();
  });
}
