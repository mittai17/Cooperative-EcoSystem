"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  Download,
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
import { ReportIssueModal } from "@/components/hostel/report-issue-modal";
import { exportToCSV } from "@/components/hostel/export-utils";
import type { MaintenanceIssue } from "@/lib/hostel/types";

export default function MaintenancePage() {
  const [issues, setIssues] = useState(hostelService.getMaintenanceIssues());
  const [activeTab, setActiveTab] = useState<string>("all");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const counts = useMemo(() => {
    return {
      all: issues.length,
      open: issues.filter((i) => i.status === "Open").length,
      inProgress: issues.filter((i) => i.status === "In Progress" || i.status === "Assigned").length,
      resolved: issues.filter((i) => i.status === "Resolved").length,
      closed: issues.filter((i) => i.status === "Closed").length,
    };
  }, [issues]);

  const filtered = useMemo(() => {
    return issues.filter((i) => {
      if (activeTab === "open" && i.status !== "Open") return false;
      if (activeTab === "progress" && i.status !== "In Progress" && i.status !== "Assigned") return false;
      if (activeTab === "resolved" && i.status !== "Resolved") return false;
      if (activeTab === "closed" && i.status !== "Closed") return false;

      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        if (
          !i.issueId.toLowerCase().includes(q) &&
          !i.location.toLowerCase().includes(q) &&
          !i.description.toLowerCase().includes(q) &&
          !i.reportedBy.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [issues, activeTab, categoryFilter, priorityFilter, search]);

  const handleResolve = (id: string) => {
    hostelService.resolveMaintenanceIssue(id, "Repairs completed by duty engineering team");
    setIssues([...hostelService.getMaintenanceIssues()]);
  };

  const handleClear = () => {
    setSearch("");
    setCategoryFilter("all");
    setPriorityFilter("all");
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
            <span className="text-foreground font-semibold">Maintenance & Issues</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Maintenance & Repairs Desk
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track plumbing, electrical, civil, Wi-Fi, and housekeeping requests submitted by trainees and faculty.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportToCSV(
                filtered.map((i) => ({
                  "Issue ID": i.issueId,
                  "Location": i.location,
                  "Category": i.category,
                  "Priority": i.priority,
                  "Description": i.description,
                  "Reported By": i.reportedBy,
                  "Reported On": i.reportedDate,
                  "Status": i.status,
                })),
                "maintenance_tickets"
              )
            }
            className="text-xs font-semibold"
          >
            <Download className="size-3.5 mr-1" /> Export
          </Button>

          <Button
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-2xs"
          >
            <Plus className="size-3.5 mr-1" /> Report Issue
          </Button>
        </div>
      </div>

      {/* TABS (MATCHING IMAGE 2 PANEL 9) */}
      <div className="flex items-center gap-1.5 border-b pb-2 text-xs overflow-x-auto">
        {[
          { id: "all", label: `All (${counts.all})` },
          { id: "open", label: `Open (${counts.open})` },
          { id: "progress", label: `In Progress (${counts.inProgress})` },
          { id: "resolved", label: `Resolved (${counts.resolved})` },
          { id: "closed", label: `Closed (${counts.closed})` },
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

      {/* FILTERS (MATCHING IMAGE 2 PANEL 9) */}
      <div className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Category</label>
            <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Plumbing">Plumbing</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
                <SelectItem value="Wi-Fi">Wi-Fi</SelectItem>
                <SelectItem value="Cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Priority</label>
            <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Search Tickets</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search ticket, room, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

      {/* TABLE (MATCHING IMAGE 2 PANEL 9) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Issue ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Reported On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{i.issueId}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{i.location}</td>
                  <td className="py-3 px-4 text-muted-foreground">{i.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        i.priority === "High" || i.priority === "Critical"
                          ? "bg-red-100 text-red-700"
                          : i.priority === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {i.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-foreground font-medium">{i.description}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <div>{i.reportedBy}</div>
                    <div className="text-[10px]">{i.reportedByRole}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{i.reportedDate}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        i.status === "Open"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : i.status === "In Progress" || i.status === "Assigned"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }
                    >
                      {i.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {i.status !== "Resolved" ? (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(i.id)}
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <CheckCircle2 className="size-3 mr-1" /> Resolve
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
      </div>

      <ReportIssueModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        defaultReporter="Institution Admin"
        reporterRole="Admin"
        onSuccess={() => setIssues([...hostelService.getMaintenanceIssues()])}
      />
    </div>
  );
}
