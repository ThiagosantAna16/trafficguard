import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../../src/theme/colors';
import { routesApi } from '../../../src/api/routes';
import { Route, CheckResult } from '../../../src/types';
import { Card } from '../../../src/components/Card';
import { Button } from '../../../src/components/Button';
import { StatusBadge } from '../../../src/components/StatusBadge';

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
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary }}>Rota não encontrada.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.routeTitle} numberOfLines={1}>
            {route.emoji ?? '📍'}  {route.name}
          </Text>
          <StatusBadge status={route.isActive ? 'active' : 'paused'} />
        </View>
        <Switch
          value={route.isActive}
          onValueChange={handleToggle}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={route.isActive ? colors.textDark : '#fff'}
          ios_backgroundColor={colors.border}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Route path visual */}
        <View style={styles.pathCard}>
          <View style={styles.pathRow}>
            <View style={styles.pinOrigin}>
              <Text style={styles.pinText}>A</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pathLabel}>ORIGEM</Text>
              <Text style={styles.pathAddress}>{route.origin.address}</Text>
            </View>
          </View>
          <View style={styles.pathDivider}>
            <View style={styles.pathLine} />
            <Text style={styles.pathDistance}>↕</Text>
            <View style={styles.pathLine} />
          </View>
          <View style={styles.pathRow}>
            <View style={styles.pinDest}>
              <Text style={styles.pinText}>B</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pathLabel}>DESTINO</Text>
              <Text style={styles.pathAddress}>{route.destination.address}</Text>
            </View>
          </View>
        </View>

        {/* Schedule card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📅  Agendamento</Text>
          <View style={styles.infoGrid}>
            <InfoItem icon="🕐" label="Saída" value={route.departureTime} />
            <InfoItem icon="📆" label="Dias" value={route.daysOfWeek.map(d => DAYS[d]).join(', ')} />
            <InfoItem icon="⏰" label="Aviso antecipado" value={`${route.alertAdvance} min antes`} />
            <InfoItem icon="⚠️" label="Tolerância" value={`${route.alertTolerance} min de atraso`} />
          </View>
        </Card>

        {/* Stats card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📊  Estatísticas</Text>
          <View style={styles.infoGrid}>
            <InfoItem
              icon="🔍"
              label="Última verificação"
              value={route.lastCheckedAt ? dayjs(route.lastCheckedAt).format('DD/MM HH:mm') : 'Nunca'}
            />
            {route.baseTime != null && (
              <InfoItem
                icon="🛣️"
                label="Tempo base (sem tráfego)"
                value={`${Math.round(route.baseTime / 60)} min`}
              />
            )}
          </View>
        </Card>

        {/* Check result */}
        {checkResult && !checkResult.notified && (
          <Card variant="success" style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultEmoji}>
                {checkResult.reason === 'traffic_normal' ? '✅' : '📋'}
              </Text>
              <Text style={styles.resultText}>
                {checkResult.reason === 'traffic_normal'
                  ? `Trânsito normal! Atraso estimado: ${Math.round((checkResult.delaySeconds ?? 0) / 60)} min`
                  : checkResult.reason === 'quota_limit'
                    ? 'Quota diária da API atingida. Tente amanhã.'
                    : `Verificado — ${checkResult.reason}`
                }
              </Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <Button
          label={checking ? 'Verificando...' : 'Verificar agora'}
          icon={checking ? undefined : '🔍'}
          onPress={handleCheckNow}
          loading={checking}
          size="lg"
          style={{ marginTop: 8 }}
        />

        <Button
          label="Editar configurações"
          icon="✏️"
          onPress={() => router.push(`/(app)/routes/${rId(route)}/edit`)}
          variant="outline"
          style={{ marginTop: 12 }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  icon: { fontSize: 18, width: 24 },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  center: { flex: 1, backgroundColor: colors.darkBg, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
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
  routeTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  pathCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pinOrigin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDest: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: { color: colors.textDark, fontWeight: '800', fontSize: 14 },
  pathLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pathAddress: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginTop: 2 },
  pathDivider: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6, paddingLeft: 9 },
  pathLine: { flex: 1, height: 1.5, backgroundColor: colors.border },
  pathDistance: { color: colors.textMuted, fontSize: 14 },
  infoCard: { gap: 2 },
  infoCardTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  infoGrid: { gap: 0 },
  resultCard: { padding: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultEmoji: { fontSize: 28 },
  resultText: { flex: 1, color: colors.textPrimary, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
