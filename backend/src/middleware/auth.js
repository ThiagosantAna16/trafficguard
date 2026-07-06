import { verifyToken } from '../config/auth.js';

const isProd = process.env.NODE_ENV === 'production';

export async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token ausente' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Modo dev: tokens "test_<uid>" são aceitos sem verificação (fora de produção)
  if (!isProd && token.startsWith('test_')) {
    request.userId = token.slice(5); // remove "test_"
    return;
  }

  try {
    const decoded = verifyToken(token);
    request.userId = decoded.sub;
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' });
  }
}
