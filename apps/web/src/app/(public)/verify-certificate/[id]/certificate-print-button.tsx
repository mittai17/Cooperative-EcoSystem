"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

export function CertificatePrintButton() {
  const t = useT();
  return (
    <Button
      size="sm"
      className="gap-2"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      {t("public.verify.print")}
    </Button>
  );
}
