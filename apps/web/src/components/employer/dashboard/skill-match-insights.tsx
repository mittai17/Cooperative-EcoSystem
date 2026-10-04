import { Info, Target } from "lucide-react";
import { HorizontalBarList } from "@/components/dashboard/horizontal-bar-list";
import type { SkillMatchItem } from "@/lib/employer/jobs-api";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton } from "./section-shell";

export function SkillMatchInsights({
  items,
  loading,
  error,
  onRetry,
}: {
  items: SkillMatchItem[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <SectionCard
      title="AI Skill Match Insights"
      icon={Target}
      action={{ label: "View All", href: "/employer/matches" }}
      headerRight={<Info className="size-3.5 text-muted-foreground" aria-label="Skills matched across active candidates" />}
    >
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || items === null ? (
        <SectionSkeleton rows={5} />
      ) : items.length === 0 ? (
        <SectionEmpty
          title="No skill matches yet"
          body="Once candidates are scored against your active jobs, the most in-demand skills appear here."
          cta={{ label: "Open AI matching", href: "/employer/matches" }}
        />
      ) : (
        <HorizontalBarList
          items={items.map((item) => ({ label: item.skill, value: item.count }))}
          barColorClassName="bg-primary"
        />
      )}
    </SectionCard>
  );
}
