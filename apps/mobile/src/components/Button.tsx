import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, HIT, RADII, SPACE, TEXT } from '../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
}) => {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        inactive && (isPrimary ? styles.primaryDisabled : styles.secondaryDisabled),
      ]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? COLORS.textInverse : COLORS.primary} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: HIT + 4,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  primary: { backgroundColor: COLORS.primary },
  primaryDisabled: { backgroundColor: COLORS.primaryBorder },
  secondary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary },
  secondaryDisabled: { borderColor: COLORS.border },
  label: { ...TEXT.bodyStrong },
  labelPrimary: { color: COLORS.textInverse },
  labelSecondary: { color: COLORS.primary },
});
