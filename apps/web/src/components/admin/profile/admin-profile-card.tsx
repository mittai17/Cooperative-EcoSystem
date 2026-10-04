"use client";

import { Pencil, UserRound } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { initials } from "@/components/admin/trainers/people-utils";
import { Button } from "@/components/ui/button";

/**
 * The admin API client has no endpoint for the signed-in admin's own profile
 * (GET or PATCH /admin/users/me), so this read-only card shows the default NCCT
 * admin profile. Edit Profile stays disabled until a profile update endpoint exists.
 */
const PROFILE = {
  fullName: "Admin User",
  email: "admin@ncct.gov.in",
  /** Display label for the signed-in admin. */
  roleLabel: "Super Admin",
};

export function AdminProfileCard() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserRound}
        title="Profile"
        description="Your administrator account details."
        action={
          <Button variant="outline" disabled title="Profile editing is not available yet">
            <Pencil className="size-4" aria-hidden="true" />
            Edit Profile
          </Button>
        }
      />

      <DemoBanner message="Profile service not available yet. Showing the default NCCT admin profile." />

      <section className="max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
          >
            {initials(PROFILE.fullName)}
          </span>
          <div className="min-w-0 text-center sm:text-left">
            <h2 className="font-heading text-xl font-bold text-foreground">{PROFILE.fullName}</h2>
            <span className="mt-1 inline-flex items-center rounded-full border border-primary/20 bg-tint-red-bg px-2.5 py-0.5 text-xs font-semibold text-tint-red-fg">
              {PROFILE.roleLabel}
            </span>
          </div>
        </div>

        <dl className="grid gap-5 border-t border-border p-6 sm:grid-cols-2 sm:p-8">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Full Name</dt>
            <dd className="text-sm font-semibold text-foreground">{PROFILE.fullName}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="break-all text-sm font-semibold text-foreground">{PROFILE.email}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd className="text-sm font-semibold text-foreground">{PROFILE.roleLabel}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
