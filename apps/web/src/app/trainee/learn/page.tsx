"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Globe,
  Info,
  Layers,
  Maximize2,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DIKSHA_DEFAULT_LIMIT,
  DIKSHA_OFFSET_MAX,
  DIKSHA_QUERY_MAX,
  DIKSHA_QUERY_MIN,
  DIKSHA_SUBJECTS,
  DikshaApiError,
  dikshaPageUrl,
  safeVideoUrl,
  searchDikshaVideos,
  type DikshaSubject,
  type DikshaVideo,
} from "@/lib/content/diksha-api";
import { DikshaContentPlayer } from "@/components/lms/DikshaContentPlayer";

const ALL_SUBJECTS = "All subjects";
const SUBJECT_OPTIONS: string[] = [ALL_SUBJECTS, ...DIKSHA_SUBJECTS];

const LANGUAGES = [
  "All Languages",
  "English",
  "Hindi",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
  "Punjabi",
  "Odia",
];

const CONTENT_TYPES = [
  { label: "All Types", value: "all" },
  { label: "Video", value: "video" },
  { label: "Reading / PDF", value: "document" },
  { label: "Course / Collection", value: "course" },
];

const RECOMMENDED_COURSES = [
  {
    id: "do_31453615072041369611998",
    title: "Cooperative Management Fundamentals",
    source: "DIKSHA",
    language: "Tamil / English",
    format: "Video + Reading",
    duration: "2h 35m",
    skills: ["Cooperative Governance", "Management"],
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  {
    id: "do_3146117155290808321821",
    title: "PACS Accounting & Statutory Compliance",
    source: "DIKSHA",
    language: "Hindi",
    format: "Reading + PDF",
    duration: "1h 45m",
    skills: ["Bookkeeping", "PACS Audit"],
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  {
    id: "do_31362303435686707214525",
    title: "Dairy Cooperative Cold Chain Operations",
    source: "DIKSHA",
    language: "Marathi / English",
    format: "Video + Practical",
    duration: "3h 10m",
    skills: ["Dairy Tech", "Quality Control"],
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
];

interface SearchRequest {
  q: string;
  subject: DikshaSubject | undefined;
  offset: number;
  append: boolean;
}

function subjectParam(value: string): DikshaSubject | undefined {
  return (DIKSHA_SUBJECTS as readonly string[]).includes(value) ? (value as DikshaSubject) : undefined;
}

function formatSize(sizeMb: number | null): string {
  if (sizeMb === null || !Number.isFinite(sizeMb)) return "Size unknown";
  return `${sizeMb.toFixed(1)} MB`;
}

export default function LearnPage() {
  const [queryInput, setQueryInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [committedQuery, setCommittedQuery] = useState("");
  const [subject, setSubject] = useState(ALL_SUBJECTS);
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSource, setSelectedSource] = useState("DIKSHA");

  const [items, setItems] = useState<DikshaVideo[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<SearchRequest | null>(null);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const [selected, setSelected] = useState<DikshaVideo | null>(null);

  const requestSeq = useRef(0);

  async function runSearch(request: SearchRequest) {
    const seq = ++requestSeq.current;
    setLastRequest(request);
    setSearchError(null);
    if (request.append) setLoadingMore(true);
    else {
      setLoading(true);
      setItems([]);
    }

    try {
      const data = await searchDikshaVideos({
        q: request.q,
        subject: request.subject,
        limit: DIKSHA_DEFAULT_LIMIT,
        offset: request.offset,
      });
      if (seq !== requestSeq.current) return;
      setItems((prev) => {
        if (!request.append) return data.items;
        const seen = new Set(prev.map((video) => video.identifier));
        return [...prev, ...data.items.filter((video) => !seen.has(video.identifier))];
      });
      const following = request.offset + data.items.length;
      setNextOffset(following);
      setHasMore(data.items.length >= DIKSHA_DEFAULT_LIMIT && following <= DIKSHA_OFFSET_MAX);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setSearchError(
        err instanceof DikshaApiError
          ? err.message
          : "Could not load videos. Check your connection and try again.",
      );
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = queryInput.trim();
    if (q.length < DIKSHA_QUERY_MIN) {
      setFormError(`Enter at least ${DIKSHA_QUERY_MIN} characters to search.`);
      return;
    }
    if (q.length > DIKSHA_QUERY_MAX) {
      setFormError(`Search can be at most ${DIKSHA_QUERY_MAX} characters.`);
      return;
    }
    setFormError(null);
    setSearchedOnce(true);
    setCommittedQuery(q);
    void runSearch({ q, subject: subjectParam(subject), offset: 0, append: false });
  }

  function handleSubjectChange(value: string) {
    setSubject(value);
    if (committedQuery) {
      void runSearch({ q: committedQuery, subject: subjectParam(value), offset: 0, append: false });
    }
  }

  function handleLoadMore() {
    if (!committedQuery || loadingMore || loading || !hasMore) return;
    void runSearch({
      q: committedQuery,
      subject: subjectParam(subject),
      offset: nextOffset,
      append: true,
    });
  }

  function handleRetry() {
    if (lastRequest) void runSearch(lastRequest);
  }

  function selectVideo(video: DikshaVideo) {
    setSelected(video);
  }

  const showEmpty = searchedOnce && !loading && !searchError && items.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learn"
        description="Discover and consume certified educational content from DIKSHA, the Government of India learning gateway, seamlessly inside CoopSetu."
      />

      <div className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          <strong>In-App Learning & Certification:</strong> All DIKSHA videos and readings play
          directly inside CoopSetu. Completing a resource tracks your progress, unlocks post-lesson
          assessments, updates your <strong>Skill Passport</strong>, and awards accredited certificates.
        </p>
      </div>

      {/* Discovery Search & Multi-facet Filter Bar */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <form onSubmit={handleSearch} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="learn-search" className="text-sm font-semibold text-slate-800 dark:text-white">
                Search learning content...
              </label>
              <div className="flex gap-2">
                <Input
                  id="learn-search"
                  type="search"
                  value={queryInput}
                  onChange={(event) => {
                    setQueryInput(event.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="For example: cooperative management, accounting, dairy, leadership"
                  maxLength={DIKSHA_QUERY_MAX}
                  aria-invalid={formError ? true : undefined}
                  aria-describedby={formError ? "learn-search-error" : undefined}
                  autoComplete="off"
                  className="rounded-xl"
                />
                <Button type="submit" disabled={loading} className="rounded-xl px-5">
                  <Search aria-hidden className="size-4 mr-1.5" />
                  Search
                </Button>
              </div>
              {formError && (
                <p id="learn-search-error" className="text-xs text-destructive">
                  {formError}
                </p>
              )}
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              {/* Language */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Language</span>
                <Select value={selectedLanguage} onValueChange={(val) => setSelectedLanguage(val ?? "All Languages")}>
                  <SelectTrigger className="w-full text-xs h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang} className="text-xs">
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Type</span>
                <Select value={selectedType} onValueChange={(val) => setSelectedType(val ?? "all")}>
                  <SelectTrigger className="w-full text-xs h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Subject</span>
                <Select value={subject} onValueChange={(value) => handleSubjectChange(value ?? ALL_SUBJECTS)}>
                  <SelectTrigger className="w-full text-xs h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Source</span>
                <Select value={selectedSource} onValueChange={(val) => setSelectedSource(val ?? "DIKSHA")}>
                  <SelectTrigger className="w-full text-xs h-9 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIKSHA" className="text-xs">
                      DIKSHA (National)
                    </SelectItem>
                    <SelectItem value="COOPSETU" className="text-xs">
                      CoopSetu Native
                    </SelectItem>
                    <SelectItem value="ALL" className="text-xs">
                      All Sources
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recommended for You Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recommended for You</h2>
            <p className="text-xs text-slate-500">
              Curated cooperative courses aligned with national training frameworks.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-normal">
            Certified Curriculum
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECOMMENDED_COURSES.map((course) => (
            <Card key={course.id} className="rounded-2xl border-slate-200 dark:border-border hover:shadow-md transition">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={`text-[10px] font-bold ${course.badgeColor}`}>
                      {course.source}
                    </Badge>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="size-3" /> {course.duration}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {course.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                    <Globe className="size-3" />
                    <span>{course.language}</span>
                    <span>·</span>
                    <span>{course.format}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {course.skills.map((s) => (
                      <span key={s} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>

                  <Link href={`/learn/content/${course.id}`}>
                    <Button size="sm" className="h-7 text-xs rounded-lg px-3">
                      Start Learning
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Search Results & Player Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section aria-label="Search results" className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {searchedOnce ? `Search Results (${items.length})` : "Course Content Catalog"}
            </h2>
          </div>

          {searchError && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                {searchError}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
                <RotateCcw aria-hidden className="size-3.5 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {!searchedOnce && (
            <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-xs text-muted-foreground space-y-2">
              <Search className="size-8 mx-auto text-slate-400" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Search topics above to discover DIKSHA videos and readings in your preferred language.
              </p>
              <p className="text-[11px] text-slate-400">
                Try searching for: <em>dairy operations</em>, <em>cooperative bylaws</em>, or <em>accounting</em>.
              </p>
            </div>
          )}

          {loading && (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading content">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {showEmpty && (
            <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No matching resources found on DIKSHA. Try another topic or language.
            </p>
          )}

          {items.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((video) => {
                const isSelected = selected?.identifier === video.identifier;
                return (
                  <li key={video.identifier}>
                    <button
                      type="button"
                      onClick={() => selectVideo(video)}
                      aria-pressed={isSelected}
                      className={`flex h-full w-full flex-col justify-between gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 focus-visible:outline-none ${
                        isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <span className="flex items-start gap-2">
                          <Play className="mt-0.5 size-4 shrink-0 text-primary fill-primary/20" aria-hidden />
                          <span className="line-clamp-2 text-xs font-semibold text-slate-900 dark:text-white">
                            {video.title}
                          </span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {video.subject && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {video.subject}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {video.language ?? "All Languages"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatSize(video.size_mb)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="truncate max-w-[130px]">{video.license ?? "DIKSHA Public"}</span>
                        <span className="text-primary font-medium hover:underline flex items-center gap-0.5">
                          Play <Play className="size-2.5 fill-current" />
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {items.length > 0 && hasMore && (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </section>

        {/* Selected Player Preview & Full Player Launcher */}
        <aside aria-label="Content viewer" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <Card className="rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">
                  {selected ? "In-App Content Player" : "Content Preview"}
                </CardTitle>
                {selected && (
                  <Link href={`/learn/content/${selected.identifier}`}>
                    <Button size="sm" className="h-7 text-xs rounded-lg gap-1.5 bg-primary text-white">
                      <Maximize2 className="size-3" /> Open Full Player & Quiz
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {!selected && (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl bg-muted/30 px-6 text-center text-xs text-muted-foreground gap-2">
                  <Play className="size-8 text-slate-400 stroke-1" />
                  <p>Select any resource from the left to watch or read directly in CoopSetu.</p>
                </div>
              )}

              {selected && (
                <div className="space-y-4">
                  <DikshaContentPlayer
                    resource={{
                      identifier: selected.identifier,
                      title: selected.title,
                      videoUrl: selected.video_url,
                      license: selected.license || "CC BY 4.0",
                      licenseStatus: "ALLOWED_WITH_ATTRIBUTION",
                      attribution: `Source: DIKSHA (diksha.gov.in) · ${selected.copyright || "NCERT"} · ${selected.license || "CC BY 4.0"}`,
                      embeddingAllowed: true,
                    }}
                  />

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selected.title}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      {selected.subject && <Badge variant="secondary">{selected.subject}</Badge>}
                      <Badge variant="outline">{selected.language ?? "Language not tagged"}</Badge>
                      <span>{formatSize(selected.size_mb)}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        License: <strong>{selected.license || "DIKSHA Public"}</strong>
                      </span>
                      <Link href={`/learn/content/${selected.identifier}`}>
                        <Button size="sm" variant="default" className="text-xs h-7">
                          Start Lesson & Certification →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
