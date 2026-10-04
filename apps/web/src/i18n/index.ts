"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, getLocaleConfig, isLocale, type Locale } from "./config";
import en from "./messages/en.json";

export { DEFAULT_LOCALE, LOCALES, getLocaleConfig, isLocale, type Locale } from "./config";

/** A catalog is a nested object; leaves are the translated strings. */
export type MessageTree = { [key: string]: string | MessageTree };

export const LOCALE_COOKIE = "coopsetu_locale";
const LOCALE_STORAGE_KEY = "coopsetu_locale";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const englishMessages: MessageTree = en;

/**
 * Loads the catalog for a locale. English is statically imported so it is
 * bundled and used for server rendering. Every other locale is a dynamic import
 * of messages/<code>.json, so adding a JSON file is enough. A locale whose file
 * is missing falls back to English and logs a warning.
 */
export async function loadMessages(locale: Locale): Promise<MessageTree> {
  if (locale === DEFAULT_LOCALE) {
    return englishMessages;
  }
  try {
    const loaded: { default: MessageTree } = await import(`./messages/${locale}.json`);
    return loaded.default;
  } catch (error) {
    console.warn(`[i18n] No catalog for "${locale}", falling back to English.`, error);
    return englishMessages;
  }
}

/** Resolves a dotted key (e.g. "shell.signOut") to a string leaf, or undefined. */
function lookup(tree: MessageTree, key: string): string | undefined {
  let node: string | MessageTree = tree;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || !Object.hasOwn(node, part)) {
      return undefined;
    }
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Translation order: current locale, then English, then the caller's fallback,
 * then the key itself.
 */
export function translate(
  messages: MessageTree,
  key: string,
  fallback?: string,
): string {
  return lookup(messages, key) ?? lookup(englishMessages, key) ?? fallback ?? key;
}

function readLocaleCookie(): Locale | null {
  try {
    const row = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`));
    if (!row) {
      return null;
    }
    const value = decodeURIComponent(row.slice(LOCALE_COOKIE.length + 1));
    return isLocale(value) ? value : null;
  } catch (error) {
    console.warn("[i18n] Could not read the locale cookie.", error);
    return null;
  }
}

/** Saves the choice for this browser (localStorage) and for the server (cookie). */
export function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn("[i18n] localStorage is unavailable; locale kept in cookie only.", error);
  }
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

const localeListeners = new Set<() => void>();

function subscribeToLocale(onChange: () => void): () => void {
  localeListeners.add(onChange);
  return () => {
    localeListeners.delete(onChange);
  };
}

function notifyLocaleListeners(): void {
  localeListeners.forEach((listener) => listener());
}

function readStoredLocale(): Locale {
  return readLocaleCookie() ?? DEFAULT_LOCALE;
}

function serverLocale(): Locale {
  return DEFAULT_LOCALE;
}

interface I18nContextValue {
  locale: Locale;
  messages: MessageTree;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  messages: englishMessages,
  setLocale: () => {
    throw new Error("setLocale must be used inside <I18nProvider>.");
  },
});

interface I18nProviderProps {
  children: ReactNode;
}

/**
 * Holds the active locale and its catalog. The first render (server and client)
 * is always English, and the saved cookie is applied after mount, so there is no
 * hydration mismatch. Also keeps <html lang> and <body data-script> in sync so
 * the Noto font for the script applies.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  // The cookie is the external store. Hydration uses the English server
  // snapshot, then React re-renders with the saved locale.
  const requested = useSyncExternalStore(subscribeToLocale, readStoredLocale, serverLocale);
  // `catalog` is the last locale whose messages finished loading, so the UI never
  // shows a locale label with another locale's text.
  const [catalog, setCatalog] = useState<{ locale: Locale; messages: MessageTree }>({
    locale: DEFAULT_LOCALE,
    messages: englishMessages,
  });

  useEffect(() => {
    let stale = false;
    void loadMessages(requested).then((messages) => {
      // A newer selection has superseded this load, so drop the result.
      if (!stale) {
        setCatalog({ locale: requested, messages });
      }
    });
    return () => {
      stale = true;
    };
  }, [requested]);

  useEffect(() => {
    document.documentElement.lang = catalog.locale;
    document.body.dataset.script = getLocaleConfig(catalog.locale).script;
  }, [catalog.locale]);

  const setLocale = useCallback((locale: Locale) => {
    if (!isLocale(locale)) {
      throw new RangeError(`Unsupported locale: ${String(locale)}`);
    }
    persistLocale(locale);
    notifyLocaleListeners();
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale: catalog.locale, messages: catalog.messages, setLocale }),
    [catalog, setLocale],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

/** Returns the active locale and a setter that persists the choice. */
export function useLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const { locale, setLocale } = useContext(I18nContext);
  return { locale, setLocale };
}

/**
 * Returns t(key, fallback?). Keys are dotted paths into the catalog, for example
 * t("shell.signOut"). The fallback is used only if neither the active locale nor
 * English has the key.
 */
export function useT(): (key: string, fallback?: string) => string {
  const { messages } = useContext(I18nContext);
  return useCallback(
    (key: string, fallback?: string) => translate(messages, key, fallback),
    [messages],
  );
}
