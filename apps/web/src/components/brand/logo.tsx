import { Diamond } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  /** Render the mark on a dark/photo background (white wordmark; the icon
   * tile itself is solid brand red and already reads fine on any surface). */
  inverted?: boolean;
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: { icon: "size-7", glyph: "size-3.5", text: "text-base" },
  default: { icon: "size-8", glyph: "size-4.5", text: "text-lg" },
  lg: { icon: "size-10", glyph: "size-5", text: "text-2xl" },
};

/**
 * Shared "CoopSetu AI" wordmark: a solid red rounded-square icon tile with a
 * white diamond mark, plus "CoopSetu" in dark navy and "AI" in the brand
 * red -- matches the definitive reference mockup's logo treatment (the
 * wordmark now explicitly spells out "AI"). The underlying app/package name
 * stays "CoopSetu AI" in metadata.
 */
export function Logo({ className, iconClassName, textClassName, inverted, size = "default" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-heading font-extrabold tracking-tight select-none", s.text, className)}>
      <svg
        viewBox="0 0 36 36"
        className={cn("shrink-0", s.icon, iconClassName)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 2.2 L31.8 10.2 V25.8 L18 33.8 L4.2 25.8 V10.2 Z"
          fill="#E30B1C"
        />
        <circle cx="18" cy="11.5" r="2.8" fill="white" />
        <circle cx="11.5" cy="22.5" r="2.8" fill="white" />
        <circle cx="24.5" cy="22.5" r="2.8" fill="white" />
        <line x1="18" y1="11.5" x2="11.5" y2="22.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="11.5" x2="24.5" y2="22.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="11.5" y1="22.5" x2="24.5" y2="22.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={cn(inverted ? "text-white" : "text-slate-900 dark:text-white", "font-extrabold", textClassName)}>
        CoopSetu<span className="text-[#E30B1C]"> AI</span>
      </span>
    </span>
  );
}
