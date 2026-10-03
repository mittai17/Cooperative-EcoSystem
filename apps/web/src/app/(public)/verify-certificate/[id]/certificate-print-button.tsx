"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CertificatePrintButton() {
  return (
    <Button
      size="sm"
      className="gap-2"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Print / Save PDF
    </Button>
  );
}
