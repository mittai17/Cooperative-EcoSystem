"use client";

import { useState } from "react";
import { CalendarCheck, CalendarClock, Play, Radio, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { HistoryTab } from "@/components/trainer/attendance/history";
import { StartPanel, StartSlotDialog } from "@/components/trainer/attendance/start-panel";
import { fmtDate, type SlotItem, type SlotsResponse } from "@/components/trainer/attendance/types";
import { useTrainerQuery } from "@/lib/trainer/api";

function SlotCard({ s, onStart, upcoming }: { s: SlotItem; onStart: (s: SlotItem) => void; upcoming?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{s.course}</p>
          {s.status === "live" && <Badge className="gap-1 bg-success/10 text-success"><Radio className="size-3 animate-pulse" />Live</Badge>}
          {s.status === "completed" && <Badge variant="secondary">Completed</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {upcoming && `${fmtDate(s.date)} · `}
          {s.batch} · {s.start_label}–{s.end_label}
          {s.room ? ` · ${s.room}` : ""} · {s.roster} trainees
          {s.present != null ? ` · ${s.present} present` : ""}
        </p>
      </div>
      {upcoming ? (
        <span className="text-xs text-muted-foreground">Opens on the day</span>
      ) : s.session_id ? (
        <Link href={`/trainer/attendance/session/${s.session_id}`} className={buttonVariants({ variant: s.status === "live" ? "default" : "outline" })}>
          {s.status === "live" ? "Open live session" : "View attendance"}
        </Link>
      ) : (
        <Button onClick={() => onStart(s)}>
          <Play className="size-4" /> Start attendance
        </Button>
      )}
    </div>
  );
}

function SlotList({ tab, onStart }: { tab: "today" | "upcoming"; onStart: (s: SlotItem) => void }) {
  const q = useTrainerQuery<SlotsResponse>(`/attendance?tab=${tab}`);
  if (q.loading && !q.data) return <LoadingBlock rows={3} />;
  if (q.error && !q.data) return <ErrorState message={q.error} onRetry={q.refetch} />;
  const items = q.data?.items ?? [];
  if (items.length === 0)
    return <EmptyState icon={CalendarClock} title={tab === "today" ? "No sessions scheduled today" : "Nothing in the next 7 days"} hint="Use Start attendance above for an unscheduled class." />;
  return (
    <div className="space-y-3">
      {items.map((s) => (
        <SlotCard key={`${s.slot_id}-${s.date}`} s={s} onStart={onStart} upcoming={tab === "upcoming"} />
      ))}
    </div>
  );
}

export default function TrainerAttendancePage() {
  const [tab, setTab] = useState("today");
  const [starting, setStarting] = useState<SlotItem | null>(null);
  const today = useTrainerQuery<SlotsResponse>("/attendance?tab=today");

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Run QR or manual attendance for your classes, and review past sessions." />
      {today.loading && !today.data && <LoadingBlock rows={2} />}
      {today.error && !today.data && <ErrorState message={today.error} onRetry={today.refetch} />}
      {today.data &&
        (today.data.classes.length === 0 ? (
          <EmptyState icon={Users} title="No classes assigned" hint="Attendance can start once you are assigned a batch and course." />
        ) : (
          <StartPanel options={today.data} slots={today.data.items} />
        ))}
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList>
          <TabsTrigger value="today"><CalendarCheck className="size-4" /> Today&apos;s Sessions</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4"><SlotList tab="today" onStart={setStarting} /></TabsContent>
        <TabsContent value="upcoming" className="mt-4"><SlotList tab="upcoming" onStart={setStarting} /></TabsContent>
        <TabsContent value="history" className="mt-4"><HistoryTab /></TabsContent>
      </Tabs>
      <StartSlotDialog slot={starting} onClose={() => setStarting(null)} />
    </div>
  );
}
