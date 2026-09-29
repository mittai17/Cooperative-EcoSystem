"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Building2,
  BookOpenCheck,
  Briefcase,
  ShieldCheck,
  ScanLine,
  ArrowRight,
  Sparkles,
  LogOut,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface DemoLoginCardProps {
  className?: string;
  compact?: boolean;
}

export function DemoLoginCard({ className, compact = false }: DemoLoginCardProps) {
  const [activeSession, setActiveSession] = useState<{
    role: string | null;
    name: string | null;
  }>({ role: null, name: null });
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    const session = getActiveDemoSession();
    setActiveSession({ role: session.role, name: session.name });
  }, []);

  const handleLogin = (user: DemoUser) => {
    setLoadingRole(user.role);
    loginAsDemoUser(user);
  };

  const handleSignOut = () => {
    setLoadingRole("signout");
    signOutDemo();
  };

  return (
    <Card className={cn("border-border shadow-xl backdrop-blur-sm bg-card/95 overflow-hidden", className)}>
      {/* Decorative top accent gradient */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500" />

      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <CardTitle className="font-heading text-lg font-bold sm:text-xl">
              1-Click Demo Showcase
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">
            Evaluator Mode
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
          Instant login with fully populated personas — no password, OTP, or Clerk signup required.
        </CardDescription>

        {activeSession.role && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <span>
                Active session: <strong className="font-semibold text-foreground">{activeSession.name ?? activeSession.role}</strong> ({activeSession.role})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={loadingRole === "signout"}
              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-1 size-3.5" />
              Sign Out Demo
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
          {DEMO_USERS.map((demoUser) => {
            const Icon = ROLE_ICONS[demoUser.role as keyof typeof ROLE_ICONS] ?? GraduationCap;
            const isActive = activeSession.role === demoUser.role;
            const isLoading = loadingRole === demoUser.role;

            return (
              <div
                key={demoUser.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                    : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs shadow-sm bg-gradient-to-br",
                          demoUser.accentColor
                        )}
                      >
                        {demoUser.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {demoUser.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {demoUser.org}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0 font-medium px-1.5 py-0.5", demoUser.badgeTone)}>
                      <Icon className="mr-1 size-3" />
                      {demoUser.role}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                    {demoUser.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Target: <code className="text-foreground/90">{demoUser.target}</code>
                  </span>
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "secondary"}
                    className="h-7 text-xs px-2.5 gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    onClick={() => handleLogin(demoUser)}
                    disabled={Boolean(loadingRole)}
                  >
                    {isLoading ? (
                      "Loading..."
                    ) : isActive ? (
                      <>
                        Active <ArrowRight className="size-3" />
                      </>
                    ) : (
                      <>
                        Quick Login <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground border border-border/50">
          <div className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-muted-foreground" />
            <span>Cookies set for instant middleware bypass. Session persists for 7 days.</span>
          </div>
          {activeSession.role && (
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-destructive hover:underline"
            >
              Clear demo session
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
