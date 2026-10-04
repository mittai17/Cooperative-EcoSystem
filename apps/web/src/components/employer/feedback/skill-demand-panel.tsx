"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSkillDemandAggregate, type Api, type SkillDemandAggregate } from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

/** Aggregate-only panel: skill mention counts across all employers' feedback, never per-employer data. */
export function SkillDemandPanel({ api }: { api: Api }) {
  const [data, setData] = useState<SkillDemandAggregate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getSkillDemandAggregate(api));
    } catch (err) {
      setError(errorMessage(err, "Skill demand is unavailable right now."));
      setData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-base">Skill demand</CardTitle>
        <CardDescription>Most requested skills across post-hire feedback on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              {error}
              <Button size="sm" variant="outline" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {!error && data === null && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}
        {!error && data !== null && data.skills.length === 0 && (
          <p className="text-sm text-muted-foreground">No skill demand data yet. It fills in as feedback is submitted.</p>
        )}
        {!error && data !== null && data.skills.length > 0 && (
          <HorizontalBarList
            items={data.skills.map((s) => ({ label: s.skill, value: s.mentions }))}
            valueFormatter={(v) => `${v} mention${v === 1 ? "" : "s"}`}
          />
        )}
      </CardContent>
    </Card>
  );
}
