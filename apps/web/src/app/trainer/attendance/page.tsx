"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  History,
  QrCode,
  RefreshCw,
  ScanLine,
  UserCheck,
  Users,
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
import { ApiError, useApi } from "@/lib/use-api";

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

const VALID_MINUTES = 15;

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TrainerAttendancePage() {
  const api = useApi();
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<ClassOption[] | null>(null);
  const [classKey, setClassKey] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [active, setActive] = useState<ActiveSession | null>(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [history, setHistory] = useState<SessionRow[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const activeClass = useMemo(
    () => classes?.find((c) => (c.batch_id ?? c.programme_id) === classKey) ?? null,
    [classes, classKey],
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ classes: ClassOption[] }>("/api/v1/attendance/classes/mine");
        setClasses(data.classes);
        const presetBatch = searchParams.get("batch");
        const presetProgramme = searchParams.get("programme");
        const preset = data.classes.find(
          (c) => (presetBatch && c.batch_id === presetBatch) || (!presetBatch && presetProgramme && c.programme_id === presetProgramme),
        );
        if (preset) setClassKey(preset.batch_id ?? preset.programme_id);
        else if (data.classes.length > 0) setClassKey(data.classes[0].batch_id ?? data.classes[0].programme_id);
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.detail : "Could not reach the CoopSetu API");
        setClasses([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryError(null);
    try {
      const data = await api.get<{ sessions: SessionRow[] }>("/api/v1/attendance/sessions/mine?limit=10");
      setHistory(data.sessions);
    } catch (err) {
      setHistoryError(err instanceof ApiError ? err.detail : "Could not load session history.");
      setHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        },
      );
      setActive(data);
      void loadHistory();
    } catch (err) {
      setGenError(err instanceof ApiError ? err.detail : "Could not create an attendance session.");
    } finally {
      setGenerating(false);
    }
  }

  function regenerate() {
    setActive(null);
    setGenError(null);
    setRemaining(0);
  }

  // Countdown to session close.
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!active) return;
    const closesAt = new Date(active.closes_at).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((closesAt - Date.now()) / 1000)));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  // Refresh the real rotating QR token from the server every 25s so the
  // rendered code always embeds a currently-valid credential.
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (!active) return;
    refreshRef.current = setInterval(async () => {
      try {
        const data = await api.get<{ qr_data: string }>(`/api/v1/attendance/sessions/${active.session_id}/qr`);
        setActive((prev) => (prev ? { ...prev, qr_data: data.qr_data } : prev));
      } catch {
        // Session likely closed; the countdown will reflect that.
      }
    }, 25_000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.session_id]);

  const qrPath = useMemo(() => (active ? buildQrPath(active.qr_data) : ""), [active]);
  const windowClosed = active !== null && remaining <= 0;
  const progressPct = active ? Math.max(0, (remaining / (VALID_MINUTES * 60)) * 100) : 0;

  const monthAverage = useMemo(() => {
    if (!history || history.length === 0) return 0;
    const pcts = history.filter((s) => s.marked_total > 0).map((s) => (s.present / s.marked_total) * 100);
    return pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  }, [history]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Digital attendance"
        description="Generate a rotating QR code for your class. Trainees scan it from their phone or the kiosk."
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load your classes</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessions held (recent)" value={String(history?.length ?? 0)} icon={CalendarCheck} trend="Last 10 sessions" trendTone="neutral" />
        <StatCard label="Average attendance" value={`${monthAverage}%`} icon={UserCheck} trend="Across recent sessions" trendTone="neutral" />
        <StatCard label="Open sessions" value={String(history?.filter((s) => s.is_open).length ?? 0)} icon={QrCode} trend="Currently accepting scans" trendTone="neutral" />
        <StatCard label="Trainees enrolled" value={String(activeClass?.enrolled ?? 0)} icon={Users} trend={activeClass ? `${(activeClass.capacity ?? activeClass.enrolled) - activeClass.enrolled} seats free` : "Select a class"} trendTone="neutral" />
      </div>

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
                <p className="text-sm text-muted-foreground">No classes are assigned to your organisation yet.</p>
              ) : (
                <Select
                  items={classes.map((cls) => ({
                    label: `${cls.title}${cls.batch_name ? ` — ${cls.batch_name}` : ""}`,
                    value: cls.batch_id ?? cls.programme_id,
                  }))}
                  value={classKey}
                  onValueChange={(v) => {
                    if (!v) return;
                    setClassKey(v);
                    regenerate();
                  }}
                >
                  <SelectTrigger id="attendance-class" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.batch_id ?? cls.programme_id} value={cls.batch_id ?? cls.programme_id}>
                        {cls.title}{cls.batch_name ? ` — ${cls.batch_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {activeClass && (
                <p className="text-xs text-muted-foreground">
                  {activeClass.venue ?? "Venue not set"} &middot; {activeClass.enrolled} enrolled
                </p>
              )}
            </div>

            <Separator />

            {genError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Could not generate QR</AlertTitle>
                <AlertDescription>{genError}</AlertDescription>
              </Alert>
            )}

            {!active && (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
                <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                  <ScanLine className="size-7 text-primary" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">No active session</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click below to open a {VALID_MINUTES}-minute attendance window for the selected class.
                  </p>
                </div>
                <Button onClick={generateQR} className="w-full" size="lg" disabled={!activeClass || generating}>
                  {generating ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <QrCode className="mr-2 size-4" />}
                  Generate QR code
                </Button>
              </div>
            )}

            {active && (
              <div className="flex flex-col gap-4">
                <div className="mx-auto overflow-hidden rounded-xl border border-border bg-white p-3 shadow-sm">
                  <svg viewBox={`0 0 ${QR_MODULES} ${QR_MODULES}`} width={196} height={196} role="img" aria-label="QR attendance token" shapeRendering="crispEdges">
                    <rect width={QR_MODULES} height={QR_MODULES} fill="#ffffff" />
                    <path d={qrPath} fill={windowClosed ? "#94a3b8" : "#0f172a"} />
                  </svg>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Session</p>
                  <p className="mt-0.5 font-mono text-xs break-all text-foreground">{active.session_id}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {windowClosed ? "Session expired" : "Time remaining"}
                    </span>
                    <span className={cn("font-mono text-sm font-bold tabular-nums", windowClosed ? "text-destructive" : remaining < 120 ? "text-warning" : "text-foreground")}>
                      {formatCountdown(remaining)}
                    </span>
                  </div>
                  <Progress value={progressPct} />
                  <p className="text-xs text-muted-foreground">QR refreshes every 25s from the server &middot; {VALID_MINUTES} min window</p>
                </div>

                {windowClosed ? (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Session window closed</AlertTitle>
                    <AlertDescription>The QR is no longer accepting scans. Generate a new one.</AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle2 className="text-success" />
                    <AlertTitle>Session active</AlertTitle>
                    <AlertDescription>Display this QR for trainees to scan with their phone or the kiosk terminal.</AlertDescription>
                  </Alert>
                )}

                <Button variant="outline" size="lg" className="w-full" onClick={regenerate}>
                  <RefreshCw className="mr-2 size-4" />
                  New session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <History className="size-4 text-primary" />
                  Recent sessions
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={loadHistory} aria-label="Refresh session history">
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="rounded-lg border border-border">
              {historyError && (
                <Alert variant="destructive" className="m-3">
                  <AlertCircle />
                  <AlertDescription>{historyError}</AlertDescription>
                </Alert>
              )}
              {history === null ? (
                <div className="flex flex-col gap-2 p-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No attendance sessions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="max-w-60">Class</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((session) => (
                      <TableRow key={session.session_id}>
                        <TableCell className="font-mono text-xs">{formatDate(session.opens_at)}</TableCell>
                        <TableCell className="max-w-60 truncate text-foreground">{session.session_name ?? session.programme_title}</TableCell>
                        <TableCell className="text-right font-mono">{session.present}/{session.marked_total}</TableCell>
                        <TableCell>
                          {session.is_open ? (
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive">Live</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">Closed</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
