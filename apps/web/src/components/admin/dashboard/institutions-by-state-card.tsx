"use client";

import type { InstitutionsByState } from "@/lib/admin/admin-api";
import { StateTileMap } from "./state-tile-map";

/** Data-driven wrapper. The dashboard renders StateTileMap directly, so this is kept only as a thin alias. */
export function InstitutionsByStateCard({ data }: { data: InstitutionsByState[] }) {
  return <StateTileMap data={data} />;
}
