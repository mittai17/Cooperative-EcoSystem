import { Eye, MessageSquareText, Star, UserRound } from "lucide-react";
import type { EmployerFeedbackItem } from "@/lib/employer/jobs-api";
import { cn } from "@/lib/utils";
import { RowMenu } from "./row-menu";
import { SectionCard, SectionEmpty, SectionError, SectionSkeleton, initials } from "./section-shell";

export function EmployerFeedbackCard({
  items,
  loading,
  error,
  onRetry,
}: {
  items: EmployerFeedbackItem[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <SectionCard title="Employer Feedback (Post Hire)" icon={MessageSquareText} action={{ label: "View All", href: "/employer/feedback" }}>
      {error ? (
        <SectionError onRetry={onRetry} />
      ) : loading || items === null ? (
        <SectionSkeleton rows={3} />
      ) : items.length === 0 ? (
        <SectionEmpty
          title="No post-hire feedback yet"
          body="Share feedback on hired trainees so training providers can see how skills perform on the job."
          cta={{ label: "Give feedback", href: "/employer/feedback" }}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {initials(item.candidate_name) || <UserRound className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{item.candidate_name}</p>
                {item.role && <p className="truncate text-xs text-muted-foreground">{item.role}</p>}
                <p className="text-[11px] text-muted-foreground">{item.hired_ago}</p>
                <Stars rating={item.rating} />
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.comment}</p>
              </div>
              <RowMenu
                label={`More actions for ${item.candidate_name}`}
                items={[
                  ...(item.trainee_id
                    ? [{ label: "View profile", href: `/employer/candidates/${item.trainee_id}`, icon: Eye }]
                    : []),
                  { label: "Post-hire feedback", href: "/employer/feedback", icon: MessageSquareText },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function Stars({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="mt-1 flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-3", i < value ? "fill-amber-400 text-amber-400" : "text-border")} aria-hidden />
      ))}
    </div>
  );
}
