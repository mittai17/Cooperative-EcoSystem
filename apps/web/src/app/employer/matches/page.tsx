"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CircleAlert,
  FileCheck2,
  Gauge,
  GraduationCap,
  MapPin,
  RefreshCw,
  SearchX,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  EMPLOYER_DEMO_TODAY,
  EVIDENCE_BUDGET,
  MATCH_FACTORS,
  employerMatches,
  employerPostings,
  type CandidateMatch,
  type MatchFactorKey,
} from "@/lib/mock-data/employer";

type LoadState = "loading" | "ready" | "error";
type SortKey = "score" | "evidence" | "attendance" | "freshness";

const ALL_POSTINGS = "all-postings";
const SCORE_FLOORS = [
  { value: "0", label: "Any score" },
  { value: "65", label: "65 and above" },
  { value: "75", label: "75 and above" },
  { value: "80", label: "80 and above" },
] as const;

/** Colour ramp for a 0-100 score, kept in one place so the whole page agrees. */
function scoreTone(score: number): { text: string; chip: string; bar: string } {
  if (score >= 80) return { text: "text-success", chip: "bg-success/10 text-success", bar: "bg-success" };
  if (score >= 65) return { text: "text-primary", chip: "bg-primary/10 text-primary", bar: "bg-primary" };
  return { text: "text-warning", chip: "bg-warning/10 text-warning", bar: "bg-warning" };
}

function levelTone(level: string): string {
  if (level === "Expert") return "bg-success/10 text-success";
  if (level === "Proficient") return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
}

function certificateTone(status: string): string {
  if (status === "Valid") return "bg-success/10 text-success";
  if (status === "Expired") return "bg-destructive/10 text-destructive";
  return "bg-warning/10 text-warning";
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function matchesSearch(match: CandidateMatch, needle: string): boolean {
  if (!needle) return true;
  const haystack = [
    match.candidate.name,
    match.candidate.passportId,
    match.candidate.district,
    match.candidate.state,
    match.candidate.headline,
    match.posting.title,
    ...match.matched.map((item) => item.skill.name),
    ...match.gaps.map((item) => item.skill),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle.toLowerCase());
}

function MatchRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
      <Skeleton className="size-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-12 rounded-4xl" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function EmployerMatchesPage() {
  const [queue, setQueue] = useState<CandidateMatch[]>(() =>
    employerMatches.map((match) => ({ ...match })),
  );
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [postingFilter, setPostingFilter] = useState<string>(ALL_POSTINGS);
  const [scoreFloor, setScoreFloor] = useState<string>("0");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outreachGaps, setOutreachGaps] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // The queue is fetched on the server, so the first paint shows the skeleton and
  // the timer is cleared on unmount and on every manual refresh.
  useEffect(() => {
    const id = window.setTimeout(() => setLoadState("ready"), 450);
    return () => window.clearTimeout(id);
  }, []);

  const visible = useMemo(() => {
    const floor = Number(scoreFloor);
    const filtered = queue.filter(
      (match) =>
        (postingFilter === ALL_POSTINGS || match.posting.id === postingFilter) &&
        match.score >= floor &&
        matchesSearch(match, query),
    );
    return [...filtered].sort((a, b) => {
      if (sortKey === "score") return b.score - a.score;
      if (sortKey === "attendance") return b.attendancePct - a.attendancePct;
      if (sortKey === "freshness") return b.candidate.passportUpdatedOn.localeCompare(a.candidate.passportUpdatedOn);
      const aEvidence = a.rows.find((row) => row.key === "evidence")?.achieved ?? 0;
      const bEvidence = b.rows.find((row) => row.key === "evidence")?.achieved ?? 0;
      return bEvidence - aEvidence;
    });
  }, [postingFilter, query, queue, scoreFloor, sortKey]);

  const selected = useMemo(
    () => visible.find((match) => match.candidate.id === selectedId) ?? visible[0] ?? null,
    [selectedId, visible],
  );

  const stats = useMemo(() => {
    const scores = queue.map((match) => match.score);
    const covered = new Set(queue.map((match) => match.posting.id));
    const ready = queue.filter((match) => match.gaps.length === 0).length;
    return {
      total: queue.length,
      median: median(scores),
      covered: covered.size,
      ready,
      openings: employerPostings.reduce((sum, posting) => sum + posting.openings, 0),
    };
  }, [queue]);

  function refresh() {
    setLoadState("loading");
    setQueue(employerMatches.map((match) => ({ ...match })));
    setOutreachGaps([]);
    setNotice(null);
    const id = window.setTimeout(() => setLoadState("ready"), 450);
    // Refresh re-runs the same fetch, so the pending timer is stored for cleanup.
    window.setTimeout(() => window.clearTimeout(id), 0);
  }

  function toggleOutreach(skill: string, candidateName: string) {
    setOutreachGaps((previous) => {
      if (previous.includes(skill)) {
        setNotice(`${skill} removed from the training-plan shortlist.`);
        return previous.filter((item) => item !== skill);
      }
      setNotice(`${skill} added to the training-plan shortlist for ${candidateName}.`);
      return [...previous, skill];
    });
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="AI Match Queue"
          description="Explainable, evidence-backed candidate matching for your cooperative sector postings."
        />
        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-destructive">
            <CircleAlert className="size-5" />
            <p className="text-sm font-semibold">The match queue could not be loaded.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            No candidate data is available right now. Retry the queue to rebuild it from the demo
            dataset.
          </p>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Match Queue"
        description="Explainable, evidence-backed candidate matching for your cooperative sector postings. Every point of a score is traceable to a verified record on the trainee's Skill Passport."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Demo dataset · {EMPLOYER_DEMO_TODAY}</span>
            <Button
              variant="outline"
              onClick={refresh}
              disabled={loadState === "loading"}
              aria-label="Refresh the match queue"
            >
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">{notice}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Candidates in queue"
          value={String(stats.total)}
          icon={Users}
          trend={`Across ${employerPostings.length} live postings`}
        />
        <StatCard
          label="Median match score"
          value={`${stats.median}/100`}
          icon={Gauge}
          trend="Deterministic weights, no black box"
          trendTone="neutral"
        />
        <StatCard
          label="Postings with candidates"
          value={`${stats.covered}/${employerPostings.length}`}
          icon={Target}
          trend={`${stats.ready} candidate(s) clear every requirement`}
          trendTone={stats.covered === employerPostings.length ? "up" : "down"}
        />
        <StatCard
          label="Openings on platform"
          value={String(stats.openings)}
          icon={BriefcaseBusiness}
          trend="Seats you can fill from this queue"
          trendTone="neutral"
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Filter the queue</CardTitle>
          <CardDescription>
            The scorer only counts skills that an NCCT assessor has verified, so raising the floor
            never promotes a candidate on unverified claims.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="match-posting">Posting</Label>
            <Select value={postingFilter} onValueChange={(value) => setPostingFilter(String(value))}>
              <SelectTrigger id="match-posting" size="sm" className="w-full">
                <SelectValue placeholder="All postings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_POSTINGS}>All postings</SelectItem>
                {employerPostings.map((posting) => (
                  <SelectItem key={posting.id} value={posting.id}>
                    {posting.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match-floor">Minimum score</Label>
            <Select value={scoreFloor} onValueChange={(value) => setScoreFloor(String(value))}>
              <SelectTrigger id="match-floor" size="sm" className="w-full">
                <SelectValue placeholder="Any score" />
              </SelectTrigger>
              <SelectContent>
                {SCORE_FLOORS.map((floor) => (
                  <SelectItem key={floor.value} value={floor.value}>
                    {floor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match-sort">Rank by</Label>
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
              <SelectTrigger id="match-sort" size="sm" className="w-full">
                <SelectValue placeholder="Rank by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Match score</SelectItem>
                <SelectItem value="evidence">Evidence strength</SelectItem>
                <SelectItem value="attendance">Training attendance</SelectItem>
                <SelectItem value="freshness">Passport freshness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="match-search">Search</Label>
            <Input
              id="match-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, district, skill or posting"
            />
          </div>
        </CardContent>
      </Card>

      {loadState === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ranked candidates</CardTitle>
              <CardDescription>Re-scoring the queue against your filters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 5 }, (_, index) => (
                <MatchRowSkeleton key={index} />
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Score breakdown</CardTitle>
              <CardDescription>Loading the factor-by-factor working.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailSkeleton />
            </CardContent>
          </Card>
        </div>
      ) : visible.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <SearchX className="size-6" />
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">No candidate clears these filters</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {query
                  ? `Nothing matches "${query}" in this queue. Try a district, a skill name or the posting title.`
                  : "Lower the minimum score or widen the posting filter to see the rest of the queue."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setScoreFloor("0");
                  setPostingFilter(ALL_POSTINGS);
                }}
              >
                Reset filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Card className="shadow-sm">
            <CardHeader className="gap-1">
              <CardTitle className="text-base">Ranked candidates</CardTitle>
              <CardDescription>
                {visible.length} of {stats.total} candidates · scored {EMPLOYER_DEMO_TODAY}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {visible.map((match) => {
                const tone = scoreTone(match.score);
                const isSelected = selected?.candidate.id === match.candidate.id;
                return (
                  <button
                    key={`${match.candidate.id}-${match.posting.id}`}
                    type="button"
                    onClick={() => setSelectedId(match.candidate.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        tone.chip,
                      )}
                    >
                      {match.candidate.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {match.candidate.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {match.posting.title} · {match.candidate.district}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-4xl px-2 py-1 font-mono text-sm font-semibold",
                        tone.chip,
                      )}
                    >
                      {match.score}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {selected && (
            <div className="flex flex-col gap-4">
              <Card className="shadow-sm">
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">{selected.candidate.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="font-mono text-xs">{selected.candidate.passportId}</span>
                        {" · Passport updated "}
                        {formatDate(selected.candidate.passportUpdatedOn)}
                      </CardDescription>
                      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                        {selected.candidate.headline}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex size-16 flex-col items-center justify-center rounded-lg border border-border",
                          toneForScore(selected.score).chip,
                        )}
                      >
                        <span className="font-mono text-xl font-semibold leading-none">
                          {selected.score}
                        </span>
                        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide">
                          out of 100
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <BriefcaseBusiness className="size-3" />
                      {selected.posting.title}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="size-3" />
                      {selected.candidate.state} · {selected.candidate.district}
                    </Badge>
                    <Badge
                      className={cn(
                        "gap-1",
                        selected.gaps.length === 0
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning",
                      )}
                    >
                      {selected.gaps.length === 0 ? (
                        <ShieldCheck className="size-3" />
                      ) : (
                        <CircleAlert className="size-3" />
                      )}
                      {selected.gaps.length === 0
                        ? "All requirements met"
                        : `${selected.gaps.length} gap${selected.gaps.length > 1 ? "s" : ""} open`}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <GraduationCap className="size-3" />
                      {selected.candidate.sessionsAttended}/{selected.candidate.sessionsTotal} sessions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Training attendance</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {selected.attendancePct}%
                    </p>
                    <Progress value={selected.attendancePct} className="mt-2" />
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Average assessment</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {selected.averageAssessmentPct}%
                    </p>
                    <Progress value={selected.averageAssessmentPct} className="mt-2" />
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Verified skills</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {selected.candidate.skills.filter((skill) => skill.verified).length} of{" "}
                      {selected.candidate.skills.length}
                    </p>
                    <Progress
                      value={Math.round(
                        (selected.candidate.skills.filter((skill) => skill.verified).length /
                          Math.max(selected.candidate.skills.length, 1)) *
                          100,
                      )}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">How this score was built</CardTitle>
                  <CardDescription>
                    Five weighted factors, each reproducible by hand. The points column is rounded
                    per factor and the rounding residue is assigned to the heaviest factor, so the
                    five rows always add up to the headline score of {selected.score}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Factor</TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                          <TableHead className="text-right">Achieved</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.rows.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell className="font-medium text-foreground">
                              <span className="flex items-center gap-2">
                                {factorIcon(row.key)}
                                {row.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {Math.round(row.weight * 100)}%
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {row.achieved}%
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-foreground">
                              {row.points}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-semibold text-foreground">Total</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">100%</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">—</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-foreground">
                            {selected.score}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {selected.rows.map((row) => (
                      <div key={row.key} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{row.label}</p>
                          <span className="font-mono text-xs text-muted-foreground">
                            {row.points} pts
                          </span>
                        </div>
                        <Progress value={row.achieved} className="mt-2" />
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {row.basis}
                        </p>
                        <p className="mt-1.5 text-xs font-medium leading-relaxed text-foreground/80">
                          {row.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Weights are fixed in code and mirrored in the NCCT settings screen, so an auditor
                      can reproduce any score by hand. The semantic factor uses a deterministic
                      Sørensen–Dice overlap offline; the production matcher swaps in a sentence
                      embedding cosine without changing the reporting. Evidence is capped at{" "}
                      {EVIDENCE_BUDGET} points so a candidate cannot buy a higher score with volume
                      alone.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Verify before you hire</CardTitle>
                  <CardDescription>
                    Each claim is tied to a record an NCCT assessor or employer signed off.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="matched" className="w-full">
                    <TabsList variant="line" className="flex-wrap border-b border-border">
                      <TabsTrigger value="matched">Matched skills ({selected.matched.length})</TabsTrigger>
                      <TabsTrigger value="gaps">Gaps ({selected.gaps.length})</TabsTrigger>
                      <TabsTrigger value="evidence">Evidence</TabsTrigger>
                    </TabsList>

                    <TabsContent value="matched" className="mt-4">
                      {selected.matched.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                          No skill on this posting is verified on the passport yet.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {selected.matched.map(({ skill, certificateBacked }) => (
                            <li key={skill.name} className="rounded-lg border border-border p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{skill.name}</p>
                                <Badge className={levelTone(skill.level)}>{skill.level}</Badge>
                                {skill.verified ? (
                                  <Badge className="gap-1 bg-success/10 text-success">
                                    <BadgeCheck className="size-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-warning/10 text-warning">Not verified</Badge>
                                )}
                                {certificateBacked && (
                                  <Badge variant="secondary" className="gap-1">
                                    <Award className="size-3" />
                                    Certificate-backed
                                  </Badge>
                                )}
                                <span className="ml-auto font-mono text-xs text-muted-foreground">
                                  {skill.confidence}% confidence
                                </span>
                              </div>
                              <Progress value={skill.confidence} className="mt-2" />
                              <p className="mt-2 text-xs text-muted-foreground">
                                Evidenced by {skill.source.type.toLowerCase()} · {skill.source.title} ·{" "}
                                {skill.source.issuer} · {formatDate(skill.source.date)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TabsContent>

                    <TabsContent value="gaps" className="mt-4">
                      {selected.gaps.length === 0 ? (
                        <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-4">
                          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                          <p className="text-sm text-foreground">
                            Every requirement on this posting is verified on the passport. No training
                            plan is needed before a first interview.
                          </p>
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {selected.gaps.map((gap) => {
                            const flagged = outreachGaps.includes(gap.skill);
                            return (
                              <li
                                key={gap.skill}
                                className={cn(
                                  "rounded-lg border p-3",
                                  gap.mandatory ? "border-warning/40 bg-warning/5" : "border-border",
                                )}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-foreground">{gap.skill}</p>
                                  {gap.mandatory && (
                                    <Badge className="bg-destructive/10 text-destructive">
                                      Mandatory
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <BookOpen className="size-3.5" />
                                  <span className="font-medium text-foreground">{gap.course.title}</span>
                                  <span>· {gap.course.category}</span>
                                  <span>· {gap.course.level}</span>
                                  <span>· {gap.course.durationHours}h</span>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                                  {gap.reason}
                                </p>
                                <div className="mt-2.5 flex flex-wrap gap-2">
                                  <Button
                                    variant={flagged ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => toggleOutreach(gap.skill, selected.candidate.name)}
                                  >
                                    {flagged ? "On training-plan shortlist" : "Add to training plan"}
                                  </Button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </TabsContent>

                    <TabsContent value="evidence" className="mt-4 flex flex-col gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Certificates ({selected.candidate.certificates.length})
                        </p>
                        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Programme</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Valid until</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selected.candidate.certificates.map((certificate) => (
                                <TableRow key={certificate.id}>
                                  <TableCell>
                                    <span className="block font-medium text-foreground">
                                      {certificate.programme}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      {certificate.issuer}
                                    </span>
                                  </TableCell>
                                  <TableCell className="font-mono">{certificate.grade}</TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatDate(certificate.expiryDate)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={certificateTone(certificate.status)}>
                                      {certificate.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Graded assessments ({selected.candidate.assessments.length})
                        </p>
                        <ul className="mt-2 flex flex-col gap-2">
                          {selected.candidate.assessments.map((assessment) => {
                            const pct = Math.round((assessment.score / assessment.maxScore) * 100);
                            return (
                              <li key={assessment.id} className="rounded-lg border border-border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">{assessment.title}</p>
                                  <span className="font-mono text-sm font-semibold text-foreground">
                                    {assessment.score}/{assessment.maxScore} · {pct}%
                                  </span>
                                </div>
                                <Progress value={pct} className="mt-2" />
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                  {assessment.grader} · {formatDate(assessment.date)}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {selected.candidate.projects.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Project work ({selected.candidate.projects.length})
                          </p>
                          <ul className="mt-2 flex flex-col gap-2">
                            {selected.candidate.projects.map((project) => (
                              <li key={project.title} className="rounded-lg border border-border p-3">
                                <p className="text-sm font-medium text-foreground">{project.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{project.summary}</p>
                                <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-foreground/80">
                                  <FileCheck2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                                  {project.outcome}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selected.candidate.feedback.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Employer feedback ({selected.candidate.feedback.length})
                          </p>
                          <ul className="mt-2 flex flex-col gap-2">
                            {selected.candidate.feedback.map((feedback) => (
                              <li key={`${feedback.employer}-${feedback.submittedOn}`} className="rounded-lg border border-border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {feedback.employer} · {feedback.role}
                                  </p>
                                  <span className="flex items-center gap-1 font-mono text-sm font-semibold text-warning">
                                    <Star className="size-3.5 fill-warning" />
                                    {feedback.rating}/5
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Strengths: {feedback.strengths}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Watch-outs: {feedback.gaps}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Factor reference</CardTitle>
          <CardDescription>
            The published scoring contract. NCCT admins see the same weights in settings, so a
            published score can always be reproduced.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factor</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead>How it is measured</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MATCH_FACTORS.map((factor) => (
                  <TableRow key={factor.key}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {factorIcon(factor.key)}
                        {factor.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {Math.round(factor.weight * 100)}%
                    </TableCell>
                    <TableCell className="max-w-xl text-muted-foreground">{factor.basis}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Separator className="my-4" />
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <UserRoundSearch className="mt-0.5 size-4 shrink-0 text-primary" />
            Candidates shown are synthetic records created for this demonstration. No real trainee,
            employer or vacancy is represented, and the passport identifiers do not resolve to any
            government registry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Small icon per factor, reused in the breakdown table and the reference table. */
function factorIcon(key: MatchFactorKey) {
  const className = "size-4 shrink-0 text-primary";
  if (key === "mandatory") return <ShieldCheck className={className} />;
  if (key === "overlap") return <Target className={className} />;
  if (key === "depth") return <Gauge className={className} />;
  if (key === "evidence") return <FileCheck2 className={className} />;
  return <Sparkles className={className} />;
}

/** Wrapper so the header chip and the candidate avatar share one colour ramp. */
function toneForScore(score: number) {
  return scoreTone(score);
}
