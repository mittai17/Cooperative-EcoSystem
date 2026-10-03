"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  parseDomains,
  validateAppearance,
  validateGeneral,
  validateSecurity,
  type FieldErrors,
} from "@/components/admin/settings/settings-data";
import type {
  AppearanceSettings,
  DigestFrequency,
  GeneralSettings,
  NotificationSettings,
  SecuritySettings,
} from "@/lib/admin/admin-api";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary";

export type SaveResult = { ok: true } | { ok: false; message: string };

interface PanelProps<T> {
  initial: T;
  onSave: (value: T) => Promise<SaveResult>;
}

function usePanelSave<T>(onSave: (value: T) => Promise<SaveResult>) {
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);
  async function save(value: T) {
    setSaving(true);
    setResult(null);
    try {
      setResult(await onSave(value));
    } finally {
      setSaving(false);
    }
  }
  return { saving, result, save, clear: () => setResult(null) };
}

function SaveBar({ saving, result }: { saving: boolean; result: SaveResult | null }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
      <div className="min-h-[1.25rem] text-sm" role="status" aria-live="polite">
        {result?.ok === true && <span className="font-medium text-emerald-700">Settings saved.</span>}
        {result?.ok === false && <span className="text-red-700">Could not save: {result.message}</span>}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function Field({ label, error, children, className = "" }: { label: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--primary)]"
      />
    </label>
  );
}

export function GeneralPanel({ initial, onSave }: PanelProps<GeneralSettings>) {
  const [form, setForm] = useState<GeneralSettings>(initial);
  const [errors, setErrors] = useState<FieldErrors<GeneralSettings>>({});
  const { saving, result, save, clear } = usePanelSave(onSave);

  function update<K extends keyof GeneralSettings>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    clear();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateGeneral(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    await save({
      org_name: form.org_name.trim(),
      admin_email: form.admin_email?.trim() || null,
      contact_phone: form.contact_phone?.trim() || null,
      contact_address: form.contact_address?.trim() || null,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Field label="Organization Name" error={errors.org_name} className="md:col-span-2">
        <input className={inputClass} value={form.org_name} onChange={(e) => update("org_name", e.target.value)} />
      </Field>
      <Field label="Admin Email" error={errors.admin_email}>
        <input
          type="email"
          className={inputClass}
          value={form.admin_email ?? ""}
          onChange={(e) => update("admin_email", e.target.value)}
        />
      </Field>
      <Field label="Contact Number" error={errors.contact_phone}>
        <input
          className={inputClass}
          value={form.contact_phone ?? ""}
          onChange={(e) => update("contact_phone", e.target.value)}
        />
      </Field>
      <Field label="Contact Address" error={errors.contact_address} className="md:col-span-2">
        <textarea
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary"
          value={form.contact_address ?? ""}
          onChange={(e) => update("contact_address", e.target.value)}
        />
      </Field>
      <div className="md:col-span-2">
        <SaveBar saving={saving} result={result} />
      </div>
    </form>
  );
}

export function AppearancePanel({ initial, onSave }: PanelProps<AppearanceSettings>) {
  const [form, setForm] = useState<AppearanceSettings>(initial);
  const [errors, setErrors] = useState<FieldErrors<AppearanceSettings>>({});
  const { saving, result, save, clear } = usePanelSave(onSave);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateAppearance(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    await save(form);
  }

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Field label="Accent Colour" error={errors.accent_color}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Accent colour picker"
            value={/^#[0-9A-Fa-f]{6}$/.test(form.accent_color) ? form.accent_color : "#E31B23"}
            onChange={(e) => {
              setForm({ ...form, accent_color: e.target.value.toUpperCase() });
              clear();
            }}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
          />
          <input
            className={inputClass}
            value={form.accent_color}
            onChange={(e) => {
              setForm({ ...form, accent_color: e.target.value });
              clear();
            }}
          />
        </div>
      </Field>
      <Field label="Density">
        <select
          className={inputClass}
          value={form.density}
          onChange={(e) => {
            setForm({ ...form, density: e.target.value as AppearanceSettings["density"] });
            clear();
          }}
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <SaveBar saving={saving} result={result} />
      </div>
    </form>
  );
}

export function NotificationsPanel({ initial, onSave }: PanelProps<NotificationSettings>) {
  const [form, setForm] = useState<NotificationSettings>(initial);
  const { saving, result, save, clear } = usePanelSave(onSave);

  function set<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    clear();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(form);
      }}
      className="flex flex-col gap-4"
    >
      <ToggleRow
        label="Email notifications"
        description="Send email notifications from the admin portal."
        checked={form.email_enabled}
        onChange={(c) => set("email_enabled", c)}
      />
      <ToggleRow
        label="Placement alerts"
        description="Notify the admin office when a trainee receives a placement."
        checked={form.placement_alerts}
        onChange={(c) => set("placement_alerts", c)}
      />
      <ToggleRow
        label="Digest emails"
        description="Send a summary of enrolments and certifications."
        checked={form.weekly_digest}
        onChange={(c) => set("weekly_digest", c)}
      />
      <Field label="Digest frequency">
        <select
          className={`${inputClass} md:max-w-xs`}
          value={form.digest_frequency}
          onChange={(e) => set("digest_frequency", e.target.value as DigestFrequency)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </Field>
      <SaveBar saving={saving} result={result} />
    </form>
  );
}

export function SecurityPanel({ initial, onSave }: PanelProps<SecuritySettings>) {
  const [form, setForm] = useState<SecuritySettings>(initial);
  const [domainText, setDomainText] = useState(initial.allowed_email_domains.join(", "));
  const [errors, setErrors] = useState<FieldErrors<SecuritySettings>>({});
  const { saving, result, save, clear } = usePanelSave(onSave);

  function set<K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    clear();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: SecuritySettings = { ...form, allowed_email_domains: parseDomains(domainText) };
    const found = validateSecurity(payload);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    await save(payload);
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <ToggleRow
        label="Require two-factor sign-in"
        description="Ask every admin account for a one-time code at sign-in."
        checked={form.mfa_required}
        onChange={(c) => set("mfa_required", c)}
      />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Session timeout (minutes)" error={errors.session_timeout_minutes}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.session_timeout_minutes}
            onChange={(e) => set("session_timeout_minutes", Number(e.target.value))}
          />
        </Field>
        <Field label="Minimum password length" error={errors.password_min_length}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.password_min_length}
            onChange={(e) => set("password_min_length", Number(e.target.value))}
          />
        </Field>
        <Field label="Allowed email domains (comma separated)" error={errors.allowed_email_domains} className="md:col-span-2">
          <input
            className={inputClass}
            value={domainText}
            placeholder="e.g. ncct.gov.in, nccm.coop"
            onChange={(e) => {
              setDomainText(e.target.value);
              clear();
            }}
          />
        </Field>
      </div>
      <SaveBar saving={saving} result={result} />
    </form>
  );
}
