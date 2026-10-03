"use client";

import { useState } from "react";
import { History, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { useTrainerQuery } from "@/lib/trainer/api";
import { SessionTable } from "./session-table";
import { fmtDate, type HistoryResponse, type SessionState } from "./types";

const ALL = "all";

function Details({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = useTrainerQuery<SessionState>(id ? `/attendance/session/${id}/details` : null);
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{q.data?.course ?? "Session details"}</SheetTitle>
          <SheetDescription>
            {q.data ? `${q.data.batch} · ${q.data.present}/${q.data.roster_size} present (${q.data.percentage ?? 0}%)` : "Loading…"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {q.loading && <LoadingBlock rows={6} />}
          {q.error && <ErrorState message={q.error} onRetry={q.refetch} />}
          {q.data && <SessionTable rows={q.data.roster} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function HistoryTab() {
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState(ALL);
  const [course, setCourse] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const p = new URLSearchParams({ tab: "history" });
  if (batch !== ALL) p.set("batch_id", batch);
  if (course !== ALL) p.set("course_id", course);
  if (search.trim()) p.set("q", search.trim());
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const q = useTrainerQuery<HistoryResponse>(`/attendance?${p}`);
  const d = q.data;
  const reset = () => { setSearch(""); setBatch(ALL); setCourse(ALL); setFrom(""); setTo(""); };
  const bName = (v: string) => (v === ALL ? "All batches" : d?.batches.find((b) => b.id === v)?.name ?? "Batch");
  const cName = (v: string) => (v === ALL ? "All courses" : d?.courses.find((c) => c.id === v)?.title ?? "Course");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input aria-label="Search sessions" placeholder="Search course, batch, date" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={batch} onValueChange={(v) => setBatch(String(v))}>
          <SelectTrigger className="w-full"><SelectValue>{bName(batch)}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All batches</SelectItem>
            {d?.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={course} onValueChange={(v) => setCourse(String(v))}>
          <SelectTrigger className="w-full"><SelectValue>{cName(course)}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All courses</SelectItem>
            {d?.courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
          <Label className="sr-only" htmlFor="att-from">From</Label>
          <Input id="att-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-xs text-muted-foreground">to</span>
          <Label className="sr-only" htmlFor="att-to">To</Label>
          <Input id="att-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
        </div>
      </div>

      {q.loading && !d && <LoadingBlock rows={6} />}
      {q.error && !d && <ErrorState message={q.error} onRetry={q.refetch} />}
      {d && d.items.length === 0 && <EmptyState icon={History} title="No sessions match" hint="Adjust the filters or run an attendance session first." />}
      {d && d.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Date</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="pr-4 text-right">Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.items.map((s) => (
                <TableRow key={s.session_id} className="cursor-pointer" onClick={() => setOpen(s.session_id)}>
                  <TableCell className="pl-4">
                    <button className="text-left font-medium hover:underline" onClick={() => setOpen(s.session_id)}>{fmtDate(s.date)}</button>
                    <span className="block text-xs text-muted-foreground">{s.time}</span>
                  </TableCell>
                  <TableCell>{s.course}</TableCell>
                  <TableCell>{s.batch}</TableCell>
                  <TableCell className="text-right">{s.present}</TableCell>
                  <TableCell className="text-right">{s.absent}</TableCell>
                  <TableCell className="text-right">{s.late}</TableCell>
                  <TableCell className="pr-4 text-right font-semibold">{s.percentage ?? "—"}{s.percentage != null && "%"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Details id={open} onClose={() => setOpen(null)} />
    </div>
  );
}
