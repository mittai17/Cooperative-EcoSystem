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
    <span className={cn("flex items-center gap-2 font-heading font-bold", s.text, className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary text-primary-foreground",
          s.icon,
          iconClassName
        )}
      >
        <Diamond className={s.glyph} strokeWidth={2.4} fill="currentColor" />
      </span>
      <span className={cn(inverted ? "text-white" : "text-foreground", textClassName)}>
        CoopSetu<span className="text-primary"> AI</span>
      </span>
    </span>
  );
}
