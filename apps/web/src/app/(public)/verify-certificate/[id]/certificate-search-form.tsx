"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CertificateSearchForm({ initialId }: { initialId: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      router.push(`/verify-certificate/${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter certificate ID, e.g. CST-2026-DAI-00842"
      />
      <Button type="submit">
        <Search className="size-4" />
        Verify
      </Button>
    </form>
  );
}
