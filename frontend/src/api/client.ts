import axios from 'axios';
import { getToken } from '../lib/session';

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  if (DEV_MODE) {
    // Backend aceita "test_<uid>" sem verificação JWT fora de produção
    config.headers.Authorization = 'Bearer test_user_dev';
    return config;
  }
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
