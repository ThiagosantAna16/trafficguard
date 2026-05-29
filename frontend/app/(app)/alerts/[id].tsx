import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../../src/theme/colors';
import { alertsApi } from '../../../src/api/alerts';
import { Alert, AlertAlternative } from '../../../src/types';
import { Card } from '../../../src/components/Card';

function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m} min`;
}

function fmtKm(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alertsApi.list()
      .then(list => {
        const a = list.find(x => x.alertId === id);
        if (a) {
          setAlert(a);
          if (!a.openedByUser) alertsApi.markOpened(a.alertId).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  );

  if (!alert) return (
    <View style={styles.center}>
      <Text style={{ color: colors.textSecondary }}>Alerta não encontrado.</Text>
    </View>
  );

  const delayMin = Math.round(alert.delay / 60);
  const isHigh = alert.delay >= 1800;
  const accentColor = isHigh ? colors.red : colors.amber;
  const accentBg = isHigh ? colors.redBg : colors.amberBg;
  const accentBorder = isHigh ? colors.redBorder : colors.amberBorder;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{alert.routeName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Severity banner */}
        <View style={[styles.banner, { backgroundColor: accentBg, borderColor: accentBorder }]}>
          <Text style={styles.bannerEmoji}>{isHigh ? '🚨' : '⚠️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: accentColor }]}>
              {isHigh ? 'Congestionamento severo' : 'Trânsito acima do normal'}
            </Text>
            <Text style={styles.bannerSub}>
              +{delayMin} min em relação ao normal  •  {dayjs(alert.triggeredAt).format('DD/MM às HH:mm')}
            </Text>
          </View>
        </View>

        {/* Time comparison */}
        <Card style={styles.compareCard}>
          <Text style={styles.sectionLabel}>Comparativo de tempo</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{fmtSeconds(alert.baseTime)}</Text>
              <Text style={styles.timeSubLabel}>Sem tráfego</Text>
            </View>

            <View style={styles.arrowBlock}>
              <View style={[styles.arrowLine, { backgroundColor: accentColor }]} />
              <Text style={[styles.arrowText, { color: accentColor }]}>+{delayMin}min</Text>
              <View style={[styles.arrowLine, { backgroundColor: accentColor }]} />
            </View>

            <View style={styles.timeBlock}>
              <Text style={[styles.timeValue, { color: accentColor }]}>
                {fmtSeconds(alert.currentTime)}
              </Text>
              <Text style={styles.timeSubLabel}>Com tráfego</Text>
            </View>
          </View>
        </Card>

        {/* Alternatives */}
        {alert.alternatives.length > 0 && (
          <>
            <View style={styles.altHeader}>
              <Text style={styles.altTitle}>Rotas alternativas</Text>
              <Text style={styles.altCount}>{alert.alternatives.length} opção{alert.alternatives.length !== 1 ? 'ões' : ''}</Text>
            </View>
            {alert.alternatives.map((alt, i) => (
              <AlternativeCard key={i} alt={alt} index={i} />
            ))}
          </>
        )}

        {alert.alternatives.length === 0 && (
          <Card style={styles.noAltCard}>
            <Text style={styles.noAltIcon}>🗺️</Text>
            <Text style={styles.noAltText}>Nenhuma rota alternativa disponível neste momento.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AlternativeCard({ alt, index }: { alt: AlertAlternative; index: number }) {
  const rankColors = [colors.green, colors.primary, colors.amber];
  const c = rankColors[index] ?? colors.textSecondary;

  return (
    <View style={altStyles.card}>
      <View style={[altStyles.rankBadge, { backgroundColor: c + '22', borderColor: c + '55' }]}>
        <Text style={[altStyles.rankText, { color: c }]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={altStyles.description} numberOfLines={2}>
          {alt.description || 'Rota alternativa'}
        </Text>
        <View style={altStyles.meta}>
          <View style={altStyles.metaItem}>
            <Text style={altStyles.metaIcon}>⏱</Text>
            <Text style={altStyles.metaText}>{fmtSeconds(alt.duration)}</Text>
          </View>
          <View style={altStyles.metaItem}>
            <Text style={altStyles.metaIcon}>📏</Text>
            <Text style={altStyles.metaText}>{fmtKm(alt.distanceM)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const altStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexShrink: 0,
  },
  rankText: { fontWeight: '800', fontSize: 16 },
  description: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', lineHeight: 20 },
  meta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 14 },
  metaText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
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
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  bannerSub: { fontSize: 13, color: colors.textSecondary },
  compareCard: { gap: 16 },
  sectionLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  timeBlock: { alignItems: 'center', flex: 1 },
  timeValue: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  timeSubLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  arrowBlock: { alignItems: 'center', gap: 4 },
  arrowLine: { width: 20, height: 1.5, borderRadius: 1 },
  arrowText: { fontSize: 12, fontWeight: '800' },
  altHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  altTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  altCount: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  noAltCard: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  noAltIcon: { fontSize: 36 },
  noAltText: { color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22 },
});
