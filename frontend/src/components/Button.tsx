import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, View,
} from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  label, onPress, variant = 'primary', loading, disabled, style, icon, size = 'md',
}: Props) {
  const isPrimary = variant === 'primary';
  const isDanger  = variant === 'danger';
  const isOutline = variant === 'outline';

  const textColor = isPrimary
    ? colors.textDark
    : isDanger
      ? '#fff'
      : isOutline
        ? colors.primary
        : colors.textSecondary;

  const heights: Record<string, number> = { sm: 42, md: 54, lg: 60 };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { height: heights[size] },
        isPrimary && styles.primary,
        isDanger  && styles.danger,
        isOutline && styles.outline,
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.label, { color: textColor }, size === 'lg' && { fontSize: 18 }]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  danger: {
    backgroundColor: colors.red,
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.45 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 20 },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
