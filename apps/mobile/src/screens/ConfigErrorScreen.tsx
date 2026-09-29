import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS, ICON, RADII, SPACE, TEXT } from '../constants/theme';

/** Shown instead of the app when required build-time configuration is missing. */
export const ConfigErrorScreen = ({ title, message, hint }: { title: string; message: string; hint?: string }) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.body}>
      <View style={styles.icon}>
        <AlertTriangle size={ICON.lg} color={COLORS.danger} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.lg, gap: SPACE.sm },
  icon: {
    width: 48,
    height: 48,
    borderRadius: RADII.md,
    backgroundColor: COLORS.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...TEXT.title, textAlign: 'center' },
  message: { ...TEXT.body, color: COLORS.textSecondary, textAlign: 'center' },
  hint: {
    ...TEXT.caption,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.sm,
    padding: SPACE.sm,
    overflow: 'hidden',
  },
});
