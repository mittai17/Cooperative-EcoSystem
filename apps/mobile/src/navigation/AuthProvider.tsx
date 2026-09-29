import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import { COLORS, SPACE, TEXT } from '../constants/theme';
import { isSupportedRole, SUPPORTED_ROLES } from '../constants/auth';
import { ApiError, authApi, configureAuthClient, MeResponse } from '../services/api';
import { localStore } from '../services/localStore';
import { AuthUser } from '../types';
import { Button } from '../components/Button';
import { queryClient } from '../api/queryClient';
import { AuthContext } from './AuthContext';

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
 * Bridges Clerk to the app: wires the API client to the Clerk session token,
 * resolves the local identity after any sign-in and exposes it via AuthContext.
 * Children are only rendered signed-in-and-resolved through `renderSignedIn`,
 * or signed-out through `renderSignedOut`.
 */
export const AuthProvider: React.FC<{
  renderSignedOut: () => React.ReactNode;
  renderSignedIn: () => React.ReactNode;
}> = ({ renderSignedOut, renderSignedIn }) => {
  const { isLoaded, isSignedIn, userId, getToken, signOut: clerkSignOut } = useAuth();
  const [resolution, setResolution] = useState<Resolution | null>(null);
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
        setNotice(message ?? null);
        await clerkSignOut();
      } catch (e) {
        console.warn('Clerk signOut failed', e);
        setNotice('Sign out did not complete. Try again.');
      } finally {
        signingOut.current = false;
      }
    },
    [clerkSignOut]
  );

  // Keep the API client pointed at the live Clerk session.
  useEffect(() => {
    configureAuthClient({
      getToken: (options) => getToken(options),
      onUnauthorized: () => {
        void signOut('Your session expired. Sign in again.');
      },
    });
    return () => configureAuthClient({ getToken: null, onUnauthorized: null });
  }, [getToken, signOut]);

  // Any sign-in method lands here: resolve the local identity once per session.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    let cancelled = false;
    void resolveFor(userId).then((r) => {
      if (!cancelled && r) setResolution(r);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  const current = userId && resolution?.clerkUserId === userId ? resolution : null;
  const user = current && 'user' in current ? current.user : null;
  const errorMessage = current && 'error' in current ? current.error : '';

  const refresh = useCallback(async () => {
    if (!userId) return;
    const r = await resolveFor(userId);
    if (r) setResolution(r);
  }, [userId]);

  const retry = () => {
    setResolution(null);
    void refresh();
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      signOut,
      refresh,
      notice,
      clearNotice: () => setNotice(null),
    }),
    [user, signOut, refresh, notice]
  );

  let content: React.ReactNode;
  if (!isLoaded) {
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
  } else if (!user) {
    content = (
      <FullScreen>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.message}>Loading your account</Text>
      </FullScreen>
    );
  } else if (!isSupportedRole(user.role)) {
    content = (
      <FullScreen>
        <Text style={styles.title}>This account is not supported yet</Text>
        <Text style={styles.message}>
          This app currently supports {SUPPORTED_ROLES.join(', ')} accounts. You are signed in as {user.role}.
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
