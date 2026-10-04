"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

export function CertificateSearchForm({ initialId }: { initialId: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialId);
  const t = useT();

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
        placeholder={t("public.verify.searchPlaceholder")}
      />
      <Button type="submit">
        <Search className="size-4" />
        {t("public.verify.submit")}
      </Button>
    </form>
  );
}
