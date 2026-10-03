"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Cpu,
  Database,
  HardDrive,
  HardDriveDownload,
  Info,
  Printer,
  QrCode,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllCachedCourses,
  getAllSyncItems,
  removeCachedCourse,
  removeSyncItem,
} from "@/lib/offline/db";
import { cn } from "@/lib/utils";
import {
  SYNC_TRANSPORT_ENDPOINT,
  deviceActions,
  kioskDevice,
  kioskHealthSignals,
  lastSyncedLabel,
  seededEventLog,
  seededSyncQueue,
  type DeviceActionSpec,
  type DeviceEvent,
  type DeviceEventLevel,
  type HealthSignal,
  type HealthState,
  type QueuedSyncItem,
  type QueueItemKind,
} from "@/lib/mock-data/kiosk";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type QueueRow = QueuedSyncItem & { state: "pending" | "syncing" | "done" };

type CameraStatus = "idle" | "checking" | "ready" | "denied" | "unsupported";

interface CameraState {
  status: CameraStatus;
  message: string;
}

interface ActionOutcome {
  ok: boolean;
  text: string;
}

interface WipeResult {
  ok: boolean;
  courses: number;
  items: number;
  message?: string;
}

/** Offline-work kinds the queue generator cycles through while the link is down. */
const SIMULATED_KINDS: {
  kind: QueuedSyncItem["kind"];
  label: string;
  detail: string;
  bytes: number;
}[] = [
  {
    kind: "heartbeat",
    label: "Kiosk heartbeat",
    detail: "Device liveness ping with a health summary",
    bytes: 512,
  },
  {
    kind: "attendance",
    label: "Attendance record",
    detail: "Single check-in captured while the link was down",
    bytes: 1024,
  },
  {
    kind: "roster",
    label: "Roster delta",
    detail: "Batch membership change captured while the link was down",
    bytes: 2048,
  },
];

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

function formatUptime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function nowLabel(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Same shape as the seeded `createdAt` stamps, so the column reads uniformly. */
function queueStamp(): string {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const HEALTH_STATE_CONFIG: Record<
  HealthState,
  { label: string; className: string; dot: string; icon: typeof Camera }
> = {
  ok: {
    label: "Healthy",
    className: "bg-success/10 text-emerald-700",
    dot: "bg-emerald-600",
    icon: CheckCircle2,
  },
  warn: {
    label: "Degraded",
    className: "bg-tint-amber-bg text-amber-700",
    dot: "bg-amber-600",
    icon: AlertTriangle,
  },
  down: {
    label: "Failed",
    className: "bg-destructive/10 text-red-700",
    dot: "bg-red-600",
    icon: AlertTriangle,
  },
  idle: {
    label: "Not checked",
    className: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
    icon: Info,
  },
};

const HEALTH_ICONS: Record<string, LucideIcon> = {
  network: Wifi,
  camera: Camera,
  scanner: QrCode,
  printer: Printer,
  storage: HardDrive,
  clock: Activity,
};

const QUEUE_STATE_CONFIG: Record<
  QueueRow["state"],
  { label: string; className: string }
> = {
  pending: { label: "Queued", className: "bg-tint-amber-bg text-amber-700" },
  syncing: { label: "Syncing", className: "bg-primary/10 text-primary" },
  done: { label: "Synced", className: "bg-success/10 text-emerald-700" },
};

const EVENT_LEVEL_CONFIG: Record<
  DeviceEventLevel,
  { className: string; icon: LucideIcon }
> = {
  info: { className: "bg-tint-blue-bg text-primary", icon: Info },
  warn: { className: "bg-tint-amber-bg text-amber-700", icon: AlertTriangle },
  error: { className: "bg-destructive/10 text-red-700", icon: AlertTriangle },
};

const ACTION_ICONS: Record<DeviceActionSpec["id"], LucideIcon> = {
  "restart-service": RefreshCw,
  "clear-cache": HardDriveDownload,
  "factory-reset": Trash2,
};

/* -------------------------------------------------------------------------- */
/* Presentational pieces                                                      */
/* -------------------------------------------------------------------------- */

function HealthTile({
  signal,
  age,
  override,
}: {
  signal: HealthSignal;
  age: number;
  override?: { state: HealthState; reading: string; detail: string };
}) {
  const Icon = HEALTH_ICONS[signal.id] ?? Activity;
  const state = override?.state ?? signal.state;
  const reading = override?.reading ?? signal.reading;
  const detail = override?.detail ?? signal.detail;
  const config = HEALTH_STATE_CONFIG[state];
  const StatusIcon = config.icon;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          <span className="icon-tile-red size-8 shrink-0">
            <Icon className="size-4" />
          </span>
          <span className="truncate">{signal.label}</span>
        </span>
        <Badge variant="secondary" className={cn("shrink-0 gap-1.5", config.className)}>
          <span className={cn("size-1.5 rounded-full", config.dot)} />
          {config.label}
        </Badge>
      </div>
      <p className="font-mono text-sm font-semibold text-foreground">{reading}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
      <p className="mt-auto flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        <StatusIcon className="size-3" />
        Reported {formatAge(age)}
      </p>
    </div>
  );
}

function IdentityRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}

const KIND_LABELS: Record<QueueItemKind, string> = {
  attendance: "Attendance",
  heartbeat: "Heartbeat",
  roster: "Roster",
  assessment: "Assessments",
  print: "Print jobs",
};

function seedQueueRows(): QueueRow[] {
  return seededSyncQueue.map((item) => ({ ...item, state: "pending" }));
}

/** Shared initial rows. Every update below is immutable, so sharing is safe. */
const INITIAL_QUEUE: QueueRow[] = seedQueueRows();

function describeCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return "Camera permission denied. Grant camera access from the browser prompt, then re-probe.";
      case "NotFoundError":
        return "No camera attached to this device (NotFoundError). Card-code capture still works.";
      case "NotReadableError":
        return "The camera is already held by another process (NotReadableError).";
      default:
        return `Camera probe failed: ${error.name} - ${error.message}`;
    }
  }
  return error instanceof Error
    ? `Camera probe failed: ${error.message}`
    : "Camera probe failed for an unknown reason.";
}

/** Real device-local wipe: deletes every cached course and queued sync item. */
async function wipeLocalStores(): Promise<WipeResult> {
  try {
    const courses = await getAllCachedCourses();
    for (const course of courses) {
      await removeCachedCourse(course.id);
    }
    const items = await getAllSyncItems();
    for (const item of items) {
      await removeSyncItem(item.id);
    }
    return { ok: true, courses: courses.length, items: items.length };
  } catch (error) {
    return {
      ok: false,
      courses: 0,
      items: 0,
      message: error instanceof Error ? error.message : "IndexedDB request failed",
    };
  }
}

export default function KioskStatusPage() {
  const [now, setNow] = useState(() => new Date());
  const [uptime, setUptime] = useState(() => kioskDevice.uptimeSecondsAtBoot);
  const [signalAges, setSignalAges] = useState<Record<string, number>>(() =>
    Object.fromEntries(kioskHealthSignals.map((signal) => [signal.id, signal.ageSeconds])),
  );
  const [linkOnline, setLinkOnline] = useState(true);
  const [queue, setQueue] = useState<QueueRow[]>(INITIAL_QUEUE);
  const [events, setEvents] = useState<DeviceEvent[]>(seededEventLog);
  const [camera, setCamera] = useState<CameraState>({
    status: "idle",
    message: "Not probed yet.",
  });
  const [pendingAction, setPendingAction] = useState<DeviceActionSpec | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [outcome, setOutcome] = useState<ActionOutcome | null>(null);
  const [wipe, setWipe] = useState<WipeResult | null>(null);
  const [rawValues, setRawValues] = useState<Record<string, boolean>>({});
  const [eventLimit, setEventLimit] = useState(3);
  const [probeNonce, setProbeNonce] = useState(0);
  const queueRef = useRef<QueueRow[]>(INITIAL_QUEUE);
  const liveSeqRef = useRef(1);
  const eventSeqRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const applyQueue = useCallback((next: QueueRow[]) => {
    queueRef.current = next;
    setQueue(next);
  }, []);

  const pushEvent = useCallback((level: DeviceEventLevel, message: string) => {
    eventSeqRef.current += 1;
    const entry: DeviceEvent = {
      id: `evt-live-${eventSeqRef.current}`,
      at: nowLabel(),
      level,
      message,
    };
    setEvents((previous) => [entry, ...previous].slice(0, 12));
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Wall clock, uptime and per-signal report ages                          */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const tick = () => {
      setNow(new Date());
      setUptime((previous) => previous + 1);
      setSignalAges((previous) => {
        const next: Record<string, number> = {};
        for (const key of Object.keys(previous)) {
          next[key] = previous[key] + 1;
        }
        return next;
      });
    };
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* One real getUserMedia probe on mount, released on unmount              */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    const probe = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCamera({
            status: "unsupported",
            message: "This browser exposes no camera API, so no video input can be checked.",
          });
        }
        return;
      }
      if (!cancelled) {
        setCamera({
          status: "checking",
          message: "Requesting camera permission to confirm a video input is present.",
        });
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const label = stream.getVideoTracks()[0]?.label?.trim();
        setCamera({
          status: "ready",
          message: label
            ? `Camera live: ${label}. The stream was released immediately.`
            : "Permission granted and a video track opened, then released.",
        });
      } catch (error) {
        if (!cancelled) {
          setCamera({ status: "denied", message: describeCameraError(error) });
        }
      }
    };

    void probe();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [probeNonce]);

  /* ---------------------------------------------------------------------- */
  /* Sync drain: two ticks per item so the syncing state is actually seen    */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!linkOnline) return;
      const rows = queueRef.current;
      const inFlight = rows.findIndex((row) => row.state === "syncing");
      let next: QueueRow[] | null = null;

      if (inFlight >= 0) {
        next = rows.map((row, index) =>
          index === inFlight ? { ...row, state: "done", attempts: row.attempts + 1 } : row,
        );
      } else {
        const waiting = rows.findIndex((row) => row.state === "pending");
        if (waiting < 0) return;
        next = rows.map((row, index) =>
          index === waiting ? { ...row, state: "syncing" as const } : row,
        );
      }

      if (next) applyQueue(next);
    }, 700);

    return () => window.clearInterval(id);
  }, [applyQueue, linkOnline]);

  /* ---------------------------------------------------------------------- */
  /* While the link is down, work keeps arriving and piling up               */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (linkOnline) return undefined;

    const id = window.setInterval(() => {
      const sequence = liveSeqRef.current;
      liveSeqRef.current += 1;
      const spec = SIMULATED_KINDS[(sequence - 1) % SIMULATED_KINDS.length];
      const item: QueuedSyncItem = {
        id: `q-live-${sequence}`,
        kind: spec.kind,
        label: spec.label,
        detail: spec.detail,
        bytes: spec.bytes,
        createdAt: queueStamp(),
        attempts: 0,
      };
      applyQueue([...queueRef.current, { ...item, state: "pending" }]);
    }, 2600);

    return () => window.clearInterval(id);
  }, [applyQueue, linkOnline]);

  /* ---------------------------------------------------------------------- */
  /* Every deferred timer is cleared if the operator navigates away         */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const tracked = timersRef.current;
    return () => {
      for (const id of tracked) window.clearTimeout(id);
      tracked.length = 0;
    };
  }, []);

  const startNextItem = useCallback((): boolean => {
    const rows = queueRef.current;
    if (rows.some((row) => row.state === "syncing")) return false;
    const waiting = rows.findIndex((row) => row.state === "pending");
    if (waiting < 0) return false;
    applyQueue(
      rows.map((row, index) => (index === waiting ? { ...row, state: "syncing" as const } : row)),
    );
    return true;
  }, [applyQueue]);

  const openAction = useCallback((action: DeviceActionSpec) => {
    setOutcome(null);
    setWipe(null);
    setConfirmText("");
    setPendingAction(action);
  }, []);

  const closeAction = useCallback(() => {
    if (actionBusy) return;
    setPendingAction(null);
    setConfirmText("");
  }, [actionBusy]);

  const runAction = useCallback(
    async (action: DeviceActionSpec) => {
      setActionBusy(true);
      try {
        if (action.id === "restart-service") {
          await new Promise<void>((resolve) => {
            const id = window.setTimeout(() => {
              timersRef.current = timersRef.current.filter((entry) => entry !== id);
              resolve();
            }, 1400);
            timersRef.current.push(id);
          });
          pushEvent(
            "info",
            "Kiosk service restart simulated: health probes re-ran and the viewer reloaded session state",
          );
          setOutcome({
            ok: true,
            text: "Health checks re-ran and the viewer reloaded its session state. No shell was invoked.",
          });
          return;
        }

        if (action.id === "clear-cache") {
          const result = await wipeLocalStores();
          setWipe(result);
          const text = result.ok
            ? `Deleted ${result.courses} cached courses and ${result.items} queued sync items from this device.`
            : `Cache clear failed: ${result.message ?? "unknown IndexedDB error"}`;
          setOutcome({ ok: result.ok, text });
          pushEvent(
            result.ok ? "info" : "error",
            result.ok
              ? `Local cache cleared: ${result.courses} courses and ${result.items} sync items removed`
              : text,
          );
          return;
        }

        const stores = await wipeLocalStores();
        let storageCleared = true;
        try {
          window.localStorage.clear();
          window.sessionStorage.clear();
        } catch {
          storageCleared = false;
        }
        const result: WipeResult = {
          ok: stores.ok && storageCleared,
          courses: stores.courses,
          items: stores.items,
        };
        if (!storageCleared) {
          result.message = "IndexedDB was cleared, but the browser blocked storage clearing.";
        }
        setWipe(result);
        applyQueue([]);
        setRawValues({});
        const text = result.ok
          ? `Viewer reset: ${result.courses} courses and ${result.items} sync items deleted, local and session storage cleared.`
          : `Reset incomplete: ${stores.message ?? result.message ?? "storage could not be cleared"}`;
        setOutcome({ ok: result.ok, text });
        pushEvent("warn", text);
      } finally {
        setActionBusy(false);
        setPendingAction(null);
        setConfirmText("");
      }
    },
    [applyQueue, pushEvent],
  );

  const confirmReady =
    !pendingAction?.confirmPhrase || confirmText.trim().toUpperCase() === pendingAction.confirmPhrase;

  /* ---------------------------------------------------------------------- */
  /* Derived views                                                          */
  /* ---------------------------------------------------------------------- */
  const doneCount = queue.filter((row) => row.state === "done").length;
  const pendingCount = queue.filter((row) => row.state === "pending").length;
  const syncingCount = queue.filter((row) => row.state === "syncing").length;
  const outstanding = pendingCount + syncingCount;
  const outstandingBytes = queue
    .filter((row) => row.state !== "done")
    .reduce((total, row) => total + row.bytes, 0);
  // The queue is held oldest-first and drained in array order, so the first
  // outstanding row is the oldest one. Comparing the formatted stamps as strings
  // would order 12-hour times incorrectly, so the position is authoritative.
  const oldestOutstanding = queue.find((row) => row.state !== "done")?.createdAt ?? "—";

  const composition = useMemo(() => {
    const totals = new Map<QueueItemKind, number>();
    for (const row of queue) {
      totals.set(row.kind, (totals.get(row.kind) ?? 0) + 1);
    }
    return Array.from(totals.entries()).map(([kind, value]) => ({
      label: KIND_LABELS[kind],
      value,
    }));
  }, [queue]);

  const healthOverrides = useMemo<Record<string, { state: HealthState; reading: string; detail: string }>>(
    () => ({
      network: linkOnline
        ? {
            state: "ok",
            reading: "Online \u00b7 Wi-Fi",
            detail: "coopsetu-institute-wifi \u00b7 RSSI -58 dBm",
          }
        : {
            state: "down",
            reading: "Link forced offline",
            detail: "Simulated outage. Every write is being held in the queue below.",
          },
      camera:
        camera.status === "ready"
          ? { state: "ok", reading: "Video input present", detail: camera.message }
          : camera.status === "checking"
            ? { state: "idle", reading: "Probing", detail: camera.message }
            : { state: "warn", reading: "No usable camera", detail: camera.message },
    }),
    [camera.message, camera.status, linkOnline],
  );

  const healthSummary = useMemo(() => {
    const states = kioskHealthSignals.map(
      (signal) => healthOverrides[signal.id]?.state ?? signal.state,
    );
    if (states.includes("down")) return "Attention needed";
    if (states.includes("warn")) return "Degraded";
    return "All systems normal";
  }, [healthOverrides]);

  const clockLabel = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateLabel = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const healthyCount = kioskHealthSignals.filter((signal) => {
    const state = healthOverrides[signal.id]?.state ?? signal.state;
    return state === "ok";
  }).length;

  return (
    <>
      <DemoRoleSwitcherBanner currentRole="kiosk" />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 min-h-11"
          render={
            <Link href="/kiosk/attendance">
              <ArrowLeft className="size-4" />
              Back to attendance
            </Link>
          }
        />
      </div>

      <PageHeader
        title="Device status"
        description="Live health, the offline sync queue and device-local controls for this kiosk."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
              <Activity className="size-3" />
              {clockLabel} · {dateLabel}
            </span>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setProbeNonce((value) => value + 1);
                pushEvent("info", "Health probes re-run on operator request");
              }}
            >
              <RefreshCw className="size-4" />
              Re-run probes
            </Button>
          </div>
        }
      />

      {!linkOnline && (
        <Alert className="border-amber-300 bg-tint-amber-bg text-amber-900">
          <WifiOff className="size-4" />
          <AlertTitle>Link is down</AlertTitle>
          <AlertDescription className="text-amber-900">
            Writes are being held locally. A new item lands in the queue every 2.6 seconds and nothing
            drains until the link returns.
          </AlertDescription>
        </Alert>
      )}

      {outcome && (
        <Alert
          className={outcome.ok ? "border-emerald-300 bg-tint-green-bg text-emerald-900" : "bg-destructive/10 text-red-900"}
        >
          {outcome.ok ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
          <AlertTitle>{outcome.ok ? "Done" : "Action failed"}</AlertTitle>
          <AlertDescription className={outcome.ok ? "text-emerald-900" : "text-red-900"}>
            {outcome.text}
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Device health"
          value={healthSummary}
          icon={Activity}
          trend={`${healthyCount} of ${kioskHealthSignals.length} signals healthy`}
          trendTone={healthyCount === kioskHealthSignals.length ? "up" : "down"}
        />
        <StatCard
          label="Sync queue"
          value={`${outstanding} item${outstanding === 1 ? "" : "s"}`}
          icon={CloudUpload}
          trend={`${doneCount} synced this session`}
          trendTone={outstanding === 0 ? "up" : "neutral"}
        />
        <StatCard
          label="Data held on device"
          value={formatBytes(outstandingBytes)}
          icon={Database}
          trend={`Oldest entry ${oldestOutstanding}`}
        />
        <StatCard
          label="Uptime"
          value={formatUptime(uptime)}
          icon={Cpu}
          trend={`Installed ${kioskDevice.installedAt}`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Health signals</CardTitle>
          <CardDescription>
            Last value reported by each probe. Ages tick up live; expand any tile for the raw
            diagnostic record.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {kioskHealthSignals.map((signal) => {
              const override = healthOverrides[signal.id];
              const age = signalAges[signal.id] ?? signal.ageSeconds;
              const expanded = rawValues[signal.id] ?? false;
              return (
                <div key={signal.id} className="flex flex-col gap-2">
                  <HealthTile signal={signal} age={age} override={override} />
                  <button
                    type="button"
                    onClick={() =>
                      setRawValues((previous) => ({ ...previous, [signal.id]: !expanded }))
                    }
                    className="flex min-h-11 items-center gap-1.5 rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    {expanded ? "Hide" : "Show"} raw values
                  </button>
                  {expanded && (
                    <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px] leading-relaxed text-foreground">
                      {JSON.stringify(
                        {
                          signal: signal.id,
                          state: override?.state ?? signal.state,
                          reading: override?.reading ?? signal.reading,
                          detail: override?.detail ?? signal.detail,
                          reportedSecondsAgo: age,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="font-heading text-lg">Offline sync queue</CardTitle>
              <CardDescription>
                Batches post to <span className="font-mono">{SYNC_TRANSPORT_ENDPOINT}</span>. Last
                successful push {lastSyncedLabel}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                <Switch
                  checked={linkOnline}
                  onCheckedChange={(checked) => {
                    setLinkOnline(checked);
                    pushEvent(
                      checked ? "info" : "warn",
                      checked
                        ? "Uplink restored: queued batches resume draining"
                        : "Uplink dropped: batching suspended, writes are being held locally",
                    );
                  }}
                />
                {linkOnline ? "Link online" : "Link offline"}
              </label>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={!linkOnline || outstanding === 0}
                onClick={() => {
                  if (startNextItem()) {
                    pushEvent("info", "Operator pushed the next queued batch immediately");
                  }
                }}
              >
                <CloudUpload className="size-4" />
                Sync now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-medium text-foreground">
                {doneCount} of {queue.length} batches pushed
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {pendingCount} queued · {syncingCount} in flight · {formatBytes(outstandingBytes)}{" "}
                held
              </p>
            </div>
            <Progress
              value={doneCount}
              aria-label="Sync progress"
              className="[&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:rounded-full"
            />
          </div>

          {queue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <CheckCircle2 className="mx-auto size-6 text-success" />
              <p className="mt-2 text-sm font-medium text-foreground">Queue is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing is waiting to reach the server on this device.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Queued</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((row) => {
                  const state = QUEUE_STATE_CONFIG[row.state];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{row.label}</p>
                        <p className="text-xs text-muted-foreground">{row.detail}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatBytes(row.bytes)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.createdAt}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {row.attempts === 0 ? "—" : row.attempts}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("gap-1.5", state.className)}>
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              row.state === "done" && "bg-emerald-600",
                              row.state === "syncing" && "bg-primary",
                              row.state === "pending" && "bg-amber-600",
                            )}
                          />
                          {state.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {queue.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Queue composition</p>
              <HorizontalBarList items={composition} valueFormatter={(value) => `${value}`} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Device identity</CardTitle>
            <CardDescription>What this terminal reports to the server.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            <IdentityRow label="Device ID" value={kioskDevice.deviceId} mono />
            <IdentityRow label="Name" value={kioskDevice.name} />
            <IdentityRow label="Institution" value={kioskDevice.institution} />
            <IdentityRow label="Location" value={kioskDevice.location} />
            <IdentityRow label="Hardware" value={kioskDevice.hardware} />
            <IdentityRow label="OS" value={kioskDevice.os} />
            <IdentityRow label="App version" value={kioskDevice.appVersion} mono />
            <IdentityRow label="Firmware" value={kioskDevice.firmwareVersion} mono />
            <IdentityRow label="Serial number" value={kioskDevice.serialNumber} mono />
            <IdentityRow label="Installed" value={kioskDevice.installedAt} mono />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Device-local controls</CardTitle>
            <CardDescription>
              Every action here runs on this terminal only and asks for confirmation first.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {deviceActions.map((action) => {
              const Icon = ACTION_ICONS[action.id];
              return (
                <div
                  key={action.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <span className="icon-tile-red size-9 shrink-0">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.summary}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={action.destructive ? "destructive" : "outline"}
                    className="min-h-11 shrink-0"
                    onClick={() => openAction(action)}
                  >
                    {action.destructive ? <Trash2 className="size-4" /> : <RefreshCw className="size-4" />}
                    {action.destructive ? "Wipe" : "Restart"}
                  </Button>
                </div>
              );
            })}

            {wipe && (
              <p className="rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
                Last device-local wipe: {wipe.courses} cached courses and {wipe.items} queued sync
                items deleted
                {wipe.message ? `. ${wipe.message}` : "."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Device log</CardTitle>
          <CardDescription>
            Health probes, sync activity and operator actions on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {events.slice(0, eventLimit).map((event) => {
              const level = EVENT_LEVEL_CONFIG[event.level];
              const LevelIcon = level.icon;
              return (
                <li key={event.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", level.className)}>
                    <LevelIcon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{event.message}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{event.at}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          {events.length > eventLimit && (
            <Button
              type="button"
              variant="ghost"
              className="self-start"
              onClick={() => setEventLimit((value) => value + 5)}
            >
              <ChevronDown className="size-4" />
              Show {Math.min(5, events.length - eventLimit)} more
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) closeAction();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">{pendingAction?.label}</DialogTitle>
            <DialogDescription>{pendingAction?.summary}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm text-foreground">
            <p>{pendingAction?.consequence}</p>
            <p className="rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
              {pendingAction?.scope}
            </p>
            {pendingAction?.confirmPhrase && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm-phrase">
                  Type {pendingAction.confirmPhrase} to continue
                </Label>
                <Input
                  id="confirm-phrase"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                  placeholder={pendingAction.confirmPhrase}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAction} disabled={actionBusy}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingAction?.destructive ? "destructive" : "default"}
              disabled={actionBusy || !confirmReady}
              onClick={() => {
                if (pendingAction) void runAction(pendingAction);
              }}
            >
              {actionBusy ? <RefreshCw className="size-4 animate-spin" /> : null}
              {pendingAction?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
    </>
  );
}


