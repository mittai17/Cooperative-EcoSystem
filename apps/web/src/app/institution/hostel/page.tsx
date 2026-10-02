"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  BedDouble,
  Download,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hostelService } from "@/lib/hostel/hostel-service";
import { HostelKpiRow } from "@/components/hostel/hostel-kpi-row";
import { AllocateRoomModal } from "@/components/hostel/allocate-room-modal";
import { RequestReviewModal } from "@/components/hostel/request-review-modal";
import { AddHostelModal } from "@/components/hostel/add-hostel-modal";
import { RoomDetailModal } from "@/components/hostel/room-detail-modal";
import { exportToCSV } from "@/components/hostel/export-utils";
import type { HostelRequest, Room } from "@/lib/hostel/types";

export default function InstitutionHostelOverview() {
  const [stats, setStats] = useState(hostelService.getStats());
  const [requests, setRequests] = useState(hostelService.getRequests());
  const [checkRecords, setCheckRecords] = useState(hostelService.getCheckRecords());
  const [maintenance, setMaintenance] = useState(hostelService.getMaintenanceIssues());

  // Modals state
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [selectedTraineeForAllocation, setSelectedTraineeForAllocation] = useState<string | undefined>(undefined);
  const [addHostelOpen, setAddHostelOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HostelRequest | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Check-in tabs
  const [checkTab, setCheckTab] = useState<"checkin" | "checkout" | "upcoming" | "overdue">("checkin");

  // Subscribe to central reactive updates
  useEffect(() => {
    const unsub = hostelService.subscribe(() => {
      setStats(hostelService.getStats());
      setRequests([...hostelService.getRequests()]);
      setCheckRecords([...hostelService.getCheckRecords()]);
      setMaintenance([...hostelService.getMaintenanceIssues()]);
    });
    return unsub;
  }, []);

  const handleOpenReview = (req: HostelRequest) => {
    setSelectedRequest(req);
    setReviewModalOpen(true);
  };

  const handleExportData = () => {
    exportToCSV(
      requests.slice(0, 50).map((r) => ({
        "Request ID": r.requestId,
        "Trainee": r.traineeName,
        "Code": r.traineeCode,
        "Programme": r.programme,
        "Batch": r.batch,
        "Hostel": r.requestedHostel,
        "Room Type": r.roomPreference,
        "Status": r.status,
        "Submitted": r.submittedDate,
      })),
      "hostel_requests_overview"
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. BREADCRUMB & HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/institution/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Hostel Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage hostel facilities, rooms, bed allocation and trainee accommodation.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setAddHostelOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs"
          >
            <Plus className="size-3.5 mr-1" /> Add Hostel
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddHostelOpen(true)}
            className="text-xs font-semibold text-primary border-primary/30 hover:bg-rose-50"
          >
            <Plus className="size-3.5 mr-1" /> Add Block
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTraineeForAllocation(undefined);
              setAllocateOpen(true);
            }}
            className="text-xs font-semibold"
          >
            <BedDouble className="size-3.5 mr-1 text-primary" /> Allocate Room
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportData}
            className="text-xs font-medium"
          >
            <Download className="size-3.5 mr-1" /> Export
          </Button>

          <Badge variant="outline" className="h-8 gap-1.5 px-2.5 text-xs font-semibold bg-card">
            <Calendar className="size-3.5 text-primary" /> 12 Oct 2026
          </Badge>
        </div>
      </div>

      {/* 2. TOP 8 KPI CARDS */}
      <HostelKpiRow
        stats={stats}
        onKpiClick={(key) => {
          if (key === "pending-requests") {
            const firstPending = requests.find((r) => r.status === "Pending");
            if (firstPending) handleOpenReview(firstPending);
          } else if (key === "available-beds" || key === "occupied-beds") {
            setAllocateOpen(true);
          }
        }}
      />

      {/* 3. MIDDLE SECTION: 3 PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* A. Occupancy by Block (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Occupancy by Block
              </h3>
              <Link href="/institution/hostel/blocks" className="text-xs text-primary font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-4 pt-3.5">
              {stats.blockOccupancy.map((block) => (
                <div key={block.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{block.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-[11px]">
                        {block.occupied} / {block.total}
                      </span>
                      <span className="font-bold text-emerald-600 text-xs w-8 text-right">
                        {block.percent}%
                      </span>
                    </div>
                  </div>
                  <Progress value={block.percent} className="h-2 bg-muted/60" />
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t mt-4 text-[11px] text-muted-foreground flex justify-between">
            <span>Average Block Utilization</span>
            <span className="font-bold text-foreground">73.6%</span>
          </div>
        </div>

        {/* B. Hostel-wise Occupancy Donut (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <BedDouble className="size-4 text-primary" />
                Hostel-wise Occupancy
              </h3>
              <Link href="/institution/hostel/occupancy" className="text-xs text-primary font-semibold hover:underline">
                View Details
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-3">
              {/* Donut Chart Visual */}
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
                    className="text-red-500"
                    strokeDasharray="74, 100"
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-extrabold text-foreground font-heading">
                    {stats.overallOccupancyRate}%
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                    Overall
                  </span>
                </div>
              </div>

              {/* Breakdown Legend */}
              <div className="space-y-2 flex-1 w-full text-xs">
                {stats.hostelOccupancy.map((h) => (
                  <div key={h.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                      <span className="text-foreground truncate max-w-[130px] font-medium">{h.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">
                        {h.occupied} / {h.total}
                      </span>
                      <span className="font-bold text-foreground text-xs w-7 text-right">{h.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t mt-4 text-[11px] text-muted-foreground flex justify-between">
            <span>Operational Capacity</span>
            <span className="font-bold text-foreground">640 Total Beds Available</span>
          </div>
        </div>

        {/* C. Room Status breakdown (3 cols) */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground">Room Status</h3>
              <Link href="/institution/hostel/rooms" className="text-xs text-primary font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 pt-3">
              <div className="p-2.5 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">Available</div>
                  <div className="text-[11px] text-emerald-700/80">142 rooms</div>
                </div>
                <span className="text-base font-extrabold text-emerald-700">28%</span>
              </div>

              <div className="p-2.5 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-800 dark:text-amber-300 text-xs">Partially Occupied</div>
                  <div className="text-[11px] text-amber-700/80">86 rooms</div>
                </div>
                <span className="text-base font-extrabold text-amber-700">34%</span>
              </div>

              <div className="p-2.5 rounded-lg border bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-800 dark:text-rose-300 text-xs">Full</div>
                  <div className="text-[11px] text-rose-700/80">74 rooms</div>
                </div>
                <span className="text-base font-extrabold text-rose-700">38%</span>
              </div>

              <div className="p-2.5 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-purple-800 dark:text-purple-300 text-xs">Maintenance</div>
                  <div className="text-[11px] text-purple-700/80">8 rooms</div>
                </div>
                <span className="text-base font-extrabold text-purple-700">4%</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t mt-4 text-[11px] text-muted-foreground flex justify-between">
            <span>Total Units</span>
            <span className="font-bold text-foreground">310 Tracked Rooms</span>
          </div>
        </div>
      </div>

      {/* 4. RECENT HOSTEL REQUESTS TABLE */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-foreground font-heading">Recent Hostel Requests</h3>
            <p className="text-xs text-muted-foreground">Trainee accommodation applications pending administrative review</p>
          </div>
          <Link
            href="/institution/hostel/requests"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View All Requests ({requests.length}) &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Requested From</th>
                <th className="py-3 px-4">Requested To</th>
                <th className="py-3 px-4">Preference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.slice(0, 6).map((req) => (
                <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{req.requestId}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                        {req.traineeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="font-medium text-foreground">{req.traineeName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[140px] truncate">{req.programme}</td>
                  <td className="py-3 px-4 font-semibold">{req.batch}</td>
                  <td className="py-3 px-4 text-muted-foreground">{req.gender}</td>
                  <td className="py-3 px-4 text-muted-foreground">{req.trainingStart}</td>
                  <td className="py-3 px-4 text-muted-foreground">{req.trainingEnd}</td>
                  <td className="py-3 px-4 text-muted-foreground">{req.requestedHostel}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        req.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : req.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : req.status === "Under Review"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : req.status === "Waitlisted"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : req.status === "Allocated"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {req.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{req.submittedDate}</td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReview(req)}
                      className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-rose-50"
                    >
                      {req.status === "Pending" ? "Review" : "View"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: 3 CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* A. Today's Check-ins / Check-outs (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground">Today&apos;s Check-ins / Check-outs</h3>
              <Link href="/institution/hostel/check-in-out" className="text-xs text-primary font-semibold hover:underline">
                View All
              </Link>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1.5 pt-3 pb-2 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setCheckTab("checkin")}
                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                  checkTab === "checkin"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Today&apos;s Check-ins ({stats.todayCheckIns})
              </button>
              <button
                type="button"
                onClick={() => setCheckTab("checkout")}
                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                  checkTab === "checkout"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Today&apos;s Check-outs ({stats.todayCheckOuts})
              </button>
              <button
                type="button"
                onClick={() => setCheckTab("upcoming")}
                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                  checkTab === "upcoming"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Upcoming (12)
              </button>
              <button
                type="button"
                onClick={() => setCheckTab("overdue")}
                className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                  checkTab === "overdue"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Overdue (5)
              </button>
            </div>

            {/* Check Records Table */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-xs text-left">
                <thead className="border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Trainee</th>
                    <th className="py-2.5 px-3">Batch</th>
                    <th className="py-2.5 px-3">Room</th>
                    <th className="py-2.5 px-3">Bed</th>
                    <th className="py-2.5 px-3">ID Verified</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {checkRecords.slice(0, 5).map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{rec.time}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{rec.traineeName}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{rec.batch}</td>
                      <td className="py-2.5 px-3 font-bold">{rec.roomNumber}</td>
                      <td className="py-2.5 px-3 font-mono">{rec.bedNumber}</td>
                      <td className="py-2.5 px-3">
                        {rec.idVerified ? (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        ) : (
                          <span className="size-2 rounded-full bg-amber-500 inline-block" />
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={
                            rec.status === "Checked In"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              : rec.status === "Late"
                              ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                              : "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                          }
                        >
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const r = hostelService.getRoomByNumber(rec.roomNumber);
                            if (r) {
                              setSelectedRoom(r);
                              setRoomModalOpen(true);
                            }
                          }}
                          className="h-6 px-2 text-[11px] text-primary"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* B. Hostel Attendance (Today) (3 cols) */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground">Hostel Attendance (Today)</h3>
              <Link href="/institution/hostel/attendance" className="text-xs text-primary font-semibold hover:underline">
                View Details
              </Link>
            </div>

            <div className="flex flex-col items-center pt-3">
              <div className="relative size-28 flex items-center justify-center">
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
                  <span className="text-lg font-extrabold text-foreground font-heading">
                    {stats.attendanceSummary.presentRate}%
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground">Present</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full pt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Present:</span>
                  <span className="font-bold text-foreground ml-auto">{stats.attendanceSummary.presentRate}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-rose-500" />
                  <span className="text-muted-foreground">Absent:</span>
                  <span className="font-bold text-foreground ml-auto">{stats.attendanceSummary.absentRate}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">On Leave:</span>
                  <span className="font-bold text-foreground ml-auto">{stats.attendanceSummary.onLeaveRate}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Out Permission:</span>
                  <span className="font-bold text-foreground ml-auto">{stats.attendanceSummary.outPermissionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-3 border-t mt-3 text-center text-[10px]">
            <div className="bg-muted/30 p-1.5 rounded">
              <span className="text-muted-foreground block">Total</span>
              <span className="font-bold text-foreground">{stats.attendanceSummary.totalResidents}</span>
            </div>
            <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded">
              <span className="block">Present</span>
              <span className="font-bold">{stats.attendanceSummary.presentCount}</span>
            </div>
            <div className="bg-rose-50 text-rose-800 p-1.5 rounded">
              <span className="block">Absent</span>
              <span className="font-bold">{stats.attendanceSummary.absentCount}</span>
            </div>
            <div className="bg-amber-50 text-amber-800 p-1.5 rounded">
              <span className="block">Leave</span>
              <span className="font-bold">{stats.attendanceSummary.onLeaveCount}</span>
            </div>
          </div>
        </div>

        {/* C. Recent Maintenance Issues (3 cols) */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-4.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-sm text-foreground">Recent Maintenance</h3>
              <Link href="/institution/hostel/maintenance" className="text-xs text-primary font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="divide-y text-xs pt-1">
              {maintenance.slice(0, 5).map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-primary text-[11px]">{m.issueId}</span>
                      <span className="font-semibold text-foreground">&bull; {m.location}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {m.category} &bull; Priority: {m.priority}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      m.status === "Open"
                        ? "bg-rose-50 text-rose-700 border-rose-200 text-[10px]"
                        : m.status === "In Progress"
                        ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                    }
                  >
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Open Tickets</span>
            <span className="font-bold text-rose-600">8 Critical / High</span>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AllocateRoomModal
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
        initialTraineeId={selectedTraineeForAllocation}
      />

      <RequestReviewModal
        request={selectedRequest}
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        onAllocateNow={(traineeId) => {
          setSelectedTraineeForAllocation(traineeId);
          setAllocateOpen(true);
        }}
      />

      <AddHostelModal
        open={addHostelOpen}
        onOpenChange={setAddHostelOpen}
      />

      <RoomDetailModal
        room={selectedRoom}
        open={roomModalOpen}
        onOpenChange={setRoomModalOpen}
        onAllocateBed={() => {
          setRoomModalOpen(false);
          setAllocateOpen(true);
        }}
      />
    </div>
  );
}
