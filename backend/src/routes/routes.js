import { authMiddleware } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import { cronService } from '../services/cronService.js';
import { randomUUID } from 'crypto';

const MAX_ROUTES = 3; // RN07

export default async function routeRoutes(app) {
  // Lista todas as rotas do usuário
  app.get('/routes', { preHandler: authMiddleware }, async (request) => {
    const snap = await db.collection('routes')
      .where('userId', '==', request.userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  });

  // Cria nova rota (máx 3 por usuário — RN07)
  app.post('/routes', { preHandler: authMiddleware }, async (request, reply) => {
    const userRef = db.collection('users').doc(request.userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return reply.status(404).send({ error: 'Usuário não encontrado' });

    if (userSnap.data().routesCount >= MAX_ROUTES) {
      return reply.status(400).send({ error: 'Limite de 3 rotas atingido' });
    }

    const { name, emoji, origin, destination, departureTime, daysOfWeek, alertAdvance, alertTolerance } = request.body ?? {};

    // RN08, RN09, RN10, RN11
    if (!name || !origin?.address || !destination?.address || !departureTime || !daysOfWeek?.length) {
      return reply.status(400).send({ error: 'Campos obrigatórios ausentes: name, origin.address, destination.address, departureTime, daysOfWeek' });
    }

    const routeId = randomUUID();
    const routeData = {
      routeId,
      userId: request.userId,
      name,
      emoji: emoji ?? '📍',
      origin,       // { address, lat, lng }
      destination,  // { address, lat, lng }
      departureTime,           // "07:30"
      daysOfWeek,              // [1,2,3,4,5]
      alertAdvance: alertAdvance ?? 30,    // 15|30|45|60
      alertTolerance: alertTolerance ?? 15, // 5|10|15|30
      isActive: true,
      baseTime: null,
      lastCheckedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('routes').doc(routeId).set(routeData);
    await userRef.update({ routesCount: userSnap.data().routesCount + 1 });
    await cronService.scheduleRoute({ ...routeData, id: routeId });

    return reply.status(201).send({ id: routeId, ...routeData });
  });

  // Atualiza rota existente
  app.put('/routes/:routeId', { preHandler: authMiddleware }, async (request, reply) => {
    const { routeId } = request.params;
    const routeRef = db.collection('routes').doc(routeId);
    const snap = await routeRef.get();

    if (!snap.exists || snap.data().userId !== request.userId) {
      return reply.status(404).send({ error: 'Rota não encontrada' });
    }

    const allowed = ['name', 'emoji', 'origin', 'destination', 'departureTime', 'daysOfWeek', 'alertAdvance', 'alertTolerance'];
    const updates = { updatedAt: new Date() };
    for (const key of allowed) {
      if (request.body?.[key] !== undefined) updates[key] = request.body[key];
    }

    // Ao mudar a rota, zera o tempo base para recalcular
    if (updates.origin || updates.destination) updates.baseTime = null;

    await routeRef.update(updates);
    const updated = { id: routeId, ...snap.data(), ...updates };
    await cronService.rescheduleRoute(updated);

    return updated;
  });

  // Ativa ou pausa a rota (toggle)
  app.patch('/routes/:routeId/toggle', { preHandler: authMiddleware }, async (request, reply) => {
    const { routeId } = request.params;
    const routeRef = db.collection('routes').doc(routeId);
    const snap = await routeRef.get();

    if (!snap.exists || snap.data().userId !== request.userId) {
      return reply.status(404).send({ error: 'Rota não encontrada' });
    }

    const newState = !snap.data().isActive;
    await routeRef.update({ isActive: newState, updatedAt: new Date() });

    if (newState) {
      await cronService.scheduleRoute({ ...snap.data(), isActive: true, id: routeId });
    } else {
      cronService.unscheduleRoute(routeId);
    }

    return { isActive: newState };
  });

  // Exclui rota permanentemente
  app.delete('/routes/:routeId', { preHandler: authMiddleware }, async (request, reply) => {
    const { routeId } = request.params;
    const routeRef = db.collection('routes').doc(routeId);
    const snap = await routeRef.get();

    if (!snap.exists || snap.data().userId !== request.userId) {
      return reply.status(404).send({ error: 'Rota não encontrada' });
    }

    await routeRef.delete();
    cronService.unscheduleRoute(routeId);

    const userRef = db.collection('users').doc(request.userId);
    const userSnap = await userRef.get();
    if (userSnap.exists && userSnap.data().routesCount > 0) {
      await userRef.update({ routesCount: userSnap.data().routesCount - 1 });
    }

    return reply.status(204).send();
  });

  // Verificação manual imediata (botão "Verificar agora" da T07)
  app.post('/routes/:routeId/check', { preHandler: authMiddleware }, async (request, reply) => {
    const { routeId } = request.params;
    const snap = await db.collection('routes').doc(routeId).get();

    if (!snap.exists || snap.data().userId !== request.userId) {
      return reply.status(404).send({ error: 'Rota não encontrada' });
    }

    const result = await cronService.checkRouteNow(snap.data());
    return result;
  });
}
