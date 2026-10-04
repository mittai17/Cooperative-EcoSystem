"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Gauge, SearchX, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EDUCATION_OPTIONS,
  EXPERIENCE_OPTIONS,
} from "@/components/employer/candidates/candidate-filters";
import { FilterSelect } from "@/components/employer/candidates/filter-select";
import { useResource } from "@/components/employer/candidates/use-resource";
import { MatchCard } from "@/components/employer/matching/match-card";
import { demoJobMatches, demoPostingOptions } from "@/components/employer/matching/demo-matches";
import {
  EMPTY_MATCH_FILTERS,
  applyMatchFilters,
  countMatchFilters,
  type MatchFilterState,
} from "@/components/employer/matching/match-filters";
import {
  type JobMatchesResponse,
  errorMessage,
  getJobMatches,
  hasField,
  listMyJobs,
} from "@/lib/employer/candidates-api";
import { useApi } from "@/lib/use-api";

interface MatchLoad {
  source: "api" | "demo";
  response: JobMatchesResponse | null;
  /** Why the API was not used, when source is "demo". */
  reason: string | null;
}

interface PostingOption {
  id: string;
  title: string;
  status: string;
}

const AVAILABILITY_OPTIONS = [
  { value: "any", label: "Any availability" },
  { value: "immediate", label: "Immediate" },
  { value: "30 days", label: "Within 30 days" },
];

const CERTIFICATION_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Has valid certificate" },
];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function AIMatchingContent() {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedJob = searchParams.get("job") ?? "";

  const [selectedJob, setSelectedJob] = useState(requestedJob);
  const [filters, setFilters] = useState<MatchFilterState>(EMPTY_MATCH_FILTERS);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const jobs = useResource(() => listMyJobs(api), []);
  const postingsMode: "api" | "demo" = jobs.error ? "demo" : "api";
  const postings: PostingOption[] = useMemo(() => {
    if (postingsMode === "demo") return demoPostingOptions();
    return jobs.data ?? [];
  }, [postingsMode, jobs.data]);

  const activeJob = postings.some((posting) => posting.id === selectedJob) ? selectedJob : (postings[0]?.id ?? "");

  const matches = useResource<MatchLoad | null>(async () => {
    if (!activeJob) return null;
    if (postingsMode === "demo") {
      return { source: "demo", response: demoJobMatches(activeJob), reason: "The job list could not be loaded." };
    }
    try {
      const response = await getJobMatches(api, activeJob);
      return { source: "api", response, reason: null };
    } catch (err) {
      return { source: "demo", response: demoJobMatches(activeJob), reason: errorMessage(err) };
    }
  }, [activeJob, postingsMode]);

  const loaded = matches.data;
  const results = useMemo(() => loaded?.response?.matches ?? [], [loaded]);
  const demo = loaded?.source === "demo";
  const sorted = useMemo(() => [...results].sort((a, b) => b.score - a.score), [results]);
  const visible = useMemo(() => applyMatchFilters(sorted, filters), [sorted, filters]);
  const candidates = results.map((result) => result.candidate);

  const support = {
    skill: true,
    location: true,
    language: candidates.length === 0 || hasField(candidates, "languages"),
    education: candidates.length === 0 || hasField(candidates, "education_level"),
    experience: candidates.length === 0 || hasField(candidates, "years_of_experience"),
    certification: candidates.length === 0 || hasField(candidates, "certificate_count"),
    availability: candidates.length === 0 || hasField(candidates, "availability"),
  };

  const scores = visible.map((result) => result.score);
  const jobTitle = loaded?.response?.job.title ?? postings.find((posting) => posting.id === activeJob)?.title ?? "";
  const activeCount = countMatchFilters(filters);

  function selectJob(jobId: string) {
    setSelectedJob(jobId);
    setFilters(EMPTY_MATCH_FILTERS);
    router.replace(`/employer/matches?job=${encodeURIComponent(jobId)}`);
  }

  const handleNotice = (message: string) => {
    setActionError(null);
    setNotice(message);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Matching"
        description="Find the best candidates from verified Skill Passports. Each score is computed from database facts and can be traced factor by factor."
        action={demo ? <span className="demo-data-tag">Demo dataset · labelled</span> : undefined}
      />

      {demo && loaded?.reason && (
        <Alert>
          <Sparkles />
          <AlertTitle>Showing the labelled demo dataset</AlertTitle>
          <AlertDescription>
            The live matching service did not respond ({loaded.reason}). Scores below come from the offline demo scorer and are not real candidates.
          </AlertDescription>
        </Alert>
      )}

      {actionError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Shortlist failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm text-foreground">{notice}</p>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="sm:w-96">
            {jobs.loading && !postings.length ? (
              <Skeleton className="h-16 w-full" />
            ) : postings.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">You have no postings yet. Create one to start matching.</p>
                <Link href="/employer/jobs/new" className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}>
                  Create a posting
                </Link>
              </div>
            ) : (
              <FilterSelect
                id="match-job"
                label="Select posting"
                value={activeJob}
                options={postings.map((posting) => ({ value: posting.id, label: posting.title }))}
                onChange={selectJob}
              />
            )}
          </div>
          {loaded?.response && (
            <p className="text-sm text-muted-foreground">
              Required skills: {loaded.response.job.required_skills?.join(", ") || "not listed"}
            </p>
          )}
        </CardContent>
      </Card>

      {matches.loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : matches.error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Matches could not be loaded</p>
            <p className="text-sm text-muted-foreground">{matches.error}</p>
            <Button variant="outline" onClick={matches.reload}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : !activeJob ? null : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Candidates" value={String(visible.length)} icon={Users} trend={`of ${results.length} scored for ${jobTitle}`} trendTone="neutral" />
            <StatCard label="Top match" value={scores.length ? `${Math.max(...scores)}%` : "None"} icon={Sparkles} trend="Highest score in this list" trendTone="up" />
            <StatCard label="Median match" value={scores.length ? `${median(scores)}%` : "None"} icon={Gauge} trend="Across filtered candidates" trendTone="neutral" />
          </div>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mf-skill" className="text-xs font-medium text-muted-foreground">Skills</Label>
                  <Input
                    id="mf-skill"
                    placeholder="e.g. Quality Testing"
                    value={filters.skill}
                    onChange={(event) => setFilters({ ...filters, skill: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mf-location" className="text-xs font-medium text-muted-foreground">Location</Label>
                  <Input
                    id="mf-location"
                    placeholder="District or state"
                    value={filters.location}
                    onChange={(event) => setFilters({ ...filters, location: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mf-language" className="text-xs font-medium text-muted-foreground">Language</Label>
                  <Input
                    id="mf-language"
                    placeholder="e.g. Gujarati"
                    disabled={!support.language}
                    value={filters.language}
                    onChange={(event) => setFilters({ ...filters, language: event.target.value })}
                  />
                  {!support.language && <p className="text-[11px] text-muted-foreground">Not returned for these candidates</p>}
                </div>
                <FilterSelect
                  id="mf-education"
                  label="Education"
                  value={filters.education}
                  options={EDUCATION_OPTIONS}
                  supported={support.education}
                  unsupportedHint="Not returned for these candidates"
                  onChange={(value) => setFilters({ ...filters, education: value })}
                />
                <FilterSelect
                  id="mf-experience"
                  label="Experience"
                  value={String(filters.minExperience)}
                  options={EXPERIENCE_OPTIONS}
                  supported={support.experience}
                  unsupportedHint="Not returned for these candidates"
                  onChange={(value) => setFilters({ ...filters, minExperience: Number(value) })}
                />
                <FilterSelect
                  id="mf-certification"
                  label="Certification"
                  value={filters.certification}
                  options={CERTIFICATION_OPTIONS}
                  supported={support.certification}
                  unsupportedHint="Not returned for these candidates"
                  onChange={(value) => setFilters({ ...filters, certification: value as MatchFilterState["certification"] })}
                />
                <FilterSelect
                  id="mf-availability"
                  label="Availability"
                  value={filters.availability}
                  options={AVAILABILITY_OPTIONS}
                  supported={support.availability}
                  unsupportedHint="Not returned for these candidates"
                  onChange={(value) => setFilters({ ...filters, availability: value })}
                />
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    disabled={activeCount === 0}
                    onClick={() => setFilters(EMPTY_MATCH_FILTERS)}
                  >
                    Clear filters{activeCount > 0 ? ` (${activeCount})` : ""}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {visible.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <SearchX className="size-6" />
                </span>
                <p className="text-base font-semibold text-foreground">
                  {results.length === 0 ? "No candidates have been scored for this posting yet." : "No candidates match your current filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {visible.map((result, index) => (
                <MatchCard
                  key={result.candidate.id}
                  result={result}
                  jobId={activeJob}
                  demo={demo}
                  defaultOpen={index === 0}
                  onNotice={handleNotice}
                  onError={(message) => setActionError(message)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function EmployerMatchesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <AIMatchingContent />
    </Suspense>
  );
}
