/**
 * Roles this build has an app shell for. Drives both the demo-login buttons
 * and which signed-in roles may enter the main app. To enable the trainer
 * experience, add 'trainer' here once its shell exists; nothing else changes.
 */
export const SUPPORTED_ROLES: readonly string[] = [
  'trainee',
  'trainer',
  'institution',
  'employer',
  'admin',
];

export const isSupportedRole = (role: string | null | undefined): boolean =>
  !!role && SUPPORTED_ROLES.includes(role);

/** Clerk publishable key (public by design). Empty string when not configured. */
export const CLERK_PUBLISHABLE_KEY = (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '').trim();
