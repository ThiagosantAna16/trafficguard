import {
  useFonts,
  Piazzolla_500Medium,
  Piazzolla_600SemiBold,
  Piazzolla_700Bold,
} from '@expo-google-fonts/piazzolla';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
} from '@expo-google-fonts/archivo';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';

// Editorial pairing: serif display for titles/numbers, grotesk sans for body/UI,
// monospace for time/data figures. No system defaults (Helvetica/Roboto/Arial).
export const fonts = {
  serifMedium: 'Piazzolla_500Medium',
  serifSemiBold: 'Piazzolla_600SemiBold',
  serifBold: 'Piazzolla_700Bold',

  sans: 'Archivo_400Regular',
  sansMedium: 'Archivo_500Medium',
  sansSemiBold: 'Archivo_600SemiBold',
  sansBold: 'Archivo_700Bold',

  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

export function useAppFonts() {
  return useFonts({
    Piazzolla_500Medium,
    Piazzolla_600SemiBold,
    Piazzolla_700Bold,
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });
}
