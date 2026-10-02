"use client";

import { useState } from "react";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Bell,
  Globe,
  Lock,
  Check,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Demo data ─────────────────────────────────────────────────────────────────

const USER = {
  name: "Ravindra S. Patil",
  email: "ravindra.patil@coopsetu.ai",
  phone: "+91 98234 56789",
  location: "Pune, Maharashtra",
  rollNo: "T-2026-0042",
  joinedDate: "March 2026",
  initials: "RP",
};

const ENROLLMENTS = [
  {
    id: "e1",
    programme: "Cooperative Management Fundamentals",
    institution: "VAMNICOM, Pune",
    status: "Active",
    startDate: "Apr 2026",
    endDate: "Jul 2026",
    grade: null,
  },
  {
    id: "e2",
    programme: "Dairy Operations & Quality Control",
    institution: "NDRI Extension Centre, Karnal",
    status: "Completed",
    startDate: "Jan 2026",
    endDate: "Mar 2026",
    grade: "A",
  },
  {
    id: "e3",
    programme: "Bookkeeping with Tally (Basics)",
    institution: "IFFCO Training Division",
    status: "Completed",
    startDate: "Oct 2025",
    endDate: "Dec 2025",
    grade: "B+",
  },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        status === "Active"
          ? "border-success/30 bg-success/10 text-success"
          : "border-muted bg-muted/40 text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  return (
    <div className="space-y-8">
      {/* Avatar + basic info */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <Avatar className="size-20">
              <AvatarFallback className="bg-tint-blue-bg text-2xl font-bold text-tint-blue-fg">
                {USER.initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90"
              aria-label="Change photo"
            >
              <Camera className="size-3" />
            </button>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-lg font-bold text-foreground">{USER.name}</p>
            <p className="text-sm text-muted-foreground">Roll No: {USER.rollNo}</p>
            <p className="mt-1 text-xs text-muted-foreground">Member since {USER.joinedDate}</p>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" defaultValue={USER.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">
              <Phone className="mr-1 inline size-3.5" />
              Phone
            </Label>
            <Input id="p-phone" defaultValue={USER.phone} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">
              <Mail className="mr-1 inline size-3.5" />
              Email
            </Label>
            <Input id="p-email" type="email" defaultValue={USER.email} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-location">
              <MapPin className="mr-1 inline size-3.5" />
              Location
            </Label>
            <Input id="p-location" defaultValue={USER.location} />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button size="sm">Save changes</Button>
        </div>
      </Card>

      {/* Programme enrolment history */}
      <div>
        <SectionHeading icon={GraduationCap}>Programme Enrolment History</SectionHeading>
        <div className="mt-3 space-y-3">
          {ENROLLMENTS.map((e) => (
            <Card key={e.id} className="flex items-center gap-4 p-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-semibold text-foreground">{e.programme}</p>
                <p className="text-xs text-muted-foreground">{e.institution}</p>
                <p className="text-xs text-muted-foreground">
                  {e.startDate} – {e.endDate}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge status={e.status} />
                {e.grade && (
                  <span className="text-xs font-semibold text-foreground">Grade: {e.grade}</span>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab() {
  const [notifications, setNotifications] = useState({
    assessments: true,
    jobs: true,
    certificates: false,
    marketing: false,
  });
  const [language, setLanguage] = useState<"EN" | "HI">("EN");

  return (
    <div className="space-y-6">
      {/* Notification preferences */}
      <Card className="p-6">
        <SectionHeading icon={Bell}>Notification Preferences</SectionHeading>
        <div className="mt-4 space-y-4">
          {(
            [
              { key: "assessments", label: "Assessment reminders", desc: "Upcoming quizzes and deadlines" },
              { key: "jobs", label: "New job matches", desc: "Jobs matching your Skill Passport" },
              { key: "certificates", label: "Certificate updates", desc: "Issue and renewal alerts" },
              { key: "marketing", label: "Platform news", desc: "New features and announcements" },
            ] as const
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={notifications[key]}
                onCheckedChange={(v) =>
                  setNotifications((prev) => ({ ...prev, [key]: v }))
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Language */}
      <Card className="p-6">
        <SectionHeading icon={Globe}>Language</SectionHeading>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose your preferred interface language (full localization in v2).
        </p>
        <div className="mt-4 flex gap-3">
          {(["EN", "HI"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition",
                language === lang
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {language === lang && <Check className="size-3.5" />}
              {lang === "EN" ? "English" : "हिन्दी"}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Security tab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <Card className="p-6">
      <SectionHeading icon={Lock}>Change Password</SectionHeading>
      <p className="mt-1 text-xs text-muted-foreground">
        Password changes require backend integration — UI preview only.
      </p>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw-current">Current password</Label>
          <Input id="pw-current" type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-new">New password</Label>
          <Input id="pw-new" type="password" placeholder="At least 8 characters" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm">Confirm new password</Label>
          <Input id="pw-confirm" type="password" placeholder="Repeat new password" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" disabled>
            Update password (demo)
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal info, enrolments, and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
