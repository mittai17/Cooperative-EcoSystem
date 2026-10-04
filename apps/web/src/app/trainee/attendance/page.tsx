"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Fingerprint,
  QrCode,
  ScanLine,
  ShieldAlert,
  XCircle,
  ZapIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { enqueueAttendanceRecord, useOfflineSync } from "@/lib/offline/sync-manager";
import { useT } from "@/i18n";

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
  /** Attendance for one programme or module, used by the per-subject breakdown. */
  subjects: { label: string; held: number; attended: number; percentage: number }[];
}

type ScanMode = "qr" | "face";
type ScanState =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "processing" }
  | { kind: "success"; session: string; markedAt: string }
  | { kind: "error"; message: string };

type FaceState = "idle" | "detecting" | "verifying" | "verified" | "failed";

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_SUMMARY: AttendanceSummary = {
  overall_percentage: 87,
  total_sessions: 52,
  present: 45,
  records: [
    { date: "2026-10-03", session: "Cooperative Management Fundamentals — Module 4", status: "present", method: "face" },
    { date: "2026-10-02", session: "PACS Digital Accounting — Session 7", status: "present", method: "qr" },
    { date: "2026-10-01", session: "Dairy Cooperative Operations — Practical Lab", status: "late", method: "qr" },
    { date: "2026-09-30", session: "Cooperative Management Fundamentals — Module 3", status: "absent", method: "" },
    { date: "2026-09-29", session: "PACS Digital Accounting — Session 6", status: "present", method: "face" },
    { date: "2026-09-27", session: "Cooperative Management Fundamentals — Module 2", status: "present", method: "qr" },
    { date: "2026-09-25", session: "Dairy Cooperative Operations — Theory", status: "present", method: "qr" },
    { date: "2026-09-24", session: "PACS Digital Accounting — Session 5", status: "present", method: "face" },
    { date: "2026-09-23", session: "Dairy Cold Chain & Quality Testing — Lab 2", status: "late", method: "qr" },
    { date: "2026-09-22", session: "Cooperative Management Fundamentals — Module 1", status: "present", method: "face" },
    { date: "2026-09-20", session: "Dairy Cooperative Operations — Theory", status: "present", method: "qr" },
    { date: "2026-09-19", session: "PACS Digital Accounting — Session 4", status: "absent", method: "" },
    { date: "2026-09-18", session: "Dairy Cold Chain & Quality Testing — Lab 1", status: "present", method: "qr" },
    { date: "2026-09-17", session: "Cooperative Management Fundamentals — Induction", status: "present", method: "face" },
    { date: "2026-09-16", session: "PACS Digital Accounting — Session 3", status: "present", method: "qr" },
  ],
  subjects: [
    { label: "Dairy Cooperative Operations", held: 18, attended: 16, percentage: 89 },
    { label: "PACS Digital Accounting", held: 14, attended: 12, percentage: 86 },
    { label: "Cooperative Management Fundamentals", held: 12, attended: 11, percentage: 92 },
    { label: "Dairy Cold Chain & Quality Testing", held: 8, attended: 6, percentage: 75 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusStyles(status: string) {
  switch (status.toLowerCase()) {
    case "present": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900";
    case "absent":  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900";
    case "late":    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900";
    default:        return "bg-muted text-muted-foreground";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "present": return <CheckCircle2 className="size-3.5 shrink-0" />;
    case "absent":  return <XCircle className="size-3.5 shrink-0" />;
    case "late":    return <Clock className="size-3.5 shrink-0" />;
    default:        return null;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function MethodBadge({ method }: { method: string }) {
  const t = useT();
  if (method === "face") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
      <Fingerprint className="size-2.5" /> {t("trainee.attendance.face")}
    </span>
  );
  if (method === "qr") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
      <QrCode className="size-2.5" /> QR
    </span>
  );
  return null;
}

// ── Face Recognition Camera HUD ───────────────────────────────────────────────

function FaceRecognitionScanner({ onSuccess, onError }: {
  onSuccess: (session: string) => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [faceState, setFaceState] = useState<FaceState>("idle");
  const [progress, setProgress] = useState(0);
  const [streamActive, setStreamActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreamActive(false);
    setFaceState("idle");
    setProgress(0);
  }, []);

  const startCamera = useCallback(async () => {
    setFaceState("detecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);

      // Simulate face detection after 2s
      timerRef.current = setTimeout(() => {
        setFaceState("verifying");
        let p = 0;
        const tick = setInterval(() => {
          p += 4;
          setProgress(p);
          if (p >= 100) {
            clearInterval(tick);
            setFaceState("verified");
            stopStream();
            onSuccess("Cooperative Management Fundamentals — Module 5");
          }
        }, 80);
      }, 2000);
    } catch {
      setFaceState("failed");
      onError(t("trainee.attendance.cameraDeniedHint"));
    }
  }, [onSuccess, onError, stopStream, t]);

  useEffect(() => () => {
    stopStream();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [stopStream]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera viewport */}
      <div className="relative w-full max-w-sm aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-black">
        {/* Video feed */}
        <video
          ref={videoRef}
          className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-300", streamActive ? "opacity-100" : "opacity-0")}
          playsInline muted
        />

        {/* Idle state */}
        {faceState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <Fingerprint className="size-14 opacity-30" />
            <p className="text-sm font-medium">{t("trainee.attendance.cameraNotStarted")}</p>
          </div>
        )}

        {/* Scanning overlay — corner brackets */}
        {(faceState === "detecting" || faceState === "verifying") && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Corner brackets */}
            <div className="relative size-48">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-sm" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr-sm" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl-sm" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-sm" />
              {/* Scanning line */}
              {faceState === "detecting" && (
                <span className="absolute inset-x-0 h-0.5 bg-green-400/80 shadow-lg shadow-green-500 animate-[scanline_2s_ease-in-out_infinite] top-0" />
              )}
            </div>
            {/* HUD text */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-green-400 text-xs font-mono font-semibold tracking-widest animate-pulse">
                {faceState === "detecting" ? t("trainee.attendance.detecting") : t("trainee.attendance.verifying")}
              </p>
            </div>
          </div>
        )}

        {/* Verified overlay */}
        {faceState === "verified" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/80 gap-2">
            <CheckCircle2 className="size-14 text-emerald-400" />
            <p className="text-emerald-300 font-semibold text-sm">{t("trainee.attendance.faceVerified")}</p>
          </div>
        )}

        {/* Failed overlay */}
        {faceState === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 gap-2">
            <XCircle className="size-12 text-red-400" />
            <p className="text-red-300 font-semibold text-sm px-4 text-center">{t("trainee.attendance.cameraDenied")}</p>
          </div>
        )}

        {/* Verifying progress bar */}
        {faceState === "verifying" && (
          <div className="absolute bottom-0 inset-x-0 p-2">
            <Progress value={progress} className="h-1.5 bg-white/20" />
          </div>
        )}
      </div>

      {/* Action button */}
      {faceState === "idle" || faceState === "failed" ? (
        <Button onClick={startCamera} className="w-full max-w-sm gap-2">
          <Camera className="size-4" />
          {faceState === "failed" ? t("trainee.attendance.retryCamera") : t("trainee.attendance.startFaceScan")}
        </Button>
      ) : faceState === "detecting" || faceState === "verifying" ? (
        <Button onClick={stopStream} variant="outline" className="w-full max-w-sm gap-2">
          <XCircle className="size-4" /> {t("trainee.common.cancel")}
        </Button>
      ) : null}
    </div>
  );
}

// ── QR Token Scanner ──────────────────────────────────────────────────────────

function QRScanner({ onSuccess, onError }: {
  onSuccess: (session: string) => void;
  onError: (msg: string) => void;
}) {
  const t = useT();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!token.trim()) { onError(t("trainee.attendance.enterToken")); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (token.trim().toUpperCase().startsWith("CS-")) {
        onSuccess("PACS Digital Accounting — Session 8");
      } else {
        onError(t("trainee.attendance.invalidToken"));
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-muted/40 p-8">
        <ScanLine className="size-12 text-primary/50" />
        <p className="text-sm text-muted-foreground font-medium text-center">
          {t("trainee.attendance.qrHint")}
        </p>
      </div>
      <div className="flex gap-2">
        <input
          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("trainee.attendance.tokenPlaceholder")}
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button onClick={handleSubmit} disabled={loading} className="shrink-0 gap-2">
          {loading ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <QrCode className="size-4" />}
          {loading ? t("trainee.attendance.verifyingBtn") : t("trainee.common.submit")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {t("trainee.attendance.tipBefore")} <code className="font-mono">CS-</code> {t("trainee.attendance.tipAfter")}
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TraineeAttendancePage() {
  const { isOnline } = useOfflineSync();
  const t = useT();
  const statusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "present": return t("trainee.attendance.statusPresent");
      case "absent": return t("trainee.attendance.statusAbsent");
      case "late": return t("trainee.attendance.statusLate");
      default: return status;
    }
  };
  const [mode, setMode] = useState<ScanMode>("qr");
  const [scanState, setScanState] = useState<ScanState>({ kind: "idle" });
  const [summary, setSummary] = useState<AttendanceSummary>(DEMO_SUMMARY);

  const handleSuccess = useCallback((session: string) => {
    const markedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setScanState({ kind: "success", session, markedAt });
    enqueueAttendanceRecord(mode === "qr" ? "QR_SCAN" : "FACE_AUTH", session);
    const today = new Date().toISOString().split("T")[0];
    setSummary((prev) => {
      const prevRecords = prev?.records ?? [];
      const records = [{ date: today, session, status: "present", method: mode }, ...prevRecords];
      const present = (prev?.present ?? 0) + 1;
      const total_sessions = (prev?.total_sessions ?? 0) + 1;
      const overall_percentage = Math.round((present / total_sessions) * 100);
      return { ...prev, records, present, total_sessions, overall_percentage };
    });
  }, [mode]);

  const handleError = useCallback((message: string) => {
    setScanState({ kind: "error", message });
  }, []);

  const reset = () => setScanState({ kind: "idle" });

  const attendancePct = summary.overall_percentage;

  return (
    <div className="flex flex-col gap-6">
      <style>{`
        @keyframes scanline {
          0%   { top: 0; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>

      <PageHeader
        title={t("trainee.attendance.title")}
        description={t("trainee.attendance.description")}
      />

      {/* Offline banner */}
      {!isOnline && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-sm">
          <ShieldAlert className="size-5 shrink-0" />
          <span><strong>{t("trainee.attendance.offlineLabel")}</strong> {t("trainee.attendance.offlineText")}</span>
        </div>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <p className="text-2xl font-bold text-foreground">{summary.present}</p>
            <p className="text-xs text-muted-foreground">{t("trainee.attendance.sessionsPresent")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <p className="text-2xl font-bold text-foreground">{summary.total_sessions}</p>
            <p className="text-xs text-muted-foreground">{t("trainee.attendance.totalSessions")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <p className={cn("text-2xl font-bold", attendancePct >= 75 ? "text-emerald-600" : "text-red-600")}>
              {attendancePct}%
            </p>
            <p className="text-xs text-muted-foreground">{t("trainee.attendance.overallRate")}</p>
          </CardContent>
        </Card>
      </div>
      <Progress value={attendancePct} className="h-2" />

      {/* Scanner card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <ZapIcon className="size-4 text-primary" />
            {t("trainee.attendance.markHeading")}
          </CardTitle>
          {/* Mode switcher */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setMode("qr"); reset(); }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                mode === "qr" ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <QrCode className="size-3.5" /> {t("trainee.attendance.modeQr")}
            </button>
            <button
              onClick={() => { setMode("face"); reset(); }}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                mode === "face" ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Fingerprint className="size-3.5" /> {t("trainee.attendance.modeFace")}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success state */}
          {scanState.kind === "success" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("trainee.attendance.attendanceMarked")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{scanState.session}</p>
                <Badge className="mt-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {t("trainee.attendance.markedAt").replace("{time}", scanState.markedAt).replace("{method}", mode === "face" ? t("trainee.attendance.modeFace") : t("trainee.attendance.qrScan"))}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={reset}>{t("trainee.attendance.markAnother")}</Button>
            </div>
          )}

          {/* Error state */}
          {scanState.kind === "error" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
              <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive text-sm">{scanState.message}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={reset}>{t("trainee.common.tryAgain")}</Button>
              </div>
            </div>
          )}

          {/* Idle scanner */}
          {(scanState.kind === "idle" || scanState.kind === "scanning" || scanState.kind === "processing") && (
            mode === "face" ? (
              <FaceRecognitionScanner onSuccess={handleSuccess} onError={handleError} />
            ) : (
              <QRScanner onSuccess={handleSuccess} onError={handleError} />
            )
          )}
        </CardContent>
      </Card>

      {/* Subject-wise breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <BarChart3 className="size-4 text-muted-foreground" />
            Subject-wise Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {summary.subjects.map((subject) => (
            <div key={subject.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{subject.label}</span>
                <span className={cn("text-xs font-semibold", subject.percentage >= 75 ? "text-emerald-600" : "text-amber-600")}>
                  {subject.attended}/{subject.held} sessions &middot; {subject.percentage}%
                </span>
              </div>
              <Progress value={subject.percentage} className="h-1.5" />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            75% attendance is mandatory for certification. Subject-wise figures are calculated by the
            institute from the same QR and face-marked sessions shown below.
          </p>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            {t("trainee.attendance.history")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {!summary.records || summary.records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No attendance records found.</p>
            ) : (
              summary.records.map((rec) => (
                <div key={rec.date + rec.session} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{rec.session}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      {formatDate(rec.date)}
                      {rec.method && <MethodBadge method={rec.method} />}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize shrink-0", statusStyles(rec.status))}>
                    <StatusIcon status={rec.status} /> {statusLabel(rec.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
