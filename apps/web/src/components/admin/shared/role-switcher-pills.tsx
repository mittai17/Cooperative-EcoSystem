"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  BookOpenCheck,
  Briefcase,
  ShieldCheck,
  ScanLine,
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

  return (
    <div className="w-full border-b border-border/80 bg-slate-50/90 dark:bg-card/90 px-4 py-2 backdrop-blur">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {ROLE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRole === item.role;

          return (
            <button
              key={item.role}
              type="button"
              onClick={() => handleRoleClick(item.role, item.href)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium transition-all shrink-0 cursor-pointer shadow-2xs",
                isActive
                  ? "bg-[#E30B1C] text-white font-semibold shadow-xs hover:bg-[#c80a18]"
                  : "bg-white dark:bg-card text-slate-600 dark:text-muted-foreground border border-slate-200/90 dark:border-border hover:bg-slate-100 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-white" : "text-slate-500 dark:text-muted-foreground")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
