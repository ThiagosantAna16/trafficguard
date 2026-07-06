import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

// Flat, bordered block — no background elevation, no shadow, no glow.
// Semantic variants are expressed with a left rule only, matching the
// alert/banner treatment used across the app.
export function Card({ children, style, variant = 'default' }: Props) {
  return (
    <View style={[
      styles.base,
      variant === 'danger'  && styles.danger,
      variant === 'success' && styles.success,
      variant === 'warning' && styles.warning,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  danger:  { borderLeftWidth: 2, borderLeftColor: colors.red },
  success: { borderLeftWidth: 2, borderLeftColor: colors.green },
  warning: { borderLeftWidth: 2, borderLeftColor: colors.amber },
});
