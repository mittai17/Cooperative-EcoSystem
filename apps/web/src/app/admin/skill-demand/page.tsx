"use client";

import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminSkillDemand } from "@/lib/mock-data/dashboards";

export default function SkillDemandPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Skill Demand Intelligence"
        description="Monitor employer skill requirements versus current training supply."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Top Demanded Skills vs Supply</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminSkillDemand} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{fill: 'var(--muted)'}} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                <Bar dataKey="demand" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} name="Demand Index" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Emerging Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Growth (MoM)</TableHead>
                  <TableHead>Action Recommended</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-foreground">Digital Payments</TableCell>
                  <TableCell className="text-emerald-600">+45%</TableCell>
                  <TableCell><Badge>Increase Capacity</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-foreground">Drone Operations</TableCell>
                  <TableCell className="text-emerald-600">+82%</TableCell>
                  <TableCell><Badge>Launch New Program</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-foreground">Supply Chain Analytics</TableCell>
                  <TableCell className="text-emerald-600">+30%</TableCell>
                  <TableCell><Badge>Update Curriculum</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Institution-wise Skill Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Top Skills Taught</TableHead>
                <TableHead>Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Institute of Rural Management, Anand</TableCell>
                <TableCell>Gujarat</TableCell>
                <TableCell>Dairy Ops, Management</TableCell>
                <TableCell>High</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">VAMNICOM</TableCell>
                <TableCell>Maharashtra</TableCell>
                <TableCell>Credit Appraisal, Banking</TableCell>
                <TableCell>Medium</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
