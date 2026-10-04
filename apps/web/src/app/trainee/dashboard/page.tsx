"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  TrendingUp,
  Award,
  Briefcase,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Heart,
  ChevronLeft,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useApplications } from "@/lib/store/programme-store";
import { MOCK_PROGRAMMES } from "@/lib/mock-data/programmes-data";

// --- Mock Data ---
const SKILL_PROGRESS = [
  { label: "Dairy Operations", progress: 92, color: "bg-green-500" },
  { label: "PACS Accounting", progress: 88, color: "bg-purple-500" },
  { label: "Cooperative Law", progress: 84, color: "bg-red-500" },
  { label: "Quality Assurance", progress: 80, color: "bg-amber-500" },
];

const SCHEDULE = [
  { date: "12", month: "OCT", title: "Cooperative Management Fundamentals", time: "09:00 AM - 11:00 AM", mode: "Online", modeColor: "bg-blue-50 text-blue-600" },
  { date: "15", month: "OCT", title: "Dairy Cold Chain Operations", time: "10:00 AM - 01:00 PM", mode: "On-Campus", modeColor: "bg-orange-50 text-orange-600" },
  { date: "20", month: "OCT", title: "Certification Exam - Cooperative Law", time: "10:00 AM - 12:00 PM", mode: "Online", modeColor: "bg-blue-50 text-blue-600" },
];

const ACTIVITY = [
  { title: "Application submitted", desc: "Dairy Cooperative Operations", time: "2 hours ago", color: "bg-orange-500 text-white", icon: FileText },
  { title: "Certificate earned", desc: "Basic Digital Literacy", time: "1 day ago", color: "bg-green-500 text-white", icon: Award },
  { title: "Completed assessment", desc: "Cooperative Principles", time: "3 days ago", color: "bg-teal-500 text-white", icon: BookOpen },
  { title: "Enrolled in course", desc: "Cooperative Management Fundamentals", time: "5 days ago", color: "bg-purple-500 text-white", icon: Briefcase },
];

const JOBS = [
  { title: "Dairy Procurement Supervisor", company: "Amul Dairy Cooperative Union", loc: "Gujarat", iconBg: "bg-orange-100" },
  { title: "Cooperative Accounts Assistant", company: "Maharashtra State Cooperative Bank", loc: "Maharashtra", iconBg: "bg-orange-100" },
];

// --- Subcomponents ---

function DonutChart({ percentage }: { percentage: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/30" />
        <circle
          cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-heading">{percentage}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Overall Progress</span>
      </div>
    </div>
  );
}

export default function TraineeDashboardRedesign() {
  const { getByTrainee } = useApplications();
  const myApps = getByTrainee("trainee-ravindra");
  
  const approvedApps = myApps.filter(a => a.status === "batch_allocated" || a.status === "institution_approved").length;
  const pendingApps = myApps.filter(a => a.status === "pending_trainer" || a.status === "pending_institution").length;

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // Starts at Oct 2026
  const [savedProgs, setSavedProgs] = useState<Record<number, boolean>>({});
  
  const toggleSaved = (index: number) => {
    setSavedProgs(prev => ({ ...prev, [index]: !prev[index] }));
  };
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const KPIS = [
    { icon: BookOpen, value: MOCK_PROGRAMMES.length.toString(), title: "Available Programmes", desc: "Across 7 institutions", color: "text-red-500", bg: "bg-red-50", href: "/trainee/programmes" },
    { icon: FileText, value: myApps.length.toString(), title: "My Applications", desc: `${approvedApps} approved • ${pendingApps} pending`, color: "text-purple-500", bg: "bg-purple-50", href: "/trainee/applications" },
    { icon: TrendingUp, value: "3", title: "Active Courses", desc: "Continue learning", color: "text-pink-500", bg: "bg-pink-50", href: "/trainee/my-learning" },
    { icon: Award, value: "2", title: "Certificates", desc: "View your achievements", color: "text-orange-500", bg: "bg-orange-50", href: "/trainee/certificates" },
    { icon: Briefcase, value: "6", title: "Job Opportunities", desc: "Based on your skills", color: "text-violet-500", bg: "bg-violet-50", href: "/jobs" },
  ];

  const RECOMMENDED = MOCK_PROGRAMMES.slice(0, 3).map((p, i) => ({
    title: p.title,
    inst: p.institution,
    mode: p.mode,
    start: new Date(p.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    tags: p.skills.slice(0, 3),
    img: ["from-orange-400 to-rose-500", "from-violet-500 to-blue-500", "from-emerald-400 to-teal-600"][i],
    badge: i === 0 ? { text: "Popular", icon: TrendingUp, color: "bg-amber-100 text-amber-700" } : i === 1 ? { text: "Trending", icon: TrendingUp, color: "bg-orange-100 text-orange-700" } : { text: "New", icon: TrendingUp, color: "bg-green-100 text-green-700" }
  }));

  return (
    <div className="p-6 space-y-6 w-full pb-24">
      
      {/* 1. TOP BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-100/60 p-8 flex flex-col md:flex-row items-center justify-between min-h-[180px] w-full">
        {/* Background Graphic (Mockup style) */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] opacity-20 pointer-events-none hidden md:block"
             style={{ background: 'linear-gradient(135deg, transparent 0%, hsl(var(--primary)/0.4) 100%)' }} />
        
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-foreground mb-3 tracking-tight">
            Good afternoon, Ravindra! <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-md">
            Continue learning, register for new programmes, and build your skills for a stronger cooperative future.
          </p>
        </div>

        <div className="relative z-10 hidden lg:flex items-center gap-4 bg-background/95 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm max-w-xs mt-4 md:mt-0 mr-8">
          <div className="text-primary text-4xl font-serif font-bold leading-none">“</div>
          <p className="text-sm font-semibold italic text-foreground leading-snug">
            Skills empower individuals.<br />
            <span className="text-primary underline decoration-2 underline-offset-4">Cooperation empowers communities.</span>
          </p>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link key={i} href={kpi.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group rounded-2xl border border-border/60">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("p-2.5 rounded-xl", kpi.bg, kpi.color)}>
                        <Icon className="size-5" />
                      </div>
                      <span className="text-3xl font-bold font-heading text-foreground">{kpi.value}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{kpi.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.desc}</p>
                  </div>
                  <ChevronRight className="size-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* 3. MIDDLE ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Learning Progress */}
        <Card className="xl:col-span-5 rounded-2xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> My Learning Progress
            </CardTitle>
            <Link href="/trainee/my-learning" className="text-xs font-bold text-primary hover:underline">View Details</Link>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-8 pt-4 pb-6">
            <div className="shrink-0 pl-2">
              <DonutChart percentage={65} />
            </div>
            <div className="flex-1 space-y-4 w-full pr-2">
              {SKILL_PROGRESS.map((skill) => (
                <div key={skill.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", skill.color)} /> {skill.label}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{skill.progress}%</span>
                  </div>
                  <Progress value={skill.progress} className={cn("h-1.5", "[&>div]:" + skill.color)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card className="xl:col-span-4 rounded-2xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" /> Upcoming Schedule
            </CardTitle>
            <Link href="/trainee/dashboard" className="text-xs font-bold text-primary hover:underline">View Calendar</Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-5 pb-6">
            {SCHEDULE.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center shrink-0 w-12 h-14 rounded-xl bg-red-50/80 border border-red-100 text-primary">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.month}</span>
                  <span className="text-lg font-black font-heading leading-none mt-0.5">{item.date}</span>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="font-semibold text-sm truncate text-foreground">{item.title}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                    <Clock className="size-3" /> {item.time}
                  </div>
                </div>
                <Badge variant="secondary" className={cn("text-[10px] whitespace-nowrap mt-1 border-none", item.modeColor)}>
                  {item.mode}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calendar Widget */}
        <Card className="xl:col-span-3 rounded-2xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-base font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-muted rounded"><ChevronLeft className="size-4" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-muted rounded"><ChevronRight className="size-4" /></button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            <div className="grid grid-cols-7 text-center gap-y-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{d}</div>
              ))}
              {/* Padding */}
              {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                // Highlight days if we're in October 2026
                const isHighlight = currentDate.getMonth() === 9 && currentDate.getFullYear() === 2026 && [12, 15, 20].includes(day);
                return (
                  <div key={day} className="flex justify-center items-center">
                    <span className={cn(
                      "flex items-center justify-center size-7 text-xs font-bold rounded-full cursor-pointer transition-colors",
                      isHighlight ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" : "text-foreground hover:bg-muted"
                    )}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. BOTTOM ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recommended Programmes */}
        <Card className="xl:col-span-5 rounded-2xl shadow-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Recommended Programmes
            </CardTitle>
            <Link href="/trainee/programmes" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="pt-4 flex gap-4 overflow-x-auto pb-4 px-6 -mx-6 custom-scrollbar">
            {RECOMMENDED.map((prog, i) => (
              <div key={i} className="min-w-[260px] max-w-[260px] flex flex-col rounded-xl border border-border overflow-hidden group hover:shadow-md transition-shadow bg-card shrink-0">
                <div className={`relative h-32 w-full overflow-hidden bg-gradient-to-br ${prog.img} flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/10 z-10" />
                  <span className="text-6xl font-black text-white/20 select-none font-heading">{prog.title.charAt(0)}</span>
                  <div className="absolute top-2 left-2 z-20">
                    <Badge className={cn("text-[10px] font-bold px-1.5 py-0 border-none shadow-sm flex items-center gap-1", prog.badge.color)}>
                      <prog.badge.icon className="size-3" /> {prog.badge.text}
                    </Badge>
                  </div>
                  <button 
                    onClick={() => toggleSaved(i)}
                    className="absolute top-2 right-2 z-20 size-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center transition-colors hover:bg-background"
                  >
                    <Heart className={cn("size-3.5 transition-colors", savedProgs[i] ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500")} />
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-sm leading-tight mb-2 line-clamp-2 text-foreground">{prog.title}</h4>
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5 truncate"><span className="shrink-0"><Award className="size-3" /></span> <span className="truncate">{prog.inst}</span></div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1"><Clock className="size-3" /> 4 Weeks</div>
                      <div className="flex items-center gap-1"><Monitor className="size-3" /> {prog.mode}</div>
                    </div>
                  </div>
                  <p className="text-xs font-semibold mb-3 text-foreground">Starts {prog.start}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {prog.tags.map(t => (
                      <Badge key={t} variant="secondary" className="text-[9px] font-medium px-1.5 py-0 bg-muted/50 border-border">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Button render={<Link href="/trainee/programmes" />} variant="outline" size="sm" className="flex-1 w-full h-8 text-xs text-primary border-primary/20 hover:bg-primary/5">View Details</Button>
                    <Button render={<Link href="/trainee/programmes" />} size="sm" className="flex-1 w-full h-8 text-xs">Apply Now</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="xl:col-span-4 rounded-2xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ActivityIcon className="size-4 text-primary" /> My Recent Activity
            </CardTitle>
            <Link href="/trainee/profile" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            <div className="space-y-5">
              {ACTIVITY.map((act, i) => {
                const isLast = i === ACTIVITY.length - 1;
                return (
                  <div key={i} className="relative pl-6">
                    {!isLast && <div className="absolute left-[11px] top-6 bottom-[-20px] w-px bg-border" />}
                    <div className={cn("absolute left-0 top-1 size-6 rounded-full flex items-center justify-center text-white shadow-sm z-10", act.color)}>
                      <act.icon className="size-3" />
                    </div>
                    <div className="flex justify-between items-start pl-2 pt-0.5">
                      <div>
                        <p className="text-sm font-bold text-foreground">{act.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{act.desc}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0 pt-0.5">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Career Opportunities */}
        <Card className="xl:col-span-3 rounded-2xl shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Briefcase className="size-4 text-primary" /> Career Opportunities
            </CardTitle>
            <Link href="/trainee/jobs" className="text-xs font-bold text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 pb-6">
            {JOBS.map((job, i) => (
              <div key={i} className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={cn("size-10 rounded-lg flex flex-col items-center justify-center shrink-0 text-primary", job.iconBg)}>
                    <Briefcase className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-foreground">{job.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{job.company}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="size-3" /> {job.loc}</p>
                  </div>
                </div>
                <Button render={<Link href="/jobs" />} variant="outline" size="sm" className="w-full h-7 text-xs text-primary border-primary hover:bg-primary hover:text-white transition-colors">
                  Apply Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function ActivityIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
