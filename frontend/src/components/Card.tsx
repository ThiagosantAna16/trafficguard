import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'raised' | 'glow' | 'danger' | 'success' | 'warning';
}

export function Card({ children, style, variant = 'default' }: Props) {
  return (
    <View style={[
      styles.base,
      variant === 'raised'   && styles.raised,
      variant === 'glow'     && styles.glow,
      variant === 'danger'   && styles.danger,
      variant === 'success'  && styles.success,
      variant === 'warning'  && styles.warning,
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  raised: {
    backgroundColor: colors.surfaceRaised,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 9,
  },
  glow: {
    borderColor: colors.primaryBorder,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 7,
  },
  danger: {
    borderColor: colors.redBorder,
    backgroundColor: colors.surface,
  },
  success: {
    borderColor: colors.greenBorder,
    backgroundColor: colors.surface,
  },
  warning: {
    borderColor: colors.amberBorder,
    backgroundColor: colors.surface,
  },
});
