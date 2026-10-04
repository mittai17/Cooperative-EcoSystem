import type {
  AppearanceSettings,
  GeneralSettings,
  PlatformSettings,
  SecuritySettings,
} from "@/lib/admin/admin-api";

export type SettingsTab = "general" | "appearance" | "notifications" | "security";

export const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "appearance", label: "Appearance" },
  { key: "notifications", label: "Notifications" },
  { key: "security", label: "Security" },
];

/** Labelled fallback values, shown only when the live settings API fails. */
export const DEMO_SETTINGS: PlatformSettings = {
  general: {
    org_name: "National Cooperative Training (NCCT)",
    admin_email: "admin@ncct.gov.in",
    contact_phone: "+91 11 2545 6789",
    contact_address: null,
  },
  appearance: { accent_color: "#E31B23", density: "comfortable" },
  notifications: { email_enabled: true, weekly_digest: true, placement_alerts: true, digest_frequency: "weekly" },
  security: { session_timeout_minutes: 60, mfa_required: false, password_min_length: 8, allowed_email_domains: [] },
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

export function validateGeneral(g: GeneralSettings): FieldErrors<GeneralSettings> {
  const errors: FieldErrors<GeneralSettings> = {};
  if (g.org_name.trim().length < 1 || g.org_name.trim().length > 255) errors.org_name = "Enter the organisation name.";
  if (g.admin_email && !EMAIL_RE.test(g.admin_email.trim())) errors.admin_email = "Enter a valid email address.";
  if (g.contact_phone && g.contact_phone.trim().length > 20) errors.contact_phone = "Use at most 20 characters.";
  if (g.contact_address && g.contact_address.trim().length > 500) errors.contact_address = "Use at most 500 characters.";
  return errors;
}

export function validateAppearance(a: AppearanceSettings): FieldErrors<AppearanceSettings> {
  const errors: FieldErrors<AppearanceSettings> = {};
  if (!/^#[0-9A-Fa-f]{6}$/.test(a.accent_color)) errors.accent_color = "Use a hex colour such as #E31B23.";
  return errors;
}

export function validateSecurity(s: SecuritySettings): FieldErrors<SecuritySettings> {
  const errors: FieldErrors<SecuritySettings> = {};
  if (!Number.isInteger(s.session_timeout_minutes) || s.session_timeout_minutes < 5 || s.session_timeout_minutes > 1440) {
    errors.session_timeout_minutes = "Enter whole minutes between 5 and 1440.";
  }
  if (!Number.isInteger(s.password_min_length) || s.password_min_length < 8 || s.password_min_length > 128) {
    errors.password_min_length = "Enter a length between 8 and 128.";
  }
  if (s.allowed_email_domains.length > 20) errors.allowed_email_domains = "Use at most 20 domains.";
  else if (s.allowed_email_domains.some((d) => !DOMAIN_RE.test(d))) {
    errors.allowed_email_domains = "Enter domains such as ncct.gov.in, separated by commas.";
  }
  return errors;
}

/** Parses the comma-separated domain input into a clean list. */
export function parseDomains(text: string): string[] {
  return text
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
}
