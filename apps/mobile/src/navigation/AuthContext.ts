import { createContext, useContext } from 'react';
import { AuthUser } from '../types';

export interface AuthContextValue {
  /** Local backend identity from GET /auth/me or demo user profile; null until resolved / when signed out. */
  user: AuthUser | null;
  /** Shortcut for user.role. */
  role: string | null;
  /** True when currently running in demo mode. */
  isDemo: boolean;
  /** Active demo user, or null when signed out or using regular Clerk account. */
  demoUser: AuthUser | null;
  /** Ends the Clerk or demo session and clears the in-memory store. Optional `notice` is shown on the Login screen. */
  signOut: (notice?: string) => Promise<void>;
  /** Re-runs GET /auth/me (provisioning when needed). */
  refresh: () => Promise<void>;
  /** Message to show on the Login screen (e.g. after a forced sign-out). */
  notice: string | null;
  clearNotice: () => void;
  /** Switches to the selected role demo profile immediately. */
  setDemoRole: (role: string) => void;
  /** Alias for switching role in demo mode across any screen. */
  switchDemoRole: (role: string) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isDemo: false,
  demoUser: null,
  signOut: async () => {},
  refresh: async () => {},
  notice: null,
  clearNotice: () => {},
  setDemoRole: () => {},
  switchDemoRole: () => {},
});

export const useAuthContext = () => useContext(AuthContext);
