"use client";

import { useState } from "react";
import { TrendBarChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RANGE_OPTIONS = [
  { value: "3", label: "Last 3 months" },
  { value: "6", label: "Last 6 months" },
] as const;

type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

interface MonthlyOutcome {
  month: string;
  employed: number;
  certified: number;
  [key: string]: string | number;
}

export function MonthlyOutcomesCard({ data }: { data: MonthlyOutcome[] }) {
  const [range, setRange] = useState<RangeValue>("6");
  const visible = data.slice(-Number(range));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-base">Monthly outcomes</CardTitle>
        <Select value={range} onValueChange={(value) => setRange(String(value) as RangeValue)}>
          <SelectTrigger size="sm" className="h-8 w-36" aria-label="Select time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <TrendBarChart
          data={visible}
          xKey="month"
          series={[
            { key: "certified", color: "var(--color-chart-1)", label: "Certified" },
            { key: "employed", color: "var(--color-chart-2)", label: "Employed" },
          ]}
        />
      </CardContent>
    </Card>
  );
}
