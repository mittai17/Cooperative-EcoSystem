import { CircleAlert, Check } from "lucide-react";
import type { MatchExplanation } from "@/lib/employer/candidates-api";

interface ExplanationListProps {
  items: MatchExplanation[];
  recommendedAction: string;
  recommendedIsRuleBased: boolean;
}

/** "Why this candidate?" built from database facts. Check = match, triangle = gap to review. */
export function ExplanationList({ items, recommendedAction, recommendedIsRuleBased }: ExplanationListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h4 className="font-heading text-sm font-semibold text-foreground">Why this candidate?</h4>
        {items.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No explanation was returned for this candidate.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {items.map((item, index) => (
              <li key={`${item.kind}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                {item.kind === "match" ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-label="Match" />
                ) : (
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Gap" />
                )}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Recommended action</p>
        <p className="mt-1 text-sm text-foreground">{recommendedAction}</p>
        {recommendedIsRuleBased && (
          <p className="mt-1 text-[11px] text-muted-foreground">Rule-based suggestion from the score and gaps above.</p>
        )}
      </div>
    </div>
  );
}
