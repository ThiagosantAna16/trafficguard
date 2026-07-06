import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { colors } from '../../../src/theme/colors';
import { fonts } from '../../../src/theme/typography';
import { alertsApi } from '../../../src/api/alerts';
import { Alert, AlertAlternative } from '../../../src/types';

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

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.accent} size="large" /></View>;
  if (!alert) return <View style={styles.center}><Text style={{ color: colors.textSecondary, fontFamily: fonts.sans }}>Alerta não encontrado.</Text></View>;

  const delayMin = Math.round(alert.delay / 60);
  const isHigh = alert.delay >= 1800;
  const accentColor = isHigh ? colors.red : colors.amber;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{alert.routeName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.banner, { borderColor: accentColor + '66', borderLeftColor: accentColor }]}>
          <Text style={[styles.bannerTitle, { color: accentColor }]}>
            {isHigh ? 'Congestionamento severo' : 'Trânsito acima do normal'}
          </Text>
          <Text style={styles.bannerSub}>
            +{delayMin} min em relação ao normal · {dayjs(alert.triggeredAt).format('DD/MM às HH:mm')}
          </Text>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Comparativo de tempo</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeValue}>{fmtSeconds(alert.baseTime)}</Text>
              <Text style={styles.timeSubLabel}>Sem tráfego</Text>
            </View>
            <View style={styles.arrowBlock}>
              <View style={[styles.arrowLine, { backgroundColor: accentColor }]} />
              <Text style={[styles.arrowText, { color: accentColor }]}>+{delayMin}min</Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={[styles.timeValue, { color: accentColor }]}>{fmtSeconds(alert.currentTime)}</Text>
              <Text style={styles.timeSubLabel}>Com tráfego</Text>
            </View>
          </View>
        </View>

        {alert.alternatives.length > 0 ? (
          <View>
            <View style={styles.altHeader}>
              <Text style={styles.altTitle}>Rotas alternativas</Text>
              <Text style={styles.altCount}>{alert.alternatives.length} opção{alert.alternatives.length !== 1 ? 'ões' : ''}</Text>
            </View>
            <View style={{ gap: 16 }}>
              {alert.alternatives.map((alt, i) => <AlternativeRow key={i} alt={alt} index={i} />)}
            </View>
          </View>
        ) : (
          <Text style={styles.noAltText}>Nenhuma rota alternativa disponível neste momento.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AlternativeRow({ alt, index }: { alt: AlertAlternative; index: number }) {
  const rankColors = [colors.green, colors.accent, colors.amber];
  const c = rankColors[index] ?? colors.textSecondary;
  return (
    <View style={altStyles.row}>
      <View style={[altStyles.rankBadge, { borderColor: c }]}>
        <Text style={[altStyles.rankText, { color: c }]}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={altStyles.description} numberOfLines={2}>{alt.description || 'Rota alternativa'}</Text>
        <Text style={altStyles.meta}>{fmtSeconds(alt.duration)} · {fmtKm(alt.distanceM)}</Text>
      </View>
    </View>
  );
}

const altStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  rankBadge: { width: 26, height: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rankText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  description: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textPrimary, lineHeight: 20 },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
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
  title: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.textPrimary },
  scroll: { padding: 24, gap: 28, paddingBottom: 40 },
  banner: { borderWidth: 1, borderLeftWidth: 2, padding: 16, gap: 6 },
  bannerTitle: { fontFamily: fonts.serifSemiBold, fontSize: 16 },
  bannerSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary },
  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  timeBlock: { alignItems: 'center', flex: 1 },
  timeValue: { fontFamily: fonts.serifSemiBold, fontSize: 28, color: colors.textPrimary, letterSpacing: -0.5 },
  timeSubLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  arrowBlock: { alignItems: 'center', gap: 6, paddingHorizontal: 10, flex: 1 },
  arrowLine: { width: '100%', height: 1 },
  arrowText: { fontFamily: fonts.mono, fontSize: 11 },
  altHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  altTitle: { fontFamily: fonts.serifSemiBold, fontSize: 17, color: colors.textPrimary },
  altCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.textMuted },
  noAltText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingVertical: 16 },
});
