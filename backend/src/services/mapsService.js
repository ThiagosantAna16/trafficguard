import axios from 'axios';
import { cacheService } from './cacheService.js';

const ROUTING_BASE = 'https://api.tomtom.com/routing/1/calculateRoute';
const STATIC_MAP_URL = 'https://api.tomtom.com/map/1/staticimage';
const SEARCH_BASE = 'https://api.tomtom.com/search/2/search';

export const mapsService = {
  /**
   * Busca de endereços (autocomplete) via TomTom Search API.
   * Retorna resultados já normalizados como { address, lat, lng }.
   */
  async searchAddress(query) {
    const { data } = await axios.get(
      `${SEARCH_BASE}/${encodeURIComponent(query)}.json`,
      {
        params: {
          key: process.env.TOMTOM_API_KEY,
          countrySet: 'BR',
          limit: 6,
          language: 'pt-BR',
        },
        timeout: 8000,
      }
    );
    return (data.results ?? [])
      .map(r => ({
        address: r.address?.freeformAddress ?? query,
        lat: r.position?.lat,
        lng: r.position?.lon,
      }))
      .filter(r => typeof r.lat === 'number' && typeof r.lng === 'number');
  },

  /**
   * Consulta a TomTom Routing API com tráfego em tempo real.
   * Retorna a rota principal + alternativas, com tempo com/sem trânsito.
   * Resultado cacheado por 5 minutos para rotas similares (P1, P2).
   */
  async getTrafficData(route) {
    const cacheKey = buildCacheKey(route);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Maps] Cache hit: ${route.name}`);
      return cached;
    }

    const { origin, destination } = route;
    const locations = `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;

    const params = {
      key: process.env.TOMTOM_API_KEY,
      traffic: true,
      travelMode: 'car',
      routeType: 'fastest',
      computeTravelTimeFor: 'all', // inclui noTrafficTravelTimeInSeconds e trafficDelayInSeconds
      maxAlternatives: 2,
      language: 'pt-BR',
    };

    // Se a saída ainda está no futuro, usa tráfego previsto para o horário (departAt)
    const departAt = buildDepartAt(route.departureTime);
    if (departAt) params.departAt = departAt;

    const url = `${ROUTING_BASE}/${encodeURIComponent(locations)}/json`;
    const { data } = await axios.get(url, { params, timeout: 10000 });

    const result = parseRoutesResponse(data);
    await cacheService.set(cacheKey, result, 300); // TTL 5 min
    return result;
  },

  /**
   * URL da TomTom Static Map API para thumbnail do mapa (uso futuro em T08).
   * Usa a API Key do servidor — nunca exposta no app.
   */
  getStaticMapUrl(origin, destination) {
    // Enquadra os dois pontos com uma bounding box
    const minLng = Math.min(origin.lng, destination.lng);
    const minLat = Math.min(origin.lat, destination.lat);
    const maxLng = Math.max(origin.lng, destination.lng);
    const maxLat = Math.max(origin.lat, destination.lat);
    const params = new URLSearchParams({
      key: process.env.TOMTOM_API_KEY ?? '',
      bbox: `${minLng},${minLat},${maxLng},${maxLat}`,
      width: '400',
      height: '200',
      layer: 'basic',
      style: 'main',
    });
    return `${STATIC_MAP_URL}?${params}`;
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
    routes: data.routes.map((r, i) => {
      const s = r.summary ?? {};
      const withTraffic = s.travelTimeInSeconds ?? 0;
      // noTrafficTravelTimeInSeconds só vem com computeTravelTimeFor=all
      const withoutTraffic = s.noTrafficTravelTimeInSeconds ?? withTraffic;
      return {
        index: i,
        description: i === 0 ? 'Rota principal' : `Rota alternativa ${i}`,
        durationSeconds: withTraffic,
        staticDurationSeconds: withoutTraffic,
        distanceMeters: s.lengthInMeters ?? 0,
      };
    }),
  };
}

/**
 * Monta o parâmetro departAt (ISO 8601 com fuso BRT) para o horário de saída de hoje.
 * Retorna null se o horário já passou — nesse caso usa tráfego ao vivo.
 */
function buildDepartAt(departureTime) {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const now = new Date();
  // Horário de saída de hoje em UTC (BRT = UTC-3 → soma 3h)
  const depUtc = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    hours + 3, minutes, 0
  ));
  if (depUtc.getTime() <= now.getTime()) return null; // já passou → tráfego ao vivo
  return depUtc.toISOString();
}
