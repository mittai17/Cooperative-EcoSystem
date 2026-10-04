"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Award,
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Play,
  Video,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Building2,
  Search,
  Filter,
  Check,
  Send,
  Eye,
  FileCheck2,
  ChevronDown,
  Sparkles,
  QrCode,
  GraduationCap,
  Percent,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const KPIS = [
  {
    id: "programmes",
    label: "Active Programmes",
    value: "3",
    icon: BookOpen,
    trend: "↑ 1 this quarter",
    trendUp: true,
    bg: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    border: "border-red-100",
  },
  {
    id: "trainees",
    label: "Total Trainees",
    value: "139",
    icon: Users,
    trend: "↑ 58 this month",
    trendUp: true,
    bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    border: "border-emerald-100",
  },
  {
    id: "nominations",
    label: "Pending Nominations",
    value: "12",
    icon: FileText,
    trend: "↓ 5 vs last week",
    trendUp: false,
    bg: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    border: "border-red-100",
  },
  {
    id: "attendance",
    label: "Attendance Rate",
    value: "92%",
    icon: TrendingUp,
    trend: "↑ 3% vs last month",
    trendUp: true,
    bg: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
    border: "border-teal-100",
  },
  {
    id: "certificates",
    label: "Certificates Issued",
    value: "218",
    icon: Award,
    trend: "↑ 24 this quarter",
    trendUp: true,
    bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    border: "border-amber-100",
  },
];

const INITIAL_OPERATIONS = [
  {
    id: "op-1",
    timeStart: "09:00 AM",
    timeEnd: "11:00 AM",
    dotColor: "bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950",
    programme: "Cooperative Management Fundamentals",
    trainer: "Dr. Meera Kulkarni",
    batch: "CMF-01",
    room: "Room 201",
    mode: "On-Campus",
    status: "Ongoing",
    statusType: "ongoing",
    actionLabel: "View",
    actionType: "view",
    topics: "Principles of Rochdale, Board Governance & Democratic Member Control",
    enrolled: 47,
  },
  {
    id: "op-2",
    timeStart: "11:30 AM",
    timeEnd: "12:30 PM",
    dotColor: "bg-red-500 ring-4 ring-red-100 dark:ring-red-950",
    programme: "PACS Digital Accounting (Practical)",
    trainer: "Mr. Suresh Jadhav",
    batch: "PDA-02",
    room: "Lab 1",
    mode: "On-Campus",
    status: "Upcoming",
    statusType: "upcoming",
    actionLabel: "Start",
    actionType: "start",
    topics: "Day-book entry posting, reconciliation with DCCB core banking portal",
    enrolled: 52,
  },
  {
    id: "op-3",
    timeStart: "02:00 PM",
    timeEnd: "04:00 PM",
    dotColor: "bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-100 dark:ring-slate-800",
    programme: "Cooperative Law & Governance",
    trainer: "Dr. Anand Deshmukh",
    batch: "CLG-01",
    room: "Room 203",
    mode: "Online",
    status: "Upcoming",
    statusType: "upcoming",
    actionLabel: "Join",
    actionType: "join",
    topics: "Multi-State Cooperative Societies Act 2023 Amendments & Election Rules",
    enrolled: 28,
  },
  {
    id: "op-4",
    timeStart: "04:30 PM",
    timeEnd: "05:30 PM",
    dotColor: "bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-100 dark:ring-slate-800",
    programme: "Trainer Coordination Meeting",
    trainer: "Institution Admin",
    batch: "All Trainers",
    room: "All Trainers",
    mode: "Online",
    status: "Upcoming",
    statusType: "upcoming",
    actionLabel: "Join",
    actionType: "join",
    topics: "Q3 Curriculum Review, Field Visit Scheduling to Amul Anand dairy plant",
    enrolled: 14,
  },
  {
    id: "op-5",
    timeStart: "06:00 PM",
    timeEnd: "07:00 PM",
    dotColor: "bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-100 dark:ring-slate-800",
    programme: "Dairy Supply Chain Management",
    trainer: "Prof. Priya Kamat",
    batch: "DSC-03",
    room: "Virtual Room A",
    mode: "Online",
    status: "Upcoming",
    statusType: "upcoming",
    actionLabel: "Join",
    actionType: "join",
    topics: "Cold Chain logistics and quality control Q&A",
    enrolled: 40,
  },
  {
    id: "op-6",
    timeStart: "07:15 PM",
    timeEnd: "08:15 PM",
    dotColor: "bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-100 dark:ring-slate-800",
    programme: "Agri-Warehouse Auditing",
    trainer: "Dr. Vikram Rao",
    batch: "AWC-02",
    room: "Virtual Room B",
    mode: "Online",
    status: "Upcoming",
    statusType: "upcoming",
    actionLabel: "Join",
    actionType: "join",
    topics: "Inventory management and statutory compliance",
    enrolled: 35,
  },
];

const INITIAL_PROGRAMMES = [
  {
    id: "ph-1",
    title: "Cooperative Management Fundamentals",
    code: "CMF",
    progress: 78,
    attendance: 92,
    assessment: 70,
    enrolled: 47,
    seats: 50,
    status: "Active",
    statusTone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    lead: "Dr. Meera Kulkarni",
    startDate: "15 Aug 2026",
    endDate: "30 Nov 2026",
  },
  {
    id: "ph-2",
    title: "PACS Digital Accounting",
    code: "PDA",
    progress: 45,
    attendance: 88,
    assessment: 40,
    enrolled: 52,
    seats: 60,
    status: "Active",
    statusTone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    lead: "Mr. Suresh Jadhav",
    startDate: "01 Sep 2026",
    endDate: "15 Dec 2026",
  },
  {
    id: "ph-3",
    title: "Dairy Cooperative Operations",
    code: "DCO",
    progress: 62,
    attendance: 95,
    assessment: 68,
    enrolled: 40,
    seats: 50,
    status: "Active",
    statusTone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    lead: "Dr. Anand Deshmukh",
    startDate: "20 Aug 2026",
    endDate: "10 Nov 2026",
  },
  {
    id: "ph-4",
    title: "Cooperative Law & Governance",
    code: "CLG",
    progress: 30,
    attendance: 75,
    assessment: 22,
    enrolled: 28,
    seats: 50,
    status: "At Risk",
    statusTone: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",
    lead: "Prof. Priya Kamat",
    startDate: "10 Sep 2026",
    endDate: "20 Dec 2026",
  },
  {
    id: "ph-5",
    title: "Agri-Warehouse & Cold Storage Management",
    code: "AWC",
    progress: 85,
    attendance: 94,
    assessment: 82,
    enrolled: 35,
    seats: 40,
    status: "Active",
    statusTone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    lead: "Dr. Vikram Rao",
    startDate: "01 Jul 2026",
    endDate: "25 Oct 2026",
  },
  {
    id: "ph-6",
    title: "Women SHG Micro-Finance Leadership",
    code: "WSM",
    progress: 50,
    attendance: 91,
    assessment: 55,
    enrolled: 44,
    seats: 50,
    status: "Active",
    statusTone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    lead: "Dr. Meera Kulkarni",
    startDate: "05 Sep 2026",
    endDate: "10 Jan 2027",
  },
];

const TRAINER_WORKLOAD = [
  {
    id: "tw-1",
    name: "Dr. Meera Kulkarni",
    initials: "MK",
    bg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    classes: 2,
    assessments: 12,
    dept: "Cooperative Management & SHGs",
    experience: "14 Years",
    rating: "4.9/5",
  },
  {
    id: "tw-2",
    name: "Dr. Anand Deshmukh",
    initials: "AD",
    bg: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    classes: 1,
    assessments: 8,
    dept: "Cooperative Law & Policy",
    experience: "11 Years",
    rating: "4.8/5",
  },
  {
    id: "tw-3",
    name: "Mr. Suresh Jadhav",
    initials: "SJ",
    bg: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
    classes: 2,
    assessments: 15,
    dept: "PACS Computerization",
    experience: "9 Years",
    rating: "4.7/5",
  },
  {
    id: "tw-4",
    name: "Prof. Priya Kamat",
    initials: "PK",
    bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
    classes: 1,
    assessments: 6,
    dept: "Dairy & Agri-Marketing",
    experience: "8 Years",
    rating: "4.9/5",
  },
  {
    id: "tw-5",
    name: "Dr. Vikram Rao",
    initials: "VR",
    bg: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
    classes: 1,
    assessments: 4,
    dept: "Warehouse Logistics",
    experience: "12 Years",
    rating: "4.8/5",
  },
];

const INITIAL_NOMINATIONS = [
  {
    id: "nom-1",
    name: "Anjali Rathore",
    initials: "AR",
    bg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
    prog: "CMF",
    progFull: "Cooperative Management Fundamentals",
    date: "10 Oct 2026",
    status: "Pending",
    society: "Kheda District Milk Producers Union",
    district: "Anand, Gujarat",
    regNo: "COOP/GJ/2021/892",
    experience: "3 years as Assistant Secretary",
  },
  {
    id: "nom-2",
    name: "Vikram Solanki",
    initials: "VS",
    bg: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
    prog: "PACS Accounting",
    progFull: "PACS Digital Accounting",
    date: "09 Oct 2026",
    status: "Pending",
    society: "Borsad Primary Agri Credit Society",
    district: "Anand, Gujarat",
    regNo: "PACS/2019/1124",
    experience: "2 years in Bookkeeping",
  },
  {
    id: "nom-3",
    name: "Farida Khatoon",
    initials: "FK",
    bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
    prog: "Dairy Operations",
    progFull: "Dairy Cooperative Operations",
    date: "08 Oct 2026",
    status: "Pending",
    society: "Mehsana Dudhsagar Federation",
    district: "Mehsana, Gujarat",
    regNo: "FED/GJ/1998/431",
    experience: "4 years Milk Collection Supervisor",
  },
  {
    id: "nom-4",
    name: "Deepak Chauhan",
    initials: "DC",
    bg: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
    prog: "Cooperative Law",
    progFull: "Cooperative Law & Governance",
    date: "07 Oct 2026",
    status: "Pending",
    society: "Baroda Central Co-op Bank",
    district: "Vadodara, Gujarat",
    regNo: "DCCB/1982/56",
    experience: "5 years Legal Compliance Officer",
  },
  {
    id: "nom-5",
    name: "Meena Patel",
    initials: "MP",
    bg: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
    prog: "PACS Accounting",
    progFull: "PACS Digital Accounting",
    date: "06 Oct 2026",
    status: "Pending",
    society: "Petlad Taluka Farmers Co-op",
    district: "Anand, Gujarat",
    regNo: "PACS/2022/904",
    experience: "1 year Cashier & Accounts Clerk",
  },
  {
    id: "nom-6",
    name: "Ramesh Sharma",
    initials: "RS",
    bg: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
    prog: "Agri-Warehouse",
    progFull: "Agri-Warehouse & Cold Storage",
    date: "05 Oct 2026",
    status: "Pending",
    society: "Pune Agricultural Produce Co-op",
    district: "Pune, Maharashtra",
    regNo: "MSPC/2015/341",
    experience: "3 years Storage Supervisor",
  },
  {
    id: "nom-7",
    name: "Kavita Lodha",
    initials: "KL",
    bg: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
    prog: "Women SHG",
    progFull: "Women SHG Micro-Finance Leadership",
    date: "04 Oct 2026",
    status: "Pending",
    society: "Maval Mahila Bachat Gat Fed",
    district: "Pune, Maharashtra",
    regNo: "SHG/MH/2020/781",
    experience: "3 years SHG Treasurer",
  },
];

const TRAINEE_ATTENTION_DATA = {
  attendance: [
    {
      id: "ta-1",
      name: "Suresh Jadhav",
      initials: "SJ",
      bg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
      prog: "PACS Accounting",
      metric: "45%",
      notified: false,
      phone: "+91 98220 14820",
      issue: "Absent 4 consecutive sessions without leave application.",
    },
    {
      id: "ta-2",
      name: "Priya Nair",
      initials: "PN",
      bg: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
      prog: "Dairy Operations",
      metric: "52%",
      notified: false,
      phone: "+91 98450 78219",
      issue: "Missed mandatory practical sessions in dairy lab.",
    },
    {
      id: "ta-3",
      name: "Rakesh Yadav",
      initials: "RY",
      bg: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
      prog: "Cooperative Law",
      metric: "58%",
      notified: false,
      phone: "+91 97110 34912",
      issue: "Current attendance is below mandatory 75% examination threshold.",
    },
    {
      id: "ta-4",
      name: "Meena Patel",
      initials: "MP",
      bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
      prog: "CMF",
      metric: "62%",
      notified: false,
      phone: "+91 99230 65123",
      issue: "Unexplained absence in governance modules.",
    },
    {
      id: "ta-5",
      name: "Kiran Bhosale",
      initials: "KB",
      bg: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
      prog: "Dairy Operations",
      metric: "64%",
      notified: false,
      phone: "+91 94220 90145",
      issue: "Attendance lagging in morning cohorts.",
    },
  ],
  documents: [
    {
      id: "td-1",
      name: "Amit Kulkarni",
      initials: "AK",
      bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200",
      prog: "PACS Accounting",
      metric: "Society NOC & Aadhaar",
      notified: false,
      phone: "+91 98231 44512",
      issue: "Society Board Resolution endorsing nomination is missing signature.",
    },
    {
      id: "td-2",
      name: "Sneha Lonkar",
      initials: "SL",
      bg: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
      prog: "Dairy Operations",
      metric: "10th Marks Memo",
      notified: false,
      phone: "+91 97665 12890",
      issue: "High school educational certificate copy is illegible.",
    },
    {
      id: "td-3",
      name: "Rohit Gupta",
      initials: "RG",
      bg: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
      prog: "Cooperative Law",
      metric: "PACS Membership Cert",
      notified: false,
      phone: "+91 98901 67234",
      issue: "Official society membership card copy required for state subsidy.",
    },
    {
      id: "td-4",
      name: "Pooja Deshmukh",
      initials: "PD",
      bg: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-200",
      prog: "Dairy Operations",
      metric: "Medical Fitness Cert",
      notified: false,
      phone: "+91 94220 56789",
      issue: "Mandatory health clearance for lab access is pending submission.",
    },
    {
      id: "td-5",
      name: "Vikram Pawar",
      initials: "VP",
      bg: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200",
      prog: "CMF",
      metric: "Sponsorship Ltr",
      notified: false,
      phone: "+91 99234 11223",
      issue: "Official sponsorship letter from parent society is missing seal.",
    },
  ],
  assessments: [
    {
      id: "as-1",
      name: "Dinesh Giri",
      initials: "DG",
      bg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
      prog: "Cooperative Law",
      metric: "28%",
      notified: false,
      phone: "+91 98223 99801",
      issue: "Failed Module 1 Statutory Compliance Quiz (Scored 28%).",
    },
    {
      id: "as-2",
      name: "Sunita Naik",
      initials: "SN",
      bg: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200",
      prog: "PACS Accounting",
      metric: "32%",
      notified: false,
      phone: "+91 98451 22340",
      issue: "Practical trial balance reconciliation test errors (Scored 32%).",
    },
    {
      id: "as-3",
      name: "Harish Sawant",
      initials: "HS",
      bg: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
      prog: "Dairy Operations",
      metric: "35%",
      notified: false,
      phone: "+91 97300 88712",
      issue: "Cold chain standard operating procedures assignment unsubmitted.",
    },
    {
      id: "as-4",
      name: "Pooja Bhende",
      initials: "PB",
      bg: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
      prog: "CMF",
      metric: "38%",
      notified: false,
      phone: "+91 99750 33418",
      issue: "Cooperative Economics assessment requires remedial mentoring.",
    },
    {
      id: "as-5",
      name: "Ramesh Shinde",
      initials: "RS",
      bg: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200",
      prog: "PACS Accounting",
      metric: "41%",
      notified: false,
      phone: "+91 98877 66554",
      issue: "Repeated errors in calculating interest margins in mock exam.",
    },
  ],
};

const FULL_TIMETABLE = [
  {
    day: "Monday",
    slots: [
      { time: "09:00 - 11:00 AM", prog: "Cooperative Management Fundamentals", trainer: "Dr. Meera Kulkarni", room: "Room 201", type: "Lecture" },
      { time: "11:30 - 01:00 PM", prog: "PACS Digital Accounting", trainer: "Mr. Suresh Jadhav", room: "Lab 1", type: "Practical" },
      { time: "02:00 - 04:00 PM", prog: "Dairy Operations: Milk Quality Testing", trainer: "Dr. Anand Deshmukh", room: "Dairy Lab", type: "Hands-on" },
    ],
  },
  {
    day: "Tuesday (Today)",
    slots: [
      { time: "09:00 - 11:00 AM", prog: "Cooperative Management Fundamentals", trainer: "Dr. Meera Kulkarni", room: "Room 201", type: "Ongoing" },
      { time: "11:30 - 12:30 PM", prog: "PACS Digital Accounting (Practical)", trainer: "Mr. Suresh Jadhav", room: "Lab 1", type: "Upcoming" },
      { time: "02:00 - 04:00 PM", prog: "Cooperative Law & Governance", trainer: "Dr. Anand Deshmukh", room: "Room 203", type: "Upcoming" },
      { time: "04:30 - 05:30 PM", prog: "Trainer Coordination Meeting", trainer: "Institution Admin", room: "Online / Meet", type: "Meeting" },
    ],
  },
  {
    day: "Wednesday",
    slots: [
      { time: "09:30 - 11:30 AM", prog: "Agri-Warehouse Auditing", trainer: "Dr. Vikram Rao", room: "Room 104", type: "Workshop" },
      { time: "01:30 - 03:30 PM", prog: "PACS Computerization Software Training", trainer: "Mr. Suresh Jadhav", room: "Lab 2", type: "Practical" },
      { time: "04:00 - 05:30 PM", prog: "Cooperative Society Audit Case Studies", trainer: "Prof. Priya Kamat", room: "Room 201", type: "Seminar" },
    ],
  },
  {
    day: "Thursday",
    slots: [
      { time: "09:00 - 11:00 AM", prog: "Women SHG Financial Inclusion", trainer: "Dr. Meera Kulkarni", room: "Room 202", type: "Lecture" },
      { time: "11:30 - 02:00 PM", prog: "Field Study: Kheda Milk Union Visit", trainer: "All Faculty", room: "Off-Campus", type: "Field Visit" },
    ],
  },
  {
    day: "Friday",
    slots: [
      { time: "09:00 - 11:00 AM", prog: "Statutory Audit & Balance Sheet Prep", trainer: "Mr. Suresh Jadhav", room: "Lab 1", type: "Practical" },
      { time: "02:00 - 04:00 PM", prog: "Weekly Quiz & Knowledge Check", trainer: "Exam Controller", room: "Exam Hall A", type: "Assessment" },
    ],
  },
  {
    day: "Saturday",
    slots: [
      { time: "10:00 - 12:30 PM", prog: "Guest Lecture: Apex Cooperative Strategy", trainer: "NCCT Directorate", room: "Auditorium", type: "Guest Lecture" },
    ],
  },
];

export default function InstitutionDashboardPage() {
  // State for interactive features
  const [operations, setOperations] = useState(INITIAL_OPERATIONS);
  const [programmes, setProgrammes] = useState(INITIAL_PROGRAMMES);
  const [nominations, setNominations] = useState(INITIAL_NOMINATIONS);
  const [attentionData, setAttentionData] = useState(TRAINEE_ATTENTION_DATA);
  const [activeAttentionTab, setActiveAttentionTab] = useState<"attendance" | "documents" | "assessments">("attendance");
  const [attendancePeriod, setAttendancePeriod] = useState<"Today" | "This Week" | "This Month" | "This Quarter">("This Month");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Modals
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);
  const [reviewNominationModal, setReviewNominationModal] = useState<(typeof INITIAL_NOMINATIONS)[number] | null>(null);
  const [sessionActionModal, setSessionActionModal] = useState<(typeof INITIAL_OPERATIONS)[number] | null>(null);
  const [programmesModalOpen, setProgrammesModalOpen] = useState(false);
  const [trainersModalOpen, setTrainersModalOpen] = useState(false);
  const [certificatesModalOpen, setCertificatesModalOpen] = useState(false);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [liveClassActive, setLiveClassActive] = useState(false);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState("Tuesday (Today)");

  // Notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  // Calculations for Attendance overview based on period
  const attendanceMetrics = useMemo(() => {
    switch (attendancePeriod) {
      case "Today":
        return { avg: 94, present: 94, absent: 4, onLeave: 1, notMarked: 1 };
      case "This Week":
        return { avg: 93, present: 93, absent: 4, onLeave: 2, notMarked: 1 };
      case "This Quarter":
        return { avg: 90, present: 90, absent: 6, onLeave: 3, notMarked: 1 };
      case "This Month":
      default:
        return { avg: 92, present: 92, absent: 5, onLeave: 2, notMarked: 1 };
    }
  }, [attendancePeriod]);

  // Handle Nomination Review (Approve / Reject)
  const handleApproveNomination = (id: string, name: string) => {
    setNominations((prev) =>
      prev.map((nom) => (nom.id === id ? { ...nom, status: "Approved" } : nom))
    );
    setReviewNominationModal(null);
    showToast(`✅ Successfully approved & enrolled ${name} into cohort!`);
  };

  const handleRejectNomination = (id: string, name: string) => {
    setNominations((prev) =>
      prev.map((nom) => (nom.id === id ? { ...nom, status: "Rejected" } : nom))
    );
    setReviewNominationModal(null);
    showToast(`❌ Nomination rejected for ${name}. Notification sent to sponsoring society.`);
  };

  // Handle Trainee Attention notification action
  const handleNotifyTrainee = (category: "attendance" | "documents" | "assessments", id: string, name: string, prog: string) => {
    setAttentionData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === id ? { ...item, notified: true } : item
      ),
    }));

    if (category === "attendance") {
      showToast(`📲 Warning SMS & WhatsApp alert sent to ${name} (${prog}) for low attendance!`);
    } else if (category === "documents") {
      showToast(`📄 Document re-upload link dispatched to ${name} (${prog})!`);
    } else {
      showToast(`📚 Remedial tutoring request scheduled with course mentor for ${name} (${prog})!`);
    }
  };

  // Handle Session Action (Start / Join / View)
  const handleSessionAction = (item: (typeof INITIAL_OPERATIONS)[number]) => {
    if (item.actionType === "start") {
      setLiveClassActive(true);
      setSessionActionModal(item);
    } else if (item.actionType === "join") {
      setSessionActionModal(item);
    } else {
      setSessionActionModal(item);
    }
  };

  // Issue all certificates bulk action
  const handleBulkIssueCertificates = () => {
    showToast("🎉 Digital Signatures verified: 27 Certificates issued & pushed to Trainee Skill Passports!");
    setCertificatesModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-[1600px] mx-auto pb-24 text-foreground">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-3 bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl border border-border animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="size-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-muted-foreground hover:text-background transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50 via-red-50 to-orange-50/60 dark:from-red-950/20 dark:via-background dark:to-orange-950/10 border border-red-100 dark:border-border p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between min-h-[190px] shadow-xs">
        
        {/* Campus Building Illustration Center-Right */}
        <div className="absolute right-36 top-0 bottom-0 w-[420px] pointer-events-none hidden lg:block overflow-hidden">
          <img
            src="/vamnicom-campus.jpg"
            alt="VAMNICOM Campus Architecture"
            className="w-full h-full object-contain object-right opacity-90 drop-shadow-sm"
          />
        </div>

        {/* Left Information */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-foreground tracking-tight">
            Good afternoon!
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mt-0.5 mb-2">
            VAMNICOM, Pune
          </h2>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-lg">
            Manage training programmes, trainees, nominations and institutional operations to strengthen the cooperative movement.
          </p>
        </div>

        {/* Right Quote Card */}
        <div className="relative z-10 hidden xl:flex items-start gap-3 bg-background/95 dark:bg-card/90 backdrop-blur-md p-4 rounded-xl border border-border/80 shadow-xs max-w-[290px] mt-4 lg:mt-0">
          <span className="text-primary text-4xl font-serif font-black leading-none -mt-1 select-none">
            “
          </span>
          <p className="text-xs md:text-sm font-semibold italic text-foreground leading-snug">
            Skilled cooperatives build stronger communities.
          </p>
        </div>
      </div>

      {/* 2. KPI CARDS (5 CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.id}
              onClick={() => {
                if (kpi.id === "programmes") setProgrammesModalOpen(true);
                else if (kpi.id === "nominations") showToast("Opening Nominations Manager...");
                else if (kpi.id === "certificates") setCertificatesModalOpen(true);
                else if (kpi.id === "attendance") showToast("Attendance Rate is at 92% across all 4 cohorts.");
                else showToast(`Active Enrolment: ${kpi.value} trainees in good standing.`);
              }}
              className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group rounded-2xl border border-border/70 bg-card"
            >
              <CardContent className="p-4 flex items-center justify-between relative overflow-hidden">
                <div className="z-10">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={cn("p-2 rounded-xl shrink-0", kpi.bg)}>
                      <Icon className="size-4.5" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground block truncate">
                    {kpi.label}
                  </span>
                  <div className="text-2xl md:text-3xl font-bold font-heading text-foreground tracking-tight mt-0.5">
                    {kpi.value}
                  </div>
                  <div className="text-[11px] font-semibold mt-1 flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    {kpi.trend}
                  </div>
                </div>
                <ChevronRight className="size-4.5 text-primary opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-1 absolute right-3.5" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. MIDDLE SECTION: TWO MAIN COLUMNS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Operations & Programme Health (7 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Card A: Today's Operations */}
          <Card className="rounded-2xl shadow-xs border-border/80 bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarIcon className="size-4.5 text-primary" /> Today&apos;s Operations
              </CardTitle>
              <Button
                variant="link"
                className="text-xs font-bold text-primary p-0 h-auto hover:underline"
                onClick={() => setTimetableModalOpen(true)}
              >
                View Full Timetable
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
                  <tr>
                    <th className="py-2.5 px-4 font-heading">Time</th>
                    <th className="py-2.5 px-4 font-heading">Programme / Session</th>
                    <th className="py-2.5 px-4 font-heading">Trainer</th>
                    <th className="py-2.5 px-4 font-heading">Batch & Room</th>
                    <th className="py-2.5 px-4 font-heading">Mode</th>
                    <th className="py-2.5 px-4 font-heading">Status</th>
                    <th className="py-2.5 px-4 font-heading text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {operations.map((op) => (
                    <tr key={op.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={cn("size-2 rounded-full shrink-0", op.dotColor)} />
                          <div className="font-semibold text-foreground">
                            <div>{op.timeStart}</div>
                            <div className="text-[10px] text-muted-foreground">{op.timeEnd}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground max-w-[190px]">
                        <span className="line-clamp-1">{op.programme}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {op.trainer}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-foreground">{op.batch}</span>
                        <span className="block text-[10px] text-muted-foreground">{op.room}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5",
                            op.mode === "Online"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          )}
                        >
                          {op.mode}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 border-none",
                            op.status === "Ongoing"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          )}
                        >
                          {op.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={op.actionType === "start" ? "default" : "outline"}
                          className={cn(
                            "h-7 text-xs font-semibold px-3 rounded-lg shadow-2xs transition-all",
                            op.actionType === "start"
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "border-border text-foreground hover:bg-muted"
                          )}
                          onClick={() => handleSessionAction(op)}
                        >
                          {op.actionLabel}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Card B: Programme Health */}
          <Card className="rounded-2xl shadow-xs border-border/80 bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="size-4.5 text-primary" /> Programme Health
              </CardTitle>
              <Button
                variant="link"
                className="text-xs font-bold text-primary p-0 h-auto hover:underline"
                onClick={() => setProgrammesModalOpen(true)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
                  <tr>
                    <th className="py-2.5 px-4 font-heading">Programme</th>
                    <th className="py-2.5 px-4 font-heading w-[130px]">Progress</th>
                    <th className="py-2.5 px-4 font-heading w-[130px]">Attendance</th>
                    <th className="py-2.5 px-4 font-heading w-[130px]">Assessment</th>
                    <th className="py-2.5 px-4 font-heading text-center">Trainees / Seats</th>
                    <th className="py-2.5 px-4 font-heading text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {programmes.map((prog) => (
                    <tr
                      key={prog.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        showToast(`Cohort: ${prog.title} | Enrolled: ${prog.enrolled}/${prog.seats} | Trainer: ${prog.lead}`);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {prog.title}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all"
                              style={{ width: `${prog.progress}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-foreground shrink-0 w-8 text-right">
                            {prog.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${prog.attendance}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-foreground shrink-0 w-8 text-right">
                            {prog.attendance}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${prog.assessment}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-foreground shrink-0 w-8 text-right">
                            {prog.assessment}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-foreground whitespace-nowrap">
                        <span className="font-bold">{prog.enrolled}</span> / {prog.seats}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-bold px-2 py-0.5", prog.statusTone)}
                        >
                          {prog.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Attendance Overview, Workload, Certificates & Assessments (4 Cols) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Card C: Attendance Overview */}
          <Card className="rounded-2xl shadow-xs border-border/80 bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="size-4.5 text-primary" /> Attendance Overview
              </CardTitle>
              <div className="relative">
                <select
                  value={attendancePeriod}
                  onChange={(e) => setAttendancePeriod(e.target.value as "Today" | "This Week" | "This Month" | "This Quarter")}
                  aria-label="Attendance period"
                  className="text-xs font-semibold bg-muted/50 border border-border/80 rounded-lg px-2.5 py-1 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="This Quarter">This Quarter</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-5 px-5 flex flex-col sm:flex-row items-center justify-between gap-6">
              
              {/* Donut Chart SVG */}
              <div className="relative size-36 shrink-0 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 140 140">
                  {/* Background track */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="14"
                    className="text-muted/40"
                  />
                  {/* Present Segment (Teal/Green) - ~92% */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="transparent"
                    stroke="#059669"
                    strokeWidth="14"
                    strokeDasharray="300 327"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                  {/* Absent Segment (Red) - ~5% */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="14"
                    strokeDasharray="16 327"
                    strokeDashoffset="-302"
                    strokeLinecap="round"
                  />
                  {/* On Leave Segment (Amber) - ~2% */}
                  <circle
                    cx="70"
                    cy="70"
                    r="52"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray="8 327"
                    strokeDashoffset="-319"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black font-heading text-foreground">
                    {attendanceMetrics.avg}%
                  </span>
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Average Attendance
                  </span>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div className="space-y-2 text-xs w-full max-w-[170px]">
                <div
                  className="flex items-center justify-between p-1 rounded hover:bg-muted/40 cursor-pointer"
                  onClick={() => showToast(`Present Rate: ${attendanceMetrics.present}% across all batches.`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-600" />
                    <span className="text-muted-foreground font-medium">Present</span>
                  </div>
                  <span className="font-bold text-foreground">{attendanceMetrics.present}%</span>
                </div>

                <div
                  className="flex items-center justify-between p-1 rounded hover:bg-muted/40 cursor-pointer"
                  onClick={() => showToast(`Absent: ${attendanceMetrics.absent}% (7 trainees flagged today)`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-red-500" />
                    <span className="text-muted-foreground font-medium">Absent</span>
                  </div>
                  <span className="font-bold text-foreground">{attendanceMetrics.absent}%</span>
                </div>

                <div
                  className="flex items-center justify-between p-1 rounded hover:bg-muted/40 cursor-pointer"
                  onClick={() => showToast(`On Leave: ${attendanceMetrics.onLeave}% approved leaves.`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground font-medium">On Leave</span>
                  </div>
                  <span className="font-bold text-foreground">{attendanceMetrics.onLeave}%</span>
                </div>

                <div
                  className="flex items-center justify-between p-1 rounded hover:bg-muted/40 cursor-pointer"
                  onClick={() => showToast("Not Marked: 1% pending biometric sync.")}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-slate-400" />
                    <span className="text-muted-foreground font-medium">Not Marked</span>
                  </div>
                  <span className="font-bold text-foreground">{attendanceMetrics.notMarked}%</span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Card D: Trainer Workload */}
          <Card className="rounded-2xl shadow-xs border-border/80 bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="size-4.5 text-primary" /> Trainer Workload
              </CardTitle>
              <Button
                variant="link"
                className="text-xs font-bold text-primary p-0 h-auto hover:underline"
                onClick={() => setTrainersModalOpen(true)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
                  <tr>
                    <th className="py-2.5 px-4 font-heading">Trainer</th>
                    <th className="py-2.5 px-4 font-heading text-center">Today&apos;s Classes</th>
                    <th className="py-2.5 px-4 font-heading text-center">Pending Assessments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {TRAINER_WORKLOAD.slice(0, 4).map((tr) => (
                    <tr
                      key={tr.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        showToast(`Trainer: ${tr.name} (${tr.dept}) | Workload: ${tr.classes} classes, ${tr.assessments} assessments`);
                      }}
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("size-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0", tr.bg)}>
                            {tr.initials}
                          </div>
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                            {tr.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-foreground">
                        {tr.classes}
                      </td>
                      <td className="py-2.5 px-4 text-center font-bold text-foreground">
                        {tr.assessments}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Card E: Certificates & Assessments */}
          <Card className="rounded-2xl shadow-xs border-border/80 bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="size-4.5 text-primary" /> Certificates & Assessments
              </CardTitle>
              <Button
                variant="link"
                className="text-xs font-bold text-primary p-0 h-auto hover:underline"
                onClick={() => setCertificatesModalOpen(true)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="pt-4 pb-5 px-5 space-y-4">
              
              {/* Two mini stat cards */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setGradingModalOpen(true)}
                  className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <FileText className="size-4 text-amber-600 dark:text-amber-400" />
                    <ChevronRight className="size-3.5 text-amber-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-xl font-bold font-heading text-foreground mt-1">18</div>
                  <div className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">
                    Assessments Pending Grading
                  </div>
                </div>

                <div
                  onClick={() => setCertificatesModalOpen(true)}
                  className="p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <ChevronRight className="size-3.5 text-emerald-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-xl font-bold font-heading text-foreground mt-1">27</div>
                  <div className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">
                    Certificates To Be Issued
                  </div>
                </div>
              </div>

              {/* Completion Trend Line Chart */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-foreground">Completion Trend</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">+34% vs last quarter</span>
                </div>
                
                <div className="w-full h-28 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 320 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-axis Grid Lines */}
                    {[80, 55, 30, 10].map((y) => (
                      <line
                        key={y}
                        x1="30"
                        y1={y}
                        x2="310"
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="2 2"
                        className="text-border/60"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Y-Axis Labels */}
                    <text x="5" y="83" className="text-[8px] fill-muted-foreground font-semibold">25</text>
                    <text x="5" y="58" className="text-[8px] fill-muted-foreground font-semibold">50</text>
                    <text x="5" y="33" className="text-[8px] fill-muted-foreground font-semibold">75</text>
                    <text x="0" y="13" className="text-[8px] fill-muted-foreground font-semibold">100</text>

                    {/* Shaded Area under line */}
                    <polygon
                      points="40,82 105,62 170,58 235,38 300,20 300,90 40,90"
                      fill="url(#trendGradient)"
                    />

                    {/* Trend Line */}
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="40,82 105,62 170,58 235,38 300,20"
                    />

                    {/* Point Dots */}
                    {[
                      { x: 40, y: 82, val: 25 },
                      { x: 105, y: 62, val: 48 },
                      { x: 170, y: 58, val: 52 },
                      { x: 235, y: 38, val: 74 },
                      { x: 300, y: 20, val: 91 },
                    ].map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        className="fill-background stroke-red-500 stroke-2 hover:r-5 cursor-pointer transition-all"
                        onClick={() => showToast(`Month Score: ${pt.val}% completion rate`)}
                      />
                    ))}
                  </svg>

                  {/* X-axis Month Labels */}
                  <div className="flex justify-between pl-8 pr-1 text-[9px] font-semibold text-muted-foreground mt-1">
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {/* 4. BOTTOM SECTION: PENDING NOMINATIONS & TRAINEE ATTENTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Card F: Pending Nominations (5 Cols) */}
        <Card className="xl:col-span-6 rounded-2xl shadow-xs border-border/80 bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="size-4.5 text-primary" /> Pending Nominations
            </CardTitle>
            <Button
              variant="link"
              className="text-xs font-bold text-primary p-0 h-auto hover:underline"
              onClick={() => {
                const firstPending = nominations.find((n) => n.status === "Pending") || nominations[0];
                setReviewNominationModal(firstPending);
              }}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
                <tr>
                  <th className="py-2.5 px-4 font-heading">Trainee</th>
                  <th className="py-2.5 px-4 font-heading">Programme</th>
                  <th className="py-2.5 px-4 font-heading">Submitted On</th>
                  <th className="py-2.5 px-4 font-heading">Status</th>
                  <th className="py-2.5 px-4 font-heading text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {nominations.slice(0, 5).map((nom) => (
                  <tr key={nom.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("size-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0", nom.bg)}>
                          {nom.initials}
                        </div>
                        <span className="font-semibold text-foreground whitespace-nowrap">
                          {nom.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                      {nom.prog}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-[11px]">
                      {nom.date}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5",
                          nom.status === "Pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                            : nom.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                        )}
                      >
                        {nom.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-semibold px-3 text-primary border-primary/30 hover:bg-primary hover:text-white transition-colors rounded-lg"
                        onClick={() => setReviewNominationModal(nom)}
                      >
                        {nom.status === "Pending" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Card G: Trainee Attention (6 Cols) */}
        <Card className="xl:col-span-6 rounded-2xl shadow-xs border-border/80 bg-card overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="size-4.5 text-primary" /> Trainee Attention
            </CardTitle>
            <Button
              variant="link"
              className="text-xs font-bold text-primary p-0 h-auto hover:underline"
              onClick={() => showToast("Opening At-Risk Trainee Cohort Roster...")}
            >
              View All
            </Button>
          </CardHeader>
          
          {/* Sub-tabs with counts */}
          <div className="px-5 pt-3 pb-1 border-b border-border/30">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveAttentionTab("attendance")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer",
                  activeAttentionTab === "attendance"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Low Attendance (5)
              </button>
              <button
                onClick={() => setActiveAttentionTab("documents")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer",
                  activeAttentionTab === "documents"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Missing Documents (3)
              </button>
              <button
                onClick={() => setActiveAttentionTab("assessments")}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer",
                  activeAttentionTab === "assessments"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Low Assessment (4)
              </button>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/50">
                <tr>
                  <th className="py-2.5 px-4 font-heading">Trainee</th>
                  <th className="py-2.5 px-4 font-heading">Programme</th>
                  <th className="py-2.5 px-4 font-heading">
                    {activeAttentionTab === "attendance"
                      ? "Attendance"
                      : activeAttentionTab === "documents"
                      ? "Pending Document"
                      : "Assessment Score"}
                  </th>
                  <th className="py-2.5 px-4 font-heading text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {attentionData[activeAttentionTab].map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("size-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0", item.bg)}>
                          {item.initials}
                        </div>
                        <span className="font-semibold text-foreground whitespace-nowrap">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                      {item.prog}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={cn(
                        "font-bold text-xs",
                        activeAttentionTab === "attendance" || activeAttentionTab === "assessments"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400 font-medium"
                      )}>
                        {item.metric}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <Button
                        size="sm"
                        variant={item.notified ? "secondary" : "outline"}
                        disabled={item.notified}
                        className={cn(
                          "h-7 text-xs font-semibold px-3 rounded-lg transition-colors",
                          item.notified
                            ? "bg-muted text-muted-foreground"
                            : "border-primary/30 text-primary hover:bg-primary hover:text-white"
                        )}
                        onClick={() => handleNotifyTrainee(activeAttentionTab, item.id, item.name, item.prog)}
                      >
                        {item.notified ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Check className="size-3" /> Notified
                          </span>
                        ) : activeAttentionTab === "attendance" ? (
                          "Notify"
                        ) : activeAttentionTab === "documents" ? (
                          "Request Docs"
                        ) : (
                          "Mentoring"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>

      {/* 5. SYSTEM SYNC FOOTER STRIP */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
          </span>
          <span className="font-medium text-foreground">System Sync</span>
          <span>&middot;</span>
          <span>Last synced 5 minutes ago</span>
          <button
            onClick={() => showToast("Cloud Sync verified: Biometric logs & attendance buffers up-to-date.")}
            className="hover:text-foreground transition-colors p-1"
            title="Force refresh sync"
          >
            <RefreshCw className="size-3" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="size-4" />
          <span>All systems operational</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* INTERACTIVE MODALS & DIALOGS */}
      {/* ============================================================ */}

      {/* MODAL 1: FULL TIMETABLE MODAL */}
      {timetableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-5 text-primary" />
                <h3 className="font-heading text-lg font-bold">VAMNICOM Weekly Timetable</h3>
              </div>
              <button
                onClick={() => setTimetableModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Day Selector */}
            <div className="p-4 border-b border-border bg-muted/20 flex gap-2 overflow-x-auto">
              {FULL_TIMETABLE.map((t) => (
                <button
                  key={t.day}
                  onClick={() => setSelectedTimetableDay(t.day)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors",
                    selectedTimetableDay === t.day
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted/80 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.day}
                </button>
              ))}
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {FULL_TIMETABLE.find((t) => t.day === selectedTimetableDay)?.slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{slot.time}</span>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {slot.type}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm text-foreground mt-0.5">{slot.prog}</h4>
                    <p className="text-xs text-muted-foreground">
                      Trainer: <span className="font-semibold text-foreground">{slot.trainer}</span> &middot; Location: {slot.room}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold"
                    onClick={() => {
                      showToast(`Viewing session: ${slot.prog} (${slot.room})`);
                      setTimetableModalOpen(false);
                    }}
                  >
                    View Roster
                  </Button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex justify-between items-center bg-muted/10">
              <span className="text-xs text-muted-foreground">Term: Autumn 2026 Cohorts</span>
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  showToast("Timetable PDF exported for VAMNICOM faculty!");
                  setTimetableModalOpen(false);
                }}
              >
                Download PDF Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW NOMINATION MODAL */}
      {reviewNominationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h3 className="font-heading text-lg font-bold">Review Trainee Nomination</h3>
              </div>
              <button
                onClick={() => setReviewNominationModal(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              
              {/* Candidate Info */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-muted/20 border border-border">
                <div className={cn("size-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0", reviewNominationModal.bg)}>
                  {reviewNominationModal.initials}
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">{reviewNominationModal.name}</h4>
                  <p className="text-xs text-muted-foreground">{reviewNominationModal.experience}</p>
                </div>
                <Badge className="ml-auto" variant={reviewNominationModal.status === "Approved" ? "default" : "secondary"}>
                  {reviewNominationModal.status}
                </Badge>
              </div>

              {/* Nomination Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium block">Nominated Programme</span>
                  <span className="font-bold text-foreground text-sm">{reviewNominationModal.progFull}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Submitted Date</span>
                  <span className="font-bold text-foreground text-sm">{reviewNominationModal.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Sponsoring Society</span>
                  <span className="font-bold text-foreground">{reviewNominationModal.society}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">District / State</span>
                  <span className="font-bold text-foreground">{reviewNominationModal.district}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Society Registration No.</span>
                  <span className="font-bold text-foreground">{reviewNominationModal.regNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block">Verification Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Society Endorsement Verified
                  </span>
                </div>
              </div>

              {/* Attached Documents */}
              <div>
                <h5 className="font-bold text-xs text-foreground uppercase tracking-wider mb-2">
                  Attached Verification Documents
                </h5>
                <div className="space-y-2">
                  {[
                    { title: "Cooperative Society Board Resolution (Resolution #2026/89)", size: "1.4 MB PDF" },
                    { title: "Candidate Aadhaar & Employment Service Record", size: "820 KB PDF" },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="size-4 text-primary" />
                        <span className="font-medium text-foreground">{doc.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{doc.size}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10 gap-3">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                onClick={() => handleRejectNomination(reviewNominationModal.id, reviewNominationModal.name)}
              >
                Reject Nomination
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    showToast(`Requested additional Society NOC for ${reviewNominationModal.name}`);
                    setReviewNominationModal(null);
                  }}
                >
                  Request Clarification
                </Button>
                <Button
                  variant="default"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  onClick={() => handleApproveNomination(reviewNominationModal.id, reviewNominationModal.name)}
                >
                  Approve & Enrol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SESSION ACTION / LIVE CLASS MODAL */}
      {sessionActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                {sessionActionModal.actionType === "start" ? (
                  <Play className="size-5 text-red-600 fill-red-600" />
                ) : sessionActionModal.actionType === "join" ? (
                  <Video className="size-5 text-purple-600" />
                ) : (
                  <Eye className="size-5 text-primary" />
                )}
                <h3 className="font-heading text-lg font-bold">
                  {sessionActionModal.actionType === "start"
                    ? "Start Classroom Session"
                    : sessionActionModal.actionType === "join"
                    ? "Join Virtual Classroom"
                    : "Session Details"}
                </h3>
              </div>
              <button
                onClick={() => setSessionActionModal(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Programme</span>
                <h4 className="text-base font-bold text-foreground mt-0.5">{sessionActionModal.programme}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/20 border border-border">
                <div>
                  <span className="text-muted-foreground block">Trainer</span>
                  <span className="font-bold text-foreground text-sm">{sessionActionModal.trainer}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Batch & Location</span>
                  <span className="font-bold text-foreground text-sm">{sessionActionModal.batch} &middot; {sessionActionModal.room}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Scheduled Time</span>
                  <span className="font-bold text-foreground">{sessionActionModal.timeStart} - {sessionActionModal.timeEnd}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Enrolled Trainees</span>
                  <span className="font-bold text-foreground">{sessionActionModal.enrolled} Active Trainees</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold block mb-1">Session Agenda & Topics</span>
                <p className="p-3 rounded-lg border border-border bg-background text-foreground leading-relaxed">
                  {sessionActionModal.topics}
                </p>
              </div>

              {sessionActionModal.actionType === "start" && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 dark:bg-red-950/20 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-red-600 font-bold">
                    <QrCode className="size-5" />
                    <span>Dynamic Attendance QR Ready</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Starting this session will broadcast the live attendance QR to Lab 1 monitors and notify trainees via the mobile app.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/10">
              <Button variant="outline" className="text-xs" onClick={() => setSessionActionModal(null)}>
                Cancel
              </Button>
              <Button
                variant={sessionActionModal.actionType === "start" ? "default" : "secondary"}
                className={cn(
                  "text-xs font-bold",
                  sessionActionModal.actionType === "start" && "bg-red-600 hover:bg-red-700 text-white"
                )}
                onClick={() => {
                  showToast(
                    sessionActionModal.actionType === "start"
                      ? `Session started! Attendance QR broadcasting in ${sessionActionModal.room}`
                      : `Connecting to ${sessionActionModal.programme} meeting room...`
                  );
                  setSessionActionModal(null);
                }}
              >
                {sessionActionModal.actionType === "start"
                  ? "Launch Session Now"
                  : sessionActionModal.actionType === "join"
                  ? "Enter Meeting Room"
                  : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PROGRAMMES DIRECTORY MODAL */}
      {programmesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <h3 className="font-heading text-lg font-bold">All Institutional Programmes (6 Active)</h3>
              </div>
              <button
                onClick={() => setProgrammesModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programmes.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] font-bold", p.statusTone)}>
                          {p.status}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">Code: {p.code}</span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{p.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Faculty Lead: {p.lead}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                        <div className="p-2 rounded bg-background border border-border">
                          <span className="text-[10px] text-muted-foreground block">Enrolment</span>
                          <span className="font-bold text-foreground">{p.enrolled}/{p.seats}</span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border">
                          <span className="text-[10px] text-muted-foreground block">Attendance</span>
                          <span className="font-bold text-emerald-600">{p.attendance}%</span>
                        </div>
                        <div className="p-2 rounded bg-background border border-border">
                          <span className="text-[10px] text-muted-foreground block">Assessment</span>
                          <span className="font-bold text-amber-600">{p.assessment}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">{p.startDate} - {p.endDate}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          showToast(`Viewing complete syllabus & cohort roster for ${p.title}`);
                          setProgrammesModalOpen(false);
                        }}
                      >
                        Cohort Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-between items-center bg-muted/10">
              <span className="text-xs text-muted-foreground">Institute: VAMNICOM Pune</span>
              <Button
                size="sm"
                onClick={() => {
                  showToast("New Programme Creation wizard opened!");
                  setProgrammesModalOpen(false);
                }}
              >
                + Create New Programme
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: TRAINERS DIRECTORY MODAL */}
      {trainersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <h3 className="font-heading text-lg font-bold">Faculty & Trainer Workload Roster</h3>
              </div>
              <button
                onClick={() => setTrainersModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {TRAINER_WORKLOAD.map((tr) => (
                <div
                  key={tr.id}
                  className="p-3.5 rounded-xl border border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0", tr.bg)}>
                      {tr.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{tr.name}</h4>
                      <p className="text-xs text-muted-foreground">{tr.dept} &middot; {tr.experience} Exp</p>
                      <span className="text-[10px] text-amber-600 font-semibold">Student Rating: {tr.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center px-3 py-1 bg-background rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground block">Today&apos;s Sessions</span>
                      <span className="font-bold text-foreground text-sm">{tr.classes}</span>
                    </div>
                    <div className="text-center px-3 py-1 bg-background rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground block">Pending Grading</span>
                      <span className="font-bold text-red-600 text-sm">{tr.assessments}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-semibold"
                      onClick={() => {
                        showToast(`Viewing teaching allocation for ${tr.name}`);
                        setTrainersModalOpen(false);
                      }}
                    >
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex justify-end bg-muted/10">
              <Button size="sm" onClick={() => setTrainersModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CERTIFICATES ISSUANCE MODAL */}
      {certificatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Award className="size-5 text-emerald-600" />
                <h3 className="font-heading text-lg font-bold">Issue Verified Certificates (27 Pending)</h3>
              </div>
              <button
                onClick={() => setCertificatesModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 text-xs text-muted-foreground">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                  National Skill Passport Compliance
                </p>
                All 27 trainees have completed minimum 75% attendance and passed all required summative assessments. Certificates will be cryptographically signed by VAMNICOM & NCCT.
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: "Ravindra Suresh Patil", prog: "Cooperative Management Fundamentals", grade: "Grade A (91%)" },
                  { name: "Kiran Deshmukh", prog: "PACS Digital Accounting", grade: "Grade A (88%)" },
                  { name: "Sunita Sharma", prog: "Dairy Cooperative Operations", grade: "Grade B+ (84%)" },
                  { name: "Gopal Krishna Rao", prog: "Cooperative Management Fundamentals", grade: "Grade A+ (95%)" },
                  { name: "Alka Varma", prog: "Women SHG Leadership", grade: "Grade A (89%)" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-background flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-foreground">{item.name}</h5>
                      <span className="text-muted-foreground text-[11px]">{item.prog}</span>
                    </div>
                    <Badge variant="secondary" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                      {item.grade}
                    </Badge>
                  </div>
                ))}
                <p className="text-center text-[11px] text-muted-foreground pt-1">+ 22 more verified trainees ready for issuance</p>
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
              <span className="text-xs text-muted-foreground">27 Cryptographic Credentials Ready</span>
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                onClick={handleBulkIssueCertificates}
              >
                Issue All 27 Certificates Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: GRADING QUEUE MODAL */}
      {gradingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-amber-600" />
                <h3 className="font-heading text-lg font-bold">Assessments Pending Grading (18)</h3>
              </div>
              <button
                onClick={() => setGradingModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {[
                { title: "PACS Day-Book Practical Reconciliation", prog: "PACS Digital Accounting", submissions: 12, due: "Today", trainer: "Mr. Suresh Jadhav" },
                { title: "Statutory Audit Case Study Assignment", prog: "Cooperative Law & Governance", submissions: 6, due: "Tomorrow", trainer: "Dr. Anand Deshmukh" },
                { title: "Milk Testing & Cold Chain Logbook", prog: "Dairy Cooperative Operations", submissions: 8, due: "15 Oct", trainer: "Prof. Priya Kamat" },
              ].map((assm, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h5 className="font-bold text-foreground text-sm">{assm.title}</h5>
                    <p className="text-muted-foreground text-[11px] mt-0.5">{assm.prog} &middot; Evaluator: {assm.trainer}</p>
                    <span className="text-amber-600 font-semibold">{assm.submissions} submissions awaiting review</span>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => {
                      showToast(`Grading portal opened for: ${assm.title}`);
                      setGradingModalOpen(false);
                    }}
                  >
                    Open Rubric
                  </Button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex justify-end bg-muted/10">
              <Button size="sm" variant="outline" onClick={() => setGradingModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
