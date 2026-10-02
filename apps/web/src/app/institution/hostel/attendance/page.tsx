"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  ChevronRight,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { exportToCSV } from "@/components/hostel/export-utils";
import type { AttendanceStatus } from "@/lib/hostel/types";

export default function HostelAttendancePage() {
  const [attendance, setAttendance] = useState(hostelService.getAttendanceRecords());
  const [selectedBlock, setSelectedBlock] = useState("Block A");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [search, setSearch] = useState("");
  const stats = hostelService.getStats();

  const filtered = attendance.filter((a) => {
    if (selectedBlock !== "all" && !a.blockName.includes(selectedBlock)) return false;
    if (selectedBatch !== "all" && a.batch !== selectedBatch) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.traineeName.toLowerCase().includes(q) && !a.roomNumber.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleToggleStatus = (traineeId: string, newStatus: AttendanceStatus) => {
    hostelService.markAttendance(traineeId, newStatus);
    setAttendance([...hostelService.getAttendanceRecords()]);
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
            <span className="text-foreground font-semibold">Hostel Attendance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Daily Hostel Attendance Roster
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Turnstile biometric sync, evening night-roll call, and resident night stays tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 gap-1.5 px-3 text-xs font-semibold bg-card">
            <Calendar className="size-3.5 text-primary" /> 12 Oct 2026
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportToCSV(
                filtered.map((a) => ({
                  "Trainee": a.traineeName,
                  "Batch": a.batch,
                  "Block": a.blockName,
                  "Room": a.roomNumber,
                  "Bed": a.bedNumber,
                  "Date": a.date,
                  "Status": a.status,
                  "Marked At": a.markedAt,
                })),
                "hostel_attendance"
              )
            }
            className="text-xs font-semibold"
          >
            <Download className="size-3.5 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* TOP FILTERS (MATCHING IMAGE 2 PANEL 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border bg-card shadow-2xs">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Hostel</label>
          <Select defaultValue="main">
            <SelectTrigger className="h-8.5 text-xs">
              <SelectValue placeholder="Hostel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">VAMNICOM Main Hostel</SelectItem>
              <SelectItem value="women">Women&apos;s Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Block</label>
          <Select value={selectedBlock} onValueChange={(v) => v && setSelectedBlock(v)}>
            <SelectTrigger className="h-8.5 text-xs">
              <SelectValue placeholder="Block" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blocks</SelectItem>
              <SelectItem value="Block A">Block A</SelectItem>
              <SelectItem value="Block B">Block B</SelectItem>
              <SelectItem value="Block C">Block C</SelectItem>
              <SelectItem value="Block D">Block D</SelectItem>
              <SelectItem value="Block E">Block E</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Batch</label>
          <Select value={selectedBatch} onValueChange={(v) => v && setSelectedBatch(v)}>
            <SelectTrigger className="h-8.5 text-xs">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="PDA-02">PDA-02</SelectItem>
              <SelectItem value="CMF-01">CMF-01</SelectItem>
              <SelectItem value="DCO-01">DCO-01</SelectItem>
              <SelectItem value="CLG-01">CLG-01</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Search Resident</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* ATTENDANCE SUMMARY & BLOCK-WISE ATTENDANCE (IMAGE 2 PANEL 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Donut chart card */}
        <div className="lg:col-span-5 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">Night-Stay Attendance Overview</h3>
          <div className="flex items-center gap-6 pt-3">
            <div className="relative size-28 shrink-0 flex items-center justify-center">
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
                  strokeDasharray="91, 100"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-foreground font-heading">
                  {stats.attendanceSummary.presentRate}%
                </span>
                <span className="text-[9px] font-medium text-muted-foreground">Present</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Present:</span>
                <span className="font-bold text-emerald-600">{stats.attendanceSummary.presentRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Absent:</span>
                <span className="font-bold text-rose-600">{stats.attendanceSummary.absentRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">On Leave:</span>
                <span className="font-bold text-amber-600">{stats.attendanceSummary.onLeaveRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Out Permission:</span>
                <span className="font-bold text-blue-600">{stats.attendanceSummary.outPermissionRate}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-3 border-t mt-3 text-center text-[10px]">
            <div className="bg-muted/30 p-1 rounded font-semibold">
              <span className="text-muted-foreground block">Total</span>
              <span>{stats.attendanceSummary.totalResidents}</span>
            </div>
            <div className="bg-emerald-50 text-emerald-800 p-1 rounded font-semibold">
              <span className="block">Present</span>
              <span>{stats.attendanceSummary.presentCount}</span>
            </div>
            <div className="bg-rose-50 text-rose-800 p-1 rounded font-semibold">
              <span className="block">Absent</span>
              <span>{stats.attendanceSummary.absentCount}</span>
            </div>
            <div className="bg-amber-50 text-amber-800 p-1 rounded font-semibold">
              <span className="block">Leave</span>
              <span>{stats.attendanceSummary.onLeaveCount}</span>
            </div>
          </div>
        </div>

        {/* Block-wise Attendance bars */}
        <div className="lg:col-span-7 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b">Block-wise Attendance Rates</h3>
          <div className="space-y-3 pt-3">
            {[
              { block: "Block A", rate: 92 },
              { block: "Block B", rate: 89 },
              { block: "Block C", rate: 94 },
              { block: "Block D", rate: 88 },
              { block: "Block E (Women's Wing)", rate: 90 },
            ].map((b) => (
              <div key={b.block} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground">{b.block}</span>
                  <span className="font-bold text-emerald-600">{b.rate}%</span>
                </div>
                <Progress value={b.rate} className="h-2 bg-muted/50" />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground pt-3 border-t mt-2">
            Automated biometric checkpoints active at Block main turnstiles & mess entrances.
          </p>
        </div>
      </div>

      {/* ATTENDANCE ROSTER TABLE (MATCHING IMAGE 2 PANEL 8) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground font-heading">
            Attendance List ({selectedBlock})
          </h3>
          <span className="text-xs text-muted-foreground font-medium">{filtered.length} residents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Bed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Marked At</th>
                <th className="py-3 px-4 text-right">Quick Mark / Override</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.slice(0, 10).map((a) => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground">{a.traineeName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.batch}</td>
                  <td className="py-3 px-4 font-bold text-foreground font-mono">{a.roomNumber}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{a.bedNumber}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        a.status === "Present"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : a.status === "Absent"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : a.status === "On Leave"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {a.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">{a.markedAt}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant={a.status === "Present" ? "default" : "outline"}
                        onClick={() => handleToggleStatus(a.traineeId, "Present")}
                        className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={a.status === "Absent" ? "default" : "outline"}
                        onClick={() => handleToggleStatus(a.traineeId, "Absent")}
                        className="h-6 px-2 text-[10px] text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={a.status === "On Leave" ? "default" : "outline"}
                        onClick={() => handleToggleStatus(a.traineeId, "On Leave")}
                        className="h-6 px-2 text-[10px] text-amber-700 border-amber-200 hover:bg-amber-50"
                      >
                        Leave
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
