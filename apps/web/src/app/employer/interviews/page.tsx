"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterviewCard } from "@/components/employer/interviews/interview-card";
import { listInterviews, type Interview, type InterviewMode } from "@/lib/employer/workflow-api";
import { errorMessage, isSameLocalDay } from "@/lib/employer/workflow-format";
import { useApi } from "@/lib/use-api";

type InterviewTab = "upcoming" | "today" | "completed" | "cancelled";
type ModeFilter = "all" | InterviewMode;

const TABS: { key: InterviewTab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "today", label: "Today" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const EMPTY_MESSAGE: Record<InterviewTab, string> = {
  upcoming: "No upcoming interviews.",
  today: "No interviews scheduled for today.",
  completed: "No completed interviews yet.",
  cancelled: "No cancelled interviews.",
};

const MODE_ITEMS = [
  { label: "All types", value: "all" },
  { label: "Online", value: "online" },
  { label: "On-site", value: "onsite" },
];

function matchesTab(interview: Interview, tab: InterviewTab, now: Date): boolean {
  const isScheduled = interview.status === "scheduled";
  switch (tab) {
    case "upcoming":
      // Upcoming covers every scheduled interview from today onwards, so today's
      // interviews also appear under Upcoming; the Today tab narrows to them.
      return isScheduled && new Date(interview.scheduled_at).getTime() >= startOfDay(now);
    case "today":
      return isScheduled && isSameLocalDay(interview.scheduled_at, now);
    case "completed":
      return interview.status === "completed";
    case "cancelled":
      return interview.status === "cancelled";
  }
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export default function InterviewsPage() {
  const api = useApi();
  const [interviews, setInterviews] = useState<Interview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<InterviewTab>("upcoming");
  const [mode, setMode] = useState<ModeFilter>("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listInterviews(api);
      setInterviews(data.interviews);
    } catch (err) {
      setError(errorMessage(err, "Could not load interviews. Check your connection and try again."));
      setInterviews(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const visible = useMemo(() => {
    if (!interviews) return [];
    const now = new Date();
    return interviews
      .filter((i) => matchesTab(i, tab, now))
      .filter((i) => mode === "all" || i.mode === mode)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [interviews, tab, mode]);

  const counts = useMemo(() => {
    const now = new Date();
    const list = interviews ?? [];
    return Object.fromEntries(TABS.map((t) => [t.key, list.filter((i) => matchesTab(i, t.key, now)).length])) as Record<InterviewTab, number>;
  }, [interviews]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Interviews"
        description="Upcoming, today's, completed and cancelled interviews with shortlisted candidates."
        action={
          <Button render={<Link href="/employer/applications" />}>
            <Plus />
            Schedule from applications
          </Button>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as InterviewTab)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
                {interviews && <span className="ml-1.5 text-xs text-muted-foreground">{counts[t.key]}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="w-full lg:w-48">
          <Select items={MODE_ITEMS} value={mode} onValueChange={(v) => v && setMode(v as ModeFilter)}>
            <SelectTrigger className="w-full" aria-label="Interview type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Could not load interviews</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && interviews === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!error && interviews !== null && visible.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CalendarClock className="size-8 text-muted-foreground" />
            <p className="font-medium text-foreground">{EMPTY_MESSAGE[tab]}</p>
            {tab === "upcoming" && (
              <p className="max-w-md text-sm text-muted-foreground">
                Open a shortlisted candidate in Applications and choose Schedule Interview to book one.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!error && interviews !== null && visible.length > 0 && (
        <div className="space-y-3">
          {visible.map((interview) => (
            <InterviewCard key={interview.id} api={api} interview={interview} onChanged={() => void load()} />
          ))}
        </div>
      )}
    </div>
  );
}
