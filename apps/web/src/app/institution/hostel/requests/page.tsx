"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  ChevronRight,
  Search,
  Filter,
  Download,
  X,
  Eye,
  CheckCircle2,
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
import { RequestReviewModal } from "@/components/hostel/request-review-modal";
import { AllocateRoomModal } from "@/components/hostel/allocate-room-modal";
import { exportToCSV } from "@/components/hostel/export-utils";
import type { HostelRequest, RequestStatus } from "@/lib/hostel/types";

export default function HostelRequestsPage() {
  const [requests, setRequests] = useState(hostelService.getRequests());
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filters
  const [search, setSearch] = useState("");
  const [progFilter, setProgFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HostelRequest | null>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateTraineeId, setAllocateTraineeId] = useState<string | undefined>(undefined);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === "Pending").length,
      review: requests.filter((r) => r.status === "Under Review").length,
      approved: requests.filter((r) => r.status === "Approved").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
      waitlisted: requests.filter((r) => r.status === "Waitlisted").length,
      allocated: requests.filter((r) => r.status === "Allocated").length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab === "pending" && r.status !== "Pending") return false;
      if (activeTab === "review" && r.status !== "Under Review") return false;
      if (activeTab === "approved" && r.status !== "Approved") return false;
      if (activeTab === "rejected" && r.status !== "Rejected") return false;
      if (activeTab === "waitlisted" && r.status !== "Waitlisted") return false;
      if (activeTab === "allocated" && r.status !== "Allocated") return false;

      if (batchFilter !== "all" && r.batch !== batchFilter) return false;
      if (genderFilter !== "all" && r.gender !== genderFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !r.traineeName.toLowerCase().includes(q) &&
          !r.traineeCode.toLowerCase().includes(q) &&
          !r.requestId.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requests, activeTab, batchFilter, genderFilter, search]);

  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage) || 1;
  const paginated = filteredRequests.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenReview = (req: HostelRequest) => {
    setSelectedRequest(req);
    setReviewModalOpen(true);
  };

  const handleClear = () => {
    setSearch("");
    setProgFilter("all");
    setBatchFilter("all");
    setGenderFilter("all");
    setPage(1);
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
            <span className="text-foreground font-semibold">Hostel Requests</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Hostel Accommodation Requests
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Process, evaluate, approve, waitlist, or allocate trainee accommodation requests.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            exportToCSV(
              filteredRequests.map((r) => ({
                "Request ID": r.requestId,
                "Trainee": r.traineeName,
                "Batch": r.batch,
                "Gender": r.gender,
                "Requested From": r.trainingStart,
                "Requested To": r.trainingEnd,
                "Hostel Preference": r.requestedHostel,
                "Status": r.status,
                "Submitted": r.submittedDate,
              })),
              "hostel_requests"
            )
          }
          className="text-xs font-semibold self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      {/* TABS (MATCHING IMAGE 2 PANEL 5) */}
      <div className="flex items-center gap-1.5 border-b pb-2 text-xs overflow-x-auto">
        {[
          { id: "all", label: `All (${counts.all})` },
          { id: "pending", label: `Pending (${counts.pending})` },
          { id: "review", label: `Under Review (${counts.review})` },
          { id: "approved", label: `Approved (${counts.approved})` },
          { id: "rejected", label: `Rejected (${counts.rejected})` },
          { id: "waitlisted", label: `Waitlisted (${counts.waitlisted})` },
          { id: "allocated", label: `Allocated (${counts.allocated})` },
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

      {/* FILTERS */}
      <div className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Batch</label>
            <Select value={batchFilter} onValueChange={(v) => { if(v) { setBatchFilter(v); setPage(1); } }}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Batch" />
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
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Gender</label>
            <Select value={genderFilter} onValueChange={(v) => { if(v) { setGenderFilter(v); setPage(1); } }}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Search Trainee</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search trainee name, code or request ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 h-8.5 text-xs"
              />
            </div>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8.5 text-xs w-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-3 mr-1" /> Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE (MATCHING IMAGE 2 PANEL 5) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
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
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((req) => (
                <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{req.requestId}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{req.traineeName}</div>
                    <div className="text-[10px] text-muted-foreground">{req.traineeCode}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{req.programme}</td>
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

        {/* PAGINATION */}
        <div className="p-3.5 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
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

      <RequestReviewModal
        request={selectedRequest}
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        onAllocateNow={(traineeId) => {
          setAllocateTraineeId(traineeId);
          setAllocateOpen(true);
        }}
        onUpdated={() => setRequests([...hostelService.getRequests()])}
      />

      <AllocateRoomModal
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
        initialTraineeId={allocateTraineeId}
        onSuccess={() => setRequests([...hostelService.getRequests()])}
      />
    </div>
  );
}
