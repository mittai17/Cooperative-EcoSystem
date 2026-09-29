import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface ProgressBarProps {
  value: number; // 0-100
  height?: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, height = 4, color = COLORS.primary }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <View style={{ width: `${clamped}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
});
