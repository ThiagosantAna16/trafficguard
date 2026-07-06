import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { HomeIcon, RouteIcon, BellIcon, PersonIcon } from '../../src/components/Icon';

export default function AppLayout() {
  const { token, isLoading } = useAuthStore();
  if (!isLoading && !token) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.darkBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10.5, fontFamily: fonts.sansMedium, letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => <HomeIcon color={color} size={focused ? 21 : 20} />,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rotas',
          tabBarIcon: ({ color, focused }) => <RouteIcon color={color} size={focused ? 21 : 20} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, focused }) => <BellIcon color={color} size={focused ? 21 : 20} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <PersonIcon color={color} size={focused ? 21 : 20} />,
        }}
      />
    </Tabs>
  );
}
