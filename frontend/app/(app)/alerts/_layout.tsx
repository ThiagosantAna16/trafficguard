import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';

// Pilha da aba "Alertas": histórico → detalhe.
export default function AlertsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.darkBg },
      }}
    />
  );
}
