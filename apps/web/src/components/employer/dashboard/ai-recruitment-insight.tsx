import { Sparkles } from "lucide-react";
import type { EmployerDashboard } from "@/lib/employer/jobs-api";
import { buildRecruitmentInsights } from "./insights";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton } from "./section-shell";

export function AiRecruitmentInsight({
  dashboard,
  activeJobs,
  loading,
  error,
}: {
  dashboard: EmployerDashboard | null;
  activeJobs: number;
  loading: boolean;
  error: boolean;
}) {
  const sentences = dashboard ? buildRecruitmentInsights(dashboard, activeJobs) : [];
  return (
    <SectionCard title="AI Recruitment Insight" icon={Sparkles}>
      {error ? (
        <SectionError />
      ) : loading || dashboard === null ? (
        <SectionSkeleton rows={3} />
      ) : sentences.length === 0 ? (
        <SectionEmpty title="No insight yet" body="Insights appear once there is hiring activity to summarise." />
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-foreground marker:text-primary">
            {sentences.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground">
            Written from this dashboard&apos;s live figures using fixed templates. No model call is made.
          </p>
        </div>
      )}
    </SectionCard>
  );
}
