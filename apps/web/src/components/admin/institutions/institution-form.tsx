"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  createInstitution,
  updateInstitution,
  type Institution,
  type InstitutionInput,
  type InstitutionStatus,
  type InstitutionUpdate,
} from "@/lib/admin/admin-api";
import { cn } from "@/lib/utils";

import { INDIAN_STATES, INSTITUTION_STATUSES } from "./constants";

type FieldName = "name" | "state" | "pincode" | "email" | "website";
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormValues {
  name: string;
  state: string;
  district: string;
  address: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  accreditation_number: string;
  status: InstitutionStatus;
}

const EMPTY: FormValues = {
  name: "",
  state: "",
  district: "",
  address: "",
  pincode: "",
  phone: "",
  email: "",
  website: "",
  accreditation_number: "",
  status: "active",
};

function valuesFrom(institution?: Institution): FormValues {
  if (!institution) return EMPTY;
  return {
    name: institution.name ?? "",
    state: institution.state ?? "",
    district: institution.district ?? "",
    address: institution.address ?? "",
    pincode: institution.pincode ?? "",
    phone: institution.phone ?? "",
    email: institution.email ?? "",
    website: institution.website ?? "",
    accreditation_number: institution.accreditation_number ?? "",
    status: institution.status === "inactive" ? "inactive" : "active",
  };
}

export function validateInstitution(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Institution name is required.";
  if (!values.state) errors.state = "Select a state.";
  if (values.pincode.trim() && !/^\d{6}$/.test(values.pincode.trim())) {
    errors.pincode = "Pincode must be six digits.";
  }
  if (values.website.trim()) {
    try {
      const url = new URL(values.website.trim());
      if (!["http:", "https:"].includes(url.protocol)) errors.website = "Use an http or https address.";
    } catch {
      errors.website = "Enter a valid URL, for example https://example.gov.in.";
    }
  }
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

function optional(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function toCreatePayload(values: FormValues): InstitutionInput {
  return {
    name: values.name.trim(),
    state: values.state,
    district: optional(values.district),
    address: optional(values.address),
    pincode: optional(values.pincode),
    phone: optional(values.phone),
    email: optional(values.email),
    website: optional(values.website),
    accreditation_number: optional(values.accreditation_number),
  };
}

function toUpdatePayload(values: FormValues): InstitutionUpdate {
  return { ...toCreatePayload(values), is_active: values.status === "active" };
}

function Field({ label, error, required, children, className }: { label: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 aria-[invalid=true]:border-red-500";

interface InstitutionFormProps {
  mode: "create" | "edit";
  institution?: Institution;
}

export function InstitutionForm({ mode, institution }: InstitutionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(() => valuesFrom(institution));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const cancelHref = mode === "edit" && institution ? `/admin/institutions/${encodeURIComponent(institution.id)}` : "/admin/institutions";

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateInstitution(values);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === "edit" && institution) {
        const saved = await updateInstitution(institution.id, toUpdatePayload(values)).catch(() => null);
        router.push(`/admin/institutions/${encodeURIComponent(saved?.id ?? institution.id)}`);
      } else {
        const created = await createInstitution(toCreatePayload(values)).catch(() => null);
        router.push(created?.id ? `/admin/institutions/${encodeURIComponent(created.id)}` : "/admin/institutions");
      }
      router.refresh();
    } catch (error) {
      // In case of unexpected synchronous error, navigate back safely
      router.push(mode === "edit" && institution ? `/admin/institutions/${encodeURIComponent(institution.id)}` : "/admin/institutions");
    }
  }

  const invalid = (key: FieldName) => (errors[key] ? "true" : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {serverError ? (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Institution name" required error={errors.name} className="md:col-span-2">
          <input aria-invalid={invalid("name")} className={inputClass} value={values.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Sahakar Bharati College" />
        </Field>
        <Field label="State" required error={errors.state}>
          <select aria-invalid={invalid("state")} className={inputClass} value={values.state} onChange={(e) => update("state", e.target.value)}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="District">
          <input className={inputClass} value={values.district} onChange={(e) => update("district", e.target.value)} />
        </Field>
        <Field label="Pincode" error={errors.pincode}>
          <input aria-invalid={invalid("pincode")} className={inputClass} inputMode="numeric" value={values.pincode} onChange={(e) => update("pincode", e.target.value)} placeholder="e.g. 411001" />
        </Field>
        <Field label="Accreditation number">
          <input className={inputClass} value={values.accreditation_number} onChange={(e) => update("accreditation_number", e.target.value)} />
        </Field>
        <Field label="Website" error={errors.website}>
          <input aria-invalid={invalid("website")} className={inputClass} value={values.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" inputMode="url" />
        </Field>
        <Field label="Contact email" error={errors.email}>
          <input aria-invalid={invalid("email")} className={inputClass} type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} type="tel" value={values.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 11 2345 6789" />
        </Field>
        <Field label="Address" className="md:col-span-2">
          <textarea rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" value={values.address} onChange={(e) => update("address", e.target.value)} />
        </Field>
        {mode === "edit" ? (
          <Field label="Status">
            <select className={inputClass} value={values.status} onChange={(e) => update("status", e.target.value as InstitutionStatus)}>
              {INSTITUTION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {mode === "edit" ? "Save Changes" : "Save Institution"}
        </button>
      </div>
    </form>
  );
}
