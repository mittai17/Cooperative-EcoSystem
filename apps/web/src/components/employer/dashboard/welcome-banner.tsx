import Link from "next/link";
import { BarChart3, Building2, ChevronDown, FileBarChart, Plus, Sparkles, UserSearch, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WelcomeBannerProps {
  name: string;
  organisation: string;
}

const ACTION_ITEMS = [
  { label: "Browse candidates", href: "/employer/candidates", icon: UserSearch },
  { label: "AI candidate match", href: "/employer/matches", icon: Sparkles },
  { label: "Schedule interview", href: "/employer/interviews", icon: Zap },
  { label: "Generate report", href: "/employer/reports", icon: FileBarChart },
  { label: "Analytics", href: "/employer/analytics", icon: BarChart3 },
  { label: "Manage team", href: "/employer/company", icon: Users },
  { label: "Company profile", href: "/employer/company", icon: Building2 },
];

export function WelcomeBanner({ name, organisation }: WelcomeBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-primary/5 md:block"
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{name}</h1>
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              {organisation.slice(0, 1)}
            </span>
            {organisation}
          </p>
          <p className="text-sm text-muted-foreground">Build your team with skilled cooperative talent.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button render={<Link href="/employer/jobs/new" />}>
            <Plus className="size-4" /> Create New Job
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" aria-label="Open actions menu">
                  <Zap className="size-4" /> Actions <ChevronDown className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick navigation</DropdownMenuLabel>
              <DropdownMenuItem render={<Link href="/employer/jobs/new" />}>
                <Plus className="size-3.5" /> Create new job
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {ACTION_ITEMS.map((item) => (
                <DropdownMenuItem key={item.label} render={<Link href={item.href} />}>
                  <item.icon className="size-3.5" /> {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}
