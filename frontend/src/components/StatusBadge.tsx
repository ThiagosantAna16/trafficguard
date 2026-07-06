import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type Status = 'active' | 'paused' | 'alert' | 'checking';

const config: Record<Status, { label: string; color: string }> = {
  active:   { label: 'Ativo',         color: colors.green },
  paused:   { label: 'Pausado',       color: colors.textMuted },
  alert:    { label: 'Congestionado', color: colors.amber },
  checking: { label: 'Verificando',   color: colors.accent },
};

// Text label + small square tick — no pill, no filled background.
export function StatusBadge({ status }: { status: Status }) {
  const { label, color } = config[status];
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6 },
  text: { fontSize: 11, fontFamily: fonts.sansSemiBold, letterSpacing: 0.4 },
});
