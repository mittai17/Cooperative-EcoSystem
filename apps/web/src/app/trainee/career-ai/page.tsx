"use client";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Bot, CheckCircle2, Circle, Clock, Loader2, Send, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { traineeProfile } from "@/lib/trainee/identity";
import { useT } from "@/i18n";

interface RoadmapStep {
  id: string;
  title: string;
  detail: string;
  weeks: number;
  status: "completed" | "in_progress" | "planned";
  skills: string[];
  href: string;
  action: string;
}

const ROADMAP: RoadmapStep[] = [
  {
    id: "rm-1",
    title: "Dairy Cooperative Operations certification",
    detail:
      "Completed the 120-hour programme with a practical in a 42-cow dairy unit at Baramati Taluka. Milk testing, herd records and route-level cold chain assessed on campus.",
    weeks: 12,
    status: "completed",
    skills: ["Dairy Operations", "Quality Testing", "Logistics Planning"],
    href: "/trainee/certificates",
    action: "View certificate",
  },
  {
    id: "rm-2",
    title: "Cooperative bookkeeping with Tally",
    detail:
      "Day-book, cash scroll and statutory registers for a 4,000-member credit society, then a three-year manual ledger migrated into Tally with a reconciled opening balance sheet.",
    weeks: 8,
    status: "completed",
    skills: ["Bookkeeping", "Tally", "Statutory Compliance"],
    href: "/trainee/certificates",
    action: "View certificate",
  },
  {
    id: "rm-3",
    title: "Data analysis for cooperative decision-making",
    detail:
      "Member default-risk dashboard and procurement trend sheets using spreadsheets, so route and repayment decisions can be argued with numbers instead of intuition.",
    weeks: 6,
    status: "in_progress",
    skills: ["Data Analysis", "Dashboarding", "Spreadsheets"],
    href: "/trainee/courses",
    action: "Continue course",
  },
  {
    id: "rm-4",
    title: "Agricultural credit appraisal and risk",
    detail:
      "Crop loan appraisal, Kisan Credit Card limits and NPA early-warning signals, ending with a NABARD refinance documentation project for a branch society.",
    weeks: 8,
    status: "planned",
    skills: ["Credit Appraisal", "Risk Management", "Compliance"],
    href: "/trainee/courses",
    action: "View course",
  },
  {
    id: "rm-5",
    title: "PACS computerisation internship",
    detail:
      "Six-month posting at a Primary Agricultural Credit Society to work on member passbook digitisation, daily cash positions and Common Service Centre services.",
    weeks: 24,
    status: "planned",
    skills: ["Cooperative Accounting", "Member Relations", "PACS Computerisation"],
    href: "/trainee/programmes",
    action: "Browse programmes",
  },
];

const STATUS_META = {
  completed: { label: "Completed", icon: CheckCircle2, dot: "bg-success", badge: "bg-success/20 text-success" },
  in_progress: { label: "In progress", icon: Loader2, dot: "bg-primary", badge: "bg-primary/20 text-primary" },
  planned: { label: "Planned", icon: Circle, dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground" },
} as const;

const SUGGESTED_PROMPTS = [
  "Which certification gets me a PACS job fastest?",
  "What is my current skill match for dairy supervisor roles?",
  "Which assessment should I attempt next week?",
  "How do I improve my placement offer odds?",
];

export default function CareerAiPage() {
  const [tab, setTab] = useState("Chat");
  const [input, setInput] = useState("");
  const t = useT();

  const [messages, setMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    { sender: "bot", text: t("trainee.careerAi.greeting").replace("{name}", "Ravindra") },
    { sender: "user", text: t("trainee.careerAi.userGoal") },
    { sender: "bot", text: `${t("trainee.careerAi.reply1")} ${t("trainee.careerAi.reply2")}` },
    {
      sender: "bot",
      text: `Right now your Skill Passport carries ${ROADMAP.filter((step) => step.status === "completed").length} completed certifications and 1 course in progress. Your two closest gaps are Data Analysis and Credit Appraisal, and both are available as short programmes at your institute.`,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const tabs = [
    { id: "Chat", label: "Chat" },
    { id: "My Career Plan", label: "My Career Plan" },
  ];

  const handleSendMessage = (preset?: string) => {
    const userText = (preset ?? input).trim();
    if (!userText || isTyping) return;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setIsTyping(true);

    setTimeout(() => {
      const text = userText.toLowerCase();
      let reply = "Based on your current progress in Cooperative Management, I recommend focusing on statutory audit compliance and PACS financial computerization modules to boost your job readiness by 30%.";
      if (text.includes("job") || text.includes("salary") || text.includes("career")) {
        reply = "Looking at active openings across state cooperative federations, candidates with dual certification in Dairy Cold Chain and PACS ERP are seeing 40% higher placement offers.";
      } else if (text.includes("exam") || text.includes("assessment")) {
        reply = "You have 2 upcoming assessments scheduled this week. Reviewing Chapter 4 on Democratic Governance will ensure you achieve distinction grade.";
      } else if (text.includes("certification") || text.includes("pacs")) {
        reply = "For a PACS role, finish Data Analysis for Cooperative Decision-Making next, then Agricultural Credit Appraisal. Together they lift your verified match above 70% for Credit Officer openings.";
      } else if (text.includes("skill") || text.includes("match")) {
        reply = "Your verified Skill Passport already covers Dairy Operations, Quality Testing, Logistics Planning, Tally, Statutory Compliance, Governance and Bylaws Drafting. Credit Appraisal is partially verified, so one project submission would complete it.";
      } else if (text.includes("offer") || text.includes("placement")) {
        reply = "Your Amul Dairy Procurement offer is the strongest signal on your profile. Clear the Dairy Procurement Supervisor interview with a 9-day cold-chain route plan you already built as your capstone.";
      }
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      setIsTyping(false);
    }, 800);
  };

  const completedSteps = ROADMAP.filter((step) => step.status === "completed").length;
  const totalWeeks = ROADMAP.reduce((total, step) => total + step.weeks, 0);
  const planProgress = Math.round(
    (ROADMAP.reduce((total, step) => total + (step.status === "completed" ? step.weeks : step.status === "in_progress" ? step.weeks / 2 : 0), 0) / totalWeeks) * 100,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("trainee.careerAi.title", "AI Career Navigator")}
        description="Ask about skills, certifications and job readiness, or open your career plan to see the roadmap built from your Skill Passport."
      />

      <div className="flex items-center gap-2 border-b border-border pb-2">
        {tabs.map(({ id, label }) => (
          <Button
            key={id}
            variant={id === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(id)}
          >
            {id === "Chat" && <Sparkles className="mr-2 size-4" />}
            {label}
          </Button>
        ))}
      </div>

      {tab === "Chat" ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3 max-w-[80%]",
                      m.sender === "user" ? "self-end flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center shrink-0",
                        m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}
                    >
                      {m.sender === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                    </div>
                    <div
                      className={cn(
                        "p-3 text-sm rounded-2xl leading-relaxed",
                        m.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="size-4 text-primary" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm text-muted-foreground flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-primary animate-pulse" />
                      <span className="size-2 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
                      <span className="size-2 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Badge
                    key={prompt}
                    variant="outline"
                    className="cursor-pointer whitespace-nowrap px-2.5 py-1 text-xs font-normal"
                    onClick={() => handleSendMessage(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2 border-t border-border pt-3">
                <input
                  type="text"
                  placeholder={t("trainee.careerAi.inputPlaceholder")}
                  className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button size="icon" onClick={() => handleSendMessage()} disabled={isTyping || !input.trim()}>
                  <Send className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Goal Overview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Programme</p>
                  <p className="font-medium mt-1">{traineeProfile.programme}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{traineeProfile.institution}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Target Role</p>
                  <p className="font-medium mt-1 text-primary">{traineeProfile.careerGoal}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Timeline</p>
                  <p className="font-medium mt-1">{totalWeeks} weeks across {ROADMAP.length} milestones</p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Roadmap progress</span>
                    <span className="text-foreground">{planProgress}%</span>
                  </div>
                  <Progress value={planProgress} className="mt-1.5" />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {completedSteps} of {ROADMAP.length} milestones certified
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Roadmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative border-l border-muted-foreground/30 ml-3 md:ml-4 flex flex-col gap-8 pb-4">
                  {ROADMAP.map((step) => {
                    const meta = STATUS_META[step.status];
                    const StatusIcon = meta.icon;
                    return (
                      <div key={step.id} className="relative pl-6">
                        <div className={cn("absolute left-[-5px] top-1.5 size-2.5 rounded-full", meta.dot)} />
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={cn("font-semibold text-sm", step.status === "planned" && "text-muted-foreground")}>
                            {step.title}
                          </h4>
                          <Badge variant="secondary" className={cn("border-none text-[10px]", meta.badge)}>
                            <StatusIcon className="mr-1 size-3" />
                            {meta.label}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="size-3" /> {step.weeks} weeks
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {step.skills.map((skill) => (
                            <span key={skill} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {skill}
                            </span>
                          ))}
                        </div>
                        <Button
                          render={<Link href={step.href} />}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          nativeButton={false}
                        >
                          {step.action}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}