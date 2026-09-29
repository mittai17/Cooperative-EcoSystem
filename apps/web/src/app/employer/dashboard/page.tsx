import Link from "next/link";
import { AlertCircle, Briefcase, FileCheck2, Plus, ShieldCheck, Target, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart, DonutLegend } from "@/components/dashboard/charts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchWithAuth } from "@/lib/api";
import { currentUser } from "@clerk/nextjs/server";

/* Monochrome red ramp (palest -> deepest) so the application funnel donut
   reads as a single red family, matching the reference's "Skill Demand
   Trends" donut instead of a rainbow chart palette. */
const funnelColors = [
  "oklch(0.88 0.05 27)",
  "oklch(0.78 0.12 27)",
  "oklch(0.68 0.18 27)",
  "var(--color-primary)",
  "oklch(0.42 0.19 27)",
];

const FUNNEL_STAGES: { key: string; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "offered", label: "Offered" },
  { key: "hired", label: "Hired" },
];

interface JobRow {
  id: string;
  title: string;
  location: string | null;
  status: string;
  openings: number | null;
  deadline: string | null;
}

interface Candidate {
  id: string;
  name: string;
  location: string;
  occupation: string | null;
  match_score: number | null;
}

interface Overview {
  open_jobs: number;
  new_applicants: number;
  shortlisted: number;
  hires: number;
  funnel: Record<string, number>;
}

export default async function EmployerDashboardPage() {
  const user = await currentUser();

  let overview: Overview | null = null;
  let jobs: JobRow[] = [];
  let candidates: Candidate[] = [];
  let loadError: string | null = null;

  try {
    [overview, jobs, candidates] = await Promise.all([
      fetchWithAuth("/api/v1/employer/overview") as Promise<Overview>,
      fetchWithAuth("/api/v1/jobs/mine").then((data) => data.jobs) as Promise<JobRow[]>,
      fetchWithAuth("/api/v1/employer/candidates?limit=5").then((data) => data.candidates) as Promise<Candidate[]>,
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not reach the CoopSetu API";
  }

  const totalApplications = overview
    ? Object.values(overview.funnel).reduce((sum, n) => sum + n, 0)
    : 0;
  const funnelSlices = FUNNEL_STAGES.map((stage, index) => ({
    key: stage.key,
    label: stage.label,
    value: overview?.funnel[stage.key] ?? 0,
    color: funnelColors[index % funnelColors.length],
  }));
  const openJobsRow = jobs.filter((job) => job.status === "open");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user?.firstName ? `Welcome back, ${user.firstName}!` : "Welcome back!"}
        description="Manage job postings and review candidate applications sourced from verified Skill Passports."
        action={<Button render={<Link href="/employer/jobs"><Plus className="size-4" /> Create New Job</Link>} />}
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load live employer data</AlertTitle>
          <AlertDescription>{loadError}. Showing an empty dashboard until the API is reachable.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" tint="red" value={String(overview?.open_jobs ?? 0)} icon={Briefcase} trend={`${jobs.length} total postings`} trendTone="neutral" />
        <StatCard label="Applications" tint="red" value={String(totalApplications)} icon={FileCheck2} trend="Across all postings" trendTone="up" />
        <StatCard label="Candidate pool" tint="green" value={String(candidates.length)} icon={Target} trend={`Verified-Skill-Passport candidates`} trendTone="neutral" />
        <StatCard label="Hired" tint="amber" value={String(overview?.hires ?? 0)} icon={ShieldCheck} trend="This hiring cycle" trendTone="up" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <UserCheck className="size-4 text-primary" />
              Candidate pool
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {candidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No candidates have opted in to employer visibility yet.
              </p>
            ) : (
              candidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{candidate.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {candidate.occupation ?? "Occupation not set"} &middot; {candidate.location || "Location not set"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {candidate.match_score !== null && (
                      <Badge className="bg-success/10 text-success" variant="secondary">{candidate.match_score}% match</Badge>
                    )}
                    <Button variant="outline" size="sm" render={<Link href="/employer/candidates">View</Link>} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Application Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DonutChart data={funnelSlices} height={180} centerValue={String(totalApplications)} centerLabel="Applied" />
            <DonutLegend data={funnelSlices} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Job postings</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No job postings yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Create your first posting to start receiving applications from verified trainees.
              </p>
              <Button size="sm" render={<Link href="/employer/jobs"><Plus className="size-4" /> Create New Job</Link>} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                    <TableCell>{job.location ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        className={job.status === "open" ? "bg-success/10 text-success" : undefined}
                        variant={job.status === "open" ? "secondary" : "outline"}
                      >
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" render={<Link href="/employer/jobs">Manage</Link>} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {openJobsRow.length === 0 && jobs.length > 0 && (
        <p className="text-xs text-muted-foreground">All postings are currently closed or in draft.</p>
      )}
    </div>
  );
}
