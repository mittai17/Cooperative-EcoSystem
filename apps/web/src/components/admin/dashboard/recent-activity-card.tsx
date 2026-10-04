"use client";

import { Award, Briefcase, Building2, CalendarDays, CheckCircle2, FileText, UserCheck } from "lucide-react";
import type { ComponentType } from "react";
import type { RecentActivity } from "@/lib/admin/admin-api";
import { cn } from "@/lib/utils";
import { DashboardPanel, EmptyState } from "./panel";
import { relativeTime } from "./format";

const KIND_STYLES: Record<string, { icon: ComponentType<{ className?: string }>; tile: string }> = {
  institution: { icon: Building2, tile: "bg-tint-green-bg text-tint-green-fg" },
  trainer: { icon: UserCheck, tile: "bg-tint-violet-bg text-tint-violet-fg" },
  certification: { icon: Award, tile: "bg-tint-amber-bg text-tint-amber-fg" },
  job: { icon: Briefcase, tile: "bg-tint-red-bg text-tint-red-fg" },
  placement: { icon: CheckCircle2, tile: "bg-tint-amber-bg text-tint-amber-fg" },
  assessment: { icon: FileText, tile: "bg-tint-blue-bg text-tint-blue-fg" },
};

const FALLBACK = { icon: CalendarDays, tile: "bg-muted text-muted-foreground" };

export function RecentActivityCard({ items }: { items: RecentActivity[] }) {
  return (
    <DashboardPanel icon={CalendarDays} title="Recent Activity" viewAllHref="/admin/audit-logs" className="h-full">
      {items.length === 0 ? (
        <EmptyState message="No recent activity." />
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {items.map((item, index) => {
            const style = KIND_STYLES[item.kind] ?? FALLBACK;
            const Icon = style.icon;
            return (
              <li key={`${item.at}-${index}`} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl", style.tile)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
                    {item.subtitle ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.subtitle}</p> : null}
                  </div>
                </div>
                <span className="mt-0.5 shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">{relativeTime(item.at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
