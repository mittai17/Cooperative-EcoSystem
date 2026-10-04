import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Lightbulb, Users, LineChart, Info, TrendingUp, Building2, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

type Demand = "Very High" | "High" | "Steady";

interface VentureIdea {
  title: string;
  summary: string;
  capital: "Low" | "Medium" | "High";
  capitalNote: string;
  demand: Demand;
  icon: typeof Lightbulb;
  iconTone: string;
  scheme: string;
}

const IDEAS: VentureIdea[] = [
  {
    title: "Dairy Processing Cooperative",
    summary: "Start a local value-added dairy cooperative focusing on paneer, ghee and flavoured yoghurt, buying milk from 40 to 60 member families at a published daily rate.",
    capital: "High",
    capitalNote: "Rs 18-25 lakh for a mini chilling and packing unit",
    demand: "High",
    icon: Lightbulb,
    iconTone: "text-orange-500",
    scheme: "NCDC Dairy Infrastructure Fund",
  },
  {
    title: "Agri-Input Supply Society",
    summary: "Form a society to procure seed, fertiliser and farm implements in bulk for local farmers and sell at a fixed annual price list.",
    capital: "Medium",
    capitalNote: "Rs 8-12 lakh working capital for a seasonal cycle",
    demand: "Very High",
    icon: LineChart,
    iconTone: "text-success",
    scheme: "NCDC Short Term Cooperative Credit",
  },
  {
    title: "Cold Chain Rental Society",
    summary: "Pool member-owned refrigerated transport and offer on-demand cold storage to fruit and vegetable growers who cannot reach mandi on time.",
    capital: "High",
    capitalNote: "Rs 22-30 lakh for two reefer units",
    demand: "High",
    icon: Building2,
    iconTone: "text-primary",
    scheme: "MIDP Cold Chain Scheme",
  },
  {
    title: "Grain Storage & Procurement Society",
    summary: "Run a scientifically managed storage and procurement service so small farmers can store produce and sell when the market price improves.",
    capital: "Medium",
    capitalNote: "Rs 6-9 lakh for 500-tonne storage capacity",
    demand: "Steady",
    icon: TrendingUp,
    iconTone: "text-amber-600",
    scheme: "NABARD Infrastructure Fund",
  },
];

type SkillState = "Missing" | "Foundational" | "Working" | "Proficient";

interface SkillGap {
  skill: string;
  state: SkillState;
  note: string;
  fill: string;
}

const SKILL_GAPS: SkillGap[] = [
  { skill: "Business Planning & Strategy", state: "Missing", note: "No course or project evidence yet", fill: "Add a 6-week entrepreneurship module" },
  { skill: "Financial Modeling", state: "Missing", note: "Bookkeeping is verified but not cash-flow modelling", fill: "Add an agri-business modelling short course" },
  { skill: "Cooperative Registration & Law", state: "Foundational", note: "Bylaws drafting verified at 74%", fill: "Complete the registration and licensing checklist" },
  { skill: "Member Engagement & Conflict Resolution", state: "Working", note: "Leadership verified at 70%", fill: "Attempt the grievance redressal simulation" },
  { skill: "Procurement & Inventory Planning", state: "Proficient", note: "Dairy operations verified at 88%", fill: "No action needed" },
];

const SKILL_TONE: Record<SkillState, string> = {
  Missing: "bg-destructive/10 text-destructive border-destructive/30",
  Foundational: "text-orange-600 border-orange-300 bg-orange-50",
  Working: "text-amber-700 border-amber-300 bg-amber-50",
  Proficient: "bg-success/10 text-success border-success/30",
};

interface Mentor {
  name: string;
  initials: string;
  title: string;
  focus: string;
  sessions: number;
  rating: number;
}

const MENTORS: Mentor[] = [
  { name: "Vijay Kumar", initials: "VK", title: "Founder, Surat Agri-Coop", focus: "Agri-input supply society", sessions: 42, rating: 4.9 },
  { name: "Sunita Menon", initials: "SM", title: "NCCT Startup Advisor", focus: "Dairy value addition, funding", sessions: 118, rating: 4.8 },
  { name: "Dr. Lata Mhaske", initials: "LM", title: "Faculty Head, VAMNICOM Pune", focus: "Cooperative registration and law", sessions: 76, rating: 4.7 },
  { name: "Imran Qureshi", initials: "IQ", title: "Secretary, Kerala Fisheries Federation", focus: "Membership and governance", sessions: 31, rating: 4.6 },
];

export default function EntrepreneurshipPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Entrepreneurship Pathway"
        description="Explore paths to start your own cooperative or agribusiness."
      />

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 text-sm text-primary-foreground/80">
        <Info className="size-5 text-primary shrink-0" />
        <p className="text-primary font-medium">
          Note: This is a training and mentorship pathway to help you build skills. It does not guarantee government funding or immediate registration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h3 className="font-heading font-semibold text-lg">Business Idea Discovery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {IDEAS.map((idea) => {
              const Icon = idea.icon;
              return (
                <Card key={idea.title} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base">{idea.title}</CardTitle>
                      <Icon className={cn("size-5 shrink-0", idea.iconTone)} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">{idea.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-1">
                        <IndianRupee className="size-3" /> Capital: {idea.capital}
                      </Badge>
                      <Badge variant="outline">Demand: {idea.demand}</Badge>
                    </div>
                    <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-3">
                      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IndianRupee className="size-3.5" /> {idea.capitalNote}
                      </p>
                      <p className="text-xs text-primary font-medium">Support scheme: {idea.scheme}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button render={<Link href="/trainee/programmes" />} className="w-full" variant="secondary" nativeButton={false}>Explore Model</Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Required Business Skills Gap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {SKILL_GAPS.map((gap) => (
                  <div key={gap.skill} className="flex flex-col gap-1.5 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-sm font-medium">{gap.skill}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{gap.note}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn("text-[10px]", SKILL_TONE[gap.state])}>{gap.state}</Badge>
                      <span className="text-[11px] text-muted-foreground">{gap.fill}</span>
                    </div>
                  </div>
                ))}
                <Button render={<Link href="/trainee/my-learning" />} className="w-fit mt-2" size="sm" nativeButton={false}>View Learning Path</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" /> Mentor Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {MENTORS.map((mentor) => (
                <div key={mentor.name} className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">{mentor.initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{mentor.name}</p>
                    <p className="text-xs text-muted-foreground">{mentor.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {mentor.focus} &middot; {mentor.sessions} sessions &middot; {mentor.rating.toFixed(1)} rating
                    </p>
                  </div>
                </div>
              ))}
              <Button render={<Link href="/trainee/career-ai" />} variant="outline" className="w-full mt-2" nativeButton={false}>Request Mentorship</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}