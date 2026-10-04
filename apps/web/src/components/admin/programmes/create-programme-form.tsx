"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProgramme } from "@/lib/admin/admin-api";
import { PROGRAMME_MODES, PROGRAMME_SECTORS } from "@/components/admin/programmes/programme-data";
import {
  FormActions,
  FormCard,
  FormField,
  inputClass,
  textareaClass,
} from "@/components/admin/programmes/admin-ui";

interface FormState {
  title: string;
  sector: string;
  duration_weeks: string;
  mode: string;
  seats_total: string;
  description: string;
}

const EMPTY: FormState = {
  title: "",
  sector: "",
  duration_weeks: "",
  mode: "offline",
  seats_total: "",
  description: "",
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.title.trim().length < 3) errors.title = "Enter a program name (at least 3 characters).";
  if (!form.sector) errors.sector = "Choose a category.";
  const weeks = Number(form.duration_weeks);
  if (!form.duration_weeks.trim() || !Number.isInteger(weeks) || weeks < 1 || weeks > 520) {
    errors.duration_weeks = "Enter whole weeks between 1 and 520.";
  }
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
      }).catch(() => null);
      router.push("/admin/programmes");
      router.refresh();
    } catch {
      router.push("/admin/programmes");
    }
  }

  return (
    <FormCard
      title="Program details"
      description="Enter the name, category, duration and delivery mode of the program."
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label="Program Name" required error={errors.title} className="md:col-span-2">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Dairy Management"
          />
        </FormField>
        <FormField label="Category" required error={errors.sector}>
          <select className={inputClass} value={form.sector} onChange={(e) => update("sector", e.target.value)}>
            <option value="">Select category</option>
            {PROGRAMME_SECTORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Duration (weeks)" required error={errors.duration_weeks}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.duration_weeks}
            onChange={(e) => update("duration_weeks", e.target.value)}
            placeholder="e.g. 12"
          />
        </FormField>
        <FormField label="Mode">
          <select className={inputClass} value={form.mode} onChange={(e) => update("mode", e.target.value)}>
            {PROGRAMME_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Total Seats" required error={errors.seats_total}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={form.seats_total}
            onChange={(e) => update("seats_total", e.target.value)}
            placeholder="e.g. 60"
          />
        </FormField>
        <FormField label="Description" error={errors.description} className="md:col-span-2">
          <textarea
            rows={4}
            className={textareaClass}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="What will trainees learn in this program?"
          />
        </FormField>
      </div>

      <FormActions
        cancelHref="/admin/programmes"
        submitting={submitting}
        submitLabel="Create Program"
        submittingLabel="Creating..."
        serverError={serverError}
      />
    </FormCard>
  );
}
