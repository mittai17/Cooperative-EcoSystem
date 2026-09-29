import Link from "next/link";
import { AlertCircle, CalendarCheck, ClipboardCheck, Target, Users2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth } from "@/lib/api";
import { currentUser } from "@clerk/nextjs/server";

interface ClassRow {
  batch_id: string | null;
  programme_id: string;
  title: string;
  batch_name: string | null;
  venue: string | null;
  capacity: number | null;
  enrolled: number;
}

interface SessionRow {
  session_id: string;
  session_name: string | null;
  programme_title: string;
  present: number;
  marked_total: number;
  is_open: boolean;
  opens_at: string;
}

interface ResultsRollup {
  average_score: number | null;
  total_submissions: number;
  recent: { trainee_name: string; assessment_title: string; score: number; passed: boolean; submitted_at: string | null }[];
}

export default async function TrainerDashboardPage() {
  const user = await currentUser();

  let classes: ClassRow[] = [];
  let sessions: SessionRow[] = [];
  let results: ResultsRollup | null = null;
  let loadError: string | null = null;

  try {
    [classes, sessions, results] = await Promise.all([
      fetchWithAuth("/api/v1/attendance/classes/mine").then((d) => d.classes) as Promise<ClassRow[]>,
      fetchWithAuth("/api/v1/attendance/sessions/mine?limit=6").then((d) => d.sessions) as Promise<SessionRow[]>,
      fetchWithAuth("/api/v1/assessments/results/mine?limit=6") as Promise<ResultsRollup>,
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not reach the CoopSetu API";
  }

  const totalTrainees = classes.reduce((sum, c) => sum + c.enrolled, 0);
  const openSessions = sessions.filter((s) => s.is_open).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user?.firstName ? `Welcome, ${user.firstName}` : "Your teaching workspace"}
        description="Classes, attendance sessions, and assessment activity across your organisation's programmes."
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load live trainer data</AlertTitle>
          <AlertDescription>{loadError}. Showing an empty workspace until the API is reachable.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My classes" tint="red" value={String(classes.length)} icon={Users2} trend={`${totalTrainees} trainees enrolled`} trendTone="neutral" />
        <StatCard label="Open attendance sessions" tint="green" value={String(openSessions)} icon={ClipboardCheck} trend={`${sessions.length} sessions recently held`} trendTone="neutral" />
        <StatCard
          label="Average assessment score"
          tint="amber"
          value={results?.average_score !== null && results?.average_score !== undefined ? `${results.average_score}%` : "—"}
          icon={Target}
          trend={`${results?.total_submissions ?? 0} submissions graded`}
          trendTone="up"
        />
        <StatCard label="Sessions held" tint="red" value={String(sessions.length)} icon={CalendarCheck} trend="Most recent 6" trendTone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card id="classes">
          <CardHeader>
            <CardTitle className="font-heading text-base">My classes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {classes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No batches or programmes are assigned to your organisation yet.
              </p>
            ) : (
              classes.slice(0, 6).map((cls) => (
                <div key={cls.batch_id ?? cls.programme_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {cls.title}
                      {cls.batch_name ? ` — ${cls.batch_name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cls.enrolled}/{cls.capacity ?? "—"} enrolled &middot; {cls.venue ?? "Venue TBD"}
                    </p>
                  </div>
                  <Badge className="bg-tint-blue-bg text-primary" variant="secondary">
                    {cls.enrolled} enrolled
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Recent assessment activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {(results?.recent.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No submissions graded yet.</p>
            ) : (
              results!.recent.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.trainee_name}</p>
                    <p className="text-xs text-muted-foreground">{item.assessment_title}</p>
                  </div>
                  <Badge className={item.passed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"} variant="secondary">
                    {item.score}%
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="attendance">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <ClipboardCheck className="size-4 text-primary" />
            Recent attendance sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No attendance sessions yet — generate one from the attendance page.
            </p>
          ) : (
            sessions.map((session) => (
              <div key={session.session_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{session.session_name ?? session.programme_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.opens_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" "}&middot; {session.present}/{session.marked_total} present
                  </p>
                </div>
                {session.is_open ? (
                  <Badge className="bg-destructive/10 text-destructive" variant="secondary">
                    <span className="size-1.5 rounded-full bg-destructive" /> Live
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground" variant="secondary">Closed</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button variant="outline" size="sm" className="w-fit" render={<Link href="/trainer/attendance">Generate attendance QR</Link>} />
    </div>
  );
}
