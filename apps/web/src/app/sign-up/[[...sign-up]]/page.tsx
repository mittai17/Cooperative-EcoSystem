"use client";

import { useT } from "@/i18n";

export default function SignUpPage() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">{t("auth.signUp.disabledTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.signUp.disabledBody")}</p>
      </div>
    </div>
  );
}
