import Link from "next/link";
import { ArrowRight, Sparkles, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CandidateApplicationRef,
  CandidateAssessment,
  CandidateExperience,
  CandidateProfile,
  CandidateProject,
  CandidateTraining,
} from "@/lib/employer/candidates-api";
import { formatDate } from "@/lib/employer/candidates-api";
import { SkillPassport } from "./skill-passport";
import { CertificateList } from "./certificate-list";

export function FactRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value ?? "Not available"}</dd>
    </div>
  );
}

export function EmptyPanel({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Overview: DATABASE FACTS and AI-GENERATED summary are kept in separate, labelled blocks. */
export function OverviewPanel({ profile }: { profile: CandidateProfile }) {
  const experience = profile.years_of_experience != null ? `${profile.years_of_experience} year${profile.years_of_experience === 1 ? "" : "s"}` : null;
  const topSkills = profile.skills.slice(0, 5);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4 text-primary" /> DATABASE FACTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <FactRow label="Education" value={profile.education_level} />
              <FactRow label="Experience" value={experience} />
              <FactRow label="Location" value={profile.location || null} />
              <FactRow label="Availability" value={profile.availability} />
              <FactRow label="Languages" value={profile.languages?.length ? profile.languages.join(", ") : null} />
              <FactRow label="Verified skills" value={`${profile.skills.filter((s) => s.verified).length} of ${profile.skills.length}`} />
              <FactRow label="Certificates" value={profile.certificates.length} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio || "No bio has been added by this candidate."}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> AI-GENERATED summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {profile.ai_summary?.text ? (
              <>
                <p className="text-sm leading-relaxed text-foreground">{profile.ai_summary.text}</p>
                <p className="text-[11px] text-muted-foreground">
                  Generated {formatDate(profile.ai_summary.generated_at)}. Check against the database facts before relying on it.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No AI summary is available for this profile.</p>
            )}
          </CardContent>
        </Card>
        <SectionCard title="Top skills">
          {topSkills.length === 0 ? (
            <EmptyPanel>No skills are recorded yet.</EmptyPanel>
          ) : (
            <ul className="flex flex-col gap-3">
              {topSkills.map((skill) => (
                <li key={skill.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      {skill.name}
                      {skill.verified && <Badge variant="outline" className="border-success/30 text-[10px] text-success">Verified</Badge>}
                    </span>
                    <span className="font-mono text-xs font-semibold">{typeof skill.proficiency === "number" ? `${Math.round(skill.proficiency)}%` : "Not available"}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    {typeof skill.proficiency === "number" && (
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, skill.proficiency)}%` }} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        <SectionCard title="Certificates">
          <CertificateList certificates={profile.certificates.slice(0, 2)} />
          {profile.certificates.length > 2 && (
            <p className="mt-3 text-xs text-muted-foreground">{profile.certificates.length - 2} more in the Certificates tab.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export function PassportPanel({ profile }: { profile: CandidateProfile }) {
  return <SkillPassport skills={profile.skills} />;
}

export function CertificatesPanel({ profile }: { profile: CandidateProfile }) {
  return <CertificateList certificates={profile.certificates} />;
}

export function TrainingPanel({ items }: { items: CandidateTraining[] | null | undefined }) {
  if (items === undefined || items === null) return <EmptyPanel>Training history is not available for this candidate.</EmptyPanel>;
  if (items.length === 0) return <EmptyPanel>No training programmes are recorded.</EmptyPanel>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={`${item.programme}-${index}`}>
          <Card className="py-3">
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.programme}</p>
                <p className="text-xs text-muted-foreground">Completed {formatDate(item.completed_on)}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Status: {item.status || "Not available"}</span>
                <span>Attendance: {typeof item.attendance_pct === "number" ? `${Math.round(item.attendance_pct)}%` : "Not available"}</span>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function AssessmentsPanel({ items }: { items: CandidateAssessment[] | null | undefined }) {
  if (items === undefined || items === null) return <EmptyPanel>Assessment results are not available for this candidate.</EmptyPanel>;
  if (items.length === 0) return <EmptyPanel>No assessments on record.</EmptyPanel>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const pct = typeof item.score === "number" && item.max_score ? Math.round((item.score / item.max_score) * 100) : null;
        return (
          <li key={item.id ?? `${item.title}-${index}`}>
            <Card className="py-3">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-mono font-semibold text-foreground">
                    {typeof item.score === "number" ? `${item.score}${item.max_score ? ` / ${item.max_score}` : ""}` : "Not available"}
                  </p>
                  {pct !== null && <p className="text-xs text-muted-foreground">{pct}%</p>}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export function ProjectsPanel({ items }: { items: CandidateProject[] | null | undefined }) {
  if (items === undefined || items === null) return <EmptyPanel>Project records are not available for this candidate.</EmptyPanel>;
  if (items.length === 0) return <EmptyPanel>No projects recorded.</EmptyPanel>;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <Card className="h-full py-4">
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.summary || "No summary recorded."}</p>
              {item.outcome && <p className="text-xs text-foreground">Outcome: {item.outcome}</p>}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function ExperiencePanel({ items }: { items: CandidateExperience[] | null | undefined }) {
  if (items === undefined || items === null) return <EmptyPanel>Work experience is not available for this candidate.</EmptyPanel>;
  if (items.length === 0) return <EmptyPanel>No work experience recorded.</EmptyPanel>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={`${item.role}-${index}`}>
          <Card className="py-3">
            <CardContent>
              <p className="text-sm font-semibold text-foreground">{item.role}</p>
              <p className="text-xs text-muted-foreground">
                {[item.organisation, item.period].filter(Boolean).join(" · ") || "Organisation and period not available"}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function ApplicationsPanel({ items }: { items: CandidateApplicationRef[] | null | undefined }) {
  if (items === undefined || items === null) return <EmptyPanel>Application history is not available for this candidate.</EmptyPanel>;
  if (items.length === 0) return <EmptyPanel>This candidate has not applied to any of your postings.</EmptyPanel>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card className="py-3">
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.job_title}</p>
                <p className="text-xs text-muted-foreground">Applied {formatDate(item.applied_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize">{item.status.replace(/_/g, " ")}</Badge>
                <Link href={`/employer/applications/${item.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Open <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
