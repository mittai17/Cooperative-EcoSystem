"use client";

import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Layers,
  QrCode,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { LoopDiagram } from "@/components/landing/loop-diagram";
import { HeroHeading } from "@/components/landing/hero-heading";
import { ROLE_OPTIONS } from "@/lib/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

const roleIcons: Record<string, LucideIcon> = {
  trainee: GraduationCap,
  institution: Building2,
  trainer: Users,
  employer: Briefcase,
  admin: ShieldCheck,
  kiosk: QrCode,
};

const stats: { value: string; labelKey: string; icon: LucideIcon; tile: string }[] = [
  { value: "112", labelKey: "public.stats.partnerInstitutions", icon: ShieldCheck, tile: "icon-tile-red" },
  { value: "24,800+", labelKey: "public.stats.registeredTrainees", icon: Users, tile: "icon-tile-red" },
  { value: "15,920", labelKey: "public.stats.certificatesIssued", icon: BadgeCheck, tile: "icon-tile-red" },
  { value: "7,380", labelKey: "public.stats.placedInJobs", icon: Briefcase, tile: "icon-tile-red" },
];

const heroBadges: { labelKey: string; icon: LucideIcon; position: string; photo?: string }[] = [
  { labelKey: "public.hero.badgeLearnSkills", icon: BookOpen, position: "top-2 left-2 sm:top-4 sm:-left-6" },
  { labelKey: "public.hero.badgeGetCertified", icon: BadgeCheck, position: "top-2 right-2 sm:top-4 sm:-right-6" },
  { labelKey: "public.hero.badgeFindJobs", icon: Briefcase, position: "top-1/2 right-2 -translate-y-1/2 sm:-right-6", photo: "https://picsum.photos/seed/nurvex-find-jobs/64/64" },
  { labelKey: "public.hero.badgeBuildCareer", icon: TrendingUp, position: "bottom-2 right-2 sm:bottom-4 sm:-right-6" },
];

export default function LandingPage() {
  const t = useT();
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-8 lg:pt-16">
          <div className="lg:col-span-6">
            <Badge variant="outline" className="gap-2 border-border bg-muted/70 py-1 px-3 text-foreground shadow-xs">
              <Logo variant="emblem" size="sm" iconClassName="size-4.5" />
              <span className="font-semibold text-xs sm:text-sm">{t("public.hero.badgeBrand")}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">{t("public.hero.badgeInitiative")}</span>
            </Badge>
            <HeroHeading />
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {t("public.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="contents" href="/sign-up"><Button
                size="lg"
                
               nativeButton={false}>
                    {t("public.hero.getStarted")} <ArrowRight className="size-4" />
                  </Button></Link>
              <Link className="contents" href="/trainee/programmes"><Button size="lg" variant="outline"   nativeButton={false}>{t("public.hero.explorePrograms")}</Button></Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
                <Image
                  src="https://picsum.photos/seed/nurvex-hero/900/700"
                  alt={t("public.hero.imageAlt")}
                  width={900}
                  height={700}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
              {heroBadges.map((badge) => {
                const Icon = badge.icon;
                const label = t(badge.labelKey);
                return (
                  <div
                    key={badge.labelKey}
                    className={cn(
                      "absolute flex items-center gap-2 rounded-full bg-card py-1.5 pr-3 pl-1.5 shadow-lg ring-1 ring-border",
                      badge.position
                    )}
                  >
                    {badge.photo ? (
                      <span className="relative size-8 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
                        <Image src={badge.photo} alt="" fill className="object-cover" />
                      </span>
                    ) : (
                      <span className="icon-tile-red flex size-8 shrink-0 items-center justify-center">
                        <Icon className="size-4" strokeWidth={1.9} />
                      </span>
                    )}
                    <span className="text-xs leading-tight font-semibold whitespace-nowrap text-foreground">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.labelKey} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <span className={cn("flex size-11 shrink-0 items-center justify-center", stat.tile)}>
                    <Icon className="size-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-xl font-extrabold text-foreground">{stat.value}</p>
                    <p className="truncate text-xs text-muted-foreground">{t(stat.labelKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The loop: 8-stage process grid */}
      <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Badge variant="outline" className="gap-1.5 border-primary/25 bg-primary/10 text-primary">
            <Layers className="size-3" />
            {t("public.about.badge")}
          </Badge>
          <h2 className="mt-3 text-3xl font-bold text-foreground">{t("public.about.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("public.about.body")}</p>
        </div>
        <div className="mt-10">
          <LoopDiagram />
        </div>
      </section>

      {/* Roles: asymmetric bento, trainee weighted largest */}
      <section id="roles" className="scroll-mt-20 border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-foreground">{t("public.roles.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("public.roles.body")}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            {ROLE_OPTIONS.map((role) => {
              const Icon = roleIcons[role.value] || Layers;
              const isTrainee = role.value === "trainee";
              const isAdmin = role.value === "admin";
              return (
                <Link
                  key={role.value}
                  href="/sign-up"
                  className={cn(
                    "group relative flex flex-col justify-end gap-2 overflow-hidden rounded-2xl border border-border p-5 shadow-sm transition-colors",
                    isTrainee
                      ? "sm:col-span-2 lg:col-span-2 lg:row-span-2 min-h-64"
                      : isAdmin
                        ? "bg-primary text-primary-foreground border-transparent min-h-40"
                        : "bg-card min-h-40 hover:bg-muted/60"
                  )}
                >
                  {isTrainee && (
                    <>
                      <Image
                        src="https://picsum.photos/seed/nurvex-trainee-role-card/900/900"
                        alt=""
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    </>
                  )}
                  <span
                    className={cn(
                      "relative flex size-10 items-center justify-center rounded-xl",
                      isTrainee
                        ? "bg-white/15 text-white backdrop-blur-sm"
                        : isAdmin
                          ? "bg-white/15 text-primary-foreground"
                          : "icon-tile-red"
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <p
                    className={cn(
                      "relative font-semibold",
                      isTrainee ? "text-lg text-white" : isAdmin ? "text-base text-primary-foreground" : "text-base text-foreground"
                    )}
                  >
                    {t(`public.roles.items.${role.value}.label`)}
                  </p>
                  <p
                    className={cn(
                      "relative text-xs leading-relaxed",
                      isTrainee ? "text-white/85 max-w-xs" : isAdmin ? "text-primary-foreground/85" : "text-muted-foreground"
                    )}
                  >
                    {t(`public.roles.items.${role.value}.description`)}
                  </p>
                  <span
                    className={cn(
                      "relative mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium",
                      isTrainee || isAdmin ? "text-white" : "text-primary"
                    )}
                  >
                    {t("public.roles.getStarted")}
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features: asymmetric split, not equal cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground">{t("public.features.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("public.features.body")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Link
            href="/trainee/skill-passport"
            className="group flex flex-col overflow-hidden rounded-2xl border border-border shadow-sm lg:col-span-3"
          >
            <div className="relative h-56 w-full sm:h-72">
              <Image
                src="https://picsum.photos/seed/nurvex-skill-passport-evidence/1200/700"
                alt={t("public.features.skillPassportImageAlt")}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 bg-card p-6">
              <span className="icon-tile-red flex size-10 items-center justify-center">
                <Sparkles className="size-4.5" strokeWidth={1.9} />
              </span>
              <p className="font-heading text-lg font-semibold text-foreground">{t("public.features.skillPassportTitle")}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("public.features.skillPassportBody")}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("public.features.skillPassportCta")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <Link
              href="/verify-certificate/CST-2026-DAI-00842"
              className="group flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="icon-tile-red flex size-10 items-center justify-center">
                <BadgeCheck className="size-4.5" strokeWidth={1.9} />
              </span>
              <p className="font-heading text-base font-semibold text-foreground">{t("public.features.certificationTitle")}</p>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{t("public.features.certificationBody")}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("public.features.certificationCta")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link href="/jobs" className="group flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <span className="icon-tile-red flex size-10 items-center justify-center">
                <Target className="size-4.5" strokeWidth={1.9} />
              </span>
              <p className="font-heading text-base font-semibold text-foreground">{t("public.features.jobMatchingTitle")}</p>
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{t("public.features.jobMatchingBody")}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {t("public.features.jobMatchingCta")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-3xl font-bold text-primary-foreground">{t("public.cta.title")}</h2>
            <p className="mt-2 max-w-xl text-primary-foreground/80">{t("public.cta.body")}</p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row">
            <Link className="contents" href="/sign-up"><Button size="lg" variant="secondary"   nativeButton={false}>{t("public.cta.getStarted")}</Button></Link>
            <Link className="contents" href="/sign-in"><Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              
             nativeButton={false}>{t("public.cta.signIn")}</Button></Link>
          </div>
        </div>
      </section>

      {/* Closing banner: red gradient strip blending into a photo on the right */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://picsum.photos/seed/nurvex-closing-banner/1200/500"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/10" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
          <Link
            href="/sign-up"
            aria-label={t("public.banner.ariaGetStarted")}
            className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-white/70 text-white transition-colors hover:bg-white/10"
          >
            <ArrowUpRight className="size-6" />
          </Link>
          <h2 className="max-w-2xl text-2xl leading-snug font-bold text-white sm:text-3xl">
            {t("public.banner.title")}
          </h2>
        </div>
      </section>
    </>
  );
}
