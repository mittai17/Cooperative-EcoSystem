"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface JobRow {
  id: string;
  title: string;
  employer: string | null;
  location: string | null;
  status: string;
  openings: number | null;
  deadline: string | null;
}

interface JobFormState {
  title: string;
  employer_name: string;
  location: string;
  sector: string;
  job_type: string;
  salary_range: string;
  description: string;
  openings: string;
}

const EMPTY_FORM: JobFormState = {
  title: "",
  employer_name: "",
  location: "",
  sector: "Cooperative",
  job_type: "Full-time",
  salary_range: "",
  description: "",
  openings: "1",
};

function statusVariant(status: string): "secondary" | "outline" {
  return status === "open" ? "secondary" : "outline";
}

export default function JobsPage() {
  const api = useApi();
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadJobs() {
    setLoadError(null);
    try {
      const data = await api.get<{ jobs: JobRow[] }>("/api/v1/jobs/mine");
      setJobs(data.jobs);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.detail : "Could not reach the CoopSetu API");
      setJobs([]);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => void loadJobs(), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(job: JobRow) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      employer_name: job.employer ?? "",
      location: job.location ?? "",
      sector: "Cooperative",
      job_type: "Full-time",
      salary_range: "",
      description: "",
      openings: job.openings ? String(job.openings) : "1",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function saveJob() {
    if (form.title.trim().length < 3) {
      setFormError("Give the job a title of at least 3 characters.");
      return;
    }
    if (!editingId && form.employer_name.trim().length < 2) {
      setFormError("Employer name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await api.patch(`/api/v1/jobs/${editingId}`, {
          title: form.title.trim(),
          location: form.location.trim() || null,
          description: form.description.trim() || null,
          openings: Number(form.openings) || undefined,
        });
      } else {
        await api.post("/api/v1/jobs/", {
          title: form.title.trim(),
          employer_name: form.employer_name.trim(),
          location: form.location.trim() || "Remote",
          sector: form.sector.trim() || "Cooperative",
          job_type: form.job_type.trim() || "Full-time",
          salary_range: form.salary_range.trim() || "Not disclosed",
          description: form.description.trim(),
          skills_required: [],
        });
      }
      setDialogOpen(false);
      await loadJobs();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.detail : "Could not save the job posting.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(job: JobRow) {
    setActionError(null);
    const next = job.status === "open" ? "closed" : "open";
    try {
      await api.patch(`/api/v1/jobs/${job.id}`, { status: next });
      await loadJobs();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : "Could not update the job status.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Job Postings"
        description="Create, edit, and manage the status of your job listings."
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create Job
          </Button>
        }
      />

      {(loadError || actionError) && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{loadError ?? actionError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">All Postings</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs === null ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-12 text-center">
              <p className="text-sm font-medium text-foreground">No job postings yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Create your first posting so trainees with matching verified skills can find and apply to it.
              </p>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Create Job
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Openings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                    <TableCell>{job.location ?? "—"}</TableCell>
                    <TableCell>{job.openings ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="View applicants" render={
                          <Link href={`/employer/applications?job=${job.id}`}>
                            <Users className="h-4 w-4" />
                          </Link>
                        } />
                        <Button variant="ghost" size="sm" onClick={() => openEdit(job)}>
                          Edit
                        </Button>
                        {job.status !== "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={job.status === "open" ? "text-destructive" : undefined}
                            onClick={() => toggleStatus(job)}
                          >
                            {job.status === "open" ? "Close" : "Reopen"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit job posting" : "Create job posting"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the details trainees see on this posting."
                : "New postings are published immediately as open."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="job-title">Title</Label>
              <Input
                id="job-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Dairy Procurement Supervisor"
              />
            </div>
            {!editingId && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="job-employer">Employer name</Label>
                <Input
                  id="job-employer"
                  value={form.employer_name}
                  onChange={(e) => setForm((f) => ({ ...f, employer_name: e.target.value }))}
                  placeholder="e.g. Amul Dairy Cooperative Union"
                />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="job-location">Location</Label>
                <Input
                  id="job-location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Anand, Gujarat"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="job-openings">Openings</Label>
                <Input
                  id="job-openings"
                  type="number"
                  min={1}
                  value={form.openings}
                  onChange={(e) => setForm((f) => ({ ...f, openings: e.target.value }))}
                />
              </div>
            </div>
            {!editingId && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="job-sector">Sector</Label>
                  <Input
                    id="job-sector"
                    value={form.sector}
                    onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="job-salary">Salary range</Label>
                  <Input
                    id="job-salary"
                    value={form.salary_range}
                    onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}
                    placeholder="e.g. ₹22,000 - 28,000 / month"
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="job-description">Description</Label>
              <Textarea
                id="job-description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Responsibilities, requirements, and reporting lines"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button onClick={saveJob} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
              {editingId ? "Save changes" : "Create job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
