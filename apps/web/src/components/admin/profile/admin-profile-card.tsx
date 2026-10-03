"use client";

import { Pencil, UserRound } from "lucide-react";
import { useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { initials } from "@/components/admin/trainers/people-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
};

/**
 * The admin API client has no endpoint for the signed-in admin's own profile
 * (GET or PATCH /admin/users/me), so this card shows the default NCCT admin
 * profile and cannot persist edits yet.
 */
const DEFAULT_PROFILE: Profile = {
  fullName: "Admin User",
  email: "admin@ncct.gov.in",
  phone: "",
  role: "Admin",
};

export function AdminProfileCard() {
  const [saved] = useState<Profile>(DEFAULT_PROFILE);
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);

  const startEdit = () => {
    setDraft(saved);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(saved);
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserRound}
        title="Profile"
        description="Your administrator account details."
        action={
          editing ? null : (
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="size-4" />
              Edit Profile
            </Button>
          )
        }
      />

      <DemoBanner message="Profile service not available yet. Showing the default NCCT admin profile." />

      <section className="max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            <span
              aria-label="Profile avatar"
              className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
            >
              {initials(saved.fullName)}
            </span>
            <span className="text-xs font-semibold text-primary">{saved.role}</span>
          </div>

          <dl className="grid flex-1 gap-5 sm:grid-cols-2">
            <ProfileField id="profile-name" label="Full Name" value={saved.fullName} draft={draft.fullName} editing={editing} onChange={(v) => setDraft((d) => ({ ...d, fullName: v }))} />
            <ProfileField id="profile-email" label="Email" type="email" value={saved.email} draft={draft.email} editing={editing} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} />
            <ProfileField id="profile-phone" label="Phone" type="tel" value={saved.phone} draft={draft.phone} editing={editing} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} />
            <div className="space-y-1.5">
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd className="text-sm font-semibold text-foreground">{saved.role}</dd>
            </div>
          </dl>
        </div>

        {editing ? (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
            <p className="mr-auto text-xs text-muted-foreground">
              Saving profile changes is not available yet because no profile update endpoint exists.
            </p>
            <Button variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button disabled title="Profile updates are not available yet">
              Save Changes
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ProfileField({
  id,
  label,
  value,
  draft,
  editing,
  type = "text",
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  draft: string;
  editing: boolean;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {editing ? (
        <>
          <Label htmlFor={id}>{label}</Label>
          <Input id={id} type={type} value={draft} onChange={(e) => onChange(e.target.value)} />
        </>
      ) : (
        <>
          <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
          <dd className="text-sm font-semibold text-foreground">{value || "Not set"}</dd>
        </>
      )}
    </div>
  );
}
