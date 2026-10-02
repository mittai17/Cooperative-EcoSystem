import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  GraduationCap,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard, type StatTint } from "@/components/dashboard/stat-card";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Button } from "@/components/ui/button";
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
  adminEmploymentFunnel,
  adminInstitutionsSummary,
  adminMonthlyOutcomes,
  adminSkillDemand,
} from "@/lib/mock-data/dashboards";
import { MonthlyOutcomesCard } from "./monthly-outcomes-card";


const TINTS: StatTint[] = ["red"];

export default async function AdminDashboardPage() {
  const user = { firstName: "Admin" };
  const totalInstitutions = adminInstitutionsSummary.length;
  const totalTrainees = adminInstitutionsSummary.reduce((sum, i) => sum + i.trainees, 0);
  const totalProgrammes = adminInstitutionsSummary.reduce((sum, i) => sum + i.programmes, 0);
  const registered = adminEmploymentFunnel[0].count;
  const certified = adminEmploymentFunnel.find((s) => s.stage === "Certified")?.count ?? 0;
  const jobMatched = adminEmploymentFunnel.find((s) => s.stage === "Job Matched")?.count ?? 0;
  const employed = adminEmploymentFunnel.find((s) => s.stage === "Employed")?.count ?? 0;
  const certificationRate = Math.round((certified / registered) * 100);
  const employmentRate = Math.round((employed / registered) * 100);

  const stats: { label: string; value: string; icon: LucideIcon; trend: string }[] = [
    { label: "Partner institutions", value: String(totalInstitutions), icon: Building2, trend: "Across 4 states shown" },
    { label: "Registered trainees", value: totalTrainees.toLocaleString("en-IN"), icon: Users, trend: "+1,240 this month" },
    { label: "Active programmes", value: String(totalProgrammes), icon: GraduationCap, trend: "National catalogue" },
    { label: "Certification rate", value: `${certificationRate}%`, icon: BadgeCheck, trend: "Of registered trainees" },
    { label: "Job placements", value: jobMatched.toLocaleString("en-IN"), icon: Target, trend: "Matched to a posting" },
    { label: "Employed", value: employed.toLocaleString("en-IN"), icon: UserCheck, trend: "Confirmed hires" },
    { label: "Employment rate", value: `${employmentRate}%`, icon: TrendingUp, trend: "12-month conversion" },
    { label: "Skill gaps tracked", value: String(adminSkillDemand.length), icon: AlertTriangle, trend: "National skill index" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user?.firstName ? `Welcome, Admin ${user.firstName}` : "NCCT National Dashboard"}
        description="Institutions, programme reach, national skill demand, and employment outcomes across the ecosystem."
        action={
          <>
            <span className="demo-data-tag">Demo national data</span>
            <Link className="contents" href="/programmes"><Button variant="outline"   nativeButton={false}>View public catalogue</Button></Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            tint={TINTS[index % TINTS.length]}
            trend={stat.trend}
            trendTone="neutral"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyOutcomesCard data={adminMonthlyOutcomes} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Top Demanded Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarList
              items={adminSkillDemand.map((s) => ({ label: s.skill, value: s.demand }))}
              max={100}
              valueFormatter={(v) => `${v} idx`}
              barColorClassName="bg-primary"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Training to Employment Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarList
              items={adminEmploymentFunnel.map((s) => ({ label: s.stage, value: s.count }))}
              valueFormatter={(v) => v.toLocaleString("en-IN")}
              barColorClassName="bg-primary"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Programmes</TableHead>
                  <TableHead className="text-right">Trainees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminInstitutionsSummary.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium text-foreground">{inst.name}</TableCell>
                    <TableCell>{inst.state}</TableCell>
                    <TableCell>{inst.programmes}</TableCell>
                    <TableCell className="text-right">{inst.trainees.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
