"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EVALUATION_DIMENSIONS,
  EVALUATION_SCORE_MAX,
  type InterviewEvaluation,
} from "@/lib/ai-interview/common";
import { useT } from "@/i18n";

interface EvaluationPanelProps {
  evaluation: InterviewEvaluation | null;
  evaluating: boolean;
  error: string | null;
  onRetry: () => void;
  /** Heading shown above the scores. Defaults to the employer summary wording. */
  heading?: string;
}

/** Dimension labels keyed by the API dimension key; unknown keys fall back to the API label. */
const DIMENSION_KEYS: Record<string, string> = {
  communication: "trainee.aiInterview.dimCommunication",
  domain_knowledge: "trainee.aiInterview.dimDomainKnowledge",
  problem_solving: "trainee.aiInterview.dimProblemSolving",
  cooperative_sector_knowledge: "trainee.aiInterview.dimCoopSector",
};

function ScoreRow({ label, score }: { label: string; score: number | null | undefined }) {
  const t = useT();
  const hasScore = typeof score === "number";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-sm text-slate-800">{label}</span>
      {hasScore ? (
        <span className="font-semibold tabular-nums text-slate-900">
          {score}
          <span className="font-normal text-muted-foreground"> / {EVALUATION_SCORE_MAX}</span>
        </span>
      ) : (
        <span className="text-sm italic text-muted-foreground">{t("trainee.aiInterview.notScored")}</span>
      )}
    </div>
  );
}

function BulletList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Renders the AI summary. It is advisory only and never a hiring decision. */
export function EvaluationPanel({
  evaluation,
  evaluating,
  error,
  onRetry,
  heading,
}: EvaluationPanelProps) {
  const t = useT();
  if (evaluating) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("trainee.aiInterview.generating")}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden />
            {error}
          </p>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("trainee.common.retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) return null;

  const { source, note } = evaluation;
  const result = evaluation;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-primary">
            {heading ?? t("trainee.aiInterview.employerHeading")}
          </CardTitle>
          {source === "fallback" && <Badge variant="secondary">{t("trainee.aiInterview.fallbackBadge")}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-slate-900">{t("trainee.aiInterview.scores")}</h3>
          {EVALUATION_DIMENSIONS.map((dimension) => (
            <ScoreRow
              key={dimension.key}
              label={DIMENSION_KEYS[dimension.key] ? t(DIMENSION_KEYS[dimension.key]) : dimension.label}
              score={result.scores[dimension.key]}
            />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <BulletList title={t("trainee.aiInterview.strengths")} items={result.strengths} empty={t("trainee.aiInterview.noneNoted")} />
          <BulletList title={t("trainee.aiInterview.gaps")} items={result.gaps} empty={t("trainee.aiInterview.noneNoted")} />
          <BulletList
            title={t("trainee.aiInterview.followUp")}
            items={result.follow_up_topics}
            empty={t("trainee.aiInterview.noneSuggested")}
          />
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
