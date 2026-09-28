"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockEnrollment = [
  { month: "Jan", count: 120 },
  { month: "Feb", count: 150 },
  { month: "Mar", count: 180 },
  { month: "Apr", count: 210 },
  { month: "May", count: 240 },
];

const mockSkills = [
  { name: "Management", value: 400 },
  { name: "Bookkeeping", value: 300 },
  { name: "Dairy", value: 300 },
  { name: "Tech", value: 200 },
];

const mockFunnel = [
  { stage: "Enrolled", count: 1000 },
  { stage: "Completed", count: 850 },
  { stage: "Certified", count: 800 },
  { stage: "Employed", count: 650 },
];

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)'];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Key metrics and insights on institution performance."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Monthly Enrollment</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockEnrollment}>
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Skill Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockSkills}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockSkills.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Training to Employment Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockFunnel} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
