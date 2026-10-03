"use client";

/**
 * Transport Plans — list and quick-action page.
 * Supports: search, status filter, sort, pagination, empty state.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Search, RefreshCw, Inbox, ChevronRight,
  CalendarDays, Users, Truck, MoreHorizontal, CheckCircle2, XCircle, Eye,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import { PlanStatusBadge } from "@/components/logistics/status-badges";
import type { TransportPlan, PlanStatus } from "@/lib/logistics/types";

const PAGE_SIZE = 15;

const ALL_STATUSES: (PlanStatus | "All")[] = [
  "All", "Draft", "Pending Approval", "Approved", "Published", "Needs Review", "Cancelled", "Completed",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TransportPlansPage() {
  const [plans, setPlans] = useState<TransportPlan[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    setPlans(logisticsService.getPlans());
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return plans.filter((p) => {
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        p.linkedLabel.toLowerCase().includes(needle) ||
        p.coordinatorName.toLowerCase().includes(needle)
      );
    });
  }, [plans, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isFiltered = query.trim() !== "" || statusFilter !== "All";

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setPage(1);
  }

  function handlePublish(planId: string) {
    const result = logisticsService.publishPlan(planId, "Published from plans list");
    if (!result.ok) setActionError(result.error);
  }

  function handleCancel(planId: string) {
    const result = logisticsService.transitionPlanStatus(planId, "Cancelled", "Cancelled by coordinator from plans list");
    if (!result.ok) setActionError(result.error);
  }

  // Status counts for the filter pills
  const counts: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = { All: plans.length };
    plans.forEach((p) => { map[p.status] = (map[p.status] ?? 0) + 1; });
    return map;
  }, [plans]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transport Plans"
        description="Create and manage transport plans for programmes, exams and events."
        action={
          <Button render={<Link href="/institution/logistics/plans/new" />}>
            <Plus className="size-4 mr-1.5" />
            New Plan
          </Button>
        }
      />

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <XCircle className="size-4 mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">{actionError}</p>
          <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={() => setActionError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-base">All Plans</CardTitle>
              <CardDescription>{filtered.length} plan{filtered.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="plans-search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Search plans, programmes…"
                  className="pl-9 h-9"
                  aria-label="Search transport plans"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => { setStatusFilter(v as PlanStatus | "All"); setPage(1); }}
              >
                <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "All" ? "All statuses" : s}
                      {counts[s] !== undefined && (
                        <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                          {counts[s]}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFiltered && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={refresh} aria-label="Refresh plans">
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!ready ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="icon-tile-red size-10">
                <Inbox className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {isFiltered ? "No plans match this filter" : "No transport plans yet"}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {isFiltered ? "Try a different status or search term." : "Create a plan to start managing logistics."}
              </p>
              {!isFiltered && (
                <Button variant="outline" size="sm" render={<Link href="/institution/logistics/plans/new" />}>
                  Create first plan
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Linked to</TableHead>
                    <TableHead>Service date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((plan) => (
                    <TableRow
                      key={plan.id}
                      className={cn(
                        plan.status === "Needs Review" && "bg-destructive/5",
                        plan.status === "Cancelled" && "opacity-60",
                      )}
                    >
                      <TableCell>
                        <Link
                          href={`/institution/logistics/plans/${plan.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {plan.title}
                        </Link>
                        {plan.needsReviewReason && (
                          <p className="mt-0.5 text-xs text-destructive line-clamp-1">{plan.needsReviewReason}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                        {plan.linkedLabel}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                          {formatDate(plan.serviceDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {plan.transportType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="size-3.5 text-muted-foreground shrink-0" />
                          {plan.passengerEstimate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PlanStatusBadge status={plan.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {plan.coordinatorName}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Actions for ${plan.title}`}
                                id={`plan-actions-${plan.id}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem render={<Link href={`/institution/logistics/plans/${plan.id}`} />}>
                              <Eye className="size-3.5 mr-2" /> View / Edit
                            </DropdownMenuItem>
                            {["Draft", "Approved"].includes(plan.status) && (
                              <DropdownMenuItem onClick={() => handlePublish(plan.id)}>
                                <CheckCircle2 className="size-3.5 mr-2 text-success" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {!["Cancelled", "Completed"].includes(plan.status) && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleCancel(plan.id)}
                              >
                                <XCircle className="size-3.5 mr-2" />
                                Cancel Plan
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} plans
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
