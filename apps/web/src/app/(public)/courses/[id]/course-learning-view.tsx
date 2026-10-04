"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Circle,
  Clock,
  MessageSquare,
  Pause,
  Play,
  StickyNote,
  FolderOpen,
  Download,
  HelpCircle,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/types";
import { buildCurriculum, flattenLessons } from "./curriculum";
import {
  downloadCourseForOffline,
  deleteCourseFromOffline,
  isCourseOfflineReady,
} from "@/lib/offline/course-cache";
import {
  enqueueLessonComplete,
  enqueueAssessmentSubmission,
  useOfflineSync,
} from "@/lib/offline/sync-manager";
import { getCachedCourse } from "@/lib/offline/db";
import { useT } from "@/i18n";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CourseLearningView({ course }: { course: Course }) {
  const t = useT();
  const curriculum = useMemo(() => buildCurriculum(course, t), [course, t]);
  const allLessons = useMemo(() => flattenLessons(curriculum), [curriculum]);
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(allLessons.filter((l) => l.completedByDefault).map((l) => l.id))
  );
  const [currentLessonId, setCurrentLessonId] = useState(
    () => allLessons.find((l) => !l.completedByDefault)?.id ?? allLessons[0]?.id
  );
  const [openModules, setOpenModules] = useState<Set<string>>(() => new Set(curriculum.map((m) => m.id)));
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Offline states
  const { isOnline } = useOfflineSync();
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Offline Quiz state
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  const currentLesson = allLessons[currentIndex] ?? allLessons[0];
  const durationSeconds = currentLesson.durationMinutes * 60;
  const isLast = currentIndex === allLessons.length - 1;
  const percentComplete = Math.round((completed.size / allLessons.length) * 100);

  // Load offline saved status and restore offline progress
  useEffect(() => {
    isCourseOfflineReady(course.id).then((saved) => {
      setIsSavedOffline(saved);
      if (saved) {
        getCachedCourse(course.id).then((cached) => {
          if (cached) {
            const cachedDone = new Set<string>();
            for (const mod of cached.modules) {
              for (const les of mod.lessons) {
                if (les.completed) cachedDone.add(les.id);
              }
            }
            if (cachedDone.size > 0) {
              setCompleted((prev) => new Set([...prev, ...cachedDone]));
            }
          }
        });
      }
    });
  }, [course.id]);

  function selectLesson(id: string) {
    setCurrentLessonId(id);
    setElapsed(0);
    setPlaying(false);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
  }

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= durationSeconds) {
          setPlaying(false);
          return durationSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playing, durationSeconds]);

  function toggleModule(id: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleMarkComplete() {
    setCompleted((prev) => new Set(prev).add(currentLesson.id));
    // Enqueue action in IndexedDB sync queue & local database
    await enqueueLessonComplete(course.id, currentLesson.id);
  }

  async function handleNextLesson() {
    await handleMarkComplete();
    if (!isLast) {
      selectLesson(allLessons[currentIndex + 1].id);
    }
  }

  async function toggleOfflineDownload() {
    if (isSavedOffline) {
      await deleteCourseFromOffline(course.id);
      setIsSavedOffline(false);
    } else {
      setIsDownloading(true);
      try {
        await downloadCourseForOffline(course);
        setIsSavedOffline(true);
      } finally {
        setIsDownloading(false);
      }
    }
  }

  async function handleQuizSubmit() {
    if (selectedQuizOption === null) return;
    setQuizSubmitted(true);
    // Queue assessment answer offline
    const isCorrect = selectedQuizOption === 0;
    const score = isCorrect ? 100 : 50;
    await enqueueAssessmentSubmission(
      `quiz-${currentLesson.id}`,
      score,
      { questionIndex: 0, selectedOption: selectedQuizOption, lessonId: currentLesson.id }
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Navigation & Offline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/trainee/my-learning"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> {t("public.courseLearning.backToLearning")}
        </Link>

        {/* Offline Cache Button */}
        <div className="flex items-center gap-2">
          {isSavedOffline ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="size-3.5" /> {t("public.courseLearning.savedOffline")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleOfflineDownload}
                title={t("public.courseLearning.removeOfflineTitle")}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5 mr-1" /> {t("public.courseLearning.remove")}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isDownloading}
              onClick={toggleOfflineDownload}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Download className={cn("size-3.5", isDownloading && "animate-bounce")} />
              {isDownloading ? t("public.courseLearning.savingOffline") : t("public.courseLearning.downloadOffline")}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{course.title}</h1>
            {!isOnline && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                {t("public.courseLearning.offlineMode")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">by {course.instructor}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-foreground">{t("public.courseLearning.percentComplete").replace("{percent}", String(percentComplete))}</span>
          <span className="text-muted-foreground">
            {t("public.courseLearning.progressCount").replace("{done}", String(completed.size)).replace("{total}", String(allLessons.length))}
          </span>
        </div>
      </div>
      <Progress value={percentComplete} className="mt-3" />

      <Tabs defaultValue="course" className="mt-6">
        <TabsList variant="line" className="border-b border-border">
          <TabsTrigger value="course">{t("public.courseLearning.tabs.course")}</TabsTrigger>
          <TabsTrigger value="quiz">
            <HelpCircle className="size-3.5" /> {t("public.courseLearning.tabs.quiz")}
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="size-3.5" /> {t("public.courseLearning.tabs.notes")}
          </TabsTrigger>
          <TabsTrigger value="discussion">
            <MessageSquare className="size-3.5" /> {t("public.courseLearning.tabs.discussion")}
          </TabsTrigger>
          <TabsTrigger value="resources">
            <FolderOpen className="size-3.5" /> {t("public.courseLearning.tabs.resources")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="course" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            {/* Curriculum sidebar */}
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{t("public.courseLearning.courseContent")}</p>
                <span className="text-xs text-muted-foreground">{t("public.courseLearning.lessonCount").replace("{count}", String(allLessons.length))}</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto p-2">
                {curriculum.map((module) => {
                  const open = openModules.has(module.id);
                  return (
                    <div key={module.id} className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted/60"
                      >
                        {module.title}
                        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                      </button>
                      {open && (
                        <div className="flex flex-col gap-0.5 pb-1">
                          {module.lessons.map((lesson) => {
                            const isDone = completed.has(lesson.id);
                            const isCurrent = lesson.id === currentLessonId;
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => selectLesson(lesson.id)}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                                  isCurrent ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                )}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                                ) : (
                                  <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                                )}
                                <span className="line-clamp-1 flex-1">{lesson.title}</span>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {t("public.courseLearning.minutesShort").replace("{count}", String(lesson.durationMinutes))}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Video player & Lesson detail */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                <Image
                  src={`https://picsum.photos/seed/${currentLesson.id}/1280/720`}
                  alt={currentLesson.title}
                  fill
                  className="object-cover opacity-80"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setPlaying(!playing)}
                  className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary"
                  aria-label={playing ? t("public.courseLearning.pause") : t("public.courseLearning.play")}
                >
                  {playing ? <Pause className="size-7 fill-current" /> : <Play className="size-7 fill-current pl-0.5" />}
                </button>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(elapsed / durationSeconds) * 100}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-white/90">
                    {formatTime(elapsed)} / {formatTime(durationSeconds)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">{currentLesson.title}</h2>
                  {completed.has(currentLesson.id) && (
                    <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1">
                      <Check className="size-3" /> {t("public.courseLearning.completed")}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {t("public.courseLearning.minutes").replace("{count}", String(currentLesson.durationMinutes))}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("public.courseLearning.lessonBody").replace("{title}", currentLesson.title.toLowerCase()).replace("{category}", course.category.toLowerCase())}
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="gap-1.5 sm:flex-1"
                    onClick={handleMarkComplete}
                    disabled={completed.has(currentLesson.id)}
                  >
                    <Check className="size-4" />
                    {completed.has(currentLesson.id) ? t("public.courseLearning.markedCompleted") : t("public.courseLearning.markComplete")}
                  </Button>
                  <Button
                    className="gap-1.5 sm:flex-1"
                    onClick={handleNextLesson}
                    disabled={isLast && completed.has(currentLesson.id)}
                  >
                    {isLast ? t("public.courseLearning.finishCourse") : t("public.courseLearning.nextLesson")}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Offline Interactive Quiz Tab */}
        <TabsContent value="quiz" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">{t("public.courseLearning.quiz.title")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("public.courseLearning.quiz.intro").replace("{title}", currentLesson.title)}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {t("public.courseLearning.quiz.questionOf")}
              </Badge>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {t("public.courseLearning.quiz.question")}
              </p>

              <div className="mt-4 space-y-2.5">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !quizSubmitted && setSelectedQuizOption(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between",
                      selectedQuizOption === idx
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:bg-muted/50 text-foreground",
                      quizSubmitted && idx === 0 && "border-emerald-500 bg-emerald-500/10 text-emerald-600 font-semibold"
                    )}
                  >
                    <span>{t(`public.courseLearning.quiz.options.${idx}`)}</span>
                    {quizSubmitted && idx === 0 && <CheckCircle2 className="size-4 text-emerald-600" />}
                  </button>
                ))}
              </div>

              {quizSubmitted ? (
                <div className="mt-5 rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                    <CheckCircle2 className="size-4" />
                    <span>{t("public.courseLearning.quiz.recorded")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("public.courseLearning.quiz.score").replace("{score}", selectedQuizOption === 0 ? "100%" : "50%")}
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleQuizSubmit}
                    disabled={selectedQuizOption === null}
                    className="gap-2"
                  >
                    <Send className="size-4" />
                    {t("public.courseLearning.quiz.submit")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Offline Notes Tab */}
        <TabsContent value="notes" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-foreground mb-2">{t("public.courseLearning.notes.title")}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t("public.courseLearning.notes.storedLocally")}
            </p>
            <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                <strong>{t("public.courseLearning.notes.focusArea")}</strong>{" "}
                {t("public.courseLearning.notes.focusBody").replace("{title}", currentLesson.title).replace("{category}", course.category)}
              </p>
              <p>
                {t("public.courseLearning.notes.principle")}
              </p>
              <div className="rounded-xl bg-muted/50 p-4 border border-border">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2">
                  {t("public.courseLearning.notes.checklistTitle")}
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>{t("public.courseLearning.notes.checklist.0")}</li>
                  <li>{t("public.courseLearning.notes.checklist.1")}</li>
                  <li>{t("public.courseLearning.notes.checklist.2")}</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="mt-6">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <MessageSquare className="size-8 text-muted-foreground" />
            <p className="font-medium text-foreground">{t("public.courseLearning.discussion.title")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("public.courseLearning.discussion.body")}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <FolderOpen className="size-8 text-muted-foreground" />
            <p className="font-medium text-foreground">{t("public.courseLearning.resources.title")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("public.courseLearning.resources.body")}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
