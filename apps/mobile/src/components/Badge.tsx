import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, ICON, SPACE, TEXT } from '../constants/theme';
import { CheckCircle2 } from 'lucide-react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'neutral';
  /** shows a check icon (verified state) */
  verified?: boolean;
}

const VARIANTS = {
  primary: { bg: COLORS.primarySurface, text: COLORS.primary, border: COLORS.primaryBorder },
  success: { bg: COLORS.successSurface, text: COLORS.success, border: COLORS.successSurface },
  neutral: { bg: COLORS.badgeBg, text: COLORS.textSecondary, border: COLORS.badgeBorder },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', verified }) => {
  const c = VARIANTS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      {verified ? <CheckCircle2 size={ICON.sm} color={COLORS.success} /> : null}
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...TEXT.captionStrong,
  },
});
