import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConfigErrorScreen } from './src/screens/ConfigErrorScreen';
import { CLERK_PUBLISHABLE_KEY } from './src/constants/auth';
import { restoreLanguage } from './src/i18n';

export default function App() {
  useEffect(() => {
    void restoreLanguage();
  }, []);
  const keyValid = CLERK_PUBLISHABLE_KEY.startsWith('pk_');
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {keyValid ? (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
          <AppNavigator />
        </ClerkProvider>
      ) : (
        <ConfigErrorScreen
          title="Sign-in is not configured"
          message="This build has no Clerk publishable key, so it cannot start a session."
          hint="Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in apps/mobile/.env and restart Metro with a cleared cache."
        />
      )}
    </SafeAreaProvider>
  );
}
