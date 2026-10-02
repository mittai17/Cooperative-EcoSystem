"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { courses } from "@/lib/mock-data/courses";
import {
  downloadCourseForOffline,
  deleteCourseFromOffline,
} from "@/lib/offline/course-cache";
import { getStorageStats, getAllCachedCourses, type CachedCourse } from "@/lib/offline/db";
import { useOfflineSync } from "@/lib/offline/sync-manager";
import {
  Clock,
  PlayCircle,
  Download,
  CheckCircle2,
  Trash2,
  HardDrive,
  RefreshCw,
  Sparkles,
  BookOpen,
  WifiOff,
  Lock,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function formatSavedAt(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  } catch {
    return "recently";
  }
}

// Map initial trainee enrollments to full course catalog
const enrolledCatalog = [
  { courseId: "course-coop-bookkeeping", initialProgress: 62 },
  { courseId: "course-leadership-coop-boards", initialProgress: 84 },
  { courseId: "course-data-analysis-coop", initialProgress: 40 },
  { courseId: "course-coop-mgmt-101", initialProgress: 95 },
  { courseId: "course-dairy-ops-201", initialProgress: 20 },
];

export default function MyLearningPage() {
  const [filter, setFilter] = useState("In Progress");
  const [enrolledList, setEnrolledList] = useState<{ courseId: string; initialProgress: number }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("coopsetu_enrolled_courses");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return enrolledCatalog;
  });
  const [enrolModalOpen, setEnrolModalOpen] = useState(false);
  const [enrolSearch, setEnrolSearch] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [offlineMap, setOfflineMap] = useState<Record<string, CachedCourse>>({});
  const [downloadingMap, setDownloadingMap] = useState<Record<string, boolean>>({});
  const [storageStats, setStorageStats] = useState<{
    coursesCount: number;
    lessonsCount: number;
    pendingCount: number;
    estimatedSizeBytes: number;
  }>({ coursesCount: 0, lessonsCount: 0, pendingCount: 0, estimatedSizeBytes: 0 });

  const { isOnline, pendingCount, lastSyncedAt, isSyncing, syncNow } = useOfflineSync();

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Load offline status of all courses
  const refreshStorage = async () => {
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);

      const cached = await getAllCachedCourses();
      const map: Record<string, CachedCourse> = {};
      for (const c of cached) {
        map[c.id] = c;
      }
      setOfflineMap(map);
    } catch (err) {
      console.error("Failed to read offline status", err);
    }
  };

  useEffect(() => {
    // Defer the initial load to a macrotask so it does not fire synchronously
    // inside the effect body (avoids react-hooks/set-state-in-effect), matching
    // the pattern used in lib/offline/sync-manager.ts.
    const initialLoad = setTimeout(() => void refreshStorage(), 0);
    return () => clearTimeout(initialLoad);
  }, []);

  const fullEnrolledCourses = useMemo(() => {
    return enrolledList.map((item) => {
      const match = courses.find((c) => c.id === item.courseId) || courses[0];
      const cached = offlineMap[match.id];
      return {
        ...match,
        progress: item.initialProgress,
        isSavedOffline: Boolean(cached),
        cachedInfo: cached,
      };
    });
  }, [enrolledList, offlineMap]);

  const filteredCourses = useMemo(() => {
    return fullEnrolledCourses.filter((c) => {
      if (filter === "In Progress") return c.progress > 0 && c.progress < 100;
      if (filter === "Completed") return c.progress >= 100;
      if (filter === "Offline Ready") return c.isSavedOffline;
      return true; // All
    });
  }, [fullEnrolledCourses, filter]);

  // Catalog courses not yet enrolled in
  const availableToEnrol = useMemo(() => {
    const enrolledIds = new Set(enrolledList.map((e) => e.courseId));
    return courses.filter((c) => !enrolledIds.has(c.id));
  }, [enrolledList]);

  const handleEnrolCourse = (courseId: string) => {
    if (enrolledList.some((e) => e.courseId === courseId)) return;
    const course = courses.find((c) => c.id === courseId);
    const updated = [{ courseId, initialProgress: 0 }, ...enrolledList];
    setEnrolledList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("coopsetu_enrolled_courses", JSON.stringify(updated));
    }
    showNotice(`Enrolled in "${course?.title || "New Course"}" successfully!`);
    setEnrolModalOpen(false);
  };

  const handleRemoveCourse = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    const updated = enrolledList.filter((e) => e.courseId !== courseId);
    setEnrolledList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("coopsetu_enrolled_courses", JSON.stringify(updated));
    }
    await handleRemoveOffline(courseId);
    showNotice(`Removed "${course?.title || "Course"}" from My Learning.`);
  };

  const handleDownload = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setDownloadingMap((prev) => ({ ...prev, [courseId]: true }));
    try {
      await downloadCourseForOffline(course);
      await refreshStorage();
    } catch (err) {
      console.error("Failed to download course for offline:", err);
    } finally {
      setDownloadingMap((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleRemoveOffline = async (courseId: string) => {
    try {
      await deleteCourseFromOffline(courseId);
      await refreshStorage();
    } catch (err) {
      console.error("Failed to remove cached course:", err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Learning & Offline Hub"
        description="Download individual courses for offline access. Only downloaded courses remain accessible without a connection; progress syncs automatically once you're back online."
        action={
          <Button onClick={() => setEnrolModalOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="size-4" /> Enrol New Course
          </Button>
        }
      />

      {actionNotice && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <AlertDescription className="font-medium text-xs sm:text-sm">{actionNotice}</AlertDescription>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </Alert>
      )}

      {/* Honest, localized offline notice - only shown when the browser is actually offline,
          and scoped to what's actually true (downloaded courses only), never a blanket
          app-wide "offline mode" claim. */}
      {!isOnline && (
        <Alert className="border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
          <WifiOff className="text-amber-700 dark:text-amber-400" />
          <AlertTitle>You&rsquo;re offline</AlertTitle>
          <AlertDescription>
            Only the {storageStats.coursesCount} course{storageStats.coursesCount === 1 ? "" : "s"} you&rsquo;ve
            downloaded below are available right now. Everything else will resume once you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards & Offline Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Learning Streak</p>
              <p className="text-2xl font-bold text-foreground">14 Days</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 text-lg">
              🔥
            </div>
          </CardContent>
        </Card>

        {/* Study Hours */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours Studied</p>
              <p className="text-2xl font-bold text-foreground">42 Hours</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Local Storage Indicator */}
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Offline Cache</p>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  IndexedDB
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {storageStats.coursesCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">courses</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatSize(storageStats.estimatedSizeBytes)} used • {storageStats.lessonsCount} lessons
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <HardDrive className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Sync Status Indicator */}
        <Card className={cn(
          "border",
          !isOnline ? "border-amber-500/30 bg-amber-500/5" : "border-border"
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sync Queue</p>
                <Badge
                  variant={isOnline ? "outline" : "secondary"}
                  className={cn("text-[10px] h-4 px-1.5", !isOnline && "bg-amber-500/20 text-amber-700 dark:text-amber-300")}
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {pendingCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">pending</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Not synced yet"}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                disabled={isSyncing || !isOnline || pendingCount === 0}
                onClick={() => syncNow()}
              >
                <RefreshCw className={cn("size-3.5 mr-1", isSyncing && "animate-spin")} />
                Sync
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          {["In Progress", "Offline Ready", "Completed", "All"].map((f) => (
            <Button
              key={f}
              variant={f === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-xs sm:text-sm"
            >
              {f === "Offline Ready" && <HardDrive className="size-3.5 mr-1.5 text-emerald-500" />}
              {f}
              {f === "Offline Ready" && storageStats.coursesCount > 0 && (
                <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">
                  {storageStats.coursesCount}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Global Offline Download Suggestion */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>Save courses locally to study without mobile data or network disruptions.</span>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <BookOpen className="size-10 text-muted-foreground mb-3 opacity-60" />
          <h3 className="font-semibold text-foreground text-base">No courses found in &ldquo;{filter}&rdquo;</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            {filter === "Offline Ready"
              ? "You haven't downloaded any courses for offline access yet. Click 'Save Offline' on any course to access it anytime without internet."
              : "Try switching to 'All' or 'In Progress' to view your current active curriculum."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((c) => {
            const isSaved = c.isSavedOffline;
            const isDownloading = Boolean(downloadingMap[c.id]);
            // Honest availability check: when the network is actually down, only
            // courses that were explicitly downloaded for offline access are usable.
            const isUnavailableNow = !isOnline && !isSaved;

            return (
              <Card
                key={c.id}
                className={cn(
                  "flex flex-col justify-between transition-all hover:shadow-md border-border/80",
                  isUnavailableNow && "opacity-60"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs">
                      {c.category}
                    </Badge>
                    {isSaved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="size-3" /> Offline Ready
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {c.durationHours} hrs
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-foreground mt-2 line-clamp-2">
                    {c.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-4">
                  <p className="mb-4 text-xs text-muted-foreground">Instructor: {c.instructor}</p>
                  {isSaved && c.cachedInfo && (
                    <p className="mb-4 -mt-2 flex items-center gap-1 text-[11px] text-emerald-600/80 font-mono">
                      <HardDrive className="size-3" />
                      Saved {formatSavedAt(c.cachedInfo.savedAt)} &middot; {formatSize(c.cachedInfo.sizeBytes)}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{c.progress}%</span>
                  </div>
                  <Progress value={c.progress} className="h-1.5" />

                  {/* Skills tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.skills.slice(0, 2).map((s) => (
                      <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                        {s}
                      </span>
                    ))}
                    {c.skills.length > 2 && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                        +{c.skills.length - 2}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-border flex flex-col gap-2">
                  {isUnavailableNow ? (
                    <div className="flex w-full items-center gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        variant="outline"
                        disabled
                        title="Not downloaded - unavailable while offline"
                      >
                        <Lock className="mr-1.5 size-3.5" /> Unavailable offline
                      </Button>
                    </div>
                  ) : (
                    <div className="flex w-full items-center gap-2">
                      <Link href={`/courses/${c.id}`} className="contents"><Button
                        className="flex-1"
                        size="sm"
                        nativeButton={false}
                      >
                        <PlayCircle className="mr-1.5 size-4" /> Continue
                      </Button></Link>

                      {/* Offline Save Toggle */}
                      {isSaved ? (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Remove offline copy from this device"
                          onClick={() => handleRemoveOffline(c.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isDownloading}
                          onClick={() => handleDownload(c.id)}
                          title="Save course and lessons for offline learning"
                        >
                          <Download className={cn("size-4 mr-1", isDownloading && "animate-bounce")} />
                          {isDownloading ? "Saving..." : "Save Offline"}
                        </Button>
                      )}

                      {/* Drop / Unenrol Action */}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Remove from My Learning"
                        onClick={() => handleRemoveCourse(c.id)}
                        className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                      >
                        Drop
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enrol In New Course Modal */}
      <Dialog open={enrolModalOpen} onOpenChange={setEnrolModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Enrol in a Cooperative Course</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose from the accredited NCCT cooperative curriculum to add to your active learning curriculum.
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={enrolSearch}
              onChange={(e) => setEnrolSearch(e.target.value)}
              placeholder="Search course title, sector, skills..."
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[50vh]">
            {availableToEnrol
              .filter((c) =>
                !enrolSearch.trim() ||
                c.title.toLowerCase().includes(enrolSearch.toLowerCase()) ||
                c.category.toLowerCase().includes(enrolSearch.toLowerCase()) ||
                c.skills.some((s) => s.toLowerCase().includes(enrolSearch.toLowerCase()))
              )
              .map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {c.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{c.durationHours} hrs</span>
                      <span className="text-xs text-muted-foreground">&middot; {c.level}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground mt-1 truncate">
                      {c.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {c.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="shrink-0 text-xs gap-1"
                    onClick={() => handleEnrolCourse(c.id)}
                  >
                    <Plus className="size-3.5" /> Enrol Now
                  </Button>
                </div>
              ))}

            {availableToEnrol.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                🎉 You are already enrolled in all catalog courses!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
