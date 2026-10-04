import Link from "next/link";
import { MapPin, Target, UserRound, Eye, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MatchedCandidate } from "@/lib/employer/jobs-api";
import { cn } from "@/lib/utils";
import { RowMenu } from "./row-menu";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton, initials } from "./section-shell";

export function TopMatchedCandidates({
  items,
  loading,
  error,
  onRetry,
}: {
  items: MatchedCandidate[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <SectionCard title="Top Matched Candidates" icon={Target} action={{ label: "View All", href: "/employer/matches" }}>
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || items === null ? (
        <SectionSkeleton rows={4} />
      ) : !Array.isArray(items) || items.length === 0 ? (
        <SectionEmpty
          title="No matched candidates yet"
          body="Publish a job with required skills to see the strongest matches from verified Skill Passports."
          cta={{ label: "Create New Job", href: "/employer/jobs/new" }}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.slice(0, 4).map((candidate) => (
            <li key={candidate.trainee_id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(candidate.name) || <UserRound className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{candidate.name}</p>
                  {candidate.headline && <p className="truncate text-xs text-muted-foreground">{candidate.headline}</p>}
                  {candidate.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {candidate.location}
                    </p>
                  )}
                  {(candidate.top_skills ?? []).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {candidate.top_skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-md bg-primary/5 px-1.5 py-0.5 text-[11px] text-primary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-6 px-2.5 text-xs font-semibold tabular-nums",
                    candidate.match_score >= 80 ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-700",
                  )}
                >
                  {candidate.match_score}% Match
                </Badge>
                <Button size="sm" render={<Link href={`/employer/candidates/${candidate.trainee_id}`} />}>
                  <Eye className="size-3.5" /> Profile
                </Button>
                <RowMenu
                  label={`More actions for ${candidate.name}`}
                  items={[
                    { label: "View profile", href: `/employer/candidates/${candidate.trainee_id}`, icon: UserRound },
                    {
                      label: "Find matches for job",
                      href: candidate.job_id ? `/employer/matches?job=${candidate.job_id}` : "/employer/matches",
                      icon: Sparkles,
                    },
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
