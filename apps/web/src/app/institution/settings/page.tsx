"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Building,
  Bell,
  Shield,
  Database,
  Sliders,
  QrCode,
  Lock,
  Clock,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StoredSettings {
  emailAlerts?: boolean;
  autoBatchSync?: boolean;
  kioskSync?: boolean;
  attendanceAlerts?: boolean;
  minAttendancePct?: string;
  qrRefreshInterval?: string;
}

function getStoredSettings(): StoredSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("nurvex_institution_settings");
    return stored ? (JSON.parse(stored) as StoredSettings) : null;
  } catch {
    return null;
  }
}

export default function InstitutionSettingsPage() {
  const [activeTab, setActiveTab] = useState("campus");

  // State
  const [emailAlerts, setEmailAlerts] = useState(() => getStoredSettings()?.emailAlerts ?? true);
  const [autoBatchSync, setAutoBatchSync] = useState(() => getStoredSettings()?.autoBatchSync ?? true);
  const [kioskSync, setKioskSync] = useState(() => getStoredSettings()?.kioskSync ?? true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(() => getStoredSettings()?.attendanceAlerts ?? true);
  const [hostelSms, setHostelSms] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(true);

  const [minAttendancePct, setMinAttendancePct] = useState(() => getStoredSettings()?.minAttendancePct ?? "75");
  const [qrRefreshInterval, setQrRefreshInterval] = useState(() => getStoredSettings()?.qrRefreshInterval ?? "45");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [operatingHours, setOperatingHours] = useState("08:30 AM - 05:30 PM");

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const payload = {
      emailAlerts,
      autoBatchSync,
      kioskSync,
      attendanceAlerts,
      hostelSms,
      dailyDigest,
      offlineSync,
      mfaRequired,
      minAttendancePct,
      qrRefreshInterval,
      sessionTimeout,
      operatingHours,
    };
    try {
      localStorage.setItem("nurvex_institution_settings", JSON.stringify(payload));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Institution Settings"
        description="Configure operational preferences, automated sync mechanisms, and administrative policy parameters."
        action={
          <Button onClick={handleSave} className="gap-2">
            <Save className="size-4" /> Save Settings
          </Button>
        }
      />

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          Settings updated and stored in institutional configuration.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="campus" className="gap-1.5">
            <Building className="size-4" /> Campus & Rules
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="size-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="kiosks" className="gap-1.5">
            <QrCode className="size-4" /> Kiosks & Sync
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Lock className="size-4" /> Security & Access
          </TabsTrigger>
        </TabsList>

        {/* Campus & Rules */}
        <TabsContent value="campus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Academic & Campus Operational Rules</CardTitle>
              <CardDescription>Configure core academic thresholds and scheduling defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Minimum Attendance for Certification (%)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min="50"
                    max="100"
                    value={minAttendancePct}
                    onChange={(e) => setMinAttendancePct(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    NCCT mandates minimum 75% for government-subsidized trainee batches.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Campus Standard Operating Hours</Label>
                  <Input
                    className="mt-1"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Operational window for lecture halls, biometric kiosks, and workshops.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Automatic Timetable Sync</Label>
                  <p className="text-xs text-muted-foreground">
                    Publish classroom allocations automatically to faculty and trainee calendars.
                  </p>
                </div>
                <Switch checked={autoBatchSync} onCheckedChange={setAutoBatchSync} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Automated Notifications & Circulars</CardTitle>
              <CardDescription>Alert triggers for admissions, attendance defaulters, and hostel events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Nomination Decision Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Email nominating cooperative societies whenever a trainee seat is sanctioned or waitlisted.
                  </p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Attendance Defaulter Warning</Label>
                  <p className="text-xs text-muted-foreground">
                    Trigger SMS warning to trainee and their sponsoring society if attendance drops below 75%.
                  </p>
                </div>
                <Switch checked={attendanceAlerts} onCheckedChange={setAttendanceAlerts} />
              </div>

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Hostel Check-in & Gate Pass Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Notify campus warden when trainees check in after evening curfew hours (09:30 PM).
                  </p>
                </div>
                <Switch checked={hostelSms} onCheckedChange={setHostelSms} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Daily Director Digest</Label>
                  <p className="text-xs text-muted-foreground">
                    Send end-of-day summary of active cohorts, attendance stats, and incidents to executive leadership.
                  </p>
                </div>
                <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kiosks & Sync */}
        <TabsContent value="kiosks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Campus Kiosks & Hardware Integration</CardTitle>
              <CardDescription>Biometric terminals, QR scanners, and offline-first cache settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Biometric Kiosk Verification</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow campus entrance terminals to verify fingerprint and Aadhaar FaceRD attendance.
                  </p>
                </div>
                <Switch checked={kioskSync} onCheckedChange={setKioskSync} />
              </div>

              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Offline Sync Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable local SQLite buffer for classroom scanners during campus network outages.
                  </p>
                </div>
                <Switch checked={offlineSync} onCheckedChange={setOfflineSync} />
              </div>

              <div className="w-full sm:w-1/2">
                <Label className="text-xs font-semibold">Dynamic Attendance QR Refresh Rate (seconds)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min="15"
                  max="120"
                  value={qrRefreshInterval}
                  onChange={(e) => setQrRefreshInterval(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Interval before projecting a fresh cryptographic token to prevent QR photo sharing.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Access */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Security, Sessions & Compliance</CardTitle>
              <CardDescription>NCCT statutory compliance, authentication policies, and data audit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Label className="font-semibold text-foreground text-sm">Enforce 2FA for Faculty & Evaluators</Label>
                  <p className="text-xs text-muted-foreground">
                    Require OTP or security key when submitting assessment grades and certificate approvals.
                  </p>
                </div>
                <Switch checked={mfaRequired} onCheckedChange={setMfaRequired} />
              </div>

              <div className="w-full sm:w-1/2">
                <Label className="text-xs font-semibold">Portal Inactivity Timeout (minutes)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min="5"
                  max="120"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Automatically lock terminal if unoperated to protect confidential trainee records.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
