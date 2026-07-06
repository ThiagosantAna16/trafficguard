import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { fonts } from '../../../src/theme/typography';
import { routesApi } from '../../../src/api/routes';
import { GeoResult } from '../../../src/api/geocode';
import { Button } from '../../../src/components/Button';
import { AddressField } from '../../../src/components/AddressField';
import { CheckIcon } from '../../../src/components/Icon';

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
  const [origin, setOrigin] = useState<GeoResult | null>(null);
  const [destination, setDestination] = useState<GeoResult | null>(null);
  const [departureTime, setDepartureTime] = useState('08:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [alertTolerance, setAlertTolerance] = useState(10);
  const [alertAdvance, setAlertAdvance] = useState(30);

  const toggleDay = (d: number) =>
    setDaysOfWeek(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const handleSave = async () => {
    if (!name || !origin || !destination) {
      Alert.alert('Campos obrigatórios', 'Preencha o nome e busque os endereços de origem e destino.');
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
        origin,
        destination,
        departureTime,
        daysOfWeek,
        alertTolerance,
        alertAdvance,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error ?? 'Não foi possível criar a rota.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [styles.input, focusedField === field && styles.inputFocused];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

          <SectionHeader title="Identificação" />
          <FieldLabel>Nome da rota</FieldLabel>
          <TextInput
            style={inputStyle('name')} value={name} onChangeText={setName}
            placeholder="Ex: Casa → Trabalho" placeholderTextColor={colors.textMuted}
            onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
          />

          <SectionHeader title="Origem" />
          <FieldLabel>De onde você sai</FieldLabel>
          <AddressField value={origin} onSelect={setOrigin} placeholder="Buscar endereço de partida..." />

          <SectionHeader title="Destino" />
          <FieldLabel>Para onde você vai</FieldLabel>
          <AddressField value={destination} onSelect={setDestination} placeholder="Buscar endereço de destino..." />

          <SectionHeader title="Horário de saída e dias" />
          <FieldLabel>Horário em que você sai do local de origem</FieldLabel>
          <TextInput
            style={[inputStyle('time'), styles.timeInput]} value={departureTime} onChangeText={setDepartureTime}
            placeholder="08:00" placeholderTextColor={colors.textMuted}
            keyboardType="numbers-and-punctuation" maxLength={5}
            onFocus={() => setFocusedField('time')} onBlur={() => setFocusedField(null)}
          />
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayBtn, daysOfWeek.includes(d.value) && styles.dayBtnActive]}
                onPress={() => toggleDay(d.value)}
              >
                <Text style={[styles.dayLabel, daysOfWeek.includes(d.value) && styles.dayLabelActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionHeader title="Alertas" />
          <FieldLabel>Tolerância de atraso</FieldLabel>
          <View style={styles.optionsRow}>
            {TOLERANCE_OPTIONS.map(v => (
              <TouchableOpacity key={v} onPress={() => setAlertTolerance(v)}>
                <Text style={[styles.optionText, alertTolerance === v && styles.optionTextActive]}>{v} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldLabel>Antecedência do aviso</FieldLabel>
          <View style={styles.optionsRow}>
            {ADVANCE_OPTIONS.map(v => (
              <TouchableOpacity key={v} onPress={() => setAlertAdvance(v)}>
                <Text style={[styles.optionText, alertAdvance === v && styles.optionTextActive]}>{v} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Salvar rota"
            icon={<CheckIcon />}
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: 28, marginBottom: 8 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={sectionStyles.title}>{title}</Text>;
}
function FieldLabel({ children }: { children: string }) {
  return <Text style={fieldStyles.label}>{children}</Text>;
}

const sectionStyles = StyleSheet.create({
  title: {
    fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingBottom: 10, marginTop: 24, marginBottom: 12,
  },
});
const fieldStyles = StyleSheet.create({
  label: { fontFamily: fonts.sansMedium, color: colors.textMuted, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 22, lineHeight: 26 },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 19, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 },
  input: {
    borderBottomWidth: 1, borderBottomColor: colors.borderStrong,
    paddingBottom: 9, fontFamily: fonts.sans, fontSize: 14.5, color: colors.textPrimary,
  },
  inputFocused: { borderBottomColor: colors.accent },
  timeInput: { fontFamily: fonts.mono, fontSize: 24, textAlign: 'center', letterSpacing: 2 },
  daysRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginTop: 16 },
  dayBtn: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  dayBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayLabel: { fontFamily: fonts.sansSemiBold, color: colors.textSecondary, fontSize: 13 },
  dayLabelActive: { color: colors.textDark },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 16 },
  optionText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, paddingBottom: 2 },
  optionTextActive: { fontFamily: fonts.sansSemiBold, color: colors.textPrimary, borderBottomWidth: 1.5, borderBottomColor: colors.accent },
});
