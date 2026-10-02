"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  ChevronRight,
  Clock,
  Shield,
  Utensils,
  CheckCircle2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function HostelSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [checkInTime, setCheckInTime] = useState("09:00 AM");
  const [checkOutTime, setCheckOutTime] = useState("11:00 AM");
  const [curfewTime, setCurfewTime] = useState("10:00 PM");
  const [autoWaitlist, setAutoWaitlist] = useState(true);
  const [requireId, setRequireId] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/institution/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Hostel Rules & Policy Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Operational timings, mandatory check-in checkpoints, mess schedules, and residential rules.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs self-start sm:self-auto"
        >
          <Save className="size-3.5 mr-1" /> Save Settings
        </Button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-4 text-emerald-600" />
          Settings successfully saved and propagated to warden dashboards.
        </div>
      )}

      {/* TIMING CONFIGURATION */}
      <div className="p-5 rounded-2xl border bg-card shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
          <Clock className="size-4 text-primary" /> Daily Schedule & Curfew Timings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs">Standard Check-in Time</Label>
            <Input
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Standard Check-out Time</Label>
            <Input
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Perimeter Gate Curfew</Label>
            <Input
              value={curfewTime}
              onChange={(e) => setCurfewTime(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* MESS SCHEDULE */}
      <div className="p-5 rounded-2xl border bg-card shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
          <Utensils className="size-4 text-primary" /> Dining Mess Timings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-muted/20 rounded-xl border">
            <span className="font-semibold text-foreground block">Breakfast</span>
            <span className="text-muted-foreground mt-1 block">07:30 AM &mdash; 09:00 AM</span>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl border">
            <span className="font-semibold text-foreground block">Lunch</span>
            <span className="text-muted-foreground mt-1 block">12:30 PM &mdash; 01:30 PM</span>
          </div>
          <div className="p-3 bg-muted/20 rounded-xl border">
            <span className="font-semibold text-foreground block">Dinner</span>
            <span className="text-muted-foreground mt-1 block">07:30 PM &mdash; 09:30 PM</span>
          </div>
        </div>
      </div>

      {/* SECURITY & RULES TOGGLES */}
      <div className="p-5 rounded-2xl border bg-card shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
          <Shield className="size-4 text-primary" /> Admissions & Check-in Rules
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground">Mandatory Government Photo ID at Check-in</div>
              <div className="text-muted-foreground">Trainees must present Aadhaar or Society card before key issue</div>
            </div>
            <Switch checked={requireId} onCheckedChange={setRequireId} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <div className="font-semibold text-foreground">Auto-Waitlist on Overcapacity</div>
              <div className="text-muted-foreground">Automatically place new applications on waitlist when block is 100% full</div>
            </div>
            <Switch checked={autoWaitlist} onCheckedChange={setAutoWaitlist} />
          </div>
        </div>
      </div>
    </div>
  );
}
