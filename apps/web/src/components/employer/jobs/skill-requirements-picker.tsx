"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PROFICIENCY_LEVELS,
  type JobRequirement,
  type RequirementType,
} from "@/lib/employer/jobs-api";
import { cn } from "@/lib/utils";

interface SkillRequirementsPickerProps {
  requirements: JobRequirement[];
  onChange: (next: JobRequirement[]) => void;
  /** Skill names from the Skill Graph. Picks only; free text is intentionally not supported. */
  skillOptions: string[];
  catalogueNotice?: string | null;
  error?: string;
}

const TYPE_OPTIONS: { label: string; value: RequirementType }[] = [
  { label: "Required", value: "required" },
  { label: "Preferred", value: "preferred" },
];

export function SkillRequirementsPicker({
  requirements,
  onChange,
  skillOptions,
  catalogueNotice,
  error,
}: SkillRequirementsPickerProps) {
  const [skill, setSkill] = useState<string>("");
  const [type, setType] = useState<RequirementType>("required");
  const [minProficiency, setMinProficiency] = useState<number>(50);
  const [addError, setAddError] = useState<string | null>(null);

  const chosen = new Set(requirements.map((r) => r.skill_name));
  const available = skillOptions.filter((name) => !chosen.has(name));

  function addRequirement() {
    if (!skill) {
      setAddError("Pick a skill from the list.");
      return;
    }
    if (chosen.has(skill)) {
      setAddError("That skill is already on this job.");
      return;
    }
    setAddError(null);
    onChange([
      ...requirements,
      { skill_id: null, skill_name: skill, requirement_type: type, min_proficiency: minProficiency },
    ]);
    setSkill("");
  }

  function updateRequirement(name: string, patch: Partial<JobRequirement>) {
    onChange(requirements.map((r) => (r.skill_name === name ? { ...r, ...patch } : r)));
  }

  function removeRequirement(name: string) {
    onChange(requirements.filter((r) => r.skill_name !== name));
  }

  const required = requirements.filter((r) => r.requirement_type === "required");
  const preferred = requirements.filter((r) => r.requirement_type === "preferred");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Skill (from Skill Graph)</span>
          <Select
            items={available.map((name) => ({ label: name, value: name }))}
            value={skill}
            onValueChange={(v) => setSkill(v ? String(v) : "")}
          >
            <SelectTrigger className="w-full" aria-label="Skill to add">
              <SelectValue placeholder="Select a skill" />
            </SelectTrigger>
            <SelectContent>
              {available.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  All catalogue skills are added
                </SelectItem>
              ) : (
                available.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Requirement</span>
          <Select
            items={TYPE_OPTIONS}
            value={type}
            onValueChange={(v) => v && setType(v as RequirementType)}
          >
            <SelectTrigger className="w-full" aria-label="Requirement type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Minimum proficiency</span>
          <Select
            items={PROFICIENCY_LEVELS.map((p) => ({ label: p.label, value: String(p.value) }))}
            value={String(minProficiency)}
            onValueChange={(v) => v && setMinProficiency(Number(v))}
          >
            <SelectTrigger className="w-full" aria-label="Minimum proficiency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFICIENCY_LEVELS.map((p) => (
                <SelectItem key={p.value} value={String(p.value)}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="outline" onClick={addRequirement}>
          <Plus className="size-4" /> Add skill
        </Button>
      </div>
      {addError && (
        <p className="text-sm text-destructive" role="alert">
          {addError}
        </p>
      )}
      {catalogueNotice && <p className="text-xs text-muted-foreground">{catalogueNotice}</p>}

      {requirements.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No skills added yet. Add at least one required skill so matching can score candidates.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <RequirementGroup
            title="Required skills"
            items={required}
            onUpdate={updateRequirement}
            onRemove={removeRequirement}
            toneClass="bg-primary/10 text-primary"
          />
          <RequirementGroup
            title="Preferred skills"
            items={preferred}
            onUpdate={updateRequirement}
            onRemove={removeRequirement}
            toneClass="bg-muted text-muted-foreground"
          />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function RequirementGroup({
  title,
  items,
  onUpdate,
  onRemove,
  toneClass,
}: {
  title: string;
  items: JobRequirement[];
  onUpdate: (name: string, patch: Partial<JobRequirement>) => void;
  onRemove: (name: string) => void;
  toneClass: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title} <span className="font-normal">({items.length})</span>
      </p>
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {items.map((req) => (
          <li key={req.skill_name} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", toneClass)}>
              {req.requirement_type === "required" ? "Required" : "Preferred"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{req.skill_name}</span>
            <Select
              items={TYPE_OPTIONS}
              value={req.requirement_type}
              onValueChange={(v) => v && onUpdate(req.skill_name, { requirement_type: v as RequirementType })}
            >
              <SelectTrigger size="sm" aria-label={`Requirement type for ${req.skill_name}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={PROFICIENCY_LEVELS.map((p) => ({ label: p.label, value: String(p.value) }))}
              value={String(req.min_proficiency)}
              onValueChange={(v) => v && onUpdate(req.skill_name, { min_proficiency: Number(v) })}
            >
              <SelectTrigger size="sm" aria-label={`Minimum proficiency for ${req.skill_name}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFICIENCY_LEVELS.map((p) => (
                  <SelectItem key={p.value} value={String(p.value)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${req.skill_name}`}
              onClick={() => onRemove(req.skill_name)}
            >
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
