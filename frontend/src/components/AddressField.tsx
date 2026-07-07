import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { geocodeApi, GeoResult, Coords } from '../api/geocode';
import { SearchIcon, CheckIcon } from './Icon';

// Localização atual do usuário (obtida uma vez), para priorizar endereços próximos.
// Compartilhada entre instâncias do campo (origem/destino) para não pedir 2x.
let cachedCoords: Coords | null = null;
let coordsPromise: Promise<Coords | null> | null = null;

async function getUserCoords(): Promise<Coords | null> {
  if (cachedCoords) return cachedCoords;
  if (coordsPromise) return coordsPromise;
  coordsPromise = (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getLastKnownPositionAsync()
        ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      if (!pos) return null;
      cachedCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      return cachedCoords;
    } catch {
      return null;
    }
  })();
  return coordsPromise;
}

interface Props {
  value: GeoResult | null;
  onSelect: (r: GeoResult) => void;
  placeholder?: string;
}

// Campo de endereço com busca real (TomTom via backend). Ao escolher um
// resultado, guarda address + lat/lng e mostra confirmação visual.
export function AddressField({ value, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(!value);
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coords = useRef<Coords | null>(cachedCoords);

  // Solicita a localização uma vez (para priorizar endereços próximos)
  useEffect(() => {
    getUserCoords().then(c => { coords.current = c; });
  }, []);

  const onChange = (text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 3) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try { setResults(await geocodeApi.search(text, coords.current)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
  };

  const pick = (r: GeoResult) => {
    onSelect(r);
    setQuery('');
    setResults([]);
    setEditing(false);
    setFocused(false);
  };

  // Estado confirmado: mostra o endereço escolhido + opção de alterar
  if (value && !editing) {
    return (
      <TouchableOpacity
        style={styles.selected}
        activeOpacity={0.7}
        onPress={() => { setEditing(true); setQuery(''); }}
      >
        <CheckIcon size={15} color={colors.green} />
        <Text style={styles.selectedText} numberOfLines={2}>{value.address}</Text>
        <Text style={styles.change}>alterar</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <SearchIcon size={15} color={colors.textMuted} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChange}
          placeholder={placeholder ?? 'Buscar endereço...'}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {loading && <ActivityIndicator size="small" color={colors.textMuted} />}
      </View>

      {results.map((r, i) => (
        <TouchableOpacity key={`${r.lat},${r.lng},${i}`} style={styles.result} onPress={() => pick(r)}>
          <Text style={styles.resultText} numberOfLines={2}>{r.address}</Text>
        </TouchableOpacity>
      ))}

      {query.trim().length >= 3 && !loading && results.length === 0 && (
        <Text style={styles.empty}>Nenhum endereço encontrado.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong, paddingBottom: 9,
  },
  inputWrapFocused: { borderBottomColor: colors.accent },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5, color: colors.textPrimary, padding: 0 },
  result: {
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: 11,
  },
  resultText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary },
  empty: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted, paddingVertical: 10 },
  selected: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 2, borderLeftColor: colors.green,
    padding: 12,
  },
  selectedText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: colors.textPrimary },
  change: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.4 },
});
