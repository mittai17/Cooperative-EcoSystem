"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PROFICIENCY_LEVELS } from "@/lib/employer/jobs-api";
import { formatDate, formatSalary } from "./format";
import type { JobFormValues } from "./job-form-model";

interface JobPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: JobFormValues;
}

function proficiencyLabel(value: number): string {
  return PROFICIENCY_LEVELS.find((p) => p.value === value)?.label ?? `${value}`;
}

/** How a candidate would see this posting. Built only from the form state, nothing is saved. */
export function JobPreviewDialog({ open, onOpenChange, values }: JobPreviewDialogProps) {
  const required = values.requirements.filter((r) => r.requirement_type === "required");
  const preferred = values.requirements.filter((r) => r.requirement_type === "preferred");
  const openings = Number(values.openings) || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{values.title.trim() || "Untitled job"}</DialogTitle>
          <DialogDescription>
            {[values.sector, values.location || "Location not set", values.employmentType].filter(Boolean).join(" · ")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-sm">
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <Fact label="Department" value={values.department || "—"} />
            <Fact label="Positions" value={String(openings)} />
            <Fact label="Salary" value={formatSalary(numOrNull(values.salaryMin), numOrNull(values.salaryMax))} />
            <Fact label="Experience" value={values.experienceRequired || "—"} />
            <Fact label="Education" value={values.education || "Any qualification"} />
            <Fact label="Apply by" value={values.deadline ? formatDate(`${values.deadline}T00:00:00`) : "—"} />
          </dl>
          <section className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-foreground">About the role</h3>
            <p className="whitespace-pre-line text-muted-foreground">{values.description.trim() || "No description yet."}</p>
          </section>
          {values.responsibilities.trim() && (
            <section className="flex flex-col gap-1.5">
              <h3 className="font-semibold text-foreground">Responsibilities</h3>
              <p className="whitespace-pre-line text-muted-foreground">{values.responsibilities.trim()}</p>
            </section>
          )}
          <section className="flex flex-col gap-2">
            <h3 className="font-semibold text-foreground">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {required.map((r) => (
                <Badge key={r.skill_name} variant="secondary">
                  {r.skill_name} · {proficiencyLabel(r.min_proficiency)}+
                </Badge>
              ))}
              {preferred.map((r) => (
                <Badge key={r.skill_name} variant="outline">
                  {r.skill_name} (preferred)
                </Badge>
              ))}
              {values.requirements.length === 0 && <span className="text-muted-foreground">No skills added</span>}
            </div>
          </section>
          {(values.certifications.trim() || values.languages.trim()) && (
            <section className="grid gap-3 sm:grid-cols-2">
              {values.certifications.trim() && <Fact label="Certifications" value={values.certifications.trim()} />}
              {values.languages.trim() && <Fact label="Languages" value={values.languages.trim()} />}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function numOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
