"use client";

import { useEffect, useState } from "react";

import { errorMessage } from "@/components/admin/trainers/people-utils";
import { listProgrammes, type Programme } from "@/lib/admin/admin-api";

export type ProgrammeOption = { id: string; name: string };

/** Shown only when the programme list cannot be loaded. */
export const DEMO_PROGRAMMES: ProgrammeOption[] = [
  { id: "demo-prog-1", name: "Dairy Management" },
  { id: "demo-prog-2", name: "Cooperative Management" },
  { id: "demo-prog-3", name: "Agri Business" },
  { id: "demo-prog-4", name: "ICT for Cooperatives" },
  { id: "demo-prog-5", name: "Supply Chain" },
];

export function useProgrammes() {
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listProgrammes({ page_size: 100 })
      .then((res: { items: Programme[] }) => {
        if (cancelled) return;
        setProgrammes(res.items.map((p) => ({ id: p.id, name: p.title })));
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(errorMessage(err, "Could not load training programs."));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    programmes: error !== null ? DEMO_PROGRAMMES : programmes,
    loading,
    error,
    usingDemo: error !== null,
    retry: () => {
      setLoading(true);
      setReloadKey((k) => k + 1);
    },
  };
}
