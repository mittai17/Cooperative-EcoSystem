"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "coopsetu-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

type Snapshot = { theme: Theme; resolvedTheme: Resolved };

const listeners = new Set<() => void>();
let cached: Snapshot | null = null;

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyToDocument(resolved: Resolved) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * External store (module-scope, singleton) reading the user's stored theme
 * preference and the OS color-scheme preference. Using useSyncExternalStore
 * (rather than useState+useEffect) is the React-blessed way to read mutable
 * state that lives outside React (localStorage, matchMedia) without causing
 * a setState-in-effect cascade or a hydration mismatch warning.
 */
function getSnapshot(): Snapshot {
  const theme = readStoredTheme();
  const resolvedTheme: Resolved = theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
  if (!cached || cached.theme !== theme || cached.resolvedTheme !== resolvedTheme) {
    cached = { theme, resolvedTheme };
  }
  return cached;
}

const SERVER_SNAPSHOT: Snapshot = { theme: "system", resolvedTheme: "light" };

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

function notifyAll() {
  listeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, resolvedTheme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Pure DOM synchronization (not React state), driven by the latest
  // resolved value -- this is the "update an external system" case the
  // set-state-in-effect lint rule explicitly allows.
  useEffect(() => {
    applyToDocument(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode, etc.) -- theme just won't persist
    }
    notifyAll();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/**
 * Inline script string, executed synchronously in <head> before hydration,
 * so the correct theme class is present on first paint (no light-mode flash
 * for returning dark-mode users).
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var t=(s==='light'||s==='dark')?s:'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
