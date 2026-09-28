import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  LineChart,
  QrCode,
  Shield,
  Smartphone,
  Sprout,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ── Partners (dummy logos via initials) ───────────────────────────────────────

const PARTNERS = [
  { abbr: "NCCT", name: "National Council for Cooperative Training" },
  { abbr: "VAMNICOM", name: "Vaikunth Mehta National Institute" },
  { abbr: "NDRI", name: "National Dairy Research Institute" },
  { abbr: "IFFCO", name: "Indian Farmers Fertiliser Cooperative" },
  { abbr: "NAFED", name: "National Agricultural Cooperative Marketing Federation" },
  { abbr: "MoC", name: "Ministry of Cooperation, GoI" },
];

// ── How it works steps ────────────────────────────────────────────────────────

const HOW_IT_WORKS: { step: number; title: string; desc: string; icon: LucideIcon }[] = [
  {
    step: 1,
    title: "Register & Enrol",
    desc: "Trainees register via cooperative institutions. NCCT approves and VAMNICOM coordinates programme allocation.",
    icon: GraduationCap,
  },
  {
    step: 2,
    title: "Train & Attend",
    desc: "QR-based kiosk attendance, live timetables, and trainer grading — all captured in real-time.",
    icon: QrCode,
  },
  {
    step: 3,
    title: "AI Skill Passport",
    desc: "Every completed module, assessment, and employer feedback is distilled into a tamper-proof digital Skill Passport.",
    icon: BadgeCheck,
  },
  {
    step: 4,
    title: "Match & Place",
    desc: "AI career advisor matches verified skills to live job postings from cooperative employers. Placement loop closes.",
    icon: Briefcase,
  },
];

// ── Tech stack pills ──────────────────────────────────────────────────────────

const TECH_STACK = [
  "Next.js 15 (App Router)",
  "TypeScript",
  "Tailwind CSS v4",
  "Radix UI / shadcn",
  "Gemini AI (Google DeepMind)",
  "PostgreSQL + Drizzle ORM",
  "Turborepo monorepo",
];

// ── Stat tiles ────────────────────────────────────────────────────────────────

const PROBLEM_POINTS = [
  "No unified digital record of cooperative training outcomes",
  "Manual, paper-based attendance and certification",
  "Gap between skills trained and skills demanded by employers",
  "Employers cannot verify claimed cooperative competencies",
  "NCCT has no real-time visibility into national training throughput",
];

// ── Components ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="border-b border-border bg-gradient-to-b from-success/5 to-transparent">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-6 gap-1.5 border-success/25 bg-success/10 text-success"
          >
            <Sprout className="size-3" />
            SIH 2026 · PS 26087
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            About <span className="text-primary">CoopSetu</span> AI
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A national AI platform that connects cooperative training to verifiable skills and real
            employment — built for the Ministry of Cooperation and National Council for Cooperative
            Training (NCCT).
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/sign-up">Join as a Trainee</Link>} />
            <Button variant="outline" render={<Link href="/programmes">Browse Programmes</Link>} />
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <SectionLabel>Our Mission</SectionLabel>
              <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
                Close the loop between training and livelihood
              </h2>
              <p className="mt-4 text-muted-foreground">
                India&apos;s cooperative sector trains thousands every year, yet outcomes remain
                invisible — fragmented across institutions with no digital thread connecting a
                trainee&apos;s learning journey to employment. CoopSetu AI changes that.
              </p>
              <p className="mt-3 text-muted-foreground">
                We give every trainee a living, AI-powered <strong>Skill Passport</strong> that
                employers can trust, every institution a real-time dashboard, and NCCT a national
                analytics view of skill supply and demand.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: BadgeCheck, label: "Verified Skill Passports", color: "icon-tile-red" },
                { icon: Brain, label: "AI Career Advisor", color: "icon-tile-red" },
                { icon: LineChart, label: "National Analytics", color: "icon-tile-red" },
                { icon: QrCode, label: "QR Kiosk Attendance", color: "icon-tile-red" },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <span className={`icon-tile ${color}`}>
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem Statement ── */}
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionLabel>Problem Statement · SIH 2026 PS 26087</SectionLabel>
          <h2 className="mt-3 text-2xl font-bold text-foreground">
            What we&apos;re solving
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            The Smart India Hackathon 2026 Problem Statement 26087, issued by the Ministry of
            Cooperation, identifies critical gaps in the cooperative training ecosystem:
          </p>
          <ul className="mt-5 space-y-3">
            {PROBLEM_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-destructive" />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-medium text-success">
            CoopSetu AI directly addresses every one of these gaps with a single integrated
            platform.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="mt-3 text-2xl font-bold text-foreground">
              From enrolment to placement in four steps
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div
                key={step}
                className="relative flex flex-col rounded-xl border border-border bg-card p-5"
              >
                <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="absolute top-4 right-4 text-3xl font-black text-muted/30 select-none">
                  {step}
                </span>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology stack ── */}
      <section className="border-b border-border bg-secondary/20">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <SectionLabel>Technology</SectionLabel>
              <h2 className="mt-3 text-2xl font-bold text-foreground">
                Built on modern, production-grade foundations
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Our monorepo uses a curated stack that enables rapid iteration while remaining
                scalable to a national deployment serving millions of trainees.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {TECH_STACK.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: Zap, label: "Edge-first architecture", desc: "Sub-100 ms responses via Next.js edge runtime" },
                { icon: Shield, label: "Tamper-proof certificates", desc: "Blockchain-anchored QR verification" },
                { icon: Smartphone, label: "Offline-first kiosk", desc: "Raspberry Pi QR attendance syncs when reconnected" },
                { icon: Layers, label: "Multi-role platform", desc: "Trainee, Institution, Trainer, Employer, NCCT Admin" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Partner institutions ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <SectionLabel>Partners &amp; Institutions</SectionLabel>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              Ecosystem partners powering CoopSetu
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {PARTNERS.map(({ abbr, name }) => (
              <div
                key={abbr}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
                title={name}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {abbr.slice(0, 4)}
                </span>
                <p className="text-[11px] font-medium leading-tight text-muted-foreground">{abbr}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dummy partner logos — real partner integrations planned for v2 launch.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-success/5">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold text-foreground">
            Ready to transform cooperative training?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join 24,800+ trainees, 112 institutions, and 7,380 placed alumni already on the
            platform.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" render={<Link href="/sign-up">Get started free <ArrowRight className="ml-1 size-4" /></Link>} />
            <Button size="lg" variant="outline" render={<Link href="/verify-certificate/CST-2026-DAI-00842">Verify a certificate</Link>} />
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              Ministry of Cooperation &middot; National Council for Cooperative Training
            </div>
            <p className="text-xs text-muted-foreground">
              Smart India Hackathon 2026 · Problem Statement 26087
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
