import client from './client';
import { User } from '../types';

export const usersApi = {
  upsert: (data: { name: string; email: string; fcmToken?: string }) =>
    client.post<User>('/api/v1/users/me', data).then(r => r.data),

  getMe: () =>
    client.get<User>('/api/v1/users/me').then(r => r.data),

  deleteMe: () =>
    client.delete('/api/v1/users/me'),
};
