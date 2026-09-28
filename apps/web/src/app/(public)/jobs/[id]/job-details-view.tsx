"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  ChevronLeft,
  CircleCheck,
  CircleX,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job } from "@/lib/types";
import { getJobMatch, getRecommendedCourse } from "@/lib/job-match";
import { buildCompanyBlurb, buildRequirements, buildResponsibilities } from "./job-copy";

function MatchGauge({ percent }: { percent: number }) {
  const size = 176;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-success transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90 fill-foreground font-heading text-3xl font-extrabold"
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        {percent}%
      </text>
    </svg>
  );
}

export function JobDetailsView({ job }: { job: Job }) {
  const [saved, setSaved] = useState(false);
  const match = getJobMatch(job);
  const recommendedCourse = getRecommendedCourse(job);
  const responsibilities = buildResponsibilities(job);
  const requirements = buildRequirements(job);
  const companyBlurb = buildCompanyBlurb(job);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to Jobs
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{job.title}</h1>
            <Badge className="gap-1 bg-success/10 text-success">
              <Sparkles className="size-3" /> {match.percent}% Match
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4" /> {job.employer}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="size-4" /> {job.type}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="lg" render={<Link href="/sign-up">Apply Now</Link>} />
          <Button size="lg" variant="outline" className="gap-1.5" onClick={() => setSaved((v) => !v)}>
            {saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList variant="line" className="flex-wrap border-b border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="match">Why You Match</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">About this role</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">What you&apos;ll do</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {responsibilities.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{job.salaryRange}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">Openings</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{job.openings}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">Sector</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{job.sector}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground">Posted</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {job.postedDaysAgo === 0 ? "Today" : `${job.postedDaysAgo}d ago`}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">What you&apos;ll need</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Skills required</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.skillsRequired.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-sm font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="match" className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-2">
              <MatchGauge percent={match.percent} />
              <p className="text-sm text-muted-foreground">Based on your verified Skill Passport</p>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Matched Skills ({match.matched.length}/{job.skillsRequired.length})
                </h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {job.skillsRequired.map((skill) => {
                    const isMatched = match.matched.includes(skill);
                    return (
                      <li
                        key={skill}
                        className={cnRow(isMatched)}
                      >
                        {isMatched ? (
                          <CircleCheck className="size-4 shrink-0 text-success" />
                        ) : (
                          <CircleCheck className="size-4 shrink-0 text-muted-foreground/40" />
                        )}
                        {skill}
                      </li>
                    );
                  })}
                </ul>
              </div>
              {match.missing.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Missing Skills</h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {match.missing.map((skill) => (
                      <li key={skill} className="flex items-center gap-2 text-sm text-foreground">
                        <CircleX className="size-4 shrink-0 text-tint-amber-fg" />
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="icon-tile-red flex size-11 shrink-0 items-center justify-center">
                <Sparkles className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Recommended Course</p>
                <p className="text-sm font-semibold text-foreground">{recommendedCourse.title}</p>
                <p className="text-xs text-muted-foreground">
                  {recommendedCourse.durationHours} hours &middot; {recommendedCourse.category}
                </p>
              </div>
            </div>
            <Button
              className="w-full shrink-0 sm:w-auto"
              render={<Link href={`/courses/${recommendedCourse.id}`}>View Course</Link>}
            />
          </div>
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="icon-tile-red flex size-12 shrink-0 items-center justify-center">
                <Building2 className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">{job.employer}</h2>
                <p className="text-sm text-muted-foreground">{job.sector}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{companyBlurb}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cnRow(matched: boolean) {
  return matched
    ? "flex items-center gap-2 text-sm text-foreground"
    : "flex items-center gap-2 text-sm text-muted-foreground/60 line-through decoration-muted-foreground/40";
}
