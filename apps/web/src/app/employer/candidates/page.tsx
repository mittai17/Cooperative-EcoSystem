"use client";

import { useMemo, useState } from "react";
import { AlertCircle, RotateCcw, Search, SearchX } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { CandidateCard } from "@/components/employer/candidates/candidate-card";
import {
  EDUCATION_OPTIONS,
  EMPTY_CANDIDATE_FILTERS,
  EXPERIENCE_OPTIONS,
  MATCH_FLOOR_OPTIONS,
  PROFICIENCY_OPTIONS,
  applyCandidateFilters,
  countActiveFilters,
  type CandidateFilterState,
} from "@/components/employer/candidates/candidate-filters";
import { FilterSelect } from "@/components/employer/candidates/filter-select";
import { useResource } from "@/components/employer/candidates/use-resource";
import {
  type CandidateSummary,
  hasField,
  listMyJobs,
  searchCandidates,
} from "@/lib/employer/candidates-api";
import { useApi } from "@/lib/use-api";

interface ServerFilters {
  skill: string;
  location: string;
  verifiedOnly: boolean;
  jobId: string;
}

const NO_JOB = "none";
const SEARCH_LIMIT = 100;

function matchesText(candidate: CandidateSummary, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    candidate.name,
    candidate.occupation ?? "",
    candidate.location,
    candidate.education_level ?? "",
    ...(candidate.skills ?? []).map((skill) => skill.name),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

export default function CandidatesPage() {
  const api = useApi();
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ServerFilters>({ skill: "", location: "", verifiedOnly: false, jobId: "" });
  const [applied, setApplied] = useState<ServerFilters>({ skill: "", location: "", verifiedOnly: false, jobId: "" });
  const [filters, setFilters] = useState<CandidateFilterState>(EMPTY_CANDIDATE_FILTERS);
  const [notice, setNotice] = useState<string | null>(null);

  const jobs = useResource(() => listMyJobs(api), []);
  const results = useResource(
    () =>
      searchCandidates(api, {
        skill: applied.skill,
        location: applied.location,
        verified_only: applied.verifiedOnly,
        job_id: applied.jobId || undefined,
        limit: SEARCH_LIMIT,
      }),
    [JSON.stringify(applied)],
  );

  const records = useMemo(() => results.data ?? [], [results.data]);
  const support = useMemo(
    () => ({
      education: records.length === 0 || hasField(records, "education_level"),
      experience: records.length === 0 || hasField(records, "years_of_experience"),
      certification: records.length === 0 || hasField(records, "certificate_count"),
      availability: records.length === 0 || hasField(records, "availability"),
      proficiency: records.length === 0 || hasField(records, "skills"),
      match: applied.jobId !== "" && (records.length === 0 || hasField(records, "match_score")),
    }),
    [records, applied.jobId],
  );

  const visible = useMemo(
    () => applyCandidateFilters(records.filter((candidate) => matchesText(candidate, text.trim())), filters),
    [records, text, filters],
  );

  const hasAnyFilter =
    countActiveFilters(filters) > 0 ||
    text.trim() !== "" ||
    applied.skill !== "" ||
    applied.location !== "" ||
    applied.jobId !== "" ||
    applied.verifiedOnly;
  const jobTitle = jobs.data?.find((job) => job.id === applied.jobId)?.title;

  function applyServerFilters() {
    setApplied({ ...draft });
  }

  function clearAll() {
    setText("");
    setFilters(EMPTY_CANDIDATE_FILTERS);
    const cleared: ServerFilters = { skill: "", location: "", verifiedOnly: false, jobId: "" };
    setDraft(cleared);
    setApplied(cleared);
  }

  const jobOptions = [
    { value: NO_JOB, label: "No job (general search)" },
    ...(jobs.data ?? []).map((job) => ({ value: job.id, label: job.title })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Candidate Discovery"
        description="Find the best candidates from verified Skill Passports. Only trainees who opted in to employer visibility appear here."
      />

      {results.error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>{results.error}</AlertDescription>
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
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex flex-col gap-4 lg:flex-row lg:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              applyServerFilters();
            }}
          >
            <div className="relative flex-[2] space-y-1.5">
              <Label htmlFor="cand-search" className="text-xs font-medium text-muted-foreground">
                Search name, skill, role, location or education
              </Label>
              <Search className="pointer-events-none absolute bottom-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="cand-search"
                placeholder="e.g. Dairy Management, Bookkeeping, Anand"
                className="pl-9"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="cand-skill" className="text-xs font-medium text-muted-foreground">
                Skill (server)
              </Label>
              <Input
                id="cand-skill"
                placeholder="Skill name"
                value={draft.skill}
                onChange={(event) => setDraft({ ...draft, skill: event.target.value })}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="cand-location" className="text-xs font-medium text-muted-foreground">
                Location (server)
              </Label>
              <Input
                id="cand-location"
                placeholder="District or state"
                value={draft.location}
                onChange={(event) => setDraft({ ...draft, location: event.target.value })}
              />
            </div>
            <FilterSelect
              id="cand-job"
              label="Score against job"
              value={draft.jobId || NO_JOB}
              options={jobOptions}
              onChange={(value) => {
                const jobId = value === NO_JOB ? "" : value;
                const next = { ...draft, jobId };
                setDraft(next);
                setApplied(next);
              }}
            />
            <div className="flex items-center gap-2 pb-2">
              <Switch
                id="verified-only"
                checked={draft.verifiedOnly}
                onCheckedChange={(checked) => setDraft({ ...draft, verifiedOnly: Boolean(checked) })}
              />
              <Label htmlFor="verified-only" className="text-sm text-muted-foreground">
                Verified skills only
              </Label>
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-6">
            <FilterSelect
              id="f-proficiency"
              label="Skill proficiency"
              value={filters.proficiency}
              options={PROFICIENCY_OPTIONS}
              supported={support.proficiency}
              unsupportedHint="Not returned by search"
              onChange={(value) => setFilters({ ...filters, proficiency: value as CandidateFilterState["proficiency"] })}
            />
            <FilterSelect
              id="f-education"
              label="Education"
              value={filters.education}
              options={EDUCATION_OPTIONS}
              supported={support.education}
              unsupportedHint="Not returned by search"
              onChange={(value) => setFilters({ ...filters, education: value })}
            />
            <FilterSelect
              id="f-experience"
              label="Experience"
              value={String(filters.minExperience)}
              options={EXPERIENCE_OPTIONS}
              supported={support.experience}
              unsupportedHint="Not returned by search"
              onChange={(value) => setFilters({ ...filters, minExperience: Number(value) })}
            />
            <FilterSelect
              id="f-certification"
              label="Certification"
              value={filters.certification}
              options={[
                { value: "any", label: "Any" },
                { value: "yes", label: "Has certificate" },
              ]}
              supported={support.certification}
              unsupportedHint="Not returned by search"
              onChange={(value) => setFilters({ ...filters, certification: value as CandidateFilterState["certification"] })}
            />
            <FilterSelect
              id="f-availability"
              label="Availability"
              value={filters.availability}
              options={[
                { value: "any", label: "Any" },
                { value: "immediate", label: "Immediate" },
                { value: "30 days", label: "Within 30 days" },
              ]}
              supported={support.availability}
              unsupportedHint="Not returned by search"
              onChange={(value) => setFilters({ ...filters, availability: value })}
            />
            <FilterSelect
              id="f-match"
              label="Match score"
              value={String(filters.minMatch)}
              options={MATCH_FLOOR_OPTIONS}
              supported={support.match}
              unsupportedHint={applied.jobId ? "Not returned by search" : "Choose a job above to score"}
              onChange={(value) => setFilters({ ...filters, minMatch: Number(value) })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {results.loading
            ? "Searching verified Skill Passports..."
            : `Showing ${visible.length} of ${records.length} candidate${records.length === 1 ? "" : "s"}${
                jobTitle ? ` scored against ${jobTitle}` : ""
              }`}
        </p>
        <Button variant="ghost" size="sm" onClick={clearAll} disabled={!hasAnyFilter}>
          <RotateCcw />
          Clear filters
        </Button>
      </div>

      {results.loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : results.error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-foreground">Candidates could not be loaded</p>
            <Button variant="outline" onClick={results.reload}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <SearchX className="size-6" />
            </span>
            <p className="text-base font-semibold text-foreground">No candidates match your current filters.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Try clearing a filter or searching for a broader skill or location.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              jobId={applied.jobId || undefined}
              onError={(message) => setNotice(message)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
