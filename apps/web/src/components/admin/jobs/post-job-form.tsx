"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/admin/admin-api";
import { JOB_SECTORS } from "@/components/admin/jobs/job-data";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary";

interface FormState {
  title: string;
  employer: string;
  sector: string;
  location: string;
  description: string;
}

const EMPTY: FormState = { title: "", employer: "", sector: "", location: "", description: "" };

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (form.title.trim().length < 3) errors.title = "Enter a job title (at least 3 characters).";
  if (form.employer.trim().length < 2) errors.employer = "Enter the employer name.";
  if (!form.sector) errors.sector = "Choose a sector.";
  if (form.location.trim().length < 2) errors.location = "Enter a location.";
  if (form.description.trim().length < 10) errors.description = "Add a short description (at least 10 characters).";
  return errors;
}

export function PostJobForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
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
      await createJob({
        title: form.title.trim(),
        employer_name: form.employer.trim(),
        sector: form.sector,
        location: form.location.trim(),
        description: form.description.trim() || null,
        status: "open",
      });
      router.push("/admin/jobs-placements");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not post the job.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Job Title" error={errors.title} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Dairy Quality Analyst"
          />
        </Field>
        <Field label="Employer" error={errors.employer}>
          <input
            className={inputClass}
            value={form.employer}
            onChange={(e) => update("employer", e.target.value)}
            placeholder="e.g. Amul Dairy"
          />
        </Field>
        <Field label="Sector" error={errors.sector}>
          <select className={inputClass} value={form.sector} onChange={(e) => update("sector", e.target.value)}>
            <option value="">Select sector</option>
            {JOB_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location" error={errors.location} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Anand, Gujarat"
          />
        </Field>
        <Field label="Description" error={errors.description} className="md:col-span-2">
          <textarea
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Role responsibilities, eligibility and expected skills."
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
          href="/admin/jobs-placements"
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post Job"}
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
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
