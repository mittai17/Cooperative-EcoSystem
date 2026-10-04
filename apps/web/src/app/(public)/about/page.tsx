"use client";

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
import { useT } from "@/i18n";

// ── Partners (dummy logos via initials) ───────────────────────────────────────

const PARTNERS = [
  { abbr: "NCCT", key: "ncct" },
  { abbr: "VAMNICOM", key: "vamnicom" },
  { abbr: "NDRI", key: "ndri" },
  { abbr: "IFFCO", key: "iffco" },
  { abbr: "NAFED", key: "nafed" },
  { abbr: "MoC", key: "moc" },
];

// ── How it works steps ────────────────────────────────────────────────────────

const HOW_IT_WORKS: { step: number; key: string; icon: LucideIcon }[] = [
  { step: 1, key: "enrol", icon: GraduationCap },
  { step: 2, key: "train", icon: QrCode },
  { step: 3, key: "passport", icon: BadgeCheck },
  { step: 4, key: "place", icon: Briefcase },
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

const PROBLEM_POINTS = [0, 1, 2, 3, 4];

// ── Components ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export default function AboutPage() {
  const t = useT();
  const [heroBefore, heroAfter] = t("public.aboutPage.hero.title").split("{name}");
  const [passportBefore, passportAfter] = t("public.aboutPage.mission.passportBody").split("{passport}");
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
            {t("public.aboutPage.hero.badge")}
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {heroBefore}<span className="text-primary">NURVEX</span>{heroAfter}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t("public.aboutPage.hero.body")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link className="contents" href="/sign-up"><Button   nativeButton={false}>{t("public.aboutPage.hero.joinTrainee")}</Button></Link>
            <Link className="contents" href="/trainee/programmes"><Button variant="outline"   nativeButton={false}>{t("public.aboutPage.hero.browseProgrammes")}</Button></Link>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <SectionLabel>{t("public.aboutPage.mission.label")}</SectionLabel>
              <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
                {t("public.aboutPage.mission.title")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("public.aboutPage.mission.body")}</p>
              <p className="mt-3 text-muted-foreground">
                {passportBefore}<strong>{t("public.aboutPage.mission.passport")}</strong>{passportAfter}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: BadgeCheck, labelKey: "public.aboutPage.mission.tiles.passports", color: "icon-tile-red" },
                { icon: Brain, labelKey: "public.aboutPage.mission.tiles.advisor", color: "icon-tile-red" },
                { icon: LineChart, labelKey: "public.aboutPage.mission.tiles.analytics", color: "icon-tile-red" },
                { icon: QrCode, labelKey: "public.aboutPage.mission.tiles.kiosk", color: "icon-tile-red" },
              ].map(({ icon: Icon, labelKey, color }) => (
                <div
                  key={labelKey}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <span className={`icon-tile ${color}`}>
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm font-medium text-foreground">{t(labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem Statement ── */}
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionLabel>{t("public.aboutPage.problem.label")}</SectionLabel>
          <h2 className="mt-3 text-2xl font-bold text-foreground">
            {t("public.aboutPage.problem.title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("public.aboutPage.problem.intro")}</p>
          <ul className="mt-5 space-y-3">
            {PROBLEM_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-destructive" />
                {t(`public.aboutPage.problem.points.${point}`)}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-medium text-success">{t("public.aboutPage.problem.closing")}</p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <SectionLabel>{t("public.aboutPage.howItWorks.label")}</SectionLabel>
            <h2 className="mt-3 text-2xl font-bold text-foreground">
              {t("public.aboutPage.howItWorks.title")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, key, icon: Icon }) => (
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
                <p className="text-sm font-bold text-foreground">{t(`public.aboutPage.howItWorks.steps.${key}.title`)}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t(`public.aboutPage.howItWorks.steps.${key}.description`)}</p>
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
              <SectionLabel>{t("public.aboutPage.technology.label")}</SectionLabel>
              <h2 className="mt-3 text-2xl font-bold text-foreground">
                {t("public.aboutPage.technology.title")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{t("public.aboutPage.technology.body")}</p>
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
                { icon: Zap, key: "edge" },
                { icon: Shield, key: "certificates" },
                { icon: Smartphone, key: "kiosk" },
                { icon: Layers, key: "multiRole" },
              ].map(({ icon: Icon, key }) => (
                <div key={key} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(`public.aboutPage.technology.features.${key}.label`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`public.aboutPage.technology.features.${key}.description`)}</p>
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
            <SectionLabel>{t("public.aboutPage.partners.label")}</SectionLabel>
            <h2 className="mt-2 text-xl font-bold text-foreground">
              {t("public.aboutPage.partners.title")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {PARTNERS.map(({ abbr, key }) => (
              <div
                key={abbr}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center"
                title={t(`public.aboutPage.partners.names.${key}`)}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {abbr.slice(0, 4)}
                </span>
                <p className="text-[11px] font-medium leading-tight text-muted-foreground">{abbr}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("public.aboutPage.partners.note")}
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-success/5">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold text-foreground">
            {t("public.aboutPage.cta.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("public.aboutPage.cta.body")}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link className="contents" href="/sign-up"><Button size="lg"   nativeButton={false}>{t("public.aboutPage.cta.getStarted")} <ArrowRight className="ml-1 size-4" /></Button></Link>
            <Link className="contents" href="/verify-certificate/CST-2026-DAI-00842"><Button size="lg" variant="outline"   nativeButton={false}>{t("public.aboutPage.cta.verify")}</Button></Link>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              {t("public.aboutPage.cta.ministry")}
            </div>
            <p className="text-xs text-muted-foreground">{t("public.aboutPage.cta.sih")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
