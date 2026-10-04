"use client";

import { useRef, useState, type FormEvent } from "react";
import { AlertTriangle, ExternalLink, Info, Play, RotateCcw, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const ALL_SUBJECTS = "All subjects";
const SUBJECT_OPTIONS: string[] = [ALL_SUBJECTS, ...DIKSHA_SUBJECTS];

interface SearchRequest {
  q: string;
  subject: DikshaSubject | undefined;
  offset: number;
  append: boolean;
}

interface PlaybackState {
  identifier: string;
  failed: boolean;
}

function subjectParam(value: string): DikshaSubject | undefined {
  return (DIKSHA_SUBJECTS as readonly string[]).includes(value) ? (value as DikshaSubject) : undefined;
}

function formatSize(sizeMb: number | null): string {
  if (sizeMb === null || !Number.isFinite(sizeMb)) return "Size unknown";
  return `${sizeMb.toFixed(1)} MB`;
}

function attributionLine(video: DikshaVideo): string {
  const parts = [video.license?.trim() || "Licence not stated", video.copyright?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  return ["Source: DIKSHA (diksha.gov.in)", ...parts].join(" · ");
}

export default function LearnPage() {
  const [queryInput, setQueryInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [committedQuery, setCommittedQuery] = useState("");
  const [subject, setSubject] = useState(ALL_SUBJECTS);

  const [items, setItems] = useState<DikshaVideo[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<SearchRequest | null>(null);
  const [searchedOnce, setSearchedOnce] = useState(false);

  const [selected, setSelected] = useState<DikshaVideo | null>(null);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);

  // Ignore responses from superseded searches (e.g. subject changed while a request was in flight).
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
    setPlayback(null);
  }

  const selectedSrc = selected ? safeVideoUrl(selected.video_url) : null;
  const selectedPageUrl = selected ? dikshaPageUrl(selected.identifier) : null;
  const playbackFailed = selected !== null && playback?.identifier === selected.identifier && playback.failed;
  const showEmpty = searchedOnce && !loading && !searchError && items.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Learn"
        description="Free videos from DIKSHA, the Government of India learning platform, in your language."
      />

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-slate-700">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          Videos are hosted by DIKSHA. Language and subject tags are added by content creators and are
          not always accurate, so check the video before relying on it.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row lg:items-end" noValidate>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="learn-search" className="text-sm font-medium text-slate-800">
                Search topics
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
                  placeholder="For example: fractions, dairy, bookkeeping"
                  maxLength={DIKSHA_QUERY_MAX}
                  aria-invalid={formError ? true : undefined}
                  aria-describedby={formError ? "learn-search-error" : undefined}
                  autoComplete="off"
                />
                <Button type="submit" disabled={loading}>
                  <Search aria-hidden />
                  Search
                </Button>
              </div>
              {formError && (
                <p id="learn-search-error" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 lg:w-60">
              <span className="text-sm font-medium text-slate-800">Subject</span>
              <Select value={subject} onValueChange={(value) => handleSubjectChange(value ?? ALL_SUBJECTS)}>
                <SelectTrigger className="w-full" aria-label="Subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section aria-label="Search results" className="flex min-w-0 flex-col gap-4">
          {searchError && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                {searchError}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
                <RotateCcw aria-hidden />
                Retry
              </Button>
            </div>
          )}

          {!searchedOnce && (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Search a topic to see DIKSHA videos.
            </p>
          )}

          {loading && (
            <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading videos">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {showEmpty && (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No videos found. Try another search.
            </p>
          )}

          {items.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {items.map((video) => {
                const isSelected = selected?.identifier === video.identifier;
                return (
                  <li key={video.identifier}>
                    <button
                      type="button"
                      onClick={() => selectVideo(video)}
                      aria-pressed={isSelected}
                      className={`flex h-full w-full flex-col gap-3 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                        isSelected ? "border-primary ring-1 ring-primary/30" : "border-border"
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        <Play className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span className="line-clamp-2 text-sm font-semibold text-slate-900">{video.title}</span>
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {video.subject && <Badge variant="secondary">{video.subject}</Badge>}
                        <Badge variant="outline">{video.language ?? "Language not tagged"}</Badge>
                        <span className="text-xs text-muted-foreground">{formatSize(video.size_mb)}</span>
                      </span>
                      <Badge variant="ghost" className="w-fit max-w-full truncate text-slate-700">
                        {video.license ?? "Licence not stated"}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {items.length > 0 && hasMore && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </section>

        <aside aria-label="Video viewer" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-0">
            <CardContent className="flex flex-col gap-4 p-4">
              {!selected && (
                <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted/40 px-6 text-center text-sm text-muted-foreground">
                  Pick a video from the results to watch it here.
                </div>
              )}

              {selected && (
                <>
                  {selectedSrc && !playbackFailed ? (
                    <video
                      key={selected.identifier}
                      src={selectedSrc}
                      controls
                      preload="metadata"
                      className="aspect-video w-full rounded-xl bg-black"
                      onError={() => setPlayback({ identifier: selected.identifier, failed: true })}
                    >
                      Your browser cannot play this video.
                    </video>
                  ) : (
                    <div
                      role="alert"
                      className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-muted/40 px-6 text-center text-sm text-slate-700"
                    >
                      <p>
                        {selectedSrc
                          ? "This video could not be played in your browser."
                          : "This video cannot be played here because its link is not secure."}
                      </p>
                      {selectedPageUrl && (
                        <a
                          href={selectedPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Open on DIKSHA
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <h2 className="font-heading text-lg font-semibold text-slate-900">{selected.title}</h2>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selected.subject && <Badge variant="secondary">{selected.subject}</Badge>}
                      <Badge variant="outline">{selected.language ?? "Language not tagged"}</Badge>
                      <span className="text-xs text-muted-foreground">{formatSize(selected.size_mb)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{attributionLine(selected)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
