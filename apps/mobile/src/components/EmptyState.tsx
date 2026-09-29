import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, HIT, SPACE, TEXT } from '../constants/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionLabel, onAction }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {actionLabel && onAction ? (
      <TouchableOpacity
        style={styles.action}
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const LoadingState: React.FC = () => (
  <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Loading">
    <ActivityIndicator color={COLORS.primary} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACE.xl + SPACE.md,
    paddingHorizontal: SPACE.md,
    gap: SPACE.xs,
  },
  title: { ...TEXT.bodyStrong, textAlign: 'center' },
  message: { ...TEXT.caption, textAlign: 'center' },
  action: {
    minHeight: HIT,
    paddingHorizontal: SPACE.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { ...TEXT.bodyStrong, color: COLORS.primary },
});
