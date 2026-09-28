"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCheck,
  CircleAlert,
  FileText,
  Hourglass,
  Inbox,
  MapPin,
  RefreshCw,
  Search,
  Timer,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  INSTITUTION_DEMO_MONTH,
  INSTITUTION_DEMO_TODAY,
  institutionNominationsSeed,
  institutionProgrammes,
  nominationWorkflow,
  type Nomination,
  type NominationStatus,
  type ProgrammeCode,
} from "@/lib/mock-data/institution";

type LoadState = "loading" | "ready" | "error";
type StatusFilter = "All" | NominationStatus;
type ProgrammeFilter = ProgrammeCode | "all";

const STATUS_TONE: Record<NominationStatus, string> = {
  Pending: "bg-warning/10 text-warning",
  Approved: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
};

const FILTERS: StatusFilter[] = ["All", "Pending", "Approved", "Rejected"];

/**
 * Prototype read model. There is no nomination API wired up yet, so this
 * resolves the local seed rows and is what the Refresh action re-runs.
 */
async function loadNominations(): Promise<Nomination[]> {
  return institutionNominationsSeed.map((row) => ({ ...row }));
}

function daysBetween(from: string, to: string): number {
  const diff = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.max(0, Math.round(diff / 86400000));
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function NominationsPage() {
  const [rows, setRows] = useState<Nomination[]>(() =>
    institutionNominationsSeed.map((row) => ({ ...row })),
  );
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");
  const [programme, setProgramme] = useState<ProgrammeFilter>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const pending = rows.filter((row) => row.status === "Pending");
  const approvedThisMonth = rows.filter(
    (row) => row.status === "Approved" && row.decidedOn?.startsWith(INSTITUTION_DEMO_MONTH),
  ).length;
  const rejected = rows.filter((row) => row.status === "Rejected").length;
  const decidedDurations = rows
    .map((row) => row.daysToDecide)
    .filter((value): value is number => value !== null);
  const avgApprovalDays = decidedDurations.length
    ? decidedDurations.reduce((sum, value) => sum + value, 0) / decidedDurations.length
    : 0;

  const counts: Record<StatusFilter, number> = {
    All: rows.length,
    Pending: pending.length,
    Approved: rows.filter((row) => row.status === "Approved").length,
    Rejected: rejected,
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "All" && row.status !== filter) return false;
      if (programme !== "all" && row.programmeCode !== programme) return false;
      if (!needle) return true;
      return (
        row.trainee.toLowerCase().includes(needle) ||
        row.society.toLowerCase().includes(needle) ||
        row.district.toLowerCase().includes(needle) ||
        row.programme.toLowerCase().includes(needle)
      );
    });
  }, [rows, filter, programme, query]);

  const volumeByProgramme = useMemo(
    () =>
      institutionProgrammes.map((item) => ({
        label: `${item.code} · ${item.title}`,
        value: rows.filter((row) => row.programmeCode === item.code).length,
      })),
    [rows],
  );

  const volumeByState = useMemo(() => {
    const tally = new Map<string, number>();
    for (const row of rows) tally.set(row.state, (tally.get(row.state) ?? 0) + 1);
    return [...tally.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const stepCounts = [
    rows.length,
    rows.length,
    pending.length,
    counts.Approved,
    rows.filter((row) => row.batchCode !== null).length,
  ];
  const activeStep = pending.length > 0 ? 2 : 3;

  function decide(ids: string[], status: NominationStatus) {
    setRows((prev) =>
      prev.map((row) =>
        ids.includes(row.id)
          ? {
              ...row,
              status,
              decidedOn: INSTITUTION_DEMO_TODAY,
              daysToDecide: daysBetween(row.submittedOn, INSTITUTION_DEMO_TODAY),
            }
          : row,
      ),
    );
    setSelected([]);
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((value) => value !== id)));
  }

  function clearFilters() {
    setFilter("All");
    setProgramme("all");
    setQuery("");
  }

  async function refresh() {
    setLoadState("loading");
    try {
      const next = await loadNominations();
      setRows(next);
      setSelected([]);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  const selectedIds = selected.filter((id) =>
    visible.some((row) => row.id === id && row.status === "Pending"),
  );
  const allVisibleSelected =
    visible.some((row) => row.status === "Pending") &&
    visible.filter((row) => row.status === "Pending").every((row) => selected.includes(row.id));
  const someVisibleSelected = selectedIds.length > 0 && !allVisibleSelected;

  const isFiltered = filter !== "All" || programme !== "all" || query.trim() !== "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programme Nominations"
        description="Review, approve and reject trainee nominations submitted by nominating cooperative societies."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="demo-data-tag">Demo dataset · {rows.length} nominations</span>
            <Button variant="outline" onClick={refresh} disabled={loadState === "loading"}>
              <RefreshCw
                className={loadState === "loading" ? "mr-2 size-4 animate-spin" : "mr-2 size-4"}
              />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending review"
          value={String(pending.length)}
          icon={Hourglass}
          trend={pending.length > 0 ? "Awaiting your decision" : "Review queue is clear"}
          trendTone={pending.length > 0 ? "neutral" : "up"}
        />
        <StatCard
          label={`Approved in ${formatMonthLabel(INSTITUTION_DEMO_MONTH)}`}
          value={String(approvedThisMonth)}
          icon={CheckCheck}
          trend={`${counts.Approved} approved in total`}
          trendTone="up"
        />
        <StatCard
          label="Rejected"
          value={String(rejected)}
          icon={X}
          trend="Seat held for the next nomination cycle"
          trendTone="down"
        />
        <StatCard
          label="Avg. approval time"
          value={`${avgApprovalDays.toFixed(1)} days`}
          icon={Timer}
          trend={`Across ${decidedDurations.length} decided nominations`}
          trendTone="neutral"
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="font-heading text-base">Nomination workflow</CardTitle>
          <CardDescription>
            A nomination moves through five gates before the trainee joins a live batch roster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {nominationWorkflow.map((step, index) => {
              const done = index < activeStep;
              const active = index === activeStep;
              return (
                <li
                  key={step.label}
                  className="flex gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <span
                    className={[
                      "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold",
                      done
                        ? "border-success/30 bg-success/10 text-success"
                        : active
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-muted text-foreground/60",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="mt-0.5 text-xs text-foreground/60">{step.description}</p>
                    <p className="mt-1.5 font-mono text-xs font-semibold text-primary">
                      {stepCounts[index]} nomination{stepCounts[index] === 1 ? "" : "s"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-heading text-base">Nomination register</CardTitle>
                <CardDescription>
                  Approve or reject a pending nomination, or select several and decide in one pass.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground/40" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search trainee, society, district"
                    aria-label="Search nominations"
                    className="h-9 pl-9"
                  />
                </div>
                <Select
                  value={programme}
                  onValueChange={(value) => setProgramme(String(value) as ProgrammeFilter)}
                >
                  <SelectTrigger size="sm" className="h-9 w-full sm:w-48" aria-label="Filter by programme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All programmes</SelectItem>
                    {institutionProgrammes.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadState === "error" ? (
              <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Could not load nominations</p>
                    <p className="mt-1 text-sm text-foreground/70">
                      The register did not resolve. Check your connection and try again.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>
                  Try again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                  {FILTERS.map((item) => (
                    <Button
                      key={item}
                      variant={filter === item ? "secondary" : "ghost"}
                      size="sm"
                      aria-pressed={filter === item}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                      <span className="ml-1.5 font-mono text-xs">{counts[item]}</span>
                    </Button>
                  ))}
                  {isFiltered && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-foreground">
                      <span className="font-mono font-semibold text-primary">
                        {selectedIds.length}
                      </span>{" "}
                      pending nomination{selectedIds.length === 1 ? "" : "s"} selected
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => decide(selectedIds, "Approved")}>
                        <Check className="mr-1.5 size-3.5" />
                        Approve selected
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => decide(selectedIds, "Rejected")}
                      >
                        <X className="mr-1.5 size-3.5" />
                        Reject selected
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                <NominationTable
                  rows={visible}
                  loadState={loadState}
                  selected={selected}
                  allVisibleSelected={allVisibleSelected}
                  someVisibleSelected={someVisibleSelected}
                  hasFilters={isFiltered}
                  onToggle={toggleSelected}
                  onToggleAll={(checked) =>
                    setSelected(
                      checked
                        ? [
                            ...new Set([
                              ...selected,
                              ...visible
                                .filter((row) => row.status === "Pending")
                                .map((row) => row.id),
                            ]),
                          ]
                        : selected.filter((id) => !visible.some((row) => row.id === id)),
                    )
                  }
                  onDecide={(id, status) => decide([id], status)}
                  onClearFilters={clearFilters}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Volume by programme</CardTitle>
              <CardDescription>All nominations received, by programme applied for.</CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBarList
                items={volumeByProgramme}
                valueFormatter={(value) => `${value} nomination${value === 1 ? "" : "s"}`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">State breakdown</CardTitle>
              <CardDescription>Where the nominating societies are based.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {volumeByState.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-foreground/60">
                  No state data yet.
                </p>
              ) : (
                <>
                  <HorizontalBarList
                    items={volumeByState}
                    barColorClassName="bg-chart-2"
                    valueFormatter={(value) => String(value)}
                  />
                  <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
                    {volumeByState.map((item) => (
                      <Badge key={item.label} variant="outline">
                        <MapPin className="size-3" />
                        {item.label} · {item.value}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatMonthLabel(month: string): string {
  const [year, monthPart] = month.split("-");
  const date = new Date(Date.UTC(Number(year), Number(monthPart) - 1, 1));
  return date.toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" });
}

function NominationTable({
  rows,
  loadState,
  selected,
  allVisibleSelected,
  someVisibleSelected,
  hasFilters,
  onToggle,
  onToggleAll,
  onDecide,
  onClearFilters,
}: {
  rows: Nomination[];
  loadState: LoadState;
  selected: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  hasFilters: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onDecide: (id: string, status: NominationStatus) => void;
  onClearFilters: () => void;
}) {
  if (loadState === "loading") {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex flex-col gap-2.5 p-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-4 rounded-[4px]" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-28" />
            </div>
          ))}
        </div>
        <p className="border-t border-border bg-muted/40 px-4 py-2 text-xs text-foreground/60">
          Loading nomination register…
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <span className="icon-tile-red size-10">
          <Inbox className="size-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            {hasFilters ? "No nominations match this filter" : "No nominations in this state"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-foreground/70">
            {hasFilters
              ? "Try a different status, programme, or search term to widen the register."
              : "Once a cooperative society submits a nomination form it will appear here for review."}
          </p>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected}
                onCheckedChange={onToggleAll}
                aria-label="Select all pending nominations"
              />
            </TableHead>
            <TableHead>Trainee</TableHead>
            <TableHead>Programme</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>State / District</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(row.id)}
                  disabled={row.status !== "Pending"}
                  onCheckedChange={(checked) => onToggle(row.id, checked)}
                  aria-label={`Select nomination for ${row.trainee}`}
                />
              </TableCell>
              <TableCell>
                <p className="font-medium text-foreground">{row.trainee}</p>
                <p className="text-xs text-foreground/60">{row.society}</p>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-foreground/70">{row.programmeCode}</span>
                <p className="max-w-[220px] truncate text-xs text-foreground/60">{row.programme}</p>
              </TableCell>
              <TableCell className="font-mono text-xs">{formatDate(row.submittedOn)}</TableCell>
              <TableCell>
                <p className="text-sm text-foreground">{row.state}</p>
                <p className="text-xs text-foreground/60">{row.district}</p>
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <Badge variant="secondary" className={STATUS_TONE[row.status]}>
                    {row.status}
                  </Badge>
                  {row.decidedOn && (
                    <span className="font-mono text-xs text-foreground/60">
                      {row.daysToDecide}d to decide
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {row.status === "Pending" ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDecide(row.id, "Approved")}
                    >
                      <Check className="mr-1.5 size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDecide(row.id, "Rejected")}
                    >
                      <X className="mr-1.5 size-3.5" />
                      Reject
                    </Button>
                  </div>
                ) : row.batchCode ? (
                  <span className="font-mono text-xs text-foreground/70">{row.batchCode}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-foreground/60">
                    <FileText className="size-3.5" />
                    {row.status === "Approved" ? "Awaiting enrolment" : "Seat released"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
