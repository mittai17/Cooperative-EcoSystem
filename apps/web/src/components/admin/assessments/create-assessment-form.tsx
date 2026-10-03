"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAssessment, type AssessmentInput, type Programme } from "@/lib/admin/admin-api";
import { SHOW_ANSWERS_OPTIONS } from "@/components/admin/assessments/assessment-data";
import { fetchAllProgrammes } from "@/components/admin/programmes/admin-helpers";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary";

interface FormState {
  title: string;
  programme_id: string;
  skill_name: string;
  total_questions: string;
  duration_minutes: string;
  passing_score: string;
  due_date: string;
  max_attempts: string;
  show_answers: NonNullable<AssessmentInput["show_answers"]>;
}

const EMPTY: FormState = {
  title: "",
  programme_id: "",
  skill_name: "",
  total_questions: "25",
  duration_minutes: "45",
  passing_score: "60",
  due_date: "",
  max_attempts: "3",
  show_answers: "after_submit",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function whole(value: string, min: number, max: number): boolean {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= min && n <= max;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.title.trim().length < 3) errors.title = "Enter an assessment title (at least 3 characters).";
  if (!form.programme_id) errors.programme_id = "Choose a program.";
  if (!whole(form.total_questions, 1, 500)) errors.total_questions = "Enter a number between 1 and 500.";
  if (!whole(form.duration_minutes, 1, 600)) errors.duration_minutes = "Enter minutes between 1 and 600.";
  if (!whole(form.passing_score, 0, 100)) errors.passing_score = "Enter a pass mark between 0 and 100.";
  if (!whole(form.max_attempts, 1, 10)) errors.max_attempts = "Enter attempts between 1 and 10.";
  return errors;
}

export function CreateAssessmentForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [programmesError, setProgrammesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllProgrammes()
      .then((rows) => {
        if (!cancelled) setProgrammes(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setProgrammesError(err instanceof Error ? err.message : "Could not load programs");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      await createAssessment({
        title: form.title.trim(),
        programme_id: form.programme_id,
        skill_name: form.skill_name.trim() || null,
        total_questions: Number(form.total_questions),
        duration_minutes: Number(form.duration_minutes),
        passing_score: Number(form.passing_score),
        // The backend expects a datetime; a date-only value is pinned to the start of that day (UTC).
        due_date: form.due_date ? `${form.due_date}T00:00:00Z` : null,
        max_attempts: Number(form.max_attempts),
        show_answers: form.show_answers,
      });
      router.push("/admin/assessments");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not create the assessment.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Assessment Title" error={errors.title} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Dairy Management Quiz"
          />
        </Field>
        <Field label="Program" error={errors.programme_id ?? programmesError ?? undefined}>
          <select
            className={inputClass}
            value={form.programme_id}
            onChange={(e) => update("programme_id", e.target.value)}
            disabled={programmes.length === 0}
          >
            <option value="">{programmes.length === 0 ? "No programs available" : "Select program"}</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Skill (optional)">
          <input
            className={inputClass}
            value={form.skill_name}
            onChange={(e) => update("skill_name", e.target.value)}
            placeholder="e.g. Milk Quality Testing"
          />
        </Field>
        <Field label="Total Questions" error={errors.total_questions}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.total_questions}
            onChange={(e) => update("total_questions", e.target.value)}
          />
        </Field>
        <Field label="Duration (minutes)" error={errors.duration_minutes}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.duration_minutes}
            onChange={(e) => update("duration_minutes", e.target.value)}
          />
        </Field>
        <Field label="Passing Score (%)" error={errors.passing_score}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.passing_score}
            onChange={(e) => update("passing_score", e.target.value)}
          />
        </Field>
        <Field label="Due Date (optional)">
          <input
            type="date"
            className={inputClass}
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
          />
        </Field>
        <Field label="Max Attempts" error={errors.max_attempts}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.max_attempts}
            onChange={(e) => update("max_attempts", e.target.value)}
          />
        </Field>
        <Field label="Show Answers">
          <select
            className={inputClass}
            value={form.show_answers}
            onChange={(e) => update("show_answers", e.target.value as FormState["show_answers"])}
          >
            {SHOW_ANSWERS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {serverError && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/admin/assessments"
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Assessment"}
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
