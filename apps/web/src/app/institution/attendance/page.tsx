"use client";

import { useMemo, useState } from "react";
import {
  Download,
  QrCode,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Session {
  id: string;
  date: string;
  time: string;
  programme: string;
  batch: string;
  topic: string;
  room: string;
  faculty: string;
  enrolled: number;
  present: number;
  status: "Completed" | "In-Progress" | "Scheduled";
}

interface TraineeAttendance {
  traineeId: string;
  name: string;
  rollNo: string;
  society: string;
  status: "Present" | "Absent" | "Late";
  timeMarked?: string;
}

const INITIAL_SESSIONS: Session[] = [
  { id: "s-101", date: "2026-10-04", time: "09:00 AM - 11:00 AM", programme: "Cooperative Management Fundamentals", batch: "CMF-01", topic: "Democratic Governance & Board Bylaws", room: "Room 201", faculty: "Dr. Meera Kulkarni", enrolled: 45, present: 42, status: "Completed" },
  { id: "s-102", date: "2026-10-04", time: "11:30 AM - 01:00 PM", programme: "Cooperative Bookkeeping & Statutory Audit", batch: "CBK-02", topic: "Daybook Posting & Tally Practical", room: "Computer Lab 3", faculty: "CA Ramesh Iyer", enrolled: 38, present: 36, status: "In-Progress" },
  { id: "s-103", date: "2026-10-04", time: "02:00 PM - 03:30 PM", programme: "Dairy Cooperative Operations", batch: "DCO-01", topic: "Milk Procurement Cold Chain Protocols", room: "Hall B", faculty: "Dr. Suresh Patil", enrolled: 32, present: 0, status: "Scheduled" },
  { id: "s-104", date: "2026-10-04", time: "04:00 PM - 05:30 PM", programme: "Agricultural Credit Cooperative Management", batch: "ACC-01", topic: "PACS Computerization & Kisan Credit Card", room: "Seminar Room 2", faculty: "Priya Nair", enrolled: 40, present: 0, status: "Scheduled" },
  { id: "s-105", date: "2026-10-03", time: "09:00 AM - 11:00 AM", programme: "Cooperative Management Fundamentals", batch: "CMF-01", topic: "Rochdale Principles & Cooperative Identity", room: "Room 201", faculty: "Dr. Hema Yadav", enrolled: 45, present: 44, status: "Completed" },
  { id: "s-106", date: "2026-10-03", time: "11:30 AM - 01:00 PM", programme: "Handloom & Handicraft Cooperative Enterprise", batch: "HCE-01", topic: "Export Documentation & GI Tagging", room: "Design Studio", faculty: "Anita Sharma", enrolled: 28, present: 26, status: "Completed" },
  { id: "s-107", date: "2026-10-03", time: "02:00 PM - 04:00 PM", programme: "Cooperative Bookkeeping & Statutory Audit", batch: "CBK-02", topic: "Statutory Audit Preparation & Checklists", room: "Finance Lab 1", faculty: "CA Ramesh Iyer", enrolled: 38, present: 35, status: "Completed" },
];

const MOCK_TRAINEES_SEED: Record<string, TraineeAttendance[]> = {
  "s-101": [
    { traineeId: "t-1", name: "Anjali Rathore", rollNo: "CMF-001", society: "Anand Taluka Sahakari Mandali", status: "Present", timeMarked: "08:55 AM" },
    { traineeId: "t-2", name: "Vikram Solanki", rollNo: "CMF-002", society: "Baroda District Cooperative", status: "Present", timeMarked: "08:58 AM" },
    { traineeId: "t-3", name: "Farida Khatoon", rollNo: "CMF-003", society: "Mehsana Milk Producers Union", status: "Present", timeMarked: "09:02 AM" },
    { traineeId: "t-4", name: "Deepak Chauhan", rollNo: "CMF-004", society: "Sabarkantha District Bank", status: "Late", timeMarked: "09:18 AM" },
    { traineeId: "t-5", name: "Ramesh Singh", rollNo: "CMF-005", society: "Kheda Agri Marketing Society", status: "Absent" },
    { traineeId: "t-6", name: "Pooja Deshmukh", rollNo: "CMF-006", society: "Pune PACS Cooperative Society", status: "Present", timeMarked: "08:52 AM" },
  ],
  "s-102": [
    { traineeId: "t-7", name: "Suresh Kumar", rollNo: "CBK-001", society: "Kolhapur District Coop Bank", status: "Present", timeMarked: "11:25 AM" },
    { traineeId: "t-8", name: "Priya Mehta", rollNo: "CBK-002", society: "Surat Urban Cooperative", status: "Present", timeMarked: "11:28 AM" },
    { traineeId: "t-9", name: "Amit Verma", rollNo: "CBK-003", society: "Nashik Farmers Credit Union", status: "Present", timeMarked: "11:30 AM" },
    { traineeId: "t-10", name: "Sunita Yadav", rollNo: "CBK-004", society: "Indore Agri Cooperative Mandali", status: "Absent" },
  ],
};

export default function AttendancePage() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionRoster, setSessionRoster] = useState<TraineeAttendance[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedQrSessionId, setSelectedQrSessionId] = useState<string>(sessions[0]?.id || "s-101");
  const [qrToken, setQrToken] = useState<string>("COOP-ATT-S-101-894210");
  const [filterProgramme, setFilterProgramme] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterProgramme !== "ALL" && s.programme !== filterProgramme) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.topic.toLowerCase().includes(q) ||
          s.programme.toLowerCase().includes(q) ||
          s.faculty.toLowerCase().includes(q) ||
          s.batch.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, filterProgramme, search]);

  const uniqueProgrammes = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.programme)));
  }, [sessions]);

  const openSessionDetail = (session: Session) => {
    setSelectedSession(session);
    const existing = MOCK_TRAINEES_SEED[session.id] || [
      { traineeId: "t-1", name: "Anjali Rathore", rollNo: "ROL-01", society: "Anand Sahakari Mandali", status: "Present", timeMarked: "09:00 AM" },
      { traineeId: "t-2", name: "Vikram Solanki", rollNo: "ROL-02", society: "Baroda Cooperative", status: "Present", timeMarked: "09:05 AM" },
      { traineeId: "t-3", name: "Farida Khatoon", rollNo: "ROL-03", society: "Mehsana Union", status: "Present", timeMarked: "09:02 AM" },
      { traineeId: "t-4", name: "Deepak Chauhan", rollNo: "ROL-04", society: "Sabarkantha Bank", status: "Absent" },
    ];
    setSessionRoster(existing);
  };

  const toggleTraineeStatus = (traineeId: string, newStatus: "Present" | "Absent" | "Late") => {
    setSessionRoster((prev) =>
      prev.map((t) => (t.traineeId === traineeId ? { ...t, status: newStatus } : t))
    );
  };

  const handleMarkAllPresent = () => {
    setSessionRoster((prev) => prev.map((t) => ({ ...t, status: "Present", timeMarked: "09:00 AM" })));
  };

  const handleSaveAttendance = () => {
    if (!selectedSession) return;
    const presentCount = sessionRoster.filter((t) => t.status === "Present" || t.status === "Late").length;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSession.id
          ? {
              ...s,
              present: presentCount,
              status: "Completed",
            }
          : s
      )
    );
    setSelectedSession(null);
    setNotice(`Attendance saved for session ${selectedSession.topic}. (${presentCount}/${sessionRoster.length} recorded present)`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleDownloadCsv = () => {
    const headers = ["Session ID", "Date", "Time", "Programme", "Batch", "Topic", "Venue", "Faculty", "Enrolled", "Present", "Attendance %", "Status"];
    const rows = filteredSessions.map((s) => [
      s.id,
      s.date,
      `"${s.time}"`,
      `"${s.programme}"`,
      s.batch,
      `"${s.topic}"`,
      `"${s.room}"`,
      `"${s.faculty}"`,
      s.enrolled,
      s.present,
      s.status === "Scheduled" ? "0%" : `${Math.round((s.present / s.enrolled) * 100)}%`,
      s.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `attendance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Attendance Management"
        description="Verify trainee presence, launch QR code check-ins, and manage session logs across training halls."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
              <Download className="mr-1.5 size-4" /> Download Report
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const code = Date.now().toString().slice(-6);
                setQrToken(`COOP-ATT-${selectedQrSessionId.toUpperCase()}-${code}`);
                setQrOpen(true);
              }}
            >
              <QrCode className="mr-1.5 size-4" /> Generate Session QR
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0" />
          {notice}
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Enrolled"
          value="188 Trainees"
          trend="Across 5 Batches"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Attendance Rate"
          value="91.4%"
          trend="↑ 2.8% vs last week"
        />
        <StatCard
          icon={Clock}
          label="Today's Sessions"
          value="4 Classes"
          trend="2 Completed, 1 Live"
        />
        <StatCard
          icon={CheckCircle2}
          label="Biometric & QR Scans"
          value="156 Scans"
          trend="99.2% match rate"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="size-4 text-primary" />
            <span>Filter Sessions:</span>
          </div>

          <Select value={filterProgramme} onValueChange={(val) => val && setFilterProgramme(val)}>
            <SelectTrigger className="w-[260px] text-xs">
              <SelectValue placeholder="All Programmes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Programmes</SelectItem>
              {uniqueProgrammes.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search topic or faculty..."
            className="pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Classroom & Workshop Attendance Sessions</CardTitle>
          <CardDescription>Select any session to view the trainee roster or mark biometric overrides.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Programme & Batch</TableHead>
                  <TableHead>Session Topic</TableHead>
                  <TableHead>Venue & Faculty</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const pct = session.enrolled > 0 ? Math.round((session.present / session.enrolled) * 100) : 0;
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="font-medium text-foreground text-xs">{session.date}</div>
                        <div className="text-[11px] text-muted-foreground">{session.time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground text-xs">{session.programme}</div>
                        <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                          {session.batch}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground max-w-[200px] truncate">
                        {session.topic}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-foreground">{session.room}</div>
                        <div className="text-[11px] text-muted-foreground">{session.faculty}</div>
                      </TableCell>
                      <TableCell>
                        {session.status === "Scheduled" ? (
                          <span className="text-xs text-muted-foreground">Pending Start</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground">
                              {pct}%
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              ({session.present}/{session.enrolled})
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            session.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              : session.status === "In-Progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                              : "bg-slate-50 text-slate-600 border-slate-200 text-[10px]"
                          }
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-semibold"
                          onClick={() => openSessionDetail(session)}
                        >
                          <Eye className="mr-1 size-3.5" />
                          View Roster
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Trainee Roster Detail Modal */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        {selectedSession && (
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{selectedSession.batch}</Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">{selectedSession.room}</Badge>
              </div>
              <DialogTitle className="text-lg">{selectedSession.topic}</DialogTitle>
              <DialogDescription>
                Faculty: {selectedSession.faculty} · Date: {selectedSession.date} ({selectedSession.time})
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground">
                Trainees ({sessionRoster.length})
              </span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleMarkAllPresent}>
                Mark All Present
              </Button>
            </div>

            <div className="space-y-2 py-2">
              {sessionRoster.map((trainee) => (
                <div
                  key={trainee.traineeId}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">{trainee.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {trainee.rollNo} · {trainee.society}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={trainee.status === "Present" ? "default" : "outline"}
                      className={`h-7 px-2.5 text-xs ${trainee.status === "Present" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                      onClick={() => toggleTraineeStatus(trainee.traineeId, "Present")}
                    >
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={trainee.status === "Late" ? "default" : "outline"}
                      className={`h-7 px-2.5 text-xs ${trainee.status === "Late" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                      onClick={() => toggleTraineeStatus(trainee.traineeId, "Late")}
                    >
                      Late
                    </Button>
                    <Button
                      size="sm"
                      variant={trainee.status === "Absent" ? "default" : "outline"}
                      className={`h-7 px-2.5 text-xs ${trainee.status === "Absent" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}`}
                      onClick={() => toggleTraineeStatus(trainee.traineeId, "Absent")}
                    >
                      Absent
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-3">
              <Button variant="outline" onClick={() => setSelectedSession(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAttendance}>Save Attendance</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Live Session Attendance QR</DialogTitle>
            <DialogDescription className="text-center">
              Display on the classroom projector screen. Trainees scan with the NURVEX mobile app to auto-log presence.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2">
            <Select
              value={selectedQrSessionId}
              onValueChange={(val) => {
                if (val) {
                  setSelectedQrSessionId(val);
                  const code = Date.now().toString().slice(-6);
                  setQrToken(`COOP-ATT-${val.toUpperCase()}-${code}`);
                }
              }}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Choose Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.batch} · {s.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center p-6 bg-white rounded-xl border border-border mx-auto my-3 shadow-inner">
            <QrCode className="size-56 text-black" strokeWidth={1} />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-mono bg-muted p-2 rounded text-foreground font-semibold">
              TOKEN: {qrToken}
            </p>
            <p>QR refreshes dynamically every 45 seconds to prevent sharing.</p>
          </div>

          <DialogFooter className="sm:justify-center pt-2">
            <Button variant="outline" onClick={() => setQrOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
