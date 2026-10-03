"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTrainerQuery } from "@/lib/trainer/api";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";

interface CalEvent {
  id: string;
  type: "class" | "assessment" | "assignment";
  title: string;
  batch: string | null;
  date: string;
  start: string | null;
  end: string | null;
  room: string | null;
  link: string | null;
}

type View = "month" | "week" | "day";

const TYPE_META: Record<CalEvent["type"], { label: string; chip: string; dot: string }> = {
  class: { label: "Class", chip: "bg-[#E31B23]/10 text-[#B3141B] border-[#E31B23]/30", dot: "bg-[#E31B23]" },
  assessment: { label: "Assessment", chip: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  assignment: { label: "Assignment due", chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7)); // Monday
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function todayIST(): Date {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return parse(s);
}

function t12(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}
const timeRange = (e: CalEvent) => (e.end ? `${t12(e.start)} – ${t12(e.end)}` : t12(e.start));

export function CalendarView() {
  const today = useMemo(() => todayIST(), []);
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(today);
  const [selected, setSelected] = useState<CalEvent | null>(null);

  const range = useMemo(() => {
    if (view === "day") return { start: cursor, end: cursor };
    if (view === "week") {
      const s = startOfWeek(cursor);
      return { start: s, end: addDays(s, 6) };
    }
    const s = startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    return { start: s, end: addDays(s, 41) };
  }, [view, cursor]);

  const { data, loading, error, refetch } = useTrainerQuery<{ events: CalEvent[] }>(
    `/calendar?start=${ymd(range.start)}&end=${ymd(range.end)}`,
  );

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of data?.events ?? []) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [data]);

  const step = (dir: number) => {
    if (view === "day") setCursor(addDays(cursor, dir));
    else if (view === "week") setCursor(addDays(cursor, 7 * dir));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  };

  const title =
    view === "month"
      ? cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
      : view === "week"
        ? `${range.start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${range.end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : cursor.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const agendaDays = useMemo(() => {
    const days: Date[] = [];
    let s = range.start;
    let e = range.end;
    if (view === "month") {
      s = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      e = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    }
    for (let d = s; d <= e; d = addDays(d, 1)) days.push(d);
    return days.filter((d) => byDay.has(ymd(d)));
  }, [range, view, cursor, byDay]);

  const chip = (e: CalEvent) => (
    <button
      key={e.id}
      type="button"
      onClick={() => setSelected(e)}
      className={cn("w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight", TYPE_META[e.type].chip)}
      title={`${e.title} ${timeRange(e)}`}
    >
      {e.start && <span className="mr-1 opacity-70">{t12(e.start)}</span>}
      {e.title}
    </button>
  );

  const isToday = (d: Date) => ymd(d) === ymd(today);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => step(1)} aria-label="Next">
            <ChevronRight />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(today)}>
            Today
          </Button>
          <h2 className="ml-1 font-heading text-base font-semibold sm:text-lg">{title}</h2>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Calendar view">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium capitalize",
                view === v ? "bg-[#E31B23] text-white" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.values(TYPE_META).map((m) => (
          <span key={m.label} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", m.dot)} />
            {m.label}
          </span>
        ))}
      </div>

      {loading && !data ? (
        <LoadingBlock rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          {/* Mobile agenda */}
          <div className="space-y-3 md:hidden">
            {agendaDays.length === 0 ? (
              <EmptyState title="Nothing scheduled" hint="No classes, assessments or deadlines in this period." icon={CalendarDays} />
            ) : (
              agendaDays.map((d) => (
                <div key={ymd(d)} className="rounded-xl border border-border bg-card p-3">
                  <p className={cn("mb-2 text-sm font-semibold", isToday(d) && "text-[#E31B23]")}>
                    {d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    {isToday(d) && " · Today"}
                  </p>
                  <div className="space-y-1.5">
                    {byDay.get(ymd(d))!.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelected(e)}
                        className={cn("flex w-full flex-col rounded-lg border px-3 py-2 text-left", TYPE_META[e.type].chip)}
                      >
                        <span className="text-sm font-medium">{e.title}</span>
                        <span className="text-xs opacity-80">
                          {timeRange(e)}
                          {e.batch ? ` · ${e.batch}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop grids */}
          <div className="hidden md:block">
            {view === "month" && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                  {DOW.map((d) => (
                    <div key={d} className="px-2 py-2">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: 42 }).map((_, i) => {
                    const d = addDays(range.start, i);
                    const evs = byDay.get(ymd(d)) ?? [];
                    const inMonth = d.getMonth() === cursor.getMonth();
                    return (
                      <div
                        key={i}
                        className={cn("min-h-28 space-y-1 border-b border-r border-border/70 p-1.5", !inMonth && "bg-muted/30")}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setCursor(d);
                            setView("day");
                          }}
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs",
                            isToday(d) ? "bg-[#E31B23] font-semibold text-white" : inMonth ? "text-foreground hover:bg-muted" : "text-muted-foreground",
                          )}
                          aria-label={`Open ${ymd(d)}`}
                        >
                          {d.getDate()}
                        </button>
                        {evs.slice(0, 3).map(chip)}
                        {evs.length > 3 && (
                          <button
                            type="button"
                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setCursor(d);
                              setView("day");
                            }}
                          >
                            +{evs.length - 3} more
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "week" && (
              <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-border bg-card">
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = addDays(range.start, i);
                  const evs = byDay.get(ymd(d)) ?? [];
                  return (
                    <div key={i} className={cn("min-h-72 space-y-1.5 border-r border-border/70 p-2 last:border-r-0", isToday(d) && "bg-[#E31B23]/[0.03]")}>
                      <div className="mb-2 text-center">
                        <p className="text-xs text-muted-foreground">{DOW[i]}</p>
                        <p className={cn("mx-auto flex size-7 items-center justify-center rounded-full text-sm font-semibold", isToday(d) && "bg-[#E31B23] text-white")}>
                          {d.getDate()}
                        </p>
                      </div>
                      {evs.map(chip)}
                    </div>
                  );
                })}
              </div>
            )}

            {view === "day" && (
              <div className="rounded-2xl border border-border bg-card p-4">
                {(byDay.get(ymd(cursor)) ?? []).length === 0 ? (
                  <EmptyState title="Nothing scheduled" hint="No classes, assessments or deadlines on this day." icon={CalendarDays} />
                ) : (
                  <div className="space-y-2">
                    {byDay.get(ymd(cursor))!.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelected(e)}
                        className={cn("flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left", TYPE_META[e.type].chip)}
                      >
                        <span>
                          <span className="block text-sm font-semibold">{e.title}</span>
                          <span className="text-xs opacity-80">
                            {TYPE_META[e.type].label}
                            {e.batch ? ` · ${e.batch}` : ""}
                            {e.room ? ` · ${e.room}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-medium">{timeRange(e)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <span className={cn("w-fit rounded-full border px-2 py-0.5 text-xs font-medium", TYPE_META[selected.type].chip)}>
                  {TYPE_META[selected.type].label}
                </span>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {parse(selected.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </DialogDescription>
              </DialogHeader>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  {timeRange(selected) || "Time not set"} IST
                </div>
                {selected.batch && (
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    Batch {selected.batch}
                  </div>
                )}
                {selected.room && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    {selected.room}
                  </div>
                )}
              </dl>
              {selected.link && (
                <Button render={<Link href={selected.link} />} className="bg-[#E31B23] text-white hover:bg-[#c8171e]">
                  View Details
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
