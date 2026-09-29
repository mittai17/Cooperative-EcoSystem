"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";
import { LanguageSelector } from "@/components/layout/language-selector";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { roleNav } from "@/lib/nav-config";
import type { UserRole } from "@/lib/types";
import { DemoRoleSwitcherBanner } from "@/components/auth/demo-role-switcher-banner";

interface AppShellProps {
  role: UserRole;
  userName: string;
  userSubtitle: string;
  children: ReactNode;
}

const roleNotifications: Record<UserRole, { title: string; detail: string }[]> = {
  trainee: [
    { title: "New assessment scheduled", detail: "Bookkeeping with Tally, Module 3 Quiz due Oct 2" },
    { title: "Skill Passport updated", detail: "Dairy Operations confidence rose to 88%" },
    { title: "New job match", detail: "Dairy Procurement Supervisor, 91% match" },
  ],
  institution: [
    { title: "2 nominations pending", detail: "Cooperative Management Fundamentals" },
    { title: "Attendance dip flagged", detail: "Week 3 attendance fell to 85%" },
  ],
  trainer: [
    { title: "Attendance not marked", detail: "2 classes awaiting today's attendance" },
    { title: "Grading queue growing", detail: "15 project submissions awaiting review" },
  ],
  employer: [
    { title: "New verified match", detail: "Ravindra S. Patil, 94% match for Dairy Supervisor" },
    { title: "Posting closing soon", detail: "Apprentice Cooperative Society Secretary" },
  ],
  admin: [
    { title: "Monthly outcomes report ready", detail: "September employment funnel updated" },
    { title: "New institution onboarded", detail: "Fisheries Cooperative Federation, Kochi" },
  ],
  kiosk: [
    { title: "Terminal Online", detail: "Station 01 sync complete with Central Hub" },
    { title: "Attendance Buffer", detail: "18 offline records synced successfully" },
  ],
};

/** Small pinned illustration card at the bottom of the trainee sidebar,
 * matching the reference's "Keep Learning" spotlight card -- a flat,
 * geometric SVG in the brand red palette, no photo. */
function SidebarSpotlightCard() {
  return (
    <div className="mx-3 mb-4 overflow-hidden rounded-2xl bg-tint-red-bg p-4">
      <p className="font-heading text-sm font-bold text-foreground">Keep Learning</p>
      <p className="text-xs text-muted-foreground">Build a Better Tomorrow</p>
      <svg viewBox="0 0 160 88" fill="none" className="mt-3 h-20 w-full" aria-hidden="true">
        <circle cx="34" cy="66" r="30" className="fill-primary/15" />
        <circle cx="128" cy="20" r="14" className="fill-primary/20" />
        <rect x="70" y="40" width="34" height="26" rx="4" className="fill-primary/25" />
        <path d="M70 40 L87 26 L104 40 Z" className="fill-primary/35" />
        <circle cx="47" cy="52" r="9" className="fill-primary" />
        <path
          d="M38 82 C38 66 56 66 56 82"
          className="fill-primary"
        />
        <rect x="30" y="60" width="10" height="14" rx="3" className="fill-primary-foreground/70" />
      </svg>
    </div>
  );
}

function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const meta = roleNav[role];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {meta.navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4.5 shrink-0" strokeWidth={1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ role, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = roleNav[role];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4 text-sidebar-foreground">
          <Logo size="sm" />
        </div>
        <div className="px-4 pt-4">
          <span className="demo-data-tag">{meta.label} workspace &middot; demo</span>
        </div>
        <SidebarNav role={role} />
        {role === "trainee" && <SidebarSpotlightCard />}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-sidebar-border">
            <SheetTitle>
              <Logo size="sm" />
            </SheetTitle>
          </SheetHeader>
          <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
          {role === "trainee" && <SidebarSpotlightCard />}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoRoleSwitcherBanner />
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="size-4.5" />
            </Button>
            <div className="relative hidden w-full max-w-sm sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses, jobs, skills…"
                className="rounded-full bg-muted/60 pl-9"
                aria-label="Search"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <LanguageSelector />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                    <Bell className="size-4.5" />
                    <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {roleNotifications[role].map((note) => (
                  <div key={note.title} className="flex flex-col gap-0.5 rounded-md px-1.5 py-1.5 text-sm">
                    <span className="font-medium text-foreground">{note.title}</span>
                    <span className="text-xs text-muted-foreground">{note.detail}</span>
                  </div>
                ))}
                <DropdownMenuSeparator />
                <p className="px-1.5 py-1 text-center text-xs text-muted-foreground">
                  Demo notifications, live alerts arrive with the backend integration
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            <div className="pl-2 flex items-center">
              <UserButton />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
