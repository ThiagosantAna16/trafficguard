import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { fonts } from '../../../src/theme/typography';
import { routesApi, RouteOption } from '../../../src/api/routes';
import { GeoResult } from '../../../src/api/geocode';
import { Button } from '../../../src/components/Button';
import { AddressField } from '../../../src/components/AddressField';
import { RouteMap, ROUTE_COLORS } from '../../../src/components/RouteMap';
import { CheckIcon } from '../../../src/components/Icon';

const fmtKm = (m: number) => `${(m / 1000).toFixed(1).replace('.', ',')} km`;
const fmtMin = (s: number) => `~${Math.round(s / 60)} min`;

// Máscara HH:MM — os ":" são fixos; usuário digita só os dígitos
const maskTime = (text: string): string => {
  const d = text.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
};

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
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');

  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const reqId = useRef(0);

  // Ao ter origem + destino (ou trocar veículo), busca os caminhos disponíveis
  useEffect(() => {
    if (!origin || !destination) { setOptions([]); setSelectedIdx(null); return; }
    const id = ++reqId.current;
    setLoadingOptions(true);
    setOptions([]);
    setSelectedIdx(null);
    routesApi
      .getOptions({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        vehicleType,
      })
      .then(opts => {
        if (id !== reqId.current) return; // ignora respostas antigas
        setOptions(opts);
        if (opts.length) setSelectedIdx(0); // pré-seleciona o mais rápido
      })
      .catch(() => { if (id === reqId.current) setOptions([]); })
      .finally(() => { if (id === reqId.current) setLoadingOptions(false); });
  }, [origin, destination, vehicleType]);

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
    if (selectedIdx == null || !options[selectedIdx]) {
      Alert.alert('Escolha o caminho', 'Selecione qual caminho você faz para chegar ao destino.');
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
        vehicleType,
        routePoints: options[selectedIdx].points,
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

          <SectionHeader title="Veículo" />
          <FieldLabel>Como você faz esse trajeto</FieldLabel>
          <View style={styles.vehicleRow}>
            {([['car', 'Carro'], ['motorcycle', 'Moto']] as const).map(([val, lbl]) => (
              <TouchableOpacity
                key={val}
                style={[styles.vehicleBtn, vehicleType === val && styles.vehicleBtnActive]}
                onPress={() => setVehicleType(val)}
              >
                <Text style={[styles.vehicleText, vehicleType === val && styles.vehicleTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(origin && destination) && (
            <>
              <SectionHeader title="Caminho" />
              <FieldLabel>Qual caminho você faz até o destino</FieldLabel>
              {loadingOptions ? (
                <View style={styles.optionsLoading}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.optionsLoadingText}>Buscando caminhos disponíveis...</Text>
                </View>
              ) : options.length === 0 ? (
                <Text style={styles.optionsEmpty}>Nenhum caminho encontrado. Verifique os endereços.</Text>
              ) : (
                <>
                  <RouteMap routes={options} selectedIndex={selectedIdx} height={200} />
                  <Text style={styles.pathHint}>Toque no caminho que você faz — ele fica destacado no mapa.</Text>
                  {options.map((opt, i) => {
                    const active = selectedIdx === i;
                    const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.pathCard, active && styles.pathCardActive]}
                        onPress={() => setSelectedIdx(i)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.pathColorDot, { backgroundColor: color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pathTitle}>
                            Caminho {i + 1}{i === 0 ? ' · mais rápido' : ''}
                          </Text>
                          {!!opt.via && <Text style={styles.pathVia} numberOfLines={1}>{opt.via}</Text>}
                          <Text style={styles.pathMeta}>
                            {fmtMin(opt.durationSeconds)} com trânsito · {fmtKm(opt.distanceMeters)}
                          </Text>
                        </View>
                        <View style={[styles.pathRadio, active && styles.pathRadioActive]}>
                          {active && <View style={styles.pathRadioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </>
          )}

          <SectionHeader title="Horário de saída e dias" />
          <FieldLabel>Horário em que você sai do local de origem</FieldLabel>
          <TextInput
            style={[inputStyle('time'), styles.timeInput]} value={departureTime}
            onChangeText={t => setDepartureTime(maskTime(t))}
            placeholder="08:00" placeholderTextColor={colors.textMuted}
            keyboardType="number-pad" maxLength={5}
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
  vehicleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  vehicleBtn: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong },
  vehicleBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  vehicleText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textSecondary },
  vehicleTextActive: { color: colors.textDark },
  optionsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  optionsLoadingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },
  optionsEmpty: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted, paddingVertical: 10 },
  pathHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted, marginTop: 10, marginBottom: 12 },
  pathCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.borderStrong, padding: 14, marginBottom: 10,
  },
  pathCardActive: { borderColor: colors.accent, borderLeftWidth: 2 },
  pathColorDot: { width: 12, height: 12, borderRadius: 6 },
  pathRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  pathRadioActive: { borderColor: colors.accent },
  pathRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  pathTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
  pathVia: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pathMeta: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textMuted, marginTop: 3 },
});
