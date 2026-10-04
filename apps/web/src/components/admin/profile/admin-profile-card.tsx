"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Pencil, UserRound } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { DemoBanner } from "@/components/admin/shared/demo-banner";
import { initials } from "@/components/admin/trainers/people-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AdminProfileCard() {
  const [profile, setProfile] = useState({
    fullName: "Admin User",
    email: "admin@ncct.gov.in",
    roleLabel: "Super Admin",
  });
  const [open, setOpen] = useState(false);
  const [nameInput, setNameInput] = useState(profile.fullName);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) return;
    setProfile((prev) => ({
      ...prev,
      fullName: nameInput.trim(),
      email: emailInput.trim(),
    }));
    setSavedSuccess(true);
    setOpen(false);
    setTimeout(() => setSavedSuccess(false), 4000);
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={UserRound}
        title="Profile"
        description="Your administrator account details."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setNameInput(profile.fullName);
              setEmailInput(profile.email);
              setOpen(true);
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit Profile
          </Button>
        }
      />

      {savedSuccess ? (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
          Profile updated successfully.
        </div>
      ) : null}

      <DemoBanner message="Profile service connected in demo mode. Showing administrator account profile." />

      <section className="max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
          >
            {initials(profile.fullName)}
          </span>
          <div className="min-w-0 text-center sm:text-left">
            <h2 className="font-heading text-xl font-bold text-foreground">{profile.fullName}</h2>
            <span className="mt-1 inline-flex items-center rounded-full border border-primary/20 bg-tint-red-bg px-2.5 py-0.5 text-xs font-semibold text-tint-red-fg">
              {profile.roleLabel}
            </span>
          </div>
        </div>

        <dl className="grid gap-5 border-t border-border p-6 sm:grid-cols-2 sm:p-8">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Full Name</dt>
            <dd className="text-sm font-semibold text-foreground">{profile.fullName}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="break-all text-sm font-semibold text-foreground">{profile.email}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd className="text-sm font-semibold text-foreground">{profile.roleLabel}</dd>
          </div>
        </dl>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Admin Profile</DialogTitle>
              <DialogDescription>Update your display name and email address.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                <span>Full Name</span>
                <Input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Admin Name"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                <span>Email Address</span>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@ncct.gov.in"
                  required
                />
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
