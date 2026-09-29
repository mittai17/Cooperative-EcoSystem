import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BadgeCheck,
  GraduationCap,
  BookOpen,
  Briefcase,
  Users,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  Building2,
  FileCheck2,
  TrendingUp,
  Landmark,
  UserCheck,
  Target,
  Award,
  MapPin,
  Brain,
  Rocket,
  UserCircle,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface RoleMeta {
  label: string;
  homeHref: string;
  navItems: NavItem[];
}

export const roleNav: Record<UserRole, RoleMeta> = {
  trainee: {
    label: "Trainee",
    homeHref: "/dashboard",
    navItems: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Learning", href: "/my-learning", icon: BookOpen },
      { label: "Courses", href: "/courses", icon: GraduationCap },
      { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
      { label: "Skill Passport", href: "/skill-passport", icon: BadgeCheck },
      { label: "Skill Gap", href: "/skill-gap", icon: Target },
      { label: "Certificates", href: "/certificates", icon: Award },
      { label: "Jobs", href: "/jobs", icon: Briefcase },
      { label: "Applications", href: "/applications", icon: ClipboardList },
      { label: "Attendance", href: "/attendance", icon: MapPin },
      { label: "Career AI", href: "/career-ai", icon: Brain },
      { label: "Entrepreneurship", href: "/entrepreneurship", icon: Rocket },
      { label: "Profile", href: "/profile", icon: UserCircle },
    ],
  },
  institution: {
    label: "Institution",
    homeHref: "/institution/dashboard",
    navItems: [
      { label: "Dashboard", href: "/institution/dashboard", icon: LayoutDashboard },
      { label: "Programmes", href: "/institution/programmes", icon: GraduationCap },
      { label: "Trainees", href: "/institution/trainees", icon: Users },
      { label: "Trainers", href: "/institution/trainers", icon: UserCheck },
      { label: "Attendance", href: "/institution/attendance", icon: ClipboardCheck },
      { label: "Timetable", href: "/institution/timetable", icon: ClipboardList },
      { label: "Certificates", href: "/institution/certificates", icon: FileCheck2 },
      { label: "Analytics", href: "/institution/analytics", icon: BarChart3 },
    ],
  },
  trainer: {
    label: "Trainer",
    homeHref: "/trainer/dashboard",
    navItems: [
      { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
      { label: "My Classes", href: "/trainer/classes", icon: Users },
      { label: "Attendance", href: "/trainer/attendance", icon: ClipboardCheck },
      { label: "Grading", href: "/trainer/assessments", icon: FileCheck2 },
      { label: "Trainees", href: "/trainer/trainees", icon: UserCheck },
      { label: "Content", href: "/trainer/content", icon: BookOpen },
    ],
  },
  employer: {
    label: "Employer",
    homeHref: "/employer/dashboard",
    navItems: [
      { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
      { label: "Jobs", href: "/employer/jobs", icon: Briefcase },
      { label: "Candidates", href: "/employer/candidates", icon: UserCheck },
      { label: "Feedback", href: "/employer/feedback", icon: ClipboardList },
    ],
  },
  admin: {
    label: "NCCT Admin",
    homeHref: "/admin/dashboard",
    navItems: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Institutions", href: "/admin/institutions", icon: Building2 },
      { label: "Skill Demand", href: "/admin/skill-demand", icon: TrendingUp },
      { label: "Employment", href: "/admin/employment", icon: Landmark },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
};
