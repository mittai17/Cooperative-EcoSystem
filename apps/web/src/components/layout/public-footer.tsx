import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const columns = [
  {
    title: "Platform",
    links: [
      { href: "/programmes", label: "Programmes" },
      { href: "/courses", label: "Courses" },
      { href: "/jobs", label: "Jobs" },
      { href: "/skill-passport", label: "AI Skill Passport" },
    ],
  },
  {
    title: "For Roles",
    links: [
      { href: "/sign-up", label: "Trainees" },
      { href: "/sign-up", label: "Institutions" },
      { href: "/sign-up", label: "Trainers" },
      { href: "/sign-up", label: "Employers" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/verify-certificate/CST-2026-DAI-00842", label: "Verify a certificate" },
      { href: "/sign-in", label: "NCCT admin login" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              A National Cooperative Capacity Building initiative connecting cooperative training
              directly to verified skills and employment. Built for Smart India Hackathon 2026, PS 26087.
            </p>
            <p className="mt-4 demo-data-tag w-fit">Demo build, sample data shown throughout</p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link, i) => (
                  <li key={`${col.title}-${link.label}-${i}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} CoopSetu AI. Prototype for Smart India Hackathon 2026.</p>
          <p>Ministry of Cooperation &middot; National Council for Cooperative Training (NCCT)</p>
        </div>
      </div>
    </footer>
  );
}
