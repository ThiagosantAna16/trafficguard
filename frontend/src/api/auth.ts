import client from './client';
import { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string; pushToken?: string }) =>
    client.post<AuthResponse>('/api/v1/auth/register', data).then(r => r.data),

  login: (data: { email: string; password: string; pushToken?: string }) =>
    client.post<AuthResponse>('/api/v1/auth/login', data).then(r => r.data),
};
