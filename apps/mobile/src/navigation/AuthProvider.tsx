import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import { COLORS, SPACE, TEXT } from '../constants/theme';
import { isSupportedRole, SUPPORTED_ROLES } from '../constants/auth';
import { ApiError, authApi, configureAuthClient, MeResponse } from '../services/api';
import { configureAuthClient as configureApiClientAuth } from '../api/client';
import { localStore } from '../services/localStore';
import { AuthUser } from '../types';
import { Button } from '../components/Button';
import { queryClient } from '../api/queryClient';
import { AuthContext } from './AuthContext';
import { getDemoProfileByRole } from '../constants/demoProfiles';

/** Outcome of resolving the local identity for one Clerk user (tagged so a stale result is never shown for another user). */
type Resolution = { clerkUserId: string; user: AuthUser } | { clerkUserId: string; error: string };

const toAuthUser = (me: MeResponse): AuthUser => ({
  id: me.id ?? '',
  clerkUserId: me.clerk_user_id,
  email: me.email ?? '',
  fullName: me.full_name ?? '',
  role: me.role,
  organisation: me.organisation ?? null,
  trainee: me.trainee ?? null,
});

/** GET /auth/me; when the Clerk user has no local row yet, provision it and read again. */
async function resolveIdentity(): Promise<AuthUser> {
  let me = await authApi.me();
  if (!me.synced) {
    await authApi.provision();
    me = await authApi.me();
    if (!me.synced) throw new Error('Your account could not be linked to a local profile.');
  }
  return toAuthUser(me);
}

/** Resolves the identity for one Clerk user; null means a 401 (the API client already signed the user out). */
async function resolveFor(clerkUserId: string): Promise<Resolution | null> {
  try {
    return { clerkUserId, user: await resolveIdentity() };
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    console.warn('Identity resolution failed', e);
    return { clerkUserId, error: describeError(e) };
  }
}

const describeError = (e: unknown): string => {
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Your session was rejected by the server. Sign in again.';
    return e.message;
  }
  if (e instanceof Error && e.name === 'AbortError') return 'The server took too long to answer.';
  if (e instanceof TypeError) return 'Could not reach the server. Check your connection.';
  return e instanceof Error ? e.message : 'Could not load your account.';
};

const FullScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.full}>{children}</View>
);

/**
 * Bridges Clerk and Demo Auth to the app: wires the API client to the session token,
 * resolves the local identity after sign-in and exposes it via AuthContext.
 * In demo mode, bypasses Clerk completely and resolves directly using rich demo profiles.
 */
export const AuthProvider: React.FC<{
  renderSignedOut: () => React.ReactNode;
  renderSignedIn: () => React.ReactNode;
}> = ({ renderSignedOut, renderSignedIn }) => {
  const { isLoaded, isSignedIn, userId, getToken, signOut: clerkSignOut } = useAuth();
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [demoUser, setDemoUser] = useState<AuthUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const signingOut = useRef(false);

  const signOut = useCallback(
    async (message?: string) => {
      if (signingOut.current) return;
      signingOut.current = true;
      try {
        localStore.reset();
        queryClient.clear();
        setResolution(null);
        setDemoUser(null);
        setNotice(message ?? null);
        if (isSignedIn) {
          await clerkSignOut();
        }
      } catch (e) {
        console.warn('SignOut failed', e);
        setNotice('Sign out did not complete. Try again.');
      } finally {
        signingOut.current = false;
      }
    },
    [clerkSignOut, isSignedIn]
  );

  const setDemoRole = useCallback((role: string) => {
    const config = getDemoProfileByRole(role);
    if (!config) {
      console.warn(`[AuthProvider] Unknown demo role requested: "${role}"`);
      return;
    }
    // Set synthetic auth config for demo mode so api calls don't reject on missing token
    const demoAuthConfig = {
      getToken: async () => 'demo-bearer-token',
      onUnauthorized: () => {},
    };
    configureAuthClient(demoAuthConfig);
    configureApiClientAuth(demoAuthConfig);

    localStore.reset();
    queryClient.clear();
    setResolution(null);
    setNotice(null);
    setDemoUser(config.user);
  }, []);

  const switchDemoRole = useCallback((role: string) => {
    setDemoRole(role);
  }, [setDemoRole]);

  // Keep the API client pointed at the live Clerk session when not in demo mode.
  useEffect(() => {
    if (demoUser) return;
    const authConfig = {
      getToken: (options?: { skipCache?: boolean }) => getToken(options),
      onUnauthorized: () => {
        void signOut('Your session expired. Sign in again.');
      },
    };
    configureAuthClient(authConfig);
    configureApiClientAuth(authConfig);
    return () => {
      if (!demoUser) {
        configureAuthClient({ getToken: null, onUnauthorized: null });
        configureApiClientAuth({ getToken: null, onUnauthorized: null });
      }
    };
  }, [getToken, signOut, demoUser]);

  // Any regular Clerk sign-in method lands here: resolve the local identity once per session.
  useEffect(() => {
    if (demoUser || !isLoaded || !isSignedIn || !userId) return;
    let cancelled = false;
    void resolveFor(userId).then((r) => {
      if (!cancelled && r) setResolution(r);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, demoUser]);

  const current = userId && resolution?.clerkUserId === userId ? resolution : null;
  const clerkUser = current && 'user' in current ? current.user : null;
  const activeUser = demoUser ?? clerkUser;
  const activeRole = activeUser?.role ?? null;
  const isDemo = Boolean(demoUser);
  const errorMessage = current && 'error' in current ? current.error : '';

  const refresh = useCallback(async () => {
    if (demoUser) return;
    if (!userId) return;
    const r = await resolveFor(userId);
    if (r) setResolution(r);
  }, [userId, demoUser]);

  const retry = () => {
    setResolution(null);
    void refresh();
  };

  const value = useMemo(
    () => ({
      user: activeUser,
      role: activeRole,
      isDemo,
      demoUser,
      signOut,
      refresh,
      notice,
      clearNotice: () => setNotice(null),
      setDemoRole,
      switchDemoRole,
    }),
    [activeUser, activeRole, isDemo, demoUser, signOut, refresh, notice, setDemoRole, switchDemoRole]
  );

  let content: React.ReactNode;
  if (demoUser) {
    // Demo Mode bypasses Clerk entirely and resolves instantly
    content = renderSignedIn();
  } else if (!isLoaded) {
    content = (
      <FullScreen>
        <ActivityIndicator color={COLORS.primary} />
      </FullScreen>
    );
  } else if (!isSignedIn) {
    content = renderSignedOut();
  } else if (errorMessage) {
    content = (
      <FullScreen>
        <Text style={styles.title}>Could not load your account</Text>
        <Text style={styles.message}>{errorMessage}</Text>
        <View style={styles.actions}>
          <Button label="Try again" onPress={retry} />
          <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </FullScreen>
    );
  } else if (!activeUser) {
    content = (
      <FullScreen>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.message}>Loading your account</Text>
      </FullScreen>
    );
  } else if (!isSupportedRole(activeUser.role)) {
    content = (
      <FullScreen>
        <Text style={styles.title}>This account is not supported yet</Text>
        <Text style={styles.message}>
          This app currently supports {SUPPORTED_ROLES.join(', ')} accounts. You are signed in as {activeUser.role}.
        </Text>
        <View style={styles.actions}>
          <Button label="Sign out" onPress={() => void signOut()} />
        </View>
      </FullScreen>
    );
  } else {
    content = renderSignedIn();
  }

  return <AuthContext.Provider value={value}>{content}</AuthContext.Provider>;
};

const styles = StyleSheet.create({
  full: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.lg,
    gap: SPACE.sm,
  },
  title: { ...TEXT.title, textAlign: 'center' },
  message: { ...TEXT.body, color: COLORS.textSecondary, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: SPACE.sm, marginTop: SPACE.md },
});
