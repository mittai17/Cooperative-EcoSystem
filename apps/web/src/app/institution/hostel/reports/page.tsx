"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  ChevronRight,
  Download,
  Printer,
  FileText,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hostelService } from "@/lib/hostel/hostel-service";
import { exportToCSV } from "@/components/hostel/export-utils";

export default function HostelReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = [
    {
      id: "rep-occupancy",
      title: "Hostel Occupancy & Utilization Report",
      category: "Operations",
      description: "Comprehensive bed occupancy rates broken down by hostel, block, floor, and sharing room-type.",
      records: "640 Beds (74% Load)",
    },
    {
      id: "rep-allocation",
      title: "Active Room Allocations Master List",
      category: "Academic Linkage",
      description: "Cross-referenced matrix linking trainee registration codes, batch cohorts, and allocated bed IDs.",
      records: "472 Active Residents",
    },
    {
      id: "rep-checkin",
      title: "Daily Check-in & Arrival Audit Log",
      category: "Security",
      description: "Timestamped record of verified physical arrivals, identity validations, and key dispatches.",
      records: "34 Completed Today",
    },
    {
      id: "rep-attendance",
      title: "Night-Stay Hostel Attendance Summary",
      category: "Compliance",
      description: "Turnstile biometric logs and warden roll-call records showing present, absent, and on-leave trainees.",
      records: "91% Daily Attendance",
    },
    {
      id: "rep-maintenance",
      title: "Hostel Maintenance & Repair Register",
      category: "Engineering",
      description: "Breakdown tickets logged for plumbing, electrical, civil, and Wi-Fi infrastructure with resolution SLA.",
      records: "18 Open & Resolved",
    },
    {
      id: "rep-requests",
      title: "Pending Accommodation Nominations",
      category: "Admissions",
      description: "All candidate accommodation requests classified by cooperative federation and approval state.",
      records: "26 In Queue",
    },
  ];

  const handleDownload = (id: string, title: string) => {
    setDownloading(id);
    setTimeout(() => {
      exportToCSV(
        hostelService.getAllocations().slice(0, 30).map((a) => ({
          Report: title,
          "Allocation ID": a.allocationId,
          "Trainee": a.traineeName,
          "Batch": a.batch,
          "Room": a.roomNumber,
          "Bed": a.bedNumber,
          "Hostel": a.hostelName,
          "Status": a.status,
        })),
        id
      );
      setDownloading(null);
    }, 400);
  };

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
            <span className="text-foreground font-semibold">Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Hostel Intelligence & Audit Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Institutional statutory registers, audit trails, and exportable operational summaries for NCCT and auditors.
          </p>
        </div>
      </div>

      {/* REPORTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-2xl border bg-card shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b">
                <Badge variant="outline" className="text-[10px] font-semibold bg-muted/40">
                  {rep.category}
                </Badge>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {rep.records}
                </span>
              </div>
              <h3 className="font-bold text-base text-foreground mt-3 font-heading">{rep.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{rep.description}</p>
            </div>

            <div className="pt-4 border-t mt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs text-muted-foreground"
              >
                <Printer className="size-3.5 mr-1" /> Print
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownload(rep.id, rep.title)}
                disabled={downloading === rep.id}
                className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs"
              >
                <Download className="size-3.5 mr-1" />
                {downloading === rep.id ? "Generating..." : "Download CSV"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
