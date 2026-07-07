import client from './client';

export interface GeoResult {
  address: string;
  lat: number;
  lng: number;
}

export interface Coords {
  lat: number;
  lon: number;
}

export const geocodeApi = {
  search: (q: string, coords?: Coords | null) =>
    client
      .get<GeoResult[]>('/api/v1/geocode', {
        params: { q, ...(coords ? { lat: coords.lat, lon: coords.lon } : {}) },
      })
      .then(r => r.data),
};
