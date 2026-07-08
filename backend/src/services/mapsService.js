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
  async searchAddress(query, { lat, lon } = {}) {
    const params = {
      key: process.env.TOMTOM_API_KEY,
      countrySet: 'BR',
      limit: 6,
      language: 'pt-BR',
    };
    // Viés por localização: prioriza resultados próximos de onde o usuário está
    if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
      params.lat = lat;
      params.lon = lon;
    }

    const { data } = await axios.get(
      `${SEARCH_BASE}/${encodeURIComponent(query)}.json`,
      { params, timeout: 8000 }
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
    // Se o usuário escolheu um caminho específico, cronometra EXATAMENTE ele
    // (reconstrução via supportingPoints), em vez do "mais rápido" automático.
    if (Array.isArray(route.routePoints) && route.routePoints.length >= 2) {
      const rid = route.routeId ?? route.id;
      const [h, m] = route.departureTime.split(':').map(Number);
      const slot = Math.floor((h * 60 + m) / 5) * 5;
      const key = `traffic:path:${rid}:${slot}`;
      const cached = await cacheService.get(key);
      if (cached) { console.log(`[Maps] Cache hit (path): ${route.name}`); return cached; }
      const result = await this.getTrafficDataForPoints(route.routePoints, route.vehicleType);
      await cacheService.set(key, result, 300);
      return result;
    }

    const cacheKey = buildCacheKey(route);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Maps] Cache hit: ${route.name}`);
      return cached;
    }

    const { origin, destination } = route;
    const locations = `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
    const travelMode = route.vehicleType === 'motorcycle' ? 'motorcycle' : 'car';

    const params = {
      key: process.env.TOMTOM_API_KEY,
      traffic: true,
      travelMode,
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
   * Retorna os caminhos disponíveis (até 3) entre origem e destino, cada um com
   * sua geometria (pontos). Usado na tela de nova rota para o usuário ESCOLHER
   * qual caminho ele faz.
   */
  async getRouteOptions(origin, destination, vehicleType) {
    const travelMode = vehicleType === 'motorcycle' ? 'motorcycle' : 'car';
    const locations = `${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
    const { data } = await axios.get(`${ROUTING_BASE}/${encodeURIComponent(locations)}/json`, {
      params: {
        key: process.env.TOMTOM_API_KEY,
        traffic: true,
        travelMode,
        routeType: 'fastest',
        maxAlternatives: 2,          // até 3 rotas no total
        computeTravelTimeFor: 'all',
        routeRepresentation: 'polyline', // inclui a geometria (legs[].points)
        instructionsType: 'text',        // guidance p/ extrair as vias principais
        language: 'pt-BR',
      },
      timeout: 10000,
    });

    return (data.routes ?? []).map((r, i) => {
      const s = r.summary ?? {};
      const pts = (r.legs ?? [])
        .flatMap(l => l.points ?? [])
        .map(p => ({ lat: p.latitude, lng: p.longitude }));
      return {
        index: i,
        durationSeconds: s.travelTimeInSeconds ?? 0,
        staticDurationSeconds: s.noTrafficTravelTimeInSeconds ?? s.travelTimeInSeconds ?? 0,
        distanceMeters: s.lengthInMeters ?? 0,
        via: mainRoads(r),
        roads: orderedRoads(r),
        points: downsamplePoints(pts, 25),
      };
    });
  },

  /**
   * Reconstrói e cronometra um caminho específico (o escolhido pelo usuário),
   * passando seus pontos como supportingPoints — com tráfego em tempo real.
   */
  async getTrafficDataForPoints(points, vehicleType) {
    const travelMode = vehicleType === 'motorcycle' ? 'motorcycle' : 'car';
    const o = points[0];
    const d = points[points.length - 1];
    const locations = `${o.lat},${o.lng}:${d.lat},${d.lng}`;
    const body = { supportingPoints: points.map(p => ({ latitude: p.lat, longitude: p.lng })) };

    const { data } = await axios.post(`${ROUTING_BASE}/${encodeURIComponent(locations)}/json`, body, {
      params: {
        key: process.env.TOMTOM_API_KEY,
        traffic: true,
        travelMode,
        computeTravelTimeFor: 'all',
        routeRepresentation: 'summaryOnly',
      },
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    return parseRoutesResponse(data);
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

// Extrai as vias principais do trajeto (as que cobrem mais distância),
// para um rótulo tipo "via Marginal Pinheiros · Av. dos Bandeirantes".
function mainRoads(route) {
  const instr = route.guidance?.instructions ?? [];
  const total = route.summary?.lengthInMeters ?? 0;
  const meters = {};
  for (let i = 0; i < instr.length; i++) {
    const name = instr[i].roadNumbers?.[0] || instr[i].street;
    if (!name) continue;
    const start = instr[i].routeOffsetInMeters ?? 0;
    const end = instr[i + 1]?.routeOffsetInMeters ?? total;
    meters[name] = (meters[name] || 0) + Math.max(0, end - start);
  }
  const top = Object.entries(meters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);
  return top.length ? `via ${top.join(' · ')}` : '';
}

// Sequência (em ordem) das ruas por onde o trajeto passa, sem repetir consecutivas.
function orderedRoads(route) {
  const instr = route.guidance?.instructions ?? [];
  const seq = [];
  for (const it of instr) {
    const name = it.roadNumbers?.[0] || it.street;
    if (name && seq[seq.length - 1] !== name) seq.push(name);
  }
  return seq.slice(0, 12);
}

// Reduz a geometria a no máximo `max` pontos (mantém início/fim), para caber
// como supportingPoints na reconstrução sem estourar o limite da API.
function downsamplePoints(points, max = 25) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

function buildCacheKey(route) {
  // Arredonda lat/lng para 3 casas para agrupar rotas similares (P2)
  const oLat = Math.round((route.origin.lat ?? 0) * 1000) / 1000;
  const oLng = Math.round((route.origin.lng ?? 0) * 1000) / 1000;
  const dLat = Math.round((route.destination.lat ?? 0) * 1000) / 1000;
  const dLng = Math.round((route.destination.lng ?? 0) * 1000) / 1000;
  // Agrupa horários dentro de ±5 min (P2)
  const [h, m] = route.departureTime.split(':').map(Number);
  const slotMinutes = Math.floor((h * 60 + m) / 5) * 5;
  const mode = route.vehicleType === 'motorcycle' ? 'moto' : 'car';
  return `traffic:${mode}:${oLat},${oLng}:${dLat},${dLng}:${slotMinutes}`;
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
