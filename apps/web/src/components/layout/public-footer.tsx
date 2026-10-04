"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { useT } from "@/i18n";

/** Column keys are under public.footer.columns; link labels under public.footer.links. */
const columns = [
  {
    title: "platform",
    links: [
      { href: "/trainee/programmes", label: "programmes" },
      { href: "/courses", label: "courses" },
      { href: "/jobs", label: "jobs" },
      { href: "/trainee/skill-passport", label: "aiSkillPassport" },
    ],
  },
  {
    title: "forRoles",
    links: [
      { href: "/sign-up", label: "trainees" },
      { href: "/sign-up", label: "institutions" },
      { href: "/sign-up", label: "trainers" },
      { href: "/sign-up", label: "employers" },
    ],
  },
  {
    title: "trust",
    links: [
      { href: "/verify-certificate/CST-2026-DAI-00842", label: "verifyCertificate" },
      { href: "/sign-in", label: "ncctAdminLogin" },
    ],
  },
];

export function PublicFooter() {
  const t = useT();
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {t("public.footer.description")}
            </p>
            <p className="mt-4 demo-data-tag w-fit">{t("public.footer.demoTag")}</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{t(`public.footer.columns.${col.title}`)}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link, i) => (
                  <li key={`${col.title}-${link.label}-${i}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(`public.footer.links.${link.label}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {t("public.footer.copyright")}</p>
          <p>{t("public.footer.ministry")}</p>
        </div>
      </div>
    </footer>
  );
}
