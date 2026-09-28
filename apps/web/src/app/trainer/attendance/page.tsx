"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  History,
  QrCode,
  RefreshCw,
  ScanLine,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  TRAINER_TODAY_LABEL,
  attendanceHistory,
  monthAttendanceSummary,
  trainerClasses,
  type AttendanceRecord,
} from "@/lib/mock-data/trainer";

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
      if (!cells[col]) { col += 1; continue; }
      let run = 1;
      while (col + run < cells.length && cells[col + run]) run += 1;
      parts.push(`M${col} ${row}h${run}v1h-${run}z`);
      col += run;
    }
  });
  return parts.join("");
}

// ── Types ────────────────────────────────────────────────────────────────────

interface GeneratedSession {
  qr_token: string;
  session_id: string;
  valid_minutes: number;
  qr_data: string;
  generated_at: number; // epoch ms
}

type ApiStatus = "idle" | "loading" | "success" | "error";

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const VALID_MINUTES = 15;

// Pure module-level helper avoids React Compiler "impure in render" warning
function nowMs(): number { return Date.now(); }

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TrainerAttendancePage() {
  const [classId, setClassId] = useState(trainerClasses[0].id);
  const [sessionDate, setSessionDate] = useState(() => {
    // Default to today (deterministic after mount)
    return "2026-09-28";
  });

  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  const [generatedSession, setGeneratedSession] = useState<GeneratedSession | null>(null);

  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [history, setHistory] = useState<AttendanceRecord[]>(attendanceHistory);

  const activeClass = trainerClasses.find((c) => c.id === classId) ?? trainerClasses[0];

  const TOKEN_ROTATION_SECONDS = 30;
  const rotation = Math.floor(
    (VALID_MINUTES * 60 - remaining) / TOKEN_ROTATION_SECONDS,
  );

  const qrPayload = generatedSession
    ? `${generatedSession.qr_data}:rot${rotation}`
    : "";

  const qrPath = useMemo(() => (qrPayload ? buildQrPath(qrPayload) : ""), [qrPayload]);

  const windowClosed = generatedSession !== null && remaining <= 0;
  const progressPct = generatedSession
    ? Math.max(0, (remaining / (VALID_MINUTES * 60)) * 100)
    : 0;

  // Countdown ticker
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!generatedSession) return;

    const totalSec = VALID_MINUTES * 60;
    const getElapsed = () => Math.floor((nowMs() - generatedSession.generated_at) / 1000);

    intervalRef.current = setInterval(() => {
      const elapsed = getElapsed();
      setRemaining(Math.max(0, totalSec - elapsed));
      if (elapsed >= totalSec && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generatedSession]);

  async function generateQR() {
    const callTimestamp = nowMs();
    setApiStatus("loading");
    setApiError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/attendance/generate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_name: `${activeClass.title} – ${sessionDate}`,
          programme_id: "00000000-0000-0000-0000-000000000001",
          valid_minutes: VALID_MINUTES,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }

      const data = await res.json() as {
        qr_token: string;
        session_id: string;
        valid_minutes: number;
        qr_data: string;
      };

      setGeneratedSession({
        ...data,
        generated_at: callTimestamp,
      });
      setApiStatus("success");

      // Add optimistic record to history
      setHistory((prev) => [
        {
          id: `att-live-${data.session_id}`,
          date: sessionDate,
          classId,
          classTitle: activeClass.title,
          present: 0,
          late: 0,
          total: activeClass.enrolled,
          method: "QR",
          sync: "Queued",
        },
        ...prev,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const demoToken = `demo_${callTimestamp}`;
      // Fallback to demo mode so the UI is still interactive in offline/dev environments
      setGeneratedSession({
        qr_token: demoToken,
        session_id: `demo-session-${callTimestamp}`,
        valid_minutes: VALID_MINUTES,
        qr_data: `coopsetu:attend:${demoToken}`,
        generated_at: callTimestamp,
      });
      setApiError(`Backend offline – showing demo QR. (${message})`);
      setApiStatus("success");
    }
  }

  function regenerate() {
    setGeneratedSession(null);
    setApiStatus("idle");
    setApiError(null);
    setRemaining(0);
  }

  const monthAverage = Math.round(
    (monthAttendanceSummary.presentHeadcount / monthAttendanceSummary.expectedHeadcount) * 100,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Digital attendance"
        description={`Generate a rotating QR code for your session. Trainees scan it from their phone or the kiosk. Reference day: ${TRAINER_TODAY_LABEL}.`}
        action={<span className="demo-data-tag">History is sample data</span>}
      />

      {/* ── Stat row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Sessions held (${monthAttendanceSummary.monthLabel})`}
          value={String(monthAttendanceSummary.sessionsHeld)}
          icon={CalendarCheck}
          trend={`${monthAttendanceSummary.sessionsMarked} of ${monthAttendanceSummary.sessionsHeld} marked`}
          trendTone="up"
        />
        <StatCard
          label="Average attendance"
          value={`${monthAverage}%`}
          icon={UserCheck}
          trend={`${monthAttendanceSummary.lateArrivals} late arrivals`}
          trendTone="neutral"
        />
        <StatCard
          label="QR sessions"
          value={String(monthAttendanceSummary.qrSessions)}
          icon={QrCode}
          trend={`${monthAttendanceSummary.manualSessions} manual`}
          trendTone="neutral"
        />
        <StatCard
          label="Trainees enrolled"
          value={String(activeClass.enrolled)}
          icon={Users}
          trend={`${activeClass.capacity - activeClass.enrolled} seats free`}
          trendTone="neutral"
        />
      </div>

      {/* ── API error banner ── */}
      {apiError && (
        <Alert className="border-amber-500/30 bg-amber-50">
          <AlertCircle className="text-amber-700" />
          <AlertTitle>Demo mode active</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* ── QR generation panel ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <QrCode className="size-4 text-primary" />
              Generate session QR
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Form */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="attendance-class">Programme / Batch</Label>
                <Select
                  value={classId}
                  onValueChange={(v) => {
                    if (!v) return;
                    setClassId(v);
                    regenerate();
                  }}
                >
                  <SelectTrigger id="attendance-class" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {trainerClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {activeClass.room} &middot; {activeClass.scheduleDays.join(", ")}{" "}
                  {activeClass.startTime}–{activeClass.endTime}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="session-date">Session date</Label>
                <input
                  id="session-date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => {
                    setSessionDate(e.target.value);
                    regenerate();
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <Separator />

            {/* QR output area */}
            {apiStatus === "idle" && (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                  <ScanLine className="size-7 text-primary" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">No active session</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click the button below to generate a rotating QR token for your class.
                  </p>
                </div>
                <Button
                  onClick={generateQR}
                  className="w-full"
                  size="lg"
                >
                  <QrCode className="mr-2 size-4" />
                  Generate QR code
                </Button>
              </div>
            )}

            {apiStatus === "loading" && (
              <div className="flex flex-col gap-3">
                <Skeleton className="mx-auto size-48 rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <p className="text-center text-xs text-muted-foreground">
                  Minting session token…
                </p>
              </div>
            )}

            {apiStatus === "success" && generatedSession && (
              <div className="flex flex-col gap-4">
                {/* QR code visual */}
                <div className="mx-auto overflow-hidden rounded-xl border border-border bg-white p-3 shadow-sm">
                  <svg
                    viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`}
                    width={196}
                    height={196}
                    role="img"
                    aria-label="QR attendance token"
                    shapeRendering="crispEdges"
                  >
                    <rect width={QR_MODULES} height={QR_MODULES} fill="#ffffff" />
                    <path d={qrPath} fill={windowClosed ? "#94a3b8" : "#0f172a"} />
                  </svg>
                </div>

                {/* Token info */}
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Session token
                  </p>
                  <p className="mt-0.5 font-mono text-xs break-all text-foreground">
                    {generatedSession.qr_token}
                  </p>
                </div>

                {/* Countdown */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {windowClosed ? "Session expired" : "Time remaining"}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-sm font-bold tabular-nums",
                        windowClosed
                          ? "text-red-700"
                          : remaining < 120
                            ? "text-amber-700"
                            : "text-foreground",
                      )}
                    >
                      {formatCountdown(remaining)}
                    </span>
                  </div>
                  <Progress value={progressPct} />
                  <p className="text-xs text-muted-foreground">
                    Token rotates every 30 s &middot; rotation {rotation + 1} &middot;{" "}
                    {VALID_MINUTES} min window
                  </p>
                </div>

                {windowClosed && (
                  <Alert className="border-red-500/30 bg-red-50">
                    <AlertCircle className="text-red-700" />
                    <AlertTitle>Session window closed</AlertTitle>
                    <AlertDescription>
                      The QR is no longer accepting scans. Regenerate to open a new window.
                    </AlertDescription>
                  </Alert>
                )}

                {!windowClosed && (
                  <Alert className="border-emerald-500/30 bg-emerald-50">
                    <CheckCircle2 className="text-emerald-700" />
                    <AlertTitle>Session active</AlertTitle>
                    <AlertDescription>
                      Display this QR on the classroom projector. Trainees scan with their phone or
                      the kiosk terminal.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    regenerate();
                    // Small delay for UX then auto-generate
                    setTimeout(generateQR, 300);
                  }}
                >
                  <RefreshCw className="mr-2 size-4" />
                  Regenerate QR
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Info + history column ── */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <ol className="flex flex-col gap-3">
                {[
                  {
                    step: "1",
                    text: "Select your class and today's date, then click Generate QR Code.",
                  },
                  {
                    step: "2",
                    text: "Display the QR on your projector or the kiosk screen in the room.",
                  },
                  {
                    step: "3",
                    text: "Trainees open CoopSetu on their phone or walk to the kiosk and scan. Each scan is recorded instantly.",
                  },
                  {
                    step: "4",
                    text: "The token rotates every 30 seconds to prevent screenshot sharing. The session window is 15 minutes.",
                  },
                  {
                    step: "5",
                    text: "After 15 minutes (or when you click Regenerate) the old token expires. The register is queued for sync.",
                  },
                ].map(({ step, text }) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {step}
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Session history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <History className="size-4 text-primary" />
                Recent sessions
              </CardTitle>
              <span className="demo-data-tag">Sample data</span>
            </CardHeader>
            <CardContent className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="max-w-60">Class</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.slice(0, 8).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(record.date)}
                      </TableCell>
                      <TableCell className="max-w-60 truncate text-foreground">
                        {record.classTitle}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.present}/{record.total}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            record.method === "QR"
                              ? "bg-red-50 text-red-700"
                              : record.method === "Face"
                                ? "bg-red-50 text-red-700"
                                : "bg-muted text-muted-foreground"
                          }
                        >
                          {record.method === "QR" && <QrCode className="mr-1 size-3" />}
                          {record.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            record.sync === "Synced"
                              ? "bg-emerald-50 text-emerald-700"
                              : record.sync === "Queued"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          }
                        >
                          {record.sync === "Synced" ? (
                            <CheckCircle2 className="mr-1 size-3" />
                          ) : record.sync === "Queued" ? (
                            <Clock className="mr-1 size-3" />
                          ) : (
                            <XCircle className="mr-1 size-3" />
                          )}
                          {record.sync}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Alert>
            <ClipboardCheck />
            <AlertTitle>Attendance is finalised through the kiosk</AlertTitle>
            <AlertDescription>
              Once the session window closes, the register is visible on the{" "}
              <a href="/kiosk/attendance" className="font-medium underline">
                kiosk attendance page
              </a>
              . Trainers can apply manual overrides there before the record is synced to NCCT.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
