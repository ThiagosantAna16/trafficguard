import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, View,
} from 'react-native';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// Flat rectangular buttons. No radius, no shadow/glow — a solid fill for
// primary actions, a hairline outline for secondary ones.
export function Button({
  label, onPress, variant = 'primary', loading, disabled, style, icon, size = 'md',
}: Props) {
  const isPrimary = variant === 'primary';
  const isDanger  = variant === 'danger';
  const isOutline = variant === 'outline';

  const textColor = isPrimary
    ? colors.textDark
    : isDanger
      ? colors.textPrimary
      : isOutline
        ? colors.textPrimary
        : colors.textSecondary;

  const heights: Record<string, number> = { sm: 44, md: 52, lg: 56 };

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
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={[styles.label, { color: textColor }, size === 'lg' && { fontSize: 15.5 }]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: { backgroundColor: colors.accent },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.red },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 14.5, fontFamily: fonts.sansSemiBold, letterSpacing: 0.2 },
});
