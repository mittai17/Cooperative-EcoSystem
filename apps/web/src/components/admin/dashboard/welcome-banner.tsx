"use client";

export function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-rose-100/90 dark:border-border bg-gradient-to-r from-[#FFF5F5] via-[#FFF9F5] to-[#EFF6FF] px-6 py-4.5 sm:px-8 shadow-2xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
        {/* Left: Heading & description */}
        <div className="min-w-0 max-w-xl">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground sm:text-[26px]">
            Welcome to CoopSetu AI Admin Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-[13px] text-slate-600 dark:text-muted-foreground leading-relaxed">
            Manage the cooperative training ecosystem, monitor progress and drive national impact.
          </p>
        </div>

        {/* Right: Date & Time */}
        <div className="shrink-0 text-left sm:text-right" suppressHydrationWarning>
          <p className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-foreground">
            Oct 3, 2026
          </p>
          <p className="font-heading text-2xl sm:text-[28px] font-extrabold text-slate-900 dark:text-foreground tracking-tight leading-none my-0.5">
            12:29 PM
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
            National Cooperative Training Council
          </p>
        </div>
      </div>
    </section>
  );
}
