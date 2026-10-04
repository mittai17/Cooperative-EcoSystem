"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EnrollmentTrendPoint } from "@/lib/admin/admin-api";
import { DashboardPanel, EmptyState } from "./panel";

export function EnrollmentTrendCard({ points }: { points: EnrollmentTrendPoint[] }) {
  return (
    <DashboardPanel
      icon={TrendingUp}
      title="Trainee Enrollment Trend"
      action={points.length > 0 ? <span className="text-xs font-medium text-muted-foreground">Last {points.length} months</span> : null}
      className="h-full"
    >
      {points.length === 0 ? (
        <EmptyState message="No enrollment data yet." />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-primary" aria-hidden />
              New Enrollments
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-[#FECDD3]" aria-hidden />
              Certifications
            </span>
          </div>
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={3}>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#94A3B8" />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.04)" }} formatter={(value) => Number(value).toLocaleString("en-IN")} />
                <Bar dataKey="new_enrollments" name="New Enrollments" fill="#E31B23" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="certifications" name="Certifications" fill="#FECDD3" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </DashboardPanel>
  );
}
