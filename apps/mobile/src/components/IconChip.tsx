import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADII } from '../constants/theme';

interface IconChipProps {
  children: React.ReactNode;
  size?: number;
  round?: boolean;
  tint?: string;
}

export const IconChip: React.FC<IconChipProps> = ({
  children,
  size = 40,
  round = false,
  tint = COLORS.primarySurface,
}) => (
  <View
    style={[
      styles.chip,
      {
        width: size,
        height: size,
        borderRadius: round ? size / 2 : RADII.md,
        backgroundColor: tint,
      },
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
