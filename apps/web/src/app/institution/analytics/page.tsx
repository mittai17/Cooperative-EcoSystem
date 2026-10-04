"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Users,
  Award,
  TrendingUp,
  Briefcase,
  Download,
  Filter,
  GraduationCap,
  Building,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MONTHLY_ENROLLMENT = [
  { month: "Apr", enrolled: 95, completed: 88 },
  { month: "May", enrolled: 120, completed: 110 },
  { month: "Jun", enrolled: 140, completed: 132 },
  { month: "Jul", enrolled: 180, completed: 165 },
  { month: "Aug", enrolled: 210, completed: 194 },
  { month: "Sep", enrolled: 240, completed: 218 },
];

const SECTOR_DISTRIBUTION = [
  { name: "Dairy Cooperatives", value: 380, color: "#0284c7" },
  { name: "Agri Credit & PACS", value: 320, color: "#10b981" },
  { name: "Sugar & Bio-Energy", value: 210, color: "#f59e0b" },
  { name: "Handloom & Artisans", value: 160, color: "#8b5cf6" },
  { name: "Urban Banking", value: 170, color: "#ec4899" },
];

const FUNNEL_DATA = [
  { stage: "Nominated by Society", count: 1420 },
  { stage: "Enrolled in Batch", count: 1240 },
  { stage: "Completed Curriculum", count: 1098 },
  { stage: "Passed Certification", count: 1045 },
  { stage: "Absorbed / Employed", count: 970 },
];

const TOP_SOCIETIES = [
  { name: "Gujarat Cooperative Milk Marketing Fed (GCMMF)", district: "Anand, Gujarat", sector: "Dairy", sponsored: 185, completionRate: 96, placed: 178 },
  { name: "Maharashtra State Cooperative Bank Ltd", district: "Mumbai, Maharashtra", sector: "Banking", sponsored: 140, completionRate: 94, placed: 132 },
  { name: "Kaira District Central Cooperative Bank", district: "Kheda, Gujarat", sector: "Credit", sponsored: 95, completionRate: 92, placed: 88 },
  { name: "IFFCO Farmers Service Primary Cooperative", district: "Bareilly, UP", sector: "Agriculture", sponsored: 80, completionRate: 90, placed: 74 },
  { name: "Warana Dairy & Agricultural Cooperative", district: "Kolhapur, Maharashtra", sector: "Dairy", sponsored: 72, completionRate: 95, placed: 69 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("2025-2026");

  const handleExportCsv = () => {
    const headers = ["Society Name", "Location", "Sector", "Trainees Sponsored", "Completion Rate %", "Trainees Absorbed"];
    const rows = TOP_SOCIETIES.map((s) => [
      `"${s.name}"`,
      `"${s.district}"`,
      s.sector,
      s.sponsored,
      `${s.completionRate}%`,
      s.placed,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `institution_analytics_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Institution Analytics"
        description="Macro insights on batch completions, sector-wise trainee distribution, and cooperative employment outcomes."
        action={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(val) => val && setPeriod(val)}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-2026">AY 2025-26</SelectItem>
                <SelectItem value="2024-2025">AY 2024-25</SelectItem>
                <SelectItem value="All-Time">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="mr-1.5 size-4" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Enrolled"
          value="1,240"
          trend="↑ 18% vs last year"
        />
        <StatCard
          icon={GraduationCap}
          label="Completion Rate"
          value="88.5%"
          trend="1,098 completed"
        />
        <StatCard
          icon={Award}
          label="Certified Trainees"
          value="1,045"
          trend="84.3% certification rate"
        />
        <StatCard
          icon={Briefcase}
          label="Placement / Absorbed"
          value="78.2%"
          trend="970 active placements"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Enrolled vs Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Monthly Intake vs Completed</CardTitle>
            <CardDescription>Trainee progression through curriculum cohorts.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_ENROLLMENT} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="enrolled" name="New Enrolments" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector-wise Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Sector & Domain Distribution</CardTitle>
            <CardDescription>Enrolments across cooperative sectors.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={SECTOR_DISTRIBUTION}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {SECTOR_DISTRIBUTION.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 text-xs pt-2 border-t border-border">
              {SECTOR_DISTRIBUTION.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Funnel: Training to Employment */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Training to Employment Funnel</CardTitle>
            <CardDescription>
              Conversion from cooperative nomination to full-time enterprise placement.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUNNEL_DATA} layout="vertical" margin={{ left: 80, right: 30, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="stage" type="category" fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card)" }}
                />
                <Bar dataKey="count" name="Trainees" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Sponsoring Societies */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Top Nominating Cooperative Societies</CardTitle>
          <CardDescription>Major partner societies driving trainee enrolment and placements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cooperative Society</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Trainees Sponsored</TableHead>
                  <TableHead>Completion %</TableHead>
                  <TableHead className="text-right">Absorbed / Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOP_SOCIETIES.map((soc) => (
                  <TableRow key={soc.name}>
                    <TableCell className="font-semibold text-foreground text-sm">
                      {soc.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{soc.district}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {soc.sector}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{soc.sponsored}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {soc.completionRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs text-foreground">
                      {soc.placed}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
