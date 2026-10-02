"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  Download,
  Calendar,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/components/hostel/export-utils";

export default function TrainerAttendancePage() {
  const [selectedBatch, setSelectedBatch] = useState("PDA-02");
  const [search, setSearch] = useState("");
  const [marked, setMarked] = useState(false);

  const sampleRows = [
    { id: 1, name: "Ravindra S. Patil", room: "A-204", bed: "02", hostel: "Main Hostel", status: "Present", markedAt: "12 Oct 09:00 AM", remarks: "-" },
    { id: 2, name: "Sunita Sharma", room: "A-101", bed: "01", hostel: "Women's Hostel", status: "Present", markedAt: "12 Oct 09:05 AM", remarks: "-" },
    { id: 3, name: "Amit Gupta", room: "B-103", bed: "01", hostel: "Main Hostel", status: "On Leave", markedAt: "-", remarks: "Out for family event" },
    { id: 4, name: "Priya Nair", room: "A-102", bed: "02", hostel: "Women's Hostel", status: "Present", markedAt: "12 Oct 09:15 AM", remarks: "-" },
    { id: 5, name: "Vikram Solanki", room: "B-201", bed: "03", hostel: "Main Hostel", status: "Present", markedAt: "12 Oct 09:05 AM", remarks: "-" },
    { id: 6, name: "Neha Sharma", room: "C-101", bed: "04", hostel: "Women's Hostel", status: "Absent", markedAt: "-", remarks: "Not in hostel" },
    { id: 7, name: "Deepak Chauhan", room: "C-101", bed: "01", hostel: "Main Hostel", status: "Present", markedAt: "12 Oct 09:10 AM", remarks: "-" },
    { id: 8, name: "Anjali Rathore", room: "B-104", bed: "02", hostel: "Women's Hostel", status: "Present", markedAt: "12 Oct 09:08 AM", remarks: "-" },
    { id: 9, name: "Ramesh Kumar", room: "A-101", bed: "01", hostel: "Main Hostel", status: "Present", markedAt: "12 Oct 09:12 AM", remarks: "-" },
    { id: 10, name: "Pooja Sharma", room: "A-201", bed: "01", hostel: "Women's Hostel", status: "Out Permission", markedAt: "-", remarks: "Went home (permission)" },
  ];

  const filtered = sampleRows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase())
  );

  const handleMarkAll = () => {
    setMarked(true);
    setTimeout(() => setMarked(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER (MATCHING IMAGE 3 PANEL 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/trainer/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">Hostel Attendance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Hostel Attendance &mdash; {selectedBatch}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            View hostel attendance for trainees in your batch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 gap-1.5 px-3 text-xs font-semibold bg-card">
            <Calendar className="size-3.5 text-primary" /> 12 Oct 2026
          </Badge>
          <Button
            size="sm"
            onClick={handleMarkAll}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs"
          >
            Mark Attendance
          </Button>
        </div>
      </div>

      {marked && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          Batch hostel attendance verified and submitted to warden office.
        </div>
      )}

      {/* TOP KPI PILLS (MATCHING IMAGE 3 PANEL 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border bg-card text-center shadow-2xs">
          <div className="text-lg font-bold text-emerald-600">91%</div>
          <div className="text-[11px] text-muted-foreground">Present</div>
        </div>
        <div className="p-3 rounded-xl border bg-card text-center shadow-2xs">
          <div className="text-lg font-bold text-rose-600">4%</div>
          <div className="text-[11px] text-muted-foreground">Absent</div>
        </div>
        <div className="p-3 rounded-xl border bg-card text-center shadow-2xs">
          <div className="text-lg font-bold text-amber-600">3%</div>
          <div className="text-[11px] text-muted-foreground">On Leave</div>
        </div>
        <div className="p-3 rounded-xl border bg-card text-center shadow-2xs">
          <div className="text-lg font-bold text-blue-600">2%</div>
          <div className="text-[11px] text-muted-foreground">Out Permission</div>
        </div>
        <div className="p-3 rounded-xl border bg-card text-center shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-lg font-bold text-foreground">36</div>
          <div className="text-[11px] text-muted-foreground">Total Residents</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-card shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search trainee name, room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8.5 text-xs"
          />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => exportToCSV(sampleRows, "trainer_hostel_attendance")}
          className="text-xs"
        >
          <Download className="size-3.5 mr-1" /> Export
        </Button>
      </div>

      {/* TABLE (MATCHING IMAGE 3 PANEL 3) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Bed</th>
                <th className="py-3 px-4">Hostel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Marked At</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground font-mono">{r.id}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{r.name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">{r.room}</td>
                  <td className="py-3 px-4 font-mono">{r.bed}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.hostel}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "Present"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "On Leave"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : r.status === "Out Permission"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">{r.markedAt}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs italic">{r.remarks}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                      <Eye className="size-3 mr-1" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t bg-muted/10 text-xs text-muted-foreground">
          Showing 1-10 of 36 trainees in {selectedBatch}
        </div>
      </div>
    </div>
  );
}
