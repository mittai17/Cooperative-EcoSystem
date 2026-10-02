"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Search,
  Download,
  Eye,
  Bed,
  CheckCircle2,
  Clock,
  Home,
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
import { exportToCSV } from "@/components/hostel/export-utils";

export default function TrainerAllocationsPage() {
  const [selectedBatch, setSelectedBatch] = useState("PDA-02");
  const [search, setSearch] = useState("");

  const sampleRows = [
    { id: 1, name: "Ravindra S. Patil", gender: "Male", hostel: "Main Hostel", block: "A", room: "A-204", bed: "02", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
    { id: 2, name: "Sunita Sharma", gender: "Female", hostel: "Women's Hostel", block: "A", room: "A-101", bed: "01", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
    { id: 3, name: "Amit Gupta", gender: "Male", hostel: "Main Hostel", block: "B", room: "B-103", bed: "01", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "On Leave" },
    { id: 4, name: "Priya Nair", gender: "Female", hostel: "Women's Hostel", block: "A", room: "A-102", bed: "02", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
    { id: 5, name: "Vikram Solanki", gender: "Male", hostel: "Main Hostel", block: "B", room: "B-201", bed: "03", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
    { id: 6, name: "Neha Sharma", gender: "Female", hostel: "Women's Hostel", block: "C", room: "C-101", bed: "04", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
    { id: 7, name: "Deepak Chauhan", gender: "Male", hostel: "Main Hostel", block: "C", room: "C-101", bed: "01", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
    { id: 8, name: "Anjali Rathore", gender: "Female", hostel: "Women's Hostel", block: "B", room: "B-104", bed: "02", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Not Checked In" },
    { id: 9, name: "Ramesh Kumar", gender: "Male", hostel: "Main Hostel", block: "A", room: "A-101", bed: "01", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
    { id: 10, name: "Pooja Sharma", gender: "Female", hostel: "Women's Hostel", block: "A", room: "A-201", bed: "01", checkIn: "12 Oct 2026", checkout: "25 Oct 2026", status: "Checked In" },
  ];

  const filtered = sampleRows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER (MATCHING IMAGE 3 PANEL 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium">
            <span>Home</span>
            <ChevronRight className="size-3" />
            <Link href="/trainer/hostel" className="hover:text-primary">
              Hostel Management
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">Room Allocation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Room Allocation &mdash; {selectedBatch}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            View room accommodation details for trainees in your batch.
          </p>
        </div>

        <Select value={selectedBatch} onValueChange={(v) => v && setSelectedBatch(v)}>
          <SelectTrigger className="h-9 text-xs w-64 bg-card font-semibold">
            <SelectValue placeholder="Select Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PDA-02">PDA-02 &mdash; PACS Digital Accounting</SelectItem>
            <SelectItem value="CMF-01">CMF-01 &mdash; Coop Management</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4 KPIS (MATCHING IMAGE 3 PANEL 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border bg-card shadow-2xs">
          <div className="text-xl font-bold text-foreground">36</div>
          <div className="text-xs text-muted-foreground">Allocated</div>
        </div>
        <div className="p-3.5 rounded-xl border bg-card shadow-2xs">
          <div className="text-xl font-bold text-emerald-600">34</div>
          <div className="text-xs text-muted-foreground">Checked In (94%)</div>
        </div>
        <div className="p-3.5 rounded-xl border bg-card shadow-2xs">
          <div className="text-xl font-bold text-purple-700">2</div>
          <div className="text-xs text-muted-foreground">On Leave (6%)</div>
        </div>
        <div className="p-3.5 rounded-xl border bg-card shadow-2xs">
          <div className="text-xl font-bold text-amber-700">6</div>
          <div className="text-xs text-muted-foreground">Day Scholars</div>
        </div>
      </div>

      {/* TABLE TOOLBAR */}
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
          onClick={() => exportToCSV(sampleRows, "trainer_batch_allocations")}
          className="text-xs"
        >
          <Download className="size-3.5 mr-1" /> Export
        </Button>
      </div>

      {/* TABLE (MATCHING IMAGE 3 PANEL 2) */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/30 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">#</th>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Hostel</th>
                <th className="py-3 px-4">Block</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Bed</th>
                <th className="py-3 px-4">Check-in</th>
                <th className="py-3 px-4">Expected Checkout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground font-mono">{r.id}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{r.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.gender}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.hostel}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{r.block}</td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">{r.room}</td>
                  <td className="py-3 px-4 font-mono">{r.bed}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.checkIn}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.checkout}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={
                        r.status === "Checked In"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : r.status === "On Leave"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
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
