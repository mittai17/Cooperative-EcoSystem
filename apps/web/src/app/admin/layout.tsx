"use client";

import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  House,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Sparkles,
  UserCircle,
  X,
  Globe,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { DemoRoleSwitcherBanner } from "@/components/auth/demo-role-switcher-banner";
import { AdminBetaBadge } from "@/components/admin/shared/admin-page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleNav, type NavItem } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import { signOutDemo } from "@/lib/demo-users";

/** Single source of truth for admin navigation order: lib/nav-config.ts. */
const ADMIN_NAV: NavItem[] = roleNav.admin.navItems;
const BETA_HREFS = new Set(["/admin/skill-demand"]);
const DASHBOARD_HREF = "/admin/dashboard";

/** Returns the nav item whose href is the longest prefix of the current path. */
function activeNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  for (const item of ADMIN_NAV) {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.href.length)) best = item;
  }
  return best;
}

interface Crumb {
  label: string;
  href?: string;
}

const SUB_SEGMENT_LABELS: Record<string, string> = {
  new: "Add",
  edit: "Edit",
};

/** Builds "Admin > Section > ..." from the path. Record ids are skipped because the layout cannot name them. */
function breadcrumbsFor(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Admin", href: DASHBOARD_HREF }];
  const section = activeNavItem(pathname);
  if (!section) return crumbs;
  crumbs.push({ label: section.label, href: section.href });

  const rest = pathname.slice(section.href.length).split("/").filter(Boolean);
  rest.forEach((segment, index) => {
    const last = index === rest.length - 1;
    const named = SUB_SEGMENT_LABELS[segment];
    if (named) {
      crumbs.push({ label: named, href: last ? undefined : pathname });
    }
  });
  return crumbs;
}

function AdminBreadcrumb({ pathname }: { pathname: string }) {
  const crumbs = breadcrumbsFor(pathname);
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <Link href={DASHBOARD_HREF} aria-label="Admin home" className="inline-flex items-center hover:text-foreground">
        <House className="size-3.5" aria-hidden />
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
            <ChevronRight className="size-3 text-muted-foreground/70" aria-hidden />
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-medium text-foreground")}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeNavItem(pathname);

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1 px-3 py-2">
      {ADMIN_NAV.map((item) => {
        const isActive = active?.href === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
              isActive
                ? "bg-rose-50 font-semibold text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-slate-500")} aria-hidden />
            <span className="truncate">{item.label}</span>
            {BETA_HREFS.has(item.href) ? <AdminBetaBadge label="Beta" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function NeedHelpBox() {
  return (
    <div className="mx-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-foreground">Need Help?</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Chat with CoopSetu AI</p>
      <button
        type="button"
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-primary bg-white px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-rose-50"
      >
        <Sparkles className="size-3.5" aria-hidden />
        <span>Open Assistant</span>
      </button>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="px-5 pt-5 pb-4">
      <Logo size="sm" />
      <div className="mt-4">
        <p className="text-xs font-bold text-foreground">Admin Workspace</p>
        <p className="text-[11px] leading-snug text-muted-foreground">National Cooperative Training Council</p>
      </div>
    </div>
  );
}

function TopBarSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/admin/institutions?q=${encodeURIComponent(term)}` : DASHBOARD_HREF);
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative hidden w-full max-w-md md:block lg:max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search institutions, trainers, trainees, programs..."
        aria-label="Search admin portal"
        className="h-9 w-full rounded-full border border-slate-200/90 bg-slate-50/70 pr-12 pl-10 text-xs text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        ⌘K
      </kbd>
    </form>
  );
}

function AdminProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-1 pl-1 hover:bg-muted/70"
            aria-label="Admin user menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-primary">
              AD
            </span>
            <span className="hidden text-left text-xs md:block">
              <span className="block font-bold leading-tight text-foreground">Admin User</span>
              <span className="block text-[10px] leading-tight text-muted-foreground">NCCT Admin</span>
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" aria-hidden />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-semibold text-foreground">Admin User</p>
          <p className="text-xs text-muted-foreground">NCCT Admin</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/admin/profile" />}>
          <UserCircle className="mr-2 size-3.5" aria-hidden />
          My profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOutDemo()} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-3.5" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 pt-4 pb-2 text-xs text-muted-foreground">
      CoopSetu AI · National Cooperative Training Council (NCCT)
    </footer>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Escape closes the drawer. Nav links close it through onNavigate.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#F7F9FC] dark:bg-background">
      {/* Desktop sidebar: visible at 1024px and up. Narrower screens use the drawer. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-border/80 bg-white dark:bg-card lg:flex">
        <SidebarBrand />
        <div className="flex-1 overflow-y-auto">
          <AdminSidebarNav />
        </div>
        <div className="mt-auto pt-3 pb-5">
          <NeedHelpBox />
        </div>
      </aside>

      {/* Drawer for screens narrower than 1024px */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-xl dark:bg-card"
          >
            <div className="flex items-start justify-between pr-3">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="mt-5 flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="mt-auto pt-3 pb-5">
              <NeedHelpBox />
            </div>
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Role switcher kept for evaluator navigation across personas */}
        <DemoRoleSwitcherBanner currentRole="admin" />

        <header className="sticky top-0 z-30 flex h-15 items-center justify-between gap-3 border-b border-border/80 bg-white/95 px-4 backdrop-blur sm:px-6 dark:bg-card/95">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-4" aria-hidden />
          </button>

          <TopBarSearch />

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex size-8 items-center justify-center rounded-full text-slate-600 hover:bg-muted dark:text-muted-foreground"
            >
              <Bell className="size-4.5" aria-hidden />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#E30B1C] text-[9px] font-bold text-white">
                5
              </span>
            </button>

            <button
              type="button"
              aria-label="Messages"
              className="flex size-8 items-center justify-center rounded-full text-slate-600 hover:bg-muted dark:text-muted-foreground"
            >
              <MessageSquare className="size-4.5" aria-hidden />
            </button>

            <button
              type="button"
              aria-label="Language selection"
              className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-muted dark:text-muted-foreground"
            >
              <Globe className="size-4 text-slate-500" aria-hidden />
              <span>EN</span>
            </button>

            <div className="h-6 w-px bg-border/60" aria-hidden />

            <AdminProfileMenu />
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col px-4 pt-4 sm:px-6 lg:px-8">
          <AdminBreadcrumb pathname={pathname} />
        </div>

        <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden px-4 pt-4 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6">{children}</div>
          <div className="mx-auto mt-6 w-full max-w-[1600px]">
            <AdminFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
