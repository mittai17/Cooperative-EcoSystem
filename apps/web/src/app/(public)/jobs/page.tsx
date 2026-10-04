"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, Search, Wallet } from "lucide-react";
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
import { jobs } from "@/lib/mock-data/jobs";
import { getJobMatch } from "@/lib/job-match";
import type { JobType } from "@/lib/types";

const sectors = ["All sectors", ...Array.from(new Set(jobs.map((j) => j.sector)))];
const types: (JobType | "All types")[] = [
  "All types",
  "Full-time",
  "Part-time",
  "Contract",
  "Apprenticeship",
];

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [type, setType] = useState<JobType | "All types">("All types");

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesQuery =
        query.trim().length === 0 ||
        j.title.toLowerCase().includes(query.toLowerCase()) ||
        j.employer.toLowerCase().includes(query.toLowerCase()) ||
        j.skillsRequired.some((s) => s.toLowerCase().includes(query.toLowerCase()));
      const matchesSector = sector === "All sectors" || j.sector === sector;
      const matchesType = type === "All types" || j.type === type;
      return matchesQuery && matchesSector && matchesType;
    });
  }, [query, sector, type]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold text-foreground">Jobs from cooperative employers</h1>
        <p className="max-w-2xl text-muted-foreground">
          Openings posted directly by dairy unions, credit societies, FPOs, and other cooperative
          employers, ranked against your verified Skill Passport once you&apos;re signed in.
        </p>
        <span className="demo-data-tag w-fit">Sample job listings for demo purposes</span>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, employers, or skills…"
            className="pl-9"
          />
        </div>
        <Select value={sector} onValueChange={(value) => setSector(value ?? "All sectors")}>
          <SelectTrigger className="w-full sm:w-56">
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
        <Select value={type} onValueChange={(v) => setType(v as JobType | "All types")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filtered.length} opening{filtered.length === 1 ? "" : "s"} found
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {filtered.map((job) => {
          const match = getJobMatch(job);
          return (
            <Card key={job.id}>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold text-foreground">{job.title}</h2>
                    <Badge variant="secondary">{job.type}</Badge>
                    {job.postedDaysAgo <= 2 && <Badge className="bg-success text-success-foreground">New</Badge>}
                    <Badge className="bg-success/10 text-success">{match.percent}% Match</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Briefcase className="size-3.5" /> {job.employer}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Wallet className="size-3.5" /> {job.salaryRange}
                    </span>
                    <span>Posted {job.postedDaysAgo === 0 ? "today" : `${job.postedDaysAgo} day${job.postedDaysAgo > 1 ? "s" : ""} ago`}</span>
                    <span>{job.openings} opening{job.openings > 1 ? "s" : ""}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skillsRequired.map((skill) => (
                      <Badge key={skill} variant="outline" className="font-normal">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-row gap-2 sm:w-40 sm:flex-col">
                  <Button render={<Link href={`/jobs/${job.id}`} />} className="flex-1 sm:flex-initial" nativeButton={false}>View Details</Button>
                  <Button render={<Link href="/sign-up" />} variant="outline" className="flex-1 sm:flex-initial" nativeButton={false}>Apply</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
