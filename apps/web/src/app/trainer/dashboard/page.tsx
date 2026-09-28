import Link from "next/link";
import { AlertTriangle, ClipboardCheck, FileCheck2, Users2, Video } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_RISK_THRESHOLD,
  assessments,
  gradingQueue,
  trainerClasses,
  trainees,
  type SessionStatus,
} from "@/lib/mock-data/trainer";
import { AttendanceQueue } from "./attendance-queue";
import { currentUser } from "@clerk/nextjs/server";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ClassStatusBadge({ status }: { status: SessionStatus }) {
  if (status === "In session") {
    return (
      <Badge className="bg-destructive/10 text-destructive" variant="secondary">
        <span className="size-1.5 rounded-full bg-destructive" /> Live Now
      </Badge>
    );
  }
  if (status === "Completed") {
    return (
      <Badge className="bg-muted text-muted-foreground" variant="secondary">
        Completed
      </Badge>
    );
  }
  return (
    <Badge className="bg-accent text-accent-foreground" variant="secondary">
      Upcoming
    </Badge>
  );
}

function formatSubmitted(timestamp: string) {
  const [datePart, timePart] = timestamp.split(" ");
  const date = new Date(`${datePart}T${timePart}:00`);
  return `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, ${timePart}`;
}

export default async function TrainerDashboardPage() {
  const user = await currentUser();
  const totalTrainees = trainerClasses.reduce((sum, c) => sum + c.enrolled, 0);
  const activeClasses = trainerClasses.filter((c) => c.todayStatus !== "Completed");
  const pendingGrading = gradingQueue.filter((item) => item.score === null).length;
  const atRiskTrainees = trainees.filter(
    (t) => t.atRiskReason !== null || t.attendancePct < ATTENDANCE_RISK_THRESHOLD
  ).length;

  const recentActivity = [...gradingQueue]
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .slice(0, 6)
    .map((item) => ({
      ...item,
      assessmentTitle: assessments.find((a) => a.id === item.assessmentId)?.title ?? "Assessment",
    }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user?.firstName ? `Welcome, ${user.firstName}` : "Your teaching workspace"}
        description="Classes, attendance, and grading across your assigned cooperative-sector programmes."
        action={<span className="demo-data-tag">Demo trainer data</span>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's classes" tint="red" value={String(activeClasses.length)} icon={Video} trend={`${trainerClasses.length} total classes`} trendTone="neutral" />
        <StatCard label="Trainees taught" tint="green" value={String(totalTrainees)} icon={Users2} trend="This term" trendTone="neutral" />
        <StatCard label="Submissions to grade" tint="amber" value={String(pendingGrading)} icon={FileCheck2} trend="Across all classes" trendTone="down" />
        <StatCard label="Trainees at risk" tint="red" value={String(atRiskTrainees)} icon={AlertTriangle} trend="Below attendance threshold" trendTone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card id="classes">
          <CardHeader>
            <CardTitle className="font-heading text-base">Today&apos;s Classes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {trainerClasses.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{cls.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {cls.startTime}&ndash;{cls.endTime} &middot; {cls.enrolled} trainees
                  </p>
                </div>
                <ClassStatusBadge status={cls.todayStatus} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Trainee Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {trainees.slice(0, 6).map((trainee) => {
              const atRisk = trainee.atRiskReason !== null || trainee.attendancePct < ATTENDANCE_RISK_THRESHOLD;
              return (
                <div key={trainee.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-tint-violet-bg text-tint-violet-fg">
                        {initials(trainee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{trainee.name}</p>
                      <p className="text-xs text-muted-foreground">{trainee.avgScorePct}% avg score</p>
                    </div>
                  </div>
                  <Badge
                    className={cn(atRisk ? "bg-warning/10 text-warning" : "bg-success/10 text-success")}
                    variant="secondary"
                  >
                    {atRisk ? "At Risk" : "On Track"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card id="attendance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <ClipboardCheck className="size-4 text-primary" />
              Attendance to mark
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceQueue />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Recent Trainee Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-foreground">
                    <span className="font-medium">{item.traineeName}</span> submitted{" "}
                    <span className="text-muted-foreground">{item.assessmentTitle}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatSubmitted(item.submittedAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" size="sm" className="w-fit" render={<Link href="/trainer/assessments">Go to grading queue</Link>} />
    </div>
  );
}
