import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';

// Pilha da aba "Rotas": lista → detalhe → nova → editar.
// Sem este layout, cada arquivo viraria uma aba solta no menu inferior.
export default function RoutesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.darkBg },
      }}
    />
  );
}
