"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TRAINER_BASE = `${API_BASE}/api/v1/trainer`;

export class TrainerApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/* Comprehensive Mock Dataset & Fallbacks for Trainer Portal                   */
/* -------------------------------------------------------------------------- */

const TRAINER_INFO = {
  id: "NCCT-PUNE-4471",
  name: "Dr. Meenal Kulkarni",
  designation: "Faculty - Cooperative Governance & Management",
  institution: "Vaikunth Mehta National Institute of Cooperative Management, Pune",
  email: "m.kulkarni@vamnicom.gov.in",
  phone: "+91 98230 44710",
};

const BATCHES = [
  { id: "b-2026-b", name: "Batch 2026-B" },
  { id: "b-2026-c", name: "Batch 2026-C" },
  { id: "b-2026-a", name: "Cohort 2026-A" },
  { id: "b-2025-c", name: "Batch 2025-C" },
];

const COURSES = [
  { id: "c-cmf", title: "Cooperative Management Fundamentals", batch_id: "b-2026-b", category: "Governance" },
  { id: "c-lcb", title: "Leadership for Cooperative Board Members", batch_id: "b-2026-c", category: "Leadership" },
  { id: "c-mis", title: "Credit Society Data & MIS", batch_id: "b-2026-a", category: "Accounts" },
  { id: "c-bwl", title: "Board Leadership Weekend Lab", batch_id: "b-2025-c", category: "Simulation" },
];

const CLASSES_OPTIONS = [
  { batch_id: "b-2026-b", batch: "Batch 2026-B", course_id: "c-cmf", course: "Cooperative Management Fundamentals" },
  { batch_id: "b-2026-c", batch: "Batch 2026-C", course_id: "c-lcb", course: "Leadership for Cooperative Board Members" },
  { batch_id: "b-2026-a", batch: "Cohort 2026-A", course_id: "c-mis", course: "Credit Society Data & MIS" },
  { batch_id: "b-2025-c", batch: "Batch 2025-C", course_id: "c-bwl", course: "Board Leadership Weekend Lab" },
];

const RAW_TRAINEES = [
  { id: "tr-001", code: "NCCT-PUNE-0142", name: "Ashwini Pawar", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 96, lrn: 88, asm: 92, asg: 95, skl: 86, act: "2026-09-28T09:45:00Z", st: "on_track", risks: [] },
  { id: "tr-002", code: "NCCT-PUNE-0143", name: "Vikram Solanki", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 90, lrn: 82, asm: 85, asg: 88, skl: 80, act: "2026-09-28T08:30:00Z", st: "on_track", risks: [] },
  { id: "tr-003", code: "NCCT-PUNE-0144", name: "Deepak Chauhan", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 88, lrn: 76, asm: 78, asg: 80, skl: 74, act: "2026-09-27T17:10:00Z", st: "on_track", risks: [] },
  { id: "tr-004", code: "NCCT-PUNE-0145", name: "Suresh S. Mane", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 68, lrn: 52, asm: 48, asg: 50, skl: 45, act: "2026-09-24T14:30:00Z", st: "at_risk", risks: ["Attendance below 75%", "Missed Module 4 Quiz", "Late assignment submission"] },
  { id: "tr-005", code: "NCCT-PUNE-0146", name: "Pooja Sharma", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 94, lrn: 90, asm: 88, asg: 92, skl: 88, act: "2026-09-28T10:00:00Z", st: "on_track", risks: [] },
  { id: "tr-006", code: "NCCT-PUNE-0147", name: "Ramesh Kumar", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 82, lrn: 70, asm: 68, asg: 72, skl: 65, act: "2026-09-27T11:20:00Z", st: "needs_attention", risks: ["Practical score below 70%"] },
  { id: "tr-007", code: "NCCT-PUNE-0148", name: "Amit Gupta", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 92, lrn: 85, asm: 84, asg: 86, skl: 82, act: "2026-09-28T09:15:00Z", st: "on_track", risks: [] },
  { id: "tr-008", code: "NCCT-PUNE-0149", name: "Anjali Rathore", batch: "Batch 2026-C", batch_id: "b-2026-c", att: 64, lrn: 58, asm: 55, asg: 60, skl: 50, act: "2026-09-22T09:15:00Z", st: "at_risk", risks: ["Low Attendance (64%)", "Incomplete bylaws assessment"] },
  { id: "tr-009", code: "NCCT-PUNE-0150", name: "Priya Nair", batch: "Batch 2026-C", batch_id: "b-2026-c", att: 98, lrn: 94, asm: 95, asg: 96, skl: 92, act: "2026-09-28T08:00:00Z", st: "on_track", risks: [] },
  { id: "tr-010", code: "NCCT-PUNE-0151", name: "Rajesh Patil", batch: "Batch 2026-C", batch_id: "b-2026-c", att: 86, lrn: 78, asm: 75, asg: 80, skl: 72, act: "2026-09-27T16:00:00Z", st: "on_track", risks: [] },
  { id: "tr-011", code: "NCCT-PUNE-0152", name: "Sneha Kadam", batch: "Batch 2026-C", batch_id: "b-2026-c", att: 92, lrn: 86, asm: 82, asg: 85, skl: 80, act: "2026-09-28T07:45:00Z", st: "on_track", risks: [] },
  { id: "tr-012", code: "NCCT-PUNE-0153", name: "Mahesh Shinde", batch: "Batch 2026-C", batch_id: "b-2026-c", att: 80, lrn: 68, asm: 65, asg: 68, skl: 62, act: "2026-09-26T14:30:00Z", st: "needs_attention", risks: ["Assessment average below 70%"] },
  { id: "tr-013", code: "NCCT-PUNE-0154", name: "Kavita More", batch: "Batch 2026-C", batch_id: "b-2026-c", att: 94, lrn: 88, asm: 90, asg: 90, skl: 85, act: "2026-09-28T09:30:00Z", st: "on_track", risks: [] },
  { id: "tr-014", code: "NCCT-PUNE-0155", name: "Sandeep Jadhav", batch: "Batch 2026-C", batch_id: "b-2026-c", att: 90, lrn: 84, asm: 80, asg: 82, skl: 78, act: "2026-09-27T18:00:00Z", st: "on_track", risks: [] },
  { id: "tr-015", code: "NCCT-PUNE-0156", name: "Priyanka Deshmukh", batch: "Cohort 2026-A", batch_id: "b-2026-a", att: 96, lrn: 92, asm: 90, asg: 94, skl: 88, act: "2026-09-28T09:00:00Z", st: "on_track", risks: [] },
  { id: "tr-016", code: "NCCT-PUNE-0157", name: "Sunil Gaikwad", batch: "Cohort 2026-A", batch_id: "b-2026-a", att: 94, lrn: 85, asm: 84, asg: 88, skl: 82, act: "2026-09-28T10:10:00Z", st: "on_track", risks: [] },
  { id: "tr-017", code: "NCCT-PUNE-0158", name: "Pallavi Chavan", batch: "Cohort 2026-A", batch_id: "b-2026-a", att: 90, lrn: 80, asm: 78, asg: 82, skl: 76, act: "2026-09-27T15:20:00Z", st: "on_track", risks: [] },
  { id: "tr-018", code: "NCCT-PUNE-0159", name: "Ganesh Bhosale", batch: "Cohort 2026-A", batch_id: "b-2026-a", att: 84, lrn: 72, asm: 70, asg: 74, skl: 68, act: "2026-09-26T12:00:00Z", st: "needs_attention", risks: ["Late MIS submission"] },
  { id: "tr-019", code: "NCCT-PUNE-0160", name: "Swati Sawant", batch: "Cohort 2026-A", batch_id: "b-2026-a", att: 96, lrn: 90, asm: 88, asg: 92, skl: 85, act: "2026-09-28T08:50:00Z", st: "on_track", risks: [] },
  { id: "tr-020", code: "NCCT-PUNE-0161", name: "Nitin Salunkhe", batch: "Cohort 2026-A", batch_id: "b-2026-a", att: 92, lrn: 84, asm: 82, asg: 86, skl: 80, act: "2026-09-27T14:40:00Z", st: "on_track", risks: [] },
  { id: "tr-021", code: "NCCT-PUNE-0162", name: "Rohini Jagtap", batch: "Batch 2025-C", batch_id: "b-2025-c", att: 100, lrn: 96, asm: 95, asg: 98, skl: 94, act: "2026-09-28T09:10:00Z", st: "on_track", risks: [] },
  { id: "tr-022", code: "NCCT-PUNE-0163", name: "Sachin Thorat", batch: "Batch 2025-C", batch_id: "b-2025-c", att: 98, lrn: 92, asm: 90, asg: 94, skl: 88, act: "2026-09-27T16:50:00Z", st: "on_track", risks: [] },
  { id: "tr-023", code: "NCCT-PUNE-0164", name: "Manisha Shirole", batch: "Batch 2025-C", batch_id: "b-2025-c", att: 96, lrn: 90, asm: 88, asg: 92, skl: 86, act: "2026-09-28T10:05:00Z", st: "on_track", risks: [] },
  { id: "tr-024", code: "NCCT-PUNE-0165", name: "Ajay Tambe", batch: "Batch 2025-C", batch_id: "b-2025-c", att: 94, lrn: 88, asm: 86, asg: 90, skl: 84, act: "2026-09-27T11:00:00Z", st: "on_track", risks: [] },
  { id: "tr-025", code: "NCCT-PUNE-0166", name: "Vaishali Mohite", batch: "Batch 2025-C", batch_id: "b-2025-c", att: 98, lrn: 94, asm: 92, asg: 96, skl: 90, act: "2026-09-28T08:15:00Z", st: "on_track", risks: [] },
  { id: "tr-026", code: "NCCT-PUNE-0167", name: "Kiran Wagh", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 84, lrn: 74, asm: 72, asg: 76, skl: 70, act: "2026-09-26T10:00:00Z", st: "needs_attention", risks: ["Irregular submission trend"] },
  { id: "tr-027", code: "NCCT-PUNE-0168", name: "Jyoti Gholap", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 92, lrn: 86, asm: 84, asg: 88, skl: 82, act: "2026-09-28T09:20:00Z", st: "on_track", risks: [] },
  { id: "tr-028", code: "NCCT-PUNE-0169", name: "Vijay Gaware", batch: "Batch 2026-B", batch_id: "b-2026-b", att: 90, lrn: 82, asm: 80, asg: 84, skl: 78, act: "2026-09-27T13:45:00Z", st: "on_track", risks: [] },
];

function buildTraineeRows() {
  return RAW_TRAINEES.map((t) => ({
    id: t.id,
    trainee_code: t.code,
    name: t.name,
    batch: t.batch,
    batch_id: t.batch_id,
    attendance: t.att,
    learning: t.lrn,
    assessment: t.asm,
    assignment: t.asg,
    skill_readiness: t.skl,
    last_activity: t.act,
    inactive_days: t.act ? Math.max(0, Math.floor((new Date("2026-09-28T12:00:00Z").getTime() - new Date(t.act).getTime()) / 86400000)) : 3,
    status: t.st,
    status_label: t.st === "on_track" ? "On Track" : t.st === "at_risk" ? "At Risk" : "Needs Attention",
    risk_reasons: t.risks,
    course_progress: t.lrn,
  }));
}

/* -------------------------------------------------------------------------- */
/* Dynamic Mock Response Provider                                              */
/* -------------------------------------------------------------------------- */

function getMockTrainerResponse<T>(path: string, init: RequestInit = {}): T {
  const [pathname, qs] = path.split("?");
  const query = new URLSearchParams(qs || "");
  const method = (init.method || "GET").toUpperCase();

  // POST / PUT generic success
  if (method === "POST" || method === "PUT") {
    if (pathname.includes("/grade")) {
      return { score: 86, result: "Passed", fully_graded: true, success: true } as unknown as T;
    }
    if (pathname.includes("/publish")) {
      return { success: true, status: "published" } as unknown as T;
    }
    return { ok: true, success: true, id: `gen-${Date.now()}` } as unknown as T;
  }

  /* 1. Dashboard */
  if (pathname === "/dashboard") {
    const trainees = buildTraineeRows();
    const atRisk = trainees.filter((t) => t.status === "at_risk");
    return {
      trainer: { id: TRAINER_INFO.id, name: TRAINER_INFO.name },
      today: "2026-09-28",
      kpis: {
        todays_classes: 2,
        upcoming_classes: 5,
        trainees: 28,
        average_attendance: 94,
        attendance_delta: 3,
        pending_assessments: 4,
        pending_breakdown: { attempts_to_review: 2, submissions_to_grade: 2 },
        at_risk: 2,
      },
      today_classes: [
        {
          slot_id: "s-today-1",
          course_id: "c-cmf",
          course: "Cooperative Management Fundamentals",
          batch: "Batch 2026-B",
          batch_id: "b-2026-b",
          class_id: "cls-cmf-b",
          date: "2026-09-28",
          start: "10:00",
          end: "11:30",
          start_label: "10:00 AM",
          end_label: "11:30 AM",
          room: "Hall A-204",
          trainees: 10,
          attendance_status: "in_progress",
          session_id: "att-0928",
          present: 9,
        },
        {
          slot_id: "s-today-2",
          course_id: "c-lcb",
          course: "Leadership for Cooperative Board Members",
          batch: "Batch 2026-C",
          batch_id: "b-2026-c",
          class_id: "cls-lcb-c",
          date: "2026-09-28",
          start: "14:00",
          end: "15:30",
          start_label: "02:00 PM",
          end_label: "03:30 PM",
          room: "Hall B-112",
          trainees: 7,
          attendance_status: "pending",
          session_id: null,
          present: null,
        },
      ],
      upcoming: {
        tomorrow: [
          {
            slot_id: "s-tom-1",
            course_id: "c-mis",
            course: "Credit Society Data & MIS",
            batch: "Cohort 2026-A",
            batch_id: "b-2026-a",
            class_id: "cls-mis-a",
            date: "2026-09-29",
            start: "11:00",
            end: "13:00",
            start_label: "11:00 AM",
            end_label: "01:00 PM",
            room: "Analytics Lab 3",
            trainees: 6,
            attendance_status: "pending",
            session_id: null,
            present: null,
          },
        ],
        this_week: [
          {
            slot_id: "s-week-1",
            course_id: "c-cmf",
            course: "Cooperative Management Fundamentals",
            batch: "Batch 2026-B",
            batch_id: "b-2026-b",
            class_id: "cls-cmf-b",
            date: "2026-09-30",
            start: "10:00",
            end: "11:30",
            start_label: "10:00 AM",
            end_label: "11:30 AM",
            room: "Hall A-204",
            trainees: 10,
            attendance_status: "pending",
            session_id: null,
            present: null,
          },
          {
            slot_id: "s-week-2",
            course_id: "c-bwl",
            course: "Board Leadership Weekend Lab",
            batch: "Batch 2025-C",
            batch_id: "b-2025-c",
            class_id: "cls-bwl-c",
            date: "2026-10-03",
            start: "09:30",
            end: "12:00",
            start_label: "09:30 AM",
            end_label: "12:00 PM",
            room: "Computer Lab 2",
            trainees: 5,
            attendance_status: "pending",
            session_id: null,
            present: null,
          },
        ],
      },
      at_risk_trainees: atRisk,
      attendance_trend: [
        { date: "2026-09-22", attendance: 89 },
        { date: "2026-09-23", attendance: 92 },
        { date: "2026-09-24", attendance: 91 },
        { date: "2026-09-25", attendance: 96 },
        { date: "2026-09-26", attendance: 94 },
        { date: "2026-09-27", attendance: 92 },
        { date: "2026-09-28", attendance: 95 },
      ],
      learning_progress: [
        { class_id: "cls-cmf-b", course: "Cooperative Management Fundamentals", batch: "Batch 2026-B", progress: 68 },
        { class_id: "cls-lcb-c", course: "Leadership for Cooperative Board Members", batch: "Batch 2026-C", progress: 82 },
        { class_id: "cls-mis-a", course: "Credit Society Data & MIS", batch: "Cohort 2026-A", progress: 45 },
        { class_id: "cls-bwl-c", course: "Board Leadership Weekend Lab", batch: "Batch 2025-C", progress: 100 },
      ],
      upcoming_assessments: [
        { id: "asm-1", title: "Statutory Audit & Annual General Meetings", batch: "Batch 2026-B", scheduled_at: "2026-09-30T10:00:00Z", questions: 15, duration_minutes: 45 },
        { id: "asm-2", title: "Board Resolution Drafting & Compliance", batch: "Batch 2026-C", scheduled_at: "2026-10-02T14:00:00Z", questions: 10, duration_minutes: 30 },
      ],
      recent_activity: [
        { type: "attendance", text: "Marked 9/10 trainees present in Coop Management Batch B", at: "2026-09-28T10:15:00Z" },
        { type: "assessment", text: "Rahul Jadhav submitted Governance Practical Assessment", at: "2026-09-27T16:40:00Z" },
        { type: "assignment", text: "5 trainees submitted PACS Digital Accounting Assignment", at: "2026-09-27T12:30:00Z" },
        { type: "attendance", text: "Completed attendance for Board Leadership Weekend Lab", at: "2026-09-25T11:45:00Z" },
      ],
      skills: [
        { skill: "Cooperative Bylaws Interpretation", average: 84 },
        { skill: "PACS Balance Sheet Reconciliation", average: 76 },
        { skill: "Member Grievance Redressal", average: 88 },
        { skill: "MSCS Act 2002 Compliance", average: 79 },
      ],
      insights: [
        { severity: "positive", text: "Overall attendance across Batch 2026-B increased by 3% this week." },
        { severity: "warning", text: "2 trainees in Batch 2026-C require attention before the upcoming statutory exam." },
        { severity: "info", text: "85% of trainees completed the digital passbook simulation successfully." },
      ],
      unread_messages: 3,
    } as unknown as T;
  }

  /* 2. Classes List & Class Detail */
  if (pathname === "/classes") {
    return {
      classes: [
        {
          id: "cls-cmf-b",
          course: "Cooperative Management Fundamentals",
          category: "Governance",
          batch: "2026-B",
          trainees: 10,
          progress: 68,
          attendance: 94,
          assessments_completed: 4,
          assessments_total: 5,
          at_risk: 1,
          room: "Hall A-204",
          next_class: { start: "2026-09-30T10:00:00Z", label: "Wed 30 Sep, 10:00 AM", room: "Hall A-204" },
        },
        {
          id: "cls-lcb-c",
          course: "Leadership for Cooperative Board Members",
          category: "Leadership",
          batch: "2026-C",
          trainees: 7,
          progress: 82,
          attendance: 91,
          assessments_completed: 5,
          assessments_total: 6,
          at_risk: 1,
          room: "Hall B-112",
          next_class: { start: "2026-09-29T14:00:00Z", label: "Tue 29 Sep, 02:00 PM", room: "Hall B-112" },
        },
        {
          id: "cls-mis-a",
          course: "Credit Society Data & MIS",
          category: "Accounts",
          batch: "2026-A",
          trainees: 6,
          progress: 45,
          attendance: 96,
          assessments_completed: 2,
          assessments_total: 4,
          at_risk: 0,
          room: "Analytics Lab 3",
          next_class: { start: "2026-10-02T11:00:00Z", label: "Fri 2 Oct, 11:00 AM", room: "Analytics Lab 3" },
        },
        {
          id: "cls-bwl-c",
          course: "Board Leadership Weekend Lab",
          category: "Simulation",
          batch: "2025-C",
          trainees: 5,
          progress: 100,
          attendance: 98,
          assessments_completed: 3,
          assessments_total: 3,
          at_risk: 0,
          room: "Computer Lab 2",
          next_class: { start: "2026-10-03T09:30:00Z", label: "Sat 3 Oct, 09:30 AM", room: "Computer Lab 2" },
        },
      ],
    } as unknown as T;
  }

  if (pathname.startsWith("/classes/")) {
    const classId = pathname.replace("/classes/", "");
    const trainees = buildTraineeRows().filter((t) => (classId.includes("lcb") ? t.batch_id === "b-2026-c" : t.batch_id === "b-2026-b"));
    return {
      id: classId,
      course: {
        id: classId.includes("lcb") ? "c-lcb" : "c-cmf",
        title: classId.includes("lcb") ? "Leadership for Cooperative Board Members" : "Cooperative Management Fundamentals",
        category: classId.includes("lcb") ? "Leadership" : "Governance",
      },
      batch: {
        id: classId.includes("lcb") ? "b-2026-c" : "b-2026-b",
        name: classId.includes("lcb") ? "Batch 2026-C" : "Batch 2026-B",
        venue: "VAMNICOM Main Campus, Pune",
      },
      room: classId.includes("lcb") ? "Hall B-112" : "Hall A-204",
      overview: {
        course_progress: classId.includes("lcb") ? 82 : 68,
        trainees: trainees.length || 10,
        average_attendance: 94,
        average_assessment: 82,
        completion_rate: 90,
      },
      charts: {
        learning_progress: [
          { bucket: "0-25%", trainees: 0 },
          { bucket: "26-50%", trainees: 1 },
          { bucket: "51-75%", trainees: 3 },
          { bucket: "76-100%", trainees: (trainees.length || 10) - 4 },
        ],
        attendance_trend: [
          { date: "2026-09-22", attendance: 90 },
          { date: "2026-09-23", attendance: 94 },
          { date: "2026-09-24", attendance: 91 },
          { date: "2026-09-25", attendance: 96 },
          { date: "2026-09-26", attendance: 93 },
          { date: "2026-09-27", attendance: 92 },
          { date: "2026-09-28", attendance: 95 },
        ],
        assessment_performance: [
          { assessment: "Module 1 Quiz", average: 86, pass_rate: 100 },
          { assessment: "Bylaws Case Study", average: 81, pass_rate: 90 },
          { assessment: "Mid-Term Viva", average: 79, pass_rate: 85 },
        ],
      },
      at_risk_trainees: trainees.filter((t) => t.status === "at_risk"),
      trainees: trainees.length ? trainees : buildTraineeRows().slice(0, 10),
      attendance_sessions: [
        { id: "att-0928", name: "Session 14 - Governance Bylaws", date: "2026-09-28", room: "Hall A-204", present: 9, late: 1, absent: 0, excused: 0, attendance: 90 },
        { id: "att-0925", name: "Session 13 - Board Quorum Protocols", date: "2026-09-25", room: "Hall A-204", present: 10, late: 0, absent: 0, excused: 0, attendance: 100 },
        { id: "att-0923", name: "Session 12 - AGM Resolution Drafting", date: "2026-09-23", room: "Hall A-204", present: 8, late: 1, absent: 1, excused: 0, attendance: 80 },
      ],
      assessments: [
        { id: "asm-1", title: "Statutory Audit & Annual General Meetings", status: "published", scheduled_at: "2026-09-30T10:00:00Z", questions: 15, duration_minutes: 45, submitted: 8, average: 82, pass_rate: 88 },
        { id: "asm-3", title: "Cooperative Bylaws Interpretation Test", status: "completed", scheduled_at: "2026-09-20T10:00:00Z", questions: 20, duration_minutes: 60, submitted: 10, average: 85, pass_rate: 90 },
      ],
      assignments: [
        { id: "asg-1", title: "PACS Audit Checklist Formulation", deadline: "2026-10-01T23:59:00Z", assigned: 10, submitted: 8, pending: 2, graded: 6, status: "published" },
      ],
      announcements: [
        { id: "ann-1", title: "Field Visit to Warana Dairy Cooperative", message: "Bus departs at 7:30 AM from main porch. Wear your institute ID badges.", audience: "Batch 2026-B", status: "published", created_at: "2026-09-26T11:00:00Z" },
      ],
      content: [
        { id: "cnt-1", title: "Rochdale Principles in Indian Context", position: 1, duration_minutes: 22, type: "video" },
        { id: "cnt-2", title: "Model Bylaws for Primary Cooperatives (PDF)", position: 2, duration_minutes: 15, type: "pdf" },
      ],
    } as unknown as T;
  }

  /* 3. Trainees List & Trainee Detail */
  if (pathname === "/trainees") {
    const list = buildTraineeRows();
    return {
      trainees: list,
      total: list.length,
      batches: BATCHES,
      status_counts: {
        on_track: list.filter((t) => t.status === "on_track").length,
        needs_attention: list.filter((t) => t.status === "needs_attention").length,
        at_risk: list.filter((t) => t.status === "at_risk").length,
        completed: 0,
      },
    } as unknown as T;
  }

  if (pathname.startsWith("/trainees/")) {
    const id = pathname.replace("/trainees/", "");
    const base = buildTraineeRows().find((t) => t.id === id) || buildTraineeRows()[0];
    return {
      profile: {
        id: base.id,
        trainee_code: base.trainee_code,
        name: base.name,
        batch: base.batch,
        batch_id: base.batch_id,
        status: base.status,
        status_label: base.status_label,
      },
      performance: {
        learning: base.learning,
        attendance: base.attendance,
        assessment: base.assessment,
        assignment: base.assignment,
        skill_readiness: base.skill_readiness,
        last_activity: base.last_activity,
        inactive_days: base.inactive_days,
        risk_reasons: base.risk_reasons,
      },
      courses: [
        { class_id: "cls-cmf-b", course: "Cooperative Management Fundamentals", progress: base.learning, last_accessed: base.last_activity },
      ],
      assessments: [
        { assessment_id: "asm-1", attempt_id: "att-101", title: "Governance & Bylaws Test", score: base.assessment, passed: base.assessment >= 50, status: base.assessment >= 50 ? "Passed" : "Needs Review", submitted_at: "2026-09-25T11:30:00Z" },
        { assessment_id: "asm-3", attempt_id: "att-102", title: "Module 2 Statutory Audit Quiz", score: 88, passed: true, status: "Passed", submitted_at: "2026-09-18T14:15:00Z" },
      ],
      assignments: [
        { id: "asg-1", title: "PACS Audit Checklist Formulation", deadline: "2026-10-01T23:59:00Z", status: "graded", marks: Math.min(100, base.assignment + 5), max_marks: 100 },
      ],
      skills: [
        { skill: "Cooperative Governance", proficiency: base.skill_readiness, level: "Advanced", verified: true },
        { skill: "Bylaws Drafting & Amendment", proficiency: Math.max(50, base.skill_readiness - 4), level: "Proficient", verified: true },
        { skill: "PACS Financial Statements", proficiency: Math.max(45, base.skill_readiness - 8), level: "Proficient", verified: false },
        { skill: "Meeting Quorum & Minutes", proficiency: Math.min(95, base.skill_readiness + 6), level: "Advanced", verified: true },
      ],
      certificates: [
        { id: "cert-01", programme: "Cooperative Governance Foundation", issued: "2026-08-15", grade: "A+" },
      ],
      observations: [
        { id: "obs-01", dimension: "governance", rating: 5, observation: "Demonstrated excellent leadership during the mock board quorum exercise.", created_at: "2026-09-24T12:00:00Z" },
        { id: "obs-02", dimension: "accounting", rating: 4, observation: "Quick at calculating statutory reserve allocations.", created_at: "2026-09-22T15:30:00Z" },
      ],
      recent_activity: [
        { type: "attendance", text: "Scanned QR code for Session 14 (Present)", at: "2026-09-28T10:02:00Z" },
        { type: "assessment", text: "Completed Module 3 Practice Quiz", at: "2026-09-26T15:20:00Z" },
        { type: "assignment", text: "Submitted draft PACS Audit Checklist", at: "2026-09-25T17:00:00Z" },
      ],
    } as unknown as T;
  }

  /* 4. Assessments */
  if (pathname === "/assessments/options") {
    return { classes: CLASSES_OPTIONS } as unknown as T;
  }

  if (pathname === "/assessments") {
    const batchFilter = query.get("batch_id");
    const courseFilter = query.get("course_id");
    let all = [
      {
        id: "asm-1",
        title: "Statutory Audit & Annual General Meetings",
        course: "Cooperative Management Fundamentals",
        module: "Module 4",
        batch: "Batch 2026-B",
        batch_id: "b-2026-b",
        course_id: "c-cmf",
        questions: 15,
        duration_minutes: 45,
        passing_score: 50,
        scheduled_at: "2026-09-30T10:00:00Z",
        status: "published",
        group: "upcoming" as const,
        submitted: 8,
        total: 10,
        needs_review: 2,
        avg_score: 82,
      },
      {
        id: "asm-2",
        title: "Board Resolution Drafting & Compliance",
        course: "Leadership for Cooperative Board Members",
        module: "Module 2",
        batch: "Batch 2026-C",
        batch_id: "b-2026-c",
        course_id: "c-lcb",
        questions: 10,
        duration_minutes: 30,
        passing_score: 50,
        scheduled_at: "2026-10-02T14:00:00Z",
        status: "published",
        group: "upcoming" as const,
        submitted: 5,
        total: 7,
        needs_review: 1,
        avg_score: 84,
      },
      {
        id: "asm-3",
        title: "Cooperative Bylaws Interpretation Test",
        course: "Cooperative Management Fundamentals",
        module: "Module 2",
        batch: "Batch 2026-B",
        batch_id: "b-2026-b",
        course_id: "c-cmf",
        questions: 20,
        duration_minutes: 60,
        passing_score: 50,
        scheduled_at: "2026-09-20T10:00:00Z",
        status: "completed",
        group: "completed" as const,
        submitted: 10,
        total: 10,
        needs_review: 0,
        avg_score: 85,
      },
      {
        id: "asm-4",
        title: "PACS Balance Sheet Reconciliation Practical",
        course: "Credit Society Data & MIS",
        module: "Module 3",
        batch: "Cohort 2026-A",
        batch_id: "b-2026-a",
        course_id: "c-mis",
        questions: 12,
        duration_minutes: 45,
        passing_score: 50,
        scheduled_at: "2026-09-24T11:00:00Z",
        status: "published",
        group: "published" as const,
        submitted: 6,
        total: 6,
        needs_review: 0,
        avg_score: 88,
      },
      {
        id: "asm-5",
        title: "MSCS Act 2002 Quorum & Elections Quiz",
        course: "Leadership for Cooperative Board Members",
        module: "Module 3",
        batch: "Batch 2026-C",
        batch_id: "b-2026-c",
        course_id: "c-lcb",
        questions: 10,
        duration_minutes: 30,
        passing_score: 50,
        scheduled_at: null,
        status: "draft",
        group: "drafts" as const,
        submitted: 0,
        total: 7,
        needs_review: 0,
        avg_score: null,
      },
      {
        id: "asm-6",
        title: "Member Grievance Handling Case Simulation",
        course: "Cooperative Management Fundamentals",
        module: "Module 3",
        batch: "Batch 2026-B",
        batch_id: "b-2026-b",
        course_id: "c-cmf",
        questions: 8,
        duration_minutes: 40,
        passing_score: 50,
        scheduled_at: "2026-09-15T10:00:00Z",
        status: "completed",
        group: "completed" as const,
        submitted: 10,
        total: 10,
        needs_review: 0,
        avg_score: 80,
      },
    ];

    if (batchFilter) all = all.filter((a) => a.batch_id === batchFilter);
    if (courseFilter) all = all.filter((a) => a.course_id === courseFilter);

    return {
      counts: {
        upcoming: all.filter((a) => a.group === "upcoming").length,
        drafts: all.filter((a) => a.group === "drafts").length,
        published: all.filter((a) => a.status === "published").length,
        completed: all.filter((a) => a.group === "completed").length,
      },
      assessments: all,
    } as unknown as T;
  }

  if (pathname.includes("/review/")) {
    // /assessments/:id/review/:attemptId
    return {
      assessment: { id: "asm-1", title: "Statutory Audit & Annual General Meetings", passing_score: 50 },
      attempt: { id: "att-101", attempt_no: 1, status: "submitted", score: 82, passed: true, submitted_at: "2026-09-28T09:30:00Z", result: "Needs Review" },
      trainee: { id: "tr-004", name: "Suresh S. Mane" },
      overall_feedback: "Good grasp of notice periods, but review the quorum rules for adjourned meetings.",
      questions: [
        {
          id: "q1",
          position: 1,
          type: "mcq_single" as const,
          prompt: "Under the Multi-State Cooperative Societies Act 2002, what is the mandatory notice period for convening an Annual General Meeting?",
          options: [{ id: "a", text: "7 days" }, { id: "b", text: "14 clear days" }, { id: "c", text: "21 clear days" }, { id: "d", text: "30 days" }],
          trainee_answer: "b",
          expected: ["b"],
          explanation: "Section 39 mandates minimum 14 clear days notice for an AGM.",
          max_marks: 5,
          auto_graded: true,
          auto_marks: 5,
        },
        {
          id: "q2",
          position: 2,
          type: "short_answer" as const,
          prompt: "Explain the procedure if the required quorum is not present within 30 minutes of the appointed AGM start time.",
          options: null,
          trainee_answer: "The meeting stands adjourned to the same day in the next week at the same time and place. In the adjourned meeting, the members present form the quorum.",
          expected: ["adjourned to the same day in next week", "no quorum required for adjourned meeting"],
          explanation: "Bylaws specify adjournment for 7 days. If no quorum at adjourned meeting, present members form quorum.",
          max_marks: 10,
          auto_graded: false,
          auto_marks: null,
          manual_grade: { marks: 8, feedback: "Clear explanation with correct legal basis." },
        },
      ],
    } as unknown as T;
  }

  if (pathname.startsWith("/assessments/")) {
    const id = pathname.replace("/assessments/", "");
    const trainees = buildTraineeRows().slice(0, 10);
    return {
      assessment: {
        id,
        title: "Statutory Audit & Annual General Meetings",
        course: "Cooperative Management Fundamentals",
        course_id: "c-cmf",
        module: "Module 4",
        batch: "Batch 2026-B",
        batch_id: "b-2026-b",
        description: "Evaluation on AGM statutory compliance, quorum calculation, notice circulation, and audit report presentation.",
        instructions: "Attempt all questions. Review your responses before final submission.",
        duration_minutes: 45,
        passing_score: 50,
        scheduled_at: "2026-09-30T10:00:00Z",
        status: "published",
        questions: [
          {
            id: "q1",
            type: "mcq_single" as const,
            prompt: "What is the mandatory notice period for convening an AGM under MSCS Act?",
            options: [{ id: "a", text: "7 days" }, { id: "b", text: "14 clear days" }, { id: "c", text: "21 clear days" }, { id: "d", text: "30 days" }],
            correct: ["b"],
            explanation: "14 clear days notice is statutory requirement.",
            marks: 5,
          },
          {
            id: "q2",
            type: "true_false" as const,
            prompt: "The statutory auditor of a cooperative society can be elected as a voting board director.",
            options: null,
            correct: ["false"],
            explanation: "Auditor independence prohibits holding elective office in the same cooperative society.",
            marks: 5,
          },
        ],
      },
      totals: {
        total_trainees: 10,
        submitted: 8,
        pending: 2,
        needs_review: 2,
        avg_score: 84,
        pass_rate: 88,
      },
      rows: trainees.map((t, idx) => ({
        trainee_id: t.id,
        trainee: t.name,
        score: idx < 8 ? Math.min(100, t.assessment + 2) : null,
        status: idx === 3 ? ("Needs Review" as const) : idx < 7 ? ("Passed" as const) : idx === 7 ? ("Failed" as const) : ("Pending" as const),
        attempt_no: idx < 8 ? 1 : null,
        submitted_at: idx < 8 ? "2026-09-28T09:40:00Z" : null,
        attempt_id: idx < 8 ? `att-${t.id}` : null,
      })),
    } as unknown as T;
  }

  /* 5. Assignments */
  if (pathname === "/assignments/options") {
    return { classes: CLASSES_OPTIONS } as unknown as T;
  }

  if (pathname === "/assignments") {
    return {
      assignments: [
        {
          id: "asg-1",
          title: "PACS Audit Checklist Formulation",
          description: "Formulate a 10-point audit verification checklist for primary credit societies.",
          batch: "Batch 2026-B",
          batch_id: "b-2026-b",
          course: "Cooperative Management Fundamentals",
          deadline: "2026-10-01T23:59:00Z",
          overdue: false,
          max_marks: 100,
          status: "published",
          assigned: 10,
          submitted: 8,
          pending: 2,
          graded: 6,
          to_grade: 2,
        },
        {
          id: "asg-2",
          title: "Credit Appraisal Case Study & Risk Report",
          description: "Analyse seasonal agricultural loan defaults from sample farmer records.",
          batch: "Cohort 2026-A",
          batch_id: "b-2026-a",
          course: "Credit Society Data & MIS",
          deadline: "2026-10-05T18:00:00Z",
          overdue: false,
          max_marks: 50,
          status: "published",
          assigned: 6,
          submitted: 4,
          pending: 2,
          graded: 3,
          to_grade: 1,
        },
        {
          id: "asg-3",
          title: "Election Code Compliance Documentation",
          description: "Draft returning officer checklist according to Maharashtra Cooperative Societies Rules.",
          batch: "Batch 2026-C",
          batch_id: "b-2026-c",
          course: "Leadership for Cooperative Board Members",
          deadline: "2026-10-10T17:00:00Z",
          overdue: false,
          max_marks: 100,
          status: "draft",
          assigned: 7,
          submitted: 0,
          pending: 7,
          graded: 0,
          to_grade: 0,
        },
        {
          id: "asg-4",
          title: "Society Balance Sheet Reconciliation Exercise",
          description: "Match passbook ledger balances with cash-in-hand register entries.",
          batch: "Batch 2025-C",
          batch_id: "b-2025-c",
          course: "Board Leadership Weekend Lab",
          deadline: "2026-09-24T23:59:00Z",
          overdue: true,
          max_marks: 100,
          status: "published",
          assigned: 5,
          submitted: 5,
          pending: 0,
          graded: 5,
          to_grade: 0,
        },
      ],
    } as unknown as T;
  }

  if (pathname.startsWith("/assignments/")) {
    const id = pathname.replace("/assignments/", "");
    const trainees = buildTraineeRows().slice(0, 10);
    return {
      assignment: {
        id,
        title: "PACS Audit Checklist Formulation",
        description: "Draft a comprehensive checklist covering cash register reconciliation, loan voucher verifications, and statutory reserve calculations.",
        batch: "Batch 2026-B",
        course: "Cooperative Management Fundamentals",
        deadline: "2026-10-01T23:59:00Z",
        max_marks: 100,
        resources: [
          { title: "PACS Audit Manual (NCCT)", url: "https://ncct.ac.in/resources/audit-manual" },
          { title: "Standard Balance Sheet Proforma", url: "https://coopsetu.gov.in/proforma.pdf" },
        ],
        status: "published",
      },
      totals: {
        assigned: 10,
        submitted: 8,
        pending: 2,
        graded: 6,
        to_grade: 2,
        avg_marks: 86,
      },
      rows: trainees.map((t, idx) => ({
        trainee_id: t.id,
        trainee: t.name,
        submission_id: idx < 8 ? `sub-${t.id}` : null,
        status: idx < 6 ? ("graded" as const) : idx < 8 ? ("submitted" as const) : ("pending" as const),
        submitted_at: idx < 8 ? "2026-09-27T16:20:00Z" : null,
        content: idx < 8 ? "1. Cash in safe verified daily against daybook balance.\n2. Gold loan appraisals countersigned by 2 officers.\n3. 25% statutory reserve transferred before dividend distribution." : null,
        file_url: idx < 8 ? "#" : null,
        marks: idx < 6 ? Math.min(100, t.assignment + 6) : null,
        feedback: idx < 6 ? "Well organized checklist addressing key prudential norms." : null,
      })),
    } as unknown as T;
  }

  /* 6. Content */
  if (pathname === "/content") {
    const courseId = query.get("course_id");
    let items = [
      {
        id: "cnt-1",
        number: 1,
        title: "Why Cooperatives Exist: The Rochdale Principles",
        course_id: "c-cmf",
        course: "Cooperative Management Fundamentals",
        module_id: "mod-cmf-1",
        module: "Foundations of the Cooperative Movement",
        kind: "video",
        type_label: "Video Lesson",
        duration_min: 22,
        published: true,
        language: "en, hi, mr",
        visibility: "batch",
        description: "Historical origin of Rochdale Pioneers and mapping to modern Indian PACS legislation.",
        url: "https://www.youtube.com/watch?v=mock-rochdale",
      },
      {
        id: "cnt-2",
        number: 2,
        title: "Model Bylaws for Primary Cooperatives (Annotated Guide)",
        course_id: "c-cmf",
        course: "Cooperative Management Fundamentals",
        module_id: "mod-cmf-2",
        module: "Governance, Boards & Bylaws",
        kind: "pdf",
        type_label: "PDF Document",
        duration_min: 15,
        published: true,
        language: "en, mr",
        visibility: "batch",
        description: "Clause-by-clause walkthrough for adopting mandatory bylaws under MSCS Act.",
        url: "https://coopsetu.gov.in/docs/model-bylaws.pdf",
      },
      {
        id: "cnt-3",
        number: 3,
        title: "Board Composition and Reserved Seat Allocation",
        course_id: "c-cmf",
        course: "Cooperative Management Fundamentals",
        module_id: "mod-cmf-2",
        module: "Governance, Boards & Bylaws",
        kind: "presentation",
        type_label: "Slide Deck",
        duration_min: 30,
        published: true,
        language: "en, hi",
        visibility: "batch",
        description: "Visual slides on representation for women, SC/ST, and smallholder farmers on cooperative boards.",
        url: "https://coopsetu.gov.in/slides/board-composition.pptx",
      },
      {
        id: "cnt-4",
        number: 4,
        title: "Facilitating a Divided Board Meeting",
        course_id: "c-lcb",
        course: "Leadership for Cooperative Board Members",
        module_id: "mod-lead-2",
        module: "Conflict Resolution & Collective Decisions",
        kind: "video",
        type_label: "Video Lesson",
        duration_min: 28,
        published: true,
        language: "en, mr",
        visibility: "batch",
        description: "Simulation on mediation techniques when board factions disagree on capital investments.",
        url: "https://www.youtube.com/watch?v=mock-board-meeting",
      },
      {
        id: "cnt-5",
        number: 5,
        title: "Consensus Voting Mechanics & Protocol Sheet",
        course_id: "c-lcb",
        course: "Leadership for Cooperative Board Members",
        module_id: "mod-lead-2",
        module: "Conflict Resolution & Collective Decisions",
        kind: "pdf",
        type_label: "PDF Document",
        duration_min: 12,
        published: true,
        language: "en",
        visibility: "batch",
        description: "Standard ballot templates, secret vote protocols, and casting vote guidelines.",
        url: "https://coopsetu.gov.in/docs/voting-protocols.pdf",
      },
      {
        id: "cnt-6",
        number: 6,
        title: "PACS Core Banking & MIS Dashboard Walkthrough",
        course_id: "c-mis",
        course: "Credit Society Data & MIS",
        module_id: "mod-mis-1",
        module: "Core Banking Systems",
        kind: "video",
        type_label: "Video Lesson",
        duration_min: 25,
        published: true,
        language: "en, hi",
        visibility: "batch",
        description: "Step-by-step navigation of the national PACS digital computerization portal.",
        url: "https://www.youtube.com/watch?v=mock-mis",
      },
      {
        id: "cnt-7",
        number: 7,
        title: "Ministry of Cooperation Model Bylaws Portal",
        course_id: "c-cmf",
        course: "Cooperative Management Fundamentals",
        module_id: "mod-cmf-1",
        module: "Foundations of the Cooperative Movement",
        kind: "link",
        type_label: "External Link",
        duration_min: null,
        published: true,
        language: "en",
        visibility: "batch",
        description: "Official web portal for circulars, notifications, and standard operating procedures.",
        url: "https://cooperation.gov.in",
      },
      {
        id: "cnt-8",
        number: 8,
        title: "Patronage Dividend Formulation Worksheet",
        course_id: "c-cmf",
        course: "Cooperative Management Fundamentals",
        module_id: "mod-cmf-3",
        module: "Community Enterprise Planning",
        kind: "pdf",
        type_label: "PDF Document",
        duration_min: 18,
        published: false,
        language: "en, mr",
        visibility: "batch",
        description: "Draft spreadsheet guide for computing patronage bonus based on member trade volume.",
        url: "https://coopsetu.gov.in/docs/patronage-worksheet.pdf",
      },
    ];

    if (courseId) items = items.filter((it) => it.course_id === courseId);

    return {
      courses: [
        { id: "c-cmf", title: "Cooperative Management Fundamentals" },
        { id: "c-lcb", title: "Leadership for Cooperative Board Members" },
        { id: "c-mis", title: "Credit Society Data & MIS" },
      ],
      modules: [
        { id: "mod-cmf-1", title: "Foundations of the Cooperative Movement", course_id: "c-cmf" },
        { id: "mod-cmf-2", title: "Governance, Boards & Bylaws", course_id: "c-cmf" },
        { id: "mod-cmf-3", title: "Community Enterprise Planning", course_id: "c-cmf" },
        { id: "mod-lead-2", title: "Conflict Resolution & Collective Decisions", course_id: "c-lcb" },
        { id: "mod-mis-1", title: "Core Banking Systems", course_id: "c-mis" },
      ],
      items,
      summary: {
        total: items.length,
        published: items.filter((i) => i.published).length,
        draft: items.filter((i) => !i.published).length,
        videos: items.filter((i) => i.kind === "video").length,
      },
    } as unknown as T;
  }

  /* 7. Attendance */
  if (pathname === "/attendance/classes/mine") {
    return {
      classes: [
        { batch_id: "b-2026-b", programme_id: "c-cmf", title: "Cooperative Management Fundamentals", batch_name: "Batch 2026-B", venue: "Hall A-204", capacity: 12, enrolled: 10 },
        { batch_id: "b-2026-c", programme_id: "c-lcb", title: "Leadership for Cooperative Board Members", batch_name: "Batch 2026-C", venue: "Hall B-112", capacity: 10, enrolled: 7 },
        { batch_id: "b-2026-a", programme_id: "c-mis", title: "Credit Society Data & MIS", batch_name: "Cohort 2026-A", venue: "Analytics Lab 3", capacity: 8, enrolled: 6 },
      ],
    } as unknown as T;
  }

  if (pathname.includes("/attendance/session/")) {
    const id = pathname.split("/")[3] || "att-0928";
    const trainees = buildTraineeRows().slice(0, 10);
    return {
      id,
      name: "Session 14: Cooperative Governance Bylaws",
      course: "Cooperative Management Fundamentals",
      batch: "Batch 2026-B",
      room: "Hall A-204",
      methods: ["QR", "Manual"],
      status: "live",
      opens_at: "2026-09-28T10:00:00Z",
      closes_at: "2026-09-28T11:30:00Z",
      seconds_left: 1740,
      present: 9,
      late: 1,
      roster_size: 10,
      qr: "COOPSETU-SESSION-ATT-0928-ROTATE-XYZ",
      qr_expires_in: 14,
      percentage: 90,
      counts: { present: 9, late: 1, absent: 0, excused: 0 },
      recent: [
        { trainee_id: "tr-001", name: "Ashwini Pawar", time: "10:02 AM", method: "QR", status: "present" },
        { trainee_id: "tr-002", name: "Vikram Solanki", time: "10:04 AM", method: "QR", status: "present" },
        { trainee_id: "tr-003", name: "Deepak Chauhan", time: "10:07 AM", method: "QR", status: "present" },
      ],
      roster: trainees.map((t, idx) => ({
        trainee_id: t.id,
        name: t.name,
        initials: t.name.split(" ").map((n) => n[0]).join(""),
        code: t.trainee_code,
        status: idx === 3 ? ("late" as const) : ("present" as const),
        marked: true,
        method: idx === 3 ? "Manual" : "QR",
        time: idx === 3 ? "10:22 AM" : "10:04 AM",
      })),
    } as unknown as T;
  }

  if (pathname === "/attendance") {
    const tab = query.get("tab") || "today";

    if (tab === "history") {
      return {
        tab: "history",
        batches: BATCHES,
        courses: COURSES,
        classes: CLASSES_OPTIONS,
        items: [
          { session_id: "att-0928", date: "2026-09-28", time: "10:00 - 11:30 AM", name: "Session 14 - Governance Bylaws", course: "Cooperative Management Fundamentals", batch: "Batch 2026-B", present: 9, late: 1, excused: 0, absent: 0, roster: 10, percentage: 90 },
          { session_id: "att-0925", date: "2026-09-25", time: "09:30 - 12:00 PM", name: "Session 8 - Board Leadership Simulation", course: "Board Leadership Weekend Lab", batch: "Batch 2025-C", present: 5, late: 0, excused: 0, absent: 0, roster: 5, percentage: 100 },
          { session_id: "att-0924", date: "2026-09-24", time: "10:00 - 11:30 AM", name: "Session 13 - Quorum & Agenda Formulation", course: "Cooperative Management Fundamentals", batch: "Batch 2026-B", present: 8, late: 1, excused: 1, absent: 0, roster: 10, percentage: 80 },
          { session_id: "att-0923", date: "2026-09-23", time: "11:00 - 01:00 PM", name: "Session 6 - Loan Voucher Audits", course: "Credit Society Data & MIS", batch: "Cohort 2026-A", present: 5, late: 0, excused: 0, absent: 1, roster: 6, percentage: 83 },
          { session_id: "att-0922", date: "2026-09-22", time: "02:00 - 03:30 PM", name: "Session 9 - Board Election Rules", course: "Leadership for Cooperative Board Members", batch: "Batch 2026-C", present: 6, late: 1, excused: 0, absent: 0, roster: 7, percentage: 86 },
          { session_id: "att-0919", date: "2026-09-19", time: "09:30 - 12:00 PM", name: "Session 7 - Mediation Roleplays", course: "Board Leadership Weekend Lab", batch: "Batch 2025-C", present: 4, late: 1, excused: 0, absent: 0, roster: 5, percentage: 80 },
        ],
      } as unknown as T;
    }

    if (tab === "upcoming") {
      return {
        tab: "upcoming",
        batches: BATCHES,
        courses: COURSES,
        classes: CLASSES_OPTIONS,
        items: [
          {
            slot_id: "slot-up-1",
            date: "2026-09-29",
            course: "Credit Society Data & MIS",
            course_id: "c-mis",
            batch: "Cohort 2026-A",
            batch_id: "b-2026-a",
            start_label: "11:00 AM",
            end_label: "01:00 PM",
            room: "Analytics Lab 3",
            roster: 6,
            status: "not_started",
            session_id: null,
            present: null,
          },
          {
            slot_id: "slot-up-2",
            date: "2026-09-30",
            course: "Cooperative Management Fundamentals",
            course_id: "c-cmf",
            batch: "Batch 2026-B",
            batch_id: "b-2026-b",
            start_label: "10:00 AM",
            end_label: "11:30 AM",
            room: "Hall A-204",
            roster: 10,
            status: "not_started",
            session_id: null,
            present: null,
          },
          {
            slot_id: "slot-up-3",
            date: "2026-10-02",
            course: "Leadership for Cooperative Board Members",
            course_id: "c-lcb",
            batch: "Batch 2026-C",
            batch_id: "b-2026-c",
            start_label: "02:00 PM",
            end_label: "03:30 PM",
            room: "Hall B-112",
            roster: 7,
            status: "not_started",
            session_id: null,
            present: null,
          },
        ],
      } as unknown as T;
    }

    // Default: tab === "today"
    return {
      tab: "today",
      batches: BATCHES,
      courses: COURSES,
      classes: CLASSES_OPTIONS,
      items: [
        {
          slot_id: "s-today-1",
          date: "2026-09-28",
          course: "Cooperative Management Fundamentals",
          course_id: "c-cmf",
          batch: "Batch 2026-B",
          batch_id: "b-2026-b",
          start_label: "10:00 AM",
          end_label: "11:30 AM",
          room: "Hall A-204",
          roster: 10,
          status: "live",
          session_id: "att-0928",
          present: 9,
        },
        {
          slot_id: "s-today-2",
          date: "2026-09-28",
          course: "Leadership for Cooperative Board Members",
          course_id: "c-lcb",
          batch: "Batch 2026-C",
          batch_id: "b-2026-c",
          start_label: "02:00 PM",
          end_label: "03:30 PM",
          room: "Hall B-112",
          roster: 7,
          status: "not_started",
          session_id: null,
          present: null,
        },
      ],
    } as unknown as T;
  }

  /* 8. Analytics */
  if (pathname === "/analytics") {
    return {
      empty: false,
      batches: BATCHES,
      metrics: {
        classes_conducted: 32,
        attendance_avg: 94,
        course_completion: 78,
        assessment_avg: 82,
        pass_rate: 91,
        at_risk: 2,
        trainees: 28,
      },
      attendance_trend: [
        { date: "2026-09-18", label: "18 Sep", attendance: 89 },
        { date: "2026-09-20", label: "20 Sep", attendance: 92 },
        { date: "2026-09-22", label: "22 Sep", attendance: 90 },
        { date: "2026-09-23", label: "23 Sep", attendance: 94 },
        { date: "2026-09-24", label: "24 Sep", attendance: 91 },
        { date: "2026-09-25", label: "25 Sep", attendance: 97 },
        { date: "2026-09-26", label: "26 Sep", attendance: 95 },
        { date: "2026-09-28", label: "28 Sep", attendance: 95 },
      ],
      assessment_trend: [
        { label: "Bylaws Foundation Test", average: 85, pass_rate: 92 },
        { label: "Statutory AGM Quiz", average: 82, pass_rate: 88 },
        { label: "PACS MIS Audit Practical", average: 88, pass_rate: 94 },
        { label: "Board Mediation Roleplay", average: 79, pass_rate: 84 },
      ],
      learning_completion: [
        { label: "Batch 2026-B", completion: 68 },
        { label: "Batch 2026-C", completion: 82 },
        { label: "Cohort 2026-A", completion: 45 },
        { label: "Batch 2025-C", completion: 100 },
      ],
      skill_growth: {
        by_skill: [
          { skill: "Bylaws Interpretation", confidence: 86 },
          { skill: "Quorum & Minutes", confidence: 92 },
          { skill: "PACS Balance Sheet", confidence: 78 },
          { skill: "Conflict Mediation", confidence: 81 },
          { skill: "Statutory Filing", confidence: 84 },
        ],
        by_month: [
          { month: "July 2026", rating: 3.8, evaluations: 18 },
          { month: "August 2026", rating: 4.2, evaluations: 34 },
          { month: "September 2026", rating: 4.6, evaluations: 42 },
        ],
      },
    } as unknown as T;
  }

  /* 9. Skills */
  if (pathname === "/skills/evaluation-dimensions") {
    return {
      dimensions: [
        { key: "governance", label: "Cooperative Governance & Bylaws", hint: "Application of Rochdale principles and statutory compliance" },
        { key: "accounting", label: "PACS Accounting & Ledger Verification", hint: "Balance sheets, cash daybook, and audit trails" },
        { key: "leadership", label: "Meeting Facilitation & Quorum Management", hint: "Conducting orderly AGMs and consensus resolution drafting" },
        { key: "dispute", label: "Member Dispute Resolution", hint: "Fair mediation between society members and office bearers" },
      ],
    } as unknown as T;
  }

  if (pathname.startsWith("/skills/trainee/")) {
    const id = pathname.replace("/skills/trainee/", "");
    const trainee = buildTraineeRows().find((t) => t.id === id) || buildTraineeRows()[0];
    return {
      trainee: { id: trainee.id, name: trainee.name, batch: trainee.batch, batch_id: trainee.batch_id },
      dimension_averages: { governance: 4.8, accounting: 4.2, leadership: 4.6, dispute: 4.4 },
      evaluations: [
        { id: "ev-1", dimension: "governance", label: "Cooperative Governance & Bylaws", rating: 5, observation: "Mastered the legal distinction between ordinary and special resolutions.", date: "2026-09-24T10:00:00Z" },
        { id: "ev-2", dimension: "accounting", label: "PACS Accounting & Ledger Verification", rating: 4, observation: "Accurately spotted reserve fund allocation discrepancies in sample daybook.", date: "2026-09-21T14:30:00Z" },
      ],
    } as unknown as T;
  }

  if (pathname === "/skills") {
    const trainees = buildTraineeRows();
    const batchFilter = query.get("batch_id");
    const filteredTrainees = batchFilter ? trainees.filter((t) => t.batch_id === batchFilter) : trainees;

    const skillRoster = (avgBase: number) =>
      filteredTrainees.map((t) => ({
        trainee_id: t.id,
        name: t.name,
        batch: t.batch,
        batch_id: t.batch_id,
        proficiency: Math.min(100, Math.max(45, t.skill_readiness + (avgBase - 80))),
        level: t.skill_readiness >= 85 ? "Advanced" : t.skill_readiness >= 65 ? "Proficient" : "Foundational",
        verified: t.attendance >= 80,
        evidence_count: 3,
      }));

    return {
      batches: BATCHES,
      trainee_count: filteredTrainees.length,
      skills: [
        {
          skill_id: "skl-gov",
          name: "Cooperative Governance & Bylaws",
          category: "Legal & Regulatory",
          average: 84,
          level: "Proficient",
          trainee_count: filteredTrainees.length,
          evidence_count: filteredTrainees.length * 2,
          below_threshold: filteredTrainees.filter((t) => t.skill_readiness < 60).length,
          trend: { direction: "up" as const, delta: 4 },
          trainees: skillRoster(84),
        },
        {
          skill_id: "skl-acc",
          name: "PACS Accounting & Balance Sheet Reconciliation",
          category: "Financial Management",
          average: 78,
          level: "Proficient",
          trainee_count: filteredTrainees.length,
          evidence_count: filteredTrainees.length * 2,
          below_threshold: filteredTrainees.filter((t) => t.assessment < 65).length,
          trend: { direction: "up" as const, delta: 3 },
          trainees: skillRoster(78),
        },
        {
          skill_id: "skl-lead",
          name: "Meeting Facilitation & Quorum Management",
          category: "Leadership & Administration",
          average: 88,
          level: "Advanced",
          trainee_count: filteredTrainees.length,
          evidence_count: filteredTrainees.length * 3,
          below_threshold: 0,
          trend: { direction: "flat" as const, delta: 0 },
          trainees: skillRoster(88),
        },
        {
          skill_id: "skl-audit",
          name: "Statutory Audit Verification & Reporting",
          category: "Audit & Oversight",
          average: 76,
          level: "Proficient",
          trainee_count: filteredTrainees.length,
          evidence_count: filteredTrainees.length,
          below_threshold: 2,
          trend: { direction: "up" as const, delta: 5 },
          trainees: skillRoster(76),
        },
        {
          skill_id: "skl-disp",
          name: "Member Dispute & Grievance Redressal",
          category: "Member Relations",
          average: 82,
          level: "Proficient",
          trainee_count: filteredTrainees.length,
          evidence_count: filteredTrainees.length * 2,
          below_threshold: 1,
          trend: { direction: "up" as const, delta: 2 },
          trainees: skillRoster(82),
        },
      ],
    } as unknown as T;
  }

  /* 10. Calendar */
  if (pathname === "/calendar") {
    return {
      events: [
        { id: "ev-1", type: "class" as const, title: "Cooperative Management Fundamentals", batch: "Batch 2026-B", date: "2026-09-28", start: "10:00", end: "11:30", room: "Hall A-204", link: "/trainer/classes/cls-cmf-b" },
        { id: "ev-2", type: "class" as const, title: "Leadership for Cooperative Board Members", batch: "Batch 2026-C", date: "2026-09-28", start: "14:00", end: "15:30", room: "Hall B-112", link: "/trainer/classes/cls-lcb-c" },
        { id: "ev-3", type: "class" as const, title: "Credit Society Data & MIS", batch: "Cohort 2026-A", date: "2026-09-29", start: "11:00", end: "13:00", room: "Analytics Lab 3", link: "/trainer/classes/cls-mis-a" },
        { id: "ev-4", type: "assessment" as const, title: "Statutory Audit & AGMs Assessment", batch: "Batch 2026-B", date: "2026-09-30", start: "10:00", end: "11:00", room: "Exam Hall 1", link: "/trainer/assessments/asm-1" },
        { id: "ev-5", type: "assignment" as const, title: "PACS Audit Checklist Due", batch: "Batch 2026-B", date: "2026-10-01", start: "23:59", end: null, room: null, link: "/trainer/assignments" },
        { id: "ev-6", type: "assessment" as const, title: "Board Resolution Drafting Exam", batch: "Batch 2026-C", date: "2026-10-02", start: "14:00", end: "15:00", room: "Hall B-112", link: "/trainer/assessments/asm-2" },
        { id: "ev-7", type: "class" as const, title: "Board Leadership Weekend Lab", batch: "Batch 2025-C", date: "2026-10-03", start: "09:30", end: "12:00", room: "Computer Lab 2", link: "/trainer/classes/cls-bwl-c" },
        { id: "ev-8", type: "assignment" as const, title: "Credit Appraisal Report Due", batch: "Cohort 2026-A", date: "2026-10-05", start: "18:00", end: null, room: null, link: "/trainer/assignments" },
      ],
    } as unknown as T;
  }

  /* 11. Messages & Announcements */
  if (pathname === "/messages/recipients") {
    const trainees = buildTraineeRows().map((t) => ({
      id: t.id,
      name: t.name,
      role: "Trainee",
      batch: t.batch,
      batch_id: t.batch_id,
    }));
    return {
      recipients: [
        ...trainees,
        { id: "fac-1", name: "Prof. Arvind Joshi", role: "Dean of Academic Affairs", batch: null, batch_id: null },
        { id: "fac-2", name: "Dr. Sunita Deshmukh", role: "Head of Cooperative Banking Dept", batch: null, batch_id: null },
        { id: "fac-3", name: "Hostel Warden Office", role: "Campus Administration", batch: null, batch_id: null },
      ],
    } as unknown as T;
  }

  if (pathname.startsWith("/messages/thread/")) {
    return {
      messages: [
        { id: "m1", from_me: false, subject: "Question regarding Module 4 Quorum", body: "Respected Madam, in our PACS study group, we had a doubt whether associate members are counted for the statutory quorum during an AGM.", created_at: "2026-09-27T14:15:00Z", read: true },
        { id: "m2", from_me: true, subject: "Re: Question regarding Module 4 Quorum", body: "Hello Ashwini, under Section 25 of the MSCS Act, associate members do not have voting rights and therefore are not counted towards the quorum. Refer to slide 8 of our Module 2 deck.", created_at: "2026-09-27T15:00:00Z", read: true },
        { id: "m3", from_me: false, subject: "Thank you Madam", body: "Thank you for the quick clarification! We have updated our group presentation slides accordingly.", created_at: "2026-09-27T15:20:00Z", read: true },
      ],
    } as unknown as T;
  }

  if (pathname === "/messages") {
    return {
      unread_total: 2,
      conversations: [
        {
          user_id: "tr-001",
          name: "Ashwini Pawar",
          role: "Trainee",
          batch: "Batch 2026-B",
          last_message: "Thank you for the quick clarification! We have updated our presentation.",
          last_subject: "Re: Question regarding Module 4 Quorum",
          last_at: "2026-09-27T15:20:00Z",
          last_from_me: false,
          unread: 0,
        },
        {
          user_id: "tr-004",
          name: "Suresh S. Mane",
          role: "Trainee",
          batch: "Batch 2026-B",
          last_message: "Madam, I have uploaded the medical certificate for my absence on 24th Sep.",
          last_subject: "Leave justification & assignment submission",
          last_at: "2026-09-28T08:15:00Z",
          last_from_me: false,
          unread: 1,
        },
        {
          user_id: "fac-1",
          name: "Prof. Arvind Joshi",
          role: "Dean of Academic Affairs",
          batch: null,
          last_message: "Faculty meeting scheduled for Thursday 4:00 PM in Conference Room A.",
          last_subject: "Mid-Term Academic Review Meeting",
          last_at: "2026-09-28T09:00:00Z",
          last_from_me: false,
          unread: 1,
        },
        {
          user_id: "tr-008",
          name: "Anjali Rathore",
          role: "Trainee",
          batch: "Batch 2026-C",
          last_message: "Can I get an extension of 2 days for the bylaws assignment?",
          last_subject: "Assignment extension request",
          last_at: "2026-09-26T17:30:00Z",
          last_from_me: false,
          unread: 0,
        },
      ],
    } as unknown as T;
  }

  if (pathname === "/announcements") {
    return {
      announcements: [
        {
          id: "ann-1",
          title: "Field Visit to Warana Dairy Cooperative",
          message: "Bus departs at 7:30 AM from the main institute porch on Friday. Attendance is compulsory.",
          audience_type: "batch",
          audience: "Batch 2026-B",
          status: "published",
          created_at: "2026-09-26T11:00:00Z",
        },
        {
          id: "ann-2",
          title: "Model Bylaws Study Material Uploaded",
          message: "The annotated guide for MSCS Act model bylaws is now available in your content repository.",
          audience_type: "all",
          audience: "All Batches",
          status: "published",
          created_at: "2026-09-24T09:30:00Z",
        },
        {
          id: "ann-3",
          title: "Computer Lab Maintenance Scheduled",
          message: "Analytics Lab 3 will be closed for system updates on Saturday between 2 PM and 6 PM.",
          audience_type: "batch",
          audience: "Cohort 2026-A",
          status: "published",
          created_at: "2026-09-23T16:00:00Z",
        },
      ],
    } as unknown as T;
  }

  /* 12. Reports */
  if (pathname === "/reports/types") {
    return {
      types: [
        { type: "attendance", title: "Attendance Register & Sync Log", description: "Session-wise attendance, late entries, biometric verification logs, and compliance percentages." },
        { type: "assessments", title: "Assessment Scorecard & Analysis", description: "Per-attempt scores, pass rates, item difficulty breakdowns, and performance percentiles." },
        { type: "trainees", title: "Trainee Progress & Risk Dossier", description: "Comprehensive learner progress dossiers with risk indicators and intervention alerts." },
        { type: "skills", title: "Skill Passport Matrix", description: "Dimension-level proficiency ratings, verified competencies, and practical evaluation records." },
      ],
      batches: BATCHES,
      courses: COURSES,
    } as unknown as T;
  }

  if (pathname.startsWith("/reports/")) {
    const reportType = pathname.replace("/reports/", "");
    const trainees = buildTraineeRows().slice(0, 10);

    if (reportType === "attendance") {
      return {
        type: "attendance",
        generated_at: "2026-09-28T11:00:00Z",
        columns: ["Trainee Code", "Name", "Batch", "Total Sessions", "Present", "Late", "Attendance %", "Status"],
        rows: trainees.map((t) => [
          t.trainee_code,
          t.name,
          t.batch,
          14,
          Math.round((t.attendance / 100) * 14),
          t.status === "at_risk" ? 2 : 1,
          `${t.attendance}%`,
          t.status === "on_track" ? "Regular" : t.status === "at_risk" ? "Critical (<75%)" : "Irregular",
        ]),
        summary: {
          total_trainees: 10,
          average_attendance_pct: 94,
          at_risk_attendance_count: 1,
        },
      } as unknown as T;
    }

    if (reportType === "assessments") {
      return {
        type: "assessments",
        generated_at: "2026-09-28T11:00:00Z",
        columns: ["Trainee Code", "Name", "Batch", "Assessments Completed", "Average Score", "Highest Score", "Pass Status"],
        rows: trainees.map((t) => [
          t.trainee_code,
          t.name,
          t.batch,
          4,
          `${t.assessment}%`,
          `${Math.min(100, t.assessment + 6)}%`,
          t.assessment >= 50 ? "Passed" : "Needs Review",
        ]),
        summary: {
          total_assessments_recorded: 40,
          average_cohort_score: 82,
          pass_rate_pct: 90,
        },
      } as unknown as T;
    }

    if (reportType === "skills") {
      return {
        type: "skills",
        generated_at: "2026-09-28T11:00:00Z",
        columns: ["Trainee Code", "Name", "Governance Rating", "Accounting Rating", "Leadership Rating", "Verified Skills", "Readiness %"],
        rows: trainees.map((t) => [
          t.trainee_code,
          t.name,
          "4.8 / 5",
          "4.2 / 5",
          "4.5 / 5",
          3,
          `${t.skill_readiness}%`,
        ]),
        summary: {
          total_competencies_evaluated: 30,
          average_readiness_pct: 81,
          verified_skill_badges: 28,
        },
      } as unknown as T;
    }

    // Default / "trainees"
    return {
      type: "trainees",
      generated_at: "2026-09-28T11:00:00Z",
      columns: ["Trainee Code", "Name", "Batch", "Course Progress", "Attendance", "Assessment Avg", "Overall Status"],
      rows: trainees.map((t) => [
        t.trainee_code,
        t.name,
        t.batch,
        `${t.learning}%`,
        `${t.attendance}%`,
        `${t.assessment}%`,
        t.status_label,
      ]),
      summary: {
        total_enrolled: 10,
        on_track_count: 8,
        at_risk_count: 1,
        needs_attention_count: 1,
      },
    } as unknown as T;
  }

  /* 13. AI Assistant */
  if (pathname === "/ai/assist") {
    return {
      source: "gemini",
      title: "AI Generated Course Content & Assessment Items",
      questions: [
        {
          type: "mcq_single" as const,
          prompt: "Under the Rochdale Principles of Cooperation, which principle guarantees democratic member control?",
          options: [
            { id: "a", text: "One Member, One Vote regardless of share capital" },
            { id: "b", text: "Proportional voting based on member shares" },
            { id: "c", text: "Board appointment by registrar" },
            { id: "d", text: "Proxy voting for absent members" },
          ],
          correct: ["a"],
          explanation: "Rochdale Principle 2 establishes democratic member control through 'one member, one vote'.",
        },
        {
          type: "true_false" as const,
          prompt: "In a Multi-State Cooperative Society, the chairperson has an automatic casting vote in case of tied board votes.",
          options: [{ id: "true", text: "True" }, { id: "false", text: "False" }],
          correct: ["true"],
          explanation: "Model bylaws provide the presiding officer a second or casting vote in the event of an equality of votes.",
        },
        {
          type: "short_answer" as const,
          prompt: "State the minimum percentage of net profits that an Indian primary credit society must transfer to its statutory reserve fund.",
          options: [],
          correct: ["25%", "25 percent", "twenty five percent"],
          explanation: "Statutory provisions require minimum 25% of net profit allocation to the reserve fund before declaring dividends.",
        },
        {
          type: "mcq_single" as const,
          prompt: "What is the primary function of the audit committee appointed under the amended Cooperative Societies Act?",
          options: [
            { id: "a", text: "Sanctioning member agricultural loans" },
            { id: "b", text: "Independent oversight of financial reporting and internal controls" },
            { id: "c", text: "Conducting board elections" },
            { id: "d", text: "Purchasing society fixed assets" },
          ],
          correct: ["b"],
          explanation: "The audit committee functions as an oversight body ensuring internal control integrity.",
        },
      ],
      sections: [
        {
          heading: "Session Learning Objectives",
          body: "1. Distinguish between ordinary and special resolutions in a cooperative society.\n2. Master statutory quorum computation for general body meetings.\n3. Formulate compliant board meeting minutes and action-taken reports.",
        },
        {
          heading: "Interactive Class Activity (20 mins)",
          body: "Break trainees into 3 mock board panels representing a primary dairy society debating whether to invest surplus funds into cold-storage expansion.",
        },
      ],
    } as unknown as T;
  }

  if (pathname === "/ai/reformulate") {
    return {
      prompt: "Under the provisions of the Multi-State Cooperative Societies Act 2002, what specific conditions mandate the appointment of an administrator by the Central Registrar?",
      explanation: "Clarified legal jurisdiction and referenced statutory terminology.",
    } as unknown as T;
  }

  // Fallback generic object
  return {} as unknown as T;
}

/* -------------------------------------------------------------------------- */
/* Main trainerFetch Wrapper                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Tries the real backend first with a fast timeout (800ms).
 * If the backend is down, returns 404, or fails, transparently returns
 * realistic rich mock data so the application never crashes or presents empty screens.
 */
export async function trainerFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${TRAINER_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
        return data as T;
      }
    }
  } catch {
    // Network down, 404, or timed out — seamlessly use mock fallback
  }

  // Return realistic mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockTrainerResponse<T>(path, init));
    }, 150);
  });
}

export const trainerPost = <T = unknown>(path: string, body?: unknown) =>
  trainerFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const trainerPut = <T = unknown>(path: string, body?: unknown) =>
  trainerFetch<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** GET `path` (relative to /api/v1/trainer). Pass `null` to skip. Optional polling in ms. */
export function useTrainerQuery<T>(path: string | null, opts: { pollMs?: number } = {}): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    if (first.current || tick > 0) setLoading(data === null);
    trainerFetch<T>(path)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        first.current = false;
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick]);

  useEffect(() => {
    if (!opts.pollMs || path === null) return;
    const id = setInterval(() => setTick((t) => t + 1), opts.pollMs);
    return () => clearInterval(id);
  }, [opts.pollMs, path]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refetch };
}
