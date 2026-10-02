"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  Download,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/components/hostel/export-utils";

export default function TrainerRequestsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const sampleRows = [
    { id: "HR-1042", name: "Ravindra S. Patil", gender: "Male", hostel: "Main Hostel", preference: "4 Sharing", status: "Pending", submitted: "10 Oct 2026" },
    { id: "HR-1043", name: "Sunita Sharma", gender: "Female", hostel: "Women's Hostel", preference: "4 Sharing", status: "Approved", submitted: "10 Oct 2026" },
    { id: "HR-1044", name: "Amit Gupta", gender: "Male", hostel: "Main Hostel", preference: "2 Sharing", status: "Pending", submitted: "09 Oct 2026" },
    { id: "HR-1045", name: "Priya Nair", gender: "Female", hostel: "Women's Hostel", preference: "4 Sharing", status: "Waitlisted", submitted: "09 Oct 2026" },
    { id: "HR-1046", name: "Vikram Solanki", gender: "Male", hostel: "Main Hostel", preference: "4 Sharing", status: "Approved", submitted: "08 Oct 2026" },
    { id: "HR-1047", name: "Neha Sharma", gender: "Female", hostel: "Women's Hostel", preference: "4 Sharing", status: "Approved", submitted: "07 Oct 2026" },
  ];

  const filtered = sampleRows.filter((r) => {
    if (activeTab === "pending" && r.status !== "Pending") return false;
    if (activeTab === "approved" && r.status !== "Approved") return false;
    if (activeTab === "waitlisted" && r.status !== "Waitlisted") return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER (MATCHING IMAGE 3 PANEL 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/trainer/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">Hostel Requests</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Hostel Requests &mdash; PDA-02
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            View hostel accommodation requests from your batch trainees.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => exportToCSV(sampleRows, "trainer_batch_requests")}
          className="text-xs font-semibold self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1" /> Export
        </Button>
      </div>

      {/* TABS (MATCHING IMAGE 3 PANEL 4) */}
      <div className="flex items-center gap-1.5 border-b pb-2 text-xs overflow-x-auto">
        {[
          { id: "all", label: "All (6)" },
          { id: "pending", label: "Pending (2)" },
          { id: "approved", label: "Approved (3)" },
          { id: "rejected", label: "Rejected (0)" },
          { id: "waitlisted", label: "Waitlisted (1)" },
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

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-card shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search trainee name, request ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8.5 text-xs"
          />
        </div>
      </div>

      {/* TABLE (MATCHING IMAGE 3 PANEL 4) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Requested Hostel</th>
                <th className="py-3 px-4">Room Preference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">{r.id}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{r.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.gender}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.hostel}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.preference}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.submitted}</td>
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
          Showing 1-6 of 6 requests in batch PDA-02
        </div>
      </div>
    </div>
  );
}
