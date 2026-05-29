import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { routesApi } from '../../src/api/routes';
import { alertsApi } from '../../src/api/alerts';
import { Route, Alert } from '../../src/types';
import { Card } from '../../src/components/Card';
import { StatusBadge } from '../../src/components/StatusBadge';

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
  const greetEmoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
  const rId = (r: Route) => r.routeId ?? r.id ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greetEmoji}  {greeting},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] ?? 'Usuário'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        </View>

        {/* Alert Banner */}
        {recentAlert && (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/alerts/${recentAlert.alertId}`)}
            activeOpacity={0.85}
          >
            <View style={[
              styles.alertBanner,
              { borderColor: recentAlert.delay >= 1800 ? colors.redBorder : colors.amberBorder },
            ]}>
              <Text style={styles.alertBannerEmoji}>
                {recentAlert.delay >= 1800 ? '🚨' : '⚠️'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertBannerTitle}>{recentAlert.routeName}</Text>
                <Text style={styles.alertBannerSub}>
                  +{Math.round(recentAlert.delay / 60)} min de atraso  •  {dayjs(recentAlert.triggeredAt).format('HH:mm')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard value={`${routes.length}/3`} label="Rotas" icon="🛣️" />
          <StatCard value={`${activeRoutes.length}`} label="Ativas" icon="✅" color={colors.green} />
          <StatCard
            value={recentAlert ? dayjs(recentAlert.triggeredAt).format('HH:mm') : '--:--'}
            label="Último alerta"
            icon="🔔"
            color={colors.amber}
          />
        </View>

        {/* Active routes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rotas ativas</Text>
          {routes.length < 3 && (
            <TouchableOpacity
              onPress={() => router.push('/(app)/routes/new')}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ Nova rota</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeRoutes.length === 0 ? (
          <Card variant="glow" style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Nenhuma rota ativa</Text>
            <Text style={styles.emptyText}>Cadastre sua primeira rota e comece a monitorar o trânsito automaticamente.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(app)/routes')}
            >
              <Text style={styles.emptyBtnText}>Cadastrar rota →</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          activeRoutes.map(route => (
            <TouchableOpacity
              key={rId(route)}
              onPress={() => router.push(`/(app)/routes/${rId(route)}`)}
              activeOpacity={0.85}
            >
              <Card style={styles.routeCard}>
                <View style={styles.routeCardAccent} />
                <View style={{ flex: 1 }}>
                  <View style={styles.routeCardHeader}>
                    <Text style={styles.routeName}>{route.emoji ?? '📍'} {route.name}</Text>
                    <StatusBadge status="active" />
                  </View>
                  <View style={styles.routePath}>
                    <Text style={styles.routeAddress} numberOfLines={1}>
                      ◉  {route.origin.address}
                    </Text>
                    <View style={styles.routeLine} />
                    <Text style={styles.routeAddress} numberOfLines={1}>
                      ▼  {route.destination.address}
                    </Text>
                  </View>
                  <Text style={styles.routeMeta}>
                    🕐 {route.departureTime}  •  ⏱ aviso {route.alertAdvance} min antes
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color?: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, color ? { color } : {}]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: { fontSize: 22, marginBottom: 2 },
  value: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  scroll: { padding: 20, gap: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  userName: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  alertBannerEmoji: { fontSize: 28 },
  alertBannerTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  alertBannerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  addBtn: {
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  emptyCard: { alignItems: 'center', padding: 28, gap: 8 },
  emptyIcon: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 8 },
  emptyBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  routeCard: { flexDirection: 'row', gap: 12, padding: 16 },
  routeCardAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.green,
    alignSelf: 'stretch',
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  routeName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  routePath: { gap: 4, marginBottom: 10 },
  routeLine: { width: 1.5, height: 10, backgroundColor: colors.border, marginLeft: 7 },
  routeAddress: { fontSize: 13, color: colors.textSecondary },
  routeMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
