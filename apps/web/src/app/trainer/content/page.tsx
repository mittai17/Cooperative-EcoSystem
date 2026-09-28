"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CloudDownload,
  FileDown,
  FileText,
  Globe2,
  ChevronDown,
  ChevronUp,
  Languages,
  ListVideo,
  Loader2,
  MonitorPlay,
  PenLine,
  Play,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  contentCourses,
  supportedLanguages,
  type ContentCourse,
  type ContentLesson,
  type ContentModule,
  type LanguageCode,
  type LessonType,
  type OfflinePackState,
} from "@/lib/mock-data/trainer";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const lessonIcon: Record<LessonType, typeof Play> = {
  Video: Play,
  Reading: FileText,
  Quiz: ListVideo,
  Practical: MonitorPlay,
  Download: FileDown,
};

const lessonTint: Record<LessonType, string> = {
  Video: "bg-tint-blue-bg text-primary",
  Reading: "bg-tint-green-bg text-tint-green-fg",
  Quiz: "bg-tint-violet-bg text-tint-violet-fg",
  Practical: "bg-tint-amber-bg text-amber-700",
  Download: "bg-muted text-muted-foreground",
};

interface Draft {
  /** Module ids in their current on-screen order. */
  order: string[];
  /** Draft mutations keyed by lesson id, merged over the seed data. */
  lessons: Record<string, { published: boolean; languages: Record<LanguageCode, boolean> }>;
  /** Offline pack progress, 0-100, null when the pack is not downloading. */
  offlineProgress: Record<string, number | null>;
}

function initialDraft(course: ContentCourse): Draft {
  const lessons: Draft["lessons"] = {};
  course.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      lessons[lesson.id] = {
        published: lesson.published,
        languages: { ...lesson.languages },
      };
    });
  });
  return { order: course.modules.map((module) => module.id), lessons, offlineProgress: {} };
}

export default function TrainerContentPage() {
  const [courseId, setCourseId] = useState(contentCourses[0].id);
  const [languageFilter, setLanguageFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const course = contentCourses.find((item) => item.id === courseId) ?? contentCourses[0];
  const draft = drafts[course.id] ?? initialDraft(course);

  const moduleMap = useMemo(() => {
    const map = new Map<string, ContentModule>();
    course.modules.forEach((module) => map.set(module.id, module));
    return map;
  }, [course]);

  const orderedModules = draft.order
    .map((id) => moduleMap.get(id))
    .filter((module): module is ContentModule => Boolean(module));

  const allLessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ module, lesson })),
  );

  const visibleModules = orderedModules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => {
        if (languageFilter !== "all" && !lesson.languages[languageFilter as LanguageCode]) return false;
        const term = search.trim().toLowerCase();
        if (term && !lesson.title.toLowerCase().includes(term)) return false;
        return true;
      }),
    }))
    .filter((module) => module.lessons.length > 0);

  const publishedCount = allLessons.filter(({ lesson }) => draft.lessons[lesson.id].published).length;
  const translatedCount = allLessons.filter(({ lesson }) =>
    supportedLanguages.some((language) => language.code !== "en" && lesson.languages[language.code]),
  ).length;
  const totalMinutes = allLessons
    .filter(({ lesson }) => draft.lessons[lesson.id].published)
    .reduce((sum, { lesson }) => sum + lesson.durationMin, 0);
  const untranslatedCount = allLessons.filter(
    ({ lesson }) => !supportedLanguages.some((language) => language.code !== "en" && lesson.languages[language.code]),
  ).length;

  function updateLesson(lessonId: string, patch: Partial<Draft["lessons"][string]>) {
    setDrafts((previous) => {
      const current = previous[course.id] ?? initialDraft(course);
      const existing = current.lessons[lessonId];
      if (!existing) return previous;
      return {
        ...previous,
        [course.id]: {
          ...current,
          lessons: { ...current.lessons, [lessonId]: { ...existing, ...patch } },
        },
      };
    });
  }

  function toggleLanguage(lessonId: string, code: LanguageCode) {
    setDrafts((previous) => {
      const current = previous[course.id] ?? initialDraft(course);
      const existing = current.lessons[lessonId];
      if (!existing) return previous;
      return {
        ...previous,
        [course.id]: {
          ...current,
          lessons: {
            ...current.lessons,
            [lessonId]: {
              ...existing,
              languages: { ...existing.languages, [code]: !existing.languages[code] },
            },
          },
        },
      };
    });
  }

  function togglePublished(lesson: ContentLesson) {
    const next = !draft.lessons[lesson.id].published;
    updateLesson(lesson.id, { published: next });
    setNotice(
      `${lesson.title} is ${next ? "published to the trainee app" : "hidden from trainees"}. Language flags are kept either way.`,
    );
  }

  function moveModule(moduleId: string, direction: -1 | 1) {
    setDrafts((previous) => {
      const current = previous[course.id] ?? initialDraft(course);
      const index = current.order.indexOf(moduleId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.order.length) return previous;
      const order = [...current.order];
      const [moved] = order.splice(index, 1);
      order.splice(target, 0, moved);
      return { ...previous, [course.id]: { ...current, order } };
    });
  }

  function startDownload(module: ContentModule) {
    setDrafts((previous) => {
      const current = previous[course.id] ?? initialDraft(course);
      return {
        ...previous,
        [course.id]: {
          ...current,
          offlineProgress: { ...current.offlineProgress, [module.id]: 0 },
        },
      };
    });
    setNotice(`Queued the ${module.offlineSizeMb} MB offline pack for "${module.title}".`);
    let progress = 0;
    const step = () => {
      progress = Math.min(100, progress + 20);
      setDrafts((previous) => {
        const current = previous[course.id] ?? initialDraft(course);
        return {
          ...previous,
          [course.id]: {
            ...current,
            offlineProgress: {
              ...current.offlineProgress,
              [module.id]: progress >= 100 ? null : progress,
            },
          },
        };
      });
      if (progress < 100) window.setTimeout(step, 220);
    };
    window.setTimeout(step, 220);
  }

  function resetCourse() {
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[course.id];
      return next;
    });
    setNotice(`Draft changes to "${course.title}" were discarded.`);
  }

  const hasDraftChanges = drafts[course.id] !== undefined;

  function offlineLabel(state: OfflinePackState, progress: number | null) {
    if (progress !== null && progress !== undefined) return "Downloading";
    if (state === "ready") return "Ready offline";
    if (state === "downloading") return "Downloading";
    return "Not downloaded";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learning content"
        description="Reorder modules, publish or hide lessons, flip the language flags the trainees see, and queue offline packs for low-connectivity classrooms."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Drafts stay in this browser</span>
            <Select value={courseId} onValueChange={(value) => value && setCourseId(value)}>
              <SelectTrigger className="w-64" aria-label="Select course">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentCourses.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Published lessons"
          value={`${publishedCount}/${allLessons.length}`}
          icon={BookOpen}
          trend={`${Math.round((publishedCount / allLessons.length) * 100)}% of this course`}
          trendTone="neutral"
        />
        <StatCard
          label="Published runtime"
          value={`${Math.round((totalMinutes / 60) * 10) / 10}h`}
          icon={Play}
          trend={`${totalMinutes} minutes of published material`}
          trendTone="up"
        />
        <StatCard
          label="Translated lessons"
          value={String(translatedCount)}
          icon={Languages}
          trend={`${untranslatedCount} still English only`}
          trendTone={untranslatedCount > 0 ? "down" : "up"}
        />
        <StatCard
          label="Offline packs"
          value={`${course.modules.filter((module) => module.offline === "ready").length}/${course.modules.length}`}
          icon={CloudDownload}
          trend="Modules cached for low bandwidth"
          trendTone="neutral"
        />
      </div>

      {notice && (
        <Alert>
          <CheckCircle2 className="text-emerald-700" />
          <AlertTitle>Draft updated</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {untranslatedCount > 0 && (
        <Alert className="border-amber-600/30 bg-amber-50">
          <TriangleAlert className="text-amber-700" />
          <AlertTitle>
            {untranslatedCount} lesson{untranslatedCount === 1 ? "" : "s"} have no Indian language version
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            Trainees on हिन्दी, मराठी, தமிழ் or ગુજરાતी see the English fallback for these. Turn on a flag once the
            translation is reviewed, and the app picks it up on the next content sync.
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="font-heading text-base">Translation filter</CardTitle>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative lg:max-w-64 lg:flex-1">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lessons"
                aria-label="Search lessons"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={languageFilter} onValueChange={(value) => value && setLanguageFilter(value)}>
                <SelectTrigger className="w-full sm:w-56" aria-label="Filter by language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {supportedLanguages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={resetCourse} disabled={!hasDraftChanges}>
                <RotateCcw className="mr-1.5 size-4" />
                Discard draft changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {course.audience}. Modules are listed in the order trainees will work through them.
          </p>
        </CardContent>
      </Card>

      {visibleModules.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <span className="icon-tile-red size-11">
                <Globe2 className="size-5" />
              </span>
              <p className="font-heading text-sm font-semibold text-foreground">
                No lesson in this language yet
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                No lesson in &ldquo;{course.title}&rdquo; has content in the selected language yet, so the
                trainee app would fall back to English for this course.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setLanguageFilter("all");
                  setSearch("");
                }}
              >
                Show every language
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleModules.map((module, moduleIndex) => {
            const progress = draft.offlineProgress[module.id];
            const downloading = progress !== null && progress !== undefined;
            const publishedInModule = module.lessons.filter(
              (lesson) => draft.lessons[lesson.id].published,
            ).length;
            return (
              <Card key={module.id} className="rounded-lg">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-sm text-muted-foreground">
                        {moduleIndex + 1}
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="font-heading text-base">{module.title}</CardTitle>
                        <p className="mt-0.5 text-sm text-muted-foreground">{module.summary}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              module.offline === "ready" && "bg-success/10 text-emerald-700",
                              module.offline === "downloading" && "bg-tint-amber-bg text-amber-700",
                              module.offline === "not-downloaded" && "bg-muted text-muted-foreground",
                            )}
                          >
                            <CloudDownload />
                            {offlineLabel(module.offline, progress)}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            {module.offlineSizeMb} MB &middot; {publishedInModule}/{module.lessons.length}{" "}
                            published
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Move ${module.title} up`}
                        disabled={moduleIndex === 0}
                        onClick={() => moveModule(module.id, -1)}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Move ${module.title} down`}
                        disabled={moduleIndex === visibleModules.length - 1}
                        onClick={() => moveModule(module.id, 1)}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloading || module.offline === "ready"}
                        onClick={() => startDownload(module)}
                      >
                        {downloading ? (
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
                        ) : (
                          <CloudDownload className="mr-1.5 size-4" />
                        )}
                        {module.offline === "ready" ? "Cached" : "Download pack"}
                      </Button>
                    </div>
                  </div>
                  {downloading && (
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="flex-1" />
                      <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <ul className="flex flex-col divide-y divide-border border-t border-border">
                    {module.lessons.map((lesson) => {
                      const Icon = lessonIcon[lesson.type];
                      const state = draft.lessons[lesson.id];
                      return (
                        <li
                          key={lesson.id}
                          className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-md",
                                lessonTint[lesson.type],
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {lesson.title}
                              </p>
                              <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-mono">{lesson.type}</span>
                                <span aria-hidden="true">&middot;</span>
                                <span className="font-mono">{lesson.durationMin} min</span>
                                <span aria-hidden="true">&middot;</span>
                                <span
                                  className={state.published ? "text-emerald-700" : "text-muted-foreground"}
                                >
                                  {state.published ? "Published" : "Draft"}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <fieldset className="flex items-center gap-2">
                              <legend className="sr-only">Languages for {lesson.title}</legend>
                              {supportedLanguages.map((language) => (
                                <label
                                  key={language.code}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-1 rounded-md border px-1.5 py-1 text-xs transition-colors",
                                    state.languages[language.code]
                                      ? "border-primary/40 bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground",
                                    language.code === "en" && "cursor-not-allowed opacity-80",
                                  )}
                                  title={`${lesson.title} in ${language.label}`}
                                >
                                  <span className="font-mono font-medium">{language.short}</span>
                                  {language.code === "en" ? (
                                    <CheckCircle2 className="size-3" />
                                  ) : (
                                    <Switch
                                      size="sm"
                                      checked={state.languages[language.code]}
                                      disabled={!state.published}
                                      onCheckedChange={() => toggleLanguage(lesson.id, language.code)}
                                      aria-label={`${language.label} version of ${lesson.title}`}
                                    />
                                  )}
                                </label>
                              ))}
                            </fieldset>
                            <Button
                              size="sm"
                              variant={state.published ? "outline" : "default"}
                              onClick={() => togglePublished(lesson)}
                            >
                              {state.published ? (
                                <>
                                  <XCircle className="mr-1.5 size-3.5" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-1.5 size-3.5" />
                                  Publish
                                </>
                              )}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <PenLine className="size-4 text-primary" />
            Where this data comes from
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            Courses, modules and lessons are the CoopSetu demo set: {course.modules.length} modules and{" "}
            {allLessons.length} lessons for &ldquo;{course.title}&rdquo;. Language flags describe which
            translations exist, not which are proofread.
          </p>
          <p>
            Reordering, publishing and language changes stay in this browser tab. There is no FastAPI
            content endpoint behind them yet, so a reload restores the seed data, and the
            &ldquo;Discard draft changes&rdquo; button does the same on demand.
          </p>
          <p>
            Offline pack progress is simulated in steps of 20% because the real pack is served from
            object storage, not from the trainer app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
