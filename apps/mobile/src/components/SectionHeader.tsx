import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, HIT, TEXT } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionLabel, onAction }) => (
  <View style={styles.row}>
    <Text style={styles.title} accessibilityRole="header">
      {title}
    </Text>
    {actionLabel && onAction ? (
      <TouchableOpacity
        onPress={onAction}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel}: ${title}`}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: HIT,
  },
  title: { ...TEXT.section },
  action: {
    minHeight: HIT,
    minWidth: HIT,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 0,
  },
  actionText: { ...TEXT.bodyStrong, color: COLORS.primary },
});
