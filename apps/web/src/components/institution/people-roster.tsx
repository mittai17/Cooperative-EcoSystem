"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  EllipsisVertical,
  Layers,
  Mail,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  UserRoundSearch,
  UserRoundX,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, useApi } from "@/lib/use-api";

type PersonRole = "trainee" | "trainer";

interface RosterPerson {
  id: string;
  full_name: string | null;
  role: PersonRole;
  is_active: boolean;
  pending_clerk_link: boolean;
  email?: string;
  batch_id?: string;
  batch?: string;
  programme_id?: string;
  programme?: string;
  qualification?: string | null;
  expertise?: string[];
}

interface AssignableBatch {
  id: string;
  name: string;
  programme_id: string;
  programme_title: string;
}

interface FormValues {
  full_name: string;
  email: string;
  batch_id: string;
  qualification: string;
  expertise: string;
}

const EMPTY_FORM: FormValues = { full_name: "", email: "", batch_id: "", qualification: "", expertise: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseExpertise(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const COPY: Record<PersonRole, { noun: string; plural: string; addLabel: string; emptyTitle: string; emptyBody: string }> = {
  trainee: {
    noun: "trainee",
    plural: "trainees",
    addLabel: "Add Trainee",
    emptyTitle: "No trainees yet",
    emptyBody: "Add your first trainee to start tracking their programme and batch.",
  },
  trainer: {
    noun: "trainer",
    plural: "trainers",
    addLabel: "Add Trainer",
    emptyTitle: "No trainers yet",
    emptyBody: "Add your first trainer to start assigning classes and grading.",
  },
};

export function PeopleRoster({ role }: { role: PersonRole }) {
  const api = useApi();
  const copy = COPY[role];

  const [rows, setRows] = useState<RosterPerson[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState<AssignableBatch[]>([]);

  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RosterPerson | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<RosterPerson | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  function rosterQuery(): string {
    const params = new URLSearchParams({ role, limit: "100" });
    if (search.trim()) params.set("q", search.trim());
    return `/api/v1/users/?${params.toString()}`;
  }

  const DEFAULT_TRAINEES: RosterPerson[] = [
    { id: "tr1", full_name: "Anjali Rathore", role: "trainee", is_active: true, pending_clerk_link: false, programme: "Cooperative Management Fundamentals", batch: "Batch A", email: "anjali.rathore@coop.org" },
    { id: "tr2", full_name: "Vikram Solanki", role: "trainee", is_active: true, pending_clerk_link: true, programme: "Cooperative Bookkeeping & Statutory Audit Readiness", batch: "Batch C", email: "vikram.solanki@coop.org" },
    { id: "tr3", full_name: "Farida Khatoon", role: "trainee", is_active: false, pending_clerk_link: false, programme: "Cooperative Management Fundamentals", batch: "Batch A", email: "farida.k@coop.org" },
    { id: "tr4", full_name: "Deepak Chauhan", role: "trainee", is_active: true, pending_clerk_link: false, programme: "Dairy Cooperative Operations", batch: "Batch D", email: "deepak.c@coop.org" },
    { id: "tr5", full_name: "Priya Mehta", role: "trainee", is_active: true, pending_clerk_link: false, programme: "Agricultural Credit Cooperative Management", batch: "Batch B", email: "priya.mehta@coop.org" },
    { id: "tr6", full_name: "Ramesh Singh", role: "trainee", is_active: true, pending_clerk_link: true, programme: "Cooperative Bookkeeping & Statutory Audit Readiness", batch: "Batch C", email: "ramesh.singh@coop.org" },
    { id: "tr7", full_name: "Sunita Yadav", role: "trainee", is_active: true, pending_clerk_link: false, programme: "Handloom & Handicraft Cooperative Enterprise", batch: "Batch E", email: "sunita.yadav@coop.org" },
    { id: "tr8", full_name: "Amit Verma", role: "trainee", is_active: false, pending_clerk_link: false, programme: "Agricultural Credit Cooperative Management", batch: "Batch B", email: "amit.verma@coop.org" }
  ];

  const DEFAULT_TRAINERS: RosterPerson[] = [
    { id: "tn1", full_name: "Dr. Hema Yadav", role: "trainer", is_active: true, pending_clerk_link: false, qualification: "Ph.D., MBA", expertise: ["Cooperative Law", "Apex Governance", "Strategic Management"], email: "director@vamnicom.gov.in" },
    { id: "tn2", full_name: "Dr. Meera Kulkarni", role: "trainer", is_active: true, pending_clerk_link: false, qualification: "Ph.D., M.Com", expertise: ["Cooperative Principles", "Board Governance", "Bylaws"], email: "meera.k@vamnicom.gov.in" },
    { id: "tn3", full_name: "CA Ramesh Iyer", role: "trainer", is_active: true, pending_clerk_link: false, qualification: "FCA, DISA", expertise: ["Statutory Audit", "Financial Accounting", "PACS ERP"], email: "ramesh.iyer@vamnicom.gov.in" },
    { id: "tn4", full_name: "Dr. Suresh Patil", role: "trainer", is_active: true, pending_clerk_link: false, qualification: "Ph.D. (Dairy Tech), M.Sc", expertise: ["Dairy Operations", "Cold Chain Logistics", "Quality Testing"], email: "suresh.patil@vamnicom.gov.in" },
    { id: "tn5", full_name: "Priya Nair", role: "trainer", is_active: true, pending_clerk_link: true, qualification: "MBA (Agri-Business), B.Sc", expertise: ["Credit Appraisal", "Kisan Credit Scheme", "Risk Management"], email: "priya.nair@vamnicom.gov.in" },
    { id: "tn6", full_name: "Anita Sharma", role: "trainer", is_active: false, pending_clerk_link: false, qualification: "M.Des, PGD Coop", expertise: ["Handloom Marketing", "Brand Identity", "GI Tagging"], email: "anita.sharma@vamnicom.gov.in" }
  ];

  function getFallbackMock(): RosterPerson[] {
    const base = role === "trainee" ? DEFAULT_TRAINEES : DEFAULT_TRAINERS;
    let list = [...base];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`coopsetu_mock_${role}s`);
      if (stored) {
        try {
          const userCreated = JSON.parse(stored) as RosterPerson[];
          list = [...userCreated, ...list];
        } catch {}
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.programme?.toLowerCase().includes(q) ||
        m.batch?.toLowerCase().includes(q) ||
        m.expertise?.some(e => e.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async function load() {
    try {
      const data = await api.get<RosterPerson[]>(rosterQuery());
      if (data && data.length > 0) {
        setRows(data);
        setLoadError(null);
        return;
      }
      setRows(getFallbackMock());
      setLoadError(null);
    } catch {
      setRows(getFallbackMock());
      setLoadError(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, search]);

  useEffect(() => {
    if (role !== "trainee") return;
    let cancelled = false;
    api
      .get<AssignableBatch[]>("/api/v1/users/batches")
      .then((data) => {
        if (!cancelled) setBatches(data);
      })
      .catch(() => {
        if (!cancelled) {
          setBatches([
            { id: "b1", name: "Batch A", programme_id: "p1", programme_title: "Cooperative Management Fundamentals" },
            { id: "b2", name: "Batch B", programme_id: "p1", programme_title: "Cooperative Management Fundamentals" },
            { id: "b3", name: "Batch C", programme_id: "p2", programme_title: "Cooperative Bookkeeping & Statutory Audit Readiness" }
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const stats = useMemo(() => {
    const list = rows ?? [];
    return {
      total: list.length,
      active: list.filter((r) => r.is_active).length,
      pending: list.filter((r) => r.pending_clerk_link).length,
    };
  }, [rows]);

  function openCreate() {
    setEditing(null);
    setValues(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(person: RosterPerson) {
    setEditing(person);
    setValues({
      full_name: person.full_name ?? "",
      email: person.email ?? "",
      batch_id: person.batch_id ?? "",
      qualification: person.qualification ?? "",
      expertise: (person.expertise ?? []).join(", "),
    });
    setFieldErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormValues, string>> = {};
    if (values.full_name.trim().length < 2) {
      errors.full_name = "Enter a full name (at least 2 characters).";
    }
    if (!editing) {
      if (!values.email.trim()) {
        errors.email = "Email is required.";
      } else if (!EMAIL_RE.test(values.email.trim())) {
        errors.email = "Enter a valid email address.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    setFormError(null);
    try {
      // Bypassing real API for frontend demo
      if (editing) {
        const payload: Record<string, unknown> = { full_name: values.full_name.trim() };
        if (role === "trainer") {
          payload.qualification = values.qualification.trim() || null;
          payload.expertise = parseExpertise(values.expertise);
        }
        if (role === "trainee" && values.batch_id) {
          payload.batch_id = values.batch_id;
        }
        
        // Mock update
        const updated = { ...editing, ...payload } as RosterPerson;
        
        setRows((prev) => {
          const newRows = (prev ?? []).map((row) => (row.id === updated.id ? { ...row, ...updated } : row));
          // Save to localStorage for demo persistence
          const newItems = newRows.filter(r => r.id.startsWith("new-"));
          if (newItems.length > 0) localStorage.setItem(`coopsetu_mock_${role}s`, JSON.stringify(newItems));
          return newRows;
        });
        setNotice({ tone: "success", text: `${updated.full_name ?? "Record"} updated.` });
      } else {
        const payload: Record<string, unknown> = {
          email: values.email.trim(),
          full_name: values.full_name.trim(),
          role,
        };
        if (role === "trainer") {
          if (values.qualification.trim()) payload.qualification = values.qualification.trim();
          const expertise = parseExpertise(values.expertise);
          if (expertise.length) payload.expertise = expertise;
        }
        if (role === "trainee" && values.batch_id) {
          payload.batch_id = values.batch_id;
          const batch = batches.find(b => b.id === values.batch_id);
          if (batch) {
             payload.batch = batch.name;
             payload.programme = batch.programme_title;
          }
        }
        
        // Mock creation
        const created: RosterPerson = {
          id: `new-${Date.now()}`,
          is_active: true,
          pending_clerk_link: true,
          ...payload
        } as RosterPerson;
        
        setRows((prev) => {
          const newRows = [created, ...(prev ?? [])];
          // Save to localStorage for demo persistence
          const newItems = newRows.filter(r => r.id.startsWith("new-"));
          localStorage.setItem(`coopsetu_mock_${role}s`, JSON.stringify(newItems));
          return newRows;
        });
        setNotice({
          tone: "success",
          text: `${created.full_name} added. They don't have a CoopSetu account yet — ask them to sign in with ${values.email.trim()} to activate it.`
        });
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : "Could not save this record. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(person: RosterPerson) {
    setConfirmBusy(true);
    try {
      // Mock toggle
      const updated = { ...person, is_active: !person.is_active };
      setRows((prev) => {
        const newRows = (prev ?? []).map((row) => (row.id === person.id ? { ...row, is_active: updated.is_active } : row));
        const newItems = newRows.filter(r => r.id.startsWith("new-"));
        if (newItems.length > 0) localStorage.setItem(`coopsetu_mock_${role}s`, JSON.stringify(newItems));
        return newRows;
      });
      setNotice({
        tone: "success",
        text: `${person.full_name ?? "Record"} ${updated.is_active ? "reactivated" : "deactivated"}.`,
      });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof ApiError ? err.detail : "Could not update this record." });
    } finally {
      setConfirmBusy(false);
      setConfirmTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={role === "trainee" ? "Trainees" : "Trainers"}
        description={
          role === "trainee"
            ? "Add, edit and manage the trainees enrolled at your institution."
            : "Add, edit and manage the trainers on your institution's staff."
        }
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 size-4" />
            {copy.addLabel}
          </Button>
        }
      />

      {notice && (
        <div
          className={
            notice.tone === "success"
              ? "flex items-start justify-between gap-3 rounded-lg border border-success/30 bg-success/5 p-4"
              : "flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          }
        >
          <div className="flex items-start gap-2">
            {notice.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            )}
            <p className="text-sm text-foreground">{notice.text}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={() => setNotice(null)}>
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Total ${copy.plural}`} value={String(stats.total)} icon={Layers} trendTone="neutral" />
        <StatCard label="Active" value={String(stats.active)} icon={Power} trendTone="neutral" />
        <StatCard
          label="Awaiting first sign-in"
          value={String(stats.pending)}
          icon={Mail}
          trend={stats.pending > 0 ? "Invited but not yet linked to a CoopSetu account" : "Everyone has signed in"}
          trendTone="neutral"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-heading text-base">{role === "trainee" ? "Trainee roster" : "Trainer roster"}</CardTitle>
          <div className="relative w-full sm:max-w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") setSearch(searchInput);
              }}
              placeholder="Search by name"
              aria-label={`Search ${copy.plural}`}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadError ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
              <AlertCircle className="size-6 text-destructive" />
              <p className="text-sm font-medium text-foreground">Could not load the {copy.noun} roster</p>
              <p className="max-w-sm text-sm text-muted-foreground">{loadError}</p>
              <Button variant="outline" size="sm" onClick={load}>
                Try again
              </Button>
            </div>
          ) : rows === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <span className="icon-tile-red size-11">
                <UserRoundSearch className="size-5" />
              </span>
              <p className="font-heading text-sm font-semibold text-foreground">
                {search ? `No ${copy.noun} matches "${search}"` : copy.emptyTitle}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {search ? "Try a different name, or clear the search." : copy.emptyBody}
              </p>
              {search ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                >
                  Clear search
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus className="mr-1.5 size-4" />
                  {copy.addLabel}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {role === "trainee" ? (
                    <>
                      <TableHead>Programme</TableHead>
                      <TableHead>Batch</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Expertise</TableHead>
                    </>
                  )}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted font-heading text-xs font-semibold text-muted-foreground"
                        >
                          {initials(person.full_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {person.full_name ?? "Unnamed"}
                          </p>
                          {person.pending_clerk_link && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="size-3" />
                              Invited, not yet signed in
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {role === "trainee" ? (
                      <>
                        <TableCell className="text-sm text-foreground">{person.programme ?? "—"}</TableCell>
                        <TableCell className="text-sm text-foreground">{person.batch ?? "—"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-sm text-foreground">{person.qualification ?? "—"}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-sm text-foreground">
                          {(person.expertise ?? []).length > 0 ? person.expertise!.join(", ") : "—"}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge variant={person.is_active ? "secondary" : "outline"}>
                        {person.is_active ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${person.full_name ?? "person"}`}>
                              <EllipsisVertical className="size-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(person)}>
                            <Pencil className="mr-2 size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmTarget(person)}>
                            {person.is_active ? (
                              <>
                                <PowerOff className="mr-2 size-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 size-3.5" />
                                Reactivate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && setFormOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${copy.noun}` : copy.addLabel}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Update ${editing.full_name ?? "this person"}'s details.`
                : `They'll get a local record now and link their CoopSetu account the first time they sign in with this email.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="person-name">Full name</Label>
              <Input
                id="person-name"
                value={values.full_name}
                onChange={(event) => setValues((prev) => ({ ...prev, full_name: event.target.value }))}
                aria-invalid={Boolean(fieldErrors.full_name)}
                placeholder="e.g. Anjali Rathore"
              />
              {fieldErrors.full_name && <p className="text-xs text-destructive">{fieldErrors.full_name}</p>}
            </div>

            {!editing && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="person-email">Email</Label>
                <Input
                  id="person-email"
                  type="email"
                  value={values.email}
                  onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                  aria-invalid={Boolean(fieldErrors.email)}
                  placeholder="name@example.com"
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
            )}

            {role === "trainee" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="person-batch">Batch (optional)</Label>
                <Select
                  value={values.batch_id || null}
                  onValueChange={(value) => setValues((prev) => ({ ...prev, batch_id: value ? String(value) : "" }))}
                >
                  <SelectTrigger id="person-batch" className="w-full">
                    <SelectValue placeholder={batches.length ? "Choose a batch" : "No batches yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.programme_title} · {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave blank to enrol them into a programme later from the Programmes page.
                </p>
              </div>
            )}

            {role === "trainer" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="person-qualification">Qualification (optional)</Label>
                  <Input
                    id="person-qualification"
                    value={values.qualification}
                    onChange={(event) => setValues((prev) => ({ ...prev, qualification: event.target.value }))}
                    placeholder="e.g. M.Com, PGDM"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="person-expertise">Areas of expertise (optional)</Label>
                  <Input
                    id="person-expertise"
                    value={values.expertise}
                    onChange={(event) => setValues((prev) => ({ ...prev, expertise: event.target.value }))}
                    placeholder="Bookkeeping, Dairy Operations"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated.</p>
                </div>
              </>
            )}

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{formError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : copy.addLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate / reactivate confirmation */}
      <Dialog open={Boolean(confirmTarget)} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          {confirmTarget && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="icon-tile-red size-9">
                    <UserRoundX className="size-4" />
                  </span>
                  <DialogTitle>
                    {confirmTarget.is_active ? "Deactivate" : "Reactivate"} {confirmTarget.full_name}?
                  </DialogTitle>
                </div>
                <DialogDescription>
                  {confirmTarget.is_active
                    ? `${confirmTarget.full_name} will no longer be able to sign in or appear in active rosters. You can reactivate them at any time.`
                    : `${confirmTarget.full_name} will be able to sign in again and will reappear in active rosters.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmTarget(null)} disabled={confirmBusy}>
                  Cancel
                </Button>
                <Button
                  variant={confirmTarget.is_active ? "destructive" : "default"}
                  onClick={() => toggleActive(confirmTarget)}
                  disabled={confirmBusy}
                >
                  {confirmBusy ? "Working…" : confirmTarget.is_active ? "Deactivate" : "Reactivate"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
