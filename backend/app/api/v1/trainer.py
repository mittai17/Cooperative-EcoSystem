"""Trainer workspace API.

Auth: this prototype uses the existing mock auth - there is no token check.
`current_trainer` resolves the demo trainer (override with the optional
`X-Demo-User` email header). Authorisation is still data-scoped: every query is
rooted in `batch_courses.trainer_id`, so a trainer can only reach their own
classes, batches, trainees, assessments and attendance sessions.
"""
import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Announcement, Assessment, AssessmentAttempt, Assignment, AssignmentSubmission, AttendanceRecord,
    AttendanceSession, Batch, BatchCourse, Certificate, Course, CourseEnrollment, DirectMessage, Enrollment, Module,
    Skill, SkillEvaluation, TimetableException, TimetableSlot, TraineeSkill, User,
)
from app.services import trainer_metrics as tm

router = APIRouter()

DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


async def current_trainer(
    x_demo_user: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def _hhmm(t: Optional[time]) -> Optional[str]:
    return t.strftime("%H:%M") if t else None


def _label(t: Optional[time]) -> str:
    return t.strftime("%I:%M %p") if t else ""


def _on_date(dt: Optional[datetime], d: date) -> bool:
    return dt is not None and dt.astimezone(tm.IST).date() == d


async def _slots_for_trainer(db: AsyncSession, trainer_id: uuid.UUID) -> list[TimetableSlot]:
    return list((await db.execute(
        select(TimetableSlot).where(TimetableSlot.trainer_id == trainer_id).order_by(TimetableSlot.start_time))).scalars())


async def _cancelled(db: AsyncSession, slot_ids: list[uuid.UUID], start: date, end: date) -> set[tuple[uuid.UUID, date]]:
    if not slot_ids:
        return set()
    rows = await db.execute(select(TimetableException).where(
        TimetableException.slot_id.in_(slot_ids), TimetableException.date >= start, TimetableException.date <= end,
        TimetableException.status == "cancelled"))
    return {(r.slot_id, r.date) for r in rows.scalars()}


def _occurrences(slots, start: date, end: date, cancelled):
    d = start
    while d <= end:
        name = WEEKDAYS[d.weekday()]
        for s in slots:
            if s.day_of_week == name and (s.id, d) not in cancelled:
                yield s, d
        d += timedelta(days=1)


# --------------------------------------------------------------------------
# Dashboard
# --------------------------------------------------------------------------
@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    now = tm.now_ist()
    today = now.date()
    classes = await tm.trainer_classes(db, trainer.id)
    if not classes:
        return {"trainer": {"id": str(trainer.id), "name": trainer.full_name}, "empty": True}
    batch_ids = list({b.id for _, b, _ in classes})
    batch_name = {b.id: b.name for _, b, _ in classes}
    course_name = {c.id: c.title for _, _, c in classes}
    stats = await tm.compute_stats(db, trainer.id)
    sd = [tm.stat_dict(s) for s in stats.values()]

    # ---- schedule -------------------------------------------------------
    slots = await _slots_for_trainer(db, trainer.id)
    week_end = today + timedelta(days=7)
    cancelled = await _cancelled(db, [s.id for s in slots], today, today + timedelta(days=7))
    sessions_today = (await db.execute(select(AttendanceSession).where(
        AttendanceSession.batch_id.in_(batch_ids), AttendanceSession.created_by == trainer.id,
        AttendanceSession.opens_at >= datetime.combine(today, time.min, tzinfo=tm.IST),
        AttendanceSession.opens_at < datetime.combine(today + timedelta(days=1), time.min, tzinfo=tm.IST)))).scalars().all()
    by_slot = {s.timetable_slot_id: s for s in sessions_today if s.timetable_slot_id}
    present_counts = {}
    if sessions_today:
        rows = await db.execute(select(AttendanceRecord.session_id, func.count()).where(
            AttendanceRecord.session_id.in_([s.id for s in sessions_today]),
            AttendanceRecord.status.in_(tm.ATTENDED)).group_by(AttendanceRecord.session_id))
        present_counts = dict(rows.all())
    roster_size = defaultdict(int)
    for s in stats.values():
        roster_size[s.batch_id] += 1

    def class_card(slot, d):
        sess = by_slot.get(slot.id) if d == today else None
        status = "not_started"
        if sess:
            status = "live" if sess.closes_at and sess.closes_at > now else "completed"
        return {
            "slot_id": str(slot.id), "course_id": str(slot.course_id) if slot.course_id else None,
            "course": slot.title, "batch": batch_name.get(slot.batch_id), "batch_id": str(slot.batch_id),
            "class_id": next((str(bc.id) for bc, b, c in classes if b.id == slot.batch_id and c.id == slot.course_id), None),
            "date": d.isoformat(), "start": _hhmm(slot.start_time), "end": _hhmm(slot.end_time),
            "start_label": _label(slot.start_time), "end_label": _label(slot.end_time),
            "room": slot.room, "trainees": roster_size.get(slot.batch_id, 0),
            "attendance_status": status, "session_id": str(sess.id) if sess else None,
            "present": present_counts.get(sess.id, 0) if sess else None,
        }

    today_classes = [class_card(s, d) for s, d in _occurrences(slots, today, today, cancelled)]
    upcoming = [class_card(s, d) for s, d in _occurrences(slots, today + timedelta(days=1), today + timedelta(days=7), cancelled)]
    upcoming.sort(key=lambda c: (c["date"], c["start"]))
    tomorrow = (today + timedelta(days=1)).isoformat()
    upcoming_groups = {"tomorrow": [c for c in upcoming if c["date"] == tomorrow],
                       "this_week": [c for c in upcoming if c["date"] != tomorrow and date.fromisoformat(c["date"]) <= week_end]}

    # ---- attendance trend (per past session) ---------------------------
    sess_rows = (await db.execute(
        select(AttendanceSession.id, AttendanceSession.opens_at, AttendanceSession.batch_id, AttendanceSession.session_name)
        .where(AttendanceSession.batch_id.in_(batch_ids), AttendanceSession.opens_at < now, AttendanceSession.created_by == trainer.id)
        .order_by(AttendanceSession.opens_at.desc()).limit(60))).all()
    per_sess = defaultdict(lambda: defaultdict(int))
    if sess_rows:
        recs = await db.execute(select(AttendanceRecord.session_id, AttendanceRecord.status, func.count())
                                .where(AttendanceRecord.session_id.in_([r[0] for r in sess_rows]))
                                .group_by(AttendanceRecord.session_id, AttendanceRecord.status))
        for sid, st, n in recs.all():
            per_sess[sid][st] = n
    by_day = defaultdict(lambda: [0, 0])
    for sid, opens, _, _ in sess_rows:
        c = per_sess[sid]
        att = sum(c.get(k, 0) for k in tm.ATTENDED)
        den = att + c.get("absent", 0)
        k = opens.astimezone(tm.IST).date().isoformat()
        by_day[k][0] += att
        by_day[k][1] += den
    attendance_trend = [{"date": k, "attendance": tm.pct(a, d)} for k, (a, d) in sorted(by_day.items())][-8:]

    # ---- pending assessments & upcoming assessments --------------------
    needs_review = (await db.execute(select(func.count()).select_from(AssessmentAttempt)
        .join(Assessment, Assessment.id == AssessmentAttempt.assessment_id)
        .where(Assessment.batch_id.in_(batch_ids), Assessment.created_by == trainer.id,
               AssessmentAttempt.status == "needs_review"))).scalar() or 0
    ungraded = (await db.execute(select(func.count()).select_from(AssignmentSubmission)
        .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id)
        .where(Assignment.batch_id.in_(batch_ids), AssignmentSubmission.status != "graded"))).scalar() or 0
    up_ass = (await db.execute(select(Assessment).where(
        Assessment.batch_id.in_(batch_ids), Assessment.created_by == trainer.id, Assessment.status == "published",
        Assessment.scheduled_at >= now).order_by(Assessment.scheduled_at).limit(5))).scalars().all()

    # ---- learning progress per class ------------------------------------
    prog = await db.execute(select(CourseEnrollment.course_id, Enrollment.batch_id, func.avg(CourseEnrollment.progress))
        .join(Enrollment, Enrollment.trainee_id == CourseEnrollment.trainee_id)
        .where(Enrollment.batch_id.in_(batch_ids), CourseEnrollment.course_id.in_(list(course_name)))
        .group_by(CourseEnrollment.course_id, Enrollment.batch_id))
    prog_map = {(c, b): round(float(a)) for c, b, a in prog.all()}
    learning_progress = [
        {"class_id": str(bc.id), "course": c.title, "batch": b.name, "progress": prog_map.get((c.id, b.id))}
        for bc, b, c in classes]

    # ---- skills ---------------------------------------------------------
    ids = list(stats)
    skill_rows = await db.execute(select(Skill.name, func.avg(TraineeSkill.confidence)).join(TraineeSkill, TraineeSkill.skill_id == Skill.id)
        .where(TraineeSkill.trainee_id.in_(ids)).group_by(Skill.name).order_by(func.avg(TraineeSkill.confidence).desc())) if ids else None
    skills = [{"skill": n, "average": round(float(a))} for n, a in (skill_rows.all() if skill_rows else [])]

    # ---- recent activity (stored events only) ---------------------------
    activity = []
    for sid, opens, bid, name in sess_rows[:3]:
        activity.append({"type": "attendance", "text": f"Attendance recorded — {name} ({batch_name.get(bid)})", "at": _iso(opens)})
    subs = (await db.execute(select(AssignmentSubmission, Assignment.title, User.full_name)
        .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id).join(User, User.id == AssignmentSubmission.trainee_id)
        .where(Assignment.batch_id.in_(batch_ids)).order_by(AssignmentSubmission.submitted_at.desc()).limit(4))).all()
    for sub, title, name in subs:
        activity.append({"type": "assignment", "text": f"{name} submitted “{title}”", "at": _iso(sub.submitted_at)})
    atts = (await db.execute(select(AssessmentAttempt, Assessment.title, User.full_name)
        .join(Assessment, Assessment.id == AssessmentAttempt.assessment_id).join(User, User.id == AssessmentAttempt.trainee_id)
        .where(Assessment.batch_id.in_(batch_ids), AssessmentAttempt.submitted_at.is_not(None))
        .order_by(AssessmentAttempt.submitted_at.desc()).limit(4))).all()
    for a, title, name in atts:
        activity.append({"type": "assessment", "text": f"{name} scored {a.score}% in {title}", "at": _iso(a.submitted_at)})
    activity.sort(key=lambda x: x["at"] or "", reverse=True)

    unread = (await db.execute(select(func.count()).select_from(DirectMessage).where(
        DirectMessage.recipient_id == trainer.id, DirectMessage.read_at.is_(None)))).scalar() or 0

    at_risk = sorted([x for x in sd if x["status"] == "at_risk"], key=lambda x: (x["attendance"] if x["attendance"] is not None else 101))
    insights = await _insights(db, trainer.id, batch_ids, batch_name, sd, needs_review)
    att_vals = [x["attendance"] for x in sd]
    trend_delta = None
    if len(attendance_trend) >= 4:
        half = len(attendance_trend) // 2
        a1 = tm.avg([t["attendance"] for t in attendance_trend[:half]])
        a2 = tm.avg([t["attendance"] for t in attendance_trend[half:]])
        trend_delta = (a2 - a1) if a1 is not None and a2 is not None else None

    return {
        "trainer": {"id": str(trainer.id), "name": trainer.full_name},
        "today": today.isoformat(),
        "kpis": {
            "todays_classes": len(today_classes), "upcoming_classes": len(upcoming_groups["this_week"]) + len(upcoming_groups["tomorrow"]),
            "trainees": len(sd), "average_attendance": tm.avg(att_vals), "attendance_delta": trend_delta,
            "pending_assessments": needs_review + ungraded, "pending_breakdown": {"attempts_to_review": needs_review, "submissions_to_grade": ungraded},
            "at_risk": len(at_risk),
        },
        "today_classes": today_classes, "upcoming": upcoming_groups,
        "at_risk_trainees": at_risk[:5],
        "attendance_trend": attendance_trend, "learning_progress": learning_progress,
        "upcoming_assessments": [{"id": str(a.id), "title": a.title, "batch": batch_name.get(a.batch_id),
                                  "scheduled_at": _iso(a.scheduled_at), "questions": a.total_questions,
                                  "duration_minutes": a.duration_minutes} for a in up_ass],
        "recent_activity": activity[:8], "skills": skills, "insights": insights, "unread_messages": unread,
    }


async def _insights(db, trainer_id, batch_ids, batch_name, sd, needs_review) -> list[dict]:
    """Data-derived only: each insight is emitted solely if the stored data supports it."""
    out: list[dict] = []
    low_att = [x for x in sd if x["attendance"] is not None and x["attendance"] < tm.LOW_ATTENDANCE]
    if low_att:
        out.append({"severity": "warning", "text": f"{len(low_att)} trainees have attendance below {tm.LOW_ATTENDANCE}%."})
    comp = (await db.execute(select(Assessment).where(
        Assessment.batch_id.in_(batch_ids), Assessment.created_by == trainer_id, Assessment.status == "completed")
        .order_by(Assessment.scheduled_at))).scalars().all()
    by_course = defaultdict(list)
    for a in comp:
        by_course[(a.batch_id, a.course_id)].append(a)
    for (bid, _), items in by_course.items():
        aggs = {}
        for a in items:
            r = await db.execute(select(func.avg(AssessmentAttempt.score), func.count(),
                                        func.count().filter(AssessmentAttempt.score < a.passing_score))
                                 .where(AssessmentAttempt.assessment_id == a.id, AssessmentAttempt.score.is_not(None)))
            avg_s, n, below = r.one()
            aggs[a.id] = (float(avg_s) if avg_s is not None else None, n, below)
        last = items[-1]
        avg_s, n, below = aggs[last.id]
        if n and below / n >= 0.15:
            out.append({"severity": "warning", "text": f"{round(100 * below / n)}% of trainees scored below the pass mark in {last.title} ({batch_name.get(bid)})."})
        if len(items) >= 2:
            prev_avg = aggs[items[-2].id][0]
            if avg_s is not None and prev_avg is not None and prev_avg - avg_s >= 3:
                out.append({"severity": "warning", "text": f"Average performance dropped {round(prev_avg - avg_s)}% in {last.title} ({batch_name.get(bid)})."})
    if needs_review:
        out.append({"severity": "info", "text": f"{needs_review} assessment submissions are waiting for your review."})
    return out[:5]


# --------------------------------------------------------------------------
# Classes
# --------------------------------------------------------------------------
async def _class_scope(db: AsyncSession, trainer: User, class_id: uuid.UUID):
    row = (await db.execute(
        select(BatchCourse, Batch, Course).join(Batch, Batch.id == BatchCourse.batch_id)
        .join(Course, Course.id == BatchCourse.course_id)
        .where(BatchCourse.id == class_id, BatchCourse.trainer_id == trainer.id))).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Class not found")
    return row


def _next_class(slots, batch_id, course_id, now: datetime):
    best = None
    for s in slots:
        if s.batch_id != batch_id or s.course_id != course_id or s.start_time is None:
            continue
        for add in range(0, 8):
            d = now.date() + timedelta(days=add)
            if WEEKDAYS[d.weekday()] != s.day_of_week:
                continue
            start = datetime.combine(d, s.start_time, tzinfo=tm.IST)
            if start >= now and (best is None or start < best[0]):
                best = (start, s)
            break
    return best


@router.get("/classes")
async def list_classes(db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    now = tm.now_ist()
    classes = await tm.trainer_classes(db, trainer.id)
    stats = await tm.compute_stats(db, trainer.id)
    slots = await _slots_for_trainer(db, trainer.id)
    out = []
    for bc, b, c in classes:
        mine = [s for s in stats.values() if s.batch_id == b.id]
        prog = await db.execute(select(func.avg(CourseEnrollment.progress)).join(Enrollment, Enrollment.trainee_id == CourseEnrollment.trainee_id)
                                .where(Enrollment.batch_id == b.id, CourseEnrollment.course_id == c.id))
        p = prog.scalar()
        ass = (await db.execute(select(Assessment.status).where(Assessment.batch_id == b.id, Assessment.course_id == c.id,
                                                                  Assessment.created_by == trainer.id))).scalars().all()
        nxt = _next_class(slots, b.id, c.id, now)
        out.append({
            "id": str(bc.id), "course_id": str(c.id), "course": c.title, "category": c.category, "batch": b.name,
            "batch_id": str(b.id), "trainees": len(mine), "progress": round(float(p)) if p is not None else None,
            "attendance": tm.avg([s.attendance for s in mine]),
            "assessments_completed": sum(1 for s in ass if s == "completed"), "assessments_total": len(ass),
            "at_risk": sum(1 for s in mine if s.status == "at_risk"), "room": bc.room,
            "next_class": {"start": _iso(nxt[0]), "label": f"{WEEKDAYS[nxt[0].weekday()]} · {_label(nxt[1].start_time)}", "room": nxt[1].room} if nxt else None,
        })
    return {"classes": out}


@router.get("/classes/{class_id}")
async def class_detail(class_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    bc, b, c = await _class_scope(db, trainer, class_id)
    now = tm.now_ist()
    stats = await tm.compute_stats(db, trainer.id, [b.id])
    roster = [tm.stat_dict(s) for s in stats.values()]
    ids = list(stats)

    ce = {}
    if ids:
        rows = await db.execute(select(CourseEnrollment.trainee_id, CourseEnrollment.progress)
                                .where(CourseEnrollment.course_id == c.id, CourseEnrollment.trainee_id.in_(ids)))
        ce = dict(rows.all())
    for r in roster:
        r["course_progress"] = ce.get(uuid.UUID(r["id"]))
    course_progress = tm.avg(ce.values())
    buckets = {"0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0}
    for v in ce.values():
        buckets["0-25%" if v <= 25 else "26-50%" if v <= 50 else "51-75%" if v <= 75 else "76-100%"] += 1

    # attendance sessions for this class
    slot_ids = (await db.execute(select(TimetableSlot.id).where(TimetableSlot.batch_id == b.id, TimetableSlot.course_id == c.id))).scalars().all()
    sessions = (await db.execute(select(AttendanceSession).where(
        AttendanceSession.batch_id == b.id, AttendanceSession.timetable_slot_id.in_(slot_ids or [uuid.uuid4()]))
        .order_by(AttendanceSession.opens_at))).scalars().all()
    sess_out = []
    if sessions:
        recs = await db.execute(select(AttendanceRecord.session_id, AttendanceRecord.status, func.count())
                                .where(AttendanceRecord.session_id.in_([s.id for s in sessions]))
                                .group_by(AttendanceRecord.session_id, AttendanceRecord.status))
        cnt = defaultdict(dict)
        for sid, st, n in recs.all():
            cnt[sid][st] = n
        for s in sessions:
            k = cnt[s.id]
            att = k.get("present", 0) + k.get("late", 0)
            sess_out.append({"id": str(s.id), "name": s.session_name, "date": _iso(s.opens_at), "room": s.room,
                             "present": k.get("present", 0), "late": k.get("late", 0), "absent": k.get("absent", 0),
                             "excused": k.get("excused", 0), "attendance": tm.pct(att, att + k.get("absent", 0))})

    # assessments
    assessments = (await db.execute(select(Assessment).where(Assessment.batch_id == b.id, Assessment.course_id == c.id,
                                                              Assessment.created_by == trainer.id)
                                    .order_by(Assessment.created_at, Assessment.title))).scalars().all()
    ass_out, perf = [], []
    for a in assessments:
        r = await db.execute(select(func.avg(AssessmentAttempt.score), func.count(), func.count().filter(AssessmentAttempt.score >= a.passing_score))
                             .where(AssessmentAttempt.assessment_id == a.id, AssessmentAttempt.score.is_not(None)))
        avg_s, n, passed = r.one()
        item = {"id": str(a.id), "title": a.title, "status": a.status, "scheduled_at": _iso(a.scheduled_at),
                "questions": a.total_questions, "duration_minutes": a.duration_minutes,
                "submitted": n, "average": round(float(avg_s)) if avg_s is not None else None,
                "pass_rate": tm.pct(passed, n)}
        ass_out.append(item)
        if n:
            perf.append({"assessment": a.module_title or a.title, "average": item["average"], "pass_rate": item["pass_rate"]})

    # assignments
    asg = (await db.execute(select(Assignment).where(Assignment.batch_id == b.id).order_by(Assignment.deadline))).scalars().all()
    asg_out = []
    for a in asg:
        n = (await db.execute(select(func.count()).select_from(AssignmentSubmission).where(AssignmentSubmission.assignment_id == a.id))).scalar() or 0
        g = (await db.execute(select(func.count()).select_from(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == a.id, AssignmentSubmission.status == "graded"))).scalar() or 0
        asg_out.append({"id": str(a.id), "title": a.title, "deadline": _iso(a.deadline), "assigned": len(ids),
                        "submitted": n, "pending": max(0, len(ids) - n), "graded": g, "status": a.status})

    anns = (await db.execute(select(Announcement).where(Announcement.batch_id == b.id)
                             .order_by(Announcement.created_at.desc()).limit(10))).scalars().all()
    mods = (await db.execute(select(Module).where(Module.course_id == c.id).order_by(Module.position, Module.title))).scalars().all()

    attended = tm.avg([r["attendance"] for r in roster])
    at_risk = [r for r in roster if r["status"] == "at_risk"]
    return {
        "id": str(bc.id), "course": {"id": str(c.id), "title": c.title, "category": c.category},
        "batch": {"id": str(b.id), "name": b.name, "venue": b.venue}, "room": bc.room,
        "overview": {
            "course_progress": course_progress, "trainees": len(roster), "average_attendance": attended,
            "average_assessment": tm.avg([r["assessment"] for r in roster]),
            "completion_rate": tm.pct(sum(1 for v in ce.values() if v >= 100), len(ce)) if ce else None,
        },
        "charts": {"learning_progress": [{"bucket": k, "trainees": v} for k, v in buckets.items()],
                   "attendance_trend": [{"date": s["date"], "attendance": s["attendance"]} for s in sess_out][-10:],
                   "assessment_performance": perf},
        "at_risk_trainees": at_risk, "trainees": roster, "attendance_sessions": sess_out, "assessments": ass_out,
        "assignments": asg_out,
        "announcements": [{"id": str(a.id), "title": a.title, "message": a.message, "audience": a.audience_type,
                           "status": a.status, "created_at": _iso(a.created_at)} for a in anns],
        "content": [{"id": str(m.id), "title": m.title, "position": m.position, "duration_minutes": m.duration_minutes} for m in mods],
    }


# --------------------------------------------------------------------------
# Trainees
# --------------------------------------------------------------------------
@router.get("/trainees")
async def list_trainees(
    batch_id: Optional[uuid.UUID] = None, status: Optional[str] = None, q: Optional[str] = None,
    db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer),
):
    stats = await tm.compute_stats(db, trainer.id, [batch_id] if batch_id else None)
    rows = [tm.stat_dict(s) for s in stats.values()]
    if status:
        rows = [r for r in rows if r["status"] == status]
    if q:
        ql = q.lower()
        rows = [r for r in rows if ql in r["name"].lower() or ql in r["trainee_code"].lower()]
    rows.sort(key=lambda r: (r["batch"], r["name"]))
    classes = await tm.trainer_classes(db, trainer.id)
    batches = sorted({(str(b.id), b.name) for _, b, _ in classes}, key=lambda x: x[1])
    counts = {k: sum(1 for s in stats.values() if s.status == k) for k in tm.STATUS_LABEL}
    return {"trainees": rows, "total": len(rows), "batches": [{"id": i, "name": n} for i, n in batches], "status_counts": counts}


@router.get("/trainees/{trainee_id}")
async def trainee_detail(trainee_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    stats = await tm.compute_stats(db, trainer.id)
    s = stats.get(trainee_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Trainee not found")
    classes = [(bc, b, c) for bc, b, c in await tm.trainer_classes(db, trainer.id) if b.id == s.batch_id]
    course_ids = [c.id for _, _, c in classes]
    ce = {r.course_id: r for r in (await db.execute(select(CourseEnrollment).where(
        CourseEnrollment.trainee_id == trainee_id, CourseEnrollment.course_id.in_(course_ids)))).scalars()}
    courses = [{"class_id": str(bc.id), "course": c.title, "progress": ce[c.id].progress if c.id in ce else None,
                "last_accessed": _iso(ce[c.id].last_accessed) if c.id in ce else None} for bc, _, c in classes]

    attempts = (await db.execute(select(AssessmentAttempt, Assessment).join(Assessment, Assessment.id == AssessmentAttempt.assessment_id)
                                 .where(AssessmentAttempt.trainee_id == trainee_id, Assessment.batch_id == s.batch_id,
                                        Assessment.created_by == trainer.id)
                                 .order_by(AssessmentAttempt.submitted_at.desc()))).all()
    results = [{"assessment_id": str(a.id), "attempt_id": str(t.id), "title": a.title, "score": t.score, "passed": t.passed,
                "status": "needs_review" if t.status == "needs_review" else ("passed" if t.passed else "failed"),
                "submitted_at": _iso(t.submitted_at)} for t, a in attempts]

    asg = (await db.execute(select(Assignment).where(Assignment.batch_id == s.batch_id).order_by(Assignment.deadline))).scalars().all()
    subs = {x.assignment_id: x for x in (await db.execute(select(AssignmentSubmission).where(
        AssignmentSubmission.trainee_id == trainee_id))).scalars()}
    now = datetime.now(timezone.utc)
    assignments = []
    for a in asg:
        x = subs.get(a.id)
        st = x.status if x else ("overdue" if a.deadline and a.deadline < now else "pending")
        assignments.append({"id": str(a.id), "title": a.title, "deadline": _iso(a.deadline), "status": st,
                            "marks": x.marks if x else None, "max_marks": a.max_marks})

    skills = (await db.execute(select(Skill.name, TraineeSkill.confidence, TraineeSkill.level, TraineeSkill.verified)
                               .join(TraineeSkill, TraineeSkill.skill_id == Skill.id)
                               .where(TraineeSkill.trainee_id == trainee_id).order_by(TraineeSkill.confidence.desc()))).all()
    certs = (await db.execute(select(Certificate).where(Certificate.trainee_id == trainee_id, Certificate.revoked_at.is_(None)))).scalars().all()
    obs = (await db.execute(select(SkillEvaluation).where(SkillEvaluation.trainee_id == trainee_id, SkillEvaluation.trainer_id == trainer.id)
                            .order_by(SkillEvaluation.created_at.desc()).limit(10))).scalars().all()

    sess = (await db.execute(select(AttendanceSession.session_name, AttendanceSession.opens_at, AttendanceRecord.status)
        .join(AttendanceRecord, AttendanceRecord.session_id == AttendanceSession.id)
        .where(AttendanceRecord.trainee_id == trainee_id, AttendanceSession.batch_id == s.batch_id)
        .order_by(AttendanceSession.opens_at.desc()).limit(8))).all()
    activity = [{"type": "attendance", "text": f"{st.capitalize()} — {n}", "at": _iso(at)} for n, at, st in sess]
    activity += [{"type": "assessment", "text": f"Scored {r['score']}% in {r['title']}", "at": r["submitted_at"]} for r in results[:4]]
    activity.sort(key=lambda x: x["at"] or "", reverse=True)

    d = tm.stat_dict(s)
    # Only educational fields: no email/phone/address are returned to the trainer view.
    return {
        "profile": {"id": d["id"], "trainee_code": d["trainee_code"], "name": d["name"], "batch": d["batch"], "batch_id": d["batch_id"],
                    "status": d["status"], "status_label": d["status_label"]},
        "performance": {"learning": d["learning"], "attendance": d["attendance"], "assessment": d["assessment"],
                        "assignment": d["assignment"], "skill_readiness": d["skill_readiness"], "last_activity": d["last_activity"],
                        "inactive_days": d["inactive_days"], "risk_reasons": d["risk_reasons"]},
        "courses": courses, "assessments": results, "assignments": assignments,
        "skills": [{"skill": n, "proficiency": c, "level": lv, "verified": v} for n, c, lv, v in skills],
        "certificates": [{"id": str(x.id), "programme": x.programme_title, "issued": _iso(x.issue_date), "grade": x.grade} for x in certs],
        "observations": [{"id": str(o.id), "dimension": o.dimension, "rating": o.rating, "observation": o.observation,
                          "created_at": _iso(o.created_at)} for o in obs],
        "recent_activity": activity[:10],
    }


# --------------------------------------------------------------------------
# Calendar
# --------------------------------------------------------------------------
@router.get("/calendar")
async def calendar(
    start: Optional[date] = Query(None), end: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer),
):
    today = tm.now_ist().date()
    start = start or today.replace(day=1)
    end = end or (start + timedelta(days=42))
    if (end - start).days > 120 or end < start:
        raise HTTPException(status_code=400, detail="Range must be 0-120 days")
    classes = await tm.trainer_classes(db, trainer.id)
    batch_ids = list({b.id for _, b, _ in classes})
    batch_name = {b.id: b.name for _, b, _ in classes}
    class_id = {(b.id, c.id): str(bc.id) for bc, b, c in classes}
    slots = await _slots_for_trainer(db, trainer.id)
    cancelled = await _cancelled(db, [s.id for s in slots], start, end)
    events = []
    for s, d in _occurrences(slots, start, end, cancelled):
        events.append({
            "id": f"class-{s.id}-{d}", "type": "class", "title": s.title, "batch": batch_name.get(s.batch_id),
            "date": d.isoformat(), "start": _hhmm(s.start_time), "end": _hhmm(s.end_time), "room": s.room,
            "link": f"/trainer/classes/{class_id.get((s.batch_id, s.course_id))}" if class_id.get((s.batch_id, s.course_id)) else None})
    lo = datetime.combine(start, time.min, tzinfo=tm.IST)
    hi = datetime.combine(end + timedelta(days=1), time.min, tzinfo=tm.IST)
    for a in (await db.execute(select(Assessment).where(
            Assessment.batch_id.in_(batch_ids), Assessment.created_by == trainer.id, Assessment.status != "draft",
            Assessment.scheduled_at >= lo, Assessment.scheduled_at < hi))).scalars():
        at = a.scheduled_at.astimezone(tm.IST)
        events.append({"id": f"assessment-{a.id}", "type": "assessment", "title": a.title, "batch": batch_name.get(a.batch_id),
                       "date": at.date().isoformat(), "start": at.strftime("%H:%M"), "end": None, "room": None,
                       "link": f"/trainer/assessments/{a.id}"})
    for a in (await db.execute(select(Assignment).where(
            Assignment.batch_id.in_(batch_ids), Assignment.created_by == trainer.id, Assignment.status == "published",
            Assignment.deadline >= lo, Assignment.deadline < hi))).scalars():
        at = a.deadline.astimezone(tm.IST)
        events.append({"id": f"assignment-{a.id}", "type": "assignment", "title": f"Due: {a.title}", "batch": batch_name.get(a.batch_id),
                       "date": at.date().isoformat(), "start": at.strftime("%H:%M"), "end": None, "room": None,
                       "link": "/trainer/assignments"})
    events.sort(key=lambda e: (e["date"], e["start"] or ""))
    return {"start": start.isoformat(), "end": end.isoformat(), "events": events}


# --------------------------------------------------------------------------
# Feature sub-routers (each module owns its own endpoints; all under /api/v1/trainer)
# --------------------------------------------------------------------------
from app.api.v1 import (  # noqa: E402
    trainer_ai, trainer_assessments, trainer_assignments, trainer_attendance, trainer_comms, trainer_content,
    trainer_reports, trainer_skills,
)

for _m in (trainer_attendance, trainer_assessments, trainer_assignments, trainer_skills, trainer_comms,
           trainer_content, trainer_reports, trainer_ai):
    router.include_router(_m.router)
