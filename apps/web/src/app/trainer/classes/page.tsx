"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, BookOpen, ClipboardCheck, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, useApi } from "@/lib/use-api";

interface ClassRow {
  batch_id: string | null;
  programme_id: string;
  title: string;
  batch_name: string | null;
  sector: string | null;
  level: string | null;
  venue: string | null;
  capacity: number | null;
  enrolled: number;
  start_date: string | null;
  end_date: string | null;
}

export default function TrainerClassesPage() {
  const api = useApi();
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ classes: ClassRow[] }>("/api/v1/attendance/classes/mine");
        setClasses(data.classes);
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : "Could not reach the CoopSetu API");
        setClasses([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalTrainees = (classes ?? []).reduce((sum, c) => sum + c.enrolled, 0);
  const totalCapacity = (classes ?? []).reduce((sum, c) => sum + (c.capacity ?? c.enrolled), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My classes"
        description="Batches and programmes your organisation runs, with roster size and quick attendance actions."
        action={
          <Button
            variant="outline"
            render={
              <Link href="/trainer/attendance">
                <ClipboardCheck className="mr-1.5 size-4" />
                Open attendance
              </Link>
            }
          />
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load classes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classes" value={String(classes?.length ?? 0)} icon={BookOpen} trend="Batches and programme cohorts" trendTone="neutral" />
        <StatCard label="Trainees enrolled" value={String(totalTrainees)} icon={Users} trend={`Across ${classes?.length ?? 0} classes`} trendTone="neutral" />
        <StatCard
          label="Seats filled"
          value={totalCapacity > 0 ? `${Math.round((totalTrainees / totalCapacity) * 100)}%` : "—"}
          icon={ClipboardCheck}
          trend="Enrolled vs. capacity"
          trendTone="neutral"
        />
        <StatCard label="Organisation classes" value={String(classes?.length ?? 0)} icon={MapPin} trend="Visible to your role" trendTone="neutral" />
      </div>

      {classes === null ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No classes assigned yet</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Batches and programmes for your organisation will appear here once they are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => {
            const capacity = cls.capacity ?? cls.enrolled;
            const seatsLeft = capacity - cls.enrolled;
            const pct = capacity > 0 ? Math.round((cls.enrolled / capacity) * 100) : 0;
            return (
              <Card key={cls.batch_id ?? cls.programme_id} className="flex flex-col rounded-lg">
                <CardHeader>
                  <CardTitle className="font-heading text-base leading-snug">{cls.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {cls.batch_name ? `Batch ${cls.batch_name}` : "Programme-level roster"} &middot; {cls.level ?? cls.sector ?? "—"}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <dl className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Venue</dt>
                      <dd className="text-xs text-foreground">{cls.venue ?? "Not set"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Enrolled</dt>
                      <dd className="text-xs text-foreground">
                        <span className="font-mono font-medium">{cls.enrolled}/{capacity}</span>{" "}
                        {seatsLeft > 0 ? (
                          <span className="text-muted-foreground">&middot; {seatsLeft} seats left</span>
                        ) : (
                          <span className="text-muted-foreground">&middot; full</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Runs</dt>
                      <dd className="text-xs text-foreground">
                        {cls.start_date ? new Date(cls.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        {cls.end_date ? ` – ${new Date(cls.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seats filled</span>
                      <span className="font-mono font-medium text-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 border-t border-border">
                  <Button
                    size="sm"
                    render={
                      <Link href={`/trainer/attendance?batch=${cls.batch_id ?? ""}&programme=${cls.programme_id}`}>
                        <ClipboardCheck className="mr-1.5 size-3.5" />
                        Mark attendance
                      </Link>
                    }
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Class rosters and enrolment counts come from your organisation&apos;s programmes and batches.
        Weekly timetable scheduling is managed separately in the institution timetable module.
      </p>
    </div>
  );
}
