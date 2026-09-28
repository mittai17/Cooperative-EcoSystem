import Link from "next/link";
import { Briefcase, FileCheck2, Plus, ShieldCheck, Target, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart, DonutLegend } from "@/components/dashboard/charts";
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
import {
  employerApplicationFunnel,
  employerCandidateMatches,
  employerJobPostings,
} from "@/lib/mock-data/dashboards";
import { currentUser } from "@clerk/nextjs/server";

/* Monochrome red ramp (palest -> deepest) so the application funnel donut
   reads as a single red family, matching the reference's "Skill Demand
   Trends" donut instead of the old rainbow chart palette. */
const funnelColors = [
  "oklch(0.88 0.05 27)",
  "oklch(0.78 0.12 27)",
  "oklch(0.68 0.18 27)",
  "var(--color-primary)",
  "oklch(0.42 0.19 27)",
];

export default async function EmployerDashboardPage() {
  const user = await currentUser();
  const openPostings = employerJobPostings.filter((j) => j.status === "Open").length;
  const totalApplications = employerJobPostings.reduce((sum, j) => sum + j.applications, 0);
  const hiredCount = employerApplicationFunnel.find((s) => s.stage === "Hired")?.count ?? 0;

  const funnelSlices = employerApplicationFunnel.map((stage, index) => ({
    key: stage.stage,
    label: stage.stage,
    value: stage.count,
    color: funnelColors[index % funnelColors.length],
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user?.firstName ? `Welcome back, ${user.firstName}!` : "Welcome back, Amul Dairy Cooperative Union!"}
        description="Manage job postings and review AI-ranked candidate matches from verified Skill Passports."
        action={
          <>
            <span className="demo-data-tag">Demo employer data</span>
            <Button render={<Link href="/employer/jobs"><Plus className="size-4" /> Create New Job</Link>} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" tint="red" value={String(openPostings)} icon={Briefcase} trend={`${employerJobPostings.length} total postings`} trendTone="neutral" />
        <StatCard label="Applications" tint="red" value={String(totalApplications)} icon={FileCheck2} trend="Across all postings" trendTone="up" />
        <StatCard label="AI matches" tint="green" value={String(employerCandidateMatches.length)} icon={Target} trend={`${employerCandidateMatches.filter((c) => c.verified).length} verified`} trendTone="neutral" />
        <StatCard label="Hired" tint="amber" value={String(hiredCount)} icon={ShieldCheck} trend="This hiring cycle" trendTone="up" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <UserCheck className="size-4 text-primary" />
              Top Matched Candidates
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {employerCandidateMatches.map((candidate) => (
              <div key={candidate.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{candidate.name}</p>
                    {candidate.verified && (
                      <Badge className="bg-success/10 text-success" variant="secondary">
                        <ShieldCheck className="size-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">Matched for {candidate.role}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge className="bg-success/10 text-success" variant="secondary">{candidate.matchScore}% match</Badge>
                  <Button variant="outline" size="sm" render={<Link href="/skill-passport">View</Link>} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Application Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DonutChart data={funnelSlices} height={180} centerValue={String(employerApplicationFunnel[0].count)} centerLabel="Applied" />
            <DonutLegend data={funnelSlices} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Job postings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employerJobPostings.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                  <TableCell>{job.applications}</TableCell>
                  <TableCell>
                    <Badge
                      className={job.status === "Open" ? "bg-success/10 text-success" : undefined}
                      variant={job.status === "Open" ? "secondary" : "outline"}
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" render={<Link href="/jobs">View listing</Link>} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
