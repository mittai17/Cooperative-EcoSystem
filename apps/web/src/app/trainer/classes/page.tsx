import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  MapPin,
  Users,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TRAINER_TODAY_LABEL,
  type SessionStatus,
  trainerClasses,
  weeklySchedule,
  weekDays,
} from "@/lib/mock-data/trainer";

const TODAY_DAY = "Mon";

function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === "In session") {
    return (
      <Badge variant="secondary" className="bg-success/10 text-success">
        <span className="size-1.5 rounded-full bg-success" />
        In session
      </Badge>
    );
  }
  if (status === "Completed") {
    return (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">
        Completed
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-tint-blue-bg text-primary">
      Upcoming
    </Badge>
  );
}

export default function TrainerClassesPage() {
  const activeClasses = trainerClasses.filter((cls) => cls.todayStatus !== "Completed");
  const totalTrainees = trainerClasses.reduce((sum, cls) => sum + cls.enrolled, 0);
  const averageSyllabus = Math.round(
    trainerClasses.reduce((sum, cls) => sum + cls.syllabusCovered, 0) / trainerClasses.length,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My classes"
        description={`Cohorts you teach this term, with schedule, roster size and syllabus progress. Today is ${TRAINER_TODAY_LABEL}.`}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active classes"
          value={String(activeClasses.length)}
          icon={Video}
          trend={`${trainerClasses.length - activeClasses.length} cohort completed`}
          trendTone="neutral"
        />
        <StatCard
          label="Trainees this term"
          value={String(totalTrainees)}
          icon={Users}
          trend="Across 3 programmes"
          trendTone="neutral"
        />
        <StatCard
          label="Syllabus covered"
          value={`${averageSyllabus}%`}
          icon={BookOpen}
          trend="Mean of all cohorts"
          trendTone="up"
        />
        <StatCard
          label="Sessions this week"
          value={String(weeklySchedule.length)}
          icon={CalendarDays}
          trend="Monday to Saturday"
          trendTone="neutral"
        />
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <CalendarClock className="size-4 text-primary" />
            Weekly schedule
          </CardTitle>
          <span className="demo-data-tag">Sample timetable data</span>
        </CardHeader>
        <CardContent className="grid gap-px p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {weekDays.map((day) => {
            const sessions = weeklySchedule.filter((session) => session.day === day);
            const isToday = day === TODAY_DAY;
            return (
              <div key={day} className={cn("bg-card p-4", isToday && "bg-accent/50")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-heading text-sm font-semibold text-foreground">{day}</p>
                  {isToday && <span className="demo-data-tag">Today</span>}
                </div>
                <div className="mt-2 flex flex-col gap-3">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No session scheduled</p>
                  ) : (
                    sessions.map((session) => (
                      <div key={session.id} className="border-l-2 border-primary pl-2.5">
                        <p className="font-mono text-xs text-muted-foreground">
                          {session.startTime}-{session.endTime}
                        </p>
                        <p className="mt-0.5 text-sm font-medium leading-snug text-foreground">
                          {session.className}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {session.room} &middot; {session.batch}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {trainerClasses.map((cls) => {
          const seatsLeft = cls.capacity - cls.enrolled;
          return (
            <Card key={cls.id} className="flex flex-col rounded-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="font-heading text-base leading-snug">{cls.title}</CardTitle>
                  <StatusBadge status={cls.todayStatus} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {cls.programme} &middot; Batch {cls.batch} &middot; {cls.level}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Schedule</dt>
                    <dd className="font-mono text-xs text-foreground">
                      {cls.scheduleDays.join(", ")} &middot; {cls.startTime}-{cls.endTime}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Room</dt>
                    <dd className="text-xs text-foreground">{cls.room}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Enrolled</dt>
                    <dd className="text-xs text-foreground">
                      <span className="font-mono font-medium">
                        {cls.enrolled}/{cls.capacity}
                      </span>{" "}
                      {seatsLeft > 0 ? (
                        <span className="text-muted-foreground">&middot; {seatsLeft} seats left</span>
                      ) : (
                        <span className="text-muted-foreground">&middot; batch full</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Next session</dt>
                    <dd className="text-xs text-foreground">{cls.nextSession}</dd>
                  </div>
                </dl>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Syllabus covered</span>
                    <span className="font-mono font-medium text-foreground">{cls.syllabusCovered}%</span>
                  </div>
                  <Progress value={cls.syllabusCovered} />
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-t border-border">
                <Button
                  size="sm"
                  render={
                    <Link href="/trainer/attendance">
                      <ClipboardCheck className="mr-1.5 size-3.5" />
                      Mark attendance
                    </Link>
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link href="/trainer/assessments">
                      <FileCheck2 className="mr-1.5 size-3.5" />
                      Create assessment
                    </Link>
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link href="/trainer/trainees">
                      <Users className="mr-1.5 size-3.5" />
                      View roster
                    </Link>
                  }
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Cohort sizes, rooms and syllabus progress on this page are illustrative sample data for the
        CoopSetu AI build. The live view reads them from the training-management API.
      </p>
    </div>
  );
}
