import { createContext, useContext } from 'react';
import { AuthUser } from '../types';

export interface AuthContextValue {
  /** Local backend identity from GET /auth/me; null until resolved / when signed out. */
  user: AuthUser | null;
  /** Shortcut for user.role. */
  role: string | null;
  /** Ends the Clerk session and clears the in-memory store. Optional `notice` is shown on the Login screen. */
  signOut: (notice?: string) => Promise<void>;
  /** Re-runs GET /auth/me (provisioning when needed). */
  refresh: () => Promise<void>;
  /** Message to show on the Login screen (e.g. after a forced sign-out). */
  notice: string | null;
  clearNotice: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  signOut: async () => {},
  refresh: async () => {},
  notice: null,
  clearNotice: () => {},
});

export const useAuthContext = () => useContext(AuthContext);
