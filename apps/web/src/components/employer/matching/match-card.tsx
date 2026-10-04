"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ShieldCheck, CircleAlert } from "lucide-react";
import { CandidateAvatar } from "@/components/employer/candidates/candidate-avatar";
import { ShortlistButton } from "@/components/employer/candidates/shortlist-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchResult } from "@/lib/employer/candidates-api";
import { cn } from "@/lib/utils";
import { ExplanationList } from "./explanation-list";
import { MatchBreakdownList } from "./match-breakdown";
import { MatchScoreRing } from "./match-score-ring";
import { recommendedAction } from "./recommended-action";

interface MatchCardProps {
  result: MatchResult;
  jobId: string;
  demo: boolean;
  defaultOpen?: boolean;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function MatchCard({ result, jobId, demo, defaultOpen = false, onNotice, onError }: MatchCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { candidate } = result;
  const action = recommendedAction(result.score, result.missing_skills.length, result.recommended_action);
  const profileHref = `/employer/candidates/${candidate.id}?job=${encodeURIComponent(jobId)}`;
  const detailsId = `match-details-${candidate.id}`;

  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <CandidateAvatar name={candidate.name} photoUrl={candidate.photo_url} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-base font-semibold text-foreground">{candidate.name}</h3>
                {result.missing_skills.length === 0 && result.matched_skills.length > 0 && (
                  <Badge variant="outline" className="gap-1 border-success/30 text-[11px] text-success">
                    <ShieldCheck className="size-3" /> All required skills held
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {candidate.occupation ?? "Role not set"} · {candidate.location || "Location not set"}
              </p>
              {candidate.education_level && <p className="text-xs text-muted-foreground">{candidate.education_level}</p>}
              <div className="flex flex-wrap gap-1.5">
                {result.matched_skills.map((skill) => (
                  <Badge key={skill.name} variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-[11px] text-foreground">
                    {skill.name}
                    {skill.verified && <ShieldCheck className="size-3 text-success" aria-label="Verified" />}
                  </Badge>
                ))}
                {result.missing_skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="gap-1 border-warning/40 text-[11px] text-warning">
                    <CircleAlert className="size-3" /> Missing: {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <MatchScoreRing score={result.score} size={76} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((value) => !value)}
          >
            Breakdown &amp; why
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={profileHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
              View Profile
            </Link>
            <ShortlistButton
              candidateId={candidate.id}
              candidateName={candidate.name}
              size="sm"
              demo={demo}
              onError={onError}
              onDone={() => onNotice(demo ? `${candidate.name} shortlisted in the demo. Nothing was saved.` : `${candidate.name} saved to your shortlist.`)}
            />
          </div>
        </div>

        {open && (
          <div id={detailsId} className="grid gap-6 border-t border-border pt-4 lg:grid-cols-2">
            <MatchBreakdownList breakdown={result.breakdown} />
            <ExplanationList items={result.explanation} recommendedAction={action.text} recommendedIsRuleBased={action.ruleBased} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
