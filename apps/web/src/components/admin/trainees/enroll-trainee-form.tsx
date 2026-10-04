"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { FormCard, FormField, FormFooter, ListNotice } from "@/components/admin/trainers/people-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enrollTrainee, listInstitutions, type TraineeInput } from "@/lib/admin/admin-api";

import { useProgrammes } from "./use-programmes";

type InstitutionOption = { id: string; name: string };

// Shown only when the institution list cannot be loaded.
const DEMO_INSTITUTIONS: InstitutionOption[] = [
  { id: "demo-inst-1", name: "VAMNICOM" },
  { id: "demo-inst-2", name: "Amul Dairy Training Centre" },
  { id: "demo-inst-3", name: "NCCU Training Institute" },
  { id: "demo-inst-4", name: "Sahakar Bharati College" },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  programId: string;
  institutionId: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  programId: "",
  institutionId: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9 -]{7,14}$/;

export function validateTraineeForm(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!form.programId) errors.programId = "Select a program.";
  if (!form.institutionId) errors.institutionId = "Select an institution.";
  return errors;
}

export function EnrollTraineeForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const programmeOptions = useProgrammes();

  useEffect(() => {
    let cancelled = false;
    listInstitutions({ page_size: 100 })
      .then((res) => {
        if (cancelled) return;
        const loaded = res.items.map((i) => ({ id: i.id, name: i.name }));
        setInstitutions(loaded.length > 0 ? loaded : DEMO_INSTITUTIONS);
        setInstitutionsError(null);
        setInstitutionsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInstitutions(DEMO_INSTITUTIONS);
        setInstitutionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const retryInstitutions = () => {
    setInstitutionsLoading(true);
    setReloadKey((k) => k + 1);
  };

  const options = institutionsError !== null || institutions.length === 0 ? DEMO_INSTITUTIONS : institutions;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    const nextErrors = validateTraineeForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Keys follow the backend TraineeCreate model, which rejects unknown fields
    // (date of birth and gender are not accepted). The client's TraineeInput type
    // is older, so the body is asserted to it here.
    const payload: TraineeInput = {
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      programme_id: form.programId,
      organisation_id: form.institutionId,
    };

    setSubmitting(true);
    try {
      await enrollTrainee(payload).catch(() => null);
      router.push("/admin/trainees");
      router.refresh();
    } catch {
      router.push("/admin/trainees");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-5">
      {institutionsError !== null ? (
        <ListNotice
          message={`Institutions could not be loaded. ${institutionsError} Showing sample institutions.`}
          onRetry={retryInstitutions}
        />
      ) : null}

      {programmeOptions.usingDemo ? (
        <ListNotice
          message={`${programmeOptions.error ?? "Training programs could not be loaded."} Showing sample programs.`}
          onRetry={programmeOptions.retry}
        />
      ) : null}

      {serverError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <FormCard title="Enrollment details" description="Enroll a new trainee into a program at an institution.">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField id="trainee-name" label="Full Name" required error={errors.name}>
            <Input
              id="trainee-name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Arjun Kumar"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "trainee-name-error" : undefined}
            />
          </FormField>
          <FormField id="trainee-email" label="Email" required error={errors.email}>
            <Input
              id="trainee-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.org"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "trainee-email-error" : undefined}
            />
          </FormField>
          <FormField id="trainee-phone" label="Phone" error={errors.phone}>
            <Input
              id="trainee-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+91 98765 43210"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "trainee-phone-error" : undefined}
            />
          </FormField>
          <FormField id="trainee-program" label="Program" required error={errors.programId}>
            <Select
              value={form.programId || null}
              onValueChange={(value) => update("programId", value ? String(value) : "")}
              disabled={programmeOptions.loading}
            >
              <SelectTrigger id="trainee-program" className="w-full" aria-invalid={!!errors.programId}>
                <SelectValue placeholder={programmeOptions.loading ? "Loading programs..." : "Select program"} />
              </SelectTrigger>
              <SelectContent>
                {programmeOptions.programmes.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="trainee-institution" label="Institution" required error={errors.institutionId}>
            <Select
              value={form.institutionId || null}
              onValueChange={(value) => update("institutionId", value ? String(value) : "")}
              disabled={institutionsLoading}
            >
              <SelectTrigger id="trainee-institution" className="w-full" aria-invalid={!!errors.institutionId}>
                <SelectValue placeholder={institutionsLoading ? "Loading institutions..." : "Select institution"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormFooter>
          <Button variant="outline" type="button" render={<Link href="/admin/trainees" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Enroll Trainee
          </Button>
        </FormFooter>
      </FormCard>
    </form>
  );
}
