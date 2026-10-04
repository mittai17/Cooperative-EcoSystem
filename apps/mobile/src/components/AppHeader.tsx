import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, HIT, ICON, RADII, SPACE, TEXT } from '../constants/theme';
import { ArrowLeft, WifiOff } from 'lucide-react-native';
import { NurvexLogo } from './NurvexLogo';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** false shows the offline indicator (the server could not be reached) */
  isLive?: boolean;
  rightAction?: React.ReactNode;
  brand?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  isLive = true,
  rightAction,
  brand = false,
}) => (
  <View style={styles.container}>
    <View style={styles.titleArea}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconBtn}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={ICON.lg} color={COLORS.primaryDark} />
        </TouchableOpacity>
      ) : null}
      {brand ? <NurvexLogo size="sm" /> : null}
      <View style={styles.titleText}>
        {!brand ? <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{title}</Text> : null}
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>

    <View style={styles.rightArea}>
      {!isLive && (
        <View style={styles.offlineBadge} accessibilityLabel="Offline. Could not reach the server.">
          <WifiOff size={ICON.sm} color={COLORS.textSecondary} />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}
      {rightAction}
    </View>
  </View>
);

/** 44dp icon button for header right slot. */
export const HeaderIconButton: React.FC<{
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ onPress, label, children }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.iconBtn}
    activeOpacity={0.6}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACE.md,
    minHeight: 56,
    paddingVertical: SPACE.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    flex: 1,
  },
  iconBtn: {
    width: HIT,
    height: HIT,
    marginLeft: -SPACE.sm - SPACE.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    flexShrink: 1,
  },
  title: {
    ...TEXT.title,
  },
  subtitle: {
    ...TEXT.caption,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingHorizontal: SPACE.sm,
    height: 28,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.badgeBg,
  },
  offlineText: {
    ...TEXT.captionStrong,
  },
});
