"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  TrendingUp,
  Building2,
  Users,
  BedDouble,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hostelService } from "@/lib/hostel/hostel-service";
import { exportToCSV } from "@/components/hostel/export-utils";

export default function OccupancyAnalyticsPage() {
  const stats = hostelService.getStats();
  const [filterPeriod, setFilterPeriod] = useState<"month" | "quarter" | "year">("month");

  return (
    <div className="space-y-6 pb-12">
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
            <span className="text-foreground font-semibold">Occupancy Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Occupancy Analytics & Trends
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Historical residential load factors, seasonal intake predictions, and capacity forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg text-xs font-semibold">
            {(["month", "quarter", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriod(p)}
                className={`px-3 py-1 rounded-md capitalize ${
                  filterPeriod === p ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportToCSV(
                stats.blockOccupancy.map((b) => ({
                  "Block": b.name,
                  "Occupied": b.occupied,
                  "Total": b.total,
                  "Rate": `${b.percent}%`,
                })),
                "occupancy_analytics"
              )
            }
            className="text-xs font-semibold"
          >
            <Download className="size-3.5 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <span className="text-xs text-muted-foreground">Current Occupancy Rate</span>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.overallOccupancyRate}%</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="size-3" /> +3.2% from previous cohort
          </span>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <span className="text-xs text-muted-foreground">Peak Intake Forecast</span>
          <div className="text-2xl font-bold text-foreground mt-1">88%</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Expected Nov 2026 (PACS Summit)</span>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <span className="text-xs text-muted-foreground">Active Resident Trainees</span>
          <div className="text-2xl font-bold text-primary mt-1">{stats.occupiedBeds}</div>
          <span className="text-[11px] text-muted-foreground mt-1 block">Across 5 hostels and 11 blocks</span>
        </div>

        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <span className="text-xs text-muted-foreground">Buffer Reserve Capacity</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableBeds} Beds</div>
          <span className="text-[11px] text-emerald-700 mt-1 block">Ready for immediate check-in</span>
        </div>
      </div>

      {/* HISTORICAL TRENDS & ROOM TYPE UTILIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Occupancy Trend (Jul - Nov) */}
        <div className="lg:col-span-8 rounded-xl border bg-card p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-bold text-base text-foreground font-heading">Monthly Occupancy Rate Trend</h3>
              <p className="text-xs text-muted-foreground">Seasonal accommodation absorption rate (2026)</p>
            </div>
            <Badge className="bg-red-50 text-red-700 border-red-200">ERP Verified</Badge>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { month: "Jul 2026", rate: 68, beds: 435 },
              { month: "Aug 2026", rate: 71, beds: 454 },
              { month: "Sep 2026", rate: 73, beds: 467 },
              { month: "Oct 2026 (Current)", rate: 74, beds: 472 },
              { month: "Nov 2026 (Projected)", rate: 78, beds: 499 },
            ].map((m) => (
              <div key={m.month} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">{m.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-[11px]">{m.beds} occupied</span>
                    <span className="text-primary font-bold">{m.rate}%</span>
                  </div>
                </div>
                <Progress value={m.rate} className="h-2.5 bg-muted/60" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Room Type Utilization */}
        <div className="lg:col-span-4 rounded-xl border bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground font-heading pb-2 border-b">
              Room Type Utilization
            </h3>
            <div className="space-y-4 pt-4">
              {[
                { type: "Double Sharing", rate: 93, count: "28 / 30" },
                { type: "4 Sharing", rate: 86, count: "138 / 160" },
                { type: "6 Sharing", rate: 72, count: "72 / 100" },
                { type: "8 Sharing", rate: 64, count: "64 / 100" },
              ].map((rt) => (
                <div key={rt.type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{rt.type}</span>
                    <span className="text-foreground">{rt.rate}%</span>
                  </div>
                  <Progress value={rt.rate} className="h-2 bg-muted/60" />
                  <span className="text-[10px] text-muted-foreground">{rt.count} units occupied</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t mt-4 text-xs text-muted-foreground">
            Highest trainee preference observed in 4 Sharing and Double Sharing units.
          </div>
        </div>
      </div>
    </div>
  );
}
