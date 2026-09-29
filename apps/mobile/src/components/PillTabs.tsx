import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, RADII, SPACE, TEXT } from '../constants/theme';

interface PillTabsProps<T extends string> {
  tabs: readonly { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  /** equal-width pills that fill the row (no scrolling) */
  fill?: boolean;
}

export function PillTabs<T extends string>({ tabs, active, onChange, fill = false }: PillTabsProps<T>) {
  const pills = tabs.map((tab) => {
    const isActive = tab.key === active;
    return (
      <TouchableOpacity
        key={tab.key}
        style={[styles.pill, fill && styles.pillFill, isActive && styles.pillActive]}
        onPress={() => onChange(tab.key)}
        activeOpacity={0.8}
        hitSlop={{ top: 4, bottom: 4 }}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
      >
        <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
      </TouchableOpacity>
    );
  });

  if (fill) {
    return <View style={styles.row}>{pills}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {pills}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  pill: {
    height: 36,
    paddingHorizontal: SPACE.md,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillFill: {
    flex: 1,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    ...TEXT.bodyStrong,
    color: COLORS.textSecondary,
  },
  labelActive: {
    color: COLORS.textInverse,
  },
});
