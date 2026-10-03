"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProgramme } from "@/lib/admin/admin-api";
import { PROGRAMME_MODES, PROGRAMME_SECTORS } from "@/components/admin/programmes/programme-data";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary";

interface FormState {
  title: string;
  sector: string;
  mode: string;
  duration_weeks: string;
  seats_total: string;
  description: string;
}

const EMPTY: FormState = {
  title: "",
  sector: "",
  mode: "offline",
  duration_weeks: "",
  seats_total: "",
  description: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.title.trim().length < 3) errors.title = "Enter a program name (at least 3 characters).";
  if (!form.sector) errors.sector = "Choose a category.";
  const weeks = Number(form.duration_weeks);
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 520) errors.duration_weeks = "Enter whole weeks between 1 and 520.";
  const seats = Number(form.seats_total);
  if (!form.seats_total.trim() || !Number.isInteger(seats) || seats < 0 || seats > 100000) {
    errors.seats_total = "Enter a whole number of seats (0 to 100000).";
  }
  if (form.description.trim().length > 0 && form.description.trim().length < 10) {
    errors.description = "Add at least 10 characters, or leave it empty.";
  }
  return errors;
}

export function CreateProgrammeForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await createProgramme({
        title: form.title.trim(),
        sector: form.sector,
        mode: form.mode,
        duration_weeks: Number(form.duration_weeks),
        seats_total: Number(form.seats_total),
        description: form.description.trim() || null,
        is_active: true,
      });
      router.push("/admin/programmes");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not create the program.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Program Name" error={errors.title} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Dairy Management"
          />
        </Field>
        <Field label="Category" error={errors.sector}>
          <select className={inputClass} value={form.sector} onChange={(e) => update("sector", e.target.value)}>
            <option value="">Select category</option>
            {PROGRAMME_SECTORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Duration (weeks)" error={errors.duration_weeks}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.duration_weeks}
            onChange={(e) => update("duration_weeks", e.target.value)}
            placeholder="e.g. 12"
          />
        </Field>
        <Field label="Mode" className="md:col-span-2">
          <div className="flex flex-wrap gap-3">
            {PROGRAMME_MODES.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
                  form.mode === m.value
                    ? "border-primary bg-primary/5 font-semibold text-primary"
                    : "border-slate-200 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={form.mode === m.value}
                  onChange={() => update("mode", m.value)}
                  className="accent-[var(--primary)]"
                />
                {m.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Total Seats" error={errors.seats_total}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.seats_total}
            onChange={(e) => update("seats_total", e.target.value)}
            placeholder="e.g. 60"
          />
        </Field>
        <Field label="Description" error={errors.description} className="md:col-span-2">
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What will trainees learn in this program?"
          />
        </Field>
      </div>

      {serverError && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/admin/programmes"
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Program"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
