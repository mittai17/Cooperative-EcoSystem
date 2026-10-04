"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/admin/admin-api";
import { JOB_SECTORS } from "@/components/admin/jobs/job-data";
import {
  FormActions,
  FormCard,
  FormField,
  inputClass,
  textareaClass,
} from "@/components/admin/programmes/admin-ui";

interface FormState {
  title: string;
  employer: string;
  sector: string;
  location: string;
  description: string;
}

const EMPTY: FormState = { title: "", employer: "", sector: "", location: "", description: "" };

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
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
      await createJob({
        title: form.title.trim(),
        employer_name: form.employer.trim(),
        sector: form.sector,
        location: form.location.trim(),
        description: form.description.trim() || null,
        status: "open",
      }).catch(() => null);
      router.push("/admin/jobs-placements");
      router.refresh();
    } catch {
      router.push("/admin/jobs-placements");
    }
  }

  return (
    <FormCard
      title="Job details"
      description="Describe the opening and the employer who is hiring."
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label="Job Title" required error={errors.title} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Dairy Quality Analyst"
          />
        </FormField>
        <FormField label="Employer" required error={errors.employer}>
          <input
            className={inputClass}
            value={form.employer}
            onChange={(e) => update("employer", e.target.value)}
            placeholder="e.g. Amul Dairy"
          />
        </FormField>
        <FormField label="Sector" required error={errors.sector}>
          <select className={inputClass} value={form.sector} onChange={(e) => update("sector", e.target.value)}>
            <option value="">Select sector</option>
            {JOB_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Location" required error={errors.location} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Anand, Gujarat"
          />
        </FormField>
        <FormField label="Description" required error={errors.description} className="md:col-span-2">
          <textarea
            rows={5}
            className={textareaClass}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Role responsibilities, eligibility and expected skills."
          />
        </FormField>
      </div>

      <FormActions
        cancelHref="/admin/jobs-placements"
        submitting={submitting}
        submitLabel="Post Job"
        submittingLabel="Posting..."
        serverError={serverError}
      />
    </FormCard>
  );
}
