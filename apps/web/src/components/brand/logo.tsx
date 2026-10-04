import Image from "next/image";
import { cn } from "@/lib/utils";

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
   * - "default" (or "mark"): Official glossy ribbon emblem + responsive text typography
   * - "full": Full official graphic wordmark with emblem, typography, and tagline
   * - "emblem": Official glossy ribbon emblem icon only (no typography)
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
    fullWidth: 92,
    fullHeight: 35,
    fullClass: "h-[30px] w-auto",
  },
  default: {
    emblemPx: 38,
    emblemClass: "size-[38px]",
    textClass: "text-xl tracking-tight leading-none",
    gap: "gap-2.5",
    fullWidth: 120,
    fullHeight: 46,
    fullClass: "h-[38px] w-auto",
  },
  lg: {
    emblemPx: 52,
    emblemClass: "size-[52px]",
    textClass: "text-2xl sm:text-3xl tracking-tight leading-none",
    gap: "gap-3",
    fullWidth: 160,
    fullHeight: 61,
    fullClass: "h-[50px] w-auto",
  },
} as const;

/**
 * Official CoopSetu AI Brand Logo Component.
 *
 * Integrates the official 3D glossy red ribbon book emblem and official wordmark:
 * - Default: Ribbon emblem alongside bold responsive typography ("CoopSetu AI").
 * - Full: The complete official brand logo graphic with the "Learn • Skill • Work • Grow Together" tagline.
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

  // Full Wordmark Graphic Logo (with tagline)
  if (variant === "full") {
    return (
      <span className={cn("inline-flex items-center select-none", className)}>
        {/* Light mode full graphic logo */}
        <Image
          src="/brand/logo-full.png"
          alt="CoopSetu AI - Learn, Skill, Work, Grow Together"
          width={s.fullWidth}
          height={s.fullHeight}
          priority={priority}
          unoptimized
          className={cn(
            "object-contain select-none",
            inverted ? "hidden" : "block dark:hidden",
            s.fullClass,
            iconClassName
          )}
        />
        {/* Dark mode / Inverted full graphic logo */}
        <Image
          src="/brand/logo-full-dark.png"
          alt="CoopSetu AI - Learn, Skill, Work, Grow Together"
          width={s.fullWidth}
          height={s.fullHeight}
          priority={priority}
          unoptimized
          className={cn(
            "object-contain select-none",
            inverted ? "block" : "hidden dark:block",
            s.fullClass,
            iconClassName
          )}
        />
      </span>
    );
  }

  // Emblem Only Icon
  if (variant === "emblem") {
    return (
      <span className={cn("inline-flex items-center shrink-0 select-none", className)}>
        <Image
          src="/brand/logo-emblem.png"
          alt="CoopSetu AI Emblem"
          width={s.emblemPx}
          height={s.emblemPx}
          priority={priority}
          unoptimized
          className={cn("shrink-0 object-contain", s.emblemClass, iconClassName)}
        />
      </span>
    );
  }

  // Default: Ribbon Emblem + Responsive Typography
  return (
    <span
      className={cn(
        "inline-flex items-center font-heading font-extrabold select-none",
        s.gap,
        s.textClass,
        className
      )}
    >
      <Image
        src="/brand/logo-emblem.png"
        alt="CoopSetu AI Emblem"
        width={s.emblemPx}
        height={s.emblemPx}
        priority={priority}
        unoptimized
        className={cn(
          "shrink-0 object-contain transition-transform duration-200",
          s.emblemClass,
          iconClassName
        )}
      />
      <span
        className={cn(
          inverted ? "text-white" : "text-slate-900 dark:text-white",
          "font-extrabold tracking-tight",
          textClassName
        )}
      >
        CoopSetu<span className="text-[#E30B1C]"> AI</span>
      </span>
    </span>
  );
}
