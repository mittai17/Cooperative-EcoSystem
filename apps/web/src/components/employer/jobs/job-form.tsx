"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Eye, Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPLOYMENT_TYPES,
  FALLBACK_SKILL_CATALOGUE,
  createEmployerJob,
  listSkillCatalogue,
  publishEmployerJob,
  setJobRequirements,
  updateEmployerJob,
  type EmployerJobDetail,
  type EmploymentType,
  JobsApiError,
} from "@/lib/employer/jobs-api";
import { ConfirmDialog } from "./confirm-dialog";
import { JobPreviewDialog } from "./job-preview-dialog";
import { SkillRequirementsPicker } from "./skill-requirements-picker";
import {
  DEPARTMENTS,
  EDUCATION_OPTIONS,
  EMPTY_JOB_FORM,
  EXPERIENCE_OPTIONS,
  SECTORS,
  formFromDetail,
  hasErrors,
  toJobInput,
  validateDraft,
  validateForPublish,
  type JobFormErrors,
  type JobFormValues,
} from "./job-form-model";

interface JobFormProps {
  /** "create" for /employer/jobs/new, "edit" for /employer/jobs/[id]/edit. */
  mode: "create" | "edit";
  job?: EmployerJobDetail;
  /** Set after a draft is saved from the create route so the form can keep updating it. */
  notice?: string | null;
}

type BusyAction = "draft" | "publish" | null;

export function JobForm({ mode, job, notice: initialNotice }: JobFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<JobFormValues>(() => (job ? formFromDetail(job) : EMPTY_JOB_FORM));
  const [jobId, setJobId] = useState<string | null>(job?.id ?? null);
  const [jobStatus, setJobStatus] = useState<EmployerJobDetail["status"] | null>(job?.status ?? null);
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [skillOptions, setSkillOptions] = useState<string[]>(FALLBACK_SKILL_CATALOGUE);
  const [catalogueNotice, setCatalogueNotice] = useState<string | null>(null);

  const isPublished = jobStatus !== null && jobStatus !== "draft";
  const canPublish = !isPublished;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const live = await listSkillCatalogue();
        if (!active) return;
        setSkillOptions(Array.from(new Set([...live, ...FALLBACK_SKILL_CATALOGUE])).sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!active) return;
        setCatalogueNotice("Live Skill Graph is unavailable. Showing the standard skill catalogue.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function patch<K extends keyof JobFormValues>(key: K, value: JobFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as keyof JobFormErrors];
      return next;
    });
  }

  /** Creates or updates the job and replaces its requirement set. Returns the job id. */
  async function persist(): Promise<string> {
    const input = toJobInput(values);
    let id = jobId;
    if (!id) {
      const created = await createEmployerJob({ ...input, status: "draft" });
      id = created.id;
      setJobId(id);
      setJobStatus(created.status ?? "draft");
    } else {
      await updateEmployerJob(id, input);
    }
    await setJobRequirements(id, values.requirements);
    return id;
  }

  function describeError(err: unknown): string {
    if (err instanceof JobsApiError && err.status === 403) {
      return "Your account is not allowed to manage this job posting.";
    }
    if (err instanceof JobsApiError && err.status === 404) {
      return "This job posting could not be found. It may have been removed.";
    }
    return err instanceof Error ? err.message : "Something went wrong while saving. Please try again.";
  }

  async function handleSaveDraft() {
    const found = validateDraft(values);
    setErrors(found);
    if (hasErrors(found)) return;
    setBusy("draft");
    setApiError(null);
    setNotice(null);
    try {
      const id = await persist();
      if (mode === "create" && !job) {
        router.replace(`/employer/jobs/${id}/edit?saved=draft`);
        return;
      }
      setNotice(canPublish ? "Draft saved." : "Changes saved.");
    } catch (err) {
      setApiError(describeError(err));
    } finally {
      setBusy(null);
    }
  }

  function handlePublishClick() {
    const found = validateForPublish(values);
    setErrors(found);
    setApiError(null);
    if (hasErrors(found)) {
      setApiError("Some required fields are missing. Fix the highlighted fields to publish.");
      return;
    }
    setPublishOpen(true);
  }

  async function handlePublish() {
    setBusy("publish");
    setApiError(null);
    try {
      const id = await persist();
      await publishEmployerJob(id);
      router.push(`/employer/jobs/${id}?published=1`);
    } catch (err) {
      setApiError(describeError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveChanges() {
    const found = validateDraft(values);
    setErrors(found);
    if (hasErrors(found)) return;
    setBusy("draft");
    setApiError(null);
    setNotice(null);
    try {
      await persist();
      setNotice("Changes saved.");
    } catch (err) {
      setApiError(describeError(err));
    } finally {
      setBusy(null);
    }
  }

  const title = mode === "create" ? "Create New Job" : "Edit Job";
  const breadcrumbJobHref = jobId ? `/employer/jobs/${jobId}` : "/employer/jobs";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/employer/jobs" className="hover:text-foreground hover:underline">
              Jobs
            </Link>
            <span>/</span>
            {mode === "edit" && job && (
              <>
                <Link href={breadcrumbJobHref} className="hover:text-foreground hover:underline">
                  {job.title}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{mode === "create" ? "Create New Job" : "Edit"}</span>
          </nav>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">{title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Post a job and hire from verified Skill Passport candidates. Required skills drive the match score.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" render={<Link href={breadcrumbJobHref} />}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> Preview
          </Button>
          {canPublish ? (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={busy !== null}>
                {busy === "draft" && <Loader2 className="size-4 animate-spin" />}
                Save Draft
              </Button>
              <Button onClick={handlePublishClick} disabled={busy !== null}>
                <Send className="size-4" /> Publish Job
              </Button>
            </>
          ) : (
            <Button onClick={handleSaveChanges} disabled={busy !== null}>
              {busy === "draft" && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <p className="rounded-lg border border-success/20 bg-success/10 px-4 py-2 text-sm text-success" role="status">
          {notice}
        </p>
      )}
      {apiError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      <FormSection title="Basic information" description="What the role is called and where it sits in the cooperative.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="job-title" label="Job title" required error={errors.title}>
            <Input
              id="job-title"
              value={values.title}
              onChange={(e) => patch("title", e.target.value)}
              placeholder="e.g. Dairy Management Trainee"
              aria-invalid={Boolean(errors.title)}
            />
          </Field>
          <Field id="job-sector" label="Cooperative sector" required error={errors.sector}>
            <PickerSelect
              id="job-sector"
              value={values.sector}
              onChange={(v) => patch("sector", v)}
              options={SECTORS.map((s) => ({ label: s, value: s }))}
              placeholder="Select sector"
            />
          </Field>
          <Field id="job-department" label="Department" required error={errors.department}>
            <PickerSelect
              id="job-department"
              value={values.department}
              onChange={(v) => patch("department", v)}
              options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
              placeholder="Select department"
            />
          </Field>
          <Field id="job-location" label="Location" required error={errors.location}>
            <Input
              id="job-location"
              value={values.location}
              onChange={(e) => patch("location", e.target.value)}
              placeholder="City, State"
              aria-invalid={Boolean(errors.location)}
            />
          </Field>
          <Field id="job-type" label="Employment type" required error={errors.employmentType}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Employment type" id="job-type">
              {EMPLOYMENT_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={values.employmentType === type}
                  variant={values.employmentType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => patch("employmentType", type as EmploymentType)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </Field>
          <Field id="job-openings" label="Number of positions" required error={errors.openings}>
            <Input
              id="job-openings"
              type="number"
              min={1}
              value={values.openings}
              onChange={(e) => patch("openings", e.target.value)}
              aria-invalid={Boolean(errors.openings)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Compensation & eligibility" description="Salary is per month, in INR. Leave blank to show 'Not disclosed'.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="job-salary-min" label="Salary range (min, INR / month)" error={errors.salaryMin}>
            <Input
              id="job-salary-min"
              type="number"
              min={0}
              inputMode="numeric"
              value={values.salaryMin}
              onChange={(e) => patch("salaryMin", e.target.value)}
              placeholder="e.g. 22000"
            />
          </Field>
          <Field id="job-salary-max" label="Salary range (max, INR / month)" error={errors.salaryMax}>
            <Input
              id="job-salary-max"
              type="number"
              min={0}
              inputMode="numeric"
              value={values.salaryMax}
              onChange={(e) => patch("salaryMax", e.target.value)}
              placeholder="e.g. 28000"
            />
          </Field>
          <Field id="job-experience" label="Experience required" required error={errors.experienceRequired}>
            <PickerSelect
              id="job-experience"
              value={values.experienceRequired}
              onChange={(v) => patch("experienceRequired", v)}
              options={EXPERIENCE_OPTIONS.map((e) => ({ label: e, value: e }))}
              placeholder="Select experience"
            />
          </Field>
          <Field id="job-education" label="Education">
            <PickerSelect
              id="job-education"
              value={values.education}
              onChange={(v) => patch("education", v)}
              options={EDUCATION_OPTIONS.map((e) => ({ label: e, value: e }))}
              placeholder="Select education"
            />
          </Field>
          <Field id="job-deadline" label="Application deadline" required error={errors.deadline}>
            <Input
              id="job-deadline"
              type="date"
              value={values.deadline}
              onChange={(e) => patch("deadline", e.target.value)}
              aria-invalid={Boolean(errors.deadline)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Job description" description="Shown to candidates on the posting. At least 40 characters to publish.">
        <div className="grid gap-4">
          <Field id="job-description" label="Job description" required error={errors.description}>
            <Textarea
              id="job-description"
              rows={6}
              value={values.description}
              onChange={(e) => patch("description", e.target.value)}
              placeholder="Describe the role, the society or unit it sits in, and what success looks like."
              aria-invalid={Boolean(errors.description)}
            />
          </Field>
          <Field id="job-responsibilities" label="Responsibilities">
            <Textarea
              id="job-responsibilities"
              rows={4}
              value={values.responsibilities}
              onChange={(e) => patch("responsibilities", e.target.value)}
              placeholder="One responsibility per line"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Skill requirements"
        description="Pick skills from the Skill Graph. Required skills count toward the match score; preferred skills are a tie-breaker."
      >
        <SkillRequirementsPicker
          requirements={values.requirements}
          onChange={(next) => patch("requirements", next)}
          skillOptions={skillOptions}
          catalogueNotice={catalogueNotice}
          error={errors.requirements}
        />
      </FormSection>

      <FormSection title="Certifications & languages" description="Optional. Separate multiple entries with commas.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="job-certifications" label="Certifications">
            <Input
              id="job-certifications"
              value={values.certifications}
              onChange={(e) => patch("certifications", e.target.value)}
              placeholder="e.g. Food Safety and Hygiene, Tally ACE"
            />
          </Field>
          <Field id="job-languages" label="Languages">
            <Input
              id="job-languages"
              value={values.languages}
              onChange={(e) => patch("languages", e.target.value)}
              placeholder="e.g. Gujarati, Hindi, English"
            />
          </Field>
        </div>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        {canPublish ? (
          <>
            <Button variant="outline" onClick={handleSaveDraft} disabled={busy !== null}>
              Save Draft
            </Button>
            <Button onClick={handlePublishClick} disabled={busy !== null}>
              <Send className="size-4" /> Publish Job
            </Button>
          </>
        ) : (
          <Button onClick={handleSaveChanges} disabled={busy !== null}>
            Save changes
          </Button>
        )}
      </div>

      <JobPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} values={values} />

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish this job?"
        description="Once published the posting becomes Active and trainees whose skills match can see it and apply. You can pause or close it later."
        confirmLabel="Publish job"
        onConfirm={handlePublish}
      />
    </div>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PickerSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v && onChange(String(v))}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
