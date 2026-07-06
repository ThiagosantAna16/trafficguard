import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../../src/theme/colors';
import { fonts } from '../../../src/theme/typography';
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
        <Text style={styles.title}>Alertas</Text>
        <Text style={styles.subtitle}>Últimos 7 dias · {alerts.length} alertas</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={a => a.alertId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Tudo certo por aqui</Text>
            <Text style={styles.emptyText}>Nenhum alerta nos últimos 7 dias. O trânsito está tranquilo nas suas rotas.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/alerts/${item.alertId}`)}
            activeOpacity={0.8}
            style={[styles.row, { borderLeftColor: isHigh(item) ? colors.red : colors.amber }]}
          >
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeName}>{item.routeName}</Text>
                <Text style={styles.timeText}>{dayjs(item.triggeredAt).format('DD/MM · HH:mm')}</Text>
              </View>
              <Text style={[styles.delayText, { color: isHigh(item) ? colors.red : colors.amber }]}>
                +{delayMin(item)} min
              </Text>
            </View>

            {item.alternatives.length > 0 && (
              <Text style={styles.altText} numberOfLines={1}>
                {item.alternatives[0].description ?? 'Rota alternativa disponível'}
              </Text>
            )}

            <View style={styles.severityRow}>
              <Text style={[styles.severityText, { color: isHigh(item) ? colors.red : colors.amber }]}>
                {isHigh(item) ? 'SEVERO' : 'MODERADO'}
              </Text>
              <Text style={styles.altCount}>
                {item.alternatives.length} rota{item.alternatives.length !== 1 ? 's' : ''} alternativa{item.alternatives.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.darkBg },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 23, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  separator: { height: 1, backgroundColor: 'transparent', marginVertical: 11 },
  row: { borderLeftWidth: 2, paddingLeft: 14, paddingTop: 2, gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  routeName: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary },
  timeText: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  delayText: { fontFamily: fonts.serifSemiBold, fontSize: 21 },
  altText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary },
  severityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  severityText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, letterSpacing: 0.5 },
  altCount: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.textMuted },
  emptyWrap: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontFamily: fonts.serifSemiBold, fontSize: 19, color: colors.textPrimary },
  emptyText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
