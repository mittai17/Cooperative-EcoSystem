"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EllipsisVertical, Eye, Plus, ShieldCheck } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/shared/admin-page-header";
import { AdminSelect, AdminToolbar } from "@/components/admin/shared/admin-toolbar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listUsers, updateUser, type AdminUser, type PlatformRole } from "@/lib/admin/admin-api";

import { ROLE_OPTIONS, roleLabel, roleParam } from "./user-roles";

const PAGE_SIZE = 10;
const ALL = "all";
type RoleFilter = PlatformRole | typeof ALL;

// Demo rows mirror the backend user row shape, using the six backend roles.
const DEMO_USERS: AdminUser[] = [
  { id: "demo-u1", full_name: "Admin User", email: "admin@ncct.gov.in", role: "ncct_admin", organisation_id: null, organisation_name: null, state: null, status: "active", created_at: "2025-06-01T10:00:00Z", last_active: "2026-10-03T08:30:00Z" },
  { id: "demo-u2", full_name: "Priya Singh", email: "priya.singh@ncct.gov.in", role: "institution", organisation_id: null, organisation_name: null, state: null, status: "active", created_at: "2025-08-14T10:00:00Z", last_active: "2026-10-02T17:10:00Z" },
  { id: "demo-u3", full_name: "Rohan Mehta", email: "rohan.mehta@ncct.gov.in", role: "admin", organisation_id: null, organisation_name: null, state: null, status: "active", created_at: "2025-09-03T10:00:00Z", last_active: "2026-10-01T11:45:00Z" },
  { id: "demo-u4", full_name: "Anjali Rao", email: "anjali.rao@ncct.gov.in", role: "employer", organisation_id: null, organisation_name: null, state: null, status: "active", created_at: "2025-10-22T10:00:00Z", last_active: "2026-09-29T09:20:00Z" },
  { id: "demo-u5", full_name: "Vikram Joshi", email: "vikram.joshi@ncct.gov.in", role: "trainer", organisation_id: null, organisation_name: null, state: null, status: "inactive", created_at: "2025-12-05T10:00:00Z", last_active: "2026-08-14T14:00:00Z" },
];

function formatLastActive(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function UsersDirectory() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [reloadKey, setReloadKey] = useState(0);

  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Demo rows live in state so status changes made on the fallback still behave.
  const [demoRows, setDemoRows] = useState<AdminUser[]>(DEMO_USERS);
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const requestKey = JSON.stringify([query, role, page, pageSize, reloadKey]);
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
    listUsers({
      q: query || undefined,
      role: roleParam(role),
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
        setError(errorMessage(err, "Could not load users."));
        setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [query, role, page, pageSize, reloadKey, requestKey]);

  const demoFiltered = useMemo(() => {
    const q = query.toLowerCase();
    return demoRows.filter(
      (u) =>
        (!q || u.full_name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)) &&
        (role === ALL || u.role === role),
    );
  }, [demoRows, query, role]);

  const usingDemo = error !== null;
  const visibleRows = usingDemo ? demoFiltered.slice((page - 1) * pageSize, page * pageSize) : rows;
  const visibleTotal = usingDemo ? demoFiltered.length : total;
  const pageCount = Math.max(1, Math.ceil(visibleTotal / pageSize));
  const hasFilters = query !== "" || role !== ALL;

  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setRole(ALL);
    setPage(1);
  };

  // The backend PATCH accepts only role and is_active.
  const toggleActive = async (user: AdminUser) => {
    const nextActive = user.status !== "active";
    setActionError(null);
    setPendingId(user.id);
    try {
      if (usingDemo) {
        setDemoRows((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextActive ? "active" : "inactive" } : u)));
      } else {
        const updated: AdminUser = await updateUser(user.id, { is_active: nextActive });
        setRows((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
      }
    } catch (err: unknown) {
      setActionError(errorMessage(err, "Could not update the user status."));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={ShieldCheck}
        title="User Management"
        description="Manage admin users and access control."
        action={
          <Button render={<Link href="/admin/user-management/new" />}>
            <Plus className="size-4" aria-hidden="true" />
            Add User
          </Button>
        }
      />

      {usingDemo ? (
        <ListNotice message={`${error} Showing sample rows.`} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : null}

      {actionError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <ListCard
        toolbar={
          <AdminToolbar
            search={search}
            onSearch={setSearch}
            placeholder="Search users..."
            onReset={resetFilters}
            filters={
              <AdminSelect
                label="Filter by role"
                value={role}
                onChange={(value) => {
                  setRole(roleParam(value) ?? ALL);
                  setPage(1);
                }}
                options={[{ value: ALL, label: "All Roles" }, ...ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))]}
              />
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
          <TableLoading label="Loading users" />
        ) : visibleRows.length === 0 ? (
          <EmptyRows message={hasFilters ? "No users match these filters." : "No users have been added yet."} />
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="text-muted-foreground">{(page - 1) * pageSize + index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={user.full_name} />
                      <span className="font-medium text-foreground">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{roleLabel(user.role)}</TableCell>
                  <TableCell>
                    <StatusPill status={user.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDetail(user)}>
                        <Eye className="size-3.5" aria-hidden="true" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label={`More actions for ${user.full_name}`} />}
                        >
                          <EllipsisVertical className="size-4" aria-hidden="true" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetail(user)}>View details</DropdownMenuItem>
                          <DropdownMenuItem disabled={pendingId === user.id} onClick={() => void toggleActive(user)}>
                            {user.status === "active" ? "Deactivate user" : "Activate user"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <DialogDescription>{detail?.email || "No email recorded"}</DialogDescription>
          </DialogHeader>
          {detail ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Role</dt>
              <dd>{roleLabel(detail.role)}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusPill status={detail.status} />
              </dd>
              <dt className="text-muted-foreground">Last active</dt>
              <dd>{formatLastActive(detail.last_active)}</dd>
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
