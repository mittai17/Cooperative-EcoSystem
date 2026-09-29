import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACE, TEXT, RADII } from '../constants/theme';
import { AppHeader } from './AppHeader';
import { Layers } from 'lucide-react-native';

interface FeatureStubScreenProps {
  title: string;
  subtitle?: string;
  category?: string;
  params?: Record<string, unknown>;
  tab?: boolean;
}

export const FeatureStubScreen: React.FC<FeatureStubScreenProps> = ({
  title,
  subtitle = 'Feature component under development',
  category = 'CoopSetu Module',
  params,
  tab = false,
}) => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container} edges={tab ? ['top'] : ['top', 'bottom']}>
      <AppHeader
        title={title}
        onBack={tab ? undefined : () => navigation.goBack()}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
          </View>
          <View style={styles.iconContainer}>
            <Layers size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {params && Object.keys(params).length > 0 ? (
            <View style={styles.paramsBox}>
              <Text style={styles.paramsHeading}>Active Route Parameters:</Text>
              {Object.entries(params).map(([key, val]) => (
                <Text key={key} style={styles.paramItem}>
                  <Text style={styles.paramKey}>{key}: </Text>
                  {String(val ?? 'none')}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACE.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    gap: SPACE.sm,
  },
  badge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    borderRadius: RADII.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADII.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACE.sm,
  },
  title: {
    ...TEXT.title,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  paramsBox: {
    marginTop: SPACE.md,
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: RADII.sm,
    padding: SPACE.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  paramsHeading: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    marginBottom: SPACE.xs,
  },
  paramItem: {
    ...TEXT.caption,
    fontFamily: 'monospace',
  },
  paramKey: {
    fontWeight: '700',
    color: COLORS.primary,
  },
});
