import {
  BadgeCheck,
  BookOpen,
  ClipboardCheck,
  FolderKanban,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { skillPassport } from "@/lib/mock-data/skills";
import type { EvidenceType, SkillLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const levelTone: Record<SkillLevel, string> = {
  Foundational: "bg-muted text-muted-foreground",
  Intermediate: "bg-accent text-accent-foreground",
  Proficient: "bg-primary/10 text-primary",
  Expert: "bg-success/10 text-success",
};

const evidenceIcon: Record<EvidenceType, typeof BookOpen> = {
  Course: BookOpen,
  Assessment: ClipboardCheck,
  Project: FolderKanban,
  "Employer Feedback": MessageSquareText,
};

export default function SkillPassportPage() {
  const verifiedCount = (skillPassport ?? []).filter((s) => s.verified).length;
  const avgConfidence = (skillPassport ?? []).length > 0
    ? Math.round(skillPassport.reduce((sum, s) => sum + s.confidence, 0) / skillPassport.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Skill Passport"
        description="A living, evidence-backed record of your capabilities, assembled automatically from every course, assessment, and project you complete."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{skillPassport.length}</p>
              <p className="text-sm text-muted-foreground">Skills tracked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <span className="flex size-11 items-center justify-center rounded-md bg-success/10 text-success">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{verifiedCount} / {skillPassport.length}</p>
              <p className="text-sm text-muted-foreground">Independently verified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <span className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <BadgeCheck className="size-5" />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold text-foreground">{avgConfidence}%</p>
              <p className="text-sm text-muted-foreground">Average AI confidence</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {skillPassport.map((skill) => (
          <Card key={skill.name}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="font-heading text-lg">{skill.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">{skill.category}</p>
                </div>
                <Badge className={cn("shrink-0", levelTone[skill.level])} variant="secondary">
                  {skill.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI confidence</span>
                  <span className="font-medium text-foreground">{skill.confidence}%</span>
                </div>
                <Progress value={skill.confidence} />
              </div>

              <div className="flex items-center gap-2 text-sm">
                {skill.verified ? (
                  <span className="flex items-center gap-1.5 font-medium text-success">
                    <ShieldCheck className="size-4" /> Verified by institution
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-medium text-warning">
                    <ShieldAlert className="size-4" /> Pending verification
                  </span>
                )}
                <span className="text-muted-foreground">&middot; Updated {new Date(skill.lastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Evidence sources
                </p>
                <div className="flex flex-col gap-2">
                  {skill.evidence.map((evidence, index) => {
                    const Icon = evidenceIcon[evidence.type];
                    return (
                      <div
                        key={`${skill.name}-${index}`}
                        className="flex items-center gap-3 rounded-md border border-border p-2.5"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{evidence.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {evidence.type} &middot;{" "}
                            {new Date(evidence.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
