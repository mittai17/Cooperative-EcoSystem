import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ConfigErrorScreen } from './src/screens/ConfigErrorScreen';
import { CLERK_PUBLISHABLE_KEY } from './src/constants/auth';
import { restoreLanguage } from './src/i18n';
import { API_CONFIGURED } from './src/services/api';

export default function App() {
  useEffect(() => {
    void restoreLanguage();
  }, []);
  const keyValid = CLERK_PUBLISHABLE_KEY.startsWith('pk_');
  const configValid = keyValid && API_CONFIGURED;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {configValid ? (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
          <AppNavigator />
        </ClerkProvider>
      ) : (
        <ConfigErrorScreen
          title={keyValid ? 'Backend is not configured' : 'Sign-in is not configured'}
          message={keyValid ? 'This production build has no cloud API URL, so it cannot connect to the CoopSetu backend.' : 'This build has no Clerk publishable key, so it cannot start a session.'}
          hint={keyValid ? 'Set EXPO_PUBLIC_API_BASE_URL to the deployed HTTPS API origin before building the APK.' : 'Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in the build environment before building the APK.'}
        />
      )}
    </SafeAreaProvider>
  );
}
