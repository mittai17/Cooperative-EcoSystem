"use client";

/**
 * Requests & Approvals page
 * Coordinator can approve, reject, or request more info.
 * Decision requires a note. Approved requests show a link to the linked plan.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Search, RefreshCw, Inbox, CheckCircle2, XCircle, MessageSquare,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { logisticsService } from "@/lib/logistics/logistics-service";
import { RequestStatusBadge } from "@/components/logistics/status-badges";
import type { TransportRequest, RequestStatus } from "@/lib/logistics/types";

const ALL_STATUSES: (RequestStatus | "All")[] = [
  "All", "Submitted", "Under Review", "More Info Required", "Approved", "Rejected", "Draft", "Withdrawn",
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "All">("Submitted");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Decision modal state
  const [decisionReq, setDecisionReq] = useState<TransportRequest | null>(null);
  const [decisionType, setDecisionType] = useState<"Approved" | "Rejected" | "More Info Required">("Approved");
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  function refresh() {
    setRequests(logisticsService.getRequests());
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const unsub = logisticsService.subscribe(refresh);
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "All" && r.approvalStatus !== statusFilter) return false;
      if (!needle) return true;
      return (
        r.requesterName.toLowerCase().includes(needle) ||
        r.eventLabel.toLowerCase().includes(needle) ||
        r.requestCode.toLowerCase().includes(needle)
      );
    });
  }, [requests, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: requests.length };
    requests.forEach((r) => { map[r.approvalStatus] = (map[r.approvalStatus] ?? 0) + 1; });
    return map;
  }, [requests]);

  function openDecision(req: TransportRequest, type: "Approved" | "Rejected" | "More Info Required") {
    setDecisionReq(req);
    setDecisionType(type);
    setDecisionNote("");
    setDecisionError(null);
  }

  function submitDecision() {
    if (!decisionReq) return;
    setDeciding(true);
    const result = logisticsService.decideRequest(
      decisionReq.id,
      decisionType,
      decisionNote,
      "Sanjay Kulkarni (demo coordinator)",
    );
    if (!result.ok) { setDecisionError(result.error); setDeciding(false); return; }
    setDecisionReq(null);
    setDeciding(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Requests & Approvals"
        description="Review transport requests from trainers and staff."
        action={
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="size-4 mr-1.5" /> Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-base">All Requests</CardTitle>
              <CardDescription>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Search requests…"
                  className="pl-9 h-9"
                  aria-label="Search requests"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as RequestStatus | "All"); setPage(1); }}>
                <SelectTrigger className="h-9 w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "All" ? "All statuses" : s}
                      {counts[s] !== undefined && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{counts[s]}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!ready ? (
            <div className="p-4 flex flex-col gap-2">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="icon-tile-red size-10"><Inbox className="size-5" /></span>
              <p className="text-sm text-muted-foreground">No requests match this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Event / Programme</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Passengers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((req) => {
                    const canDecide = ["Submitted", "Under Review"].includes(req.approvalStatus);
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-xs">{req.requestCode}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{req.requesterName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{req.requesterRole}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                          {req.eventLabel}
                        </TableCell>
                        <TableCell className="text-sm">{fmtDate(req.requestedDate)}</TableCell>
                        <TableCell className="font-mono text-sm">{req.passengerEstimate}</TableCell>
                        <TableCell><RequestStatusBadge status={req.approvalStatus} /></TableCell>
                        <TableCell>
                          {canDecide && (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-success border-success/30 hover:bg-success/10"
                                onClick={() => openDecision(req, "Approved")}
                                aria-label={`Approve request ${req.requestCode}`}
                                id={`approve-${req.id}`}
                              >
                                <CheckCircle2 className="size-3.5 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-tint-violet-fg border-tint-violet-fg/30 hover:bg-tint-violet-bg"
                                onClick={() => openDecision(req, "More Info Required")}
                                aria-label={`Request more info for ${req.requestCode}`}
                                id={`moreinfo-${req.id}`}
                              >
                                <MessageSquare className="size-3.5 mr-1" /> More info
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => openDecision(req, "Rejected")}
                                aria-label={`Reject request ${req.requestCode}`}
                                id={`reject-${req.id}`}
                              >
                                <XCircle className="size-3.5 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                          {!canDecide && req.decisionNote && (
                            <p className="text-xs text-muted-foreground text-right max-w-[160px] ml-auto truncate">
                              {req.decisionNote}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision modal */}
      <Dialog open={!!decisionReq} onOpenChange={(o) => !o && setDecisionReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionType === "Approved" ? "Approve" : decisionType === "Rejected" ? "Reject" : "Request More Info"}
            </DialogTitle>
            <DialogDescription>
              {decisionReq?.requestCode} · {decisionReq?.requesterName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground space-y-1">
              <p><strong>Event:</strong> {decisionReq?.eventLabel}</p>
              <p><strong>Date:</strong> {decisionReq?.requestedDate}</p>
              <p><strong>Passengers:</strong> {decisionReq?.passengerEstimate}</p>
              <p><strong>Route:</strong> {decisionReq?.origin} → {decisionReq?.destination}</p>
            </div>

            {decisionError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
                <XCircle className="size-4 shrink-0" /> {decisionError}
              </div>
            )}

            <div>
              <Label htmlFor="decision-note">Decision note *</Label>
              <Textarea
                id="decision-note"
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Explain your decision to the requester…"
                rows={3}
                className="mt-1.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDecisionReq(null)}>Cancel</Button>
              <Button
                onClick={submitDecision}
                disabled={deciding || !decisionNote.trim()}
                className={cn(
                  decisionType === "Rejected" && "bg-destructive hover:bg-destructive/90",
                  decisionType === "Approved" && "bg-success hover:bg-success/90 text-success-foreground",
                )}
                id="decision-submit"
              >
                {deciding ? "Saving…" : `Confirm ${decisionType}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
