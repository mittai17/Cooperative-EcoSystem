"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FEEDBACK_CRITERIA,
  submitFeedback,
  type Api,
  type FeedbackKey,
  type FeedbackRatings,
  type HireRecord,
} from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";
import { RatingInput } from "./rating-input";

const MAX_SKILLS = 10;

interface FeedbackFormProps {
  api: Api;
  hire: HireRecord;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function FeedbackForm({ api, hire, onSubmitted, onCancel }: FeedbackFormProps) {
  const [ratings, setRatings] = useState<Partial<FeedbackRatings>>({});
  const [skillDraft, setSkillDraft] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSkill() {
    const value = skillDraft.trim();
    if (!value) return;
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    if (skills.length >= MAX_SKILLS) {
      setError(`You can list up to ${MAX_SKILLS} skills.`);
      return;
    }
    setSkills((prev) => [...prev, value]);
    setSkillDraft("");
    setError(null);
  }

  async function submit() {
    const missing = FEEDBACK_CRITERIA.filter((c) => !ratings[c.key as FeedbackKey]);
    if (missing.length > 0) {
      setError(`Rate every area before submitting. Missing: ${missing.map((c) => c.label).join(", ")}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitFeedback(api, {
        job_id: hire.job_id,
        trainee_id: hire.trainee_id,
        ratings: ratings as FeedbackRatings,
        additional_skills_needed: skills,
        comments: comments.trim(),
      });
      onSubmitted();
    } catch (err) {
      setError(errorMessage(err, "Feedback could not be submitted. Your entries are still here."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl bg-muted/50 p-4 text-sm">
        <p className="font-medium text-foreground">{hire.employee_name}</p>
        <p className="text-muted-foreground">{hire.job_title}</p>
      </div>

      <div className="flex flex-col gap-4">
        {FEEDBACK_CRITERIA.map((criterion) => (
          <RatingInput
            key={criterion.key}
            label={criterion.label}
            value={ratings[criterion.key as FeedbackKey]}
            onChange={(value) => setRatings((prev) => ({ ...prev, [criterion.key]: value }))}
            disabled={submitting}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-skill">Additional skills needed</Label>
        <div className="flex gap-2">
          <Input
            id="feedback-skill"
            placeholder="e.g. Digital payments, Tally ERP"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addSkill} disabled={!skillDraft.trim() || submitting}>
            Add
          </Button>
        </div>
        {skills.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1" aria-label="Skills added">
            {skills.map((skill) => (
              <li key={skill} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))}
                  className="rounded-full p-0.5 hover:bg-primary/20"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-comments">Comments</Label>
        <Textarea
          id="feedback-comments"
          rows={4}
          placeholder="How has this employee performed in their role so far?"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={submitting}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}
