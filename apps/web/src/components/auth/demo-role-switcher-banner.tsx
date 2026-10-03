"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LogOut,
  GraduationCap,
  Building2,
  BookOpenCheck,
  Briefcase,
  ShieldCheck,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEMO_USERS,
  getActiveDemoSession,
  loginAsDemoUser,
  setDemoSessionCookies,
  getDemoUserForRole,
  signOutDemo,
  type DemoUser,
} from "@/lib/demo-users";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, React.ElementType> = {
  trainee: GraduationCap,
  institution: Building2,
  trainer: BookOpenCheck,
  employer: Briefcase,
  admin: ShieldCheck,
  kiosk: ScanLine,
};

function detectRoleFromPath(pathname: string): UserRole {
  if (pathname.startsWith("/institution")) return "institution";
  if (pathname.startsWith("/trainer")) return "trainer";
  if (pathname.startsWith("/employer")) return "employer";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/kiosk")) return "kiosk";
  if (pathname.startsWith("/trainee")) return "trainee";
  return "trainee";
}

interface DemoRoleSwitcherBannerProps {
  currentRole?: UserRole;
}

export function DemoRoleSwitcherBanner({ currentRole }: DemoRoleSwitcherBannerProps = {}) {
  const pathname = usePathname();
  const [switching, setSwitching] = useState<string | null>(null);

  // Derive initial active role and demo user
  const effectiveRole = currentRole || detectRoleFromPath(pathname);
  const fallbackUser = getDemoUserForRole(effectiveRole);

  const [session, setSession] = useState<{
    role: string;
    name: string;
    org: string;
    demoUser: DemoUser;
  }>({
    role: fallbackUser.role,
    name: fallbackUser.name,
    org: fallbackUser.org,
    demoUser: fallbackUser,
  });

  useEffect(() => {
    const active = getActiveDemoSession();
    if (active.role && active.demoUser) {
      setSession({
        role: active.role,
        name: active.name || active.demoUser.name,
        org: active.demoUser.org,
        demoUser: active.demoUser,
      });
    } else {
      const targetRole = currentRole || detectRoleFromPath(pathname);
      const user = getDemoUserForRole(targetRole);
      setSession({
        role: user.role,
        name: user.name,
        org: user.org,
        demoUser: user,
      });
      setDemoSessionCookies(user);
    }
  }, [pathname, currentRole]);

  const handleSwitch = (user: DemoUser) => {
    if (user.role === session.role) return;
    setSwitching(user.role);
    loginAsDemoUser(user);
  };

  const handleSignOut = () => {
    setSwitching("signout");
    signOutDemo();
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/80 bg-slate-50/90 dark:bg-card/90 text-foreground shadow-xs backdrop-blur">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        {/* Left: Role Switcher Pill Buttons (Matches evaluator request Screenshot_20261003_184613.png) */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {DEMO_USERS.map((user) => {
            const Icon = ROLE_ICONS[user.role] ?? GraduationCap;
            const isCurrent = session.role === user.role;
            const isTarget = switching === user.role;

            return (
              <button
                key={user.id}
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all shrink-0 cursor-pointer shadow-2xs",
                  isCurrent
                    ? "bg-[#E30B1C] text-white hover:bg-[#c80a18] shadow-xs font-semibold cursor-default"
                    : "bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-muted text-slate-600 dark:text-muted-foreground hover:text-foreground border border-slate-200/90 dark:border-border"
                )}
                disabled={Boolean(switching) && !isCurrent}
                onClick={() => handleSwitch(user)}
                title={`Switch to ${user.name} (${user.roleTitle})`}
              >
                <Icon className={cn("size-3.5", isCurrent ? "text-white" : "text-slate-500 dark:text-muted-foreground")} />
                <span className="capitalize">{user.role}</span>
                {isTarget && <span className="animate-spin text-[10px]">…</span>}
              </button>
            );
          })}
        </div>

        {/* Right: Active user indicator & Sign out */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Active:</span>
            <span className="font-semibold text-foreground">
              {session.demoUser?.name || session.name}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleSignOut}
            disabled={switching === "signout"}
            className="h-7 text-xs px-2.5 font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sign out of demo session"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
