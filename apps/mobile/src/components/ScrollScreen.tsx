import React from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACE } from '../constants/theme';
import { AppHeader } from './AppHeader';

interface ScrollScreenProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  isLive?: boolean;
  rightAction?: React.ReactNode;
  brand?: boolean;
  /** rendered between the header and the scrolling body (search, tabs) */
  sticky?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** true for screens inside the bottom tab bar (which already handles the bottom inset) */
  tab?: boolean;
  /** lift the body above the keyboard (screens with text inputs in the body) */
  avoidKeyboard?: boolean;
  children: React.ReactNode;
}

const Body: React.FC<{ avoid: boolean; children: React.ReactNode }> = ({ avoid, children }) =>
  avoid ? (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  ) : (
    <>{children}</>
  );

/**
 * Shared screen shell: safe-area top, consistent header, optional sticky block,
 * scroll body with pull-to-refresh and gesture-bar-aware bottom padding.
 */
export const ScrollScreen: React.FC<ScrollScreenProps> = ({
  title,
  subtitle,
  onBack,
  isLive,
  rightAction,
  brand,
  sticky,
  refreshing,
  onRefresh,
  tab = false,
  avoidKeyboard = false,
  children,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        isLive={isLive}
        rightAction={rightAction}
        brand={brand}
      />
      {sticky ? <View style={styles.sticky}>{sticky}</View> : null}
      <Body avoid={avoidKeyboard}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: SPACE.md + (tab ? 0 : insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      </Body>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  sticky: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scroll: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SPACE.md, gap: SPACE.md },
});
