"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AnalyticsDashboard } from "@/components/employer/analytics/analytics-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalytics, type AnalyticsResponse } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

const RANGE_ITEMS = [
  { label: "Last 3 months", value: "3" },
  { label: "Last 6 months", value: "6" },
  { label: "Last 12 months", value: "12" },
];

export default function EmployerAnalyticsPage() {
  const api = useApi();
  const [months, setMonths] = useState("6");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (range: string) => {
    setError(null);
    setData(null);
    try {
      setData(await getAnalytics(api, Number(range)));
    } catch (err) {
      setError(errorMessage(err, "Analytics could not be loaded. Check your connection and try again."));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(months), 0);
    return () => window.clearTimeout(id);
  }, [months, load]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employer Analytics"
        description="Recruitment performance across your jobs: funnel, timing, skills and sources."
        action={
          <div className="w-48">
            <Select items={RANGE_ITEMS} value={months} onValueChange={(v) => v && setMonths(String(v))}>
              <SelectTrigger className="w-full" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Could not load analytics</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load(months)}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && data === null && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading analytics
          </p>
        </div>
      )}

      {!error && data !== null && <AnalyticsDashboard data={data} />}
    </div>
  );
}
