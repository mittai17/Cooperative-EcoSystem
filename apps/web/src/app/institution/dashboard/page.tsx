import Link from "next/link";
import { CheckCircle2, GraduationCap, Percent, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendLineChart, TrendBarChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  institutionAttendanceTrend,
  institutionNominations,
  institutionProgrammeSummary,
} from "@/lib/mock-data/dashboards";
import { NominationsPanel } from "./nominations-panel";
import { currentUser } from "@clerk/nextjs/server";

export default async function InstitutionDashboardPage() {
  const user = await currentUser();
  const totalTrainees = institutionProgrammeSummary.reduce((sum, p) => sum + p.trainees, 0);
  const avgAttendance = Math.round(
    institutionProgrammeSummary.reduce((sum, p) => sum + p.attendance, 0) / institutionProgrammeSummary.length
  );
  const pendingNominations = institutionNominations.filter((n) => n.status === "Pending").length;
  const enrolmentByProgramme = institutionProgrammeSummary.map((p) => ({
    programme: p.title.split(" ").slice(0, 2).join(" "),
    trainees: p.trainees,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user?.firstName ? `${user.firstName}'s Institution` : "Institute of Rural Management, Anand"}
        description="Programme performance, trainee nominations, and attendance across your active cohorts."
        action={
          <>
            <span className="demo-data-tag">Demo institution data</span>
            <Button variant="outline" render={<Link href="/programmes">View public listing</Link>} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active programmes" tint="red" value={String(institutionProgrammeSummary.length)} icon={GraduationCap} trend="1 completed this quarter" trendTone="neutral" />
        <StatCard label="Total trainees" tint="green" value={totalTrainees.toLocaleString("en-IN")} icon={Users} trend="+58 this month" trendTone="up" />
        <StatCard label="Average attendance" tint="red" value={`${avgAttendance}%`} icon={Percent} trend="+3 pts vs last month" trendTone="up" />
        <StatCard label="Pending nominations" tint="red" value={String(pendingNominations)} icon={CheckCircle2} trend="Awaiting your review" trendTone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Training progress by programme</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendBarChart
                data={enrolmentByProgramme}
                xKey="programme"
                series={[{ key: "trainees", color: "var(--color-primary)", label: "Trainees enrolled" }]}
                height={220}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Attendance rate trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={institutionAttendanceTrend}
                xKey="week"
                series={[{ key: "attendance", color: "var(--color-chart-2)", label: "Attendance %" }]}
                height={220}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Recent Nominations</CardTitle>
          </CardHeader>
          <CardContent>
            <NominationsPanel />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Programme summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programme</TableHead>
                <TableHead>Trainees</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutionProgrammeSummary.map((programme) => (
                <TableRow key={programme.id}>
                  <TableCell className="font-medium text-foreground">{programme.title}</TableCell>
                  <TableCell>{programme.trainees}</TableCell>
                  <TableCell>{programme.attendance}%</TableCell>
                  <TableCell>
                    <Badge
                      className={programme.status === "Active" ? "bg-success/10 text-success" : undefined}
                      variant={programme.status === "Active" ? "secondary" : "outline"}
                    >
                      {programme.status}
                    </Badge>
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
