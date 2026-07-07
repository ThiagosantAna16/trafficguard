import client from './client';

export const pushApi = {
  sendTest: () =>
    client.post<{ sent: boolean }>('/api/v1/push/test').then(r => r.data),
};
