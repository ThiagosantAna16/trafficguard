import { authMiddleware } from '../middleware/auth.js';
import { mapsService } from '../services/mapsService.js';

export default async function geocodeRoutes(app) {
  // Autocomplete de endereços — proxy da TomTom Search (mantém a chave no servidor)
  app.get('/geocode', { preHandler: authMiddleware }, async (request, reply) => {
    const q = String(request.query?.q ?? '').trim();
    if (q.length < 3) return [];

    try {
      return await mapsService.searchAddress(q);
    } catch (err) {
      request.log.error(`[Geocode] Falha para "${q}": ${err.message}`);
      return reply.status(502).send({ error: 'Falha na busca de endereço' });
    }
  });
}
