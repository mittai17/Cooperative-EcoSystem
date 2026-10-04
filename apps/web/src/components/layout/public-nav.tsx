"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { LanguageSelector } from "@/components/layout/language-selector";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

const links = [
  { href: "/trainee/programmes", key: "programmes" },
  { href: "/courses", key: "courses" },
  { href: "/jobs", key: "jobs" },
  { href: "/#roles", key: "institutions" },
  { href: "/#about", key: "about" },
];

export function PublicNav() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground"
                )}
              >
                {t(`public.nav.${link.key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSelector />
          <ThemeToggle />
          <Link className="contents" href="/demo"><Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10"   nativeButton={false}>⚡ {t("public.nav.demoHub")}</Button></Link>
          <Link className="contents" href="/sign-in"><Button   nativeButton={false}>{t("public.nav.signIn")}</Button></Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground"
            aria-label={t("public.nav.toggleMenu")}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {t(`public.nav.${link.key}`)}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">{t("public.nav.language")}</span>
              <LanguageSelector />
            </div>
            <div className="mt-1 flex gap-2">
              <Link className="contents" href="/sign-in" onClick={() => setOpen(false)}>
                <Button variant="outline" className="flex-1" nativeButton={false}>
                  {t("public.nav.signIn")}
                </Button>
              </Link>
              <Link className="contents" href="/sign-up" onClick={() => setOpen(false)}>
                <Button className="flex-1" nativeButton={false}>
                  {t("public.nav.getStarted")}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
