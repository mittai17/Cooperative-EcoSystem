import Link from "next/link";
import { BadgeCheck, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CandidateSummary } from "@/lib/employer/candidates-api";
import { CandidateAvatar, scoreChipClass } from "./candidate-avatar";
import { ShortlistButton } from "./shortlist-button";

interface CandidateCardProps {
  candidate: CandidateSummary;
  jobId?: string;
  onError?: (message: string) => void;
}

const MAX_CHIPS = 4;

export function CandidateCard({ candidate, jobId, onError }: CandidateCardProps) {
  const profileHref = `/employer/candidates/${candidate.id}${jobId ? `?job=${encodeURIComponent(jobId)}` : ""}`;
  const skills = candidate.skills ?? null;
  const visibleSkills = skills?.slice(0, MAX_CHIPS) ?? [];
  const extraSkills = skills ? Math.max(0, skills.length - MAX_CHIPS) : 0;

  return (
    <Card className="flex h-full flex-col gap-4 py-4">
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-start gap-3">
          <CandidateAvatar name={candidate.name} photoUrl={candidate.photo_url} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-heading text-base font-semibold text-foreground">{candidate.name}</h3>
              {candidate.match_score !== null ? (
                <span className={cn("shrink-0 rounded-4xl px-2 py-0.5 text-xs font-semibold", scoreChipClass(candidate.match_score))}>
                  {candidate.match_score}% match
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">{candidate.occupation ?? "Role not set"}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <dd className="truncate">{candidate.location || "Location not set"}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 shrink-0" />
            <dd className="truncate">{candidate.education_level || "Education not available"}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-1.5">
          {skills === null ? (
            <span className="text-xs text-muted-foreground">Skills not returned by search</span>
          ) : skills.length === 0 ? (
            <span className="text-xs text-muted-foreground">No skills recorded yet</span>
          ) : (
            <>
              {visibleSkills.map((skill) => (
                <Badge key={skill.name} variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-[11px] text-foreground">
                  {skill.name}
                  {skill.verified && <ShieldCheck className="size-3 text-success" aria-label="Verified skill" />}
                </Badge>
              ))}
              {extraSkills > 0 && <Badge variant="secondary" className="text-[11px]">+{extraSkills}</Badge>}
            </>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {candidate.certificate_count != null && candidate.certificate_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="size-3.5 text-success" />
              {candidate.certificate_count} certificate{candidate.certificate_count === 1 ? "" : "s"}
            </span>
          )}
          {candidate.availability && <span>{candidate.availability}</span>}
        </div>

        <div className="flex gap-2 border-t border-border pt-3">
          <Link href={profileHref} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>
            View Profile
          </Link>
          <ShortlistButton
            candidateId={candidate.id}
            candidateName={candidate.name}
            className="flex-1"
            onError={onError}
          />
        </div>
      </CardContent>
    </Card>
  );
}
