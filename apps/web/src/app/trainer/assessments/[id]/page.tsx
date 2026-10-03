"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardList, Hourglass, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/trainer/states";
import { fmtIst, type AssessmentDetail } from "@/components/trainer/assessments/types";
import { useTrainerQuery } from "@/lib/trainer/api";

const STATUS_CLASS: Record<string, string> = {
  Passed: "bg-success/10 text-success",
  Failed: "bg-destructive/10 text-destructive",
  "Needs Review": "bg-warning/15 text-warning",
  Pending: "bg-muted text-muted-foreground",
};

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useTrainerQuery<AssessmentDetail>(`/assessments/${id}`);

  if (loading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;
  const { assessment: a, totals: t, rows } = data;

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="self-start" render={<Link href="/trainer/assessments"><ArrowLeft className="mr-1.5 size-4" />All assessments</Link>} />
      <PageHeader
        title={a.title}
        description={`${a.course ?? ""} · ${a.batch ?? ""} · ${a.questions.length} questions · ${a.duration_minutes} min · pass at ${a.passing_score}% · ${fmtIst(a.scheduled_at)}`}
        action={<Badge variant={a.status === "draft" ? "outline" : "secondary"} className="capitalize">{a.status}</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total trainees" value={String(t.total_trainees)} icon={Users} tint="blue" />
        <StatCard label="Submitted" value={`${t.submitted}`} icon={ClipboardList} tint="violet" trend={`${t.pending} pending`} />
        <StatCard label="Average score" value={t.avg_score === null ? "—" : `${t.avg_score}%`} icon={BarChart3} tint="amber" trend={t.needs_review ? `${t.needs_review} awaiting review` : undefined} />
        <StatCard label="Pass rate" value={t.pass_rate === null ? "—" : `${t.pass_rate}%`} icon={CheckCircle2} tint="green" />
      </div>
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold"><Hourglass className="size-5 text-muted-foreground" />Results</h2>
        {rows.length === 0 ? (
          <EmptyState title="No trainees in this batch" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainee</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.trainee_id}>
                  <TableCell className="font-medium">{r.trainee}</TableCell>
                  <TableCell>{r.score === null ? "—" : `${r.score}%`}</TableCell>
                  <TableCell><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}>{r.status}</span></TableCell>
                  <TableCell>{r.attempt_no ?? "—"}</TableCell>
                  <TableCell>{r.submitted_at ? fmtIst(r.submitted_at) : "—"}</TableCell>
                  <TableCell className="text-right">
                    {r.attempt_id ? (
                      <Button size="sm" variant={r.status === "Needs Review" ? "default" : "outline"}
                        render={<Link href={`/trainer/assessments/${a.id}/review/${r.attempt_id}`}>{r.status === "Needs Review" ? "Review Submission" : "View"}</Link>} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Not submitted</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
