"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

export interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  /**
   * Render the mark on a dark or photo background (forces white wordmark).
   * In standard mode, the wordmark automatically adapts to system/Tailwind dark mode.
   */
  inverted?: boolean;
  /**
   * Size presets:
   * - "sm": compact (sidebars, dense headers, modals)
   * - "default": standard (public nav, footers, headers)
   * - "lg": prominent (hero sections, landing highlights)
   */
  size?: "sm" | "default" | "lg";
  /**
   * Variant:
   * - "default" (or "mark"): NURVEX ribbon emblem + wordmark typography
   * - "full": emblem + wordmark + "Learn · Skill · Work · Grow Together" tagline
   * - "emblem": standalone ribbon emblem icon only (no typography)
   */
  variant?: "default" | "mark" | "full" | "emblem";
  /**
   * Next.js Image priority loading (default: true for instant LCP)
   */
  priority?: boolean;
}

const sizeMap = {
  sm: {
    emblemPx: 30,
    emblemClass: "size-[30px]",
    textClass: "text-base tracking-tight leading-none",
    gap: "gap-2.5",
    taglineClass: "text-[10px] tracking-[0.18em] leading-none",
  },
  default: {
    emblemPx: 38,
    emblemClass: "size-[38px]",
    textClass: "text-xl tracking-tight leading-none",
    gap: "gap-2.5",
    taglineClass: "text-[11px] tracking-[0.2em] leading-none",
  },
  lg: {
    emblemPx: 52,
    emblemClass: "size-[52px]",
    textClass: "text-2xl sm:text-3xl tracking-tight leading-none",
    gap: "gap-3",
    taglineClass: "text-xs sm:text-sm tracking-[0.22em] leading-none",
  },
} as const;

const MARK_SRC = "/brand/nurvex-mark.png";

/**
 * NURVEX Brand Logo Component.
 *
 * Integrates the glossy red ribbon "N" emblem:
 * - Default: Ribbon emblem alongside bold responsive typography ("NURVEX").
 * - Full: Emblem + wordmark + the "Learn · Skill · Work · Grow Together" tagline.
 * - Emblem: Standalone ribbon emblem icon.
 *
 * Fully supports dark mode, light mode, and inverted backgrounds.
 */
export function Logo({
  className,
  iconClassName,
  textClassName,
  inverted = false,
  size = "default",
  variant = "default",
  priority = true,
}: LogoProps) {
  const s = sizeMap[size];
  const t = useT();

  const mark = (
    <Image
      src={MARK_SRC}
      alt={t("brand.emblemAlt")}
      width={s.emblemPx}
      height={s.emblemPx}
      priority={priority}
      unoptimized
      className={cn("shrink-0 object-contain", s.emblemClass, iconClassName)}
    />
  );

  // Emblem Only Icon
  if (variant === "emblem") {
    return <span className={cn("inline-flex items-center shrink-0 select-none", className)}>{mark}</span>;
  }

  const wordmark = (
    <span className="flex flex-col gap-1">
      <span
        className={cn(
          "font-heading font-extrabold tracking-tight",
          inverted ? "text-white" : "text-slate-900 dark:text-white",
          s.textClass,
          textClassName
        )}
      >
        NURVEX
      </span>
      {variant === "full" && (
        <span
          className={cn(
            "font-medium uppercase",
            inverted ? "text-white/70" : "text-slate-500 dark:text-slate-400",
            s.taglineClass
          )}
        >
          {t("brand.tagline")}
        </span>
      )}
    </span>
  );

  return (
    <span
      className={cn(
        "inline-flex items-center font-heading select-none",
        s.gap,
        className
      )}
    >
      {mark}
      {wordmark}
    </span>
  );
}
