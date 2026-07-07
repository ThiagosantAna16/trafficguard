import { authMiddleware } from '../middleware/auth.js';
import { pushService } from '../services/pushService.js';

export default async function pushRoutes(app) {
  // Envia uma notificação de teste para o próprio usuário (valida o push)
  app.post('/push/test', { preHandler: authMiddleware }, async (request) => {
    const sent = await pushService.sendToUser(request.userId, {
      title: '🚦 TrafficGuard',
      body: 'Notificação de teste — se você recebeu isto, o push está funcionando!',
      data: { type: 'TEST' },
    });
    return { sent };
  });
}
