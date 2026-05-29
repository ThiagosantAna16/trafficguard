import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../../src/theme/colors';
import { alertsApi } from '../../../src/api/alerts';
import { Alert } from '../../../src/types';

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setAlerts(await alertsApi.list()); } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isHigh = (a: Alert) => a.delay >= 1800;
  const delayMin = (a: Alert) => Math.round(a.delay / 60);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alertas</Text>
          <Text style={styles.subtitle}>Últimos 7 dias  •  {alerts.length} alertas</Text>
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={a => a.alertId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>Tudo certo por aqui!</Text>
            <Text style={styles.emptyText}>Nenhum alerta nos últimos 7 dias. O trânsito está tranquilo nas suas rotas.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/alerts/${item.alertId}`)}
            activeOpacity={0.85}
          >
            <View style={styles.card}>
              {/* Left accent */}
              <View style={[
                styles.accent,
                { backgroundColor: isHigh(item) ? colors.red : colors.amber },
              ]} />

              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.emoji}>{isHigh(item) ? '🚨' : '⚠️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeName}>{item.routeName}</Text>
                    <Text style={styles.timeText}>
                      {dayjs(item.triggeredAt).format('DD/MM/YYYY  •  HH:mm')}
                    </Text>
                  </View>
                  <View style={[
                    styles.delayBadge,
                    { backgroundColor: isHigh(item) ? colors.redBg : colors.amberBg },
                  ]}>
                    <Text style={[
                      styles.delayText,
                      { color: isHigh(item) ? colors.red : colors.amber },
                    ]}>
                      +{delayMin(item)} min
                    </Text>
                  </View>
                </View>

                {item.alternatives.length > 0 && (
                  <View style={styles.altRow}>
                    <Text style={styles.altIcon}>↗️</Text>
                    <Text style={styles.altText} numberOfLines={1}>
                      {item.alternatives[0].description ?? 'Rota alternativa disponível'}
                    </Text>
                  </View>
                )}

                <View style={styles.severityRow}>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: isHigh(item) ? colors.redBg : colors.amberBg },
                  ]}>
                    <Text style={[
                      styles.severityText,
                      { color: isHigh(item) ? colors.red : colors.amber },
                    ]}>
                      {isHigh(item) ? 'Severo' : 'Moderado'}
                    </Text>
                  </View>
                  <Text style={styles.altCount}>
                    {item.alternatives.length} rota{item.alternatives.length !== 1 ? 's' : ''} alternativa{item.alternatives.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  accent: { width: 4, alignSelf: 'stretch' },
  cardContent: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 26 },
  routeName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  timeText: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  delayBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  delayText: { fontWeight: '800', fontSize: 14 },
  altRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  altIcon: { fontSize: 14 },
  altText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  severityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  severityText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  altCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
