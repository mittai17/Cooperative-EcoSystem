"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { RatingInput } from "@/components/employer/feedback/rating-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EVALUATION_CRITERIA,
  OVERALL_RECOMMENDATIONS,
  saveInterviewEvaluation,
  type Api,
  type EvaluationKey,
  type EvaluationScores,
  type Interview,
} from "@/lib/employer/workflow-api";
import { errorMessage } from "@/lib/employer/workflow-format";

const RECOMMENDATION_ITEMS = OVERALL_RECOMMENDATIONS.map((r) => ({ label: r.label, value: r.value }));

interface EvaluationFormProps {
  api: Api;
  interview: Interview;
  onSaved: (updated: Interview) => void;
}

export function EvaluationForm({ api, interview, onSaved }: EvaluationFormProps) {
  const [scores, setScores] = useState<EvaluationScores>(interview.evaluation ?? {});
  const [recommendation, setRecommendation] = useState<string>(interview.overall_recommendation ?? "");
  const [notes, setNotes] = useState(interview.evaluation_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const missing = EVALUATION_CRITERIA.filter((c) => !scores[c.key as EvaluationKey]);

  function setScore(key: EvaluationKey, value: number) {
    setSaved(false);
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (missing.length > 0) {
      setError(`Score every criterion before saving. Missing: ${missing.map((c) => c.label).join(", ")}.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await saveInterviewEvaluation(api, interview.id, {
        scores,
        overall_recommendation: recommendation || null,
        notes: notes.trim(),
      });
      setSaved(true);
      onSaved(updated);
    } catch (err) {
      setError(errorMessage(err, "Could not save the evaluation. Your entries are still here, so try again."));
    } finally {
      setSaving(false);
    }
  }

  const recommendationLabel = OVERALL_RECOMMENDATIONS.find((r) => r.value === recommendation)?.label;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {EVALUATION_CRITERIA.map((criterion) => (
          <RatingInput
            key={criterion.key}
            label={criterion.label}
            value={scores[criterion.key as EvaluationKey]}
            onChange={(value) => setScore(criterion.key as EvaluationKey, value)}
            disabled={saving}
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label>Overall recommendation</Label>
        <Select
          items={RECOMMENDATION_ITEMS}
          value={recommendation}
          onValueChange={(v) => {
            setSaved(false);
            setRecommendation(v ? String(v) : "");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a recommendation">{recommendationLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RECOMMENDATION_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="evaluation-notes">Notes</Label>
        <Textarea
          id="evaluation-notes"
          rows={5}
          placeholder="Specific examples from the interview that support the scores."
          value={notes}
          onChange={(e) => {
            setSaved(false);
            setNotes(e.target.value);
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {saved && !error && (
        <Alert>
          <AlertDescription>Evaluation saved.</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
          Save Evaluation
        </Button>
      </div>
    </div>
  );
}
