import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { WifiOff } from 'lucide-react-native';
import { COLORS, SPACE, TEXT } from '../../constants/theme';

export interface ConnectivityBannerProps {
  customMessage?: string;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({ customMessage }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkConnectivity = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          const offline = !state.isConnected || state.isInternetReachable === false;
          setIsOffline(offline);
        }
      } catch {
        if (mounted) {
          setIsOffline(false);
        }
      }
    };

    void checkConnectivity();

    // Check periodically every 5 seconds
    const interval = setInterval(() => {
      void checkConnectivity();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <WifiOff size={16} color={COLORS.textInverse} style={styles.icon} />
      <Text style={styles.bannerText}>
        {customMessage ??
          'Offline mode active. Your attendance scans and inputs are saved locally and will auto-sync when connected.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#B91C1C', // High visibility warning dark red
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    gap: SPACE.sm,
    zIndex: 999,
  },
  icon: {
    marginTop: 1,
  },
  bannerText: {
    ...TEXT.caption,
    color: COLORS.textInverse,
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default ConnectivityBanner;
