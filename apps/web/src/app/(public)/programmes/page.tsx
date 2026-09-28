"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Search, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { programmes } from "@/lib/mock-data/programmes";
import type { Programme, ProgrammeLevel, ProgrammeMode } from "@/lib/types";

const sectors = ["All sectors", ...Array.from(new Set(programmes.map((p) => p.sector)))];
const levels: (ProgrammeLevel | "All levels")[] = ["All levels", "Foundation", "Intermediate", "Advanced"];
const modes: (ProgrammeMode | "All")[] = ["All", "Online", "In-person", "Blended"];

// Deterministic 4.3-4.9 rating and seed-based thumbnail derived from the
// programme id, so the mock data model doesn't need new fields.
function ratingFor(id: string) {
  const hash = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (4.3 + (hash % 7) / 10).toFixed(1);
}

function reviewsFor(id: string) {
  const hash = Array.from(id).reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  return 200 + (Math.abs(hash) % 1400);
}

function thumbnailFor(programme: Programme) {
  return `https://picsum.photos/seed/coopsetu-${programme.id}/640/420`;
}

export default function ProgrammesPage() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [level, setLevel] = useState<ProgrammeLevel | "All levels">("All levels");
  const [mode, setMode] = useState<ProgrammeMode | "All">("All");

  const filtered = useMemo(() => {
    return programmes.filter((p) => {
      const matchesQuery =
        query.trim().length === 0 ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));
      const matchesSector = sector === "All sectors" || p.sector === sector;
      const matchesLevel = level === "All levels" || p.level === level;
      const matchesMode = mode === "All" || p.mode === mode;
      return matchesQuery && matchesSector && matchesLevel && matchesMode;
    });
  }, [query, sector, level, mode]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Cooperative training programmes</h1>
        <p className="max-w-2xl text-muted-foreground">
          Multi-week programmes run by NCCT-affiliated institutions across dairy, credit, handloom,
          fisheries, and agri value-chain cooperatives.
        </p>
        <span className="demo-data-tag w-fit">Sample programme catalogue for demo purposes</span>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programmes, skills, institutions…"
            className="h-11 rounded-xl pl-10"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Select value={sector} onValueChange={(value) => setSector(value ?? "All sectors")}>
              <SelectTrigger size="sm" className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={(v) => setLevel(v as ProgrammeLevel | "All levels")}>
              <SelectTrigger size="sm" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {filtered.length} programme{filtered.length === 1 ? "" : "s"} found
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((programme) => {
          const seatsAvailable = programme.seatsTotal - programme.seatsFilled;
          return (
            <Card key={programme.id} className="flex flex-col overflow-hidden py-0">
              <div className="relative h-40 w-full">
                <Image src={thumbnailFor(programme)} alt="" fill className="object-cover" />
                <Badge className="absolute top-3 left-3 bg-card/90 text-foreground shadow-sm">{programme.level}</Badge>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h2 className="text-base font-semibold leading-snug text-foreground">{programme.title}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{programme.institution}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                    <CalendarDays className="size-3.5" /> {programme.durationWeeks} weeks
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-accent-foreground">
                    {programme.mode}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {programme.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-1 text-sm">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Star className="size-3.5 fill-tint-amber-fg text-tint-amber-fg" />
                    {ratingFor(programme.id)}
                    <span className="font-normal text-muted-foreground">({reviewsFor(programme.id)})</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    {seatsAvailable > 0 ? `${seatsAvailable} seats left` : "Full"}
                  </span>
                </div>

                <Button variant="outline" className="w-full" render={<Link href="/sign-up">View Details</Link>} />
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <MapPin className="size-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No programmes match your filters</p>
          <p className="text-sm text-muted-foreground">Try clearing the search or choosing a different sector.</p>
        </div>
      )}
    </div>
  );
}
