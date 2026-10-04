"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Employer portal error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="size-7" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading this section of the employer portal."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCcw className="size-4" /> Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  );
}
