"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Pencil,
  Camera,
  Copy,
  Check,
  Calendar,
  MapPin,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  Award,
  FileText,
  Layers,
  Sparkles,
  Briefcase,
  Activity,
  Settings,
  ChevronRight,
  Target,
  User,
  Lock,
  Bell,
  ShieldCheck,
  Globe,
  Play,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Laptop,
  Users,
  CreditCard,
  Database,
  Compass,
  MessageSquare,
  X,
  Share2,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ── Demo Data ─────────────────────────────────────────────────────────────────

const INITIAL_PROFILE = {
  name: "Arjun Kumar",
  role: "Trainee",
  rollNo: "TN20260012",
  age: "19 years",
  dob: "17 Feb 2007",
  gender: "Male",
  location: "Chennai, Tamil Nadu",
  languages: "Tamil, English",
  email: "arjunkumar@example.com",
  phone: "+91 98765 43210",
  bio: "Aspiring to build a career in cooperative management and digital technologies. Interested in learning, skill development and contributing to rural growth.",
  careerGoal: "Cooperative Manager",
  careerGoalDesc:
    "I want to work in a cooperative society and contribute to rural development using digital technologies.",
};

const STATS = [
  {
    icon: BookOpen,
    count: 5,
    label: "Courses\nIn Progress",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    textColor: "text-red-600 dark:text-red-400",
  },
  {
    icon: CheckCircle2,
    count: 12,
    label: "Courses\nCompleted",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Settings,
    count: 18,
    label: "Skills\nEarned",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: FileText,
    count: 3,
    label: "Certificates",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
];

const RECENT_COURSES = [
  {
    id: "rc1",
    title: "Cooperative Management Fundamentals",
    type: "DIKSHA • Video",
    progress: 82,
    thumbnail: "/trainee/profile/recent-1.png",
  },
  {
    id: "rc2",
    title: "Financial Literacy for Cooperatives",
    type: "DIKSHA • Reading",
    progress: 60,
    thumbnail: "/trainee/profile/recent-2.png",
  },
  {
    id: "rc3",
    title: "Digital Tools for Rural Development",
    type: "DIKSHA • Video",
    progress: 32,
    thumbnail: "/trainee/profile/recent-3.png",
  },
];

const SKILLS = [
  { name: "Digital Literacy", icon: Laptop, color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  { name: "Cooperative Management", icon: Users, color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" },
  { name: "Financial Literacy", icon: CreditCard, color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  { name: "Data Management", icon: Database, color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  { name: "Leadership", icon: Compass, color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  { name: "Communication", icon: MessageSquare, color: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800" },
];

const CERTIFICATES = [
  {
    id: "cert1",
    title: "Digital Literacy for Cooperatives",
    issuedOn: "12 Sep 2026",
    issuer: "NCCT • National Council for Cooperative Training",
    certId: "NCCT-DL-2026-90412",
    verified: true,
    thumbnail: "/trainee/profile/cert-1.png",
  },
  {
    id: "cert2",
    title: "Cooperative Management Basics",
    issuedOn: "25 Aug 2026",
    issuer: "VAMNICOM • Pune",
    certId: "VAM-CMB-2026-4410",
    verified: true,
    thumbnail: "/trainee/profile/cert-2.png",
  },
  {
    id: "cert3",
    title: "Rural Financial Inclusion",
    issuedOn: "10 Jul 2026",
    issuer: "NABARD • Financial Inclusion Wing",
    certId: "NAB-RFI-2026-7819",
    verified: true,
    thumbnail: "/trainee/profile/cert-3.png",
  },
];

const RECOMMENDED_COURSES = [
  {
    id: "rec1",
    title: "Advanced Cooperative Management",
    meta: "DIKSHA • Course • 4h 20m",
    thumbnail: "/trainee/profile/rec-1.png",
  },
  {
    id: "rec2",
    title: "Digital Payments in Cooperatives",
    meta: "DIKSHA • Course • 3h 10m",
    thumbnail: "/trainee/profile/rec-2.png",
  },
  {
    id: "rec3",
    title: "Leadership in Rural Communities",
    meta: "DIKSHA • Course • 2h 45m",
    thumbnail: "/trainee/profile/rec-3.png",
  },
];

type TabType = "overview" | "learning" | "certificates" | "skills" | "jobs" | "activity" | "settings";

export default function TraineeProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCareerGoalOpen, setIsCareerGoalOpen] = useState(false);
  const [isSkillGapOpen, setIsSkillGapOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<(typeof CERTIFICATES)[0] | null>(null);

  // Form states
  const [editFormData, setEditFormData] = useState(profile);
  const [careerFormData, setCareerFormData] = useState({
    careerGoal: profile.careerGoal,
    careerGoalDesc: profile.careerGoalDesc,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyRollNo = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(profile.rollNo);
    }
    setCopied(true);
    showToast(`Copied ${profile.rollNo} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editFormData);
    setIsEditProfileOpen(false);
    showToast("Profile details updated successfully!");
  };

  const handleSaveCareer = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile((prev) => ({
      ...prev,
      careerGoal: careerFormData.careerGoal,
      careerGoalDesc: careerFormData.careerGoalDesc,
    }));
    setIsCareerGoalOpen(false);
    showToast("Career goals updated successfully!");
  };

  return (
    <div className="space-y-6 pb-12 pt-2 sm:pt-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-4">
          <Check className="size-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Page Header ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <span>Home</span>
          <span className="text-muted-foreground/60">&gt;</span>
          <span className="text-foreground font-medium">Profile</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              My Profile
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your profile, skills, learning progress and career goals.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditFormData(profile);
              setIsEditProfileOpen(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* ── 2. Trainee Hero Card ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left: Avatar + Identity + Bio */}
          <div className="flex flex-col sm:flex-row items-start gap-5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="size-24 rounded-full overflow-hidden border-2 border-border shadow-xs bg-muted">
                <Image
                  src="/trainee/profile/arjun-avatar.png"
                  alt={profile.name}
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditFormData(profile);
                  setIsEditProfileOpen(true);
                }}
                className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-md hover:bg-slate-800 border-2 border-background transition cursor-pointer"
                title="Change Photo"
              >
                <Camera className="size-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {profile.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-red-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-red-400 dark:border-rose-900/60">
                  <span className="size-1.5 rounded-full bg-red-600"></span>
                  {profile.role}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CreditCard className="size-3.5 text-muted-foreground/70" />
                <span className="font-mono font-medium text-foreground tracking-wide">
                  {profile.rollNo}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRollNo}
                  className="p-1 hover:text-foreground text-muted-foreground transition cursor-pointer"
                  title="Copy Roll Number"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
                {copied && (
                  <span className="text-[11px] text-emerald-600 font-medium ml-1">
                    Copied!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground/70" />
                  <span>{profile.age}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground/70" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground/70" />
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="size-3.5 text-muted-foreground/70" />
                <span>{profile.phone}</span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground pt-2 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            </div>
          </div>

          {/* Right: 4 Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pt-4 lg:pt-0 lg:border-l lg:border-border/60 lg:pl-8 shrink-0">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center sm:items-start text-center sm:text-left"
                >
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      stat.bgColor,
                      stat.textColor
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <span className="text-2xl font-bold text-foreground mt-2">
                    {stat.count}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium whitespace-pre-line leading-tight mt-0.5">
                    {stat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Tab Navigation Bar ───────────────────────────────────────── */}
      <div className="border-b border-border/80 bg-card rounded-xl px-2 sm:px-4 shadow-2xs">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "learning", label: "Learning", icon: BookOpen },
            { id: "certificates", label: "Certificates", icon: Award },
            { id: "skills", label: "Skills", icon: Sparkles },
            { id: "jobs", label: "Job Preferences", icon: Briefcase },
            { id: "activity", label: "Activity", icon: Activity },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 py-3 text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap",
                  isActive
                    ? "text-red-600 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg"
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-red-600" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Content Area by Tab ─────────────────────────────────── */}

      {/* OVERVIEW TAB (Matches the Reference Screenshot Exactly) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columns 1 & 2 Wrapper (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Subgrid: Col 1 (Learning) & Col 2 (Skills & Certs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── Subcol 1: Learning Progress & Recent Learning ── */}
              <div className="space-y-6">
                {/* Learning Progress Card */}
                <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      Learning Progress
                    </h3>
                    <button
                      onClick={() => setActiveTab("learning")}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      View All <ArrowRight className="size-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* Donut Chart */}
                    <div className="relative flex size-24 shrink-0 items-center justify-center">
                      <svg className="size-full -rotate-90" viewBox="0 0 88 88">
                        {/* Background track */}
                        <circle
                          cx="44"
                          cy="44"
                          r="34"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted/30"
                        />
                        {/* Progress ring 68% */}
                        <circle
                          cx="44"
                          cy="44"
                          r="34"
                          fill="transparent"
                          stroke="#2563EB"
                          strokeWidth="8"
                          strokeDasharray={213.6}
                          strokeDashoffset={213.6 * (1 - 0.68)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-foreground">68%</span>
                      </div>
                    </div>

                    {/* Progress text */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-foreground">
                        Overall Progress
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        You&apos;re doing great! Keep learning.
                      </p>

                      {/* Legend */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2 rounded-full bg-cyan-500"></span>
                            In Progress
                          </span>
                          <span className="font-bold text-foreground">5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            Completed
                          </span>
                          <span className="font-bold text-foreground">12</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2 rounded-full bg-gray-400"></span>
                            Not Started
                          </span>
                          <span className="font-bold text-foreground">3</span>
                        </div>
                        <div className="border-t border-border/60 pt-1.5 mt-1.5 flex items-center justify-between font-medium">
                          <span className="text-muted-foreground">Total Courses</span>
                          <span className="font-bold text-foreground">20</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Learning Card */}
                <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      Recent Learning
                    </h3>
                    <button
                      onClick={() => setActiveTab("learning")}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      View All <ArrowRight className="size-3" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {RECENT_COURSES.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-3 group"
                      >
                        {/* Thumbnail */}
                        <div className="relative size-12 shrink-0 rounded-lg overflow-hidden border border-border/60 bg-muted">
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            width={48}
                            height={48}
                            className="size-full object-cover"
                          />
                        </div>

                        {/* Title & Progress */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-foreground leading-snug line-clamp-1 group-hover:text-red-600 transition">
                            {course.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {course.type}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {course.progress}%
                            </span>
                          </div>
                        </div>

                        {/* Continue Button */}
                        <Button
                          size="sm"
                          onClick={() => showToast(`Resuming ${course.title}...`)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 h-auto rounded-lg shadow-2xs shrink-0 cursor-pointer"
                        >
                          Continue
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Subcol 2: Skill Passport & Certificates ── */}
              <div className="space-y-6">
                {/* Skill Passport Card */}
                <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      Skill Passport
                    </h3>
                    <button
                      onClick={() => setActiveTab("skills")}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      View All <ArrowRight className="size-3" />
                    </button>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {SKILLS.map((skill, i) => {
                      const Icon = skill.icon;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium min-w-0",
                            skill.color
                          )}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">{skill.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Showcase Sub-card */}
                  <div
                    onClick={() => setActiveTab("skills")}
                    className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 cursor-pointer hover:bg-emerald-100/60 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                        <Award className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          18 Skills Earned
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Showcase your skills to employers
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
                  </div>
                </div>

                {/* Certificates Card */}
                <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      Certificates
                    </h3>
                    <button
                      onClick={() => setActiveTab("certificates")}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition"
                    >
                      View All <ArrowRight className="size-3" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {CERTIFICATES.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center gap-3 group"
                      >
                        {/* Certificate Thumbnail */}
                        <div className="relative w-11 h-8 shrink-0 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 overflow-hidden shadow-2xs">
                          <Image
                            src={cert.thumbnail}
                            alt={cert.title}
                            width={44}
                            height={32}
                            className="size-full object-cover"
                          />
                        </div>

                        {/* Title & Issued Date */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate group-hover:text-red-600 transition">
                            {cert.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              Issued on {cert.issuedOn}
                            </span>
                            <span className="inline-flex items-center text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-0.2">
                              ✓ Verified
                            </span>
                          </div>
                        </div>

                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedCert(cert)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition cursor-pointer shrink-0"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bottom Section of Left: Recommended for You (Spanning full 2 cols) ── */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Recommended for You
                </h3>
                <button
                  onClick={() => setActiveTab("learning")}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition"
                >
                  View All <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {RECOMMENDED_COURSES.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 hover:border-red-200 dark:hover:border-red-900/50 transition group"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="relative size-14 shrink-0 rounded-lg overflow-hidden border border-border/60 bg-muted">
                          <Image
                            src={rec.thumbnail}
                            alt={rec.title}
                            width={56}
                            height={56}
                            className="size-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 group-hover:text-red-600 transition">
                            {rec.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {rec.meta}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => showToast(`Enrolling in ${rec.title}...`)}
                      className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 h-auto rounded-lg shadow-2xs cursor-pointer"
                    >
                      Start Learning
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Column 3: Career Goal, Personal Info & Account Settings ─────── */}
          <div className="space-y-6">
            {/* Career Goal Card */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Career Goal
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setCareerFormData({
                      careerGoal: profile.careerGoal,
                      careerGoalDesc: profile.careerGoalDesc,
                    });
                    setIsCareerGoalOpen(true);
                  }}
                  className="rounded border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted transition cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 mt-0.5">
                  <Target className="size-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {profile.careerGoal}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {profile.careerGoalDesc}
                  </p>
                </div>
              </div>

              {/* Skill Gap Analysis Sub-Card */}
              <div
                onClick={() => setIsSkillGapOpen(true)}
                className="mt-3.5 flex items-center justify-between rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-3 cursor-pointer hover:bg-rose-100/60 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/60 text-red-600 dark:text-red-400">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        Skill Gap Analysis
                      </span>
                    </div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">
                      3 missing skills
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Learn these skills to reach your goal
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-foreground">
                  Personal Information
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditFormData(profile);
                    setIsEditProfileOpen(true);
                  }}
                  className="rounded border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted transition cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 text-muted-foreground/70" />
                    Full Name
                  </span>
                  <span className="font-semibold text-foreground">{profile.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3.5 text-muted-foreground/70" />
                    Date of Birth
                  </span>
                  <span className="font-semibold text-foreground">{profile.dob}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <User className="size-3.5 text-muted-foreground/70" />
                    Gender
                  </span>
                  <span className="font-semibold text-foreground">{profile.gender}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-3.5 text-muted-foreground/70" />
                    Location
                  </span>
                  <span className="font-semibold text-foreground">{profile.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="size-3.5 text-muted-foreground/70" />
                    Languages
                  </span>
                  <span className="font-semibold text-foreground">{profile.languages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 text-muted-foreground/70" />
                    Email
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[160px]">
                    {profile.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5 text-muted-foreground/70" />
                    Phone
                  </span>
                  <span className="font-semibold text-foreground">{profile.phone}</span>
                </div>
              </div>
            </div>

            {/* Account Settings Card */}
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-3">
                Account Settings
              </h3>

              <div className="divide-y divide-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setEditFormData(profile);
                    setIsEditProfileOpen(true);
                  }}
                  className="flex w-full items-center justify-between py-2.5 text-xs text-foreground hover:text-red-600 transition group cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <User className="size-4 text-muted-foreground group-hover:text-red-600 transition" />
                    Edit Profile
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex w-full items-center justify-between py-2.5 text-xs text-foreground hover:text-red-600 transition group cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Lock className="size-4 text-muted-foreground group-hover:text-red-600 transition" />
                    Change Password
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="flex w-full items-center justify-between py-2.5 text-xs text-foreground hover:text-red-600 transition group cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Bell className="size-4 text-muted-foreground group-hover:text-red-600 transition" />
                    Notification Preferences
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="flex w-full items-center justify-between py-2.5 text-xs text-foreground hover:text-red-600 transition group cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldCheck className="size-4 text-muted-foreground group-hover:text-red-600 transition" />
                    Privacy &amp; Security
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEARNING TAB ──────────────────────────────────────────────── */}
      {activeTab === "learning" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/80 bg-card p-5">
              <span className="text-xs text-muted-foreground">In Progress</span>
              <p className="text-2xl font-bold text-foreground mt-1">5 Courses</p>
              <p className="text-xs text-emerald-600 mt-2">Avg. completion: 68%</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-5">
              <span className="text-xs text-muted-foreground">Completed</span>
              <p className="text-2xl font-bold text-foreground mt-1">12 Courses</p>
              <p className="text-xs text-muted-foreground mt-2">100% verified on DIKSHA</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-card p-5">
              <span className="text-xs text-muted-foreground">Learning Hours</span>
              <p className="text-2xl font-bold text-foreground mt-1">48.5 Hours</p>
              <p className="text-xs text-emerald-600 mt-2">+6.2 hrs this week</p>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
            <h3 className="text-base font-bold text-foreground mb-4">All Enrolled Courses</h3>
            <div className="divide-y divide-border/60">
              {[...RECENT_COURSES, ...RECOMMENDED_COURSES].map((item, idx) => (
                <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        width={48}
                        height={48}
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{"progress" in item ? item.type : item.meta}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {"progress" in item ? (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {item.progress}% Completed
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        Not Started
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => showToast(`Opening ${item.title}...`)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      {"progress" in item ? "Continue" : "Start"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CERTIFICATES TAB ─────────────────────────────────────────── */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Verified Credentials &amp; Badges</h3>
                <p className="text-xs text-muted-foreground">All credentials cryptographically verifiable via DigiLocker &amp; CoopSetu</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast("Downloading full transcript...")}
                className="gap-1.5 text-xs"
              >
                <Download className="size-3.5" /> Download Transcript
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CERTIFICATES.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl border border-border/80 bg-card p-4 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full rounded-lg border border-amber-300 dark:border-amber-700 overflow-hidden bg-amber-50 shadow-2xs mb-3">
                      <Image
                        src={cert.thumbnail}
                        alt={cert.title}
                        width={240}
                        height={180}
                        className="size-full object-cover"
                      />
                    </div>
                    <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mb-2">
                      ✓ Verified on Blockchain
                    </span>
                    <h4 className="font-bold text-sm text-foreground">{cert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{cert.issuer}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Issued: {cert.issuedOn}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/80 mt-1">ID: {cert.certId}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedCert(cert)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      View Certificate
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => showToast("Share link copied!")}
                      className="size-8"
                    >
                      <Share2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SKILLS TAB ──────────────────────────────────────────────── */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
            <h3 className="text-lg font-bold text-foreground">Skill Passport</h3>
            <p className="text-xs text-muted-foreground mb-6">
              18 verified skills certified by training institutes and peer assessments.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Digital Literacy", category: "Technology", level: "Advanced", icon: Laptop },
                { name: "Cooperative Management", category: "Core Operations", level: "Intermediate", icon: Users },
                { name: "Financial Literacy", category: "Finance", level: "Intermediate", icon: CreditCard },
                { name: "Data Management", category: "Analytics", level: "Proficient", icon: Database },
                { name: "Leadership", category: "Soft Skills", level: "Intermediate", icon: Compass },
                { name: "Communication", category: "Soft Skills", level: "Advanced", icon: MessageSquare },
                { name: "Rural Marketing", category: "Domain", level: "Intermediate", icon: TrendingUp },
                { name: "Tally Accounting", category: "Finance", level: "Beginner", icon: FileText },
                { name: "Agri-Supply Chains", category: "Domain", level: "Intermediate", icon: Briefcase },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={idx} className="rounded-xl border border-border p-4 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
                        <p className="text-[11px] text-muted-foreground">{s.category}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {s.level}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── JOB PREFERENCES TAB ───────────────────────────────────────── */}
      {activeTab === "jobs" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
            <h3 className="text-lg font-bold text-foreground">Job &amp; Internship Preferences</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Match with cooperative societies, rural banks, and agricultural institutions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Desired Roles</Label>
                <Input defaultValue="Cooperative Manager, Society Secretary, Operations Associate" />
              </div>
              <div className="space-y-2">
                <Label>Preferred Locations</Label>
                <Input defaultValue="Chennai, Coimbatore, Madurai, Salem (Tamil Nadu)" />
              </div>
              <div className="space-y-2">
                <Label>Availability</Label>
                <Input defaultValue="Immediate / Within 30 days" />
              </div>
              <div className="space-y-2">
                <Label>Expected Monthly Stipend / Salary</Label>
                <Input defaultValue="₹25,000 - ₹35,000 / month" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => showToast("Job preferences updated!")}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY TAB ────────────────────────────────────────────── */}
      {activeTab === "activity" && (
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
          <h3 className="text-lg font-bold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { text: "Completed Module 4: Digital Accounting with Tally", time: "Today, 11:30 AM" },
              { text: "Passed Quiz: Financial Literacy for Cooperatives (Score: 92%)", time: "Yesterday, 4:15 PM" },
              { text: "Earned badge: Data Management Certification", time: "28 Sep 2026" },
              { text: "Enrolled in Leadership in Rural Communities", time: "25 Sep 2026" },
            ].map((act, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-border/40 last:border-0">
                <div className="size-2 rounded-full bg-red-600"></div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{act.text}</p>
                  <p className="text-xs text-muted-foreground">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
            <h3 className="text-lg font-bold text-foreground mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { title: "Course Updates & Deadlines", desc: "Get notified when new lessons or assignments are posted." },
                { title: "Job Recommendations", desc: "Receive alerts for cooperative society vacancies matching your skills." },
                { title: "Certificate Issuance", desc: "Get instantly alerted when an institution issues a verified credential." },
                { title: "SMS Alerts", desc: "Receive urgent exam & cohort notifications via SMS on registered mobile." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={idx < 3} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS & DIALOGS ───────────────────────────────────────────── */}

      {/* 1. Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Edit Profile</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Full Name</Label>
                <Input
                  id="p-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-age">Age</Label>
                  <Input
                    id="p-age"
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-dob">Date of Birth</Label>
                  <Input
                    id="p-dob"
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-location">Location</Label>
                  <Input
                    id="p-location"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-languages">Languages</Label>
                  <Input
                    id="p-languages"
                    value={editFormData.languages}
                    onChange={(e) => setEditFormData({ ...editFormData, languages: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-email">Email</Label>
                  <Input
                    id="p-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-phone">Phone</Label>
                  <Input
                    id="p-phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-bio">Bio</Label>
                <Textarea
                  id="p-bio"
                  rows={3}
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Career Goal Modal */}
      {isCareerGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Edit Career Goal</h3>
              <button
                onClick={() => setIsCareerGoalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCareer} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="cg-title">Target Role</Label>
                <Input
                  id="cg-title"
                  value={careerFormData.careerGoal}
                  onChange={(e) => setCareerFormData({ ...careerFormData, careerGoal: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cg-desc">Goal Description</Label>
                <Textarea
                  id="cg-desc"
                  rows={4}
                  value={careerFormData.careerGoalDesc}
                  onChange={(e) => setCareerFormData({ ...careerFormData, careerGoalDesc: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCareerGoalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  Save Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Skill Gap Analysis Modal */}
      {isSkillGapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-red-600" />
                <h3 className="font-bold text-lg text-foreground">Skill Gap Analysis</h3>
              </div>
              <button
                onClick={() => setIsSkillGapOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                To qualify as a certified <strong>{profile.careerGoal}</strong> in state cooperatives, complete the following 3 missing proficiencies:
              </p>

              <div className="space-y-3">
                {[
                  {
                    skill: "Cooperative Auditing & Compliance",
                    reason: "Required by NCCT & Registrar of Cooperative Societies regulations.",
                    recommended: "DIKSHA Course: Statutory Audit Basics",
                  },
                  {
                    skill: "Agri-Warehouse ERP Management",
                    reason: "Critical for PACS digitalization and grain inventory management.",
                    recommended: "NCCT Module: PACS Software Operations",
                  },
                  {
                    skill: "Credit Risk Assessment",
                    reason: "Essential for evaluating crop loan eligibility and recovery.",
                    recommended: "NABARD Module: Micro-credit Assessment",
                  },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/50 dark:bg-rose-950/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">{item.skill}</span>
                      <span className="text-[10px] font-semibold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">Missing</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.reason}</p>
                    <p className="text-[11px] font-medium text-red-600 pt-1">Recommended: {item.recommended}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    setIsSkillGapOpen(false);
                    setActiveTab("learning");
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  Explore Missing Courses
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Certificate Preview Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">{selectedCert.title}</h3>
                <p className="text-xs text-muted-foreground">{selectedCert.issuer}</p>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="relative aspect-[16/10] w-full rounded-xl border-2 border-amber-300 dark:border-amber-700 overflow-hidden bg-amber-50 shadow-md">
                <Image
                  src={selectedCert.thumbnail}
                  alt={selectedCert.title}
                  width={560}
                  height={350}
                  className="size-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="text-muted-foreground">Issued Date:</span>
                  <p className="font-semibold text-foreground">{selectedCert.issuedOn}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-semibold text-emerald-600">✓ Verified &amp; Signed</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Credential ID:</span>
                  <p className="font-mono text-foreground">{selectedCert.certId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Issued To:</span>
                  <p className="font-semibold text-foreground">{profile.name}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    showToast("Certificate downloaded!");
                    setSelectedCert(null);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Download className="size-3.5" /> Download PDF
                </Button>
                <Button
                  onClick={() => {
                    showToast("Verification URL copied!");
                    setSelectedCert(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5"
                >
                  <ExternalLink className="size-3.5" /> Verify Credential
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Change Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsPasswordModalOpen(false);
                showToast("Password updated successfully!");
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="space-y-1">
                <Label htmlFor="old-pass">Current Password</Label>
                <Input id="old-pass" type="password" placeholder="••••••••" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-pass">New Password</Label>
                <Input id="new-pass" type="password" placeholder="Minimum 8 characters" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-pass">Confirm New Password</Label>
                <Input id="confirm-pass" type="password" placeholder="Repeat new password" required />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
