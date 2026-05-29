import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import { cronService } from './services/cronService.js';
import userRoutes from './routes/users.js';
import routeRoutes from './routes/routes.js';
import alertRoutes from './routes/alerts.js';

const isProd = process.env.NODE_ENV === 'production';

const app = Fastify({
  logger: {
    level: isProd ? 'info' : 'debug',
    transport: !isProd
      ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } }
      : undefined,
  },
});

await app.register(cors, { origin: true });

// Prefixo versionado para todas as rotas da API
app.register(userRoutes, { prefix: '/api/v1' });
app.register(routeRoutes, { prefix: '/api/v1' });
app.register(alertRoutes, { prefix: '/api/v1' });

// Health check para o Railway
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV,
}));

// Handler global de erros não tratados
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
  });
});

const start = async () => {
  try {
    // Carrega e agenda todas as rotas ativas ao iniciar
    await cronService.initialize();

    const port = parseInt(process.env.PORT || '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`TrafficGuard backend rodando na porta ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
