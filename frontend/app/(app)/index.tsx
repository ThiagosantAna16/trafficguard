import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';
import { routesApi } from '../../src/api/routes';
import { Route } from '../../src/types';

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

  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const routeId = (r: Route) => r.routeId ?? r.id ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Minhas Rotas</Text>
          <Text style={styles.subtitle}>{routes.length}/3 rotas cadastradas</Text>
        </View>
        {routes.length < 3 && (
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(app)/routes/new')}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={routes}
        keyExtractor={r => routeId(r)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Nenhuma rota ainda</Text>
            <Text style={styles.emptyText}>Cadastre até 3 rotas para monitorar o trânsito automaticamente.</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/routes/new')}>
              <Text style={styles.emptyBtnText}>+ Cadastrar primeira rota</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/routes/${routeId(item)}`)}
            activeOpacity={0.8}
            style={[styles.row, !item.isActive && styles.rowPaused]}
          >
            <View style={styles.rowHeader}>
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
              <Switch
                value={item.isActive}
                onValueChange={() => handleToggle(item)}
                disabled={toggling === routeId(item)}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor={item.isActive ? colors.textDark : '#8B939C'}
                ios_backgroundColor={colors.border}
              />
            </View>
            <Text style={styles.pathText} numberOfLines={1}>{item.origin.address}</Text>
            <Text style={styles.pathText} numberOfLines={1}>{item.destination.address}</Text>
            <Text style={styles.metaText}>
              {item.departureTime} · {item.daysOfWeek.map(d => DAYS[d].slice(0, 3)).join(' ')} · ±{item.alertTolerance}min
            </Text>
            <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.deleteText}>Excluir rota</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20,
  },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 23, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  addBtn: { width: 36, height: 36, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 18, color: colors.textPrimary },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  row: { gap: 10 },
  rowPaused: { opacity: 0.5 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowName: { fontFamily: fonts.sansSemiBold, fontSize: 15.5, color: colors.textPrimary, flex: 1, marginRight: 8 },
  pathText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  metaText: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textMuted },
  deleteText: { fontFamily: fonts.sansMedium, color: colors.red, fontSize: 12.5, marginTop: 4 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.textPrimary },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
  emptyBtnText: { fontFamily: fonts.sansSemiBold, color: colors.accent, fontSize: 14, marginTop: 10 },
});
