"use client";

import { useT } from "@/i18n";

/** Landing hero title. Client component so it can read the active locale. */
export function HeroHeading() {
  const t = useT();

  return (
    <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
      {t("public.hero.titleLine1", "From Learning")}
      <br />
      {t("public.hero.titleLine2", "to")}{" "}
      <span className="text-primary">{t("public.hero.titleAccent", "Employment")}</span>
    </h1>
  );
}
