"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EllipsisVertical, Eye, Plus, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminSelect, AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { Pager } from "@/components/admin/shared/pager";
import { StatusPill } from "@/components/admin/shared/status-pill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listTrainers, type PersonRow } from "@/lib/admin/admin-api";

import { EmptyRows, ListCard, ListNotice, PersonAvatar, TableLoading } from "./people-ui";
import {
  PERSON_STATUS_OPTIONS,
  STATE_OPTIONS,
  SUBJECT_OPTIONS,
  errorMessage,
  statusParam,
} from "./people-utils";

const PAGE_SIZE = 10;
const ALL = "all";

/** The backend row has no subjects yet, so live rows show "—" in the Subjects column. */
type TrainerRow = PersonRow & { subjects?: string[] };

// Demo rows mirror the backend row shape, plus subjects for the fallback view only.
const DEMO_TRAINERS: TrainerRow[] = [
  { id: "demo-t1", full_name: "Dr. Meera Shah", email: "meera.shah@example.org", role: "trainer", organisation_id: null, organisation_name: "Amul Dairy Training Centre", state: "Gujarat", status: "active", created_at: "2026-01-12T10:00:00Z", subjects: ["Dairy Management", "Food Safety"] },
  { id: "demo-t2", full_name: "Amit Verma", email: "amit.verma@example.org", role: "trainer", organisation_id: null, organisation_name: "Sahakar Bharati College", state: "Karnataka", status: "active", created_at: "2026-02-03T10:00:00Z", subjects: ["Cooperative Management"] },
  { id: "demo-t3", full_name: "Kiran Deshmukh", email: "kiran.deshmukh@example.org", role: "trainer", organisation_id: null, organisation_name: "VAMNICOM", state: "Maharashtra", status: "active", created_at: "2026-03-20T10:00:00Z", subjects: ["Supply Chain", "Agri Business"] },
  { id: "demo-t4", full_name: "Neha Patel", email: "neha.patel@example.org", role: "trainer", organisation_id: null, organisation_name: "Gujarat Cooperative College", state: "Gujarat", status: "active", created_at: "2026-04-08T10:00:00Z", subjects: ["Digital Skills"] },
  { id: "demo-t5", full_name: "Rahul Thakur", email: "rahul.thakur@example.org", role: "trainer", organisation_id: null, organisation_name: "NCCU Training Institute", state: "Delhi", status: "inactive", created_at: "2025-11-30T10:00:00Z", subjects: ["Cooperative Management"] },
  { id: "demo-t6", full_name: "Sunita Iyer", email: "sunita.iyer@example.org", role: "trainer", organisation_id: null, organisation_name: "Kerala Rural Institute", state: "Kerala", status: "active", created_at: "2026-05-14T10:00:00Z", subjects: ["Rural Development"] },
];

export function TrainersDirectory() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState(ALL);
  const [state, setState] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);

  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [rows, setRows] = useState<TrainerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<TrainerRow | null>(null);

  const requestKey = JSON.stringify([query, subject, state, status, page, pageSize, reloadKey]);
  const loading = settledKey !== requestKey;

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    listTrainers({
      q: query || undefined,
      subject: subject === ALL ? undefined : subject,
      state: state === ALL ? undefined : state,
      status: statusParam(status),
      page,
      page_size: pageSize,
    })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
        setTotal(res.total);
        setError(null);
        setSettledKey(requestKey);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(errorMessage(err, "Could not load trainers."));
        setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [query, subject, state, status, page, pageSize, reloadKey, requestKey]);

  // When the API fails, filter and page the demo rows locally so the screen stays complete.
  const demoFiltered = useMemo(() => {
    const q = query.toLowerCase();
    return DEMO_TRAINERS.filter(
      (t) =>
        (!q || t.full_name.toLowerCase().includes(q) || (t.organisation_name ?? "").toLowerCase().includes(q)) &&
        (subject === ALL || (t.subjects ?? []).includes(subject)) &&
        (state === ALL || t.state === state) &&
        (status === ALL || t.status === status),
    );
  }, [query, subject, state, status]);

  const usingDemo = error !== null;
  const visibleRows: TrainerRow[] = usingDemo
    ? demoFiltered.slice((page - 1) * pageSize, page * pageSize)
    : rows;
  const visibleTotal = usingDemo ? demoFiltered.length : total;
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize));
  const hasFilters = query !== "" || subject !== ALL || state !== ALL || status !== ALL;

  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setSubject(ALL);
    setState(ALL);
    setStatus(ALL);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Users}
        title="Trainers"
        description="Manage registered trainers."
        action={
          <Button render={<Link href="/admin/trainers/new" />}>
            <Plus className="size-4" aria-hidden="true" />
            Add Trainer
          </Button>
        }
      />

      {usingDemo ? (
        <ListNotice message={`${error} Showing sample rows.`} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : null}

      <ListCard
        toolbar={
          <AdminToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search trainers..."
            onReset={resetFilters}
            filters={
              <>
                <FilterSelect
                  label="Filter by subject"
                  value={subject}
                  allLabel="All Subjects"
                  options={SUBJECT_OPTIONS.map((s) => ({ value: s, label: s }))}
                  onChange={(v) => {
                    setSubject(v);
                    setPage(1);
                  }}
                />
                <FilterSelect
                  label="Filter by state"
                  value={state}
                  allLabel="All States"
                  options={STATE_OPTIONS.map((s) => ({ value: s, label: s }))}
                  onChange={(v) => {
                    setState(v);
                    setPage(1);
                  }}
                />
                <FilterSelect
                  label="Filter by status"
                  value={status}
                  allLabel="All Status"
                  options={PERSON_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                />
              </>
            }
          />
        }
        pager={
          <Pager
            page={page}
            pageCount={pageCount}
            total={visibleTotal}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      >
        {loading ? (
          <TableLoading label="Loading trainers" />
        ) : visibleRows.length === 0 ? (
          <EmptyRows message={hasFilters ? "No trainers match these filters." : "No trainers have been registered yet."} />
        ) : (
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((trainer, index) => {
                const subjectText = trainer.subjects?.join(", ") ?? "";
                return (
                  <TableRow key={trainer.id}>
                    <TableCell className="text-muted-foreground">{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={trainer.full_name} />
                        <span className="font-medium text-foreground">{trainer.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{trainer.organisation_name || "—"}</TableCell>
                    <TableCell className="max-w-56">
                      <span className="block truncate" title={subjectText || undefined}>
                        {subjectText || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{trainer.state || "—"}</TableCell>
                    <TableCell>
                      <StatusPill status={trainer.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetail(trainer)}>
                          <Eye className="size-3.5" aria-hidden="true" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${trainer.full_name}`} />
                            }
                          >
                            <EllipsisVertical className="size-4" aria-hidden="true" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail(trainer)}>View details</DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!trainer.email}
                              onClick={() => {
                                if (trainer.email) window.location.href = `mailto:${trainer.email}`;
                              }}
                            >
                              Email trainer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ListCard>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.full_name}</DialogTitle>
            <DialogDescription>{detail?.organisation_name || "No institution assigned"}</DialogDescription>
          </DialogHeader>
          {detail ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{detail.email || "—"}</dd>
              <dt className="text-muted-foreground">Subjects</dt>
              <dd>{detail.subjects?.join(", ") || "—"}</dd>
              <dt className="text-muted-foreground">State</dt>
              <dd>{detail.state || "—"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusPill status={detail.status} />
              </dd>
            </dl>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <AdminSelect label={label} value={value} onChange={onChange} options={[{ value: ALL, label: allLabel }, ...options]} />
  );
}
