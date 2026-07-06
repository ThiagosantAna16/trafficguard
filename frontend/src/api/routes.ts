import client from './client';
import { Route, RouteLocation, CheckResult } from '../types';

export interface RoutePayload {
  name: string;
  emoji?: string;
  origin: RouteLocation;
  destination: RouteLocation;
  departureTime: string;
  daysOfWeek: number[];
  alertAdvance: number;
  alertTolerance: number;
  vehicleType?: 'car' | 'motorcycle';
}

export const routesApi = {
  list: () =>
    client.get<Route[]>('/api/v1/routes').then(r => r.data),

  create: (data: RoutePayload) =>
    client.post<Route>('/api/v1/routes', data).then(r => r.data),

  update: (routeId: string, data: Partial<RoutePayload>) =>
    client.put<Route>(`/api/v1/routes/${routeId}`, data).then(r => r.data),

  toggle: (routeId: string) =>
    client.patch<{ isActive: boolean }>(`/api/v1/routes/${routeId}/toggle`).then(r => r.data),

  delete: (routeId: string) =>
    client.delete(`/api/v1/routes/${routeId}`),

  checkNow: (routeId: string) =>
    client.post<CheckResult>(`/api/v1/routes/${routeId}/check`).then(r => r.data),
};
