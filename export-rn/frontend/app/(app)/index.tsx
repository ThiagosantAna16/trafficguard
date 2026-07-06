import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { useAuthStore } from '../../src/stores/authStore';
import { routesApi } from '../../src/api/routes';
import { alertsApi } from '../../src/api/alerts';
import { Route, Alert } from '../../src/types';
import { BellIcon } from '../../src/components/Icon';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [recentAlert, setRecentAlert] = useState<Alert | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, a] = await Promise.all([routesApi.list(), alertsApi.list()]);
      setRoutes(r);
      setRecentAlert(a[0] ?? null);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const activeRoutes = routes.filter(r => r.isActive);
  const hour = dayjs().hour();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const rId = (r: Route) => r.routeId ?? r.id ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] ?? 'Usuário'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
        </View>

        {recentAlert && (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/alerts/${recentAlert.alertId}`)}
            activeOpacity={0.75}
          >
            <View style={[
              styles.alertBanner,
              { borderLeftColor: recentAlert.delay >= 1800 ? colors.red : colors.amber },
            ]}>
              <BellIcon size={20} color={recentAlert.delay >= 1800 ? colors.red : colors.amber} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertBannerTitle}>{recentAlert.routeName}</Text>
                <Text style={styles.alertBannerSub}>
                  +{Math.round(recentAlert.delay / 60)} min de atraso · {dayjs(recentAlert.triggeredAt).format('HH:mm')}
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <StatCard value={`${routes.length}/3`} label="Rotas" />
          <StatCard value={`${activeRoutes.length}`} label="Ativas" />
          <StatCard
            value={recentAlert ? dayjs(recentAlert.triggeredAt).format('HH:mm') : '--:--'}
            label="Último alerta"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rotas ativas</Text>
          {routes.length < 3 && (
            <TouchableOpacity onPress={() => router.push('/(app)/routes/new')}>
              <Text style={styles.addBtnText}>+ Nova rota</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeRoutes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma rota ativa</Text>
            <Text style={styles.emptyText}>Cadastre sua primeira rota e comece a monitorar o trânsito automaticamente.</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/routes')}>
              <Text style={styles.emptyBtnText}>Cadastrar rota →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          activeRoutes.map(route => (
            <TouchableOpacity
              key={rId(route)}
              onPress={() => router.push(`/(app)/routes/${rId(route)}`)}
              activeOpacity={0.75}
              style={styles.routeRow}
            >
              <View style={styles.routeCardHeader}>
                <Text style={styles.routeName}>{route.name}</Text>
                <View style={styles.activeTag}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>ATIVO</Text>
                </View>
              </View>
              <Text style={styles.routeAddress} numberOfLines={1}>{route.origin.address}</Text>
              <Text style={styles.routeAddress} numberOfLines={1}>{route.destination.address}</Text>
              <Text style={styles.routeMeta}>{route.departureTime} · aviso {route.alertAdvance} min antes</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  value: { fontFamily: fonts.mono, fontSize: 18, color: colors.textPrimary },
  label: { fontFamily: fonts.sansMedium, fontSize: 10.5, color: colors.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  scroll: { padding: 24, gap: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textSecondary },
  userName: { fontFamily: fonts.serifSemiBold, fontSize: 26, color: colors.textPrimary, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.serifSemiBold, color: colors.textPrimary, fontSize: 16 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 2,
    padding: 14,
  },
  alertBannerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },
  alertBannerSub: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  chevron: { fontSize: 16, color: colors.textMuted },
  statsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.textPrimary },
  addBtnText: { fontFamily: fonts.sansMedium, color: colors.accent, fontSize: 13 },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontFamily: fonts.serifSemiBold, fontSize: 17, color: colors.textPrimary },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtnText: { fontFamily: fonts.sansSemiBold, color: colors.accent, fontSize: 14, marginTop: 6 },
  routeRow: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 16, gap: 4 },
  routeCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  routeName: { fontFamily: fonts.sansSemiBold, fontSize: 15.5, color: colors.textPrimary },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 6, height: 6, backgroundColor: colors.green },
  activeText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.green, letterSpacing: 0.4 },
  routeAddress: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  routeMeta: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textMuted, marginTop: 6 },
});
