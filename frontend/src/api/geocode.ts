import client from './client';

export interface GeoResult {
  address: string;
  lat: number;
  lng: number;
}

export const geocodeApi = {
  search: (q: string) =>
    client.get<GeoResult[]>('/api/v1/geocode', { params: { q } }).then(r => r.data),
};
