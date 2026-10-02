"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LogIn,
  LogOut,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { hostelService } from "@/lib/hostel/hostel-service";
import { CheckInModal, CheckOutModal } from "@/components/hostel/check-in-out-modal";
import { exportToCSV } from "@/components/hostel/export-utils";
import type { CheckRecord, TraineeProfile } from "@/lib/hostel/types";

export default function CheckInOutPage() {
  const [records, setRecords] = useState(hostelService.getCheckRecords());
  const [activeTab, setActiveTab] = useState<string>("checkin");
  const [search, setSearch] = useState("");

  const [checkInTrainee, setCheckInTrainee] = useState<TraineeProfile | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutTrainee, setCheckOutTrainee] = useState<TraineeProfile | null>(null);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const stats = hostelService.getStats();

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (activeTab === "checkin" && r.type !== "check-in") return false;
      if (activeTab === "checkout" && r.type !== "check-out") return false;
      if (activeTab === "upcoming" && r.status !== "Scheduled") return false;
      if (activeTab === "overdue" && r.status !== "Late" && r.status !== "Overdue") return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.traineeName.toLowerCase().includes(q) &&
          !r.roomNumber.toLowerCase().includes(q) &&
          !r.batch.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [records, activeTab, search]);

  const handleAction = (rec: CheckRecord) => {
    const t = hostelService.getTraineeById(rec.traineeId);
    if (!t) return;
    if (rec.type === "check-in" && rec.status !== "Checked In") {
      setCheckInTrainee(t);
      setCheckInOpen(true);
    } else {
      setCheckOutTrainee(t);
      setCheckOutOpen(true);
    }
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
            <span className="text-foreground font-semibold">Check-in / Check-out</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Check-in / Check-out Operations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Reception desk arrivals, key handovers, ID verification, and resident clearances.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            exportToCSV(
              filteredRecords.map((r) => ({
                "Time": r.time,
                "Trainee": r.traineeName,
                "Batch": r.batch,
                "Room": r.roomNumber,
                "Bed": r.bedNumber,
                "Hostel": r.hostelName,
                "ID Verified": r.idVerified ? "Yes" : "No",
                "Status": r.status,
                "Type": r.type,
              })),
              "check_records"
            )
          }
          className="text-xs font-semibold self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1" /> Export Desk Log
        </Button>
      </div>

      {/* TABS (MATCHING IMAGE 2 PANEL 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          {[
            { id: "checkin", label: `Today's Check-ins (${stats.todayCheckIns})` },
            { id: "checkout", label: `Today's Check-outs (${stats.todayCheckOuts})` },
            { id: "upcoming", label: "Upcoming (12)" },
            { id: "overdue", label: "Overdue (5)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search trainee, room, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8.5 text-xs"
          />
        </div>
      </div>

      {/* TABLE (MATCHING IMAGE 2 PANEL 7) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Bed</th>
                <th className="py-3 px-4">Hostel & Block</th>
                <th className="py-3 px-4">ID Verified</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-muted-foreground text-[11px]">{r.time}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{r.traineeName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.batch}</td>
                  <td className="py-3 px-4 font-bold text-sm text-foreground font-mono">{r.roomNumber}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{r.bedNumber}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.hostelName} &bull; {r.blockName}
                  </td>
                  <td className="py-3 px-4">
                    {r.idVerified ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="size-4 text-emerald-600" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                        <AlertCircle className="size-4 text-amber-500" /> Pending ID
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "Checked In"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "Late"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {r.status === "Scheduled" ? (
                      <Button
                        size="sm"
                        onClick={() => handleAction(r)}
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <LogIn className="size-3 mr-1" /> Check In
                      </Button>
                    ) : r.status === "Checked In" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(r)}
                        className="h-7 px-2.5 text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                      >
                        <LogOut className="size-3 mr-1" /> Check Out
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                        View
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CheckInModal
        trainee={checkInTrainee}
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onSuccess={() => setRecords([...hostelService.getCheckRecords()])}
      />

      <CheckOutModal
        trainee={checkOutTrainee}
        open={checkOutOpen}
        onOpenChange={setCheckOutOpen}
        onSuccess={() => setRecords([...hostelService.getCheckRecords()])}
      />
    </div>
  );
}
