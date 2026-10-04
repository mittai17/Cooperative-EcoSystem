import { cn } from "@/lib/utils";
import { initialsOf } from "@/components/admin/dashboard/format";
import { logoTint } from "./constants";

export function InstitutionLogo({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold",
        logoTint(name),
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
