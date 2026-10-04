"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createAssessment, type AssessmentInput, type Programme } from "@/lib/admin/admin-api";
import { SHOW_ANSWERS_OPTIONS } from "@/components/admin/assessments/assessment-data";
import { fetchAllProgrammes } from "@/components/admin/programmes/admin-helpers";
import {
  FormActions,
  FormCard,
  FormField,
  inputClass,
} from "@/components/admin/programmes/admin-ui";

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

import { DEMO_PROGRAMMES } from "@/components/admin/programmes/programme-data";

export function CreateAssessmentForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>(DEMO_PROGRAMMES);
  const [programmesError, setProgrammesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllProgrammes()
      .then((rows) => {
        if (!cancelled) {
          setProgrammes(rows && rows.length > 0 ? rows : DEMO_PROGRAMMES);
          setProgrammesError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setProgrammes(DEMO_PROGRAMMES);
          setProgrammesError(err instanceof Error ? err.message : "Could not load programs");
        }
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
      }).catch(() => null);
      router.push("/admin/assessments");
      router.refresh();
    } catch {
      router.push("/admin/assessments");
    }
  }

  return (
    <FormCard
      title="Assessment details"
      description="Set the questions, timing and pass mark for a program assessment."
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label="Assessment Title" required error={errors.title} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Dairy Management Quiz"
          />
        </FormField>
        <FormField label="Program" required error={errors.programme_id ?? programmesError ?? undefined}>
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
        </FormField>
        <FormField label="Skill (optional)">
          <input
            className={inputClass}
            value={form.skill_name}
            onChange={(e) => update("skill_name", e.target.value)}
            placeholder="e.g. Milk Quality Testing"
          />
        </FormField>
        <FormField label="Total Questions" required error={errors.total_questions}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.total_questions}
            onChange={(e) => update("total_questions", e.target.value)}
          />
        </FormField>
        <FormField label="Duration (minutes)" required error={errors.duration_minutes}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.duration_minutes}
            onChange={(e) => update("duration_minutes", e.target.value)}
          />
        </FormField>
        <FormField label="Passing Score (%)" required error={errors.passing_score}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.passing_score}
            onChange={(e) => update("passing_score", e.target.value)}
          />
        </FormField>
        <FormField label="Due Date (optional)">
          <input
            type="date"
            className={inputClass}
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
          />
        </FormField>
        <FormField label="Max Attempts" required error={errors.max_attempts}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.max_attempts}
            onChange={(e) => update("max_attempts", e.target.value)}
          />
        </FormField>
        <FormField label="Show Answers">
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
        </FormField>
      </div>

      <FormActions
        cancelHref="/admin/assessments"
        submitting={submitting}
        submitLabel="Create Assessment"
        submittingLabel="Creating..."
        serverError={serverError}
      />
    </FormCard>
  );
}
