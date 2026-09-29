import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

// English
import commonEn from './locales/en/common.json';
import programmesEn from './locales/en/programmes.json';
import scheduleEn from './locales/en/schedule.json';
import learningEn from './locales/en/learning.json';
import assessmentsEn from './locales/en/assessments.json';
import profileEn from './locales/en/profile.json';
import attendanceEn from './locales/en/attendance.json';
import employerEn from './locales/en/employer.json';
import analyticsEn from './locales/en/analytics.json';
import careerEn from './locales/en/career.json';
import offlineEn from './locales/en/offline.json';

// Hindi
import commonHi from './locales/hi/common.json';
import programmesHi from './locales/hi/programmes.json';
import scheduleHi from './locales/hi/schedule.json';
import learningHi from './locales/hi/learning.json';
import assessmentsHi from './locales/hi/assessments.json';
import profileHi from './locales/hi/profile.json';
import attendanceHi from './locales/hi/attendance.json';
import employerHi from './locales/hi/employer.json';
import analyticsHi from './locales/hi/analytics.json';
import careerHi from './locales/hi/career.json';
import offlineHi from './locales/hi/offline.json';

// Marathi
import commonMr from './locales/mr/common.json';
import programmesMr from './locales/mr/programmes.json';
import scheduleMr from './locales/mr/schedule.json';
import learningMr from './locales/mr/learning.json';
import assessmentsMr from './locales/mr/assessments.json';
import profileMr from './locales/mr/profile.json';
import attendanceMr from './locales/mr/attendance.json';
import employerMr from './locales/mr/employer.json';
import analyticsMr from './locales/mr/analytics.json';
import careerMr from './locales/mr/career.json';
import offlineMr from './locales/mr/offline.json';

// Gujarati
import commonGu from './locales/gu/common.json';
import programmesGu from './locales/gu/programmes.json';
import scheduleGu from './locales/gu/schedule.json';
import learningGu from './locales/gu/learning.json';
import assessmentsGu from './locales/gu/assessments.json';
import profileGu from './locales/gu/profile.json';
import attendanceGu from './locales/gu/attendance.json';
import employerGu from './locales/gu/employer.json';
import analyticsGu from './locales/gu/analytics.json';
import careerGu from './locales/gu/career.json';
import offlineGu from './locales/gu/offline.json';

// Tamil
import commonTa from './locales/ta/common.json';
import programmesTa from './locales/ta/programmes.json';
import scheduleTa from './locales/ta/schedule.json';
import learningTa from './locales/ta/learning.json';
import assessmentsTa from './locales/ta/assessments.json';
import profileTa from './locales/ta/profile.json';
import attendanceTa from './locales/ta/attendance.json';
import employerTa from './locales/ta/employer.json';
import analyticsTa from './locales/ta/analytics.json';
import careerTa from './locales/ta/career.json';
import offlineTa from './locales/ta/offline.json';

const i18n = createInstance();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const defaultNamespace = 'common';
export const namespaces = [
  'common',
  'programmes',
  'schedule',
  'learning',
  'assessments',
  'profile',
  'attendance',
  'employer',
  'analytics',
  'career',
  'offline',
] as const;

export type I18nNamespace = (typeof namespaces)[number];

const resources = {
  en: {
    common: commonEn,
    programmes: programmesEn,
    schedule: scheduleEn,
    learning: learningEn,
    assessments: assessmentsEn,
    profile: profileEn,
    attendance: attendanceEn,
    employer: employerEn,
    analytics: analyticsEn,
    career: careerEn,
    offline: offlineEn,
  },
  hi: {
    common: commonHi,
    programmes: programmesHi,
    schedule: scheduleHi,
    learning: learningHi,
    assessments: assessmentsHi,
    profile: profileHi,
    attendance: attendanceHi,
    employer: employerHi,
    analytics: analyticsHi,
    career: careerHi,
    offline: offlineHi,
  },
  mr: {
    common: commonMr,
    programmes: programmesMr,
    schedule: scheduleMr,
    learning: learningMr,
    assessments: assessmentsMr,
    profile: profileMr,
    attendance: attendanceMr,
    employer: employerMr,
    analytics: analyticsMr,
    career: careerMr,
    offline: offlineMr,
  },
  gu: {
    common: commonGu,
    programmes: programmesGu,
    schedule: scheduleGu,
    learning: learningGu,
    assessments: assessmentsGu,
    profile: profileGu,
    attendance: attendanceGu,
    employer: employerGu,
    analytics: analyticsGu,
    career: careerGu,
    offline: offlineGu,
  },
  ta: {
    common: commonTa,
    programmes: programmesTa,
    schedule: scheduleTa,
    learning: learningTa,
    assessments: assessmentsTa,
    profile: profileTa,
    attendance: attendanceTa,
    employer: employerTa,
    analytics: analyticsTa,
    career: careerTa,
    offline: offlineTa,
  },
};

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const initialLang = SUPPORTED_LANGUAGES.some((l) => l.code === deviceLocale) ? deviceLocale : 'en';
const languageKey = 'coopsetu.interfaceLanguage';

export async function restoreLanguage(): Promise<void> {
  try {
    const saved = await SecureStore.getItemAsync(languageKey);
    if (saved && SUPPORTED_LANGUAGES.some((language) => language.code === saved)) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // A device with unavailable secure storage can still use its locale.
  }
}

export async function setLanguage(code: SupportedLanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await SecureStore.setItemAsync(languageKey, code);
  } catch {
    // Keep the selected language for the current session.
  }
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: namespaces as unknown as string[],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
