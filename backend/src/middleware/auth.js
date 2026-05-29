import { auth, USE_SQLITE } from '../config/firebase.js';

export async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token ausente' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Modo SQLite/dev: tokens "test_<uid>" são aceitos sem verificação Firebase
  if (USE_SQLITE && token.startsWith('test_')) {
    request.userId = token.slice(5); // remove "test_"
    return;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    request.userId = decoded.uid;
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' });
  }
}
