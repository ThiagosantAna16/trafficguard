import axios from 'axios';
import { auth } from '../config/firebase';

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  if (DEV_MODE) {
    // Backend aceita "test_<uid>" sem verificação Firebase no modo USE_SQLITE=true
    config.headers.Authorization = 'Bearer test_user_dev';
    return config;
  }
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
