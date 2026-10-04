import {
  LIVE_SESSION_ID,
  TRAINER_CAMPUS,
  TRAINER_TODAY,
  assignmentById,
  assessmentById,
  assessmentFilters,
  batchName,
  buildAttemptDetail,
  classById,
  classesOfBatch,
  courseById,
  portalAnnouncements,
  portalAssessments,
  portalAssignments,
  portalAttendanceHistory,
  portalBatches,
  portalCalendarEvents,
  portalClassOptions,
  portalClasses,
  portalContentItems,
  portalConversations,
  portalCourses,
  portalModules,
  portalSkillDimensions,
  portalSkills,
  portalTrainees,
  questionBankFor,
  recipientsList,
  sessionById,
  slotFor,
  threadFor,
  traineesOfBatch,
  trainerProfile,
  type PortalTrainee,
} from "@/lib/mock-data/trainer";

export class TrainerApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TrainerApiError";
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/* Shared derivations                                                          */
/* -------------------------------------------------------------------------- */

const ATTENDANCE_TREND = [
  { date: "2026-09-18", attendance: 89 },
  { date: "2026-09-20", attendance: 92 },
  { date: "2026-09-22", attendance: 90 },
  { date: "2026-09-23", attendance: 94 },
  { date: "2026-09-24", attendance: 91 },
  { date: "2026-09-25", attendance: 97 },
  { date: "2026-09-27", attendance: 93 },
  { date: "2026-09-28", attendance: 95 },
];

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

function attendanceSlots(batchId: string | null, courseId: string | null) {
  const rows: {
    slot_id: string;
    date: string;
    class_id: string;
    status: "not_started" | "live" | "completed";
    session_id: string | null;
    present: number | null;
  }[] = [
    { slot_id: "s-today-1", date: TRAINER_TODAY, class_id: "cls-cmf-b", status: "live", session_id: LIVE_SESSION_ID, present: 9 },
    { slot_id: "s-today-2", date: TRAINER_TODAY, class_id: "cls-lcb-c", status: "not_started", session_id: null, present: null },
    { slot_id: "s-up-1", date: "2026-09-30", class_id: "cls-cmf-b", status: "not_started", session_id: null, present: null },
    { slot_id: "s-up-2", date: "2026-10-07", class_id: "cls-cmf-b", status: "not_started", session_id: null, present: null },
    { slot_id: "s-up-3", date: "2026-10-02", class_id: "cls-mis-a", status: "not_started", session_id: null, present: null },
    { slot_id: "s-up-4", date: "2026-10-03", class_id: "cls-bwl-c", status: "not_started", session_id: null, present: null },
    { slot_id: "s-up-5", date: "2026-10-06", class_id: "cls-lcb-c", status: "not_started", session_id: null, present: null },
  ];
  return rows
    .map((r) => {
      const klass = classById(r.class_id);
      return {
        ...slotFor(klass, r.date, r.slot_id),
        roster: klass.trainees,
        status: r.status,
        session_id: r.session_id,
        present: r.present,
      };
    })
    .filter(
      (s) => (!batchId || s.batch_id === batchId) && (!courseId || s.course_id === courseId),
    );
}

type AttStatus = "present" | "absent" | "late" | "excused";

const CHECK_IN_ORDER: AttStatus[] = ["present", "late", "excused", "absent"];

function rosterFor(session: (typeof portalAttendanceHistory)[number]) {
  const counts: Record<AttStatus, number> = {
    present: session.present,
    late: session.late,
    excused: session.excused,
    absent: session.absent,
  };
  const roster = traineesOfBatch(session.batch_id).slice(0, session.roster);
  const statuses: AttStatus[] = [];
  for (const status of CHECK_IN_ORDER) {
    for (let i = 0; i < counts[status]; i += 1) statuses.push(status);
  }
  while (statuses.length < roster.length) statuses.push("present");
  const startMinutes =
    Number(classById(session.class_id).start.slice(0, 2)) * 60 +
    Number(classById(session.class_id).start.slice(3, 5));
  const minutesOfDay = (offset: number) => {
    const total = startMinutes + 2 + offset;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  return roster.map((t, i) => {
    const status = statuses[i] ?? "present";
    return {
      trainee_id: t.id,
      name: t.name,
      initials: initialsOf(t.name),
      code: t.trainee_code,
      status,
      marked: true,
      method: status === "late" || status === "absent" ? "Manual" : "QR",
      time: status === "absent" ? null : `${minutesOfDay(i)}`,
    };
  });
}

function sessionState(sessionId: string) {
  const session = sessionById(sessionId);
  const roster = rosterFor(session);
  const now = Date.now();
  const opensAt = session.live ? new Date(now - 6 * 60 * 1000).toISOString() : session.opens_at;
  const closesAt = session.live ? new Date(now + 24 * 60 * 1000).toISOString() : session.closes_at;
  const countOf = (status: AttStatus) => roster.filter((r) => r.status === status).length;
  const present = countOf("present") + countOf("late");
  return {
    id: session.session_id,
    name: session.name,
    course: session.course,
    batch: session.batch,
    room: classById(session.class_id).room,
    methods: ["QR", "Manual"],
    status: (session.live ? "live" : "closed") as "live" | "closed",
    opens_at: opensAt,
    closes_at: closesAt,
    seconds_left: session.live ? 24 * 60 : 0,
    present,
    late: countOf("late"),
    roster_size: session.roster,
    qr: session.live ? `NURVEX-SESSION-${session.session_id.toUpperCase()}-ROTATE-9F2A` : null,
    qr_expires_in: session.live ? 15 : null,
    percentage: session.roster ? Math.round((present / session.roster) * 100) : 0,
    counts: {
      present: countOf("present"),
      absent: countOf("absent"),
      late: countOf("late"),
      excused: countOf("excused"),
    },
    recent: roster
      .filter((r) => r.status === "present" || r.status === "late")
      .slice(0, 5)
      .map((r) => ({
        trainee_id: r.trainee_id,
        name: r.name,
        time: `${r.time ?? ""}`,
        method: r.method ?? "QR",
        status: r.status,
      })),
    roster,
  };
}

function historyRows(batchId: string | null, courseId: string | null, q: string, from: string, to: string) {
  const needle = q.trim().toLowerCase();
  return portalAttendanceHistory
    .filter(
      (s) =>
        (!batchId || s.batch_id === batchId) &&
        (!courseId || s.course_id === courseId) &&
        (!from || s.date >= from) &&
        (!to || s.date <= to) &&
        (!needle ||
          `${s.name} ${s.course} ${s.batch} ${s.date}`.toLowerCase().includes(needle)),
    )
    .map((s) => ({
      session_id: s.session_id,
      date: s.date,
      time: s.time,
      name: s.name,
      course: s.course,
      batch: s.batch,
      present: s.present,
      late: s.late,
      excused: s.excused,
      absent: s.absent,
      roster: s.roster,
      percentage: s.roster ? Math.round(((s.present + s.late) / s.roster) * 100) : null,
    }));
}

function attendanceOptions() {
  return {
    batches: portalBatches,
    courses: portalCourses.map((c) => ({ id: c.id, title: c.title })),
    classes: portalClassOptions,
  };
}

function classDetail(id: string) {
  const klass = classById(id);
  const roster = traineesOfBatch(klass.batch_id);
  const classAssessments = portalAssessments.filter((a) => a.course_id === klass.course_id);
  const classAssignments = portalAssignments.filter((a) => a.course_id === klass.course_id);
  const classSessions = portalAttendanceHistory.filter((s) => s.class_id === klass.id);
  const content = portalContentItems.filter((i) => i.course_id === klass.course_id);
  const progressBuckets = [
    { bucket: "0-25%", trainees: roster.filter((t) => t.learning < 26).length },
    { bucket: "26-50%", trainees: roster.filter((t) => t.learning >= 26 && t.learning < 51).length },
    { bucket: "51-75%", trainees: roster.filter((t) => t.learning >= 51 && t.learning < 76).length },
    { bucket: "76-100%", trainees: roster.filter((t) => t.learning >= 76).length },
  ];
  return {
    id: klass.id,
    course: { id: klass.course_id, title: klass.course, category: klass.category },
    batch: { id: klass.batch_id, name: klass.batch_label, venue: TRAINER_CAMPUS },
    room: klass.room,
    overview: {
      course_progress: klass.progress,
      trainees: roster.length,
      average_attendance: klass.attendance,
      average_assessment: klass.average_assessment,
      completion_rate: klass.completion_rate,
    },
    charts: {
      learning_progress: progressBuckets,
      attendance_trend: ATTENDANCE_TREND.map((p) => ({ date: p.date, attendance: p.attendance })),
      assessment_performance: classAssessments
        .filter((a) => a.avg_score !== null)
        .map((a) => ({
          assessment: a.module,
          average: a.avg_score ?? 0,
          pass_rate: Math.min(100, (a.avg_score ?? 0) + 6),
        })),
    },
    at_risk_trainees: roster.filter((t) => t.status === "at_risk"),
    trainees: roster,
    attendance_sessions: classSessions.map((s) => ({
      id: s.session_id,
      name: s.name,
      date: s.date,
      room: klass.room,
      present: s.present,
      late: s.late,
      absent: s.absent,
      excused: s.excused,
      attendance: s.roster ? Math.round(((s.present + s.late) / s.roster) * 100) : 0,
    })),
    assessments: classAssessments.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      scheduled_at: a.scheduled_at,
      questions: a.questions,
      duration_minutes: a.duration_minutes,
      submitted: a.submitted,
      average: a.avg_score,
      pass_rate: a.avg_score === null ? null : Math.min(100, a.avg_score + 6),
    })),
    assignments: classAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      deadline: a.deadline,
      assigned: a.assigned,
      submitted: a.submitted,
      pending: a.assigned - a.submitted,
      graded: a.graded,
      status: a.status,
    })),
    announcements: portalAnnouncements.filter(
      (a) => a.audience === "All Batches" || a.audience === klass.batch_label,
    ),
    content: content.map((c) => ({
      id: c.id,
      title: c.title,
      position: c.number,
      duration_minutes: c.duration_min,
      type: c.type_label,
    })),
  };
}

function traineeDetail(id: string) {
  const t = (portalTrainees.find((x) => x.id === id) ?? portalTrainees[0]) as PortalTrainee;
  const klass = classById(portalClasses.find((c) => c.batch_id === t.batch_id)?.id);
  return {
    profile: {
      id: t.id,
      trainee_code: t.trainee_code,
      name: t.name,
      batch: t.batch,
      batch_id: t.batch_id,
      status: t.status,
      status_label: t.status_label,
    },
    performance: {
      learning: t.learning,
      attendance: t.attendance,
      assessment: t.assessment,
      assignment: t.assignment,
      skill_readiness: t.skill_readiness,
      last_activity: t.last_activity,
      inactive_days: t.inactive_days,
      risk_reasons: t.risk_reasons,
    },
    courses: [
      {
        class_id: klass.id,
        course: klass.course,
        progress: t.learning,
        last_accessed: t.last_activity,
      },
    ],
    assessments: portalAssessments
      .filter((a) => a.course_id === klass.course_id && a.avg_score !== null)
      .map((a) => ({
        assessment_id: a.id,
        attempt_id: `${a.id === "asm-1" ? "att" : "att"}-${t.id}`,
        title: a.title,
        score: Math.max(30, Math.min(98, t.assessment + (a.id === "asm-1" ? 0 : 4))),
        passed: t.assessment >= 50,
        status: t.assessment >= 50 ? "Passed" : "Needs Review",
        submitted_at: a.scheduled_at,
      })),
    assignments: portalAssignments
      .filter((a) => a.course_id === klass.course_id)
      .map((a, i) => ({
        id: a.id,
        title: a.title,
        deadline: a.deadline,
        status: i === 0 ? "graded" : "submitted",
        marks: i === 0 ? Math.min(a.max_marks, t.assignment + 4) : null,
        max_marks: a.max_marks,
      })),
    skills: [
      { skill: "Cooperative Governance", proficiency: t.skill_readiness, level: "Advanced", verified: true },
      { skill: "Bylaws Drafting & Amendment", proficiency: Math.max(50, t.skill_readiness - 4), level: "Proficient", verified: true },
      { skill: "PACS Financial Statements", proficiency: Math.max(45, t.skill_readiness - 8), level: "Proficient", verified: t.skill_readiness > 70 },
      { skill: "Meeting Quorum & Minutes", proficiency: Math.min(95, t.skill_readiness + 6), level: "Advanced", verified: true },
    ],
    certificates: [
      { id: "cert-01", programme: "Cooperative Governance Foundation", issued: "2026-08-15", grade: "A+" },
      { id: "cert-02", programme: "PACS Digital Accounting Essentials", issued: "2026-07-28", grade: "A" },
    ],
    observations: [
      { id: "obs-01", dimension: "governance", rating: 5, observation: "Demonstrated excellent leadership during the mock board quorum exercise.", created_at: "2026-09-24T12:00:00Z" },
      { id: "obs-02", dimension: "accounting", rating: 4, observation: "Quick at calculating statutory reserve allocations.", created_at: "2026-09-22T15:30:00Z" },
    ],
    recent_activity: [
      { type: "attendance", text: "Scanned the QR code for Session 14 (Present)", at: "2026-09-28T04:32:00Z" },
      { type: "assessment", text: "Completed the Module 3 practice quiz", at: "2026-09-26T15:20:00Z" },
      { type: "assignment", text: "Submitted the draft PACS audit checklist", at: "2026-09-25T17:00:00Z" },
    ],
  };
}

function assessmentDetail(id: string) {
  const a = assessmentById(id);
  const roster = traineesOfBatch(a.batch_id);
  const questions = questionBankFor(a.id);
  const rows = roster.map((t, i) => {
    const submitted = i < a.submitted;
    const needsReview = a.needs_review > 0 && i < a.needs_review;
    const score = submitted ? Math.max(30, Math.min(98, t.assessment - 3 + (i % 5))) : null;
    const status = !submitted
      ? ("Pending" as const)
      : needsReview
        ? ("Needs Review" as const)
        : (score ?? 0) >= a.passing_score
          ? ("Passed" as const)
          : ("Failed" as const);
    return {
      trainee_id: t.id,
      trainee: t.name,
      score,
      status,
      attempt_no: submitted ? 1 : null,
      submitted_at: submitted ? "2026-09-28T05:10:00Z" : null,
      attempt_id: submitted ? `att-${t.id}` : null,
    };
  });
  const scored = rows.filter((r) => r.score !== null);
  return {
    assessment: {
      id: a.id,
      title: a.title,
      course: a.course,
      course_id: a.course_id,
      module: a.module,
      batch: batchName(a.batch_id),
      batch_id: a.batch_id,
      description: a.description,
      instructions: a.instructions,
      duration_minutes: a.duration_minutes,
      passing_score: a.passing_score,
      scheduled_at: a.scheduled_at,
      status: a.status,
      questions,
    },
    totals: {
      total_trainees: roster.length,
      submitted: scored.length,
      pending: rows.length - scored.length,
      needs_review: rows.filter((r) => r.status === "Needs Review").length,
      avg_score: a.avg_score,
      pass_rate:
        scored.length === 0
          ? null
          : Math.round(
              (scored.filter((r) => r.status === "Passed").length + scored.filter((r) => r.status === "Needs Review").length) /
                scored.length *
                100,
            ),
    },
    rows,
  };
}

function assignmentDetail(id: string) {
  const a = assignmentById(id);
  const roster = traineesOfBatch(a.batch_id);
  const rows = roster.map((t, i) => {
    const submitted = i < a.submitted;
    const graded = i < a.graded;
    const late = submitted && !graded && i % 3 === 0;
    return {
      trainee_id: t.id,
      trainee: t.name,
      submission_id: submitted ? `sub-${t.id}` : null,
      status: (graded ? "graded" : late ? "late" : submitted ? "submitted" : "pending") as
        | "graded"
        | "late"
        | "submitted"
        | "pending",
      submitted_at: submitted ? "2026-09-27T16:20:00Z" : null,
      content: submitted
        ? "1. Cash in safe verified daily against the daybook balance.\n2. Gold loan appraisals countersigned by two officers.\n3. 25% of net profit transferred to the statutory reserve before any dividend."
        : null,
      file_url: submitted ? "#" : null,
      marks: graded ? Math.min(a.max_marks, t.assignment + 4) : null,
      feedback: graded ? "Well organised checklist that addresses the key prudential norms." : null,
    };
  });
  const marks = rows.map((r) => r.marks).filter((m): m is number => m !== null);
  return {
    assignment: {
      id: a.id,
      title: a.title,
      description: a.description,
      batch: batchName(a.batch_id),
      course: courseById(a.course_id)?.title ?? null,
      deadline: a.deadline,
      max_marks: a.max_marks,
      resources: a.resources,
      status: a.status,
    },
    totals: {
      assigned: a.assigned,
      submitted: a.submitted,
      pending: a.assigned - a.submitted,
      graded: a.graded,
      to_grade: Math.max(0, a.submitted - a.graded),
      avg_marks: marks.length ? Math.round(marks.reduce((x, y) => x + y, 0) / marks.length) : null,
    },
    rows,
  };
}

function skillsPayload(batchId: string | null) {
  const roster = traineesOfBatch(batchId);
  return {
    batches: portalBatches,
    trainee_count: roster.length,
    skills: portalSkills.map((s) => ({
      skill_id: s.skill_id,
      name: s.name,
      category: s.category,
      average: s.average,
      level: s.level,
      trainee_count: roster.length,
      evidence_count: Math.round((s.evidence_count * roster.length) / portalTrainees.length),
      below_threshold: roster.filter((t) => t.skill_readiness < 60).length,
      trend: s.trend,
      trainees: roster.map((t) => ({
        trainee_id: t.id,
        name: t.name,
        batch: t.batch,
        batch_id: t.batch_id,
        proficiency: Math.max(40, Math.min(100, t.skill_readiness + (s.average - 80))),
        level: t.skill_readiness >= 85 ? "Advanced" : t.skill_readiness >= 65 ? "Proficient" : "Foundational",
        verified: t.attendance >= 80,
        evidence_count: Math.max(1, Math.round(s.evidence_count / portalTrainees.length)),
      })),
    })),
  };
}

function reportPayload(type: string, batchId: string | null, courseId: string | null) {
  const roster = traineesOfBatch(batchId);
  const scoped = courseId
    ? roster.filter((t) => t.batch_id === classesOfBatch(batchId).find((c) => c.course_id === courseId)?.batch_id)
    : roster;
  const list = scoped.length ? scoped : roster;
  if (type === "attendance") {
    return {
      type: "attendance",
      generated_at: "2026-09-28T11:00:00Z",
      columns: ["Trainee Code", "Name", "Batch", "Total Sessions", "Present", "Late", "Attendance %", "Status"],
      rows: list.map((t) => [
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
        total_trainees: list.length,
        average_attendance_pct: avg(list.map((t) => t.attendance)),
        at_risk_attendance_count: list.filter((t) => t.attendance < 75).length,
      },
    };
  }
  if (type === "assessments") {
    return {
      type: "assessments",
      generated_at: "2026-09-28T11:00:00Z",
      columns: ["Trainee Code", "Name", "Batch", "Assessments Completed", "Average Score", "Highest Score", "Pass Status"],
      rows: list.map((t) => [
        t.trainee_code,
        t.name,
        t.batch,
        4,
        `${t.assessment}%`,
        `${Math.min(100, t.assessment + 6)}%`,
        t.assessment >= 50 ? "Passed" : "Needs Review",
      ]),
      summary: {
        total_assessments_recorded: list.length * 4,
        average_cohort_score: avg(list.map((t) => t.assessment)),
        pass_rate_pct: Math.round(
          (list.filter((t) => t.assessment >= 50).length / Math.max(1, list.length)) * 100,
        ),
      },
    };
  }
  if (type === "skills") {
    return {
      type: "skills",
      generated_at: "2026-09-28T11:00:00Z",
      columns: ["Trainee Code", "Name", "Governance Rating", "Accounting Rating", "Leadership Rating", "Verified Skills", "Readiness %"],
      rows: list.map((t) => [
        t.trainee_code,
        t.name,
        `${round1(Math.min(5, 3 + t.skill_readiness / 40))} / 5`,
        `${round1(Math.min(5, 2.6 + t.skill_readiness / 45))} / 5`,
        `${round1(Math.min(5, 2.9 + t.skill_readiness / 38))} / 5`,
        t.skill_readiness >= 70 ? 4 : 3,
        `${t.skill_readiness}%`,
      ]),
      summary: {
        total_competencies_evaluated: list.length * portalSkills.length,
        average_readiness_pct: avg(list.map((t) => t.skill_readiness)),
        verified_skill_badges: list.filter((t) => t.skill_readiness >= 70).length * 4,
      },
    };
  }
  return {
    type: "trainees",
    generated_at: "2026-09-28T11:00:00Z",
    columns: ["Trainee Code", "Name", "Batch", "Course Progress", "Attendance", "Assessment Avg", "Overall Status"],
    rows: list.map((t) => [
      t.trainee_code,
      t.name,
      t.batch,
      `${t.learning}%`,
      `${t.attendance}%`,
      `${t.assessment}%`,
      t.status_label,
    ]),
    summary: {
      total_enrolled: list.length,
      on_track_count: list.filter((t) => t.status === "on_track").length,
      at_risk_count: list.filter((t) => t.status === "at_risk").length,
      needs_attention_count: list.filter((t) => t.status === "needs_attention").length,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Mock resolver                                                               */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/* Mock resolver                                                               */
/* -------------------------------------------------------------------------- */

export function resolveTrainerMock<T = unknown>(
  path: string,
  initOrMethod: RequestInit | string = "GET",
  maybeBody: unknown = {}
): T {
  const init: RequestInit =
    typeof initOrMethod === "string"
      ? {
          method: initOrMethod,
          body:
            maybeBody !== undefined && typeof maybeBody !== "string"
              ? JSON.stringify(maybeBody)
              : (maybeBody as string | undefined),
        }
      : initOrMethod;

  const raw = path.split("?");
  const cleanPath = raw[0].replace(/^\/?api\/v1\/trainer\/?/, "");
  const pathname = cleanPath.replace(/^\/+|\/+$/g, "");
  const query = new URLSearchParams(raw[1] ?? "");
  const method = (init.method || "GET").toUpperCase();
  const body: Record<string, unknown> = init.body
    ? (typeof init.body === "string" ? JSON.parse(init.body) : init.body) as Record<string, unknown>
    : {};
  const seg = pathname.split("/");
  const batchId = query.get("batch_id");
  const courseId = query.get("course_id");
  const cast = <V,>(v: V) => v as unknown as T;

  if (method !== "GET") {
    if (pathname.endsWith("/publish")) return cast({ success: true, status: "published" });
    if (pathname.endsWith("/grade") && seg[0] === "assessments") {
      const assessment = assessmentById(seg[1]);
      const detail = buildAttemptDetail(assessment.id, String(body.attempt_id ?? "att-tr-004"));
      const total = detail.questions.reduce((sum, q) => sum + q.max_marks, 0);
      const earned = detail.questions.reduce(
        (sum, q) => sum + (q.auto_graded ? (q.auto_marks ?? 0) : (q.manual_grade?.marks ?? 0)),
        0,
      );
      const fullyGraded = detail.questions.every((q) => q.auto_graded || q.manual_grade !== null);
      const score = Math.round((earned / total) * 100);
      return cast({
        score,
        result: score >= assessment.passing_score ? "Passed" : "Failed",
        fully_graded: fullyGraded,
        success: true,
      });
    }
    if (pathname.endsWith("/grade")) return cast({ success: true, ok: true });
    if (pathname.endsWith("/read")) return cast({ success: true, read: true });
    if (pathname.endsWith("/close")) return cast({ success: true, status: "closed" });
    if (pathname.endsWith("/simulate-checkin")) return cast({ success: true, present: 10 });
    if (pathname === "attendance/mark") return cast({ success: true, ok: true });
    if (pathname === "attendance/session" || pathname === "attendance/sessions") {
      const now = Date.now();
      return cast({
        id: LIVE_SESSION_ID,
        session_id: LIVE_SESSION_ID,
        opens_at: new Date(now - 60 * 1000).toISOString(),
        closes_at: new Date(now + 30 * 60 * 1000).toISOString(),
        qr_data: `NURVEX-SESSION-${LIVE_SESSION_ID.toUpperCase()}-ROTATE-9F2A`,
      });
    }
    if (pathname === "messages") return cast({ success: true, id: `msg-${Date.now()}` });
    if (pathname === "announcements") return cast({ success: true, status: "published" });
    if (pathname === "content") return cast({ success: true, id: `cnt-${Date.now()}` });
    if (pathname === "assessments") return cast({ success: true, id: `asm-${Date.now()}` });
    if (pathname === "assignments") return cast({ success: true, id: `asg-${Date.now()}` });
    if (pathname === "skills/evaluate") return cast({ success: true, evaluations_saved: Array.isArray(body.evaluations) ? (body.evaluations as unknown[]).length : 0 });
    if (pathname === "ai/reformulate") {
      return cast({
        prompt: String(body.prompt ?? ""),
        explanation: "Clarified the legal jurisdiction and aligned the statutory terminology.",
      });
    }
    if (pathname === "ai/assist") return cast(aiAssist(body));
    if (seg[0] === "assessments" && seg.length === 2) return cast({ success: true, id: seg[1] });
    return cast({ success: true, ok: true });
  }

  if (pathname === "dashboard") {
    const atRisk = portalTrainees.filter((t) => t.status === "at_risk");
    const attemptsToReview = portalAssessments
      .filter((a) => a.status !== "draft")
      .reduce((s, a) => s + a.needs_review, 0);
    const submissionsToGrade = portalAssignments
      .filter((a) => a.status === "published")
      .reduce((s, a) => s + Math.max(0, a.submitted - a.graded), 0);
    return cast({
      trainer: { id: trainerProfile.id, name: trainerProfile.name },
      today: TRAINER_TODAY,
      kpis: {
        todays_classes: 2,
        upcoming_classes: 5,
        trainees: portalTrainees.length,
        average_attendance: avg(portalTrainees.map((t) => t.attendance)),
        attendance_delta: 3,
        pending_assessments: attemptsToReview + submissionsToGrade,
        pending_breakdown: { attempts_to_review: attemptsToReview, submissions_to_grade: submissionsToGrade },
        at_risk: atRisk.length,
      },
      today_classes: [
        {
          ...slotFor(classById("cls-cmf-b"), TRAINER_TODAY, "s-today-1"),
          attendance_status: "in_progress",
          session_id: LIVE_SESSION_ID,
          present: 9,
        },
        {
          ...slotFor(classById("cls-lcb-c"), TRAINER_TODAY, "s-today-2"),
          attendance_status: "pending",
          session_id: null,
          present: null,
        },
      ],
      upcoming: {
        tomorrow: [
          { ...slotFor(classById("cls-mis-a"), "2026-09-29", "s-tom-1"), attendance_status: "pending", session_id: null, present: null },
        ],
        this_week: [
          { ...slotFor(classById("cls-cmf-b"), "2026-09-30", "s-week-1"), attendance_status: "pending", session_id: null, present: null },
          { ...slotFor(classById("cls-bwl-c"), "2026-10-03", "s-week-2"), attendance_status: "pending", session_id: null, present: null },
        ],
      },
      at_risk_trainees: atRisk,
      attendance_trend: ATTENDANCE_TREND.map((p) => ({ date: p.date, attendance: p.attendance })),
      learning_progress: portalClasses.map((c) => ({
        class_id: c.id,
        course: c.course,
        batch: c.batch_label,
        progress: c.progress,
      })),
      upcoming_assessments: portalAssessments
        .filter((a) => a.scheduled_at)
        .map((a) => ({
          id: a.id,
          title: a.title,
          batch: batchName(a.batch_id),
          scheduled_at: a.scheduled_at as string,
          questions: a.questions,
          duration_minutes: a.duration_minutes,
        })),
      recent_activity: [
        { type: "attendance", text: "Marked 9/10 trainees present in Cooperative Management Fundamentals", at: "2026-09-28T04:35:00Z" },
        { type: "assessment", text: "Suresh S. Mane submitted the Governance Practical Assessment", at: "2026-09-27T16:40:00Z" },
        { type: "assignment", text: "5 trainees submitted the PACS Digital Accounting assignment", at: "2026-09-27T12:30:00Z" },
        { type: "attendance", text: "Completed attendance for the Board Leadership Weekend Lab", at: "2026-09-25T11:45:00Z" },
        { type: "assessment", text: "Published Board Resolution Drafting & Compliance for Batch 2026-C", at: "2026-09-24T09:10:00Z" },
      ],
      skills: portalSkills.map((s) => ({ skill: s.name, average: s.average })),
      insights: [
        { severity: "positive", text: `Overall attendance across your batches is ${avg(portalTrainees.map((t) => t.attendance))}%, up 3 points on last week.` },
        { severity: "warning", text: `${atRisk.length} trainees are below the 75% attendance threshold and need a mentor check-in this week.` },
        { severity: "info", text: "85% of trainees completed the digital passbook simulation successfully." },
        { severity: "critical", text: `${submissionsToGrade} assignment submissions are still waiting to be graded before the term closes.` },
      ],
      unread_messages: portalConversations.reduce((s, c) => s + c.unread, 0),
    });
  }

  if (pathname === "classes") {
    return cast({
      classes: portalClasses.map((c) => ({
        id: c.id,
        course_id: c.course_id,
        course: c.course,
        category: c.category,
        batch: c.batch_label,
        batch_id: c.batch_id,
        trainees: c.trainees,
        progress: c.progress,
        attendance: c.attendance,
        assessments_completed: c.assessments_completed,
        assessments_total: c.assessments_total,
        at_risk: c.at_risk,
        room: c.room,
        next_class: c.next_class,
      })),
    });
  }

  if (seg[0] === "classes" && seg.length === 2) return cast(classDetail(seg[1]));

  if (pathname === "trainees") {
    return cast({
      trainees: portalTrainees,
      total: portalTrainees.length,
      batches: portalBatches,
      status_counts: {
        on_track: portalTrainees.filter((t) => t.status === "on_track").length,
        needs_attention: portalTrainees.filter((t) => t.status === "needs_attention").length,
        at_risk: portalTrainees.filter((t) => t.status === "at_risk").length,
        completed: portalTrainees.filter((t) => t.status === "completed").length,
      },
    });
  }

  if (seg[0] === "trainees" && seg.length === 2) return cast(traineeDetail(seg[1]));

  if (pathname === "assessments/options" || pathname === "assignments/options") {
    return cast({ classes: portalClassOptions });
  }

  if (pathname === "assessments") {
    const filtered = assessmentFilters({ batchId, courseId });
    return cast({
      counts: {
        upcoming: filtered.filter((a) => a.group === "upcoming").length,
        drafts: filtered.filter((a) => a.group === "drafts").length,
        published: filtered.filter((a) => a.status === "published").length,
        completed: filtered.filter((a) => a.group === "completed").length,
      },
      assessments: filtered.map((a) => ({
        ...a,
        batch: batchName(a.batch_id),
        total: traineesOfBatch(a.batch_id).length,
      })),
    });
  }

  if (seg[0] === "assessments" && (seg[2] === "attempts" || seg[2] === "review")) {
    return cast(buildAttemptDetail(seg[1], seg[3] ?? "att-tr-004"));
  }

  if (seg[0] === "assessments" && seg.length === 2) return cast(assessmentDetail(seg[1]));

  if (pathname === "assignments") {
    return cast({
      assignments: portalAssignments.map((a) => ({
        ...a,
        batch: batchName(a.batch_id),
        course: courseById(a.course_id)?.title ?? null,
        pending: a.assigned - a.submitted,
        to_grade: Math.max(0, a.submitted - a.graded),
      })),
    });
  }

  if (seg[0] === "assignments" && seg.length === 2) return cast(assignmentDetail(seg[1]));

  if (pathname === "content") {
    const items = courseId ? portalContentItems.filter((i) => i.course_id === courseId) : portalContentItems;
    return cast({
      courses: portalCourses.map((c) => ({ id: c.id, title: c.title })),
      modules: portalModules.map((m) => ({ id: m.id, title: m.title, course_id: m.course_id })),
      items,
      summary: {
        total: items.length,
        published: items.filter((i) => i.published).length,
        draft: items.filter((i) => !i.published).length,
        videos: items.filter((i) => i.kind === "video").length,
      },
    });
  }

  if (pathname === "attendance/classes/mine") {
    return cast({
      classes: portalClasses.map((c) => ({
        batch_id: c.batch_id,
        programme_id: c.course_id,
        title: c.course,
        batch_name: c.batch_label,
        venue: c.room,
        capacity: c.capacity,
        enrolled: c.trainees,
      })),
    });
  }

  if (/^attendance\/sessions\/[^/]+\/qr$/.test(pathname)) {
    return cast({
      qr_data: `NURVEX-SESSION-${LIVE_SESSION_ID.toUpperCase()}-ROTATE-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,
    });
  }

  if (pathname === "attendance/sessions/mine") {
    const limit = Math.max(1, Math.min(50, Number(query.get("limit") ?? 10)));
    const now = Date.now();
    return cast({
      sessions: portalAttendanceHistory.slice(0, limit).map((s) => ({
        session_id: s.session_id,
        session_name: s.name,
        programme_title: s.course,
        present: s.present,
        marked_total: s.roster,
        is_open: s.is_open,
        opens_at: s.is_open ? new Date(now - 6 * 60 * 1000).toISOString() : s.opens_at,
        closes_at: s.is_open ? new Date(now + 24 * 60 * 1000).toISOString() : s.closes_at,
      })),
    });
  }

  if (pathname === "attendance") {
    const tab = query.get("tab") ?? "today";
    const options = attendanceOptions();
    if (tab === "history") {
      return cast({
        tab: "history",
        ...options,
        items: historyRows(batchId, courseId, query.get("q") ?? "", query.get("from") ?? "", query.get("to") ?? ""),
      });
    }
    if (tab === "upcoming") {
      return cast({
        tab: "upcoming",
        ...options,
        items: attendanceSlots(batchId, courseId).filter((s) => s.date > TRAINER_TODAY),
      });
    }
    return cast({
      tab: "today",
      ...options,
      items: attendanceSlots(batchId, courseId).filter((s) => s.date === TRAINER_TODAY),
    });
  }

  if (seg[0] === "attendance" && seg[1] === "session" && seg.length >= 3) {
    return cast(sessionState(seg[2]));
  }

  if (pathname === "analytics") {
    const roster = traineesOfBatch(batchId);
    const classes = classesOfBatch(batchId);
    return cast({
      empty: false,
      batches: portalBatches,
      metrics: {
        classes_conducted: batchId ? 9 : 32,
        attendance_avg: avg(roster.map((t) => t.attendance)),
        course_completion: avg(classes.map((c) => c.progress)),
        assessment_avg: avg(roster.map((t) => t.assessment)),
        pass_rate: Math.round(
          (roster.filter((t) => t.assessment >= 50).length / Math.max(1, roster.length)) * 100,
        ),
        at_risk: roster.filter((t) => t.status === "at_risk").length,
        trainees: roster.length,
      },
      attendance_trend: ATTENDANCE_TREND.map((p) => ({
        date: p.date,
        label: new Date(`${p.date}T00:00:00Z`).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          timeZone: "Asia/Kolkata",
        }),
        attendance: p.attendance,
      })),
      assessment_trend: portalAssessments
        .filter((a) => a.avg_score !== null)
        .map((a) => ({
          label: a.module,
          average: a.avg_score,
          pass_rate: Math.min(100, (a.avg_score ?? 0) + 6),
        })),
      learning_completion: classes.map((c) => ({ label: c.batch_label, completion: c.progress })),
      skill_growth: {
        by_skill: portalSkills.map((s) => ({ skill: s.name, confidence: s.average })),
        by_month: [
          { month: "July 2026", rating: 3.8, evaluations: 18 },
          { month: "August 2026", rating: 4.2, evaluations: 34 },
          { month: "September 2026", rating: 4.6, evaluations: 42 },
        ],
      },
    });
  }

  if (pathname === "calendar") {
    return cast({
      events: portalCalendarEvents(
        query.get("start") ?? "2026-09-28",
        query.get("end") ?? "2026-11-08",
      ),
    });
  }

  if (pathname === "messages/recipients") return cast({ recipients: recipientsList() });

  if (seg[0] === "messages" && seg[1] === "thread") {
    return cast({ messages: threadFor(seg[2]) });
  }

  if (pathname === "messages") {
    const needle = query.get("q")?.trim().toLowerCase();
    const conversations = needle
      ? portalConversations.filter((c) =>
          `${c.name} ${c.last_message ?? ""} ${c.last_subject ?? ""}`.toLowerCase().includes(needle),
        )
      : portalConversations;
    return cast({
      unread_total: conversations.reduce((s, c) => s + c.unread, 0),
      conversations,
    });
  }

  if (pathname === "announcements") return cast({ announcements: portalAnnouncements });

  if (pathname === "reports/types") {
    return cast({
      types: [
        { type: "attendance", title: "Attendance Register & Sync Log", description: "Session-wise attendance, late entries, verification logs and compliance percentages." },
        { type: "assessments", title: "Assessment Scorecard & Analysis", description: "Per-attempt scores, pass rates, item difficulty breakdowns and percentiles." },
        { type: "trainees", title: "Trainee Progress & Risk Dossier", description: "Comprehensive learner dossiers with risk indicators and intervention alerts." },
        { type: "skills", title: "Skill Passport Matrix", description: "Dimension-level proficiency ratings, verified competencies and practical evaluations." },
      ],
      batches: portalBatches,
      courses: portalCourses.map((c) => ({
        id: c.id,
        title: c.title,
        batch_id: portalClasses.find((k) => k.course_id === c.id)?.batch_id ?? portalBatches[0].id,
      })),
    });
  }

  if (seg[0] === "reports" && seg.length === 2) return cast(reportPayload(seg[1], batchId, courseId));

  if (pathname === "skills/evaluation-dimensions") return cast({ dimensions: portalSkillDimensions });

  if (seg[0] === "skills" && seg[1] === "trainee") {
    const t = portalTrainees.find((x) => x.id === seg[2]) ?? portalTrainees[0];
    return cast({
      trainee: { id: t.id, name: t.name, batch: t.batch, batch_id: t.batch_id },
      dimension_averages: {
        governance: round1(Math.min(5, 3 + t.skill_readiness / 40)),
        accounting: round1(Math.min(5, 2.6 + t.skill_readiness / 45)),
        leadership: round1(Math.min(5, 2.9 + t.skill_readiness / 38)),
        dispute: round1(Math.min(5, 2.8 + t.skill_readiness / 42)),
      },
      evaluations: [
        { id: "ev-1", dimension: "governance", label: "Cooperative Governance & Bylaws", rating: 5, observation: "Mastered the legal distinction between ordinary and special resolutions.", date: "2026-09-24T10:00:00Z" },
        { id: "ev-2", dimension: "accounting", label: "PACS Accounting & Ledger Verification", rating: 4, observation: "Accurately spotted reserve fund allocation discrepancies in the sample daybook.", date: "2026-09-21T14:30:00Z" },
        { id: "ev-3", dimension: "leadership", label: "Meeting Facilitation & Quorum Management", rating: 4, observation: "Kept the mock board to schedule and recorded dissent correctly.", date: "2026-09-18T11:45:00Z" },
      ],
    });
  }

  if (pathname === "skills") return cast(skillsPayload(batchId));

  if (pathname === "ai/assist") return cast(aiAssist({}));

  throw new TrainerApiError(404, `No trainer mock endpoint for /${pathname}`);
}

/* -------------------------------------------------------------------------- */
/* AI assistant fixtures                                                       */
/* -------------------------------------------------------------------------- */

function aiAssist(body: Record<string, unknown>) {
  const task = String(body.task ?? "quiz");
  const count = Math.max(1, Math.min(20, Number(body.count ?? 5)));
  const exclude = Array.isArray(body.exclude) ? (body.exclude as string[]) : [];
  const prompt = String(body.prompt ?? "").trim();

  if (task === "quiz") {
    const pool = [
      {
        type: "mcq_single" as const,
        prompt: "Under the Rochdale Principles of Cooperation, which principle guarantees democratic member control?",
        options: [
          { id: "a", text: "One Member, One Vote regardless of share capital" },
          { id: "b", text: "Proportional voting based on member shares" },
          { id: "c", text: "Board appointment by the Registrar" },
          { id: "d", text: "Proxy voting for absent members" },
        ],
        correct: ["a"],
        explanation: "Rochdale Principle 2 establishes one member, one vote irrespective of shareholding.",
      },
      {
        type: "mcq_single" as const,
        prompt: "What is the primary function of the audit committee under the amended Cooperative Societies Act?",
        options: [
          { id: "a", text: "Sanctioning member agricultural loans" },
          { id: "b", text: "Independent oversight of financial reporting and internal controls" },
          { id: "c", text: "Conducting board elections" },
          { id: "d", text: "Purchasing society fixed assets" },
        ],
        correct: ["b"],
        explanation: "The audit committee is an oversight body that safeguards the integrity of internal control.",
      },
      {
        type: "mcq_single" as const,
        prompt: "Which minimum proportion of net profit must a primary credit society move to the statutory reserve?",
        options: [
          { id: "a", text: "10%" },
          { id: "b", text: "25%" },
          { id: "c", text: "35%" },
          { id: "d", text: "50%" },
        ],
        correct: ["b"],
        explanation: "At least 25% of net profit must be transferred to the reserve fund before dividends.",
      },
      {
        type: "mcq_single" as const,
        prompt: "A balance sheet trial balance is in agreement but the passbook ledger disagrees with the cash book. What does this indicate?",
        options: [
          { id: "a", text: "A compensating error hidden by suspense postings" },
          { id: "b", text: "A completed statutory audit" },
          { id: "c", text: "An approved annual return" },
          { id: "d", text: "A qualified statutory reserve" },
        ],
        correct: ["a"],
        explanation: "Agreement only proves arithmetic equality; compensating errors survive without ledger reconciliation.",
      },
      {
        type: "mcq_single" as const,
        prompt: "Which body may appoint directors when cooperative board seats remain vacant beyond three months?",
        options: [
          { id: "a", text: "The Cooperative Registrar" },
          { id: "b", text: "The Reserve Bank of India" },
          { id: "c", text: "The district collector" },
          { id: "d", text: "The members' nominal committee" },
        ],
        correct: ["a"],
        explanation: "On failure of the board to fill vacancies in three months, the Registrar may nominate.",
      },
      {
        type: "mcq_single" as const,
        prompt: "Which voting right applies to an associate member of a cooperative society?",
        options: [
          { id: "a", text: "Full voting rights at the general body" },
          { id: "b", text: "No voting rights and not counted for quorum" },
          { id: "c", text: "Voting rights only on dividend resolutions" },
          { id: "d", text: "A second or casting vote" },
        ],
        correct: ["b"],
        explanation: "Associate members carry no voting rights and are excluded from quorum computation.",
      },
    ];
    const fresh = pool.filter((q) => !exclude.includes(q.prompt));
    return {
      source: "gemini" as const,
      title: prompt ? `Quiz draft — ${prompt}` : "AI Generated Course Content & Assessment Items",
      questions: (fresh.length ? fresh : pool).slice(0, count),
      sections: [],
    };
  }

  if (task === "lesson_plan") {
    return {
      source: "gemini" as const,
      title: "Lesson plan — Module 3: Governance, Boards & Bylaws",
      questions: [],
      sections: [
        {
          heading: "Session Learning Objectives",
          body: "1. Distinguish ordinary from special resolutions in a cooperative society.\n2. Compute the statutory quorum for a general body meeting.\n3. Draft compliant board minutes with recorded dissent.",
        },
        {
          heading: "Warm-up Recall (10 mins)",
          body: "Ask the cohort to state the quorum for a society with 480 members and to justify the arithmetic on the whiteboard.",
        },
        {
          heading: "Interactive Board Simulation (25 mins)",
          body: "Split the batch into three mock board panels of a primary dairy society debating whether to invest surplus funds into cold-storage expansion. Each panel drafts one resolution and records dissent.",
        },
        {
          heading: "Close and Assignment Link",
          body: "Consolidate the resolution wording on the board and set the PACS audit checklist as the follow-on assignment.",
        },
      ],
    };
  }

  if (task === "activities") {
    return {
      source: "gemini" as const,
      title: "Class activities on member rights",
      questions: [],
      sections: [
        {
          heading: "Role Play: Grievance Over Short-Paid Patronage Dividend",
          body: "Pairs alternate between the member and the redressal committee. The member must produce a written grievance; the committee must dispose of it within fifteen days with a written order.",
        },
        {
          heading: "Notice Board Audit",
          body: "Give each group a model notice board extract and ask them to flag every statutory disclosure that is missing, with the clause reference.",
        },
      ],
    };
  }

  if (task === "explain") {
    return {
      source: "gemini" as const,
      title: `Explanation — ${prompt || "cooperative governance"}`,
      questions: [],
      sections: [
        {
          heading: "Plain-language explanation",
          body: "A cooperative society is formed and run by its members, each holding one vote regardless of shareholding. The general body is the sovereign body, the board executes its decisions, and the accounts are audited independently so that members can verify how the society is governed and how surplus is shared.",
        },
        {
          heading: "Worked example",
          body: "A society with 480 members needs one-fourth of the membership, so 120 members present satisfy the quorum. If only 96 attend, the meeting is adjourned to the same day next week, when the members present form the quorum.",
        },
      ],
    };
  }

  const atRisk = portalTrainees.filter((t) => t.status !== "on_track");
  return {
    source: "fallback" as const,
    title:
      task === "struggling_summary"
        ? "Struggling trainees summary"
        : "Class summary from your stored metrics",
    questions: [],
    sections: [
      {
        heading:
          task === "struggling_summary"
            ? `${atRisk.length} trainees need a mentor check-in`
            : `${portalTrainees.length} trainees across ${portalClasses.length} classes`,
        body:
          task === "struggling_summary"
            ? atRisk
                .map((t) => `${t.name} (${t.trainee_code}, ${t.batch}) — attendance ${t.attendance}%, assessment ${t.assessment}%. ${t.risk_reasons.join("; ") || "Watch submission trend."}`)
                .join("\n")
            : portalClasses
                .map((c) => `${c.course} · ${c.batch_label}: ${c.trainees} trainees, ${c.progress}% syllabus covered, ${c.attendance}% attendance.`)
                .join("\n"),
      },
      {
        heading: "Recommended intervention",
        body:
          task === "struggling_summary"
            ? "Schedule a 15-minute mentor call, share the annotated model bylaws material, and set a deadline for the pending assignment."
            : "Keep the fortnightly attendance review, publish the Module 4 assessment slot, and clear the outstanding assignment grades before the term closes.",
      },
    ],
  };
}

export const resolveMock = resolveTrainerMock;
