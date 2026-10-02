"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Users, BarChart3, FileText, Calendar as CalendarIcon,
  Clock, MapPin, CheckSquare, Bell, ChevronLeft, ChevronRight,
  Monitor, Video, ArrowUpRight, ArrowDownRight, CheckCircle2,
  AlertCircle, Upload, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const KPIS = [
  { icon: BookOpen, value: "3", title: "Active Programmes", trend: "+1 this month", trendUp: true, color: "text-red-500", bg: "bg-red-50" },
  { icon: Users, value: "139", title: "Total Trainees", trend: "+58 this month", trendUp: true, color: "text-green-500", bg: "bg-green-50" },
  { icon: BarChart3, value: "92%", title: "Average Attendance", trend: "+3% vs last month", trendUp: true, color: "text-red-500", bg: "bg-red-50" },
  { icon: FileText, value: "12", title: "Pending Applications", trend: "-2 vs last week", trendUp: false, color: "text-red-500", bg: "bg-red-50" },
];

const SCHEDULE = [
  { timeStart: "09:00 AM", timeEnd: "11:00 AM", title: "Cooperative Management Fundamentals", batch: "Batch CMF-01", loc: "Classroom 201", type: "live", btn: "Live Now" },
  { timeStart: "11:30 AM", timeEnd: "12:30 PM", title: "Doubt Clarification Session", batch: "Batch CMF-01", loc: "Online (Meet)", type: "join", btn: "Join Session" },
  { timeStart: "02:00 PM", timeEnd: "04:00 PM", title: "PACS Digital Accounting - Practical", batch: "Batch PDA-02", loc: "Computer Lab 1", type: "upcoming", btn: "Upcoming" },
  { timeStart: "04:30 PM", timeEnd: "05:00 PM", title: "Trainee Mentoring", batch: "One-on-One", loc: "Virtual Room", type: "upcoming", btn: "Upcoming" },
];

const TASKS = [
  { id: 1, title: "Review 5 new applications", sub: "Cooperative Management Fundamentals", tag: "Today", tagColor: "bg-red-50 text-red-600", done: false },
  { id: 2, title: "Grade assignments", sub: "PACS Digital Accounting", tag: "Today", tagColor: "bg-red-50 text-red-600", done: true },
  { id: 3, title: "Prepare next session material", sub: "Dairy Cooperative Operations", tag: "Tomorrow", tagColor: "bg-blue-50 text-blue-600", done: false },
  { id: 4, title: "Check attendance reports", sub: "Batch PDA-02", tag: "Tomorrow", tagColor: "bg-blue-50 text-blue-600", done: false },
  { id: 5, title: "Respond to trainee queries", sub: "3 pending messages", tag: "Tomorrow", tagColor: "bg-blue-50 text-blue-600", done: false },
  { id: 6, title: "Upload final syllabus", sub: "For upcoming legal cohort", tag: "This Week", tagColor: "bg-purple-50 text-purple-600", done: false },
  { id: 7, title: "Finalize exam rubrics", sub: "For Dairy Operations", tag: "This Week", tagColor: "bg-purple-50 text-purple-600", done: false },
  { id: 8, title: "Schedule guest lecture", sub: "With NDDB officials", tag: "This Week", tagColor: "bg-purple-50 text-purple-600", done: false },
];

const APPLICATIONS = [
  { id: "A1", name: "Ravindra S. Patil", initials: "R", bg: "bg-red-100 text-red-700", prog: "PACS Digital Accounting", date: "10 Oct 2026", status: "Pending" },
  { id: "A2", name: "Sunita Sharma", initials: "S", bg: "bg-blue-100 text-blue-700", prog: "Dairy Cooperative Operations", date: "09 Oct 2026", status: "Pending" },
  { id: "A3", name: "Amit Kumar", initials: "A", bg: "bg-blue-100 text-blue-700", prog: "Cooperative Law & Governance", date: "08 Oct 2026", status: "Pending" },
  { id: "A4", name: "Farida Shaikh", initials: "F", bg: "bg-green-100 text-green-700", prog: "Cooperative Management", date: "07 Oct 2026", status: "Approved" },
  { id: "A5", name: "Deepak Chauhan", initials: "D", bg: "bg-orange-100 text-orange-700", prog: "Dairy Operations", date: "06 Oct 2026", status: "Rejected" },
  { id: "A6", name: "Manish Verma", initials: "M", bg: "bg-indigo-100 text-indigo-700", prog: "Financial Auditing", date: "05 Oct 2026", status: "Approved" },
  { id: "A7", name: "Priya Rajan", initials: "P", bg: "bg-pink-100 text-pink-700", prog: "Agri-Tech Management", date: "05 Oct 2026", status: "Pending" },
  { id: "A8", name: "Kunal Gupta", initials: "K", bg: "bg-cyan-100 text-cyan-700", prog: "Cooperative Principles", date: "04 Oct 2026", status: "Approved" },
];

const ASSESSMENTS = [
  { title: "Module 2 Quiz", type: "quiz", prog: "PACS Digital Accounting", sub: "12/28", due: "Today", dueColor: "text-red-600" },
  { title: "Assignment 1", type: "doc", prog: "Cooperative Law", sub: "8/32", due: "15 Oct", dueColor: "text-muted-foreground" },
  { title: "Final Assessment", type: "exam", prog: "Dairy Operations", sub: "26/45", due: "18 Oct", dueColor: "text-muted-foreground" },
  { title: "Case Study Report", type: "doc", prog: "Cooperative Management", sub: "14/30", due: "20 Oct", dueColor: "text-muted-foreground" },
  { title: "Ethics Essay", type: "doc", prog: "Governance and Audits", sub: "31/35", due: "22 Oct", dueColor: "text-muted-foreground" },
  { title: "Midterm Quiz", type: "quiz", prog: "FPO Strategies", sub: "18/20", due: "25 Oct", dueColor: "text-muted-foreground" },
];

const NOTIFICATIONS = [
  { id: 1, title: "New application submitted", sub: "PACS Digital Accounting", time: "2 hours ago", unread: true, icon: Users, color: "text-blue-500 bg-blue-50" },
  { id: 2, title: "Trainee marked absent", sub: "Batch PDA-02 (15 Oct)", time: "5 hours ago", unread: true, icon: Users, color: "text-orange-500 bg-orange-50" },
  { id: 3, title: "Assessment graded", sub: "Cooperative Management", time: "1 day ago", unread: false, icon: FileText, color: "text-green-500 bg-green-50" },
  { id: 4, title: "New programme available", sub: "Women-led Cooperative Enterprise", time: "1 day ago", unread: false, icon: BookOpen, color: "text-red-500 bg-red-50" },
  { id: 5, title: "System announcement", sub: "Certification exam registration opens", time: "2 days ago", unread: false, icon: AlertCircle, color: "text-amber-500 bg-amber-50" },
];


export default function TrainerDashboardRedesign() {
  const [tasks, setTasks] = useState(TASKS);
  const [activeTaskTab, setActiveTaskTab] = useState("All");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 12)); // Oct 12, 2026

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date(2026, 9, 12));

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAction = (msg: string) => {
    alert(msg);
  };

  return (
    <div className="p-6 space-y-6 w-full pb-24">
      
      {/* 1. TOP BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-8 flex flex-col md:flex-row items-center justify-between min-h-[180px] w-full">
        {/* Abstract shapes / Image representation */}
        <div className="absolute right-32 top-0 bottom-0 w-[400px] opacity-100 pointer-events-none hidden lg:block" 
             style={{ backgroundImage: "url('https://cdn3d.iconscout.com/3d/premium/thumb/teacher-teaching-student-in-classroom-6813204-5616335.png')", backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
        
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-foreground mb-3 tracking-tight">
            Good afternoon, Dr. Meera Kulkarni! <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-md">
            Manage your training programmes, guide trainees, review applications, and track learning outcomes.
          </p>
        </div>

        <div className="relative z-10 hidden xl:flex items-center gap-4 bg-background/95 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm max-w-[280px] mt-4 md:mt-0">
          <div className="text-primary text-4xl font-serif font-bold leading-none">“</div>
          <p className="text-sm font-semibold italic text-foreground leading-snug">
            Skilled trainers<br />
            <span className="text-primary underline decoration-2 underline-offset-4">build stronger cooperatives.</span>
          </p>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer group rounded-2xl border border-border/60">
              <CardContent className="p-5 flex items-center justify-between relative overflow-hidden">
                <div className="z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2.5 rounded-xl", kpi.bg, kpi.color)}>
                      <Icon className="size-5" />
                    </div>
                    <span className="text-3xl font-bold font-heading text-foreground">{kpi.value}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground">{kpi.title}</h3>
                  <div className={cn("text-[11px] font-semibold mt-1 flex items-center gap-1", kpi.trendUp ? "text-green-600" : "text-red-600")}>
                    {kpi.trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {kpi.trend}
                  </div>
                </div>
                <ChevronRight className="size-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 absolute right-5 z-10" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. MIDDLE ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Today's Schedule */}
        <Card className="xl:col-span-6 rounded-2xl shadow-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" /> Today&apos;s Schedule
            </CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-medium">Tuesday, 12 Oct 2026</span>
              <Button variant="link" className="text-xs font-bold text-primary p-0 h-auto" onClick={() => handleAction("View Calendar clicked")}>View Calendar</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-6 flex-1 space-y-0">
            {SCHEDULE.map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                {/* Timeline Line */}
                {i !== SCHEDULE.length - 1 && <div className="absolute left-[83px] top-4 bottom-[-16px] w-0.5 bg-border z-0" />}
                
                {/* Time Block */}
                <div className="w-[60px] flex flex-col items-end text-[10px] font-bold text-muted-foreground pt-1.5 shrink-0">
                  <span>{item.timeStart}</span>
                  <span className="font-medium">{item.timeEnd}</span>
                </div>
                
                {/* Timeline Dot */}
                <div className="relative z-10 pt-2.5">
                  <div className={cn("size-3 rounded-full border-2 bg-background", item.type === "live" ? "border-red-500" : "border-primary/40")} />
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 pt-1">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-1 font-medium">
                      <span className="flex items-center gap-1"><Users className="size-3" /> {item.batch}</span>
                      <span className="flex items-center gap-1"><Monitor className="size-3" /> {item.loc}</span>
                    </div>
                  </div>
                  <Button 
                    variant={item.type === "live" ? "default" : "outline"}
                    size="sm" 
                    className={cn(
                      "h-7 text-xs font-semibold shrink-0 rounded-full px-4",
                      item.type === "live" ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" : 
                      item.type === "upcoming" ? "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" : ""
                    )}
                    onClick={() => handleAction(`Action: ${item.btn}`)}
                  >
                    {item.btn} <ChevronRight className="size-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calendar Widget */}
        <Card className="xl:col-span-3 rounded-2xl shadow-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex gap-1 items-center">
              <button onClick={prevMonth} className="p-1 hover:bg-muted rounded"><ChevronLeft className="size-4" /></button>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 rounded-full border-primary/20 text-primary hover:bg-primary/10 ml-1" onClick={goToday}>Today</Button>
              <button onClick={nextMonth} className="p-1 hover:bg-muted rounded ml-1"><ChevronRight className="size-4" /></button>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-6 flex-1 flex flex-col">
            <div className="grid grid-cols-7 text-center gap-y-3 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-bold text-muted-foreground uppercase">{d}</div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = currentDate.getMonth() === 9 && currentDate.getFullYear() === 2026 && day === 12; // Force Oct 12 as "Today" for demo
                const hasClass = [5, 12, 19, 26].includes(day);
                const hasAssessment = [15, 20].includes(day);
                const hasDeadline = [20].includes(day);

                return (
                  <div key={day} className="flex flex-col items-center justify-start h-8 cursor-pointer group" onClick={() => handleAction(`Selected date: ${day}`)}>
                    <span className={cn(
                      "flex items-center justify-center size-7 text-xs font-bold rounded-full transition-colors",
                      isToday ? "bg-primary text-primary-foreground shadow-md" : "text-foreground group-hover:bg-muted"
                    )}>
                      {day}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      {hasClass && <span className="size-1 rounded-full bg-primary" />}
                      {hasAssessment && <span className="size-1 rounded-full bg-red-500" />}
                      {hasDeadline && <span className="size-1 rounded-full bg-amber-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto flex justify-center gap-3 text-[9px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-primary" /> Class</span>
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-red-500" /> Assessment</span>
              <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" /> Deadline</span>
            </div>
          </CardContent>
        </Card>

        {/* Tasks & Reminders */}
        <Card className="xl:col-span-3 rounded-2xl shadow-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckSquare className="size-4 text-primary" /> My Tasks & Reminders
            </CardTitle>
            <Button variant="link" className="text-xs font-bold text-primary p-0 h-auto" onClick={() => handleAction("View All tasks")}>View All</Button>
          </CardHeader>
          <div className="px-5 pt-3">
            <div className="flex gap-2">
              {['All', 'Today', 'This Week'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTaskTab(tab)}
                  className={cn(
                    "px-3 py-1 text-[11px] font-bold rounded-full transition-colors",
                    activeTaskTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {tab} {tab === 'All' ? '(5)' : tab === 'Today' ? '(2)' : '(2)'}
                </button>
              ))}
            </div>
          </div>
          <CardContent className="pt-4 pb-6 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {tasks.filter(t => activeTaskTab === 'All' || (activeTaskTab === 'Today' && t.tag === 'Today') || (activeTaskTab === 'This Week' && t.tag === 'Tomorrow')).map(task => (
                <div key={task.id} className="flex gap-3 items-start group">
                  <Checkbox 
                    checked={task.done} 
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-bold transition-all", task.done ? "line-through text-muted-foreground" : "text-foreground")}>{task.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{task.sub}</p>
                  </div>
                  <Badge variant="secondary" className={cn("text-[9px] font-bold px-1.5 py-0 border-none shrink-0", task.tagColor)}>
                    {task.tag}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 4. BOTTOM ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Recent Applications */}
        <Card className="xl:col-span-5 rounded-2xl shadow-sm border-border flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" /> Recent Applications
            </CardTitle>
            <Button variant="link" className="text-xs font-bold text-primary p-0 h-auto" onClick={() => handleAction("View All applications")}>View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs text-left border-b border-border">
                <tr>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Applicant</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Programme</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Submitted On</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Status</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {APPLICATIONS.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("size-6 rounded-full flex items-center justify-center text-[10px] font-bold", app.bg)}>
                          {app.initials}
                        </div>
                        <span className="font-semibold text-xs text-foreground whitespace-nowrap">{app.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground truncate max-w-[120px]">{app.prog}</td>
                    <td className="py-2.5 px-4 text-[11px] text-muted-foreground">{app.date}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold px-1.5 py-0",
                        app.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                        app.status === 'Approved' ? "bg-green-50 text-green-600 border-green-200" :
                        "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 text-[10px] font-bold border-primary/40 text-primary hover:bg-primary hover:text-white transition-colors"
                        onClick={() => handleAction(`Review application: ${app.name}`)}
                      >
                        {app.status === 'Pending' ? 'Review' : 'View'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Assessments to Grade */}
        <Card className="xl:col-span-4 rounded-2xl shadow-sm border-border flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="size-4 text-primary" /> Assessments to Grade
            </CardTitle>
            <Button variant="link" className="text-xs font-bold text-primary p-0 h-auto" onClick={() => handleAction("View All assessments")}>View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs text-left border-b border-border">
                <tr>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Assessment</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Programme</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Submissions</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Due Date</th>
                  <th className="font-semibold py-2.5 px-4 font-heading tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ASSESSMENTS.map((assm, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4 flex items-center gap-2">
                      <div className="size-6 rounded bg-red-50 flex items-center justify-center text-primary shrink-0">
                        {assm.type === 'quiz' ? <CheckSquare className="size-3" /> : <FileText className="size-3" />}
                      </div>
                      <span className="font-semibold text-xs text-foreground whitespace-nowrap">{assm.title}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground truncate max-w-[100px]">{assm.prog}</td>
                    <td className="py-2.5 px-4 text-xs font-semibold text-foreground">{assm.sub}</td>
                    <td className={cn("py-2.5 px-4 text-xs font-bold", assm.dueColor)}>{assm.due}</td>
                    <td className="py-2.5 px-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 text-[10px] font-bold border-primary/40 text-primary hover:bg-primary hover:text-white transition-colors px-3"
                        onClick={() => handleAction(`Grade assessment: ${assm.title}`)}
                      >
                        Grade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="xl:col-span-3 rounded-2xl shadow-sm border-border flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20 rounded-t-2xl">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="size-4 text-primary" /> Notifications
            </CardTitle>
            <Button variant="link" className="text-xs font-bold text-primary p-0 h-auto" onClick={() => handleAction("View All notifications")}>View All</Button>
          </CardHeader>
          <CardContent className="pt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {NOTIFICATIONS.map((notif) => (
                <div key={notif.id} className="flex gap-3 relative cursor-pointer group" onClick={() => handleAction(`Notification clicked: ${notif.title}`)}>
                  <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", notif.color)}>
                    <notif.icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className={cn("text-xs transition-colors", notif.unread ? "font-bold text-foreground group-hover:text-primary" : "font-medium text-foreground")}>
                      {notif.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{notif.sub}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">{notif.time}</p>
                  </div>
                  {notif.unread && (
                    <div className="absolute right-0 top-1 size-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
