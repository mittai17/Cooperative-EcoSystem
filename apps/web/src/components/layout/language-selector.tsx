"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "EN", label: "English" },
  { code: "HI", label: "हिन्दी (Hindi)" },
  { code: "MR", label: "मराठी (Marathi)" },
];

/**
 * Demo-only language switcher: updates the visible code in the trigger so it
 * is not a dead control, but does not localize copy in this prototype build.
 */
export function LanguageSelector() {
  const [code, setCode] = useState("EN");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" aria-label="Change language">
            <Globe className="size-4" />
            {code}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => setCode(lang.code)}>
            {lang.label}
            {code === lang.code && <Check className="ml-auto size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
