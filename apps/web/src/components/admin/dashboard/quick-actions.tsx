"use client";

import Link from "next/link";
import { BookOpen, Briefcase, FileText, Landmark, UserPlus, Users, Zap } from "lucide-react";
import { DashboardPanel } from "./panel";

const ACTIONS = [
  { label: "Add Institution", href: "/admin/institutions/new", icon: Landmark },
  { label: "Add Trainer", href: "/admin/trainers", icon: UserPlus },
  { label: "Enroll Trainee", href: "/admin/trainees", icon: Users },
  { label: "Create Program", href: "/admin/programmes", icon: BookOpen },
  { label: "Post Job", href: "/admin/jobs-placements", icon: Briefcase },
  { label: "Generate Report", href: "/admin/reports", icon: FileText },
];

export function QuickActions() {
  return (
    <DashboardPanel icon={Zap} title="Quick Actions" className="h-full bg-rose-50/40">
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border/70 bg-white p-4 text-center transition-colors hover:border-primary/40 hover:bg-rose-50"
            >
              <Icon className="size-5 text-primary transition-transform group-hover:scale-105" aria-hidden />
              <span className="text-xs font-semibold text-foreground group-hover:text-primary">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
