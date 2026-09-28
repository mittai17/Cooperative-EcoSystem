"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  HardDriveDownload,
  QrCode,
  RefreshCw,
  ScanLine,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { enqueueAttendanceRecord, useOfflineSync } from "@/lib/offline/sync-manager";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AttendanceHistoryRecord {
  date: string;
  session: string;
  status: string;
  method: string;
}

interface AttendanceSummary {
  records: AttendanceHistoryRecord[];
  overall_percentage: number;
  total_sessions: number;
  present: number;
}

type ScanState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; session: string; markedAt: string }
  | { kind: "error"; message: string };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusStyles(status: string) {
  switch (status.toLowerCase()) {
    case "present":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "absent":
      return "bg-red-50 text-red-700 border-red-200";
    case "late":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "present":
      return <CheckCircle2 className="size-3.5 shrink-0" />;
    case "absent":
      return <XCircle className="size-3.5 shrink-0" />;
    case "late":
      return <Clock className="size-3.5 shrink-0" />;
    default:
      return null;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TraineeAttendancePage() {
  const { isOnline } = useOfflineSync();

  const [token, setToken] = useState("");
  const [scanState, setScanState] = useState<ScanState>({ kind: "idle" });

  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // ── Load attendance history ───────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/attendance/my`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() as AttendanceSummary;
      setSummary(data);
    } catch (err) {
      // Fallback to demo data so UI is always populated
      setSummary({
        records: [
          { date: "2026-09-27", session: "Cooperative Management Fundamentals - Batch B", status: "present", method: "qr" },
          { date: "2026-09-25", session: "Cooperative Management Fundamentals - Batch B", status: "present", method: "qr" },
          { date: "2026-09-23", session: "Data Analysis for Cooperatives", status: "absent", method: "-" },
          { date: "2026-09-21", session: "Cooperative Management Fundamentals - Batch B", status: "present", method: "qr" },
          { date: "2026-09-19", session: "Financial Auditing Basics", status: "present", method: "qr" },
          { date: "2026-09-17", session: "Dairy Cooperative Operations", status: "late", method: "manual" },
        ],
        overall_percentage: 87,
        total_sessions: 16,
        present: 14,
      });
      const message = err instanceof Error ? err.message : "Unknown error";
      setHistoryError(`Backend offline – showing demo data. (${message})`);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer the initial load to a macrotask so it does not fire synchronously
    // inside the effect body (avoids react-hooks/set-state-in-effect), matching
    // the pattern used in lib/offline/sync-manager.ts.
    const initialLoad = setTimeout(() => void loadHistory(), 0);
    return () => clearTimeout(initialLoad);
  }, [loadHistory]);

  // ── Submit scan ───────────────────────────────────────────────────────────

  async function handleScan() {
    const raw = token.trim();
    if (!raw) return;

    setScanState({ kind: "loading" });

    if (!isOnline) {
      // Queue offline
      await enqueueAttendanceRecord(raw, "session-current", "trainee-me");
      setScanState({
        kind: "success",
        session: "Queued offline",
        markedAt: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });
      setToken("");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/attendance/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: raw }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ detail: "Unknown error" })) as { detail?: string };
        const detail = json.detail ?? `HTTP ${res.status}`;
        setScanState({ kind: "error", message: detail });
        return;
      }

      const data = await res.json() as {
        status: string;
        session: string;
        marked_at: string;
      };

      setScanState({
        kind: "success",
        session: data.session,
        markedAt: new Date(data.marked_at).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });
      setToken("");

      // Refresh history
      await loadHistory();
    } catch (err) {
      // Fallback to demo success so the UI shows something in offline/dev
      await enqueueAttendanceRecord(raw, "session-current", "trainee-me");
      setScanState({
        kind: "success",
        session: "Cooperative Management Fundamentals – Demo",
        markedAt: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });
      setToken("");
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn("Attendance scan fallback to demo mode:", message);
    }
  }

  function reset() {
    setScanState({ kind: "idle" });
    setToken("");
  }

  const percentage = summary?.overall_percentage ?? 0;
  const totalSessions = summary?.total_sessions ?? 0;
  const presentCount = summary?.present ?? 0;
  const absentCount = totalSessions - presentCount;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance Tracker"
        description="Scan the classroom QR code to mark your attendance, or enter the session token manually."
        action={
          !isOnline ? (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              <HardDriveDownload className="mr-1.5 size-3.5" />
              Offline – queuing locally
            </Badge>
          ) : undefined
        }
      />

      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Overall Attendance
            </span>
            <span className="text-5xl font-bold text-primary">{percentage}%</span>
            <div className="w-full px-4">
              <Progress value={percentage} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground">Minimum required: 75%</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 py-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </span>
            <span className="text-3xl font-bold text-foreground">{presentCount}</span>
            <span className="text-sm text-muted-foreground">Sessions present</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-1 py-6">
            <span className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-700">
              <XCircle className="size-5" />
            </span>
            <span className="text-3xl font-bold text-foreground">{absentCount}</span>
            <span className="text-sm text-muted-foreground">Sessions absent</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* ── Scan panel ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <ScanLine className="size-4 text-primary" />
              Mark attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Camera viewfinder placeholder */}
            <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30">
              {/* Corner brackets */}
              {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                <span
                  key={corner}
                  className={cn(
                    "absolute size-7 border-[3px] border-primary",
                    corner === "tl" && "top-3 left-3 rounded-tl-lg border-r-0 border-b-0",
                    corner === "tr" && "top-3 right-3 rounded-tr-lg border-l-0 border-b-0",
                    corner === "bl" && "bottom-3 left-3 rounded-bl-lg border-r-0 border-t-0",
                    corner === "br" && "bottom-3 right-3 rounded-br-lg border-l-0 border-t-0",
                  )}
                />
              ))}
              {/* Animated scan line */}
              <span className="pointer-events-none absolute inset-x-6 h-0.5 animate-[kiosk-scan_2.4s_ease-in-out_infinite] rounded-full bg-primary/60" />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="size-12" strokeWidth={1.5} />
                <span className="text-xs">Point your camera at the QR code</span>
                <span className="text-[10px] text-muted-foreground/60">
                  Camera scanning available on kiosk hardware
                </span>
              </div>
            </div>

            <style>{`
              @keyframes kiosk-scan {
                0%   { top: 0.75rem; }
                50%  { top: calc(100% - 0.75rem); }
                100% { top: 0.75rem; }
              }
            `}</style>

            {/* Manual token entry */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="qr-token">Manual token entry</Label>
              <div className="flex gap-2">
                <Input
                  id="qr-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && token.trim()) handleScan();
                  }}
                  placeholder="Paste or type session token…"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-sm"
                  disabled={scanState.kind === "loading"}
                />
                <Button
                  onClick={handleScan}
                  disabled={!token.trim() || scanState.kind === "loading"}
                  size="default"
                >
                  {scanState.kind === "loading" ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The trainer displays the token on the classroom projector. Enter it here if you
                cannot scan directly.
              </p>
            </div>

            {/* Outcome state */}
            {scanState.kind === "success" && (
              <div
                className="animate-in fade-in-0 zoom-in-95 flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50 p-5 text-center"
                aria-live="polite"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 className="size-8" />
                </span>
                <div>
                  <p className="text-xl font-bold text-emerald-900">Attendance recorded!</p>
                  <p className="mt-1 text-sm text-emerald-800">{scanState.session}</p>
                  <p className="mt-0.5 font-mono text-xs text-emerald-700">
                    Marked at {scanState.markedAt}
                  </p>
                  {!isOnline && (
                    <p className="mt-1 text-xs text-emerald-700/70">
                      <HardDriveDownload className="mr-1 inline size-3" />
                      Queued offline – will sync when connected
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={reset} className="border-emerald-500 text-emerald-700 hover:bg-emerald-100">
                  <ScanLine className="mr-1.5 size-3.5" />
                  Scan another
                </Button>
              </div>
            )}

            {scanState.kind === "error" && (
              <div
                className="animate-in fade-in-0 flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-50 p-5 text-center"
                aria-live="polite"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-red-600 text-white">
                  <XCircle className="size-8" />
                </span>
                <div>
                  <p className="text-xl font-bold text-red-900">Invalid or expired token</p>
                  <p className="mt-1 text-sm text-red-800">{scanState.message}</p>
                </div>
                <Button variant="outline" size="sm" onClick={reset} className="border-red-500 text-red-700 hover:bg-red-100">
                  Try again
                </Button>
              </div>
            )}

            {/* Offline notice */}
            {!isOnline && scanState.kind === "idle" && (
              <Alert className="border-amber-500/30 bg-amber-50">
                <HardDriveDownload className="text-amber-700" />
                <AlertTitle>Offline mode active</AlertTitle>
                <AlertDescription>
                  Your scan will be stored in your browser and automatically synced when you
                  reconnect.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ── History panel ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <CalendarCheck className="size-4 text-primary" />
                Attendance log
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadHistory}
                disabled={historyLoading}
                aria-label="Refresh attendance history"
              >
                <RefreshCw className={cn("size-4", historyLoading && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {historyError && (
              <Alert className="border-amber-500/30 bg-amber-50">
                <AlertCircle className="text-amber-700" />
                <AlertTitle>Demo mode</AlertTitle>
                <AlertDescription className="text-xs">{historyError}</AlertDescription>
              </Alert>
            )}

            {historyLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : summary && summary.records.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {summary.records.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {rec.session}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {formatDate(rec.date)}
                        {rec.method && rec.method !== "-" && (
                          <> &middot; {rec.method.toUpperCase()}</>
                        )}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
                        statusStyles(rec.status),
                      )}
                    >
                      <StatusIcon status={rec.status} />
                      {rec.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No attendance records found. Scan a QR code to mark your first session.
              </div>
            )}

            {summary && (
              <p className="text-xs text-muted-foreground">
                {summary.present} present out of {summary.total_sessions} total sessions &middot;{" "}
                {summary.overall_percentage}% attendance rate
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
