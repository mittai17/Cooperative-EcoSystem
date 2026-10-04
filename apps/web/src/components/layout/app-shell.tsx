"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Menu, Bell, Search, ChevronDown, LogOut, MessageSquare, Settings, UserCircle } from "lucide-react";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { roleNav } from "@/lib/nav-config";
import type { UserRole } from "@/lib/types";
import { DemoRoleSwitcherBanner } from "@/components/auth/demo-role-switcher-banner";
import { getDemoUserForRole, signOutDemo } from "@/lib/demo-users";
import { useT } from "@/i18n";

interface AppShellProps {
  role: UserRole;
  userName?: string;
  userSubtitle?: string;
  children: ReactNode;
}

/** Number of demo notifications per role. Their text lives in shell.demoNotes.<role>.<index>. */
const demoNoteCounts: Record<UserRole, number> = {
  trainee: 3,
  institution: 2,
  trainer: 2,
  employer: 2,
  admin: 2,
  kiosk: 2,
};

/** Small pinned illustration card at the bottom of the trainee sidebar,
 * matching the reference's "Keep Learning" spotlight card -- a flat,
 * geometric SVG in the brand red palette, no photo. */
function SidebarSpotlightCard({ role }: { role: UserRole }) {
  const t = useT();
  if (role === "institution") {
    return (
      <div className="mx-3 mb-4 overflow-hidden rounded-2xl bg-gradient-to-b from-rose-50 to-orange-50/60 p-3.5 border border-rose-100/80 dark:border-border dark:bg-card">
        <p className="font-heading text-xs font-bold text-foreground leading-tight">{t("shell.spotlight.institution.title")}</p>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t("shell.spotlight.institution.tagline")}</p>
        <div className="mt-2.5 h-20 w-full overflow-hidden rounded-xl border border-rose-200/50">
          <img 
            src="/vamnicom-campus.jpg" 
            alt={t("shell.spotlight.campusAlt")} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-4 overflow-hidden rounded-2xl bg-tint-red-bg p-4">
      <p className="font-heading text-sm font-bold text-foreground">{t("shell.spotlight.keepLearning.title")}</p>
      <p className="text-xs text-muted-foreground">{t("shell.spotlight.keepLearning.tagline")}</p>
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
  const t = useT();
  const meta = roleNav[role];
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "Hostel Management": true,
  });

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4 overflow-y-auto">
      {meta.navItems.map((item) => {
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const isParentActive =
          pathname === item.href ||
          Boolean(hasChildren && item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")));
        const isExpanded = expandedItems[item.label] ?? isParentActive;
        const Icon = item.icon;

        if (hasChildren) {
          return (
            <div key={item.label} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggleExpand(item.label)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer text-left",
                  isParentActive
                    ? "bg-rose-50 text-red-600 font-semibold dark:bg-rose-950/40 dark:text-red-400"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("size-4.5 shrink-0", isParentActive ? "text-red-600 dark:text-red-400" : "")} strokeWidth={1.9} />
                  <span>{t(`nav.${role}.${item.href}`, item.label)}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    isExpanded ? "rotate-180 text-red-600 dark:text-red-400" : "text-muted-foreground"
                  )}
                />
              </button>

              {isExpanded && (
                <div className="mt-1 flex flex-col space-y-0.5 pl-4 border-l-2 border-rose-200 dark:border-rose-900/60 ml-5 py-0.5">
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
                          isChildActive
                            ? "bg-rose-100/80 text-red-700 font-bold dark:bg-rose-900/50 dark:text-red-300 shadow-2xs"
                            : "text-muted-foreground hover:bg-rose-50/50 hover:text-red-600 dark:hover:bg-muted/40"
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full shrink-0", isChildActive ? "bg-red-600" : "bg-muted-foreground/40")} />
                        <span className="truncate">{t(`nav.${role}.children.${child.href}`, child.label)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-rose-50 text-red-600 font-semibold dark:bg-rose-950/40 dark:text-red-400"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className={cn("size-4.5 shrink-0", active ? "text-red-600 dark:text-red-400" : "")} strokeWidth={1.9} />
            <span className="flex-1 truncate">{t(`nav.${role}.${item.href}`, item.label)}</span>
            {item.badge && (
              <span className="rounded-full bg-rose-100/90 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-rose-900/60 dark:text-red-300">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ role, userName, userSubtitle, children }: AppShellProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = roleNav[role];
  const t = useT();
  const notifications = Array.from({ length: demoNoteCounts[role] }, (_, index) => ({
    title: t(`shell.demoNotes.${role}.${index}.title`),
    detail: t(`shell.demoNotes.${role}.${index}.detail`),
  }));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4 text-sidebar-foreground">
          <Logo size="sm" />
        </div>
        <div className="px-4 pt-4">
          <span className="demo-data-tag">{t("shell.workspaceTag").replace("{role}", meta.label)}</span>
        </div>
        <SidebarNav role={role} />
        {(role === "trainee" || role === "institution") && <SidebarSpotlightCard role={role} />}
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
          {(role === "trainee" || role === "institution") && <SidebarSpotlightCard role={role} />}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoRoleSwitcherBanner currentRole={role} />
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t("shell.openNavigation")}
            >
              <Menu className="size-4.5" />
            </Button>
            <div className="relative hidden w-full max-w-md sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("shell.searchPlaceholder")}
                className="rounded-full bg-muted/60 pl-9 pr-14 text-xs sm:text-sm"
                aria-label={t("shell.search")}
              />
              <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-2xs">
                Ctrl K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label={t("shell.notifications")} className="relative cursor-pointer">
                    <Bell className="size-4.5" />
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-2xs">
                      3
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>{t("shell.notifications")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((note) => (
                  <div key={note.title} className="flex flex-col gap-0.5 rounded-md px-1.5 py-1.5 text-sm">
                    <span className="font-medium text-foreground">{note.title}</span>
                    <span className="text-xs text-muted-foreground">{note.detail}</span>
                  </div>
                ))}
                <DropdownMenuSeparator />
                <p className="px-1.5 py-1 text-center text-xs text-muted-foreground">
                  {t("shell.demoNotesFooter")}
                </p>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" aria-label={t("shell.messages")} className="cursor-pointer">
              <MessageSquare className="size-4.5" />
            </Button>

            <LanguageSelector />
            <ThemeToggle />

            {/* User Profile & Account Menu */}
            {(() => {
              const currentUser = getDemoUserForRole(role);
              const isNCCT = role === "admin";
              const effectiveName = userName || (isNCCT ? t("shell.adminUser") : currentUser.name);
              const effectiveSubtitle = userSubtitle || (isNCCT ? t("nav.roles.admin") : currentUser.roleTitle);
              const effectiveEmail = userSubtitle?.includes("@") ? userSubtitle : currentUser.email;
              const effectiveInitials = isNCCT
                ? "AD"
                : userName
                  ? userName
                      .split(" ")
                      .filter(Boolean)
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : currentUser.initials;

              const roleProfileRoutes: Record<UserRole, string> = {
                trainee: "/trainee/profile",
                employer: "/employer/profile",
                trainer: "/trainer/profile",
                institution: "/institution/profile",
                admin: "/admin/profile",
                kiosk: "/kiosk/status",
              };

              const roleSettingsRoutes: Record<UserRole, string> = {
                trainee: "/trainee/profile?tab=settings",
                employer: "/employer/settings",
                trainer: "/trainer/settings",
                institution: "/institution/settings",
                admin: "/admin/settings",
                kiosk: "/kiosk/status",
              };

              const profileHref = roleProfileRoutes[role] || `/${role}/profile`;
              const settingsHref = roleSettingsRoutes[role] || `/${role}/settings`;

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative flex items-center gap-2 rounded-full p-1 pl-2 hover:bg-muted cursor-pointer"
                        aria-label={t("shell.userMenu")}
                      >
                        <span className="flex size-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-red-600 border border-rose-200">
                          {effectiveInitials}
                        </span>
                        <span className="hidden text-left text-xs md:block">
                          <span className="block font-semibold text-foreground leading-tight">{effectiveName}</span>
                          <span className="block text-[10px] text-muted-foreground">{effectiveSubtitle}</span>
                        </span>
                        <ChevronDown className="size-3.5 text-muted-foreground hidden md:block" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>
                      <p className="font-semibold text-foreground">{effectiveName}</p>
                      <p className="text-xs text-muted-foreground truncate">{effectiveEmail}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 capitalize">
                        {t("shell.roleWorkspace").replace("{role}", t(`nav.roles.${role}`))}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      render={<Link href={profileHref} />}
                      onClick={() => router.push(profileHref)}
                      className="cursor-pointer"
                    >
                      <UserCircle className="mr-2 size-4" />
                      <span>{t("shell.myProfile", "My Profile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href={settingsHref} />}
                      onClick={() => router.push(settingsHref)}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 size-4" />
                      <span>{t("shell.settings", "Settings")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOutDemo()}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 size-4" />
                      <span>{t("shell.signOut")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
