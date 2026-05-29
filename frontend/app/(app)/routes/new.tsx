import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { routesApi } from '../../../src/api/routes';
import { Button } from '../../../src/components/Button';

const DAYS = [
  { label: 'D', value: 0 }, { label: 'S', value: 1 }, { label: 'T', value: 2 },
  { label: 'Q', value: 3 }, { label: 'Q', value: 4 }, { label: 'S', value: 5 }, { label: 'S', value: 6 },
];
const TOLERANCE_OPTIONS = [5, 10, 15, 20, 30];
const ADVANCE_OPTIONS = [15, 20, 30, 45, 60];

export default function NewRouteScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [originLat, setOriginLat] = useState('');
  const [originLng, setOriginLng] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLng, setDestLng] = useState('');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [alertTolerance, setAlertTolerance] = useState(10);
  const [alertAdvance, setAlertAdvance] = useState(30);

  const toggleDay = (d: number) =>
    setDaysOfWeek(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const handleSave = async () => {
    if (!name || !originAddress || !destAddress || !departureTime) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, endereços e horário de saída.');
      return;
    }
    if (daysOfWeek.length === 0) {
      Alert.alert('Atenção', 'Selecione ao menos um dia da semana.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(departureTime)) {
      Alert.alert('Horário inválido', 'Use o formato HH:MM, ex: 07:30');
      return;
    }

    setLoading(true);
    try {
      await routesApi.create({
        name,
        origin: {
          address: originAddress,
          lat: parseFloat(originLat) || -23.5505,
          lng: parseFloat(originLng) || -46.6333,
        },
        destination: {
          address: destAddress,
          lat: parseFloat(destLat) || -23.5615,
          lng: parseFloat(destLng) || -46.6560,
        },
        departureTime,
        daysOfWeek,
        alertTolerance,
        alertAdvance,
      });
      router.back();
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Não foi possível criar a rota.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  const focus = (f: string) => setFocusedField(f);
  const blur = () => setFocusedField(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Nova Rota</Text>
            <Text style={styles.subtitle}>Configure sua rota monitorada</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Section: Identificação */}
          <SectionHeader icon="🏷️" title="Identificação" />
          <View style={styles.section}>
            <FieldLabel>Nome da rota</FieldLabel>
            <TextInput
              style={inputStyle('name')}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Casa → Trabalho"
              placeholderTextColor={colors.textMuted}
              onFocus={() => focus('name')}
              onBlur={blur}
            />
          </View>

          {/* Section: Origem */}
          <SectionHeader icon="◉" title="Ponto de origem" color={colors.green} />
          <View style={styles.section}>
            <FieldLabel>Endereço de origem</FieldLabel>
            <TextInput
              style={inputStyle('originAddr')}
              value={originAddress}
              onChangeText={setOriginAddress}
              placeholder="Rua das Flores, 123 — São Paulo"
              placeholderTextColor={colors.textMuted}
              onFocus={() => focus('originAddr')}
              onBlur={blur}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Latitude</FieldLabel>
                <TextInput
                  style={inputStyle('originLat')}
                  value={originLat}
                  onChangeText={setOriginLat}
                  placeholder="-23.5505"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  onFocus={() => focus('originLat')}
                  onBlur={blur}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Longitude</FieldLabel>
                <TextInput
                  style={inputStyle('originLng')}
                  value={originLng}
                  onChangeText={setOriginLng}
                  placeholder="-46.6333"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  onFocus={() => focus('originLng')}
                  onBlur={blur}
                />
              </View>
            </View>
          </View>

          {/* Section: Destino */}
          <SectionHeader icon="▼" title="Ponto de destino" color={colors.primary} />
          <View style={styles.section}>
            <FieldLabel>Endereço de destino</FieldLabel>
            <TextInput
              style={inputStyle('destAddr')}
              value={destAddress}
              onChangeText={setDestAddress}
              placeholder="Av. Paulista, 1000 — São Paulo"
              placeholderTextColor={colors.textMuted}
              onFocus={() => focus('destAddr')}
              onBlur={blur}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Latitude</FieldLabel>
                <TextInput
                  style={inputStyle('destLat')}
                  value={destLat}
                  onChangeText={setDestLat}
                  placeholder="-23.5615"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  onFocus={() => focus('destLat')}
                  onBlur={blur}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Longitude</FieldLabel>
                <TextInput
                  style={inputStyle('destLng')}
                  value={destLng}
                  onChangeText={setDestLng}
                  placeholder="-46.6560"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  onFocus={() => focus('destLng')}
                  onBlur={blur}
                />
              </View>
            </View>
          </View>

          {/* Section: Horário */}
          <SectionHeader icon="🕐" title="Horário e dias" />
          <View style={styles.section}>
            <FieldLabel>Horário de saída</FieldLabel>
            <TextInput
              style={[inputStyle('time'), styles.timeInput]}
              value={departureTime}
              onChangeText={setDepartureTime}
              placeholder="08:00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              onFocus={() => focus('time')}
              onBlur={blur}
            />

            <FieldLabel>Dias da semana</FieldLabel>
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
          </View>

          {/* Section: Alertas */}
          <SectionHeader icon="🔔" title="Configuração de alertas" />
          <View style={styles.section}>
            <FieldLabel>Tolerância de atraso</FieldLabel>
            <Text style={styles.hint}>Notifica só se o atraso superar esse limite</Text>
            <View style={styles.chips}>
              {TOLERANCE_OPTIONS.map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, alertTolerance === v && styles.chipActive]}
                  onPress={() => setAlertTolerance(v)}
                >
                  <Text style={[styles.chipText, alertTolerance === v && styles.chipTextActive]}>
                    {v} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FieldLabel>Antecedência do aviso</FieldLabel>
            <Text style={styles.hint}>Quanto antes da saída você quer ser notificado</Text>
            <View style={styles.chips}>
              {ADVANCE_OPTIONS.map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, alertAdvance === v && styles.chipActive]}
                  onPress={() => setAlertAdvance(v)}
                >
                  <Text style={[styles.chipText, alertAdvance === v && styles.chipTextActive]}>
                    {v} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            label="Salvar rota"
            icon="✅"
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: 24, marginBottom: 8 }}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title, color }: { icon: string; title: string; color?: string }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.icon}>{icon}</Text>
      <Text style={[sectionStyles.title, color ? { color } : {}]}>{title}</Text>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={fieldStyles.label}>{children}</Text>;
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  icon: { fontSize: 16 },
  title: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
});

const fieldStyles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.primary, fontSize: 24, fontWeight: '700', lineHeight: 28 },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.borderMed,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  timeInput: { fontSize: 22, fontWeight: '700', textAlign: 'center', letterSpacing: 2 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 8, marginTop: -4 },
  daysRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginTop: 4 },
  dayBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dayBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  dayLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  dayLabelActive: { color: colors.textDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  chipText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: colors.textDark },
});
