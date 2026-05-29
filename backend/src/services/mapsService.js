import axios from 'axios';
import { cacheService } from './cacheService.js';

const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

export const mapsService = {
  /**
   * Consulta a Routes API com tráfego em tempo real.
   * Resultado cacheado por 5 minutos para rotas similares (P1, P2 — Context.md §5.4).
   */
  async getTrafficData(route) {
    const cacheKey = buildCacheKey(route);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Maps] Cache hit: ${route.name}`);
      return cached;
    }

    const departureTimeISO = buildDepartureTimeUTC(route.departureTime);

    const { data } = await axios.post(ROUTES_API_URL, {
      origin: { address: route.origin.address },
      destination: { address: route.destination.address },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      departureTime: departureTimeISO,
      computeAlternativeRoutes: true,
      routeModifiers: { avoidTolls: false, avoidHighways: false },
      languageCode: 'pt-BR',
      units: 'METRIC',
    }, {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_ROUTES_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters,routes.description,routes.travelAdvisory',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const result = parseRoutesResponse(data);
    await cacheService.set(cacheKey, result, 300); // TTL 5 min
    return result;
  },

  /**
   * Gera URL da Maps Static API para thumbnail do mapa em T08.
   * Usa a API Key do servidor — nunca exposta no app.
   */
  getStaticMapUrl(origin, destination) {
    const params = new URLSearchParams({
      size: '400x200',
      scale: '2',
      markers: `color:green|label:A|${origin.lat},${origin.lng}`,
      markers: `color:red|label:B|${destination.lat},${destination.lng}`,
      key: process.env.GOOGLE_MAPS_ROUTES_KEY,
    });
    return `https://maps.googleapis.com/maps/api/staticmap?${params}`;
  },
};

// ---------- helpers ----------

function buildCacheKey(route) {
  // Arredonda lat/lng para 3 casas para agrupar rotas similares (P2)
  const oLat = Math.round((route.origin.lat ?? 0) * 1000) / 1000;
  const oLng = Math.round((route.origin.lng ?? 0) * 1000) / 1000;
  const dLat = Math.round((route.destination.lat ?? 0) * 1000) / 1000;
  const dLng = Math.round((route.destination.lng ?? 0) * 1000) / 1000;
  // Agrupa horários dentro de ±5 min (P2)
  const [h, m] = route.departureTime.split(':').map(Number);
  const slotMinutes = Math.floor((h * 60 + m) / 5) * 5;
  return `traffic:${oLat},${oLng}:${dLat},${dLng}:${slotMinutes}`;
}

function parseRoutesResponse(data) {
  if (!data.routes?.length) return { hasData: false, routes: [] };

  return {
    hasData: true,
    routes: data.routes.map((r, i) => ({
      index: i,
      description: r.description || `Rota ${i + 1}`,
      durationSeconds: parseDuration(r.duration),
      staticDurationSeconds: parseDuration(r.staticDuration),
      distanceMeters: r.distanceMeters ?? 0,
    })),
  };
}

function parseDuration(dur) {
  if (!dur) return 0;
  if (typeof dur === 'string') return parseInt(dur.replace('s', ''), 10);
  return dur.seconds ?? 0;
}

function buildDepartureTimeUTC(departureTime) {
  // BRT = UTC-3. Converte o horário de saída para UTC e formata como RFC3339.
  const [hours, minutes] = departureTime.split(':').map(Number);
  const now = new Date();
  // Horário de hoje com os minutos de saída, convertido para UTC (BRT+3)
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours + 3,  // UTC-3 → UTC
    minutes,
    0
  ));
  return utcDate.toISOString();
}
