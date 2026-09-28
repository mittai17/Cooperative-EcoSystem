"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CircleAlert,
  CloudOff,
  CloudUpload,
  HardDriveDownload,
  Inbox,
  LibraryBig,
  Link2,
  Percent,
  RefreshCw,
  RefreshCcw,
  Search,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { institutionCoursesSeed, type CourseSyncStatus, type LmsCourse } from "@/lib/mock-data/institution";

type LoadState = "loading" | "ready" | "error";
type SyncFilter = CourseSyncStatus | "All";

const SYNC_FILTERS: SyncFilter[] = ["All", "Synced", "Pending sync", "Sync failed"];

const SYNC_TONE: Record<CourseSyncStatus, string> = {
  Synced: "bg-success/10 text-success",
  "Pending sync": "bg-warning/10 text-warning",
  "Sync failed": "bg-destructive/10 text-destructive",
};

/** Number of animation steps a simulated Moodle pull takes to complete. */
const SYNC_STEPS = 5;
const SYNC_STEP_MS = 260;

async function loadCourses(): Promise<LmsCourse[]> {
  return institutionCoursesSeed.map((row) => ({ ...row }));
}

function formatSyncedAt(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<LmsCourse[]>(() =>
    institutionCoursesSeed.map((row) => ({ ...row })),
  );
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [syncFilter, setSyncFilter] = useState<SyncFilter>("All");
  const [query, setQuery] = useState("");
  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const [syncStep, setSyncStep] = useState(0);
  const [lastSyncedCount, setLastSyncedCount] = useState<number | null>(null);

  const outOfDate = courses.filter((row) => row.syncStatus !== "Synced");
  const isSyncing = syncingIds.length > 0;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((row) => {
      if (syncFilter !== "All" && row.syncStatus !== syncFilter) return false;
      if (!needle) return true;
      return (
        row.title.toLowerCase().includes(needle) ||
        row.mappedProgramme.toLowerCase().includes(needle) ||
        row.lmsCourseId.toLowerCase().includes(needle)
      );
    });
  }, [courses, syncFilter, query]);

  const totalEnrolled = courses.reduce((sum, row) => sum + row.enrolled, 0);
  const launched = courses.filter((row) => row.enrolled > 0);
  const avgCompletion = launched.length
    ? Math.round(
        launched.reduce((sum, row) => sum + row.completionPct, 0) / launched.length,
      )
    : 0;
  const offlineBytes = courses.reduce((sum, row) => sum + row.offlineSizeMb, 0);

  const completionByProgramme = useMemo(() => {
    const tally = new Map<string, { seats: number; done: number }>();
    for (const row of courses) {
      if (row.enrolled === 0) continue;
      const entry = tally.get(row.programmeCode) ?? { seats: 0, done: 0 };
      entry.seats += row.enrolled;
      entry.done += Math.round((row.completionPct / 100) * row.enrolled);
      tally.set(row.programmeCode, entry);
    }
    return [...tally.entries()]
      .map(([label, value]) => ({
        label: `${label} · completion`,
        value: Math.round((value.done / value.seats) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [courses]);

  const isFiltered = syncFilter !== "All" || query.trim() !== "";

  function clearFilters() {
    setSyncFilter("All");
    setQuery("");
  }

  async function refresh() {
    setLoadState("loading");
    try {
      setCourses(await loadCourses());
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  /**
   * Prototype integration. There is no Moodle web-service token wired up in this
   * build, so the pull is simulated locally: the row animates through the
   * stages and only then flips to Synced. Swap this for a real
   * `webservice/rest.php` call once the backend proxy exists.
   */
  function startSync(ids: string[]) {
    if (ids.length === 0 || isSyncing) return;
    setSyncingIds(ids);
    setSyncStep(0);
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      if (step < SYNC_STEPS) {
        setSyncStep(step);
        return;
      }
      clearInterval(timer);
      setSyncStep(SYNC_STEPS);
      setCourses((prev) =>
        prev.map((row) =>
          ids.includes(row.id)
            ? { ...row, syncStatus: "Synced", lastSyncedAt: new Date().toISOString() }
            : row,
        ),
      );
      setLastSyncedCount(ids.length);
      setSyncingIds([]);
    }, SYNC_STEP_MS);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="LMS Course Management"
        description="Courses mapped to your programmes, mirrored from the Moodle instance used for blended delivery."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Moodle mirror · demo data</span>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loadState === "loading"}
              aria-label="Refresh course list"
            >
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <Button onClick={() => startSync(outOfDate.map((row) => row.id))} disabled={isSyncing}>
              <RefreshCcw className={isSyncing ? "mr-2 size-4 animate-spin" : "mr-2 size-4"} />
              {isSyncing ? "Syncing…" : `Sync with Moodle${outOfDate.length ? ` (${outOfDate.length})` : ""}`}
            </Button>
          </div>
        }
      />

      {lastSyncedCount !== null && !isSyncing && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Link2 className="mt-0.5 size-4 shrink-0 text-success" />
            <div>
              <p className="text-sm font-medium text-foreground">Local mirror updated</p>
              <p className="mt-1 text-sm text-foreground/70">
                {lastSyncedCount} course{lastSyncedCount === 1 ? "" : "s"} pulled into the prototype
                mirror. No Moodle web service call is made yet.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLastSyncedCount(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Courses linked"
          value={String(courses.length)}
          icon={LibraryBig}
          trend={`${courses.filter((row) => row.modules > 0).length} mapped to a programme`}
          trendTone="neutral"
        />
        <StatCard
          label="Learners enrolled"
          value={totalEnrolled.toLocaleString("en-IN")}
          icon={Users}
          trend="Across launched Moodle courses"
          trendTone="neutral"
        />
        <StatCard
          label="Average completion"
          value={`${avgCompletion}%`}
          icon={Percent}
          trend="Weighted by enrolled learners"
          trendTone="up"
        />
        <StatCard
          label="Sync issues"
          value={String(outOfDate.length)}
          icon={outOfDate.length > 0 ? TriangleAlert : RefreshCcw}
          trend={
            outOfDate.length > 0
              ? `${courses.filter((row) => row.syncStatus === "Sync failed").length} failed · ${courses.filter((row) => row.syncStatus === "Pending sync").length} queued`
              : "Everything is in sync"
          }
          trendTone={outOfDate.length > 0 ? "down" : "up"}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-base">Course catalogue</CardTitle>
              <CardDescription>
                Sync state, curriculum depth and offline availability per course.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search course, programme, ID"
                  aria-label="Search courses"
                  className="h-9 pl-9"
                />
              </div>
              <Select
                value={syncFilter}
                onValueChange={(value) => setSyncFilter(String(value) as SyncFilter)}
              >
                <SelectTrigger
                  size="sm"
                  className="h-9 w-full sm:w-44"
                  aria-label="Filter by sync status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_FILTERS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "All" ? "All sync states" : item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadState === "error" ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <div className="flex items-start gap-2">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Could not load courses</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    The catalogue did not resolve. Check your connection and try again.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : loadState === "loading" ? (
            <div className="flex flex-col gap-2.5 rounded-lg border border-border p-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-4 w-28" />
                </div>
              ))}
              <p className="pt-1 text-xs text-foreground/60">Loading course catalogue…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
              <span className="icon-tile-red size-10">
                <Inbox className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isFiltered
                    ? "No courses match this filter"
                    : outOfDate.length === 0
                      ? "Every course is in sync"
                      : "No courses mapped yet"}
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-foreground/70">
                  {isFiltered
                    ? "Try a different sync state or search term to widen the catalogue."
                    : outOfDate.length === 0
                      ? "The mirror matches the Moodle instance. New content will appear after the next pull."
                      : "Map a Moodle course to a programme to start tracking completion."}
                </p>
              </div>
              {isFiltered ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : outOfDate.length > 0 ? (
                <Button size="sm" onClick={() => startSync(outOfDate.map((row) => row.id))}>
                  <RefreshCcw className="mr-1.5 size-3.5" />
                  Sync {outOfDate.length} course{outOfDate.length === 1 ? "" : "s"}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Mapped programme</TableHead>
                    <TableHead>Sync state</TableHead>
                    <TableHead className="w-44">Completion</TableHead>
                    <TableHead>Avg. score</TableHead>
                    <TableHead>Curriculum</TableHead>
                    <TableHead>Offline</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((row) => {
                    const syncing = syncingIds.includes(row.id);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-medium text-foreground">{row.title}</p>
                          <p className="font-mono text-xs text-foreground/60">{row.lmsCourseId}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-foreground/70">
                            {row.programmeCode}
                          </span>
                          <p className="max-w-[200px] truncate text-xs text-foreground/60">
                            {row.mappedProgramme}
                          </p>
                        </TableCell>
                        <TableCell>
                          {syncing ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <RefreshCcw className="size-3 animate-spin" />
                              Syncing
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className={SYNC_TONE[row.syncStatus]}>
                              {row.syncStatus}
                            </Badge>
                          )}
                          <p className="mt-1 font-mono text-xs text-foreground/60">
                            {syncing ? "Pulling activity" : formatSyncedAt(row.lastSyncedAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {row.completionPct}%
                            </span>
                            <span className="font-mono text-xs text-foreground/60">
                              {row.enrolled} learners
                            </span>
                          </div>
                          <Progress value={row.completionPct} className="mt-1.5" />
                        </TableCell>
                        <TableCell>
                          {row.avgScore === null ? (
                            <span className="text-xs text-foreground/60">No grades yet</span>
                          ) : (
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {row.avgScore}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-xs text-foreground">
                            {row.modules} modules
                          </p>
                          <p className="text-xs text-foreground/60">
                            {row.lessons} lessons ·{" "}
                            {row.modules > 0 ? (row.lessons / row.modules).toFixed(1) : "0"} per module
                          </p>
                        </TableCell>
                        <TableCell>
                          {row.offlineAvailable ? (
                            <Badge variant="outline">
                              <HardDriveDownload className="size-3" />
                              {row.offlineSizeMb} MB
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-foreground/70">
                              <CloudOff className="size-3" />
                              Cloud only
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {syncing ? (
                            <div className="w-24">
                              <Progress
                                value={(syncStep / SYNC_STEPS) * 100}
                                aria-label={`Syncing ${row.title}`}
                              />
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={row.syncStatus === "Synced" || isSyncing}
                              onClick={() => startSync([row.id])}
                            >
                              <RefreshCcw className="mr-1.5 size-3.5" />
                              {row.syncStatus === "Synced" ? "Up to date" : "Sync"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Completion by programme</CardTitle>
            <CardDescription>Weighted by learners enrolled per programme.</CardDescription>
          </CardHeader>
          <CardContent>
            {completionByProgramme.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-foreground/60">
                No course has enrolled a learner yet.
              </p>
            ) : (
              <HorizontalBarList
                items={completionByProgramme}
                max={100}
                barColorClassName="bg-chart-2"
                valueFormatter={(value) => `${value}% complete`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Offline availability</CardTitle>
            <CardDescription>
              Content mirrored onto trainee devices for low-connectivity campuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">
                {(offlineBytes / 1024).toFixed(2)} GB
              </span>
              <span className="text-sm text-foreground/60">
                across {courses.filter((row) => row.offlineAvailable).length} of {courses.length}{" "}
                courses
              </span>
            </div>
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              {courses.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    {row.offlineAvailable ? (
                      <HardDriveDownload className="size-3.5 shrink-0 text-success" />
                    ) : (
                      <CloudOff className="size-3.5 shrink-0 text-foreground/40" />
                    )}
                    <span className="truncate">{row.title}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-foreground/70">
                    {row.offlineAvailable ? `${row.offlineSizeMb} MB` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Moodle integration</CardTitle>
            <CardDescription>How the mirror behaves in this build.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-foreground/70">
                Prototype integration. Sync runs entirely in the browser against the bundled demo
                dataset; it is not a live Moodle web-service call.
              </p>
            </div>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-foreground/70">
                  <CloudUpload className="size-3.5" />
                  Provider
                </dt>
                <dd className="font-mono text-xs font-medium text-foreground">Moodle 4.3</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-foreground/70">
                  <Link2 className="size-3.5" />
                  Pull direction
                </dt>
                <dd className="font-mono text-xs font-medium text-foreground">Read only</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-foreground/70">
                  <RefreshCcw className="size-3.5" />
                  Scheduled nightly pull
                </dt>
                <dd className="font-mono text-xs font-medium text-foreground">02:00 IST</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-foreground/70">
                  <TriangleAlert className="size-3.5" />
                  Failed rows kept for retry
                </dt>
                <dd className="font-mono text-xs font-medium text-foreground">
                  {courses.filter((row) => row.syncStatus === "Sync failed").length}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
