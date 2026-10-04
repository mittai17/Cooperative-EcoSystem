"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrCode, ScanLine, Wifi, WifiOff } from "lucide-react";
import { DemoRoleSwitcherBanner } from "@/components/auth/demo-role-switcher-banner";

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
    <div className="text-center">
      <p className="text-5xl font-bold tabular-nums tracking-tight text-white sm:text-6xl">
        {timeStr}
      </p>
      <p className="mt-1 text-sm text-red-300">{dateStr}</p>
    </div>
  );
}

// ── Connectivity badge ────────────────────────────────────────────────────────

function ConnectivityBadge() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
  return (
    <>
      <DemoRoleSwitcherBanner />
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
          {/* CoopSetu wordmark */}
          <span className="flex size-9 items-center justify-center rounded-lg bg-red-700 text-white shadow-md">
            <ScanLine className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">CoopSetu AI</p>
            <p className="text-[10px] uppercase tracking-widest text-red-400">
              Attendance Kiosk
            </p>
          </div>
        </div>
        <ConnectivityBadge />
      </header>

      {/* ── Centre content ── */}
      <main className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-10">
        <LiveClock />

        <p className="text-center text-base text-red-200/70 sm:text-lg">
          Select your role to continue
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
                Generate QR &amp; manage attendance
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
                Scan QR token to mark attendance
              </p>
            </div>

            <span className="relative rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white shadow transition-colors group-hover:bg-red-600">
              Scan QR →
            </span>
          </Link>
        </div>

        {/* Offline capability note */}
        <p className="max-w-lg text-center text-xs text-red-400/60">
          Attendance recorded offline in this kiosk is stored locally and synced automatically when
          connectivity is restored. No data is lost during network outages.
        </p>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 flex w-full max-w-5xl items-center justify-between">
        <p className="text-[11px] text-red-800">
          CoopSetu AI &middot; Kiosk v2 &middot; SIH 2026
        </p>
        <Link
          href="/kiosk/attendance"
          className="text-[11px] text-red-700 underline-offset-2 hover:text-red-500 hover:underline"
        >
          Advanced kiosk view →
        </Link>
      </footer>
    </div>
    </>
  );
}
