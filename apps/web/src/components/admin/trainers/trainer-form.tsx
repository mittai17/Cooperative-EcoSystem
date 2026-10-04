"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrainer, listInstitutions, type TrainerInput } from "@/lib/admin/admin-api";

import { FormCard, FormField, FormFooter, ListNotice } from "./people-ui";
import { errorMessage } from "./people-utils";

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
  institutionId: string;
  qualification: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  institutionId: "",
  qualification: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9 -]{7,14}$/;

export function validateTrainerForm(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!form.institutionId) errors.institutionId = "Select an institution.";
  return errors;
}

export function AddTrainerForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(true);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listInstitutions({ page_size: 100 })
      .then((res) => {
        if (cancelled) return;
        setInstitutions(res.items.map((i) => ({ id: i.id, name: i.name })));
        setInstitutionsError(null);
        setInstitutionsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setInstitutionsError(errorMessage(err, "Could not load institutions."));
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

  const options = institutionsError !== null ? DEMO_INSTITUTIONS : institutions;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    const nextErrors = validateTrainerForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Keys follow the backend TrainerCreate model, which rejects unknown fields.
    // The client's TrainerInput type is older, so the body is asserted to it here.
    const payload: TrainerInput = {
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      organisation_id: form.institutionId,
      qualification: form.qualification.trim() || null,
    };

    setSubmitting(true);
    try {
      await createTrainer(payload);
      router.push("/admin/trainers");
      router.refresh();
    } catch (err: unknown) {
      setServerError(errorMessage(err, "Could not create the trainer. Please try again."));
      setSubmitting(false);
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

      {serverError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <FormCard title="Trainer details" description="Register a new trainer and link them to an institution.">
        <div className="grid gap-5 md:grid-cols-2">
          <FormField id="trainer-name" label="Full Name" required error={errors.name}>
            <Input
              id="trainer-name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Dr. Meera Shah"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "trainer-name-error" : undefined}
            />
          </FormField>
          <FormField id="trainer-email" label="Email" required error={errors.email}>
            <Input
              id="trainer-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@institution.org"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "trainer-email-error" : undefined}
            />
          </FormField>
          <FormField id="trainer-phone" label="Phone Number" error={errors.phone}>
            <Input
              id="trainer-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+91 98765 43210"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "trainer-phone-error" : undefined}
            />
          </FormField>
          <FormField id="trainer-institution" label="Institution" required error={errors.institutionId}>
            <Select
              value={form.institutionId || null}
              onValueChange={(value) => update("institutionId", value ? String(value) : "")}
              disabled={institutionsLoading}
            >
              <SelectTrigger id="trainer-institution" className="w-full" aria-invalid={!!errors.institutionId}>
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
          <FormField id="trainer-qualification" label="Qualification" error={errors.qualification}>
            <Input
              id="trainer-qualification"
              value={form.qualification}
              onChange={(e) => update("qualification", e.target.value)}
              placeholder="e.g. MBA (Cooperative Management)"
            />
          </FormField>
        </div>

        <FormFooter>
          <Button variant="outline" type="button" render={<Link href="/admin/trainers" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Create Trainer
          </Button>
        </FormFooter>
      </FormCard>
    </form>
  );
}
