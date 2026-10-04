"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
                SK
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">Dr. S. Kumar</CardTitle>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <ShieldCheck className="mr-1 size-3" /> NCCT Certified Trainer
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  Senior Faculty Member · PACS Digital Accounting & Cooperative Governance
                </CardDescription>
                <p className="mt-1 text-xs text-muted-foreground">Faculty ID: VAM-FAC-2026-088</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Official Email</p>
                    <p className="text-sm font-medium">s.kumar@vamnicom.gov.in</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Phone className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">+91 94220 18452</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <MapPin className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Institution Campus</p>
                    <p className="text-sm font-medium">VAMNICOM, Pune, Maharashtra</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <GraduationCap className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="text-sm font-medium">Ph.D. in Cooperative Management</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Subject Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">PACS Digital Accounting (PDA-02)</Badge>
                  <Badge variant="secondary">Cooperative Law & Statutory Audit</Badge>
                  <Badge variant="secondary">Microfinance & SHG Federation Management</Badge>
                  <Badge variant="secondary">Dairy Cooperative Operations</Badge>
                  <Badge variant="secondary">National Cooperative Policy Framework</Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Bio & Experience</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Over 16 years of academic and field-level cooperative training experience across NCCT institutions and RICMs.
                  Specialized in digital transformation of Primary Agricultural Credit Societies (PACS), compliance monitoring,
                  and modern accounting automation.
                </p>
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
                  <span className="font-bold text-foreground">128</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">Active Cohorts</span>
                  <span className="font-bold text-foreground">4 Cohorts</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">Trainees Mentored</span>
                  <span className="font-bold text-foreground">340+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trainee Feedback Score</span>
                  <span className="font-bold text-emerald-600">4.9 / 5.0 ★</span>
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
              <CardTitle>Assigned Batches & Programmes</CardTitle>
              <CardDescription>Current active batches under Dr. S. Kumar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">Diploma in Cooperative Business Management (DCBM-24)</h4>
                    <p className="text-xs text-muted-foreground">Module: PACS Computerisation & ERP Systems</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
                  <span>Batch Size: 48 Trainees</span>
                  <span>Schedule: Mon, Wed, Fri (10:00 AM - 12:00 PM)</span>
                  <span>Room: Hall A-201, VAMNICOM</span>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">PACS Digital Accounting Certificate (PDAC-12)</h4>
                    <p className="text-xs text-muted-foreground">Module: Statutory Audit & Tally Compliance</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
                  <span>Batch Size: 35 Trainees</span>
                  <span>Schedule: Tue, Thu (02:00 PM - 04:30 PM)</span>
                  <span>Room: Computer Lab 2</span>
                </div>
              </div>
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
