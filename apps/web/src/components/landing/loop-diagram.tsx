import type { LucideIcon } from "lucide-react";
import {
  UserPlus,
  BookOpen,
  Layers,
  BadgeCheck,
  Target,
  Briefcase,
  MessageSquareText,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

interface LoopStage {
  label: string;
  description: string;
  icon: LucideIcon;
}

const stages: LoopStage[] = [
  { label: "Registration", description: "Trainee & institution onboarding", icon: UserPlus },
  { label: "Training", description: "Cooperative-sector programmes & courses", icon: BookOpen },
  { label: "Skills", description: "AI-inferred skills from performance data", icon: Layers },
  { label: "Certification", description: "Verifiable digital certificates", icon: BadgeCheck },
  { label: "Job Matching", description: "AI matches skills to open roles", icon: Target },
  { label: "Employment", description: "Placement with cooperative employers", icon: Briefcase },
  { label: "Employer Feedback", description: "On-the-job performance signals", icon: MessageSquareText },
  { label: "New Training", description: "Feedback reshapes future curricula", icon: RotateCcw },
];

const tileClasses = ["icon-tile-red"];

export function LoopDiagram() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="relative">
              <div className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={`flex size-9 items-center justify-center ${tileClasses[index % tileClasses.length]}`}>
                    <Icon className="size-4.5" strokeWidth={1.9} />
                  </span>
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <p className="font-heading text-sm font-semibold text-foreground">{stage.label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{stage.description}</p>
              </div>
              {index < stages.length - 1 && (index + 1) % 4 !== 0 && (
                <ArrowRight
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 -right-4 hidden size-4 -translate-y-1/2 text-border sm:block"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-success/40 bg-success/5 px-4 py-3 text-center">
        <RotateCcw className="size-4 shrink-0 text-success" />
        <p className="text-xs font-medium text-success sm:text-sm">
          Employer feedback flows straight back into curriculum design, closing the loop so training
          keeps matching real, current demand.
        </p>
      </div>
    </div>
  );
}
