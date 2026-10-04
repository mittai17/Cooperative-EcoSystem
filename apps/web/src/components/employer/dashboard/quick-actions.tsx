import Link from "next/link";
import { CalendarPlus, FileBarChart, Plus, ScanSearch, Sparkles, UserSearch, Users, Zap, type LucideIcon } from "lucide-react";
import { SectionCard } from "./section-shell";

const ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Create New Job", href: "/employer/jobs/new", icon: Plus },
  { label: "Browse Candidates", href: "/employer/candidates", icon: UserSearch },
  { label: "AI Candidate Match", href: "/employer/matches", icon: Sparkles },
  { label: "Schedule Interview", href: "/employer/interviews", icon: CalendarPlus },
  { label: "Generate Report", href: "/employer/reports", icon: FileBarChart },
  { label: "Manage Team", href: "/employer/company", icon: Users },
];

export function QuickActions() {
  return (
    <SectionCard title="Quick Actions" icon={Zap}>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-4 text-center text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <action.icon className="size-5 text-primary transition-transform group-hover:scale-105" aria-hidden />
            {action.label}
          </Link>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ScanSearch className="size-3" aria-hidden /> Matching uses each job&apos;s required skills.
      </p>
    </SectionCard>
  );
}
