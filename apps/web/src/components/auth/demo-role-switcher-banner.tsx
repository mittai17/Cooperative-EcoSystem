"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
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
import { DEMO_USERS, getActiveDemoSession, loginAsDemoUser, signOutDemo, type DemoUser } from "@/lib/demo-users";
import { cn } from "@/lib/utils";

const ROLE_ICONS = {
  trainee: GraduationCap,
  institution: Building2,
  trainer: BookOpenCheck,
  employer: Briefcase,
  admin: ShieldCheck,
  kiosk: ScanLine,
};

export function DemoRoleSwitcherBanner() {
  const pathname = usePathname();
  const [session, setSession] = useState<{
    role: string | null;
    name: string | null;
    demoUser: DemoUser | null;
  }>({ role: null, name: null, demoUser: null });
  const [minimized, setMinimized] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    const active = getActiveDemoSession();
    setSession({
      role: active.role,
      name: active.name,
      demoUser: active.demoUser,
    });
  }, [pathname]);

  // If no demo session is active, don't show the banner
  if (!session.role) {
    return null;
  }

  const handleSwitch = (user: DemoUser) => {
    if (user.role === session.role) return;
    setSwitching(user.role);
    loginAsDemoUser(user);
  };

  const handleSignOut = () => {
    setSwitching("signout");
    signOutDemo();
  };

  if (minimized) {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-end px-3 py-1 bg-background/80 backdrop-blur border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-primary">
            <Sparkles className="size-3" /> Demo: {session.demoUser?.name ?? session.role}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMinimized(false)}
          >
            Switch Role <ChevronDown className="ml-1 size-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-primary/20 bg-card/95 text-card-foreground shadow-sm backdrop-blur">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        {/* Left: Active Role Indicator */}
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/30 flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
            <Sparkles className="size-3" />
            DEMO
          </Badge>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground hidden sm:inline">Active:</span>
            <span className="font-bold text-foreground">
              {session.demoUser?.name || session.name || session.role}
            </span>
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              ({session.demoUser?.org || session.role})
            </span>
          </div>
        </div>

        {/* Center: 1-Click Role Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {DEMO_USERS.map((user) => {
            const Icon = ROLE_ICONS[user.role as keyof typeof ROLE_ICONS] ?? GraduationCap;
            const isCurrent = session.role === user.role;
            const isTarget = switching === user.role;

            return (
              <Button
                key={user.id}
                size="sm"
                variant={isCurrent ? "default" : "outline"}
                className={cn(
                  "h-7 text-xs px-2 sm:px-2.5 transition-all gap-1 rounded-lg",
                  isCurrent
                    ? "shadow-sm pointer-events-none"
                    : "hover:bg-primary/10 hover:border-primary/40 text-muted-foreground hover:text-foreground"
                )}
                disabled={Boolean(switching)}
                onClick={() => handleSwitch(user)}
                title={`Switch to ${user.name} (${user.roleTitle})`}
              >
                <Icon className="size-3" />
                <span className="capitalize">{user.role}</span>
                {isTarget && <span className="animate-spin text-[10px]">…</span>}
              </Button>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSignOut}
            disabled={switching === "signout"}
            className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Sign out of demo session"
          >
            <LogOut className="mr-1 size-3" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setMinimized(true)}
            className="h-7 size-7 p-0 text-muted-foreground hover:text-foreground"
            title="Minimize demo banner"
          >
            <ChevronUp className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
