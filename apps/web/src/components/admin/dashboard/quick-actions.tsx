"use client";

import Link from "next/link";
import {
  Compass,
  Landmark,
  User,
  Users,
  BookOpen,
  Briefcase,
  FileText,
} from "lucide-react";

const ACTIONS = [
  { label: "Add Institution", href: "/admin/institutions/new", icon: Landmark },
  { label: "Add Trainer", href: "/admin/trainers/new", icon: User },
  { label: "Enroll Trainee", href: "/admin/trainees/new", icon: Users },
  { label: "Create Program", href: "/admin/programmes/new", icon: BookOpen },
  { label: "Post Job", href: "/admin/jobs-placements/new", icon: Briefcase },
  { label: "Generate Report", href: "/admin/reports", icon: FileText },
];

export function QuickActions() {
  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-2xs">
      {/* Header */}
      <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground mb-3">
        <Compass className="size-4.5 text-red-600" />
        <span>Quick Actions</span>
      </h2>

      {/* Grid of 6 buttons */}
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-white dark:bg-card/60 p-3 text-center transition-all hover:border-red-200 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 group cursor-pointer shadow-2xs"
            >
              <Icon className="size-5 text-red-600 group-hover:scale-105 transition-transform" />
              <span className="font-heading text-xs font-semibold text-foreground group-hover:text-red-600 transition-colors">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
