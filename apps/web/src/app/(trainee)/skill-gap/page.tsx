"use client";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Link from "next/link";
import {
  Target,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleRequirement {
  skill: string;
  requiredLevel: string;
  currentLevel: string | null;
  status: "met" | "gap" | "missing";
  matchScore: number;
}

interface CareerRole {
  title: string;
  sector: string;
  overallMatch: number;
  requirements: RoleRequirement[];
  recommendedCourses: { title: string; duration: string; fillsGap: string }[];
}

const careerRoles: Record<string, CareerRole> = {
  "Cooperative Development Officer": {
    title: "Cooperative Development Officer",
    sector: "NCDC / State Cooperative Dept.",
    overallMatch: 72,
    requirements: [
      { skill: "Cooperative Management", requiredLevel: "Proficient", currentLevel: "Proficient", status: "met", matchScore: 100 },
      { skill: "Communication & Facilitation", requiredLevel: "Intermediate", currentLevel: "Proficient", status: "met", matchScore: 100 },
      { skill: "Rural Development", requiredLevel: "Intermediate", currentLevel: "Foundational", status: "gap", matchScore: 50 },
      { skill: "Data Analysis", requiredLevel: "Intermediate", currentLevel: null, status: "missing", matchScore: 0 },
      { skill: "Financial Management", requiredLevel: "Foundational", currentLevel: "Foundational", status: "met", matchScore: 100 },
    ],
    recommendedCourses: [
      { title: "Data Analytics for Cooperatives", duration: "6 weeks", fillsGap: "Data Analysis" },
      { title: "Rural Development Fundamentals", duration: "4 weeks", fillsGap: "Rural Development" },
    ],
  },
  "Dairy Cooperative Manager": {
    title: "Dairy Cooperative Manager",
    sector: "Amul / State Dairy Federation",
    overallMatch: 65,
    requirements: [
      { skill: "Dairy Operations", requiredLevel: "Advanced", currentLevel: "Proficient", status: "gap", matchScore: 75 },
      { skill: "Financial Management", requiredLevel: "Intermediate", currentLevel: "Foundational", status: "gap", matchScore: 50 },
      { skill: "Supply Chain Logistics", requiredLevel: "Intermediate", currentLevel: null, status: "missing", matchScore: 0 },
      { skill: "Leadership & Facilitation", requiredLevel: "Intermediate", currentLevel: "Intermediate", status: "met", matchScore: 100 },
      { skill: "Quality Assurance", requiredLevel: "Foundational", currentLevel: null, status: "missing", matchScore: 0 },
    ],
    recommendedCourses: [
      { title: "Advanced Dairy Co-op Financials", duration: "5 weeks", fillsGap: "Financial Management" },
      { title: "Agri-Supply Chain Fundamentals", duration: "6 weeks", fillsGap: "Supply Chain Logistics" },
      { title: "Food Quality & Safety Standards", duration: "3 weeks", fillsGap: "Quality Assurance" },
    ],
  },
  "Credit Officer": {
    title: "Credit Officer",
    sector: "District Central Cooperative Bank",
    overallMatch: 58,
    requirements: [
      { skill: "Financial Management", requiredLevel: "Advanced", currentLevel: "Foundational", status: "gap", matchScore: 33 },
      { skill: "Credit Appraisal", requiredLevel: "Proficient", currentLevel: null, status: "missing", matchScore: 0 },
      { skill: "Data Analysis", requiredLevel: "Intermediate", currentLevel: null, status: "missing", matchScore: 0 },
      { skill: "Cooperative Governance", requiredLevel: "Intermediate", currentLevel: "Proficient", status: "met", matchScore: 100 },
      { skill: "Communication", requiredLevel: "Foundational", currentLevel: "Proficient", status: "met", matchScore: 100 },
    ],
    recommendedCourses: [
      { title: "Credit Appraisal & Risk Management", duration: "8 weeks", fillsGap: "Credit Appraisal" },
      { title: "Data Analytics for Cooperatives", duration: "6 weeks", fillsGap: "Data Analysis" },
      { title: "Advanced Cooperative Financials", duration: "5 weeks", fillsGap: "Financial Management" },
    ],
  },
  "Agri-Marketing Specialist": {
    title: "Agri-Marketing Specialist",
    sector: "FPO / Agri Export Board",
    overallMatch: 78,
    requirements: [
      { skill: "Digital Marketing", requiredLevel: "Intermediate", currentLevel: "Intermediate", status: "met", matchScore: 100 },
      { skill: "Communication & Facilitation", requiredLevel: "Proficient", currentLevel: "Proficient", status: "met", matchScore: 100 },
      { skill: "Market Analysis", requiredLevel: "Intermediate", currentLevel: "Foundational", status: "gap", matchScore: 50 },
      { skill: "Rural Development", requiredLevel: "Foundational", currentLevel: "Foundational", status: "met", matchScore: 100 },
      { skill: "Supply Chain Logistics", requiredLevel: "Foundational", currentLevel: null, status: "missing", matchScore: 0 },
    ],
    recommendedCourses: [
      { title: "Agricultural Market Analysis", duration: "4 weeks", fillsGap: "Market Analysis" },
      { title: "Agri-Supply Chain Fundamentals", duration: "6 weeks", fillsGap: "Supply Chain Logistics" },
    ],
  },
};

const statusConfig = {
  met: { label: "Met", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200", badgeClass: "bg-green-100 text-green-700" },
  gap: { label: "Partial Gap", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", badgeClass: "bg-amber-100 text-amber-700" },
  missing: { label: "Missing", icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", badgeClass: "bg-red-100 text-red-700" },
};

export default function SkillGapPage() {
  const [selectedRole, setSelectedRole] = useState("Cooperative Development Officer");
  const role = careerRoles[selectedRole];
  const metCount = role.requirements.filter((r) => r.status === "met").length;
  const gapCount = role.requirements.filter((r) => r.status === "gap").length;
  const missingCount = role.requirements.filter((r) => r.status === "missing").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Skill Gap Analysis"
        description="Compare your verified skills against your target role and get personalised learning recommendations."
        action={
          <Button variant="outline" render={<Link href="/career-ai">Open Career AI</Link>} />
        }
      />

      {/* Role Selector + Match Score */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Career Role
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary md:w-80"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {Object.keys(careerRoles).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{role.sector}</p>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Overall Match
              </p>
              <div className="flex items-center gap-3">
                <div className="h-3 w-48 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      role.overallMatch >= 70 ? "bg-green-500" : role.overallMatch >= 50 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${role.overallMatch}%` }}
                  />
                </div>
                <span className="text-2xl font-bold text-foreground">{role.overallMatch}%</span>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">{metCount} met</span>
                <span className="text-amber-600 font-medium">{gapCount} gap</span>
                <span className="text-red-600 font-medium">{missingCount} missing</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Skill Comparison */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <Target className="size-4.5 text-primary" />
              Skill-by-Skill Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {role.requirements.map((req) => {
              const config = statusConfig[req.status];
              const Icon = config.icon;
              return (
                <div
                  key={req.skill}
                  className={cn("flex items-center justify-between rounded-lg border p-3 gap-4", config.bg)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Icon className={cn("size-4 shrink-0", config.color)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{req.skill}</p>
                      <p className="text-xs text-muted-foreground">
                        Required: <span className="font-medium">{req.requiredLevel}</span>
                        {req.currentLevel && (
                          <> · Yours: <span className="font-medium">{req.currentLevel}</span></>
                        )}
                        {!req.currentLevel && (
                          <> · <span className="text-red-600 font-medium">Not in Skill Passport</span></>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", config.badgeClass)}>
                      {config.label}
                    </span>
                    <Progress value={req.matchScore} className="h-1.5 w-16" />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recommended Courses */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-base">
                <Sparkles className="size-4.5 text-primary" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {role.recommendedCourses.map((course) => (
                <div key={course.title} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{course.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Fills gap: <span className="font-medium text-amber-600">{course.fillsGap}</span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">{course.duration}</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-fit text-xs" render={<Link href="/courses">Enrol Now <ArrowRight className="ml-1 size-3" /></Link>} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Quick Summary</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete <strong>{missingCount + gapCount} course{missingCount + gapCount !== 1 ? "s" : ""}</strong> to
                close your skill gaps. Estimated time to full readiness:{" "}
                <strong>{role.recommendedCourses.reduce((sum, c) => sum + parseInt(c.duration), 0)} weeks</strong>.
              </p>
              <Button className="mt-1 w-full" size="sm" render={<Link href="/career-ai">Get Full Career Plan</Link>} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
