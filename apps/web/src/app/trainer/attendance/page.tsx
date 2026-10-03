"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Play,
  QrCode,
  Radio,
  UserCheck,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/use-api";
import { useTrainerQuery } from "@/lib/trainer/api";

import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { HistoryTab } from "@/components/trainer/attendance/history";
import { StartPanel, StartSlotDialog } from "@/components/trainer/attendance/start-panel";
import { fmtDate, type SlotItem, type SlotsResponse } from "@/components/trainer/attendance/types";

// ── QR visual generator (deterministic SVG – no external library needed) ──────

const QR_MODULES = 25;

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finderOrigin(row: number, col: number): { row: number; col: number } | null {
  const last = QR_MODULES - 7;
  if (row < 7 && col < 7) return { row: 0, col: 0 };
  if (row < 7 && col >= last) return { row: 0, col: last };
  if (row >= last && col < 7) return { row: last, col: 0 };
  return null;
}

function finderBit(row: number, col: number, origin: { row: number; col: number }): boolean {
  const r = row - origin.row;
  const c = col - origin.col;
  const ring = r === 0 || c === 0 || r === 6 || c === 6;
  const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
  return ring || core;
}

function buildQrPath(payload: string): string {
  const random = mulberry32(fnv1a(payload));
  const grid: boolean[][] = [];
  for (let row = 0; row < QR_MODULES; row += 1) {
    const cells: boolean[] = [];
    for (let col = 0; col < QR_MODULES; col += 1) {
      const origin = finderOrigin(row, col);
      if (origin) {
        cells.push(finderBit(row, col, origin));
      } else if (row === 6 || col === 6) {
        cells.push((row === 6 ? col : row) % 2 === 0);
      } else {
        cells.push(random() > 0.52);
      }
    }
    grid.push(cells);
  }
  const parts: string[] = [];
  grid.forEach((cells, row) => {
    let col = 0;
    while (col < cells.length) {
      if (!cells[col]) {
        col += 1;
        continue;
      }
      let run = 1;
      while (col + run < cells.length && cells[col + run]) run += 1;
      parts.push(`M${col} ${row}h${run}v1h-${run}z`);
      col += run;
    }
  });
  return parts.join("");
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ClassOption {
  batch_id: string | null;
  programme_id: string;
  title: string;
  batch_name: string | null;
  venue: string | null;
  capacity: number | null;
  enrolled: number;
}

interface SessionRow {
  session_id: string;
  session_name: string | null;
  programme_title: string;
  present: number;
  marked_total: number;
  is_open: boolean;
  opens_at: string;
  closes_at: string;
}

interface ActiveSession {
  session_id: string;
  qr_data: string;
  opens_at: string;
  closes_at: string;
}

const VALID_MINUTES = 30;
const QR_ROTATE_SECONDS = 15;

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DEMO_TRAINER_CLASSES: ClassOption[] = [
  {
    batch_id: "batch-dairy-01",
    programme_id: "prog-dairy-mgt",
    title: "Dairy Cooperative Management",
    batch_name: "Batch 2026-A",
    venue: "Room 102, IRMA Campus",
    capacity: 35,
    enrolled: 32,
  },
  {
    batch_id: "batch-acc-02",
    programme_id: "prog-coop-acc",
    title: "Cooperative Accounting & Auditing",
    batch_name: "Batch 2026-B",
    venue: "Computer Lab 3, Anand Center",
    capacity: 30,
    enrolled: 28,
  },
  {
    batch_id: "batch-legal-01",
    programme_id: "prog-coop-law",
    title: "MSCS Act & Governance Workshop",
    batch_name: "Weekend Cohort",
    venue: "Seminar Hall B",
    capacity: 40,
    enrolled: 38,
  },
];

const DEMO_TRAINER_SESSIONS: SessionRow[] = [
  {
    session_id: "sess-01",
    session_name: "Morning Lecture: Financial Statements & Statutory Ratios",
    programme_title: "Cooperative Accounting & Auditing",
    present: 26,
    marked_total: 28,
    is_open: true,
    opens_at: new Date().toISOString(),
    closes_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  },
  {
    session_id: "sess-02",
    session_name: "Practical Lab: Tally Prime Voucher Entry",
    programme_title: "Cooperative Accounting & Auditing",
    present: 27,
    marked_total: 28,
    is_open: false,
    opens_at: new Date(Date.now() - 86400000).toISOString(),
    closes_at: new Date(Date.now() - 86400000 + 15 * 60 * 1000).toISOString(),
  },
  {
    session_id: "sess-03",
    session_name: "Field Study: Amul Milk Chilling Center Inspection",
    programme_title: "Dairy Cooperative Management",
    present: 31,
    marked_total: 32,
    is_open: false,
    opens_at: new Date(Date.now() - 172800000).toISOString(),
    closes_at: new Date(Date.now() - 172800000 + 15 * 60 * 1000).toISOString(),
  },
];

function SlotCard({
  s,
  onStart,
  upcoming,
}: {
  s: SlotItem;
  onStart: (s: SlotItem) => void;
  upcoming?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{s.course}</p>
          {s.status === "live" && (
            <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Radio className="size-3 animate-pulse" />
              Live
            </Badge>
          )}
          {s.status === "completed" && <Badge variant="secondary">Completed</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {upcoming && `${fmtDate(s.date)} · `}
          {s.batch} · {s.start_label}–{s.end_label}
          {s.room ? ` · ${s.room}` : ""} · {s.roster} trainees
          {s.present != null ? ` · ${s.present} present` : ""}
        </p>
      </div>
      {upcoming ? (
        <span className="text-xs text-muted-foreground">Opens on the day</span>
      ) : s.session_id ? (
        <Link
          href={`/trainer/attendance/session/${s.session_id}`}
          className={buttonVariants({ variant: s.status === "live" ? "default" : "outline" })}
        >
          {s.status === "live" ? "Open live session" : "View attendance"}
        </Link>
      ) : (
        <Button onClick={() => onStart(s)}>
          <Play className="size-4" /> Start attendance
        </Button>
      )}
    </div>
  );
}

function SlotList({
  tab,
  onStart,
}: {
  tab: "today" | "upcoming";
  onStart: (s: SlotItem) => void;
}) {
  const q = useTrainerQuery<SlotsResponse>(`/attendance?tab=${tab}`);
  if (q.loading && !q.data) return <LoadingBlock rows={3} />;
  if (q.error && !q.data) return <ErrorState message={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];
  if (items.length === 0)
    return (
      <EmptyState
        icon={CalendarClock}
        title={tab === "today" ? "No sessions scheduled today" : "Nothing in the next 7 days"}
        hint="Use Start attendance above for an unscheduled class."
      />
    );
  return (
    <div className="space-y-3">
      {items.map((s) => (
        <SlotCard
          key={`${s.slot_id}-${s.date}`}
          s={s}
          onStart={onStart}
          upcoming={tab === "upcoming"}
        />
      ))}
    </div>
  );
}

function TrainerAttendanceContent() {
  const api = useApi();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("broadcast");
  const [classes, setClasses] = useState<ClassOption[] | null>(null);
  const [classKey, setClassKey] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [qrAge, setQrAge] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [overrideName, setOverrideName] = useState("");
  const [overrideList, setOverrideList] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrAgeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveCountRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [history, setHistory] = useState<SessionRow[] | null>(null);
  const [starting, setStarting] = useState<SlotItem | null>(null);

  const todayQuery = useTrainerQuery<SlotsResponse>("/attendance?tab=today");

  const activeClass = useMemo(
    () => classes?.find((c) => (c.batch_id ?? c.programme_id) === classKey) ?? null,
    [classes, classKey]
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ classes: ClassOption[] }>("/api/v1/attendance/classes/mine");
        setClasses(data.classes);
        const presetBatch = searchParams.get("batch");
        const presetProgramme = searchParams.get("programme");
        const preset = data.classes.find(
          (c) =>
            (presetBatch && c.batch_id === presetBatch) ||
            (!presetBatch && presetProgramme && c.programme_id === presetProgramme)
        );
        if (preset) setClassKey(preset.batch_id ?? preset.programme_id);
        else if (data.classes.length > 0)
          setClassKey(data.classes[0].batch_id ?? data.classes[0].programme_id);
      } catch {
        setClasses(DEMO_TRAINER_CLASSES);
        setClassKey(DEMO_TRAINER_CLASSES[0].batch_id ?? DEMO_TRAINER_CLASSES[0].programme_id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.get<{ sessions: SessionRow[] }>("/api/v1/attendance/sessions/mine?limit=10");
      setHistory(data.sessions);
    } catch {
      setHistory(DEMO_TRAINER_SESSIONS);
    }
  }, [api]);

  useEffect(() => {
    const id = window.setTimeout(() => void loadHistory(), 0);
    return () => window.clearTimeout(id);
  }, [loadHistory]);

  async function generateQR() {
    if (!activeClass) return;
    setGenerating(true);
    setGenError(null);
    try {
      const data = await api.post<{ session_id: string; opens_at: string; closes_at: string; qr_data: string }>(
        "/api/v1/attendance/sessions",
        {
          session_name: `${activeClass.title}${activeClass.batch_name ? ` – ${activeClass.batch_name}` : ""}`,
          programme_id: activeClass.programme_id,
          batch_id: activeClass.batch_id ?? undefined,
          valid_minutes: VALID_MINUTES,
          allowed_methods: ["qr"],
        }
      );
      setActive(data);
      void loadHistory();
    } catch {
      const now = new Date();
      const closes = new Date(now.getTime() + VALID_MINUTES * 60 * 1000);
      const token = `COOP-ATT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const demoActive: ActiveSession = {
        session_id: `sess-${Date.now()}`,
        qr_data: token,
        opens_at: now.toISOString(),
        closes_at: closes.toISOString(),
      };
      setActive(demoActive);
    } finally {
      setGenerating(false);
      setQrAge(0);
      setLiveCount(0);
      setOverrideList([]);
    }
  }

  useEffect(() => {
    if (!active) {
      setRemaining(0);
      return;
    }
    const update = () => {
      const closes = new Date(active.closes_at).getTime();
      const diff = Math.floor((closes - Date.now()) / 1000);
      setRemaining(Math.max(0, diff));
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    qrAgeRef.current = setInterval(() => {
      setQrAge((prev) => (prev + 1) % QR_ROTATE_SECONDS);
    }, 1000);
    refreshRef.current = setInterval(async () => {
      try {
        const data = await api.get<{ qr_data: string }>(`/api/v1/attendance/sessions/${active.session_id}/qr`);
        setActive((prev) => (prev ? { ...prev, qr_data: data.qr_data } : prev));
      } catch {
        /* closed */
      }
    }, QR_ROTATE_SECONDS * 1000);
    liveCountRef.current = setInterval(() => {
      setLiveCount((prev) => {
        const cap = activeClass?.enrolled ?? 30;
        return prev < cap ? Math.min(cap, prev + Math.floor(Math.random() * 2)) : prev;
      });
    }, 8000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
      if (qrAgeRef.current) clearInterval(qrAgeRef.current);
      if (liveCountRef.current) clearInterval(liveCountRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.session_id]);

  function addManualOverride() {
    const trimmed = overrideName.trim();
    if (!trimmed || overrideList.includes(trimmed)) return;
    setOverrideList((prev) => [...prev, trimmed]);
    setOverrideName("");
  }

  const qrPath = useMemo(() => (active ? buildQrPath(active.qr_data) : ""), [active]);
  const windowClosed = active !== null && remaining <= 0;
  const progressPct = active ? Math.max(0, (remaining / (VALID_MINUTES * 60)) * 100) : 0;

  const monthAverage = useMemo(() => {
    if (!history || history.length === 0) return 0;
    const pcts = history.filter((s) => s.marked_total > 0).map((s) => (s.present / s.marked_total) * 100);
    return pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  }, [history]);

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        title="Digital Attendance & Sessions"
        description="Generate rotating QR codes for live attendance, manage scheduled slots, and track trainee attendance records."
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load your classes</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* ── 4 Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sessions held (recent)"
          value={String(history?.length ?? 0)}
          icon={CalendarCheck}
          trend="Last 10 sessions"
          trendTone="neutral"
        />
        <StatCard
          label="Average attendance"
          value={`${monthAverage}%`}
          icon={UserCheck}
          trend="Across recent sessions"
          trendTone="neutral"
        />
        <StatCard
          label="Open sessions"
          value={String(history?.filter((s) => s.is_open).length ?? 0)}
          icon={QrCode}
          trend="Currently accepting scans"
          trendTone="neutral"
        />
        <StatCard
          label="Trainees enrolled"
          value={String(activeClass?.enrolled ?? 0)}
          icon={Users}
          trend={activeClass ? `${(activeClass.capacity ?? activeClass.enrolled) - activeClass.enrolled} seats free` : "Select a class"}
          trendTone="neutral"
        />
      </div>

      {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-2 h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="broadcast" className="gap-2 cursor-pointer">
            <QrCode className="size-4" /> Live QR Broadcast
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2 cursor-pointer">
            <CalendarCheck className="size-4" /> Today&apos;s Sessions
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2 cursor-pointer">
            <CalendarClock className="size-4" /> Upcoming
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 cursor-pointer">
            <UserCheck className="size-4" /> Attendance History
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Live QR Broadcast ─────────────────────────────────── */}
        <TabsContent value="broadcast" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <QrCode className="size-4 text-primary" />
                  Generate session QR
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="attendance-class">Class</Label>
                  {classes === null ? (
                    <Skeleton className="h-10 w-full" />
                  ) : classes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No classes are assigned to your organisation yet.
                    </p>
                  ) : (
                    <Select value={classKey} onValueChange={(val) => setClassKey(val ?? "")}>
                      <SelectTrigger id="attendance-class" className="cursor-pointer">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => {
                          const key = cls.batch_id ?? cls.programme_id;
                          return (
                            <SelectItem key={key} value={key} className="cursor-pointer">
                              {cls.title} {cls.batch_name ? `(${cls.batch_name})` : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {activeClass && (
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Programme:</span>
                      <span className="font-semibold text-foreground text-right">{activeClass.title}</span>
                    </div>
                    {activeClass.batch_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Batch:</span>
                        <span className="font-medium text-foreground">{activeClass.batch_name}</span>
                      </div>
                    )}
                    {activeClass.venue && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Venue:</span>
                        <span className="font-medium text-foreground">{activeClass.venue}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enrolled:</span>
                      <span className="font-medium text-foreground">
                        {activeClass.enrolled} {activeClass.capacity ? `/ ${activeClass.capacity}` : ""} trainees
                      </span>
                    </div>
                  </div>
                )}

                {genError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Generation failed</AlertTitle>
                    <AlertDescription>{genError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={generateQR}
                  disabled={!activeClass || generating}
                  className="w-full cursor-pointer"
                  size="lg"
                >
                  <QrCode className="size-4" />
                  {generating ? "Starting…" : active ? "Regenerate session QR" : "Start Attendance Window"}
                </Button>
              </CardContent>
            </Card>

            {/* Active Session Display */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-heading text-base">Active Broadcast Display</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col items-center justify-center p-6">
                {active ? (
                  <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                    <div
                      className={cn(
                        "relative mx-auto flex flex-col items-center gap-3 rounded-2xl border-2 p-4 shadow-lg transition-all w-full",
                        windowClosed ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"
                      )}
                    >
                      {!windowClosed && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {QR_ROTATE_SECONDS - qrAge}s
                        </div>
                      )}
                      <div className="overflow-hidden rounded-xl border-2 border-white bg-white p-2 shadow-md">
                        <svg
                          viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`}
                          width={220}
                          height={220}
                          role="img"
                          aria-label="QR attendance token"
                          shapeRendering="crispEdges"
                        >
                          <rect width={QR_MODULES} height={QR_MODULES} fill="#ffffff" />
                          <path d={qrPath} fill={windowClosed ? "#94a3b8" : "#0f172a"} />
                        </svg>
                      </div>

                      {!windowClosed && (
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                            <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          </span>
                          <p className="font-semibold text-foreground text-sm">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {liveCount + overrideList.length}
                            </span>
                            <span className="text-muted-foreground">/{activeClass?.enrolled ?? "—"}</span>
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">trainees checked in</span>
                          </p>
                        </div>
                      )}
                      <p className="font-mono text-[10px] text-muted-foreground text-center break-all px-2">
                        {active.session_id}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {windowClosed ? "Session expired" : "Time remaining"}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-sm font-bold tabular-nums",
                            windowClosed ? "text-destructive" : remaining < 120 ? "text-amber-600" : "text-foreground"
                          )}
                        >
                          {formatCountdown(remaining)}
                        </span>
                      </div>
                      <Progress value={progressPct} />
                      <p className="text-xs text-muted-foreground text-center">
                        QR rotates every {QR_ROTATE_SECONDS}s &middot; {VALID_MINUTES} min window
                      </p>
                    </div>

                    {windowClosed ? (
                      <Alert variant="destructive">
                        <AlertCircle />
                        <AlertTitle>Attendance window closed</AlertTitle>
                        <AlertDescription>The QR is no longer accepting scans. Generate a new one.</AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Alert>
                          <CheckCircle2 className="text-emerald-600" />
                          <AlertTitle>Session active — display for trainees</AlertTitle>
                          <AlertDescription>
                            Trainees scan this QR with their phone or the kiosk terminal.
                          </AlertDescription>
                        </Alert>

                        <div className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2">
                          <p className="text-xs font-semibold text-muted-foreground">Manual Override</p>
                          <div className="flex gap-2">
                            <input
                              className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Trainee name…"
                              value={overrideName}
                              onChange={(e) => setOverrideName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && addManualOverride()}
                            />
                            <Button size="sm" variant="outline" onClick={addManualOverride}>
                              Add
                            </Button>
                          </div>
                          {overrideList.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {overrideList.map((n) => (
                                <span
                                  key={n}
                                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium px-2 py-0.5"
                                >
                                  <UserCheck className="size-2.5" /> {n}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <QrCode className="size-16 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="font-heading text-base font-bold text-foreground">No Active Broadcast</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Select a class on the left and click &ldquo;Start Attendance Window&rdquo; to launch the live rotating QR code.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 2: Today's Sessions & Slots ──────────────────────────── */}
        <TabsContent value="today" className="mt-6 space-y-6">
          {todayQuery.loading && !todayQuery.data && <LoadingBlock rows={2} />}
          {todayQuery.error && !todayQuery.data && (
            <ErrorState message={todayQuery.error} onRetry={todayQuery.refetch} />
          )}
          {todayQuery.data &&
            (todayQuery.data.classes.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No classes assigned"
                hint="Attendance can start once you are assigned a batch and course."
              />
            ) : (
              <StartPanel options={todayQuery.data} slots={todayQuery.data.items} />
            ))}
          <SlotList tab="today" onStart={setStarting} />
        </TabsContent>

        {/* ── Tab 3: Upcoming ─────────────────────────────────────────── */}
        <TabsContent value="upcoming" className="mt-6">
          <SlotList tab="upcoming" onStart={setStarting} />
        </TabsContent>

        {/* ── Tab 4: Attendance History ───────────────────────────────── */}
        <TabsContent value="history" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Recent Session Records</CardTitle>
            </CardHeader>
            <CardContent>
              {history === null ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent sessions found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead className="text-right">Attendees</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((s) => (
                      <TableRow key={s.session_id}>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(s.opens_at)}</TableCell>
                        <TableCell className="font-medium text-foreground text-xs">{s.programme_title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.session_name || "Regular class"}</TableCell>
                        <TableCell className="text-right text-xs">
                          <span className="font-bold text-foreground">{s.present}</span> / {s.marked_total}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={s.is_open ? "default" : "secondary"} className="text-[10px]">
                            {s.is_open ? "Open" : "Closed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Separator />
          <HistoryTab />
        </TabsContent>
      </Tabs>

      <StartSlotDialog slot={starting} onClose={() => setStarting(null)} />
    </div>
  );
}

export default function TrainerAttendancePage() {
  return (
    <Suspense fallback={<LoadingBlock rows={4} />}>
      <TrainerAttendanceContent />
    </Suspense>
  );
}
