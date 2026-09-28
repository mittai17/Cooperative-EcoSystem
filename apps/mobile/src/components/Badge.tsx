import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  verified?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', verified }) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: COLORS.primarySurface, text: COLORS.primary, border: COLORS.primaryLight };
      case 'success':
        return { bg: COLORS.successSurface, text: COLORS.success, border: COLORS.success };
      case 'warning':
        return { bg: COLORS.warningSurface, text: COLORS.warning, border: COLORS.warning };
      case 'danger':
        return { bg: COLORS.dangerSurface, text: COLORS.danger, border: COLORS.danger };
      default:
        return { bg: COLORS.badgeBg, text: COLORS.textSecondary, border: COLORS.badgeBorder };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      {verified !== undefined && (
        verified ? (
          <CheckCircle2 size={12} color={COLORS.success} style={styles.icon} />
        ) : (
          <AlertCircle size={12} color={COLORS.warning} style={styles.icon} />
        )
      )}
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
