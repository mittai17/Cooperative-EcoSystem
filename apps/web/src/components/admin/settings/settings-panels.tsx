"use client";

import { useState, type FormEvent } from "react";
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
import { FormField, inputClass, primaryButtonClass, textareaClass } from "@/components/admin/programmes/admin-ui";

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
    <div className="mt-2 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-[1.25rem] text-sm" role="status" aria-live="polite">
        {result?.ok === true ? <span className="font-medium text-emerald-700">Settings saved.</span> : null}
        {result?.ok === false ? <span className="text-red-700">Could not save: {result.message}</span> : null}
      </div>
      <button type="submit" disabled={saving} className={primaryButtonClass}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
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
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/40">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 shrink-0 accent-[var(--primary)]"
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
      <FormField label="Organization Name" required error={errors.org_name}>
        <input className={inputClass} value={form.org_name} onChange={(e) => update("org_name", e.target.value)} />
      </FormField>
      <FormField label="Admin Email" error={errors.admin_email}>
        <input
          type="email"
          className={inputClass}
          value={form.admin_email ?? ""}
          onChange={(e) => update("admin_email", e.target.value)}
        />
      </FormField>
      <FormField label="Contact Number" error={errors.contact_phone}>
        <input
          className={inputClass}
          value={form.contact_phone ?? ""}
          onChange={(e) => update("contact_phone", e.target.value)}
        />
      </FormField>
      <FormField label="Contact Address" error={errors.contact_address} className="md:col-span-2">
        <textarea
          rows={3}
          className={textareaClass}
          value={form.contact_address ?? ""}
          onChange={(e) => update("contact_address", e.target.value)}
        />
      </FormField>
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
      <FormField label="Accent Colour" error={errors.accent_color}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Accent colour picker"
            value={/^#[0-9A-Fa-f]{6}$/.test(form.accent_color) ? form.accent_color : "#E31B23"}
            onChange={(e) => {
              setForm({ ...form, accent_color: e.target.value.toUpperCase() });
              clear();
            }}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-card p-1"
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
      </FormField>
      <FormField label="Density">
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
      </FormField>
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
      <FormField label="Digest frequency">
        <select
          className={`${inputClass} md:max-w-xs`}
          value={form.digest_frequency}
          onChange={(e) => set("digest_frequency", e.target.value as DigestFrequency)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </FormField>
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
        <FormField label="Session timeout (minutes)" error={errors.session_timeout_minutes}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.session_timeout_minutes}
            onChange={(e) => set("session_timeout_minutes", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Minimum password length" error={errors.password_min_length}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.password_min_length}
            onChange={(e) => set("password_min_length", Number(e.target.value))}
          />
        </FormField>
        <FormField label="Allowed email domains (comma separated)" error={errors.allowed_email_domains} className="md:col-span-2">
          <input
            className={inputClass}
            value={domainText}
            placeholder="e.g. ncct.gov.in, nccm.coop"
            onChange={(e) => {
              setDomainText(e.target.value);
              clear();
            }}
          />
        </FormField>
      </div>
      <SaveBar saving={saving} result={result} />
    </form>
  );
}
