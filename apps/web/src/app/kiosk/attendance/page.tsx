"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  CloudUpload,
  Fingerprint,
  Info,
  Keyboard,
  Lock,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DemoRoleSwitcherBanner } from "@/components/auth/demo-role-switcher-banner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CARD_CODE_FORMAT_HINT,
  CARD_CODE_PATTERN,
  biometricTemplates,
  faceEngine,
  kioskDevice,
  kioskRoster,
  kioskSession,
  seededAttendance,
  seededSessionLog,
  type RosterTrainee,
  type SessionLogEntry,
} from "@/lib/mock-data/kiosk";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type MarkState = "present" | "late";

interface RegisterEntry {
  traineeId: string;
  cardCode: string;
  state: MarkState;
  method: "qr" | "manual" | "biometric";
  at: string;
  secondsAfterOpen: number;
  confidenceScore?: number;
}

type ScanOutcome =
  | { kind: "recorded"; trainee: RosterTrainee; at: string; state: MarkState; method?: "qr" | "manual" | "biometric"; confidenceScore?: number }
  | { kind: "duplicate"; trainee: RosterTrainee; at: string; firstSeen: string }
  | { kind: "failed"; at: string; reason: string; hint: string };

type CameraStatus = "idle" | "checking" | "ready" | "denied" | "unsupported";

interface CameraState {
  status: CameraStatus;
  message: string;
}

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

const SESSION_TOTAL_SECONDS = kioskSession.durationMinutes * 60;

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function nowClock(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function nowShort(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const SESSION_WINDOW_LABEL = `${kioskSession.startsAtLabel} – ${kioskSession.endsAtLabel}`;

const TONE_STYLES: Record<SessionLogEntry["tone"], string> = {
  recorded: "bg-success/10 text-emerald-700",
  duplicate: "bg-tint-amber-bg text-amber-700",
  failed: "bg-destructive/10 text-red-700",
  manual: "bg-tint-violet-bg text-violet-700",
  system: "bg-muted text-muted-foreground",
};

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function ScannerWindow({
  armed,
  label,
  simulatedCameraActive,
  isScanning,
  mode = "qr",
}: {
  armed: boolean;
  label: string;
  simulatedCameraActive?: boolean;
  isScanning?: boolean;
  mode?: "qr" | "biometric";
}) {
  return (
    <div
      className={cn(
        "relative flex h-56 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed sm:h-64 transition-all duration-300",
        simulatedCameraActive
          ? "border-emerald-600/60 bg-emerald-950/20"
          : "border-border bg-muted/40",
        isScanning && "ring-4 ring-primary/40 border-primary bg-primary/5",
      )}
    >
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <span
          key={corner}
          className={cn(
            "absolute size-7 border-[3px] border-primary transition-all duration-200",
            corner === "tl" && "top-2 left-2 rounded-tl-md border-r-0 border-b-0",
            corner === "tr" && "top-2 right-2 rounded-tr-md border-b-0 border-l-0",
            corner === "bl" && "bottom-2 left-2 rounded-bl-md border-r-0 border-t-0",
            corner === "br" && "right-2 bottom-2 rounded-br-md border-t-0 border-l-0",
            isScanning && "scale-110 border-emerald-500",
          )}
        />
      ))}
      {armed && (
        <span
          className={cn(
            "pointer-events-none absolute inset-x-6 h-0.5 animate-[kiosk-scan_2.6s_ease-in-out_infinite] rounded-full",
            mode === "biometric"
              ? "bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]"
              : "bg-primary shadow-[0_0_8px_rgba(239,68,68,0.6)]",
          )}
        />
      )}
      <div className="flex flex-col items-center gap-3 px-8 text-center">
        <span
          className={cn(
            "size-16 flex items-center justify-center rounded-2xl transition-all duration-200",
            mode === "biometric" ? "bg-violet-100 text-violet-700" : "icon-tile-red",
            isScanning && "scale-110 shadow-lg",
          )}
        >
          {mode === "biometric" ? (
            <Fingerprint className="size-8" strokeWidth={1.5} />
          ) : (
            <QrCode className="size-8" strokeWidth={1.5} />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {simulatedCameraActive && (
            <span className="inline-block mt-1 font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Simulated Optical Stream @ 30 FPS
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === "biometric"
            ? "Look straight into the kiosk camera for on-device ArcFace matching"
            : "Present the QR on the trainee ID card to the kiosk camera"}
        </p>
      </div>
    </div>
  );
}

function CameraReport({ camera }: { camera: CameraState }) {
  const config: Record<CameraStatus, { title: string; className: string; icon: typeof Camera }> = {
    idle: {
      title: "Awaiting kiosk camera hardware",
      className: "border-border bg-muted/40 text-foreground",
      icon: Camera,
    },
    checking: {
      title: "Requesting camera access",
      className: "border-primary/30 bg-primary/5 text-foreground",
      icon: Camera,
    },
    ready: {
      title: "Camera stream acquired",
      className: "border-emerald-600/30 bg-emerald-50 text-emerald-800",
      icon: CheckCircle2,
    },
    denied: {
      title: "Camera unavailable on this device",
      className: "border-red-600/30 bg-red-50 text-red-800",
      icon: XCircle,
    },
    unsupported: {
      title: "Camera API not exposed",
      className: "border-amber-600/30 bg-amber-50 text-amber-800",
      icon: AlertTriangle,
    },
  };
  const active = config[camera.status];
  const Icon = active.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
        active.className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{active.title}</p>
        <p className="mt-0.5 font-mono text-xs break-words opacity-90">{camera.message}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function KioskAttendancePage() {
  /* Register is a map keyed by trainee id, so one trainee can only ever hold
     one row no matter how many times their card is presented. */
  const [register, setRegister] = useState<Record<string, RegisterEntry>>(() => {
    const seeded: Record<string, RegisterEntry> = {};
    for (const entry of seededAttendance) {
      const trainee = kioskRoster.find((t) => t.id === entry.traineeId);
      if (!trainee) continue;
      seeded[trainee.id] = {
        traineeId: entry.traineeId,
        cardCode: trainee.cardCode,
        state: "present",
        method: entry.method,
        at: entry.at,
        secondsAfterOpen: 0,
      };
    }
    return seeded;
  });

  /* Deterministic first paint: the session is `elapsedMinutes` old, so the
     server and the client agree on the countdown without a hydration fix. */
  const [remaining, setRemaining] = useState(
    (kioskSession.durationMinutes - kioskSession.elapsedMinutes) * 60,
  );
  const [clock, setClock] = useState("--:--:--");
  const [duplicates, setDuplicates] = useState(0);
  const [failures, setFailures] = useState(0);
  const [log, setLog] = useState<SessionLogEntry[]>(seededSessionLog);
  const [code, setCode] = useState("");
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [camera, setCamera] = useState<CameraState>({
    status: "idle",
    message: "No camera probe has been run on this device yet.",
  });
  const [rosterQuery, setRosterQuery] = useState("");
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [simulatedCameraActive, setSimulatedCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerMode, setScannerMode] = useState<"qr" | "biometric">("qr");

  const logSeq = useRef(0);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const logTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const sessionClosed = remaining <= 0;
  const presentEntries = useMemo(() => Object.values(register), [register]);
  const presentCount = presentEntries.length;
  const lateCount = presentEntries.filter((entry) => entry.state === "late").length;
  const manualCount = presentEntries.filter((entry) => entry.method === "manual").length;
  const attempts = presentCount + duplicates + failures;
  const totalRoster = kioskSession?.rosterSize || kioskRoster.length || 1;
  const attendancePct = Math.min(100, Math.max(0, Math.round((presentCount / totalRoster) * 100))) || 0;

  /* ── Timers: one interval plus the log-retention timeouts, all cleared on unmount ── */
  useEffect(() => {
    const tick = setInterval(() => {
      setClock(nowClock());
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(tick);
      for (const timer of logTimers.current) clearTimeout(timer);
      logTimers.current = [];
    };
  }, []);

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const pushLog = useCallback((entry: Omit<SessionLogEntry, "id">) => {
    logSeq.current += 1;
    const id = `log-live-${logSeq.current}`;
    const record: SessionLogEntry = { ...entry, id };
    setLog((prev) => [record, ...prev]);
    const timer = setTimeout(() => {
      setLog((prev) => prev.filter((item) => item.id !== id));
      logTimers.current = logTimers.current.filter((t) => t !== timer);
    }, 12000);
    logTimers.current = [...logTimers.current, timer];
  }, []);

  const recordFailure = useCallback(
    (reason: string, hint: string) => {
      const at = nowShort();
      setFailures((prev) => prev + 1);
      setOutcome({ kind: "failed", at, reason, hint });
      setCode("");
      pushLog({ at, title: `Scan rejected · ${reason}`, detail: hint, tone: "failed" });
    },
    [pushLog],
  );

  /* ── Camera probe: the real getUserMedia call, no simulated result ────── */
  const probeCamera = useCallback(async () => {
    setCamera({ status: "checking", message: "Calling navigator.mediaDevices.getUserMedia({ video })..." });
    try {
      const media = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
      if (!media || typeof media.getUserMedia !== "function") {
        setCamera({
          status: "unsupported",
          message:
            "navigator.mediaDevices.getUserMedia is not exposed. The kiosk viewer must be served over HTTPS (or localhost) for camera capture to be permitted by the browser.",
        });
        return;
      }
      const stream = await media.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const label = track?.label && track.label.length > 0 ? track.label : "unlabelled video track";
      stream.getTracks().forEach((t) => t.stop());
      setCamera({
        status: "ready",
        message: `Stream opened on "${label}" and every track was stopped again. On kiosk hardware the QR decoder binds this same track.`,
      });
      setSimulatedCameraActive(true);
    } catch (error) {
      const name = error instanceof Error ? error.name : "UnknownError";
      const detail = error instanceof Error ? error.message : String(error);
      setCamera({
        status: "denied",
        message: `${name}: ${detail}`,
      });
    }
  }, []);

  /* ── QR capture: writes attendance ─────────────────── */
  const submitScan = useCallback(
    (raw: string) => {
      const normalised = raw.trim().toUpperCase();
      const at = nowShort();

      if (sessionClosed) {
        recordFailure(
          "Session already closed",
          "The attendance window for this session has ended. Ask the trainer to reopen it before capturing more scans.",
        );
        return;
      }

      if (normalised.length === 0) {
        recordFailure(
          "No card code entered",
          `Type or paste the code printed on the trainee ID card, for example ${CARD_CODE_FORMAT_HINT}.`,
        );
        return;
      }

      if (!CARD_CODE_PATTERN.test(normalised)) {
        recordFailure(
          `Malformed card code "${normalised}"`,
          `A CoopSetu card code is CS, a four-character session group and a four-digit roll serial, for example ${CARD_CODE_FORMAT_HINT}. The group for this session is ${kioskSession.tokenGroup}.`,
        );
        return;
      }

      const trainee = kioskRoster.find((t) => t.cardCode === normalised);
      if (!trainee) {
        recordFailure(
          `Card code ${normalised} is not on this roster`,
          "The code is well formed but no trainee in this batch holds it. Re-check the card or use the manual override below.",
        );
        return;
      }

      const already = register[trainee.id];
      if (already) {
        setDuplicates((prev) => prev + 1);
        setOutcome({ kind: "duplicate", trainee, at, firstSeen: already.at });
        setCode("");
        pushLog({
          at,
          title: `Duplicate card · ${trainee.name}`,
          detail: `${normalised} was already recorded at ${already.at}. The register was not changed.`,
          tone: "duplicate",
        });
        return;
      }

      setRegister((prev) => ({
        ...prev,
        [trainee.id]: {
          traineeId: trainee.id,
          cardCode: normalised,
          state: "present",
          method: "qr",
          at,
          secondsAfterOpen: SESSION_TOTAL_SECONDS - remaining,
        },
      }));
      setOutcome({ kind: "recorded", trainee, at, state: "present", method: "qr" });
      setCode("");
      pushLog({
        at,
        title: `QR accepted · ${trainee.name}`,
        detail: `${normalised} · ${trainee.rollNo} · ${formatCountdown(remaining)} left in the window.${offlineMode ? " (Stored offline in IndexedDB)" : ""}`,
        tone: "recorded",
      });

      if (offlineMode) {
        setOfflineQueueCount((prev) => prev + 1);
      }
    },
    [offlineMode, pushLog, recordFailure, register, remaining, sessionClosed],
  );

  /* ── Optical camera scan simulator ──────────────────────────────────────── */
  const simulateOpticalScan = useCallback(() => {
    if (sessionClosed) {
      recordFailure(
        "Session already closed",
        "The attendance window for this session has ended.",
      );
      return;
    }
    setScannerMode("qr");
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 500);

    const nextUnrecorded = kioskRoster.find((t) => register[t.id] === undefined);
    if (nextUnrecorded) {
      submitScan(nextUnrecorded.cardCode);
    } else {
      const first = kioskRoster[0];
      if (first) submitScan(first.cardCode);
    }
  }, [register, sessionClosed, submitScan, recordFailure]);

  /* ── Biometric face scan simulator ──────────────────────────────────────── */
  const simulateFaceScan = useCallback(() => {
    if (sessionClosed) {
      recordFailure(
        "Session already closed",
        "The attendance window for this session has ended.",
      );
      return;
    }
    setScannerMode("biometric");
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannerMode("qr");
    }, 700);

    const at = nowShort();
    // Find next unmarked biometric enrolled trainee
    const nextBiometric = kioskRoster.find(
      (t) => register[t.id] === undefined && biometricTemplates[t.id] !== undefined,
    );

    if (!nextBiometric) {
      const alreadyMarked = kioskRoster.find((t) => biometricTemplates[t.id] !== undefined);
      if (alreadyMarked && register[alreadyMarked.id]) {
        const existing = register[alreadyMarked.id];
        setDuplicates((prev) => prev + 1);
        setOutcome({ kind: "duplicate", trainee: alreadyMarked, at, firstSeen: existing.at });
        pushLog({
          at,
          title: `Duplicate biometric · ${alreadyMarked.name}`,
          detail: `Face matched enrolled template for ${alreadyMarked.name}. Already recorded at ${existing.at}.`,
          tone: "duplicate",
        });
        return;
      }
      recordFailure("No enrolled biometric trainee remaining", "All enrolled biometric trainees are marked. Use QR card scan.");
      return;
    }

    const template = biometricTemplates[nextBiometric.id];
    const confidence = template?.confidenceScore ?? 0.952;

    setRegister((prev) => ({
      ...prev,
      [nextBiometric.id]: {
        traineeId: nextBiometric.id,
        cardCode: nextBiometric.cardCode,
        state: "present",
        method: "biometric",
        at,
        secondsAfterOpen: SESSION_TOTAL_SECONDS - remaining,
        confidenceScore: confidence,
      },
    }));

    setOutcome({
      kind: "recorded",
      trainee: nextBiometric,
      at,
      state: "present",
      method: "biometric",
      confidenceScore: confidence,
    });

    pushLog({
      at,
      title: `Face accepted · ${nextBiometric.name}`,
      detail: `ArcFace cosine ${confidence.toFixed(3)} (threshold 0.62) · Liveness verified · ${formatCountdown(remaining)} left in session.`,
      tone: "recorded",
    });

    if (offlineMode) {
      setOfflineQueueCount((prev) => prev + 1);
    }
  }, [offlineMode, pushLog, recordFailure, register, remaining, sessionClosed]);

  /* ── Biometric mismatch simulator ───────────────────────────────────────── */
  const simulateUnknownFaceScan = useCallback(() => {
    setScannerMode("biometric");
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannerMode("qr");
    }, 600);
    recordFailure(
      "Face match below threshold (0.418 < 0.620)",
      "ArcFace embedding similarity below target. Person is either not enrolled or facing poor lighting. Please present your QR ID card instead.",
    );
  }, [recordFailure]);

  /* ── Batch check-in simulator ───────────────────────────────────────────── */
  const simulateFullBatch = useCallback(() => {
    if (sessionClosed) return;
    const at = nowShort();
    const updated: Record<string, RegisterEntry> = { ...register };
    kioskRoster.forEach((trainee, index) => {
      if (!updated[trainee.id]) {
        const method: "qr" | "biometric" = index % 3 === 0 && biometricTemplates[trainee.id] ? "biometric" : "qr";
        const state: MarkState = index === 7 || index === 11 ? "late" : "present";
        updated[trainee.id] = {
          traineeId: trainee.id,
          cardCode: trainee.cardCode,
          state,
          method,
          at: `10:${String(Math.min(59, 10 + index * 2)).padStart(2, "0")} AM`,
          secondsAfterOpen: 10 * 60 + index * 120,
          confidenceScore: method === "biometric" ? 0.942 : undefined,
        };
      }
    });
    setRegister(updated);
    pushLog({
      at,
      title: "Batch check-in completed · 100% Attendance",
      detail: `All ${kioskRoster.length} trainees marked present/late on the register.`,
      tone: "system",
    });
  }, [register, sessionClosed, pushLog]);

  /* ── Reset demo register ────────────────────────────────────────────────── */
  const resetRegister = useCallback(() => {
    const seeded: Record<string, RegisterEntry> = {};
    for (const entry of seededAttendance) {
      const trainee = kioskRoster.find((t) => t.id === entry.traineeId);
      if (!trainee) continue;
      seeded[trainee.id] = {
        traineeId: entry.traineeId,
        cardCode: trainee.cardCode,
        state: "present",
        method: entry.method,
        at: entry.at,
        secondsAfterOpen: 0,
      };
    }
    setRegister(seeded);
    setDuplicates(0);
    setFailures(0);
    setOutcome(null);
    setCode("");
    setOfflineQueueCount(0);
    setLog(seededSessionLog);
    pushLog({
      at: nowShort(),
      title: "Register reset to initial session state",
      detail: "3 seeded demo records restored. Unmarked cards ready for scanning.",
      tone: "system",
    });
  }, [pushLog]);

  /* ── Manual override: writes the same register row, so it cannot double up ── */
  const toggleManual = useCallback(
    (trainee: RosterTrainee) => {
      if (sessionClosed) {
        recordFailure(
          "Session already closed",
          "The attendance window has ended, so the register is read-only.",
        );
        return;
      }
      const at = nowShort();
      setRegister((prev) => {
        const existing = prev[trainee.id];
        const nextState: MarkState = existing?.state === "present" ? "late" : "present";
        return {
          ...prev,
          [trainee.id]: {
            traineeId: trainee.id,
            cardCode: trainee.cardCode,
            state: nextState,
            method: "manual",
            at,
            secondsAfterOpen: SESSION_TOTAL_SECONDS - remaining,
          },
        };
      });
      const existing = register[trainee.id];
      const nextState: MarkState = existing?.state === "present" ? "late" : "present";
      pushLog({
        at,
        title: `Manual override · ${trainee.name}`,
        detail:
          existing === undefined
            ? `${trainee.rollNo} marked ${nextState} by the trainer. Logged for audit.`
            : `${trainee.rollNo} changed from ${existing.state} to ${nextState} by the trainer. Logged for audit.`,
        tone: "manual",
      });
    },
    [pushLog, recordFailure, register, remaining, sessionClosed],
  );

  const scanNext = useCallback(() => {
    setOutcome(null);
    codeInputRef.current?.focus();
  }, []);

  /* ── Derived roster view ──────────────────────────────────────────────── */
  const filteredRoster = useMemo(() => {
    const query = rosterQuery.trim().toLowerCase();
    if (query.length === 0) return kioskRoster;
    return kioskRoster.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.rollNo.toLowerCase().includes(query) ||
        t.cardCode.toLowerCase().includes(query) ||
        t.village.toLowerCase().includes(query),
    );
  }, [rosterQuery]);

  const unrecordedCodes = useMemo(
    () =>
      kioskRoster
        .filter((t) => register[t.id] === undefined)
        .map((t) => t.cardCode)
        .slice(0, 4),
    [register],
  );

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DemoRoleSwitcherBanner currentRole="kiosk" />
      <style>{`
        @keyframes kiosk-scan {
          0%   { top: 0.75rem; }
          50%  { top: calc(100% - 0.75rem); }
          100% { top: 0.75rem; }
        }
      `}</style>

      {/* ── Device chrome ── */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="icon-tile-red size-10">
              <ScanLine className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{kioskDevice.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {kioskDevice.deviceId} &middot; {kioskDevice.institution}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOfflineMode((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                offlineMode
                  ? "border-amber-600/50 bg-amber-500/10 text-amber-700"
                  : "border-border bg-muted/30 text-muted-foreground hover:text-foreground",
              )}
            >
              {offlineMode ? <WifiOff className="size-3 text-amber-600" /> : <Wifi className="size-3 text-muted-foreground" />}
              <span>Simulate Offline</span>
            </button>
            <Badge variant="outline" className={cn("gap-1.5", offlineMode && "border-amber-500 bg-amber-50 text-amber-800")}>
              <span className={cn("size-1.5 rounded-full", offlineMode ? "bg-amber-600" : "bg-emerald-600")} />
              {offlineMode ? "Offline (Local IDB Buffer)" : "Online"}
            </Badge>
            {offlineMode && offlineQueueCount > 0 && (
              <Badge variant="secondary" className="gap-1.5 bg-tint-amber-bg text-amber-800 border-amber-300">
                <CloudUpload className="size-3" />
                {offlineQueueCount} unsynced in queue
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5">
              <Printer className="size-3" />
              Printer linked
            </Badge>
            <span className="min-w-[6.5rem] rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-center font-mono text-sm font-semibold tabular-nums text-foreground">
              {clock}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
          <PageHeader
            title="Attendance capture"
            description="Scan trainee ID cards or use on-device face biometrics to mark attendance. Scans are buffered locally and synced to central registry."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-10 text-xs"
                  onClick={simulateFullBatch}
                  disabled={sessionClosed || presentCount === kioskRoster.length}
                >
                  <Sparkles className="mr-1.5 size-3.5 text-amber-600" />
                  Simulate Full Batch (100%)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-10 text-xs text-muted-foreground hover:text-foreground"
                  onClick={resetRegister}
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Reset Register
                </Button>
                <span className="demo-data-tag">Demo session &middot; active station</span>
              </div>
            }
          />

          {/* ── Session banner ── */}
          <Card>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">Live session</Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {kioskSession.id}
                    </span>
                  </div>
                  <p className="mt-2 font-heading text-xl font-bold text-foreground sm:text-2xl">
                    {kioskSession.programme}
                  </p>
                  <p className="text-sm text-muted-foreground">{kioskSession.module}</p>
                </div>

                <div className="shrink-0 rounded-lg border border-border bg-muted/40 px-4 py-3 lg:min-w-[15rem]">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Clock className="size-3.5" />
                    {sessionClosed ? "Window closed" : "Time to session close"}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-3xl font-semibold tabular-nums",
                      sessionClosed ? "text-red-700" : remaining < 300 ? "text-amber-700" : "text-foreground",
                    )}
                  >
                    {formatCountdown(remaining)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                <Field label="Programme" value={kioskSession.programme} />
                <Field label="Batch" value={kioskSession.batch} />
                <Field label="Module" value={kioskSession.module} />
                <Field label="Trainer" value={kioskSession.trainer} />
                <Field label="Room" value={kioskSession.room} />
                <Field label="Scheduled" value={SESSION_WINDOW_LABEL} />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {presentCount} of {kioskSession.rosterSize} on the register
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {attendancePct}%
                  </span>
                </div>
                <Progress value={attendancePct} />
              </div>

              {sessionClosed && (
                <Alert className="border-red-600/30 bg-red-50">
                  <Lock className="text-red-700" />
                  <AlertTitle>Attendance window closed</AlertTitle>
                  <AlertDescription>
                    The register is read-only. The trainer can reopen the session from the trainer
                    console; nothing further can be captured from this kiosk.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* ── Live confirmation ── */}
          {outcome && (
            <div
              key={`${outcome.at}-${outcome.kind}`}
              className="animate-in fade-in-0 zoom-in-95 duration-300"
              aria-live="polite"
            >
              {outcome.kind === "recorded" && (
                <Card
                  className={cn(
                    "border-2",
                    outcome.method === "biometric"
                      ? "border-violet-600/50 bg-violet-50/90 text-violet-950"
                      : "border-emerald-600/40 bg-emerald-50 text-emerald-950",
                  )}
                >
                  <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span
                        className={cn(
                          "flex size-14 shrink-0 items-center justify-center rounded-full text-white shadow-md",
                          outcome.method === "biometric"
                            ? "bg-violet-700 shadow-violet-300"
                            : "bg-emerald-600 shadow-emerald-300",
                        )}
                      >
                        {outcome.method === "biometric" ? (
                          <Fingerprint className="size-8" />
                        ) : (
                          <CheckCircle2 className="size-8" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={cn(
                              "font-heading text-2xl font-bold",
                              outcome.method === "biometric"
                                ? "text-violet-950"
                                : "text-emerald-900",
                            )}
                          >
                            {outcome.trainee.name}
                          </p>
                          <Badge
                            className={cn(
                              "text-white",
                              outcome.method === "biometric"
                                ? "bg-violet-700"
                                : "bg-emerald-700",
                            )}
                          >
                            {outcome.method === "biometric"
                              ? "Face Biometric Verified"
                              : "QR Check-in Accepted"}
                          </Badge>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 text-sm font-medium",
                            outcome.method === "biometric"
                              ? "text-violet-900"
                              : "text-emerald-800",
                          )}
                        >
                          {kioskSession.programme}
                        </p>
                        <p
                          className={cn(
                            "mt-1 font-mono text-sm",
                            outcome.method === "biometric"
                              ? "text-violet-800"
                              : "text-emerald-800",
                          )}
                        >
                          {kioskSession.batch} &middot; {outcome.trainee.rollNo} &middot; check-in{" "}
                          {outcome.at}
                          {outcome.confidenceScore &&
                            ` · ArcFace Match ${(outcome.confidenceScore * 100).toFixed(1)}% (Liveness Passed)`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className={cn(
                        "min-h-12 w-full px-8 sm:w-auto text-white",
                        outcome.method === "biometric"
                          ? "bg-violet-700 hover:bg-violet-800"
                          : "bg-emerald-700 hover:bg-emerald-800",
                      )}
                      onClick={scanNext}
                    >
                      <ScanLine className="mr-2 size-4" />
                      Scan next
                    </Button>
                  </CardContent>
                </Card>
              )}

              {outcome.kind === "duplicate" && (
                <Card className="border-amber-600/40 bg-amber-50">
                  <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white">
                        <AlertTriangle className="size-8" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-heading text-2xl font-bold text-amber-900">
                          Already recorded
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-amber-900">
                          {outcome.trainee.name} &middot; {outcome.trainee.rollNo}
                        </p>
                        <p className="mt-1 font-mono text-sm text-amber-800">
                          First check-in at {outcome.firstSeen} &middot; re-scan at {outcome.at}{" "}
                          &middot; the register was not changed
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      variant="outline"
                      className="min-h-12 w-full border-amber-600 px-8 sm:w-auto"
                      onClick={scanNext}
                    >
                      <ScanLine className="mr-2 size-4" />
                      Scan next
                    </Button>
                  </CardContent>
                </Card>
              )}

              {outcome.kind === "failed" && (
                <Card className="border-red-600/40 bg-red-50">
                  <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
                        <XCircle className="size-8" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-heading text-2xl font-bold text-red-900">Scan rejected</p>
                        <p className="mt-0.5 text-sm font-medium text-red-900">{outcome.reason}</p>
                        <p className="mt-1 max-w-2xl text-sm text-red-800">{outcome.hint}</p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      variant="outline"
                      className="min-h-12 w-full border-red-600 px-8 sm:w-auto"
                      onClick={scanNext}
                    >
                      <Keyboard className="mr-2 size-4" />
                      Try again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Counters ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Scan attempts"
              value={String(attempts)}
              icon={ScanLine}
              trend="Every card presentation since 09:55 AM"
            />
            <StatCard
              label="Present"
              value={`${presentCount}/${kioskSession.rosterSize}`}
              icon={Users}
              trend={`${lateCount} late &middot; ${manualCount} manual override`}
              trendTone={lateCount > 0 ? "down" : "up"}
            />
            <StatCard
              label="Duplicates"
              value={String(duplicates)}
              icon={RotateCcw}
              trend="Second scan of an already recorded card"
              trendTone={duplicates > 0 ? "down" : "neutral"}
            />
            <StatCard
              label="Failures"
              value={String(failures)}
              icon={XCircle}
              trend="Malformed, unknown or late-arriving codes"
              trendTone={failures > 0 ? "down" : "neutral"}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Duplicate protection: the register is a map keyed by trainee id, so a card can hold exactly
            one row. Every attempt lands in exactly one bucket &mdash;{" "}
            <span className="font-mono font-medium text-foreground">
              {attempts} = {presentCount} present + {duplicates} duplicate + {failures} failed
            </span>
            .
          </p>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
            {/* ── Capture column ── */}
            <div className="flex flex-col gap-6">
              {/* QR panel */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="font-heading text-lg">QR capture</CardTitle>
                    <Badge variant="secondary" className="w-fit bg-tint-blue-bg text-primary">
                      Primary path
                    </Badge>
                  </div>
                  <CardDescription>
                    Two ways in: type or paste the code printed on the trainee ID card, or bind the
                    kiosk camera to the optical decoder. Both write to the same register.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <ScannerWindow
                    armed={!sessionClosed}
                    label={sessionClosed ? "Session closed" : "Point the ID card at the window"}
                    simulatedCameraActive={simulatedCameraActive}
                    isScanning={isScanning}
                    mode={scannerMode}
                  />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="card-code" className="min-h-6 text-sm">
                      Simulate scan &mdash; enter the card code
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="card-code"
                        ref={codeInputRef}
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") submitScan(code);
                        }}
                        placeholder={CARD_CODE_FORMAT_HINT}
                        autoComplete="off"
                        spellCheck={false}
                        className="h-12 font-mono text-base uppercase"
                      />
                      <Button
                        size="lg"
                        onClick={() => submitScan(code)}
                        className="min-h-12 px-6"
                      >
                        <QrCode className="mr-2 size-4" />
                        Record scan
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format check: <span className="font-mono">CS-</span>
                      <span className="font-mono">{"{group}"}</span>
                      <span className="font-mono">-</span>
                      <span className="font-mono">{"{roll}"}</span>. This session uses the group{" "}
                      <span className="font-mono font-medium text-foreground">
                        {kioskSession.tokenGroup}
                      </span>
                      .
                    </p>
                  </div>

                  {unrecordedCodes.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Cards on this roster not yet marked (Click to quick-scan)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {unrecordedCodes.map((value) => (
                          <Button
                            key={value}
                            variant="outline"
                            size="sm"
                            className="min-h-12 font-mono hover:border-red-500 hover:bg-red-50"
                            onClick={() => submitScan(value)}
                          >
                            {value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-foreground">
                        Optical camera scanner
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Binds the kiosk camera stream to the optical QR decoder, or trigger a simulated optical scan.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="lg"
                        className="min-h-12 flex-1"
                        onClick={probeCamera}
                        disabled={camera.status === "checking"}
                      >
                        <Camera className="mr-2 size-4" />
                        {camera.status === "checking"
                          ? "Probing camera..."
                          : camera.status === "idle"
                            ? "Scan from device camera"
                            : "Retry camera check"}
                      </Button>
                      <Button
                        variant="default"
                        size="lg"
                        className="min-h-12 flex-1 bg-red-700 hover:bg-red-800 text-white"
                        onClick={simulateOpticalScan}
                        disabled={sessionClosed}
                      >
                        <ScanLine className="mr-2 size-4" />
                        Simulate Optical Scan
                      </Button>
                    </div>
                    <CameraReport camera={camera} />
                  </div>
                </CardContent>
              </Card>

              {/* Face panel */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="font-heading text-lg">Face recognition</CardTitle>
                      <CardDescription>
                        ArcFace on-device biometric matcher. Runs locally with zero cloud transmission.
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="w-fit bg-violet-100 text-violet-800 border border-violet-200"
                    >
                      Active &middot; ArcFace 512-d
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-start gap-2.5">
                      <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Zero-latency edge matching.</span> Cosine
                        similarity runs against 11 pre-enrolled templates on this station. If face matching is unsure, trainees simply present their physical QR ID card.
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border p-3">
                      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Fingerprint className="size-3.5 text-violet-600" />
                        Engine
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{faceEngine.engine}</dd>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Runtime in this station
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-emerald-700">
                        WASM ONNX Runtime · Local Inference Active
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Matching
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">{faceEngine.matching}</dd>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Accuracy target
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">{faceEngine.accuracyTarget}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Enrolled Face Templates</span>
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        {faceEngine.enrolledCount}/{faceEngine.rosterCount}
                      </span>
                    </div>
                    <Progress
                      value={(faceEngine.enrolledCount / faceEngine.rosterCount) * 100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {faceEngine.enrolmentMode} &middot; last enrolment {faceEngine.lastEnrolmentAt}.
                      Templates never leave the device.
                    </p>
                  </div>

                  {/* Interactive Biometric Check-in Simulators */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <Button
                      size="lg"
                      className="min-h-12 flex-1 bg-violet-700 hover:bg-violet-800 text-white"
                      onClick={simulateFaceScan}
                      disabled={sessionClosed}
                    >
                      <Fingerprint className="mr-2 size-4" />
                      Simulate Face Biometric Check-in
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="min-h-12 border-violet-300 text-violet-800 hover:bg-violet-50"
                      onClick={simulateUnknownFaceScan}
                      disabled={sessionClosed}
                    >
                      <AlertTriangle className="mr-2 size-4 text-amber-600" />
                      Test Unknown Face
                    </Button>
                  </div>

                  <CameraReport camera={camera} />

                  <Button variant="outline" size="lg" className="min-h-12" onClick={probeCamera}>
                    <Camera className="mr-2 size-4" />
                    {camera.status === "idle" ? "Check camera now" : "Retry device check"}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    <Lock className="mr-1 inline size-3" />
                    {faceEngine.retentionNotice}
                  </p>
                </CardContent>
              </Card>

              {/* Manual override roster */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="font-heading text-lg">Manual override</CardTitle>
                      <CardDescription>
                        For a trainee whose phone is dead or whose card is unreadable.
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="w-fit bg-tint-amber-bg text-amber-700"
                    >
                      Logged for audit
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Alert>
                    <ShieldCheck />
                    <AlertTitle>Manual override &mdash; logged for audit</AlertTitle>
                    <AlertDescription>
                      Trainer-only. Every toggle is written to the session log with a timestamp and
                      the operator is recorded as &quot;manual&quot; rather than &quot;QR&quot;, so the
                      final register shows which captures were not self-verified.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="roster-search" className="min-h-6 text-sm">
                      Search roster
                    </Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="roster-search"
                        value={rosterQuery}
                        onChange={(event) => setRosterQuery(event.target.value)}
                        placeholder="Name, roll number, card code or village"
                        className="h-12 pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredRoster.length} of {kioskRoster.length} enrolled trainees
                    </p>
                  </div>

                  <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {filteredRoster.map((trainee) => {
                      const entry = register[trainee.id];
                      const mark = entry?.state;
                      return (
                        <li
                          key={trainee.id}
                          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {trainee.name}
                            </p>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {trainee.rollNo} &middot; {trainee.cardCode} &middot;{" "}
                              {trainee.village}
                            </p>
                            {entry && (
                              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                {entry.method === "manual" ? "manual override" : entry.method === "biometric" ? "face biometric" : "QR"} at {entry.at}
                              </p>
                            )}
                          </div>
                          <div
                            className="flex shrink-0 gap-2"
                            role="group"
                            aria-label={`Attendance mark for ${trainee.name}`}
                          >
                            <Button
                              variant="outline"
                              size="lg"
                              disabled={sessionClosed}
                              onClick={() => toggleManual(trainee)}
                              aria-pressed={mark === "present"}
                              className={cn(
                                "min-h-12 min-w-24",
                                mark === "present" &&
                                  "border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                              )}
                            >
                              <CheckCircle2 className="mr-1.5 size-4" />
                              Present
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              disabled={sessionClosed}
                              onClick={() => toggleManual(trainee)}
                              aria-pressed={mark === "late"}
                              className={cn(
                                "min-h-12 min-w-20",
                                mark === "late" &&
                                  "border-amber-600 bg-amber-50 text-amber-700 hover:bg-amber-100",
                              )}
                            >
                              <Clock className="mr-1.5 size-4" />
                              Late
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                    {filteredRoster.length === 0 && (
                      <li className="p-6 text-center text-sm text-muted-foreground">
                        No trainee matches &ldquo;{rosterQuery}&rdquo;.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* ── Register + log column ── */}
            <aside className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Register</CardTitle>
                  <CardDescription>
                    {presentCount} marked &middot; {kioskSession.rosterSize - presentCount} not yet in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {presentEntries.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Nobody marked yet. The first card scan appears here.
                    </p>
                  ) : (
                    <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                      {[...presentEntries]
                        .sort((a, b) => b.secondsAfterOpen - a.secondsAfterOpen)
                        .map((entry) => {
                          const trainee = kioskRoster.find((t) => t.id === entry.traineeId);
                          return (
                            <li
                              key={entry.traineeId}
                              className="flex items-center gap-3 rounded-lg border border-border p-3"
                            >
                              <span
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                  entry.state === "present"
                                    ? "bg-success/10 text-emerald-700"
                                    : "bg-tint-amber-bg text-amber-700",
                                )}
                              >
                                {entry.state === "present" ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <Clock className="size-4" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {trainee?.name ?? entry.traineeId}
                                </p>
                                <p className="truncate font-mono text-xs text-muted-foreground">
                                  {trainee?.rollNo} &middot; {entry.cardCode}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-mono text-xs font-semibold tabular-nums text-foreground">
                                  {entry.at}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {entry.method === "manual" ? "manual" : entry.method === "biometric" ? "face biometric" : entry.state}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="font-heading text-lg">Session log</CardTitle>
                    <Badge variant="outline" className="w-fit gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                      Live
                    </Badge>
                  </div>
                  <CardDescription>
                    Every capture attempt in order, held on the device until the next sync.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
                    {log.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-col gap-1 rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-medium",
                              TONE_STYLES[entry.tone],
                            )}
                          >
                            {entry.tone}
                          </span>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                            {entry.at}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{entry.title}</p>
                        <p className="text-xs text-muted-foreground">{entry.detail}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Alert>
                <WifiOff />
                <AlertTitle>Offline capture is on by design</AlertTitle>
                <AlertDescription>
                  This kiosk writes to local storage first. Records leave the device only when the
                  sync queue drains, so a power cut during a session never loses attendance. Watch
                  the queue on the device status screen.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-1.5">
                  <QrCode className="size-3.5" />
                  CoopSetu AI &middot; {kioskDevice.appVersion} &middot; {kioskDevice.firmwareVersion}
                </span>
                  <Link href="/kiosk/status" className="contents"><Button
                  variant="outline"
                  size="sm"
                  className="min-h-12"
                  nativeButton={false}
                >
                  <Settings2 className="mr-1.5 size-3.5" />
                  Device status &amp; sync
                </Button></Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
