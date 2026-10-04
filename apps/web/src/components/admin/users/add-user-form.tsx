"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { errorMessage } from "@/components/admin/trainers/people-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, type UserInput } from "@/lib/admin/admin-api";

import { ROLE_OPTIONS, roleParam } from "./user-roles";

type FormState = {
  name: string;
  email: string;
  role: string;
};

const EMPTY: FormState = { name: "", email: "", role: "" };

type Errors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUserForm(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (!form.role) errors.role = "Select a role.";
  return errors;
}

export function AddUserForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    const nextErrors = validateUserForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Keys follow the backend UserCreate model. Admin-created users are invite records:
    // authentication is handled by Clerk, so no password is collected or sent.
    // The client's UserInput type is older (it still lists the sub-roles), so the body
    // is asserted to it here.
    const role = roleParam(form.role);
    if (!role) return;
    const payload: UserInput = {
      full_name: form.name.trim(),
      email: form.email.trim(),
      role,
    };

    setSubmitting(true);
    try {
      await createUser(payload);
      router.push("/admin/user-management");
      router.refresh();
    } catch (err: unknown) {
      setServerError(errorMessage(err, "Could not create the user. Please try again."));
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      {serverError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field id="user-name" label="Full Name" error={errors.name}>
          <Input id="user-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Priya Singh" aria-invalid={!!errors.name} />
        </Field>
        <Field id="user-email" label="Email" error={errors.email}>
          <Input id="user-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@ncct.gov.in" aria-invalid={!!errors.email} />
        </Field>
        <Field id="user-role" label="Role" error={errors.role}>
          <Select value={form.role || null} onValueChange={(value) => update("role", value ? String(value) : "")}>
            <SelectTrigger id="user-role" className="w-full" aria-invalid={!!errors.role}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
        <Button variant="outline" type="button" render={<Link href="/admin/user-management" />}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Create User
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
