import client from './client';
import { Alert } from '../types';

export const alertsApi = {
  list: () =>
    client.get<Alert[]>('/api/v1/alerts').then(r => r.data),

  markOpened: (alertId: string) =>
    client.patch(`/api/v1/alerts/${alertId}/open`),
};
