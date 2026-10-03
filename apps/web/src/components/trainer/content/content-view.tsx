"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, ExternalLink, FileText, FileType2, Link2, ListChecks, MonitorPlay, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/trainer/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trainerPost, useTrainerQuery } from "@/lib/trainer/api";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  number: number;
  title: string;
  course_id: string;
  course: string;
  module_id: string;
  module: string | null;
  kind: string;
  type_label: string;
  duration_min: number | null;
  published: boolean;
  language: string;
  visibility: string;
  description: string | null;
  url: string | null;
}
interface ContentResponse {
  courses: { id: string; title: string }[];
  modules: { id: string; title: string | null; course_id: string }[];
  items: Item[];
  summary: { total: number; published: number; draft: number; videos: number };
}

type UploadKind = "video" | "pdf" | "presentation" | "link";
const KIND_ICON: Record<string, LucideIcon> = {
  video: Video,
  pdf: FileText,
  presentation: MonitorPlay,
  link: Link2,
  quiz: ListChecks,
  lesson: BookOpen,
  audio: BookOpen,
};
const UPLOADS: { kind: UploadKind; label: string; icon: LucideIcon; urlLabel: string }[] = [
  { kind: "video", label: "Upload Video", icon: Video, urlLabel: "Video URL" },
  { kind: "pdf", label: "Upload PDF", icon: FileText, urlLabel: "PDF URL" },
  { kind: "presentation", label: "Upload Presentation", icon: MonitorPlay, urlLabel: "Presentation URL" },
  { kind: "link", label: "Add Link", icon: Link2, urlLabel: "Link URL" },
];
const selectCls =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function UploadDialog({
  kind,
  data,
  defaultCourse,
  onClose,
  onSaved,
}: {
  kind: UploadKind | null;
  data: ContentResponse | null;
  defaultCourse: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState(defaultCourse || data?.courses[0]?.id || "");
  const [moduleId, setModuleId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [language, setLanguage] = useState("en");
  const [visibility, setVisibility] = useState("batch");
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = UPLOADS.find((u) => u.kind === kind);
  const modules = (data?.modules ?? []).filter((m) => m.course_id === courseId);

  async function save(publish: boolean) {
    if (!kind) return;
    setBusy(true);
    setError(null);
    try {
      await trainerPost("/content", {
        title: title.trim(),
        description: description.trim() || null,
        course_id: courseId,
        module_id: moduleId || null,
        module_title: moduleId ? null : moduleTitle.trim() || null,
        language,
        visibility,
        kind,
        url: url.trim(),
        duration_min: kind === "video" && duration ? Number(duration) : null,
        publish,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const valid = title.trim() && courseId && url.trim() && (kind !== "video" || !duration || Number(duration) > 0);

  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{meta?.label}</DialogTitle>
          <DialogDescription>
            File hosting is not set up yet, so add the link where the file is hosted. Save as draft or publish to make it visible to trainees.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Title</Label>
            <Input id="ct-title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-url">{meta?.urlLabel}</Label>
            <Input id="ct-url" type="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-desc">Description</Label>
            <Textarea id="ct-desc" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ct-course">Course</Label>
              <select id="ct-course" className={selectCls} value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleId(""); }}>
                {data?.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-module">Module</Label>
              <select id="ct-module" className={selectCls} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
                <option value="">New module…</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!moduleId && (
            <div className="space-y-1.5">
              <Label htmlFor="ct-newmod">New module name</Label>
              <Input id="ct-newmod" placeholder="Trainer resources" maxLength={255} value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ct-lang">Language</Label>
              <select id="ct-lang" className={selectCls} value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="mr">MR</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-vis">Visibility</Label>
              <select id="ct-vis" className={selectCls} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                <option value="batch">Batch trainees</option>
                <option value="private">Only me</option>
              </select>
            </div>
            {kind === "video" && (
              <div className="space-y-1.5">
                <Label htmlFor="ct-dur">Minutes</Label>
                <Input id="ct-dur" type="number" min={1} max={1000} value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy || !valid} onClick={() => save(false)}>
            Save as draft
          </Button>
          <Button disabled={busy || !valid} onClick={() => save(true)}>
            {busy ? "Saving…" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ContentView() {
  const [courseId, setCourseId] = useState("");
  const q = useTrainerQuery<ContentResponse>(`/content${courseId ? `?course_id=${courseId}` : ""}`);
  const [upload, setUpload] = useState<UploadKind | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [courses, setCourses] = useState<ContentResponse["courses"]>([]);

  if (q.data && courses.length === 0 && q.data.courses.length > 0) setCourses(q.data.courses);

  async function publish(id: string) {
    setPublishing(id);
    setActionError(null);
    try {
      await trainerPost(`/content/${id}/publish`);
      q.refetch();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setPublishing(null);
    }
  }

  const s = q.data?.summary;
  const items = q.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Content"
        description="Lessons, videos, documents and links for the courses you teach. Publish when ready for trainees."
        action={
          <>
            <select aria-label="Filter by course" className={cn(selectCls, "w-auto")} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {UPLOADS.map((u) => (
          <Button key={u.kind} variant={u.kind === "video" ? "default" : "outline"} onClick={() => setUpload(u.kind)} disabled={!q.data || q.data.courses.length === 0}>
            <u.icon className="size-4" /> {u.label}
          </Button>
        ))}
      </div>

      {q.loading ? (
        <LoadingBlock rows={4} />
      ) : q.error ? (
        <ErrorState message={q.error} onRetry={q.refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Content items" value={String(s?.total ?? 0)} icon={BookOpen} tint="red" />
            <StatCard label="Published" value={String(s?.published ?? 0)} icon={CheckCircle2} tint="green" />
            <StatCard label="Drafts" value={String(s?.draft ?? 0)} icon={FileType2} tint="amber" />
            <StatCard label="Videos" value={String(s?.videos ?? 0)} icon={Video} tint="blue" />
          </div>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          {items.length === 0 ? (
            <EmptyState
              title="No content yet"
              hint="Upload a video, PDF or presentation, or add a link, to build this course's library."
              icon={BookOpen}
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((it) => {
                const Icon = KIND_ICON[it.kind] ?? BookOpen;
                return (
                  <li key={it.id} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="icon-tile-red size-10 shrink-0">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Lesson {it.number} · {it.course}
                        </p>
                        <p className="font-heading font-semibold leading-snug">{it.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {it.type_label}
                          {it.duration_min ? ` ${it.duration_min} minutes` : ""}
                        </p>
                      </div>
                    </div>
                    {it.description && <p className="line-clamp-2 text-sm text-muted-foreground">{it.description}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <Badge variant={it.published ? "secondary" : "outline"} className={it.published ? "text-success" : "text-amber-600"}>
                        {it.published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline">{it.language.toUpperCase()}</Badge>
                      {it.module && <Badge variant="outline">{it.module}</Badge>}
                      {it.visibility === "private" && <Badge variant="outline">Only me</Badge>}
                    </div>
                    <div className="mt-auto flex gap-2">
                      {!it.published && (
                        <Button size="sm" disabled={publishing === it.id} onClick={() => publish(it.id)}>
                          {publishing === it.id ? "Publishing…" : "Publish"}
                        </Button>
                      )}
                      {it.url && /^https?:\/\//.test(it.url) && (
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input px-3 text-sm font-medium hover:bg-muted"
                        >
                          <ExternalLink className="size-3.5" /> Open
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <UploadDialog
        key={upload ?? "none"}
        kind={upload}
        data={q.data}
        defaultCourse={courseId}
        onClose={() => setUpload(null)}
        onSaved={() => {
          setUpload(null);
          q.refetch();
        }}
      />
    </div>
  );
}
