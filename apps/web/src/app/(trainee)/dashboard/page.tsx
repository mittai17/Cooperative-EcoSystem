import Link from "next/link";
import Image from "next/image";
import {
  Award,
  Briefcase,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  traineeEnrolledCourses,
  traineeRecommendedJobs,
} from "@/lib/mock-data/dashboards";
import { skillPassport } from "@/lib/mock-data/skills";
import { certificates } from "@/lib/mock-data/certificates";
import { courses } from "@/lib/mock-data/courses";
import { currentUser } from "@clerk/nextjs/server";

function greetingWord(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function courseThumb(courseKey: string) {
  return `https://picsum.photos/seed/coopsetu-${courseKey}/320/200`;
}

export default async function TraineeDashboardPage() {
  const user = await currentUser();
  const certList = Object.values(certificates).filter((c) => c.holderName === "Ravindra Suresh Patil");
  const avgProgress = Math.round(
    traineeEnrolledCourses.reduce((sum, c) => sum + c.progress, 0) / traineeEnrolledCourses.length
  );
  const avgConfidence = Math.round(
    skillPassport.reduce((sum, s) => sum + s.confidence, 0) / skillPassport.length
  );
  const strongMatches = traineeRecommendedJobs.filter((j) => j.matchScore >= 70).length;
  const enrolledTitles = new Set(traineeEnrolledCourses.map((c) => c.title));
  const recommendedCourses = courses.filter((c) => !enrolledTitles.has(c.title)).slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Good ${greetingWord(new Date().getHours())}, ${user?.firstName ?? "there"}! \u{1F44B}`}
        description="Continue learning and get closer to your goals."
        action={<span className="demo-data-tag">Demo learner data</span>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active courses"
          tint="red"
          value={String(traineeEnrolledCourses.length)}
          icon={BookOpen}
          trend="1 nearing completion"
          trendTone="up"
        />
        <StatCard
          label="Overall progress"
          tint="red"
          value={`${avgProgress}%`}
          icon={TrendingUp}
          trend="Across enrolled courses"
          trendTone="up"
        />
        <StatCard
          label="Certifications"
          tint="amber"
          value={String(certList.length)}
          icon={Award}
          trend="1 renewal due in 2029"
          trendTone="neutral"
        />
        <StatCard
          label="Job matches"
          tint="red"
          value={String(strongMatches)}
          icon={Briefcase}
          trend="70% match or higher"
          trendTone="up"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Continue Learning</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/my-learning">View All</Link>} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {traineeEnrolledCourses.map((course) => (
              <div key={course.id} className="flex items-center gap-4 rounded-xl border border-border/60 p-3">
                <div className="relative hidden size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
                  <Image src={courseThumb(course.id)} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">{course.progress}%</span>
                  </div>
                </div>
                <Button size="sm" className="shrink-0" render={<Link href="/my-learning">Continue</Link>} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Skill Passport</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/skill-passport">View Details</Link>} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DonutChart
              data={[
                { key: "complete", label: "Complete", value: avgConfidence, color: "var(--color-chart-1)" },
                { key: "remaining", label: "Remaining", value: 100 - avgConfidence, color: "var(--color-muted)" },
              ]}
              height={180}
              centerValue={`${avgConfidence}%`}
              centerLabel="Complete"
            />
            <div className="flex flex-col gap-3">
              {skillPassport.slice(0, 4).map((skill) => (
                <div key={skill.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 truncate text-foreground">
                    <span
                      className={
                        skill.verified
                          ? "size-2 shrink-0 rounded-full bg-success"
                          : "size-2 shrink-0 rounded-full bg-warning"
                      }
                    />
                    <span className="truncate">{skill.name}</span>
                  </span>
                  <span className="shrink-0 font-medium text-muted-foreground">{skill.confidence}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Recommended for You</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/courses">View All</Link>} />
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recommendedCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border/60 transition-colors hover:border-primary/40"
              >
                <div className="relative h-28 w-full overflow-hidden bg-muted">
                  <Image
                    src={`https://picsum.photos/seed/coopsetu-${course.id}/640/420`}
                    alt=""
                    fill
                    sizes="240px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.level} &middot; {course.durationHours}h
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Top Job Matches</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/jobs">View All</Link>} />
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {traineeRecommendedJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{job.employer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge className="bg-success/10 text-success" variant="secondary">
                    {job.matchScore}% match
                  </Badge>
                  <Button variant="outline" size="sm" render={<Link href="/jobs">View</Link>} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
