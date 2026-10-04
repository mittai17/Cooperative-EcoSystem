"use client";

import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TimetableSlot {
  id: string;
  day: string;
  time: string;
  title: string;
  batch: string;
  room: string;
  trainer: string;
  category: "Core" | "Lab" | "Field" | "Exam";
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const TIMESLOTS = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"] as const;

const MOCK_SCHEDULE_SLOTS: TimetableSlot[] = [
  { id: "s-1", day: "Monday", time: "09:00 AM", title: "Principles of Cooperative Governance", batch: "CMF-01", room: "Room 201", trainer: "Dr. Meera Kulkarni", category: "Core" },
  { id: "s-2", day: "Monday", time: "11:00 AM", title: "Statutory Audit & Balance Sheet Prep", batch: "CBK-02", room: "Finance Lab 1", trainer: "CA Ramesh Iyer", category: "Lab" },
  { id: "s-3", day: "Monday", time: "02:00 PM", title: "PACS Digitization & ERP System", batch: "ACC-01", room: "Computer Lab 3", trainer: "Deepak Chauhan", category: "Lab" },
  { id: "s-4", day: "Monday", time: "04:00 PM", title: "Dairy Processing & Cold Chain Ops", batch: "DCO-01", room: "Lecture Hall B", trainer: "Dr. Suresh Patil", category: "Core" },

  { id: "s-5", day: "Tuesday", time: "09:00 AM", title: "Cooperative Law & Rochdale Principles", batch: "CMF-01", room: "Room 201", trainer: "Dr. Hema Yadav", category: "Core" },
  { id: "s-6", day: "Tuesday", time: "11:00 AM", title: "Credit Appraisal for Agri Cooperatives", batch: "ACC-01", room: "Seminar Room 2", trainer: "Priya Nair", category: "Core" },
  { id: "s-7", day: "Tuesday", time: "02:00 PM", title: "Handloom Enterprise Branding & Marketing", batch: "HCE-01", room: "Design Studio", trainer: "Anita Sharma", category: "Core" },
  { id: "s-8", day: "Tuesday", time: "04:00 PM", title: "Tally Prime ERP & Daybook Entries", batch: "CBK-02", room: "Computer Lab 3", trainer: "Vikram Solanki", category: "Lab" },

  { id: "s-9", day: "Wednesday", time: "09:00 AM", title: "Milk Quality Testing & Fat Fatometer Lab", batch: "DCO-01", room: "Dairy Tech Lab", trainer: "Dr. Suresh Patil", category: "Lab" },
  { id: "s-10", day: "Wednesday", time: "11:00 AM", title: "Democratic Member Control & AGM Bylaws", batch: "CMF-01", room: "Room 201", trainer: "Dr. Meera Kulkarni", category: "Core" },
  { id: "s-11", day: "Wednesday", time: "02:00 PM", title: "NCDC Funding Schemes & Subsidy Rules", batch: "ACC-01", room: "Seminar Room 1", trainer: "Rajesh Kumar", category: "Core" },
  { id: "s-12", day: "Wednesday", time: "04:00 PM", title: "Special Lecture: PACS Computerization", batch: "All Batches", room: "Auditorium A", trainer: "Sh. V. K. Rao (Guest)", category: "Core" },

  { id: "s-13", day: "Thursday", time: "09:00 AM", title: "Risk Management in Cooperative Credit", batch: "ACC-01", room: "Seminar Room 2", trainer: "Priya Nair", category: "Core" },
  { id: "s-14", day: "Thursday", time: "11:00 AM", title: "Statutory Registers & Member Ledger Prep", batch: "CBK-02", room: "Finance Lab 1", trainer: "CA Ramesh Iyer", category: "Lab" },
  { id: "s-15", day: "Thursday", time: "02:00 PM", title: "Katraj Dairy Field Visit Debrief", batch: "DCO-01", room: "Room 201", trainer: "Dr. Suresh Patil", category: "Field" },
  { id: "s-16", day: "Thursday", time: "04:00 PM", title: "Viva Preparation & Governance Clinic", batch: "CMF-01", room: "Room 202", trainer: "Dr. Hema Yadav", category: "Core" },

  { id: "s-17", day: "Friday", time: "09:00 AM", title: "Export Standards for Cooperative Handlooms", batch: "HCE-01", room: "Design Studio", trainer: "Anita Sharma", category: "Core" },
  { id: "s-18", day: "Friday", time: "11:00 AM", title: "Micro-ATM & AePS Terminal Operations", batch: "ACC-01", room: "Computer Lab 3", trainer: "Deepak Chauhan", category: "Lab" },
  { id: "s-19", day: "Friday", time: "02:00 PM", title: "Cooperative Bylaw Amendments Case Clinic", batch: "CMF-01", room: "Room 201", trainer: "Dr. Meera Kulkarni", category: "Core" },
  { id: "s-20", day: "Friday", time: "04:00 PM", title: "Weekly Faculty Review & Doubt Clearing", batch: "All Batches", room: "Hall B", trainer: "Academic Dean", category: "Core" },

  { id: "s-21", day: "Saturday", time: "09:00 AM", title: "Continuous Assessment: Midterm Exam", batch: "CMF-01", room: "Online Lab 1", trainer: "Exam Coordinator", category: "Exam" },
  { id: "s-22", day: "Saturday", time: "11:00 AM", title: "National Cooperative Policy Consultation", batch: "All Batches", room: "Auditorium A", trainer: "NCCT Delegation", category: "Core" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Core: "border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary-dark",
  Lab: "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-800 hover:bg-emerald-50",
  Field: "border-amber-200 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-800 hover:bg-amber-50",
  Exam: "border-purple-200 bg-purple-50/60 dark:bg-purple-950/30 dark:border-purple-800 hover:bg-purple-50",
};

export default function TimetablePage() {
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [selectedRoom, setSelectedRoom] = useState<string>("ALL");
  const [activeSlot, setActiveSlot] = useState<TimetableSlot | null>(null);

  const filteredSlots = useMemo(() => {
    return MOCK_SCHEDULE_SLOTS.filter((s) => {
      if (selectedBatch !== "ALL" && s.batch !== selectedBatch && s.batch !== "All Batches") return false;
      if (selectedRoom !== "ALL" && s.room !== selectedRoom) return false;
      return true;
    });
  }, [selectedBatch, selectedRoom]);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    for (const slot of filteredSlots) {
      map.set(`${slot.day}-${slot.time}`, slot);
    }
    return map;
  }, [filteredSlots]);

  const uniqueBatches = useMemo(() => {
    return Array.from(new Set(MOCK_SCHEDULE_SLOTS.map((s) => s.batch))).filter(b => b !== "All Batches");
  }, []);

  const uniqueRooms = useMemo(() => {
    return Array.from(new Set(MOCK_SCHEDULE_SLOTS.map((s) => s.room)));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Day", "Time", "Course Title", "Batch", "Room", "Trainer", "Category"];
    const rows = filteredSlots.map((s) => [
      s.day,
      s.time,
      `"${s.title}"`,
      s.batch,
      `"${s.room}"`,
      `"${s.trainer}"`,
      s.category,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `timetable_${selectedBatch}_${selectedRoom}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Weekly Timetable"
        description="Master timetable across all classrooms, training labs, and seminar halls for the current term."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="mr-1.5 size-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1.5 size-4" /> Print
            </Button>
          </div>
        }
      />

      {/* Filter and Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="size-4 text-primary" />
            <span>Filter Schedule:</span>
          </div>

          <Select value={selectedBatch} onValueChange={(val) => val && setSelectedBatch(val)}>
            <SelectTrigger className="w-[180px] text-xs">
              <SelectValue placeholder="Filter by Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Batches</SelectItem>
              {uniqueBatches.map((b) => (
                <SelectItem key={b} value={b}>
                  Batch {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRoom} onValueChange={(val) => val && setSelectedRoom(val)}>
            <SelectTrigger className="w-[180px] text-xs">
              <SelectValue placeholder="Filter by Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Rooms / Labs</SelectItem>
              {uniqueRooms.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Core Lecture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Practical Lab</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Field Study</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">Exam / Assessment</span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center justify-between">
            <span>Academic Schedule · Week 4</span>
            <span className="text-xs font-normal text-muted-foreground">Click any class slot to inspect curriculum details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Table Header: Days */}
            <div className="grid grid-cols-7 gap-3 border-b border-border pb-3 text-center">
              <div className="text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Slot
              </div>
              {DAYS.map((day) => (
                <div key={day} className="font-semibold text-sm text-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            {TIMESLOTS.map((time) => (
              <div key={time} className="grid grid-cols-7 gap-3 border-b border-border/60 py-3 last:border-0 items-stretch">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <Clock className="mr-1.5 size-3.5 text-primary" />
                  {time}
                </div>
                {DAYS.map((day) => {
                  const session = scheduleMap.get(`${day}-${time}`);
                  return (
                    <div key={`${day}-${time}`} className="min-h-[105px]">
                      {session ? (
                        <div
                          onClick={() => setActiveSlot(session)}
                          className={`h-full rounded-xl border p-2.5 text-xs flex flex-col justify-between cursor-pointer transition-all shadow-2xs hover:shadow-sm ${
                            CATEGORY_COLORS[session.category] || CATEGORY_COLORS.Core
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                                {session.batch}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {session.category}
                              </span>
                            </div>
                            <div className="font-bold text-foreground text-xs line-clamp-2 leading-tight">
                              {session.title}
                            </div>
                          </div>
                          <div className="mt-2 pt-1 border-t border-border/40 text-[11px] text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="size-2.5 shrink-0" />
                              <span className="truncate">{session.room}</span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <User className="size-2.5 shrink-0" />
                              <span className="truncate">{session.trainer}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 p-2 text-center">
                          <span className="text-xs text-muted-foreground">Free Slot</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      <Dialog open={!!activeSlot} onOpenChange={(open) => !open && setActiveSlot(null)}>
        {activeSlot && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{activeSlot.category}</Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">{activeSlot.batch}</Badge>
              </div>
              <DialogTitle className="text-lg">{activeSlot.title}</DialogTitle>
              <DialogDescription>
                Accredited session under NCCT Curriculum Framework
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="size-4 text-primary" /> Day & Time:
                </span>
                <span className="font-semibold text-foreground">{activeSlot.day}, {activeSlot.time}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" /> Venue / Room:
                </span>
                <span className="font-semibold text-foreground">{activeSlot.room}</span>
              </div>

              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="size-4 text-primary" /> Faculty / Trainer:
                </span>
                <span className="font-semibold text-foreground">{activeSlot.trainer}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="size-4 text-primary" /> Attendance Mode:
                </span>
                <span className="font-semibold text-foreground">Digital Biometric / QR Scanner</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveSlot(null)}>Close</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
