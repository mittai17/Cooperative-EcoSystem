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
import { Badge } from "@/components/ui/badge";
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
      // Sync cookie so the rest of the application matches current view
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
    <div className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 text-foreground shadow-xs backdrop-blur">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        {/* Left: Active Role Indicator */}
        <div className="flex items-center gap-2">
          <Badge className="bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full">
            <Sparkles className="size-3" />
            DEMO
          </Badge>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground hidden sm:inline">Active:</span>
            <span className="font-bold text-foreground">
              {session.demoUser?.name || session.name}
            </span>
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              ({session.demoUser?.org || session.org})
            </span>
          </div>
        </div>

        {/* Center: 1-Click Role Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {DEMO_USERS.map((user) => {
            const Icon = ROLE_ICONS[user.role] ?? GraduationCap;
            const isCurrent = session.role === user.role;
            const isTarget = switching === user.role;

            return (
              <Button
                key={user.id}
                size="sm"
                variant={isCurrent ? "default" : "outline"}
                className={cn(
                  "h-7 text-xs px-2.5 sm:px-3 transition-all gap-1.5 rounded-full font-medium",
                  isCurrent
                    ? "bg-[#E30B1C] text-white hover:bg-[#c80a18] shadow-xs border-transparent font-semibold cursor-default"
                    : "bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
                )}
                disabled={Boolean(switching) && !isCurrent}
                onClick={() => handleSwitch(user)}
                title={`Switch to ${user.name} (${user.roleTitle})`}
              >
                <Icon className={cn("size-3.5", isCurrent ? "text-white" : "text-muted-foreground")} />
                <span className="capitalize">{user.role}</span>
                {isTarget && <span className="animate-spin text-[10px]">…</span>}
              </Button>
            );
          })}
        </div>

        {/* Right: Sign Out Action */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSignOut}
            disabled={switching === "signout"}
            className="h-7 text-xs px-2.5 font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sign out of demo session"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
