"use client";

import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { DonutChart, DonutLegend, TrendBarChart, TrendLineChart, type DonutSlice } from "@/components/dashboard/charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, CheckCheck, Clock, FileText, Percent, Send, Users } from "lucide-react";
import type { AnalyticsResponse } from "@/lib/employer/workflow-api";

const SOURCE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function NoData({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ data }: { data: AnalyticsResponse }) {
  const { kpis } = data;
  const hasApplications = kpis.applications > 0;
  const sources: DonutSlice[] = data.candidate_sources.map((s, i) => ({
    key: s.source,
    label: s.source,
    value: s.count,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));
  const sourceTotal = sources.reduce((sum, s) => sum + s.value, 0);
  const formatDays = (v: number | null) => (v === null ? "—" : `${v} days`);
  const formatPct = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}%`);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Applications" value={String(kpis.applications)} icon={FileText} tint="red" />
        <StatCard label="Shortlists" value={String(kpis.shortlists)} icon={CheckCheck} tint="green" />
        <StatCard label="Interviews" value={String(kpis.interviews)} icon={CalendarClock} tint="blue" />
        <StatCard label="Offers" value={String(kpis.offers)} icon={Send} tint="violet" />
        <StatCard label="Hires" value={String(kpis.hires)} icon={Users} tint="green" />
        <StatCard label="Time to hire" value={formatDays(kpis.time_to_hire_days)} icon={Clock} tint="amber" />
        <StatCard label="Hiring conversion" value={formatPct(kpis.hiring_conversion_pct)} icon={Percent} tint="blue" />
      </div>

      {!hasApplications && (
        <NoData text="No applications in this period yet. Charts fill in once candidates apply to your jobs." />
      )}

      {hasApplications && (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Panel title="Application funnel" description="Candidates reaching each stage in the period.">
              <TrendBarChart data={data.funnel} xKey="stage" series={[{ key: "count", color: "var(--chart-1)", label: "Candidates" }]} />
            </Panel>
            <Panel title="Hiring timeline" description="Applications received and hires made, by month.">
              <TrendLineChart
                data={data.hiring_timeline}
                xKey="month"
                series={[
                  { key: "applications", color: "var(--chart-3)", label: "Applications" },
                  { key: "hires", color: "var(--chart-2)", label: "Hires" },
                ]}
              />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Panel title="Top skills" description="Skills most often matched across applicants.">
              {data.top_skills.length === 0 ? (
                <NoData text="No skill data for this period." />
              ) : (
                <HorizontalBarList items={data.top_skills.map((s) => ({ label: s.skill, value: s.count }))} />
              )}
            </Panel>
            <Panel title="Candidate sources" description="Where applicants came from.">
              {sources.length === 0 ? (
                <NoData text="No source data for this period." />
              ) : (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="w-full sm:w-1/2">
                    <DonutChart data={sources} height={200} innerRadius={56} outerRadius={84} centerValue={String(sourceTotal)} centerLabel="Applicants" />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <DonutLegend data={sources} valueFormatter={(v) => `${sourceTotal ? Math.round((v / sourceTotal) * 100) : 0}%`} />
                  </div>
                </div>
              )}
            </Panel>
            <Panel title="Time-to-hire trend" description="Average days from application to hire.">
              <TrendLineChart data={data.time_to_hire_trend} xKey="month" series={[{ key: "days", color: "var(--chart-4)", label: "Days" }]} height={220} />
            </Panel>
          </div>
        </>
      )}

      <Card className="rounded-2xl p-0">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-heading text-base">Job performance</CardTitle>
          <CardDescription>Pipeline health for each of your job postings in this period.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {data.job_performance.length === 0 ? (
            <div className="px-6 pb-6">
              <NoData text="No job postings in this period." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead className="text-right">Applications</TableHead>
                  <TableHead className="text-right">Shortlisted</TableHead>
                  <TableHead className="text-right">Hires</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.job_performance.map((job) => (
                  <TableRow key={job.job_id}>
                    <TableCell className="font-medium">{job.job_title}</TableCell>
                    <TableCell className="text-right">{job.applications}</TableCell>
                    <TableCell className="text-right">{job.shortlisted}</TableCell>
                    <TableCell className="text-right">{job.hires}</TableCell>
                    <TableCell className="text-right">{formatPct(job.conversion_pct)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
