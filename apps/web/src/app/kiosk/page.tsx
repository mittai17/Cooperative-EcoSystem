"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CheckCircle2,
  Cpu,
  Database,
  Fingerprint,
  QrCode,
  ScanLine,
  ShieldCheck,
  UserCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { DemoRoleSwitcherBanner } from "@/components/auth/demo-role-switcher-banner";
import {
  kioskDevice,
  kioskRoster,
  kioskSession,
  faceEngine,
  type RosterTrainee,
} from "@/lib/mock-data/kiosk";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ── Live clock ────────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="text-center" suppressHydrationWarning>
      <p suppressHydrationWarning className="text-5xl font-bold tabular-nums tracking-tight text-white sm:text-6xl">
        {timeStr}
      </p>
      <p suppressHydrationWarning className="mt-1 text-sm text-red-300">
        {dateStr} &middot; <span className="font-mono text-xs text-red-400">IST (UTC+5:30)</span>
      </p>
    </div>
  );
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

function ConnectivityBadge() {
  const online = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getServerOnlineSnapshot);

  return (
    <div
      className={[
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        online
          ? "bg-emerald-900/60 text-emerald-300 ring-1 ring-emerald-700/50"
          : "bg-red-900/60 text-red-300 ring-1 ring-red-700/50",
      ].join(" ")}
    >
      {online ? (
        <>
          <Wifi className="size-3.5" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="size-3.5" />
          Offline – syncing when reconnected
        </>
      )}
    </div>
  );
}

// ── Main landing ──────────────────────────────────────────────────────────────

export default function KioskLandingPage() {
  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [quickScanTrainee, setQuickScanTrainee] = useState<RosterTrainee | null>(null);
  const [quickScanSuccess, setQuickScanSuccess] = useState(false);

  const handleSimulateQuickScan = (trainee: RosterTrainee) => {
    setQuickScanTrainee(trainee);
    setQuickScanSuccess(true);
  };

  return (
    <>
      <DemoRoleSwitcherBanner currentRole="kiosk" />
      <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#0f0404] px-6 py-8">
        {/* Radial glow behind the card area */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(185,28,28,0.18) 0%, transparent 80%)",
          }}
        />

        {/* ── Top bar ── */}
        <header className="relative z-10 flex w-full max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* NURVEX wordmark */}
            <span className="flex size-9 items-center justify-center rounded-lg bg-red-700 text-white shadow-md">
              <ScanLine className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">NURVEX</p>
              <p className="text-[10px] uppercase tracking-widest text-red-400">
                Attendance Kiosk &middot; {kioskDevice.institution}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/kiosk/status"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-red-800/40 bg-red-950/60 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:border-red-600 hover:text-white"
            >
              <Cpu className="size-3.5 text-red-400" />
              <span>{kioskDevice.name}</span>
              <span className="text-red-500">&middot;</span>
              <span className="text-emerald-400">Hardware OK</span>
            </Link>
            <ConnectivityBadge />
          </div>
        </header>

        {/* ── Centre content ── */}
        <main className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 py-4">
          <LiveClock />

          {/* Hardware & readiness status strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-2 text-xs text-red-200/80 backdrop-blur-sm">
            <span className="flex items-center gap-1.5">
              <ScanLine className="size-3.5 text-red-400" />
              QR Optical: <strong className="font-semibold text-emerald-400">Ready</strong>
            </span>
            <span className="text-red-800 hidden sm:inline">&bull;</span>
            <span className="flex items-center gap-1.5">
              <Fingerprint className="size-3.5 text-violet-400" />
              Biometrics: <strong className="font-semibold text-white">{faceEngine.enrolledCount} enrolled</strong>
            </span>
            <span className="text-red-800 hidden sm:inline">&bull;</span>
            <span className="flex items-center gap-1.5">
              <Database className="size-3.5 text-amber-400" />
              Offline Sync: <strong className="font-semibold text-emerald-400">Buffered</strong>
            </span>
            <span className="text-red-800 hidden sm:inline">&bull;</span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="size-3.5 text-blue-400" />
              Session: <strong className="font-semibold text-white">{kioskSession.programme}</strong>
            </span>
          </div>

          <p className="text-center text-base text-red-200/70 sm:text-lg">
            Touch a role below or tap your student smart card
          </p>

          {/* Two big role buttons */}
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
            {/* Trainer */}
            <Link
              href="/trainer/attendance"
              className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-red-800/40 bg-red-950/50 px-8 py-10 shadow-xl ring-1 ring-red-900/30 transition-all duration-200 hover:border-red-600/60 hover:bg-red-900/40 hover:shadow-red-900/30 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-[0.98] sm:py-14"
            >
              {/* Glow dot */}
              <span
                aria-hidden
                className="absolute -top-6 -right-6 size-32 rounded-full bg-red-700/20 blur-2xl transition-all group-hover:bg-red-600/30"
              />

              <span className="flex size-20 items-center justify-center rounded-2xl bg-red-700/30 ring-2 ring-red-600/40 transition-all group-hover:bg-red-700/50 group-hover:ring-red-500/60 sm:size-24">
                <QrCode className="size-10 text-red-200 sm:size-12" strokeWidth={1.5} />
              </span>

              <div className="relative text-center">
                <p className="text-xl font-bold text-white sm:text-2xl">I&apos;m a Trainer</p>
                <p className="mt-1.5 text-sm text-red-300 sm:text-base">
                  Generate dynamic QR &amp; manage session attendance
                </p>
              </div>

              <span className="relative rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white shadow transition-colors group-hover:bg-red-600">
                Generate QR →
              </span>
            </Link>

            {/* Trainee */}
            <Link
              href="/kiosk/attendance"
              className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-red-800/40 bg-red-950/50 px-8 py-10 shadow-xl ring-1 ring-red-900/30 transition-all duration-200 hover:border-red-600/60 hover:bg-red-900/40 hover:shadow-red-900/30 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-[0.98] sm:py-14"
            >
              <span
                aria-hidden
                className="absolute -top-6 -left-6 size-32 rounded-full bg-red-700/20 blur-2xl transition-all group-hover:bg-red-600/30"
              />

              <span className="flex size-20 items-center justify-center rounded-2xl bg-red-700/30 ring-2 ring-red-600/40 transition-all group-hover:bg-red-700/50 group-hover:ring-red-500/60 sm:size-24">
                <ScanLine className="size-10 text-red-200 sm:size-12" strokeWidth={1.5} />
              </span>

              <div className="relative text-center">
                <p className="text-xl font-bold text-white sm:text-2xl">I&apos;m a Trainee</p>
                <p className="mt-1.5 text-sm text-red-300 sm:text-base">
                  Scan QR card or camera check-in
                </p>
              </div>

              <span className="relative rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white shadow transition-colors group-hover:bg-red-600">
                Open Scanner Window →
              </span>
            </Link>
          </div>

          {/* Quick touch check-in simulator bar */}
          <div className="flex flex-col items-center gap-2.5 w-full max-w-xl">
            <button
              type="button"
              onClick={() => {
                setQuickScanSuccess(false);
                setQuickScanTrainee(null);
                setQuickScanOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-red-700/50 bg-red-900/30 px-5 py-3 text-sm font-medium text-red-200 transition-all hover:border-red-500 hover:bg-red-800/40 hover:text-white"
            >
              <ScanLine className="size-4 text-red-400" />
              <span>Tap to test Touch-Card Simulator</span>
              <span className="rounded bg-red-700/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                Quick Scan
              </span>
            </button>
            <p className="max-w-lg text-center text-xs text-red-400/60">
              Offline-first station: records captured offline are secured in local IndexedDB storage and synced automatically when reconnected.
            </p>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="relative z-10 flex w-full max-w-5xl items-center justify-between border-t border-red-950/60 pt-4">
          <p className="text-[11px] text-red-700">
            NURVEX &middot; {kioskDevice.name} &middot; v2.4.0 &middot; SIH 2026
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link
              href="/kiosk/status"
              className="text-red-400 underline-offset-2 hover:text-red-200 hover:underline"
            >
              Device Status &amp; Diagnostics →
            </Link>
            <Link
              href="/kiosk/attendance"
              className="text-red-300 underline-offset-2 hover:text-white hover:underline"
            >
              Full Attendance View →
            </Link>
          </div>
        </footer>

        {/* ── Quick Scan Modal ── */}
        <Dialog open={quickScanOpen} onOpenChange={setQuickScanOpen}>
          <DialogContent className="border-red-900/60 bg-[#160606] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <ScanLine className="size-5 text-red-400" />
                Quick Touch Card Scanner
              </DialogTitle>
              <DialogDescription className="text-red-300/80">
                Select or tap any trainee ID card to simulate instantaneous kiosk check-in:
              </DialogDescription>
            </DialogHeader>

            {quickScanSuccess && quickScanTrainee ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 ring-2 ring-emerald-500/40">
                  <CheckCircle2 className="size-10" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{quickScanTrainee.name}</h4>
                  <p className="font-mono text-sm text-red-300">
                    Roll: {quickScanTrainee.rollNo} &middot; Card: {quickScanTrainee.cardCode}
                  </p>
                  <p className="mt-1 text-xs text-emerald-400 font-medium">
                    ✓ Check-in accepted at {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} &middot; Logged to register
                  </p>
                </div>
                <div className="flex gap-2 w-full pt-2">
                  <Link href="/kiosk/attendance" className="flex-1">
                    <Button variant="default" className="w-full bg-red-700 hover:bg-red-600" nativeButton={false}>
                      View Attendance Register
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="border-red-800 text-red-200 hover:bg-red-900/40 hover:text-white"
                    onClick={() => {
                      setQuickScanSuccess(false);
                      setQuickScanTrainee(null);
                    }}
                  >
                    Scan Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <p className="text-xs uppercase tracking-wide text-red-400 font-semibold">
                  Tap an enrolled card:
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                  {kioskRoster.slice(0, 5).map((trainee) => (
                    <button
                      key={trainee.id}
                      type="button"
                      onClick={() => handleSimulateQuickScan(trainee)}
                      className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-left transition-colors hover:border-red-600 hover:bg-red-900/50 active:scale-[0.99]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{trainee.name}</p>
                        <p className="font-mono text-xs text-red-300">{trainee.rollNo} &middot; {trainee.village}</p>
                      </div>
                      <span className="font-mono text-xs text-red-400 bg-red-950 px-2 py-1 rounded border border-red-900">
                        {trainee.cardCode}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-between border-t border-red-950/80 pt-3">
              <span className="flex items-center gap-1 text-[11px] text-red-400">
                <ShieldCheck className="size-3.5" />
                NCCT Certified Kiosk Token
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-300 hover:bg-red-950 hover:text-white"
                onClick={() => setQuickScanOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
