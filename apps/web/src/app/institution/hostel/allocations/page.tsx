"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BedDouble,
  Plus,
  ChevronRight,
  Search,
  Filter,
  Download,
  CheckCircle2,
  LogIn,
  LogOut,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hostelService } from "@/lib/hostel/hostel-service";
import { AllocateRoomModal } from "@/components/hostel/allocate-room-modal";
import { CheckInModal, CheckOutModal } from "@/components/hostel/check-in-out-modal";
import { exportToCSV } from "@/components/hostel/export-utils";
import type { HostelAllocation, TraineeProfile } from "@/lib/hostel/types";

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState(hostelService.getAllocations());
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");

  // Modals
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [checkInTrainee, setCheckInTrainee] = useState<TraineeProfile | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutTrainee, setCheckOutTrainee] = useState<TraineeProfile | null>(null);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => {
      if (activeTab === "checkedin" && a.status !== "Checked In") return false;
      if (activeTab === "allocated" && a.status !== "Allocated") return false;
      if (activeTab === "checkedout" && a.status !== "Checked Out") return false;
      if (batchFilter !== "all" && a.batch !== batchFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.traineeName.toLowerCase().includes(q) &&
          !a.traineeCode.toLowerCase().includes(q) &&
          !a.roomNumber.toLowerCase().includes(q) &&
          !a.allocationId.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allocations, activeTab, batchFilter, search]);

  const totalPages = Math.ceil(filteredAllocations.length / rowsPerPage) || 1;
  const paginated = filteredAllocations.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleExport = () => {
    exportToCSV(
      filteredAllocations.map((a) => ({
        "Allocation ID": a.allocationId,
        "Trainee": a.traineeName,
        "Code": a.traineeCode,
        "Gender": a.gender,
        "Batch": a.batch,
        "Room": a.roomNumber,
        "Bed": a.bedNumber,
        "Hostel": a.hostelName,
        "Block": a.blockName,
        "Check In": a.checkInDate,
        "Checkout": a.expectedCheckout,
        "Status": a.status,
      })),
      "hostel_allocations"
    );
  };

  const handleAction = (a: HostelAllocation) => {
    const t = hostelService.getTraineeById(a.traineeId);
    if (!t) return;
    if (a.status === "Allocated") {
      setCheckInTrainee(t);
      setCheckInOpen(true);
    } else if (a.status === "Checked In") {
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
            <span className="text-foreground font-semibold">Allocations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Room Allocations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Active trainee bed allocations, room assignments, and resident roster.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleExport}
            variant="outline"
            className="text-xs font-semibold"
          >
            <Download className="size-3.5 mr-1" /> Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setAllocateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs"
          >
            <Plus className="size-3.5 mr-1" /> Allocate Room
          </Button>
        </div>
      </div>

      {/* TABS & TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          {[
            { id: "all", label: `All Allocations (${allocations.length})` },
            { id: "checkedin", label: "Checked In" },
            { id: "allocated", label: "Pending Check-in" },
            { id: "checkedout", label: "Checked Out" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
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

        <div className="flex items-center gap-2">
          <Select value={batchFilter} onValueChange={(v) => { if(v) { setBatchFilter(v); setPage(1); } }}>
            <SelectTrigger className="h-8.5 text-xs w-36">
              <SelectValue placeholder="Filter Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="PDA-02">PDA-02</SelectItem>
              <SelectItem value="CMF-01">CMF-01</SelectItem>
              <SelectItem value="DCO-01">DCO-01</SelectItem>
              <SelectItem value="CLG-01">CLG-01</SelectItem>
              <SelectItem value="FPO-01">FPO-01</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search trainee, room, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-8.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Allocation ID</th>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Programme & Batch</th>
                <th className="py-3 px-4">Hostel & Block</th>
                <th className="py-3 px-4">Room & Bed</th>
                <th className="py-3 px-4">Check-in Date</th>
                <th className="py-3 px-4">Expected Checkout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((a) => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{a.allocationId}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{a.traineeName}</div>
                    <div className="text-[10px] text-muted-foreground">{a.traineeCode} &bull; {a.gender}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-foreground">{a.programme}</div>
                    <div className="font-bold text-[11px] text-primary">{a.batch}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <div>{a.hostelName}</div>
                    <div className="text-[11px] font-medium text-foreground">{a.blockName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-sm text-foreground font-mono">{a.roomNumber}</span>
                    <span className="text-muted-foreground ml-1.5 font-mono text-xs font-semibold">({a.bedNumber})</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{a.checkInDate}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.expectedCheckout}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        a.status === "Checked In"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : a.status === "Allocated"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {a.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {a.status === "Allocated" ? (
                      <Button
                        size="sm"
                        onClick={() => handleAction(a)}
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <LogIn className="size-3 mr-1" /> Check In
                      </Button>
                    ) : a.status === "Checked In" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(a)}
                        className="h-7 px-2.5 text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                      >
                        <LogOut className="size-3 mr-1" /> Check Out
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                        <Eye className="size-3 mr-1" /> View
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-3.5 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, filteredAllocations.length)} of {filteredAllocations.length} records
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <span className="px-2 font-bold text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ALLOCATE MODAL */}
      <AllocateRoomModal
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
        onSuccess={() => setAllocations(hostelService.getAllocations())}
      />

      {/* CHECK-IN MODAL */}
      <CheckInModal
        trainee={checkInTrainee}
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        onSuccess={() => setAllocations(hostelService.getAllocations())}
      />

      {/* CHECK-OUT MODAL */}
      <CheckOutModal
        trainee={checkOutTrainee}
        open={checkOutOpen}
        onOpenChange={setCheckOutOpen}
        onSuccess={() => setAllocations(hostelService.getAllocations())}
      />
    </div>
  );
}
