import { Eye, Inbox, Sparkles, UserRound } from "lucide-react";
import { formatRelativeDays } from "@/components/employer/jobs/format";
import type { RecentApplication } from "@/lib/employer/jobs-api";
import { cn } from "@/lib/utils";
import { RowMenu } from "./row-menu";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton, initials } from "./section-shell";

export const APPLICATION_STATUS_META: Record<string, { label: string; className: string }> = {
  applied: { label: "Applied", className: "bg-red-50 text-red-600 ring-red-200" },
  screened: { label: "Screened", className: "bg-violet-50 text-violet-700 ring-violet-200" },
  shortlisted: { label: "Shortlisted", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  interview: { label: "Interview", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  interviewed: { label: "Interviewed", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  offered: { label: "Offered", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  hired: { label: "Hired", className: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  rejected: { label: "Rejected", className: "bg-muted text-muted-foreground ring-border" },
};

export function RecentApplications({
  items,
  loading,
  error,
  onRetry,
}: {
  items: RecentApplication[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <SectionCard title="Recent Applications" icon={Inbox} action={{ label: "View All", href: "/employer/applications" }}>
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || items === null ? (
        <SectionSkeleton rows={5} />
      ) : !Array.isArray(items) || items.length === 0 ? (
        <SectionEmpty
          title="No applications yet"
          body="Candidates who apply to your published jobs appear here with their match score and stage."
          cta={{ label: "Manage jobs", href: "/employer/jobs" }}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.slice(0, 6).map((app) => {
            const meta = APPLICATION_STATUS_META[app.status] ?? {
              label: app.status || "Applied",
              className: "bg-muted text-muted-foreground ring-border",
            };
            return (
              <li key={app.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {initials(app.candidate_name) || <UserRound className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{app.candidate_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {app.role ?? "Role not set"}
                    {app.match_score !== null && <span className="ml-1.5 font-medium text-foreground tabular-nums">{app.match_score}%</span>}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                    meta.className,
                  )}
                >
                  {meta.label}
                </span>
                <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground sm:block">
                  {formatRelativeDays(app.applied_at)}
                </span>
                <RowMenu
                  label={`More actions for ${app.candidate_name}`}
                  items={[
                    { label: "View application", href: `/employer/applications/${app.id}`, icon: Eye },
                    { label: "Find matches", href: "/employer/matches", icon: Sparkles },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
