"use client";

import { useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  UserCircle,
  X,
  Sparkles,
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  BookOpen,
  BadgeCheck,
  ClipboardCheck,
  Award,
  TrendingUp,
  FileText,
  Settings,
  ClipboardList,
  Globe,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { RoleSwitcherPills } from "@/components/admin/shared/role-switcher-pills";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { signOutDemo } from "@/lib/demo-users";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Institutions", href: "/admin/institutions", icon: Building2 },
  { label: "Trainers", href: "/admin/trainers", icon: GraduationCap },
  { label: "Trainees", href: "/admin/trainees", icon: Users },
  { label: "Employers", href: "/admin/employers", icon: Briefcase },
  { label: "Training Programs", href: "/admin/programmes", icon: BookOpen },
  { label: "Skill Passport", href: "/admin/skill-passport", icon: BadgeCheck },
  { label: "Jobs & Placements", href: "/admin/jobs-placements", icon: Briefcase },
  { label: "Assessments", href: "/admin/assessments", icon: ClipboardCheck },
  { label: "Certifications", href: "/admin/certifications", icon: Award },
  { label: "AI Analytics", href: "/admin/skill-demand", icon: TrendingUp },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "User Management", href: "/admin/user-management", icon: UserCircle },
  { label: "System Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
];

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1 px-3 py-2">
      {ADMIN_NAV.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "bg-[#FFF1F2] text-[#E30B1C] font-bold dark:bg-rose-950/40 dark:text-red-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-foreground dark:text-sidebar-foreground/75 dark:hover:bg-muted"
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-[#E30B1C] dark:text-red-400" : "text-slate-500")} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function NeedHelpBox() {
  return (
    <div className="mx-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:border-border dark:bg-card p-4">
      <p className="text-xs font-bold text-foreground">Need Help?</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Chat with CoopSetu AI</p>
      <button
        type="button"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-red-500/40 bg-white dark:bg-card px-3 py-1.5 text-xs font-semibold text-[#E30B1C] hover:bg-rose-50 shadow-2xs transition-colors cursor-pointer"
      >
        <Sparkles className="size-3.5 text-[#E30B1C]" />
        <span>Open Assistant</span>
      </button>
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
    router.push(term ? `/admin/institutions?q=${encodeURIComponent(term)}` : "/admin/dashboard");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative hidden w-full max-w-xl md:block">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search users, institutions, trainees, jobs, skills, reports..."
        aria-label="Search admin portal"
        className="h-9.5 w-full rounded-full border border-slate-200/90 dark:border-border bg-slate-50/70 dark:bg-card/70 pr-12 pl-10 text-xs text-foreground outline-none placeholder:text-slate-400 focus-visible:border-red-500 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-red-500/30 transition-all"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-slate-200 bg-white dark:bg-muted px-1.5 py-0.5 text-[10px] font-mono text-slate-400 shadow-2xs">
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
            className="flex items-center gap-2 rounded-full py-1 pr-1.5 pl-1 hover:bg-slate-100 dark:hover:bg-muted/70 cursor-pointer transition-colors"
            aria-label="Admin user menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-[#FEE2E2] dark:bg-rose-950/60 text-xs font-bold text-[#E30B1C]">
              AD
            </span>
            <span className="hidden text-left text-xs md:block">
              <span className="block font-bold text-slate-900 dark:text-foreground leading-tight">Admin User</span>
              <span className="block text-[10px] text-slate-500 dark:text-muted-foreground leading-tight">NCCT Admin</span>
            </span>
            <ChevronDown className="hidden size-3.5 text-slate-400 md:block" />
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
          <UserCircle className="mr-2 size-3.5" />
          My profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOutDemo()} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-background">
      {/* 1. Full-width Top Navigation Bar (Matches CoopSetu AI Admin Dashboard.png exactly) */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 dark:border-border dark:bg-card/95 px-5 backdrop-blur sm:px-6">
        {/* Left: CoopSetu AI Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-4" />
          </button>
          <Link href="/admin/dashboard" className="flex items-center">
            <Logo size="default" />
          </Link>
        </div>

        {/* Center: Search bar */}
        <div className="flex flex-1 justify-center max-w-xl mx-4">
          <TopBarSearch />
        </div>

        {/* Right: Notifications, Messages, Language Toggle, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell with red badge '5' */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-muted text-slate-600 dark:text-muted-foreground transition-colors cursor-pointer"
          >
            <Bell className="size-4.5" />
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[#E30B1C] text-[9px] font-bold text-white shadow-2xs">
              5
            </span>
          </button>

          {/* Message Bubble */}
          <button
            type="button"
            aria-label="Messages"
            className="flex size-9 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-muted text-slate-600 dark:text-muted-foreground transition-colors cursor-pointer"
          >
            <MessageSquare className="size-4.5" />
          </button>

          {/* Language Toggle with Globe icon + EN */}
          <button
            type="button"
            aria-label="Language selection"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-muted text-xs font-bold text-slate-700 dark:text-muted-foreground cursor-pointer transition-colors"
          >
            <Globe className="size-4 text-slate-500" />
            <span>EN</span>
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-border mx-1" />

          {/* Admin User Profile */}
          <AdminProfileMenu />
        </div>
      </header>

      {/* 2. Main Layout below Topbar: Sidebar on Left, Content on Right */}
      <div className="flex flex-1">
        {/* Desktop Sidebar (Starts BELOW top navbar) */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col overflow-y-auto border-r border-slate-200/80 bg-white dark:border-border dark:bg-card md:flex">
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold text-slate-900 dark:text-foreground">Admin Workspace</p>
            <p className="text-[11px] text-slate-500 dark:text-muted-foreground">National Cooperative Training (NCCT)</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AdminSidebarNav />
          </div>
          <div className="mt-auto pt-3 pb-4">
            <NeedHelpBox />
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-foreground/30"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-white dark:bg-card shadow-xl">
              <div className="flex items-start justify-between px-5 pt-5 pb-2">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-foreground">Admin Workspace</p>
                  <p className="text-[11px] text-slate-500 dark:text-muted-foreground">National Cooperative Training (NCCT)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="mt-auto pt-3 pb-4">
                <NeedHelpBox />
              </div>
            </aside>
          </div>
        ) : null}

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden px-5 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Floating Evaluator Role Switcher Dock */}
      <RoleSwitcherPills currentRole="admin" />
    </div>
  );
}
