"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CircleAlert,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  SearchX,
  ShieldOff,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const INSTITUTION_TYPES = ["RICM", "ICM", "VAMNICOM", "other"] as const;
type InstitutionType = (typeof INSTITUTION_TYPES)[number];

const TYPE_LABEL: Record<InstitutionType, string> = {
  RICM: "RICM",
  ICM: "ICM",
  VAMNICOM: "VAMNICOM",
  other: "Other",
};

interface Institution {
  id: string;
  name: string;
  type: InstitutionType | null;
  state: string | null;
  district: string | null;
  address: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  accreditation_number: string | null;
  logo_url: string | null;
  is_active: boolean;
  programme_count: number;
  trainee_count: number;
}

interface InstitutionFormValues {
  name: string;
  type: InstitutionType;
  state: string;
  district: string;
  address: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  accreditation_number: string;
}

const EMPTY_FORM: InstitutionFormValues = {
  name: "",
  type: "RICM",
  state: "",
  district: "",
  address: "",
  pincode: "",
  phone: "",
  email: "",
  website: "",
  accreditation_number: "",
};

type LoadState = "loading" | "ready" | "error";

function institutionToForm(institution: Institution): InstitutionFormValues {
  return {
    name: institution.name ?? "",
    type: (institution.type as InstitutionType) ?? "other",
    state: institution.state ?? "",
    district: institution.district ?? "",
    address: institution.address ?? "",
    pincode: institution.pincode ?? "",
    phone: institution.phone ?? "",
    email: institution.email ?? "",
    website: institution.website ?? "",
    accreditation_number: institution.accreditation_number ?? "",
  };
}

/** Builds the JSON body for POST/PATCH, dropping blank optional fields so
 * they don't overwrite existing values with empty strings and so the
 * backend's Optional[...] validators don't reject "". */
function toPayload(values: InstitutionFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    type: values.type,
    state: values.state.trim(),
  };
  const optional: [keyof InstitutionFormValues, string][] = [
    ["district", values.district],
    ["address", values.address],
    ["pincode", values.pincode],
    ["phone", values.phone],
    ["email", values.email],
    ["website", values.website],
    ["accreditation_number", values.accreditation_number],
  ];
  for (const [key, value] of optional) {
    const trimmed = value.trim();
    if (trimmed) payload[key] = trimmed;
  }
  return payload;
}

/** Client-side mirror of the backend's Pydantic validation, so obvious
 * mistakes surface inline before a round trip instead of as a raw 422. */
function validate(values: InstitutionFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name.trim()) errors.name = "Institution name is required.";
  if (!values.state.trim()) errors.state = "State is required.";
  if (values.pincode.trim() && !/^\d{6}$/.test(values.pincode.trim())) {
    errors.pincode = "Pincode must be exactly 6 digits.";
  }
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.website.trim() && !/^https?:\/\/.+/i.test(values.website.trim())) {
    errors.website = "Website must start with http:// or https://";
  }
  return errors;
}

async function authedJson(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

function apiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : String(item)))
        .join("; ");
    }
  }
  return fallback;
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

export default function InstitutionsPage() {
  const { getToken, isLoaded } = useAuth();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<InstitutionFormValues>(EMPTY_FORM);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editing, setEditing] = useState<Institution | null>(null);
  const [editForm, setEditForm] = useState<InstitutionFormValues>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<Institution | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  async function refresh() {
    setLoadState("loading");
    try {
      const token = await getToken();
      const { ok, status, body } = await authedJson(
        "/api/v1/organisations/?include_inactive=true",
        token,
      );
      if (!ok) throw new Error(apiErrorMessage(body, `Request failed (${status})`));
      setInstitutions(Array.isArray(body) ? (body as Institution[]) : []);
      setLoadState("ready");
    } catch (error) {
      console.error("Failed to load institutions", error);
      setLoadState("error");
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    // Deferred via setTimeout so the initial fetch runs outside this effect's
    // synchronous call stack (avoids react-hooks/set-state-in-effect).
    const id = setTimeout(() => {
      refresh();
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const states = useMemo(
    () =>
      [...new Set(institutions.map((inst) => inst.state).filter((s): s is string => Boolean(s)))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [institutions],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return institutions.filter((inst) => {
      const matchesQuery =
        needle.length === 0 ||
        [inst.name, inst.state, inst.district, inst.accreditation_number]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesState = stateFilter === "all" || inst.state === stateFilter;
      return matchesQuery && matchesState;
    });
  }, [institutions, query, stateFilter]);

  const stats = useMemo(() => {
    const active = institutions.filter((inst) => inst.is_active);
    return {
      total: active.length,
      states: new Set(active.map((inst) => inst.state).filter(Boolean)).size,
      programmes: active.reduce((sum, inst) => sum + inst.programme_count, 0),
      trainees: active.reduce((sum, inst) => sum + inst.trainee_count, 0),
    };
  }, [institutions]);

  function openAdd() {
    setAddForm(EMPTY_FORM);
    setAddErrors({});
    setAddOpen(true);
  }

  async function submitAdd() {
    const errors = validate(addForm);
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setAddSubmitting(true);
    try {
      const token = await getToken();
      const { ok, status, body } = await authedJson("/api/v1/organisations/", token, {
        method: "POST",
        body: JSON.stringify(toPayload(addForm)),
      });
      if (!ok) {
        if (status === 403) {
          setAddErrors({ form: "Your account does not have permission to add institutions." });
        } else {
          setAddErrors({ form: apiErrorMessage(body, "Could not create this institution.") });
        }
        return;
      }
      const created = body as Institution;
      setInstitutions((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAddOpen(false);
      setNotice({ tone: "success", text: `${created.name} was added to the register.` });
    } catch {
      setAddErrors({ form: "Network error — the institution was not created." });
    } finally {
      setAddSubmitting(false);
    }
  }

  function openEdit(institution: Institution) {
    setEditing(institution);
    setEditForm(institutionToForm(institution));
    setEditErrors({});
  }

  async function submitEdit() {
    if (!editing) return;
    const errors = validate(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setEditSubmitting(true);
    try {
      const token = await getToken();
      const { ok, status, body } = await authedJson(`/api/v1/organisations/${editing.id}`, token, {
        method: "PATCH",
        body: JSON.stringify(toPayload(editForm)),
      });
      if (!ok) {
        if (status === 403) {
          setEditErrors({ form: "Your account does not have permission to edit this institution." });
        } else {
          setEditErrors({ form: apiErrorMessage(body, "Could not save these changes.") });
        }
        return;
      }
      const updated = body as Institution;
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === editing.id
            ? { ...inst, ...updated, programme_count: inst.programme_count, trainee_count: inst.trainee_count }
            : inst,
        ),
      );
      setEditing(null);
      setNotice({ tone: "success", text: `${updated.name} was updated.` });
    } catch {
      setEditErrors({ form: "Network error — changes were not saved." });
    } finally {
      setEditSubmitting(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    setDeactivateError(null);
    try {
      const token = await getToken();
      const { ok, status, body } = await authedJson(
        `/api/v1/organisations/${deactivateTarget.id}/deactivate`,
        token,
        { method: "POST" },
      );
      if (!ok) {
        if (status === 409) {
          setDeactivateError(apiErrorMessage(body, "This institution still has trainees or active programmes."));
        } else if (status === 403) {
          setDeactivateError("Your account does not have permission to deactivate institutions.");
        } else {
          setDeactivateError(apiErrorMessage(body, "Could not deactivate this institution."));
        }
        return;
      }
      setInstitutions((prev) =>
        prev.map((inst) => (inst.id === deactivateTarget.id ? { ...inst, is_active: false } : inst)),
      );
      setNotice({ tone: "success", text: `${deactivateTarget.name} has been deactivated.` });
      setDeactivateTarget(null);
    } catch {
      setDeactivateError("Network error — the institution was not deactivated.");
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Institutions"
        description="Every cooperative training institution (RICM, ICM, VAMNICOM and other partners) registered on the platform."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={refresh} disabled={loadState === "loading"}>
              <RefreshCw className={loadState === "loading" ? "size-4 animate-spin" : "size-4"} />
            </Button>
            <Button onClick={openAdd}>
              <Plus className="size-4" /> Add Institution
            </Button>
          </div>
        }
      />

      {notice && (
        <div
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
            notice.tone === "success"
              ? "border-primary/30 bg-primary/5"
              : "border-destructive/30 bg-destructive/5",
          )}
        >
          <div className="flex items-start gap-2">
            {notice.tone === "success" ? (
              <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            )}
            <p className="text-sm text-foreground">{notice.text}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Institutions" value={String(stats.total)} icon={Building2} trend={`${stats.states} states`} trendTone="neutral" />
        <StatCard label="Active programmes" value={String(stats.programmes)} icon={GraduationCap} trendTone="neutral" />
        <StatCard label="Trainees enrolled" value={stats.trainees.toLocaleString("en-IN")} icon={Users} trendTone="neutral" />
        <StatCard
          label="Deactivated"
          value={String(institutions.filter((inst) => !inst.is_active).length)}
          icon={ShieldOff}
          trendTone="neutral"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-heading text-base">Registered Institutions</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={stateFilter} onValueChange={(value) => setStateFilter(String(value))}>
              <SelectTrigger size="sm" className="w-40" aria-label="Filter by state">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, state, accreditation…"
              className="w-64"
              aria-label="Search institutions"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadState === "loading" ? (
            <TableSkeleton />
          ) : loadState === "error" ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <CircleAlert className="size-6" />
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">Could not load institutions</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  The institution register did not load. Check your connection and try again.
                </p>
              </div>
              <Button variant="outline" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <SearchX className="size-6" />
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {institutions.length === 0 ? "No institutions registered yet" : "No institution matches these filters"}
                </p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  {institutions.length === 0
                    ? "Add the first cooperative training institution to get started."
                    : `No institution name, state or accreditation number matches "${query}".`}
                </p>
              </div>
              {institutions.length === 0 ? (
                <Button onClick={openAdd}>
                  <Plus className="size-4" /> Add Institution
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStateFilter("all");
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Active Programmes</TableHead>
                    <TableHead>Trainees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((inst) => (
                    <TableRow key={inst.id} className={cn(!inst.is_active && "opacity-60")}>
                      <TableCell>
                        <span className="block font-medium text-foreground">{inst.name}</span>
                        {inst.accreditation_number && (
                          <span className="block text-xs text-muted-foreground">
                            Accreditation {inst.accreditation_number}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{TYPE_LABEL[inst.type ?? "other"]}</Badge>
                      </TableCell>
                      <TableCell>
                        {inst.state ?? "—"}
                        {inst.district && <span className="block text-xs text-muted-foreground">{inst.district}</span>}
                      </TableCell>
                      <TableCell>{inst.programme_count}</TableCell>
                      <TableCell>{inst.trainee_count.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        {inst.is_active ? (
                          <Badge className="bg-success/10 text-success">Active</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground">Deactivated</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(inst)}>
                            <Pencil className="size-3.5" /> Manage
                          </Button>
                          {inst.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeactivateError(null);
                                setDeactivateTarget(inst);
                              }}
                            >
                              <Ban className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Institution */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Institution</DialogTitle>
            <DialogDescription>
              Register a new cooperative training college (RICM/ICM/VAMNICOM) or other partner institution.
            </DialogDescription>
          </DialogHeader>
          <InstitutionForm form={addForm} setForm={setAddForm} errors={addErrors} idPrefix="add" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitAdd} disabled={addSubmitting}>
              {addSubmitting ? "Creating…" : "Create Institution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Institution */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage {editing?.name}</DialogTitle>
            <DialogDescription>Update this institution&apos;s profile and contact details.</DialogDescription>
          </DialogHeader>
          <InstitutionForm form={editForm} setForm={setEditForm} errors={editErrors} idPrefix="edit" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={editSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={editSubmitting}>
              {editSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <Dialog open={Boolean(deactivateTarget)} onOpenChange={(open) => (open ? null : setDeactivateTarget(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              <DialogTitle>Deactivate {deactivateTarget?.name}?</DialogTitle>
            </div>
            <DialogDescription>
              This institution will stop appearing to trainees and be excluded from new nominations. It can only be
              deactivated while it has no trainees or active programmes attached.
            </DialogDescription>
          </DialogHeader>
          {deactivateTarget && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground/80">
              {deactivateTarget.trainee_count} trainee(s) · {deactivateTarget.programme_count} active programme(s)
              currently on record.
            </div>
          )}
          {deactivateError && (
            <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {deactivateError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)} disabled={deactivating}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating…" : "Yes, deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InstitutionForm({
  form,
  setForm,
  errors,
  idPrefix,
}: {
  form: InstitutionFormValues;
  setForm: Dispatch<SetStateAction<InstitutionFormValues>>;
  errors: Record<string, string>;
  idPrefix: string;
}) {
  function field<K extends keyof InstitutionFormValues>(key: K, value: InstitutionFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-4">
      {errors.form && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {errors.form}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor={`${idPrefix}-name`}>Institution name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={form.name}
            onChange={(event) => field("name", event.target.value)}
            placeholder="Regional Institute of Cooperative Management, Bengaluru"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-type`}>Type</Label>
          <Select value={form.type} onValueChange={(value) => field("type", value as InstitutionType)}>
            <SelectTrigger id={`${idPrefix}-type`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSTITUTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-accreditation`}>Accreditation number</Label>
          <Input
            id={`${idPrefix}-accreditation`}
            value={form.accreditation_number}
            onChange={(event) => field("accreditation_number", event.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-state`}>State</Label>
          <Input
            id={`${idPrefix}-state`}
            value={form.state}
            onChange={(event) => field("state", event.target.value)}
            placeholder="Maharashtra"
            aria-invalid={Boolean(errors.state)}
          />
          {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-district`}>District</Label>
          <Input
            id={`${idPrefix}-district`}
            value={form.district}
            onChange={(event) => field("district", event.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor={`${idPrefix}-address`}>Address</Label>
          <Textarea
            id={`${idPrefix}-address`}
            value={form.address}
            onChange={(event) => field("address", event.target.value)}
            placeholder="Optional"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-pincode`}>Pincode</Label>
          <Input
            id={`${idPrefix}-pincode`}
            value={form.pincode}
            onChange={(event) => field("pincode", event.target.value)}
            placeholder="Optional · 6 digits"
            aria-invalid={Boolean(errors.pincode)}
          />
          {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-phone`}>Contact phone</Label>
          <Input
            id={`${idPrefix}-phone`}
            value={form.phone}
            onChange={(event) => field("phone", event.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-email`}>Contact email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={form.email}
            onChange={(event) => field("email", event.target.value)}
            placeholder="Optional"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-website`}>Website</Label>
          <Input
            id={`${idPrefix}-website`}
            value={form.website}
            onChange={(event) => field("website", event.target.value)}
            placeholder="Optional · https://…"
            aria-invalid={Boolean(errors.website)}
          />
          {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
        </div>
      </div>
    </div>
  );
}
