import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { useAuthStore } from '../src/stores/authStore';
import { usersApi } from '../src/api/users';
import { registerForPushNotificationsAsync } from '../src/utils/notifications';

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export default function RootLayout() {
  const { setFirebaseUid, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    if (DEV_MODE) {
      // Bypass Firebase — auto-login como usuário de teste local
      setFirebaseUid('user_dev');
      usersApi
        .upsert({ name: 'Dev User', email: 'dev@trafficguard.test' })
        .then(user => setUser(user))
        .catch(() =>
          setUser({ uid: 'user_dev', name: 'Dev User', email: 'dev@trafficguard.test', plan: 'free', routesCount: 0 })
        )
        .finally(() => setLoading(false));
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid);
        try {
          const fcmToken = await registerForPushNotificationsAsync();
          const user = await usersApi.upsert({
            name: firebaseUser.displayName ?? 'Usuário',
            email: firebaseUser.email ?? '',
            fcmToken: fcmToken ?? undefined,
          });
          setUser(user);
        } catch {
          setUser(null);
        }
      } else {
        setFirebaseUid(null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
