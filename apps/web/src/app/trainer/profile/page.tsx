"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MetricBar, initials } from "@/components/trainer/trainees/shared";
import { portalClasses, trainerProfile } from "@/lib/mock-data/trainer";

export default function TrainerProfilePage() {
  return (
    <Suspense fallback={null}>
      <TrainerProfileContent />
    </Suspense>
  );
}

function TrainerProfileContent() {
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as "overview" | "classes" | "settings" | null;
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "settings">(
    queryTab && ["overview", "classes", "settings"].includes(queryTab) ? queryTab : "overview"
  );
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [autoAttendanceSync, setAutoAttendanceSync] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveSettings = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Faculty Profile"
        description="View and manage your academic credentials, teaching specialties, and notification preferences."
      />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="size-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "classes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          Teaching & Batches
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="size-4" />
          Settings
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main info card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                {initials(trainerProfile.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{trainerProfile.name}</CardTitle>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <ShieldCheck className="mr-1 size-3" /> {trainerProfile.accreditation}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {trainerProfile.designation}
                </CardDescription>
                <p className="mt-1 text-xs text-muted-foreground">Faculty ID: {trainerProfile.employeeId}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Official Email</p>
                    <p className="text-sm font-medium">{trainerProfile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Phone className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{trainerProfile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <MapPin className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Institution Campus</p>
                    <p className="text-sm font-medium">{trainerProfile.campus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <GraduationCap className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="text-sm font-medium">{trainerProfile.qualification}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Subject Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {trainerProfile.specialisations.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Bio & Experience</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{trainerProfile.bio}</p>
              </div>
            </CardContent>
          </Card>

          {/* KPI metrics sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Teaching Statistics</CardTitle>
                <CardDescription>Academic Year 2025–2026</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">Total Sessions Taught</span>
                  <span className="font-bold text-foreground">{trainerProfile.stats.sessions_taught}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">Active Cohorts</span>
                  <span className="font-bold text-foreground">{trainerProfile.stats.active_cohorts} Cohorts</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">Trainees Mentored</span>
                  <span className="font-bold text-foreground">{trainerProfile.stats.trainees_mentored}+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trainee Feedback Score</span>
                  <span className="font-bold text-emerald-600">{trainerProfile.stats.feedback_score}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" render={<Link href="/trainer/attendance" />} className="justify-start">
                  <Clock className="mr-2 size-4" />
                  Launch QR Attendance
                </Button>
                <Button variant="outline" render={<Link href="/trainer/classes" />} className="justify-start">
                  <BookOpen className="mr-2 size-4" />
                  View Class Schedule
                </Button>
                <Button variant="outline" render={<Link href="/trainer/assessments/new" />} className="justify-start">
                  <Sparkles className="mr-2 size-4" />
                  Create Assessment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "classes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Batches &amp; Programmes</CardTitle>
              <CardDescription>Current active batches under {trainerProfile.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {portalClasses.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-foreground">{c.course}</h4>
                      <p className="text-xs text-muted-foreground">{c.category} · Batch {c.batch_label}</p>
                    </div>
                    <Badge variant={c.status_active ? "default" : "secondary"}>{c.status_active ? "Active" : "Completed"}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>{c.trainees} trainees</span>
                    <span>{c.schedule_days.join(", ")} ({c.start} - {c.end})</span>
                    <span>Room {c.room}, {c.venue}</span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MetricBar label="Syllabus covered" value={c.progress} />
                    <MetricBar label="Attendance" value={c.attendance} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Trainer Preferences & Settings</CardTitle>
            <CardDescription>Configure notifications and automated sync options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {savedNotice && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="size-4 shrink-0" />
                Settings updated successfully.
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Email Alerts for Class Submissions</Label>
                <p className="text-xs text-muted-foreground">Receive digest when trainees submit assignments or assessments</p>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">SMS Alert for Session Rescheduling</Label>
                <p className="text-xs text-muted-foreground">Get instant SMS alert if timetable sessions are adjusted</p>
              </div>
              <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Automatic Attendance Broadcast Sync</Label>
                <p className="text-xs text-muted-foreground">Sync attendance marks to institutional registry immediately upon session closure</p>
              </div>
              <Switch checked={autoAttendanceSync} onCheckedChange={setAutoAttendanceSync} />
            </div>

            <div className="border-t border-border pt-4 flex justify-end">
              <Button onClick={handleSaveSettings}>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
