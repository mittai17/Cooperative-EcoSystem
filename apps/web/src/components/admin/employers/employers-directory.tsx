"use client";

import { Briefcase, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminToolbar } from "@/components/admin/shared/admin-toolbar";
import { Pager } from "@/components/admin/shared/pager";
import { StatusPill } from "@/components/admin/shared/status-pill";
import {
  EmptyRows,
  ListCard,
  ListNotice,
  PersonAvatar,
  TableLoading,
} from "@/components/admin/trainers/people-ui";
import { errorMessage } from "@/components/admin/trainers/people-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listEmployers, type PersonRow } from "@/lib/admin/admin-api";

const PAGE_SIZE = 10;

// Demo rows mirror the backend row shape. Only company-level fields are shown here;
// candidate data is never part of this screen.
const DEMO_EMPLOYERS: PersonRow[] = [
  { id: "demo-emp-1", full_name: "Amul Dairy Products", email: "", role: "employer", organisation_id: null, organisation_name: "Amul Dairy Products", state: "Gujarat", status: "active", created_at: "2026-01-09T10:00:00Z" },
  { id: "demo-emp-2", full_name: "NCDC Partner Network", email: "", role: "employer", organisation_id: null, organisation_name: "NCDC Partner Network", state: "Delhi", status: "active", created_at: "2026-02-17T10:00:00Z" },
  { id: "demo-emp-3", full_name: "Saras Dairy Co-op", email: "", role: "employer", organisation_id: null, organisation_name: "Saras Dairy Co-op", state: "Rajasthan", status: "active", created_at: "2026-03-25T10:00:00Z" },
  { id: "demo-emp-4", full_name: "GCMMF Logistics", email: "", role: "employer", organisation_id: null, organisation_name: "GCMMF Logistics", state: "Maharashtra", status: "active", created_at: "2026-04-30T10:00:00Z" },
  { id: "demo-emp-5", full_name: "Karnataka Agri Hub", email: "", role: "employer", organisation_id: null, organisation_name: "Karnataka Agri Hub", state: "Karnataka", status: "inactive", created_at: "2025-12-02T10:00:00Z" },
];

function formatJoined(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function EmployersDirectory() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);

  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [rows, setRows] = useState<PersonRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PersonRow | null>(null);

  const requestKey = JSON.stringify([query, page, pageSize, reloadKey]);
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
    listEmployers({ q: query || undefined, page, page_size: pageSize })
      .then((res) => {
        if (cancelled) return;
        setRows(res.items);
        setTotal(res.total);
        setError(null);
        setSettledKey(requestKey);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(errorMessage(err, "Could not load employers."));
        setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [query, page, pageSize, reloadKey, requestKey]);

  const demoFiltered = useMemo(() => {
    const q = query.toLowerCase();
    return DEMO_EMPLOYERS.filter(
      (e) => !q || e.full_name.toLowerCase().includes(q) || (e.state ?? "").toLowerCase().includes(q),
    );
  }, [query]);

  const usingDemo = error !== null;
  const visibleRows = usingDemo ? demoFiltered.slice((page - 1) * pageSize, page * pageSize) : rows;
  const visibleTotal = usingDemo ? demoFiltered.length : total;
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize));

  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Briefcase}
        title="Employers"
        description="Employer partners registered on the platform."
      />

      {usingDemo ? (
        <ListNotice message={`${error} Showing sample rows.`} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : null}

      <ListCard
        toolbar={
          <AdminToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search employers..."
            onReset={resetFilters}
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
          <TableLoading label="Loading employers" />
        ) : visibleRows.length === 0 ? (
          <EmptyRows message={query ? "No employers match this search." : "No employers have been registered yet."} />
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((employer, index) => (
                <TableRow key={employer.id}>
                  <TableCell className="text-muted-foreground">{(page - 1) * pageSize + index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={employer.full_name} />
                      <span className="font-medium text-foreground">{employer.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{employer.organisation_name || "—"}</TableCell>
                  <TableCell>{employer.state || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatJoined(employer.created_at)}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={employer.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => setDetail(employer)}>
                        <Eye className="size-3.5" aria-hidden="true" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ListCard>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.full_name}</DialogTitle>
            <DialogDescription>{detail?.organisation_name || "No organisation recorded"}</DialogDescription>
          </DialogHeader>
          {detail ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">State</dt>
              <dd>{detail.state || "—"}</dd>
              <dt className="text-muted-foreground">Joined</dt>
              <dd>{formatJoined(detail.created_at)}</dd>
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
