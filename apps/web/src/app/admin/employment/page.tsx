"use client";

import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminEmploymentFunnel, adminMonthlyOutcomes } from "@/lib/mock-data/dashboards";
import { StatCard } from "@/components/dashboard/stat-card";
import { Clock } from "lucide-react";

export default function EmploymentPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employment Outcomes"
        description="Track placement rates and employment metrics across all institutions."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Avg Time-to-Placement" value="45 Days" icon={Clock} trend="-5 days vs last year" trendTone="up" />
        <StatCard label="Total Employed" value="7,380" icon={Clock} trend="+12% this quarter" trendTone="up" />
        <StatCard label="Placement Rate" value="75.7%" icon={Clock} trend="+2.1% vs last cohort" trendTone="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Training to Employment Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminEmploymentFunnel} layout="vertical" margin={{ left: 100, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Monthly Employed vs Certified</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminMonthlyOutcomes} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                <Line type="monotone" dataKey="certified" stroke="var(--color-chart-3)" strokeWidth={2} />
                <Line type="monotone" dataKey="employed" stroke="var(--color-chart-1)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Top Hiring Employers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employer</TableHead>
                  <TableHead>Hires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Amul Dairy</TableCell>
                  <TableCell>340</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">IFFCO</TableCell>
                  <TableCell>210</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">NCDC</TableCell>
                  <TableCell>150</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">State-wise Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Placements</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Gujarat</TableCell>
                  <TableCell>1,240</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Maharashtra</TableCell>
                  <TableCell>980</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Uttar Pradesh</TableCell>
                  <TableCell>850</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
