import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../../src/theme/colors';
import { fonts } from '../../../src/theme/typography';
import { routesApi } from '../../../src/api/routes';
import { Route, CheckResult } from '../../../src/types';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { SearchIcon, EditIcon } from '../../../src/components/Icon';

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const rId = (r: Route) => r.routeId ?? r.id ?? '';

  useEffect(() => {
    routesApi.list()
      .then(routes => setRoute(routes.find(r => rId(r) === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async () => {
    if (!route) return;
    try {
      const { isActive } = await routesApi.toggle(rId(route));
      setRoute(r => r ? { ...r, isActive } : null);
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o status.');
    }
  };

  const handleCheckNow = async () => {
    if (!route) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const result = await routesApi.checkNow(rId(route));
      setCheckResult(result);
      if (result.notified && result.alertId) {
        router.push(`/(app)/alerts/${result.alertId}`);
      }
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error ?? 'Falha ao verificar rota.');
    } finally {
      setChecking(false);
    }
  };

  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>;
  }
  if (!route) {
    return <View style={styles.center}><Text style={{ color: colors.textSecondary, fontFamily: fonts.sans }}>Rota não encontrada.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.routeTitle} numberOfLines={1}>{route.name}</Text>
          <Text style={[styles.statusLabel, { color: route.isActive ? colors.green : colors.textMuted }]}>
            {route.isActive ? 'ATIVO' : 'PAUSADO'}
          </Text>
        </View>
        <Switch
          value={route.isActive}
          onValueChange={handleToggle}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={route.isActive ? colors.textDark : '#8B939C'}
          ios_backgroundColor={colors.border}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View>
          <View style={styles.pathRow}>
            <View style={[styles.pin, { borderColor: colors.green }]}><Text style={[styles.pinText, { color: colors.green }]}>A</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pathLabel}>ORIGEM</Text>
              <Text style={styles.pathAddress}>{route.origin.address}</Text>
            </View>
          </View>
          <View style={styles.pathDivider} />
          <View style={styles.pathRow}>
            <View style={[styles.pin, { borderColor: colors.accent }]}><Text style={[styles.pinText, { color: colors.accent }]}>B</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pathLabel}>DESTINO</Text>
              <Text style={styles.pathAddress}>{route.destination.address}</Text>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Agendamento</Text>
          <InfoRow label="Saída" value={route.departureTime} mono />
          <InfoRow label="Dias" value={route.daysOfWeek.map(d => DAYS[d]).join(', ')} />
          <InfoRow label="Aviso antecipado" value={`${route.alertAdvance} min antes`} />
          <InfoRow label="Tolerância" value={`${route.alertTolerance} min de atraso`} />
        </View>

        <View>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <InfoRow
            label="Última verificação"
            value={route.lastCheckedAt ? dayjs(route.lastCheckedAt).format('DD/MM HH:mm') : 'Nunca'}
          />
          {route.baseTime != null && (
            <InfoRow label="Tempo base (sem tráfego)" value={`${Math.round(route.baseTime / 60)} min`} />
          )}
        </View>

        {checkResult && !checkResult.notified && (
          <Card variant="success">
            <Text style={styles.resultText}>
              {checkResult.reason === 'traffic_normal'
                ? `Trânsito normal. Atraso estimado: ${Math.round((checkResult.delaySeconds ?? 0) / 60)} min.`
                : checkResult.reason === 'quota_limit'
                  ? 'Quota diária da API atingida. Tente amanhã.'
                  : `Verificado — ${checkResult.reason}`
              }
            </Text>
          </Card>
        )}

        <Button
          label={checking ? 'Verificando...' : 'Verificar agora'}
          icon={!checking ? <SearchIcon /> : undefined}
          onPress={handleCheckNow}
          loading={checking}
          size="lg"
          style={{ marginTop: 8 }}
        />
        <Button
          label="Editar configurações"
          icon={<EditIcon color={colors.textPrimary} />}
          onPress={() => router.push(`/(app)/routes/${rId(route)}/edit`)}
          variant="outline"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, mono && { fontFamily: fonts.mono }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary },
  value: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  center: { flex: 1, backgroundColor: colors.darkBg, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontSize: 22, lineHeight: 26 },
  routeTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.textPrimary },
  statusLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, letterSpacing: 0.4, marginTop: 3 },
  scroll: { padding: 24, gap: 28, paddingBottom: 40 },
  pathRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  pin: { width: 26, height: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pinText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  pathLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textMuted, letterSpacing: 0.6 },
  pathAddress: { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, marginTop: 3 },
  pathDivider: { width: 1, height: 20, backgroundColor: colors.borderStrong, marginLeft: 13, marginVertical: 4 },
  sectionTitle: {
    fontFamily: fonts.serifSemiBold, fontSize: 15, color: colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10, marginBottom: 8,
  },
  resultText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textPrimary, lineHeight: 20 },
});
