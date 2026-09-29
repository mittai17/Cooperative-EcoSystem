import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BookOpen, Sprout, BarChart3, Milk, Landmark } from 'lucide-react-native';
import { COLORS, RADII } from '../constants/theme';

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  management: Landmark,
  technology: BarChart3,
  rural: Sprout,
  dairy: Milk,
};

interface CourseThumbProps {
  category: string;
  size?: number;
}

/** Category glyph tile (courses have no artwork). */
export const CourseThumb: React.FC<CourseThumbProps> = ({ category, size = 56 }) => {
  const Icon = CATEGORY_ICONS[category.toLowerCase()] ?? BookOpen;
  return (
    <View style={[styles.tile, { width: size, height: size }]}>
      <Icon size={24} color={COLORS.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySurface,
  },
});
