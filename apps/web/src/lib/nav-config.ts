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
  Truck,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export interface NavChildItem {
  label: string;
  href: string;
  badge?: string | number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavChildItem[];
}

export interface RoleMeta {
  label: string;
  homeHref: string;
  navItems: NavItem[];
}

export const roleNav: Record<UserRole, RoleMeta> = {
  trainee: {
    label: "Trainee",
    homeHref: "/trainee/dashboard",
    navItems: [
      { label: "Dashboard", href: "/trainee/dashboard", icon: LayoutDashboard },
      { label: "Programmes", href: "/trainee/programmes", icon: ClipboardList },
      { label: "My Learning", href: "/trainee/my-learning", icon: BookOpen },
      { label: "Courses", href: "/trainee/courses", icon: GraduationCap },
      { label: "Assessments", href: "/trainee/assessments", icon: ClipboardCheck },
      {
        label: "Hostel Management",
        href: "/trainee/hostel",
        icon: Building2,
        children: [
          { label: "My Hostel", href: "/trainee/hostel" },
          { label: "Hostel Request", href: "/trainee/hostel/request" },
          { label: "My Allocation", href: "/trainee/hostel/allocation" },
          { label: "Hostel Notices", href: "/trainee/hostel/notices" },
          { label: "Hostel Facilities", href: "/trainee/hostel/facilities" },
          { label: "Hostel Rules", href: "/trainee/hostel/rules" },
        ],
      },
      { label: "Skill Passport", href: "/trainee/skill-passport", icon: BadgeCheck },
      { label: "Skill Gap", href: "/trainee/skill-gap", icon: Target },
      { label: "Certificates", href: "/trainee/certificates", icon: Award },
      { label: "Jobs", href: "/trainee/jobs", icon: Briefcase },
      { label: "Attendance", href: "/trainee/attendance", icon: MapPin },
      { label: "Career AI", href: "/trainee/career-ai", icon: Brain },
      { label: "Entrepreneurship", href: "/trainee/entrepreneurship", icon: Rocket },
      { label: "Profile", href: "/trainee/profile", icon: UserCircle },
    ],
  },
  institution: {
    label: "Institution",
    homeHref: "/institution/dashboard",
    navItems: [
      { label: "Dashboard", href: "/institution/dashboard", icon: LayoutDashboard },
      { label: "Programmes", href: "/institution/programmes", icon: GraduationCap },
      { label: "Batches", href: "/institution/batches", icon: ClipboardList },
      { label: "Trainees", href: "/institution/trainees", icon: Users },
      { label: "Trainers", href: "/institution/trainers", icon: UserCheck },
      { label: "Nominations", href: "/institution/nominations", icon: FileCheck2 },
      { label: "Timetable", href: "/institution/timetable", icon: ClipboardList },
      {
        label: "Hostel Management",
        href: "/institution/hostel",
        icon: Building2,
        children: [
          { label: "Overview", href: "/institution/hostel" },
          { label: "Hostels & Blocks", href: "/institution/hostel/blocks" },
          { label: "Rooms & Beds", href: "/institution/hostel/rooms" },
          { label: "Allocations", href: "/institution/hostel/allocations" },
          { label: "Hostel Requests", href: "/institution/hostel/requests" },
          { label: "Check-in / Check-out", href: "/institution/hostel/check-in-out" },
          { label: "Occupancy", href: "/institution/hostel/occupancy" },
          { label: "Hostel Attendance", href: "/institution/hostel/attendance" },
          { label: "Maintenance & Issues", href: "/institution/hostel/maintenance" },
          { label: "Notices & Rules", href: "/institution/hostel/notices" },
          { label: "Facilities", href: "/institution/hostel/facilities" },
          { label: "Reports", href: "/institution/hostel/reports" },
          { label: "Settings", href: "/institution/hostel/settings" },
        ],
      },
      {
        label: "Logistics",
        href: "/institution/logistics",
        icon: Truck,
        children: [
          { label: "Overview", href: "/institution/logistics" },
          { label: "Transport Plans", href: "/institution/logistics/plans" },
          { label: "Trips & Assignments", href: "/institution/logistics/trips" },
          { label: "Vehicles & Drivers", href: "/institution/logistics/vehicles" },
          { label: "Routes & Pickup Points", href: "/institution/logistics/routes" },
          { label: "Requests & Approvals", href: "/institution/logistics/requests" },
          { label: "Passenger Manifest", href: "/institution/logistics/manifest" },
          { label: "Incidents & Support", href: "/institution/logistics/incidents" },
          { label: "Expenses & Reports", href: "/institution/logistics/expenses" },
          { label: "Settings & Audit Log", href: "/institution/logistics/settings" },
        ],
      },
      { label: "Attendance", href: "/institution/attendance", icon: ClipboardCheck },
      { label: "Assessments", href: "/institution/assessments", icon: BookOpen },
      { label: "Certificates", href: "/institution/certificates", icon: Award },
      { label: "Analytics", href: "/institution/analytics", icon: BarChart3 },
      { label: "Reports", href: "/institution/reports", icon: TrendingUp },
      { label: "Profile", href: "/institution/profile", icon: UserCircle },
    ],
  },
  trainer: {
    label: "Trainer",
    homeHref: "/trainer/dashboard",
    navItems: [
      { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
      { label: "My Classes", href: "/trainer/classes", icon: Users },
      {
        label: "Hostel Management",
        href: "/trainer/hostel",
        icon: Building2,
        children: [
          { label: "My Batch Hostel", href: "/trainer/hostel" },
          { label: "Room Allocation", href: "/trainer/hostel/allocations" },
          { label: "Hostel Attendance", href: "/trainer/hostel/attendance" },
          { label: "Hostel Requests", href: "/trainer/hostel/requests" },
          { label: "Hostel Notices", href: "/trainer/hostel/notices" },
        ],
      },
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
  kiosk: {
    label: "Digital Kiosk",
    homeHref: "/kiosk",
    navItems: [
      { label: "Kiosk Station", href: "/kiosk", icon: LayoutDashboard },
      { label: "Attendance Scan", href: "/attendance", icon: MapPin },
      { label: "Trainer QR", href: "/trainer/attendance", icon: ClipboardCheck },
      { label: "Station Status", href: "/kiosk/status", icon: Settings },
    ],
  },
};
