"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileWarning,
  Inbox,
  MapPin,
  MessageSquareQuote,
  RefreshCw,
  SearchX,
  Sparkles,
  UserRoundCheck,
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
  APPLICATION_STAGES,
  EMPLOYER_DEMO_TODAY,
  employerApplicationsSeed,
  employerPostings,
  pipelineFunnel,
  type ApplicationStage,
  type JobApplication,
} from "@/lib/mock-data/employer";

type LoadState = "loading" | "ready" | "error";
type StageFilter = ApplicationStage | "All";

const ALL_POSTINGS = "all-postings";
const STAGE_FILTERS: StageFilter[] = ["All", ...APPLICATION_STAGES];

const STAGE_TONE: Record<ApplicationStage, string> = {
  Applied: "bg-primary/10 text-primary",
  Shortlisted: "bg-primary/10 text-primary",
  Interviewed: "bg-warning/10 text-warning",
  Offered: "bg-warning/10 text-warning",
  Hired: "bg-success/10 text-success",
};

const DOCUMENT_TONE: Record<string, string> = {
  "On file": "bg-success/10 text-success",
  "Pending verification": "bg-warning/10 text-warning",
  "Not uploaded": "bg-destructive/10 text-destructive",
};

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function nextStage(stage: ApplicationStage): ApplicationStage | null {
  const index = APPLICATION_STAGES.indexOf(stage);
  const following = APPLICATION_STAGES[index + 1];
  return following ?? null;
}

function previousStage(stage: ApplicationStage): ApplicationStage | null {
  const index = APPLICATION_STAGES.indexOf(stage);
  if (index <= 0) return null;
  return APPLICATION_STAGES[index - 1] ?? null;
}

function postingTitle(jobId: string): string {
  return employerPostings.find((posting) => posting.id === jobId)?.title ?? jobId;
}

function stageRank(stage: ApplicationStage): number {
  return APPLICATION_STAGES.indexOf(stage);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
}

function matchesSearch(application: JobApplication, needle: string): boolean {
  if (!needle) return true;
  return [
    application.applicant.name,
    application.applicant.passportId,
    application.applicant.district,
    application.applicant.state,
    application.applicant.headline,
    postingTitle(application.jobId),
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle.toLowerCase());
}

function BoardSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {APPLICATION_STAGES.map((stage) => (
        <div key={stage} className="rounded-lg border border-border bg-muted/30 p-3">
          <Skeleton className="h-4 w-24" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>(() =>
    employerApplicationsSeed.map((application) => ({
      ...application,
      history: application.history.map((event) => ({ ...event })),
      documents: application.documents.map((document) => ({ ...document })),
    })),
  );
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [postingFilter, setPostingFilter] = useState<string>(ALL_POSTINGS);
  const [stageFilter, setStageFilter] = useState<StageFilter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setLoadState("ready"), 450);
    return () => window.clearTimeout(id);
  }, []);

  const visible = useMemo(
    () =>
      applications.filter(
        (application) =>
          (postingFilter === ALL_POSTINGS || application.jobId === postingFilter) &&
          (stageFilter === "All" || application.stage === stageFilter) &&
          matchesSearch(application, query),
      ),
    [applications, postingFilter, query, stageFilter],
  );

  const funnel = useMemo(() => pipelineFunnel(visible), [visible]);

  const selected = useMemo(
    () => visible.find((application) => application.id === selectedId) ?? visible[0] ?? null,
    [selectedId, visible],
  );

  const stats = useMemo(() => {
    const engaged = applications.filter((application) => stageRank(application.stage) >= 1).length;
    const interviewed = applications.filter((application) => stageRank(application.stage) >= 2).length;
    const hires = applications.filter((application) => application.stage === "Hired").length;
    return {
      total: applications.length,
      engaged,
      interviewed,
      hires,
      median: median(applications.map((application) => application.applicant.matchScore)),
      feedbackDue: applications.filter(
        (application) => application.hired && !application.feedbackSubmitted,
      ).length,
    };
  }, [applications]);

  function moveApplication(application: JobApplication, to: ApplicationStage) {
    const onward = stageRank(to) > stageRank(application.stage);
    setApplications((previous) =>
      previous.map((item) =>
        item.id === application.id
          ? {
              ...item,
              stage: to,
              hired: to === "Hired",
              updatedOn: EMPLOYER_DEMO_TODAY,
              history: [
                ...item.history,
                {
                  stage: to,
                  on: EMPLOYER_DEMO_TODAY,
                  note: onward
                    ? `Employer team moved this application to ${to} on ${formatDate(EMPLOYER_DEMO_TODAY)}.`
                    : `Employer team reopened this application at ${to} on ${formatDate(EMPLOYER_DEMO_TODAY)}.`,
                },
              ],
            }
          : item,
      ),
    );
    setSelectedId(application.id);
    setNotice(
      onward
        ? `${application.applicant.name} advanced to ${to}.`
        : `${application.applicant.name} moved back to ${to}.`,
    );
  }

  function logFeedback(application: JobApplication) {
    setApplications((previous) =>
      previous.map((item) =>
        item.id === application.id
          ? {
              ...item,
              feedbackSubmitted: true,
              updatedOn: EMPLOYER_DEMO_TODAY,
              history: [
                ...item.history,
                {
                  stage: "Hired",
                  on: EMPLOYER_DEMO_TODAY,
                  note: "Post-hire feedback logged, closing the training-to-employment loop for this trainee.",
                },
              ],
            }
          : item,
      ),
    );
    setNotice(
      `Post-hire feedback logged for ${application.applicant.name}. The trainee's passport now carries employer feedback.`,
    );
  }

  function reset() {
    setApplications(
      employerApplicationsSeed.map((application) => ({
        ...application,
        history: application.history.map((event) => ({ ...event })),
        documents: application.documents.map((document) => ({ ...document })),
      })),
    );
    setLoadState("loading");
    setSelectedId(null);
    setNotice(null);
    setQuery("");
    setStageFilter("All");
    setPostingFilter(ALL_POSTINGS);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applications & Hiring Pipeline"
        description="Move candidates through the pipeline, check that every document is verified, and close the loop with post-hire feedback that flows back to the trainee's Skill Passport."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Demo dataset · {EMPLOYER_DEMO_TODAY}</span>
            <Button variant="outline" onClick={reset} disabled={loadState === "loading"}>
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
              Reset pipeline
            </Button>
          </div>
        }
      />

      {notice && (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <UserRoundCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">{notice}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={String(stats.total)}
          icon={Inbox}
          trend={`Median match score ${stats.median}/100`}
          trendTone="neutral"
        />
        <StatCard
          label="Engaged by the team"
          value={String(stats.engaged)}
          icon={Users}
          trend="Shortlisted or beyond"
          trendTone="up"
        />
        <StatCard
          label="Interviews and above"
          value={String(stats.interviewed)}
          icon={CalendarClock}
          trend={`${stats.hires} offer${stats.hires === 1 ? "" : "s"} accepted`}
          trendTone="up"
        />
        <StatCard
          label="Feedback outstanding"
          value={String(stats.feedbackDue)}
          icon={MessageSquareQuote}
          trend={stats.feedbackDue === 0 ? "Every hire is closed out" : "Hires without employer feedback"}
          trendTone={stats.feedbackDue === 0 ? "up" : "down"}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="gap-3">
          <CardTitle className="text-base">Filter the pipeline</CardTitle>
          <CardDescription>
            Stage counts, the funnel and the board all read from the same application records, so
            nothing on this page can drift out of sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="app-posting">Posting</Label>
              <Select
                value={postingFilter}
                onValueChange={(value) => setPostingFilter(String(value))}
              >
                <SelectTrigger id="app-posting" size="sm" className="w-full">
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
              <Label htmlFor="app-stage">Stage</Label>
              <Select
                value={stageFilter}
                onValueChange={(value) => setStageFilter(value as StageFilter)}
              >
                <SelectTrigger id="app-stage" size="sm" className="w-full">
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_FILTERS.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-search">Search</Label>
              <Input
                id="app-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, passport id, district"
              />
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Funnel for the {visible.length} application(s) in view
            </p>
            <div className="mt-3">
              <HorizontalBarList
                items={funnel.map((row) => ({ label: row.stage, value: row.count }))}
                valueFormatter={(value) => String(value)}
                barColorClassName="bg-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loadState === "loading" ? (
        <BoardSkeleton />
      ) : visible.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <SearchX className="size-6" />
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">No application matches these filters</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {query
                  ? `Nothing in the pipeline matches "${query}".`
                  : "No application currently sits in that stage for this posting."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStageFilter("All");
                setPostingFilter(ALL_POSTINGS);
              }}
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[64rem] grid-cols-5 gap-3">
              {APPLICATION_STAGES.map((stage) => {
                const cards = visible.filter((application) => application.stage === stage);
                return (
                  <section
                    key={stage}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3"
                    aria-label={`${stage} column, ${cards.length} application(s)`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-sm font-semibold text-foreground">{stage}</h2>
                        <span
                          className={cn(
                            "rounded-4xl px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                            STAGE_TONE[stage],
                          )}
                        >
                          {cards.length}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {funnel.find((row) => row.stage === stage)?.conversionPct ?? 0}% of applied
                      </span>
                    </div>

                    {cards.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                        Nothing at this stage right now.
                      </p>
                    ) : (
                      cards.map((application) => {
                        const isSelected = selected?.id === application.id;
                        const blocked = application.documents.some(
                          (document) => document.status !== "On file",
                        );
                        return (
                          <article
                            key={application.id}
                            className={cn(
                              "rounded-lg border bg-card p-3 shadow-sm",
                              isSelected ? "border-primary" : "border-border",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedId(application.id)}
                              className="w-full text-left"
                              aria-label={`Open ${application.applicant.name}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {application.applicant.name}
                                </p>
                                <span className="shrink-0 rounded-4xl bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                                  {application.applicant.matchScore}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {postingTitle(application.jobId)}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="size-3" />
                                {application.applicant.district}, {application.applicant.state}
                              </p>
                            </button>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <Badge variant="outline" className="text-[11px]">
                                {application.source}
                              </Badge>
                              {blocked ? (
                                <Badge className="gap-1 bg-warning/10 text-warning text-[11px]">
                                  <FileWarning className="size-3" />
                                  Documents pending
                                </Badge>
                              ) : (
                                <Badge className="gap-1 bg-success/10 text-success text-[11px]">
                                  <BadgeCheck className="size-3" />
                                  Verified
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                disabled={!previousStage(application.stage)}
                                onClick={() => {
                                  const back = previousStage(application.stage);
                                  if (back) moveApplication(application, back);
                                }}
                                aria-label={`Move ${application.applicant.name} back one stage`}
                              >
                                <ArrowLeft className="size-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 flex-1 px-2 text-xs"
                                disabled={!nextStage(application.stage)}
                                onClick={() => {
                                  const onward = nextStage(application.stage);
                                  if (onward) moveApplication(application, onward);
                                }}
                              >
                                {nextStage(application.stage) ?? "Pipeline complete"}
                                {nextStage(application.stage) && <ArrowRight className="size-3.5" />}
                              </Button>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </section>
                );
              })}
            </div>
          </div>

          {selected && (
            <Card className="shadow-sm">
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{selected.applicant.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <span className="font-mono text-xs">{selected.applicant.passportId}</span>
                      {" · "}
                      {postingTitle(selected.jobId)}
                    </CardDescription>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                      {selected.applicant.headline}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={STAGE_TONE[selected.stage]}>{selected.stage}</Badge>
                    <Badge variant="secondary">Applied {formatDate(selected.appliedOn)}</Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Clock3 className="size-3" />
                      Updated {formatDate(selected.updatedOn)}
                    </Badge>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Match score at submission</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {selected.applicant.matchScore}/100
                    </p>
                    <Progress value={selected.applicant.matchScore} className="mt-2" />
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Verified skills on passport</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {selected.applicant.verifiedSkillCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Training attendance</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                      {selected.applicant.attendancePct}%
                    </p>
                    <Progress value={selected.applicant.attendancePct} className="mt-2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!previousStage(selected.stage)}
                    onClick={() => {
                      const back = previousStage(selected.stage);
                      if (back) moveApplication(selected, back);
                    }}
                  >
                    <ArrowLeft className="size-4" />
                    Move back
                  </Button>
                  <Button
                    size="sm"
                    disabled={!nextStage(selected.stage)}
                    onClick={() => {
                      const onward = nextStage(selected.stage);
                      if (onward) moveApplication(selected, onward);
                    }}
                  >
                    {nextStage(selected.stage) === "Hired" ? "Confirm hire" : "Advance stage"}
                    {nextStage(selected.stage) && <ArrowRight className="size-4" />}
                  </Button>
                  <span className="text-xs text-muted-foreground">Notice period {selected.noticePeriod}</span>
                  {selected.hired && !selected.feedbackSubmitted && (
                    <Button variant="secondary" size="sm" onClick={() => logFeedback(selected)}>
                      <MessageSquareQuote className="size-4" />
                      Log post-hire feedback
                    </Button>
                  )}
                  {selected.hired && selected.feedbackSubmitted && (
                    <Badge className="gap-1 bg-success/10 text-success">
                      <BadgeCheck className="size-3" />
                      Loop closed, feedback on passport
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">Documents</p>
                  <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selected.documents.map((document) => (
                          <TableRow key={document.id}>
                            <TableCell>
                              <span className="flex items-center gap-2 font-medium text-foreground">
                                <FileCheck2 className="size-4 text-muted-foreground" />
                                {document.label}
                              </span>
                              <span className="text-xs text-muted-foreground">{document.kind}</span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {document.reference}
                            </TableCell>
                            <TableCell>
                              <Badge className={DOCUMENT_TONE[document.status]}>
                                {document.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(document.updatedOn)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {selected.documents.some((document) => document.status !== "On file") && (
                    <p className="mt-2 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs leading-relaxed text-foreground/80">
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                      NCCT verification is still open on at least one document. Confirm the hire only
                      once the certificate bundle shows a verified status, otherwise the Skill Passport
                      record will disagree with your offer letter.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">Stage history</p>
                  <ol className="mt-2 flex flex-col gap-2">
                    {selected.history.map((event, index) => (
                      <li key={`${event.stage}-${event.on}-${index}`} className="flex gap-3">
                        <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                          {index + 1}
                        </span>
                        <div className="rounded-lg border border-border px-3 py-2">
                          <p className="text-sm font-medium text-foreground">
                            {event.stage}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {formatDate(event.on)}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {event.note}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <Separator />

                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  Applications, match scores and documents here are synthetic demonstration records.
                  Confirming a hire on this screen is a local demo action and does not notify NCCT or
                  any real candidate.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
