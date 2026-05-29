import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { routesApi } from '../../../src/api/routes';
import { Route } from '../../../src/types';

export default function RoutesScreen() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setRoutes(await routesApi.list()); } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleToggle = async (route: Route) => {
    setToggling(route.routeId);
    try {
      const { isActive } = await routesApi.toggle(route.routeId);
      setRoutes(prev => prev.map(r => r.routeId === route.routeId ? { ...r, isActive } : r));
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o status da rota.');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = (route: Route) => {
    Alert.alert(
      'Excluir rota',
      `Deseja excluir "${route.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            try {
              await routesApi.delete(route.routeId);
              setRoutes(prev => prev.filter(r => r.routeId !== route.routeId));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a rota.');
            }
          },
        },
      ]
    );
  };

  const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const routeId = (r: Route) => r.routeId ?? r.id ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Minhas Rotas</Text>
          <Text style={styles.subtitle}>{routes.length}/3 rotas cadastradas</Text>
        </View>
        {routes.length < 3 && (
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={() => router.push('/(app)/routes/new')}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={routes}
        keyExtractor={r => routeId(r)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Nenhuma rota ainda</Text>
            <Text style={styles.emptyText}>Cadastre até 3 rotas para monitorar o trânsito automaticamente.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(app)/routes/new')}
            >
              <Text style={styles.emptyBtnText}>+ Cadastrar primeira rota</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/routes/${routeId(item)}`)}
            activeOpacity={0.85}
          >
            <View style={[styles.card, !item.isActive && styles.cardPaused]}>
              {/* Color accent bar */}
              <View style={[styles.accentBar, { backgroundColor: item.isActive ? colors.green : colors.textMuted }]} />

              <View style={styles.cardContent}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.emoji ?? '📍'}  {item.name}
                  </Text>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggle(item)}
                    disabled={toggling === routeId(item)}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={item.isActive ? colors.textDark : '#fff'}
                    ios_backgroundColor={colors.border}
                  />
                </View>

                {/* Route path */}
                <View style={styles.pathWrap}>
                  <View style={styles.pathRow}>
                    <View style={[styles.pathDot, { backgroundColor: colors.green }]} />
                    <Text style={styles.pathText} numberOfLines={1}>{item.origin.address}</Text>
                  </View>
                  <View style={styles.pathConnector} />
                  <View style={styles.pathRow}>
                    <View style={[styles.pathDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.pathText} numberOfLines={1}>{item.destination.address}</Text>
                  </View>
                </View>

                {/* Meta chips */}
                <View style={styles.chips}>
                  <Chip icon="🕐" label={item.departureTime} />
                  <Chip icon="📅" label={item.daysOfWeek.map(d => DAYS[d]).join('')} />
                  <Chip icon="⏱" label={`±${item.alertTolerance}min`} />
                </View>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteBtnText}>🗑  Excluir rota</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={chipStyles.wrap}>
      <Text style={chipStyles.icon}>{icon}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceBright,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 12 },
  label: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: colors.textDark, fontSize: 26, fontWeight: '700', lineHeight: 30 },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 14 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  cardPaused: { opacity: 0.55 },
  accentBar: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, padding: 16, gap: 12 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1, marginRight: 8 },
  pathWrap: { gap: 4 },
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pathDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  pathConnector: { width: 1.5, height: 10, backgroundColor: colors.border, marginLeft: 3 },
  pathText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deleteBtn: { alignSelf: 'flex-start' },
  deleteBtnText: { color: colors.red, fontSize: 13, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyBtnText: { color: colors.textDark, fontWeight: '700', fontSize: 15 },
});
