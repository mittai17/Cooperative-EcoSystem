import Link from "next/link";
import {
  AlertCircle,
  Award,
  Briefcase,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/dashboard/charts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth } from "@/lib/api";
import { currentUser } from "@clerk/nextjs/server";

function greetingWord(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

interface EnrolledCourse {
  id: string;
  title: string;
  progress: number;
  last_accessed: string | null;
}

interface SkillEntry {
  name: string;
  level: string;
  confidence: number;
  verified: boolean;
  category: string;
}

interface SkillPassport {
  skills: SkillEntry[];
  summary: { total_skills: number; verified_count: number; avg_confidence: number };
}

interface Certificate {
  id: string;
  programme_title: string;
  status: string;
}

interface JobApplication {
  id: string;
  job_title: string | null;
  employer: string | null;
  applied_at: string | null;
  status: string;
}

export default async function TraineeDashboardPage() {
  const user = await currentUser();

  let courses: EnrolledCourse[] = [];
  let passport: SkillPassport | null = null;
  let certificates: Certificate[] = [];
  let applications: JobApplication[] = [];
  let loadError: string | null = null;

  try {
    const [coursesData, passportData, certsData, applicationsData] = await Promise.all([
      fetchWithAuth("/api/v1/courses/my/enrolled"),
      fetchWithAuth("/api/v1/skills/my-passport"),
      fetchWithAuth("/api/v1/certificates/my"),
      fetchWithAuth("/api/v1/jobs/my-applications"),
    ]);
    courses = coursesData.courses;
    passport = passportData;
    certificates = certsData.certificates;
    applications = applicationsData.applications;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not reach the CoopSetu API";
  }

  const avgProgress = courses.length
    ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
    : 0;
  const avgConfidence = passport?.summary.avg_confidence ?? 0;
  const topSkills = [...(passport?.skills ?? [])].sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  const recentApplications = applications.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Good ${greetingWord(new Date().getHours())}, ${user?.firstName ?? "there"}! \u{1F44B}`}
        description="Continue learning and get closer to your goals."
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn&apos;t load your live dashboard</AlertTitle>
          <AlertDescription>{loadError}. Showing empty widgets until the API is reachable.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active courses"
          tint="red"
          value={String(courses.length)}
          icon={BookOpen}
          trend={courses.length > 0 ? `${courses.filter((c) => c.progress >= 80).length} nearing completion` : "Enroll in a course to start"}
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
          value={String(certificates.length)}
          icon={Award}
          trend={`${certificates.filter((c) => c.status === "valid").length} currently valid`}
          trendTone="neutral"
        />
        <StatCard
          label="Applications"
          tint="red"
          value={String(applications.length)}
          icon={Briefcase}
          trend={`${applications.filter((a) => ["shortlisted", "interview", "offered", "hired"].includes(a.status)).length} in progress`}
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
            {courses.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You&apos;re not enrolled in any course yet. Browse the catalog to get started.
              </p>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 rounded-xl border border-border/60 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{course.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">{course.progress}%</span>
                    </div>
                  </div>
                  <Button size="sm" className="shrink-0" render={<Link href="/my-learning">Continue</Link>} />
                </div>
              ))
            )}
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
              {topSkills.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No skills recorded yet.</p>
              ) : (
                topSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 truncate text-foreground">
                      <span className={skill.verified ? "size-2 shrink-0 rounded-full bg-success" : "size-2 shrink-0 rounded-full bg-warning"} />
                      <span className="truncate">{skill.name}</span>
                    </span>
                    <span className="shrink-0 font-medium text-muted-foreground">{skill.confidence}%</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">Browse Courses</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/courses">View All</Link>} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explore the full course catalog to find your next skill to build toward your target role.
            </p>
            <Button className="mt-3" size="sm" variant="outline" render={<Link href="/courses">Browse catalog</Link>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-base">My Applications</CardTitle>
            <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/jobs">Find jobs</Link>} />
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {recentApplications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You haven&apos;t applied to any job yet.
              </p>
            ) : (
              recentApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{application.job_title ?? "Job"}</p>
                    <p className="truncate text-xs text-muted-foreground">{application.employer ?? "Employer"}</p>
                  </div>
                  <Badge className="bg-success/10 text-success" variant="secondary">
                    {application.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
