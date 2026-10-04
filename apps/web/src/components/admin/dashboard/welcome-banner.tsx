"use client";

import { useSyncExternalStore } from "react";

const CLOCK_TICK_MS = 30_000;

function subscribeToClock(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, CLOCK_TICK_MS);
  return () => window.clearInterval(timer);
}

/** Changes once per tick, so the snapshot is stable between renders. */
function currentClockTick(): number | null {
  return Math.floor(Date.now() / CLOCK_TICK_MS);
}

/** Server and hydration render the empty state, so the markup matches before the clock starts. */
function serverClockTick(): number | null {
  return null;
}

/** Renders the current date and time. Empty until the client has mounted. */
function LiveClock() {
  const tick = useSyncExternalStore(subscribeToClock, currentClockTick, serverClockTick);
  const now = tick === null ? null : new Date(tick * CLOCK_TICK_MS);

  const dateLabel = now?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) ?? "";
  const timeLabel = now?.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) ?? "";

  return (
    <div className="shrink-0 text-left lg:text-right" aria-live="off">
      <p className="text-xs font-semibold text-slate-800 sm:text-sm dark:text-foreground">{dateLabel || " "}</p>
      <p className="font-heading my-0.5 text-2xl leading-none font-extrabold tracking-tight text-slate-900 sm:text-[28px] dark:text-foreground">
        {timeLabel || " "}
      </p>
      <p className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">National Cooperative Training Council</p>
    </div>
  );
}

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-rose-100/90 dark:border-border bg-gradient-to-r from-[#FFF5F5] via-[#FFF8F1] to-[#EFF6FF] px-6 py-5 sm:px-8 shadow-2xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
        {/* Left: Heading & description */}
        <div className="min-w-0 max-w-xl">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground sm:text-[26px]">
            Welcome to NURVEX Admin Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">
            Manage the cooperative training ecosystem, monitor progress and drive national impact.
          </p>
        </div>

        {/* Center: Heritage Campus Architectural Illustration + Floating Badge */}
        <div className="relative flex items-center justify-center my-1 lg:my-0">
          <div className="relative w-[340px] sm:w-[420px] h-[95px] flex items-end justify-center overflow-visible">
            {/* Campus Architectural SVG */}
            <svg
              viewBox="0 0 420 95"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="domeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>

              {/* Distant Trees & Landscape */}
              <ellipse cx="60" cy="85" rx="55" ry="12" fill="#86EFAC" fillOpacity="0.4" />
              <ellipse cx="160" cy="85" rx="70" ry="14" fill="#BBF7D0" fillOpacity="0.5" />
              <ellipse cx="260" cy="85" rx="80" ry="14" fill="#86EFAC" fillOpacity="0.4" />
              <ellipse cx="360" cy="85" rx="60" ry="12" fill="#BBF7D0" fillOpacity="0.5" />

              {/* Campus Colonnade Building */}
              {/* Main Hall */}
              <rect x="180" y="52" width="130" height="34" rx="2" fill="#F8FAFC" stroke="#64748B" strokeWidth="0.8" />
              {/* Arched windows/colonnade */}
              <path d="M 188 86 L 188 68 Q 194 62 200 68 L 200 86" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <path d="M 206 86 L 206 68 Q 212 62 218 68 L 218 86" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <path d="M 224 86 L 224 68 Q 230 62 236 68 L 236 86" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <path d="M 242 86 L 242 68 Q 248 62 254 68 L 254 86" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <path d="M 260 86 L 260 68 Q 266 62 272 68 L 272 86" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <path d="M 278 86 L 278 68 Q 284 62 290 68 L 290 86" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />
              <path d="M 296 86 L 296 68 Q 302 62 308 68 L 308 86" fill="#E2E8F0" stroke="#475569" strokeWidth="0.8" />

              {/* Roof Balustrade */}
              <line x1="178" y1="52" x2="312" y2="52" stroke="#475569" strokeWidth="1.5" />

              {/* Clock Tower */}
              <rect x="232" y="22" width="28" height="38" fill="#FFFFFF" stroke="#475569" strokeWidth="1" />
              {/* Clock face with Roman styling */}
              <circle cx="246" cy="36" r="7" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1.2" />
              <circle cx="246" cy="36" r="1" fill="#0284C7" />
              <line x1="246" y1="36" x2="246" y2="31" stroke="#0284C7" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="246" y1="36" x2="250" y2="36" stroke="#0284C7" strokeWidth="1.2" strokeLinecap="round" />

              {/* Tower Dome & Finial */}
              <path d="M 230 22 Q 246 4 262 22 Z" fill="url(#domeGrad)" stroke="#0369A1" strokeWidth="1" />
              <line x1="246" y1="4" x2="246" y2="0" stroke="#0369A1" strokeWidth="1.5" />
              <circle cx="246" cy="0" r="1.5" fill="#F59E0B" />

              {/* Flanking Trees */}
              <circle cx="165" cy="74" r="16" fill="#22C55E" />
              <circle cx="152" cy="76" r="12" fill="#16A34A" />
              <circle cx="174" cy="77" r="11" fill="#15803D" />

              <circle cx="325" cy="74" r="16" fill="#22C55E" />
              <circle cx="338" cy="76" r="12" fill="#16A34A" />
              <circle cx="316" cy="77" r="11" fill="#15803D" />

              {/* Foreground Hedge */}
              <ellipse cx="245" cy="88" rx="140" ry="6" fill="#16A34A" />
            </svg>

            {/* Floating Pill Badge matching reference exactly */}
            <div className="absolute top-2 left-2 sm:left-4 bg-white/95 dark:bg-card/95 border border-rose-200/90 shadow-md rounded-2xl px-4 py-1.5 text-center backdrop-blur">
              <span className="block font-heading text-xs font-bold text-[#DC2626] leading-tight">
                Stronger Cooperatives
              </span>
              <span className="block font-heading text-xs font-bold text-[#DC2626] leading-tight">
                Brighter Futures
              </span>
            </div>
          </div>
        </div>

        {/* Far Right: live date and time, set after mount to avoid a hydration mismatch */}
        <LiveClock />
      </div>
    </section>
  );
}
