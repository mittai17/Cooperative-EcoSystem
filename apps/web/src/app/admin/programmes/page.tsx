"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  IndianRupee,
  MapPin,
  RefreshCw,
  SearchX,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
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
import { cn } from "@/lib/utils";
import {
  ADMIN_DEMO_TODAY,
  adminProgrammesSeed,
  adminTrainersSeed,
  nationalTotals,
  stateRollup,
  trainerById,
  type AdminProgramme,
  type ProgrammeHealth,
} from "@/lib/mock-data/admin";

type LoadState = "loading" | "ready" | "error";
type HealthFilter = ProgrammeHealth | "All";

const ALL_STATES = "all-states";
const HEALTH_FILTERS: HealthFilter[] = ["All", "On track", "Needs attention", "At risk"];

const HEALTH_TONE: Record<ProgrammeHealth, string> = {
  "On track": "bg-success/10 text-success",
  "Needs attention": "bg-warning/10 text-warning",
  "At risk": "bg-destructive/10 text-destructive",
};

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

/**
 * Copies the seed records into component state. A malformed or empty dataset is
 * a real failure, so it is thrown and surfaced instead of rendering an empty
 * register that looks like a genuine "no programmes" result.
 */
function hydrateProgrammes(): AdminProgramme[] {
  if (!Array.isArray(adminProgrammesSeed) || adminProgrammesSeed.length === 0) {
    throw new Error("Programme seed dataset is empty or malformed");
  }
  return adminProgrammesSeed.map((programme) => ({ ...programme }));
}

export default function AdminProgrammesPage() {
  const [programmes, setProgrammes] = useState<AdminProgramme[]>(() =>
    adminProgrammesSeed.map((programme) => ({ ...programme })),
  );
  const [reviewsLogged, setReviewsLogged] = useState<Record<string, string>>({});
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>(ALL_STATES);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("All");
  const [sortKey, setSortKey] = useState<"enrolled" | "placement" | "attendance" | "review">("enrolled");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        setProgrammes(hydrateProgrammes());
        setLoadState("ready");
      } catch (error) {
        console.error("NCCT programme register failed to load", error);
        setLoadState("error");
      }
    }, 450);
    return () => window.clearTimeout(id);
  }, []);

  const states = useMemo(
    () => [...new Set(programmes.map((programme) => programme.state))].sort((a, b) => a.localeCompare(b)),
    [programmes],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = programmes.filter((programme) => {
      const matchesQuery =
        needle.length === 0 ||
        [programme.name, programme.sector, programme.partnerInstitution, programme.state]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesState = stateFilter === ALL_STATES || programme.state === stateFilter;
      const matchesHealth = healthFilter === "All" || programme.health === healthFilter;
      return matchesQuery && matchesState && matchesHealth;
    });
    return [...filtered].sort((a, b) => {
      if (sortKey === "placement") return placementRate(b) - placementRate(a);
      if (sortKey === "attendance") return a.attendancePct - b.attendancePct;
      if (sortKey === "review") return a.nextReview.localeCompare(b.nextReview);
      return b.enrolled - a.enrolled;
    });
  }, [healthFilter, programmes, query, sortKey, stateFilter]);

  const selected = useMemo(
    () => visible.find((programme) => programme.id === selectedId) ?? visible[0] ?? null,
    [selectedId, visible],
  );

  const stats = useMemo(() => {
    const totals = nationalTotals(programmes, [], adminTrainersSeed, []);
    const atRisk = programmes.filter((programme) => programme.health === "At risk").length;
    const needsAttention = programmes.filter(
      (programme) => programme.health === "Needs attention",
    ).length;
    return {
      ...totals,
      atRisk,
      needsAttention,
      reviewDue: programmes.filter((programme) => programme.nextReview <= "2026-10-05").length,
    };
  }, [programmes]);

  const rollup = useMemo(() => stateRollup(programmes), [programmes]);

  function logReview(programme: AdminProgramme) {
    setReviewsLogged((previous) => ({ ...previous, [programme.id]: ADMIN_DEMO_TODAY }));
    setNotice(
      `Review logged for ${programme.name} on ${formatDate(ADMIN_DEMO_TODAY)}. The partner institute has been asked for the action plan.`,
    );
  }

  function reset() {
    setProgrammes(hydrateProgrammes());
    setReviewsLogged({});
    setQuery("");
    setStateFilter(ALL_STATES);
    setHealthFilter("All");
    setSelectedId(null);
    setNotice(null);
    setLoadState("loading");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programme Oversight"
        description="Every NCCT partner programme with its seats, quality signals, budget burn and the next action the oversight desk has to take."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Demo dataset · {ADMIN_DEMO_TODAY}</span>
            <Button variant="outline" onClick={reset} disabled={loadState === "loading"}>
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
              Reset
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">{notice}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Partner programmes"
          value={String(stats.programmeCount)}
          icon={Building2}
          trend={`${stats.institutionCount} institutes across ${stats.stateCount} states`}
          trendTone="neutral"
        />
        <StatCard
          label="Seats filled"
          value={pct(stats.enrolled, stats.seats) + "%"}
          icon={Users}
          trend={`${stats.enrolled} of ${stats.seats} seats`}
          trendTone={pct(stats.enrolled, stats.seats) >= 80 ? "up" : "down"}
        />
        <StatCard
          label="Placement rate"
          value={`${stats.placementRatePct}%`}
          icon={TrendingUp}
          trend={`${stats.placed} placed of ${stats.certified} certified`}
          trendTone={stats.placementRatePct >= 60 ? "up" : "down"}
        />
        <StatCard
          label="Needs intervention"
          value={String(stats.atRisk + stats.needsAttention)}
          icon={AlertTriangle}
          trend={`${stats.atRisk} at risk, ${stats.needsAttention} to watch`}
          trendTone={stats.atRisk > 0 ? "down" : "up"}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Filter programmes</CardTitle>
          <CardDescription>
            Health is derived from attendance, assessment and placement, so a programme cannot look
            healthy by editing a single field.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="prog-state">State</Label>
            <Select value={stateFilter} onValueChange={(value) => setStateFilter(String(value))}>
              <SelectTrigger id="prog-state" size="sm" className="w-full">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATES}>All states</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-health">Health</Label>
            <Select
              value={healthFilter}
              onValueChange={(value) => setHealthFilter(value as HealthFilter)}
            >
              <SelectTrigger id="prog-health" size="sm" className="w-full">
                <SelectValue placeholder="All health bands" />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_FILTERS.map((band) => (
                  <SelectItem key={band} value={band}>
                    {band}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-sort">Rank by</Label>
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as typeof sortKey)}>
              <SelectTrigger id="prog-sort" size="sm" className="w-full">
                <SelectValue placeholder="Rank by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrolled">Trainees enrolled</SelectItem>
                <SelectItem value="placement">Placement rate</SelectItem>
                <SelectItem value="attendance">Lowest attendance</SelectItem>
                <SelectItem value="review">Next review date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-search">Search</Label>
            <Input
              id="prog-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Programme, sector or institute"
            />
          </div>
        </CardContent>
      </Card>

      {loadState === "loading" ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Programme register</CardTitle>
            <CardDescription>Loading partner records.</CardDescription>
          </CardHeader>
          <CardContent>
            <TableSkeleton />
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <SearchX className="size-6" />
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">No programme matches these filters</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {query
                  ? `No programme name, sector or institute matches "${query}".`
                  : "No programme in the register sits in that health band for this state."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStateFilter(ALL_STATES);
                setHealthFilter("All");
              }}
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="shadow-sm">
            <CardHeader className="gap-1">
              <CardTitle className="text-base">Programme register</CardTitle>
              <CardDescription>
                {visible.length} of {stats.programmeCount} programmes · {stats.reviewDue} review(s) due
                by 5 Oct 2026
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Programme</TableHead>
                      <TableHead>Institute &amp; state</TableHead>
                      <TableHead className="min-w-[9rem]">Seats</TableHead>
                      <TableHead className="text-right">Certified</TableHead>
                      <TableHead className="text-right">Placed</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Next review</TableHead>
                      <TableHead>Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((programme) => {
                      const isSelected = selected?.id === programme.id;
                      return (
                        <TableRow
                          key={programme.id}
                          onClick={() => setSelectedId(programme.id)}
                          className={cn("cursor-pointer", isSelected && "bg-primary/5")}
                        >
                          <TableCell>
                            <span className="block font-medium text-foreground">{programme.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {programme.sector} · {programme.level} · {programme.mode}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="block text-sm text-foreground">
                              {programme.partnerInstitution}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {programme.state}
                            </span>
                          </TableCell>
                          <TableCell>
                            <p className="font-mono text-sm text-foreground">
                              {programme.enrolled}/{programme.seats}
                            </p>
                            <Progress value={pct(programme.enrolled, programme.seats)} className="mt-1.5" />
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-foreground">
                            {programme.certified}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-foreground">
                            {programme.placed}
                            <span className="block text-[11px] text-muted-foreground">
                              {placementRate(programme)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <p
                              className={cn(
                                "font-mono text-sm",
                                programme.attendancePct >= 80
                                  ? "text-foreground"
                                  : "text-destructive",
                              )}
                            >
                              {programme.attendancePct}%
                            </p>
                            <Progress value={programme.attendancePct} className="mt-1.5" />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(programme.nextReview)}
                            {reviewsLogged[programme.id] && (
                              <span className="mt-0.5 block text-[11px] text-success">
                                Reviewed {formatDate(reviewsLogged[programme.id])}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={HEALTH_TONE[programme.health]}>{programme.health}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {selected && (
              <Card className="shadow-sm">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">{selected.name}</CardTitle>
                  <CardDescription>
                    {selected.sector} · {selected.level} · {selected.mode} ·{" "}
                    {selected.durationWeeks} weeks
                  </CardDescription>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge className={HEALTH_TONE[selected.health]}>{selected.health}</Badge>
                    <Badge variant="secondary">{selected.cohorts} cohorts</Badge>
                    <Badge variant="secondary">
                      {trainerById(adminTrainersSeed, selected.leadTrainerId)?.name ??
                        "Lead trainer unassigned"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Window</dt>
                      <dd className="font-medium text-foreground">
                        {formatDate(selected.startedOn)} → {formatDate(selected.endsOn)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Trainers engaged</dt>
                      <dd className="font-medium text-foreground">{selected.trainerCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Completed</dt>
                      <dd className="font-mono font-medium text-foreground">
                        {selected.completed}/{selected.enrolled}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Placement rate</dt>
                      <dd className="font-mono font-medium text-foreground">
                        {placementRate(selected)}%
                      </dd>
                    </div>
                  </dl>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <IndianRupee className="size-4 text-muted-foreground" />
                        Budget burn
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Rs {selected.spentLakh}L / Rs {selected.budgetLakh}L
                      </span>
                    </div>
                    <Progress
                      value={pct(selected.spentLakh, selected.budgetLakh)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">Quality signals</p>
                    <div className="mt-2 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Attendance</span>
                          <span className="font-mono">{selected.attendancePct}%</span>
                        </div>
                        <Progress value={selected.attendancePct} className="mt-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Assessment average</span>
                          <span className="font-mono">{selected.assessmentPct}%</span>
                        </div>
                        <Progress value={selected.assessmentPct} className="mt-1" />
                      </div>
                    </div>
                  </div>

                  {selected.actionNeeded ? (
                    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                      <p className="flex items-start gap-2 text-sm font-medium text-foreground">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                        Action needed
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {selected.actionNeeded}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                      <p className="flex items-start gap-2 text-sm font-medium text-foreground">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        No open action on this programme
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => logReview(selected)}>
                      <CalendarClock className="size-4" />
                      Log review
                    </Button>
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="size-3" />
                      {selected.certified} verified certificates issued
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Placements by state</CardTitle>
                <CardDescription>Confirmed hires across the programmes in view.</CardDescription>
              </CardHeader>
              <CardContent>
                <HorizontalBarList
                  items={rollup.map((row) => ({ label: row.state, value: row.placed }))}
                  valueFormatter={(value) => `${value} placed`}
                />
                <Separator className="my-4" />
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {rollup.slice(0, 3).map((row) => (
                    <li key={row.state} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <BadgeCheck className="size-3.5 text-primary" />
                        {row.state}
                      </span>
                      <span className="font-mono">{row.placementRatePct}% of certified placed</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {loadState === "error" && (
        <Card className="border-destructive/30 shadow-sm">
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <p className="text-sm font-semibold text-destructive">
              The programme register could not be loaded.
            </p>
            <p className="text-sm text-muted-foreground">
              No oversight figures are available. Reset the register to rebuild it from the demo
              dataset.
            </p>
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        Programme figures on this screen are synthetic demonstration records built for the prototype.
        They are not audited scheme statistics and must not be cited as official NCCT numbers.
      </p>
    </div>
  );
}

/** Share of certified trainees from a programme who have been placed. */
function placementRate(programme: AdminProgramme): number {
  if (programme.certified === 0) return 0;
  return Math.round((programme.placed / programme.certified) * 100);
}
