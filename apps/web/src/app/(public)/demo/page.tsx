import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Laptop } from "lucide-react";
import { DemoLoginCard } from "@/components/auth/demo-login-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "1-Click Demo Showcase | CoopSetu AI",
  description: "Instant access to all 6 ecosystem personas for Smart India Hackathon evaluators and cooperative stakeholders.",
};

const EVALUATION_PILLARS = [
  {
    title: "1. Skill Passport & Closed Loop",
    detail: "Verify how training leads to verifiable, micro-credentialed skills that employers directly search for.",
  },
  {
    title: "2. Offline-First & Resilient",
    detail: "Test downloading courses locally, offline QR attendance queueing, and IndexedDB sync.",
  },
  {
    title: "3. Institutional Workflow",
    detail: "Examine trainee nomination approvals, batch management, and national outcomes tracking.",
  },
  {
    title: "4. Multi-Role Ecosystem",
    detail: "Seamlessly jump between Trainee, Trainer, Employer, Admin, and Kiosk in 1 click.",
  },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
          <Sparkles className="size-3.5" />
          Smart India Hackathon 2026 Evaluation Hub
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl font-heading">
          CoopSetu AI Demo Hub
        </h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Test every feature across the cooperative skilling ecosystem. Select any of the 6 roles below to enter with pre-loaded profiles, active courses, verified certifications, and live dashboards.
        </p>
      </div>

      {/* Main 1-Click Demo Login Card */}
      <div className="mb-12">
        <DemoLoginCard />
      </div>

      {/* Evaluator Guide Cards */}
      <div className="mt-12 border-t border-border pt-10">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
            What Evaluators Can Test in Each Persona
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Switch between personas at any time using the top switcher bar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {EVALUATION_PILLARS.map((pillar) => (
            <Card key={pillar.title} className="border-border bg-card/60">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm text-foreground">{pillar.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pillar.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
