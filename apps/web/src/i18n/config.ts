/**
 * Locale registry. This is the single list the rest of the i18n layer reads.
 *
 * To add a language:
 *   1. Add an entry here (order is the order shown in the language switcher).
 *   2. Add messages/<code>.json with the same key tree as en.json.
 * If its script is not yet loaded in src/app/layout.tsx, add a next/font loader
 * and a matching [data-script] rule in src/app/globals.css.
 */
export const LOCALES = [
  { code: "en", nativeLabel: "English", script: "Latn" },
  { code: "hi", nativeLabel: "हिन्दी", script: "Deva" },
  { code: "mr", nativeLabel: "मराठी", script: "Deva" },
  { code: "gu", nativeLabel: "ગુજરાતી", script: "Gujr" },
  { code: "ta", nativeLabel: "தமிழ்", script: "Taml" },
  { code: "bn", nativeLabel: "বাংলা", script: "Beng" },
  { code: "te", nativeLabel: "తెలుగు", script: "Telu" },
  { code: "kn", nativeLabel: "ಕನ್ನಡ", script: "Knda" },
  { code: "ml", nativeLabel: "മലയാളം", script: "Mlym" },
  { code: "pa", nativeLabel: "ਪੰਜਾਬੀ", script: "Guru" },
  { code: "or", nativeLabel: "ଓଡ଼ିଆ", script: "Orya" },
] as const;

export interface LocaleConfig {
  /** BCP 47 code. Also the messages file name: messages/<code>.json. */
  code: string;
  /** Name of the language written in that language, shown in the switcher. */
  nativeLabel: string;
  /** ISO 15924 script code. Selects the Noto font via [data-script] in globals.css. */
  script: string;
}

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale.code === value);
}

export function getLocaleConfig(code: Locale): LocaleConfig {
  const found = LOCALES.find((locale) => locale.code === code);
  if (!found) {
    throw new RangeError(`Unknown locale: ${code}`);
  }
  return found;
}
