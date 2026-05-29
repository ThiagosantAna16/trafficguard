import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Status = 'active' | 'paused' | 'alert' | 'checking';

const config: Record<Status, { label: string; color: string; bg: string }> = {
  active:   { label: 'Ativo',         color: colors.green,         bg: colors.greenBg },
  paused:   { label: 'Pausado',       color: colors.textSecondary, bg: colors.border },
  alert:    { label: 'Congestionado', color: colors.amber,         bg: colors.amberBg },
  checking: { label: 'Verificando',   color: colors.primary,       bg: colors.primaryGlow },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, color, bg } = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '700' },
});
