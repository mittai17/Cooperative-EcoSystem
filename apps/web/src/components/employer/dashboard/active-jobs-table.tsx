import Link from "next/link";
import { Briefcase, Eye, MapPin, Pencil, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobStatusChip } from "@/components/employer/jobs/job-status-chip";
import type { EmployerJob } from "@/lib/employer/jobs-api";
import { RowMenu } from "./row-menu";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton } from "./section-shell";

export function ActiveJobsTable({
  jobs,
  loading,
  error,
  onRetry,
}: {
  jobs: EmployerJob[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const active = (jobs ?? []).filter((job) => job.status === "open").slice(0, 4);
  return (
    <SectionCard title="Active Jobs" icon={Briefcase} action={{ label: "View All", href: "/employer/jobs" }}>
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || jobs === null ? (
        <SectionSkeleton rows={4} />
      ) : active.length === 0 ? (
        <SectionEmpty
          title="No active jobs"
          body="Publish a draft to start receiving applications."
          cta={{ label: "Create New Job", href: "/employer/jobs/new" }}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {active.map((job) => (
            <li key={job.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/employer/jobs/${job.id}`} className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline">
                  {job.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {job.employment_type && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                      {job.employment_type}
                    </Badge>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {job.location}
                    </span>
                  )}
                </div>
              </div>
              <dl className="hidden shrink-0 grid-cols-3 gap-4 text-center sm:grid">
                <Metric label="Applications" value={job.applications_count} />
                <Metric label="Shortlisted" value={job.shortlisted_count} />
                <Metric label="Interview" value={job.interview_count} />
              </dl>
              <JobStatusChip status={job.status} className="shrink-0" />
              <RowMenu
                label={`More actions for ${job.title}`}
                items={[
                  { label: "View job", href: `/employer/jobs/${job.id}`, icon: Eye },
                  { label: "Edit job", href: `/employer/jobs/${job.id}/edit`, icon: Pencil },
                  { label: "Find matches", href: `/employer/matches?job=${job.id}`, icon: Sparkles },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
