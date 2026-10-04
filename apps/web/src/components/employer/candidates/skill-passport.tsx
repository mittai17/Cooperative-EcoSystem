import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PassportSkill } from "@/lib/employer/candidates-api";
import { formatDate } from "@/lib/employer/candidates-api";

function evidenceText(evidence: PassportSkill["evidence"]): string | null {
  if (!evidence) return null;
  if (Array.isArray(evidence)) return evidence.length > 0 ? evidence.join("; ") : null;
  return evidence;
}

/** Skill Passport: one row per skill, with proficiency, evidence, verification and last update. Missing values read "Not available". */
export function SkillPassport({ skills }: { skills: PassportSkill[] }) {
  if (skills.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No skills are recorded on this Skill Passport yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {skills.map((skill) => {
        const proficiency = typeof skill.proficiency === "number" ? Math.round(skill.proficiency) : null;
        const evidence = evidenceText(skill.evidence);
        return (
          <li key={skill.name}>
            <Card className="py-4">
              <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading text-sm font-semibold text-foreground">{skill.name}</h3>
                    <Badge variant="outline" className="text-[11px]">{skill.level || "Level not available"}</Badge>
                    {skill.category && <span className="text-xs text-muted-foreground">{skill.category}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Evidence: </span>
                    {evidence ?? "Not available"}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Proficiency</span>
                    <span className="font-mono font-semibold text-foreground">{proficiency !== null ? `${proficiency}%` : "Not available"}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                    {proficiency !== null && (
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, proficiency)}%` }} />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    {skill.verified ? (
                      <span className="inline-flex items-center gap-1 font-medium text-success">
                        <ShieldCheck className="size-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <ShieldQuestion className="size-3.5" /> Unverified
                      </span>
                    )}
                    <span>Last updated {formatDate(skill.last_updated)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
