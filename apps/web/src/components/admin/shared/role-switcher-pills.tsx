"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  BookOpenCheck,
  Briefcase,
  ShieldCheck,
  ScanLine,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DEMO_USERS, loginAsDemoUser } from "@/lib/demo-users";
import { cn } from "@/lib/utils";

const ROLE_ITEMS = [
  { role: "trainee", label: "Trainee", icon: GraduationCap, href: "/trainee/dashboard" },
  { role: "institution", label: "Institution", icon: Building2, href: "/institution/dashboard" },
  { role: "trainer", label: "Trainer", icon: BookOpenCheck, href: "/trainer/dashboard" },
  { role: "employer", label: "Employer", icon: Briefcase, href: "/employer/dashboard" },
  { role: "admin", label: "Admin", icon: ShieldCheck, href: "/admin/dashboard" },
  { role: "kiosk", label: "Kiosk", icon: ScanLine, href: "/kiosk" },
];

export function RoleSwitcherPills({ currentRole = "admin" }: { currentRole?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(true);

  // Detect which role is active based on pathname or prop
  let activeRole = currentRole;
  if (pathname.startsWith("/trainee")) activeRole = "trainee";
  else if (pathname.startsWith("/institution")) activeRole = "institution";
  else if (pathname.startsWith("/trainer")) activeRole = "trainer";
  else if (pathname.startsWith("/employer")) activeRole = "employer";
  else if (pathname.startsWith("/admin")) activeRole = "admin";
  else if (pathname.startsWith("/kiosk")) activeRole = "kiosk";

  const handleRoleClick = (roleKey: string, href: string) => {
    const demoUser = DEMO_USERS.find((u) => u.role === roleKey);
    if (demoUser) {
      loginAsDemoUser(demoUser);
    } else {
      router.push(href);
    }
  };

  if (isMinimized) {
    return (
      <aside aria-label="Demo Evaluator Role Switcher" className="fixed bottom-4 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/95 dark:bg-card/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xl backdrop-blur-md hover:bg-slate-100 cursor-pointer"
        >
          <ShieldCheck className="size-3.5 text-[#E30B1C]" />
          <span>Role Switcher (Admin)</span>
          <ChevronUp className="size-3.5 text-slate-400" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Demo Evaluator Role Switcher"
      className="fixed bottom-4 right-6 z-50 flex items-center gap-1.5 rounded-full border border-slate-300/80 dark:border-border bg-white/95 dark:bg-card/95 p-1.5 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.01]"
    >
      <div className="flex items-center gap-1.5 px-1">
        {ROLE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRole === item.role;

          return (
            <button
              key={item.role}
              type="button"
              onClick={() => handleRoleClick(item.role, item.href)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0 cursor-pointer shadow-2xs",
                isActive
                  ? "bg-[#E30B1C] text-white font-semibold shadow-xs hover:bg-[#c80a18]"
                  : "bg-slate-50 dark:bg-muted text-slate-700 dark:text-muted-foreground border border-slate-200/80 dark:border-border hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-white" : "text-slate-500 dark:text-muted-foreground")} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="flex size-6 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-0.5 cursor-pointer"
          title="Minimize Role Switcher"
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
    </aside>
  );
}
