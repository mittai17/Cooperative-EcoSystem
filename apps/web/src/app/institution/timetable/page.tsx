import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleAlert } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timeslots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface TimetableSlot {
  id: string;
  day: string;
  time: string;
  title: string;
  room: string | null;
  trainer: string | null;
}

async function loadSlots(): Promise<{ slots: TimetableSlot[]; error: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/timetable/`, { cache: "no-store" });
    if (!res.ok) return { slots: [], error: true };
    const data = (await res.json()) as TimetableSlot[];
    return { slots: data, error: false };
  } catch {
    return { slots: [], error: true };
  }
}

export default async function TimetablePage() {
  const { slots, error } = await loadSlots();
  const schedule = new Map(slots.map((slot) => [`${slot.day}-${slot.time}`, slot]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Weekly Timetable"
        description="View the current week's schedule across all classrooms."
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-foreground">Could not load the timetable</p>
            <p className="mt-1 text-sm text-foreground/70">
              Schedule data did not resolve. Every slot below shows as free until this is
              retried.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Current Week</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 gap-4 border-b pb-4">
              <div className="font-medium text-muted-foreground">Time</div>
              {days.map(day => <div key={day} className="font-medium text-foreground">{day}</div>)}
            </div>

            {timeslots.map(time => (
              <div key={time} className="grid grid-cols-7 gap-4 border-b py-4 last:border-0">
                <div className="text-sm font-medium text-muted-foreground">{time}</div>
                {days.map(day => {
                  const session = schedule.get(`${day}-${time}`);
                  return (
                    <div key={`${day}-${time}`} className="min-h-[80px]">
                      {session ? (
                        <div className="rounded-md border bg-secondary/20 p-2 text-sm">
                          <div className="font-medium text-foreground">{session.title}</div>
                          <div className="text-xs text-muted-foreground">{session.room} • {session.trainer}</div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-md border border-dashed bg-muted/10">
                          <span className="text-xs text-muted-foreground">Free</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
