"use client";

import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, useLocale, useT } from "@/i18n";

/** Lists every supported locale by its native name and switches the app language. */
export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            aria-label={t("shell.languageSwitcher", "Change language")}
          >
            <Globe className="size-4" />
            {locale.toUpperCase()}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        {LOCALES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            lang={lang.code}
            data-script={lang.script}
            onClick={() => setLocale(lang.code)}
          >
            {lang.nativeLabel}
            {locale === lang.code && <Check className="ml-auto size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
