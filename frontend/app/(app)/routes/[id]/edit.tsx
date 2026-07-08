import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { routesApi } from '../../../../src/api/routes';
import { Route } from '../../../../src/types';
import { Button } from '../../../../src/components/Button';

const DAYS = [
  { label: 'D', value: 0 }, { label: 'S', value: 1 }, { label: 'T', value: 2 },
  { label: 'Q', value: 3 }, { label: 'Q', value: 4 }, { label: 'S', value: 5 }, { label: 'S', value: 6 },
];
const TOLERANCE_OPTIONS = [5, 10, 15, 20, 30];
const ADVANCE_OPTIONS = [15, 20, 30, 45, 60];

// Máscara HH:MM — os ":" são fixos; usuário digita só os dígitos
const maskTime = (text: string): string => {
  const d = text.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
};

export default function EditRouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);

  const [name, setName] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [alertTolerance, setAlertTolerance] = useState(10);
  const [alertAdvance, setAlertAdvance] = useState(30);

  useEffect(() => {
    routesApi.list().then(routes => {
      const r = routes.find(x => x.routeId === id);
      if (r) {
        setRoute(r);
        setName(r.name);
        setDepartureTime(r.departureTime);
        setDaysOfWeek(r.daysOfWeek);
        setAlertTolerance(r.alertTolerance);
        setAlertAdvance(r.alertAdvance);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const toggleDay = (d: number) =>
    setDaysOfWeek(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const handleSave = async () => {
    if (!route) return;
    if (daysOfWeek.length === 0) { Alert.alert('Selecione ao menos um dia.'); return; }
    setSaving(true);
    try {
      await routesApi.update(route.routeId, { name, departureTime, daysOfWeek, alertTolerance, alertAdvance });
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error ?? 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Editar Rota</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Label>Nome da rota</Label>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />

          <Label>Horário de saída (HH:MM)</Label>
          <TextInput
            style={styles.input}
            value={departureTime}
            onChangeText={t => setDepartureTime(maskTime(t))}
            keyboardType="number-pad"
            maxLength={5}
            placeholderTextColor={colors.textMuted}
          />

          <Label>Dias da semana</Label>
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayBtn, daysOfWeek.includes(d.value) && styles.dayBtnActive]}
                onPress={() => toggleDay(d.value)}
              >
                <Text style={[styles.dayLabel, daysOfWeek.includes(d.value) && styles.dayLabelActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label>Tolerância de atraso</Label>
          <View style={styles.chips}>
            {TOLERANCE_OPTIONS.map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, alertTolerance === v && styles.chipActive]}
                onPress={() => setAlertTolerance(v)}
              >
                <Text style={[styles.chipText, alertTolerance === v && styles.chipTextActive]}>{v} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label>Antecedência do aviso</Label>
          <View style={styles.chips}>
            {ADVANCE_OPTIONS.map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, alertAdvance === v && styles.chipActive]}
                onPress={() => setAlertAdvance(v)}
              >
                <Text style={[styles.chipText, alertAdvance === v && styles.chipTextActive]}>{v} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button label="Salvar alterações" onPress={handleSave} loading={saving} style={{ marginTop: 24 }} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16 }}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  center: { flex: 1, backgroundColor: colors.darkBg, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingBottom: 8 },
  back: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, height: 52,
    paddingHorizontal: 16, fontSize: 15, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  dayBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  dayLabelActive: { color: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
});
