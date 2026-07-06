import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/stores/authStore';
import { usersApi } from '../src/api/users';
import { getToken, setToken as persistToken, clearToken } from '../src/lib/session';
import { registerForPushNotificationsAsync } from '../src/utils/notifications';

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export default function RootLayout() {
  const { setSession, setToken, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    (async () => {
      // Modo dev: sessão automática via token de teste (backend em NODE_ENV != production)
      if (DEV_MODE) {
        setToken('test_user_dev');
        try {
          const user = await usersApi.upsert({ name: 'Dev User', email: 'dev@trafficguard.test' });
          setUser(user);
        } catch {
          setUser({ uid: 'user_dev', name: 'Dev User', email: 'dev@trafficguard.test', plan: 'free', routesCount: 0 });
        } finally {
          setLoading(false);
        }
        return;
      }

      // Restaura a sessão a partir do token salvo
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      setToken(token);
      try {
        const user = await usersApi.getMe();
        setSession(token, user);
        // Atualiza o push token no backend (best-effort)
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) usersApi.upsert({ pushToken }).catch(() => {});
      } catch {
        // Token inválido/expirado → limpa
        await clearToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
