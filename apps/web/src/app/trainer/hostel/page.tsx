"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Users,
  Bed,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bell,
  Eye,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hostelService } from "@/lib/hostel/hostel-service";

export default function TrainerHostelDashboard() {
  const [selectedBatch, setSelectedBatch] = useState("PDA-02");
  const summary = hostelService.getBatchHostelSummary(selectedBatch);
  const notices = hostelService.getNotices();

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER WITH BATCH SELECTOR (MATCHING IMAGE 3 PANEL 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/trainer/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">My Batch Hostel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            My Batch Hostel
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            View accommodation details for trainees in your assigned batches.
          </p>
        </div>

        {/* BATCH SELECTOR */}
        <div className="flex items-center gap-2">
          <Select value={selectedBatch} onValueChange={(v) => v && setSelectedBatch(v)}>
            <SelectTrigger className="h-9 text-xs w-64 bg-card font-semibold">
              <SelectValue placeholder="Select Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDA-02">PDA-02 &mdash; PACS Digital Accounting (12-25 Oct)</SelectItem>
              <SelectItem value="CMF-01">CMF-01 &mdash; Coop Management (10-24 Oct)</SelectItem>
              <SelectItem value="DCO-01">DCO-01 &mdash; Dairy Coop Operations (15-30 Oct)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TOP 6 KPIS (MATCHING IMAGE 3 PANEL 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-foreground">{summary.totalTrainees}</div>
            <div className="text-xs text-muted-foreground">Total Trainees</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bed className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-emerald-600">{summary.stayingInHostel}</div>
            <div className="text-xs text-muted-foreground">Staying in Hostel</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-amber-700">{summary.dayScholars}</div>
            <div className="text-xs text-muted-foreground">Day Scholars</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LogIn className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              94%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-foreground">{summary.checkedIn}</div>
            <div className="text-xs text-muted-foreground">Checked In</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="size-4.5" />
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
              6%
            </span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-purple-700">{summary.onLeave}</div>
            <div className="text-xs text-muted-foreground">On Leave</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border bg-card shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="size-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="size-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-foreground">{summary.pendingAllocation}</div>
            <div className="text-xs text-muted-foreground">Pending Allocation</div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: HOSTEL ALLOCATION OVERVIEW + BLOCK-WISE ALLOCATION (MATCHING IMAGE 3 PANEL 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Donut Chart */}
        <div className="lg:col-span-6 rounded-xl border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <h3 className="font-bold text-base text-foreground pb-2 border-b font-heading">
            Hostel Allocation Overview
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-3">
            <div className="relative size-32 shrink-0 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/30"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="86, 100"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-foreground font-heading">86%</span>
                <span className="text-[9px] font-medium text-muted-foreground">In Hostel</span>
              </div>
            </div>

            <div className="space-y-2 flex-1 w-full text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>Staying in Hostel</span>
                </div>
                <span className="font-bold">{summary.stayingInHostel}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span>Day Scholars</span>
                </div>
                <span className="font-bold">{summary.dayScholars}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-500" />
                  <span>Pending Allocation</span>
                </div>
                <span className="font-bold">{summary.pendingAllocation}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span>On Leave</span>
                </div>
                <span className="font-bold">{summary.onLeave}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Block-wise Allocation (PDA-02) */}
        <div className="lg:col-span-6 rounded-xl border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="font-bold text-base text-foreground font-heading">
              Block-wise Allocation ({selectedBatch})
            </h3>
            <Link href="/trainer/hostel/allocations" className="text-xs text-primary font-semibold hover:underline">
              View Roster &rarr;
            </Link>
          </div>

          <div className="space-y-3.5 pt-3">
            {[
              { block: "Block A", count: "14 / 20", percent: 70 },
              { block: "Block B", count: "10 / 12", percent: 83 },
              { block: "Block C", count: "8 / 10", percent: 80 },
              { block: "Block D", count: "4 / 8", percent: 50 },
            ].map((b) => (
              <div key={b.block} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground">{b.block}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px]">{b.count}</span>
                    <span className="font-bold text-emerald-600 w-8 text-right">{b.percent}%</span>
                  </div>
                </div>
                <Progress value={b.percent} className="h-2 bg-muted/60" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: RECENT HOSTEL UPDATES & IMPORTANT NOTICES (MATCHING IMAGE 3 PANEL 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Updates feed */}
        <div className="lg:col-span-6 rounded-xl border bg-card p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">Recent Hostel Updates</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-foreground">Sunita Sharma checked in to Room A-101</span>
                <span className="text-[11px] text-muted-foreground block">Today, 09:30 AM &bull; Duty Warden desk</span>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 text-[10px]">
                Check-in
              </Badge>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100">
              <Clock className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-foreground">Amit Gupta marked on leave</span>
                <span className="text-[11px] text-muted-foreground block">Today, 08:15 AM &bull; Gate Pass #884</span>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 text-[10px]">
                Leave
              </Badge>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100">
              <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-foreground">Room A-204 Issue Reported (Wi-Fi)</span>
                <span className="text-[11px] text-muted-foreground block">Yesterday, 08:20 PM &bull; Submitted by Ravindra Patil</span>
              </div>
              <Badge variant="outline" className="bg-rose-100 text-rose-800 text-[10px]">
                Issue
              </Badge>
            </div>
          </div>
        </div>

        {/* Right: Important Notices */}
        <div className="lg:col-span-6 rounded-xl border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Bell className="size-4 text-primary" /> Important Notices
            </h3>
            <Link href="/trainer/hostel/notices" className="text-xs text-primary font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            {notices.slice(0, 3).map((n) => (
              <div key={n.id} className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-xs">{n.title}</h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{n.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{n.publishDate}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
