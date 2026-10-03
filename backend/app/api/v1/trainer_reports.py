"""Trainer reports + analytics (included under /api/v1/trainer).

Everything is derived from stored rows and scoped through
`trainer_metrics.trainer_classes` (the permission root). Trainee contact
details (email/phone) are never exposed. PDF export is not implemented
server-side (no PDF library in requirements); the frontend prints a styled view.
"""
import csv
import io
import uuid
from collections import defaultdict
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Assessment, AssessmentAttempt, AttendanceRecord, AttendanceSession, CourseEnrollment, Enrollment, Skill,
    SkillEvaluation, TimetableSlot, TraineeSkill, User,
)
from app.services import trainer_metrics as tm

router = APIRouter()

DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"


async def _trainer(x_demo_user: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


def _uuid(v: Optional[str], name: str) -> Optional[uuid.UUID]:
    if not v:
        return None
    try:
        return uuid.UUID(v)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid {name}")


async def _scope(db, trainer, batch_id: Optional[str], course_id: Optional[str]):
    """Returns (classes filtered, batch_ids list). 403 if filter is outside the trainer's classes."""
    classes = await tm.trainer_classes(db, trainer.id)
    b, c = _uuid(batch_id, "batch_id"), _uuid(course_id, "course_id")
    if b and b not in {bb.id for _, bb, _ in classes}:
        raise HTTPException(status_code=403, detail="Batch is not one of your classes")
    if c and c not in {cc.id for _, _, cc in classes}:
        raise HTTPException(status_code=403, detail="Course is not one of your classes")
    sel = [x for x in classes if (not b or x[1].id == b) and (not c or x[2].id == c)]
    return sel, list({bb.id for _, bb, _ in sel}), c


def _d(dt: Optional[datetime]) -> Optional[str]:
    return dt.astimezone(tm.IST).date().isoformat() if dt else None


def _avgf(vals, nd=0):
    vals = [v for v in vals if v is not None]
    if not vals:
        return None
    r = sum(vals) / len(vals)
    return round(r, nd) if nd else round(r)


async def _assessment_rows(db, trainer, batch_ids, course_id):
    q = select(Assessment).where(Assessment.batch_id.in_(batch_ids), Assessment.created_by == trainer.id,
                                 Assessment.status != "draft")
    if course_id:
        q = q.where(Assessment.course_id == course_id)
    assessments = list((await db.execute(q)).scalars())
    scores: dict = defaultdict(list)
    if assessments:
        rows = await db.execute(select(AssessmentAttempt.assessment_id, AssessmentAttempt.score, AssessmentAttempt.passed)
                                .where(AssessmentAttempt.assessment_id.in_([a.id for a in assessments]),
                                       AssessmentAttempt.score.is_not(None)))
        for aid, s, p in rows.all():
            scores[aid].append((s, p))
    out = []
    for a in assessments:
        sc = scores.get(a.id, [])
        passed = [(p if p is not None else s >= (a.passing_score or 60)) for s, p in sc]
        out.append({"a": a, "date": a.scheduled_at or a.due_date, "n": len(sc),
                    "avg": _avgf([s for s, _ in sc]), "hi": max((s for s, _ in sc), default=None),
                    "lo": min((s for s, _ in sc), default=None),
                    "pass": tm.pct(sum(passed), len(passed)), "passed_n": sum(passed)})
    out.sort(key=lambda r: (r["date"] is None, r["date"] or datetime.min.astimezone()))
    return out


# --------------------------------------------------------------------------
# Analytics
# --------------------------------------------------------------------------
@router.get("/analytics")
async def analytics(batch_id: Optional[str] = Query(None), db: AsyncSession = Depends(get_db),
                    trainer: User = Depends(_trainer)):
    classes, batch_ids, _ = await _scope(db, trainer, batch_id, None)
    batches = [{"id": str(b.id), "name": b.name} for b in {b.id: b for _, b, _ in await tm.trainer_classes(db, trainer.id)}.values()]
    if not batch_ids:
        return {"empty": True, "batches": batches}
    now = tm.now_ist()
    stats = await tm.compute_stats(db, trainer.id, batch_ids)
    trainee_ids = list(stats)
    batch_of = {tid: s.batch_id for tid, s in stats.items()}

    # attendance trend (per past session)
    sess = (await db.execute(select(AttendanceSession.id, AttendanceSession.opens_at, AttendanceSession.session_name)
                             .where(AttendanceSession.batch_id.in_(batch_ids), AttendanceSession.created_by == trainer.id,
                                    AttendanceSession.opens_at < now)
                             .order_by(AttendanceSession.opens_at))).all()
    per = defaultdict(lambda: defaultdict(int))
    if sess:
        for sid, st, n in (await db.execute(
                select(AttendanceRecord.session_id, AttendanceRecord.status, func.count())
                .where(AttendanceRecord.session_id.in_([s[0] for s in sess]))
                .group_by(AttendanceRecord.session_id, AttendanceRecord.status))).all():
            per[sid][st] = n
    att_trend = []
    for sid, opens, name in sess:
        c = per.get(sid, {})
        att = sum(c.get(k, 0) for k in tm.ATTENDED)
        p = tm.pct(att, att + c.get("absent", 0))
        if p is not None:
            att_trend.append({"date": _d(opens), "label": opens.astimezone(tm.IST).strftime("%d %b"), "session": name, "attendance": p})

    # assessments
    arows = await _assessment_rows(db, trainer, batch_ids, None)
    assess_trend = [{"label": r["a"].title, "date": _d(r["date"]), "average": r["avg"], "pass_rate": r["pass"], "attempts": r["n"]}
                    for r in arows if r["n"]]
    total_n = sum(r["n"] for r in arows)
    pass_rate = tm.pct(sum(r["passed_n"] for r in arows), total_n)
    assess_avg = _avgf([s for s in (v.assessment for v in stats.values())])

    # learning completion per class
    learning = []
    ce_rows = (await db.execute(select(CourseEnrollment.trainee_id, CourseEnrollment.course_id, CourseEnrollment.progress)
                                .where(CourseEnrollment.trainee_id.in_(trainee_ids)))).all() if trainee_ids else []
    for bc, b, c in classes:
        vals = [p or 0 for t, cid, p in ce_rows if cid == c.id and batch_of.get(t) == b.id]
        if vals:
            learning.append({"label": f"{b.name} · {c.title}", "batch": b.name, "course": c.title,
                             "completion": round(sum(vals) / len(vals)), "trainees": len(vals)})

    # skill growth
    by_skill = (await db.execute(
        select(Skill.name, func.avg(TraineeSkill.confidence), func.count())
        .join(Skill, Skill.id == TraineeSkill.skill_id).where(TraineeSkill.trainee_id.in_(trainee_ids))
        .group_by(Skill.name).order_by(func.avg(TraineeSkill.confidence).desc()).limit(8))).all() if trainee_ids else []
    month_expr = func.to_char(func.timezone("Asia/Kolkata", SkillEvaluation.created_at), "YYYY-MM")
    by_month = (await db.execute(
        select(month_expr, func.avg(SkillEvaluation.rating), func.count())
        .where(SkillEvaluation.trainee_id.in_(trainee_ids), SkillEvaluation.trainer_id == trainer.id)
        .group_by(month_expr).order_by(month_expr))).all() if trainee_ids else []

    vals = list(stats.values())
    learning_all = _avgf([s.learning for s in vals])
    return {
        "empty": False, "batches": batches, "batch_id": batch_id,
        "metrics": {
            "classes_conducted": len(sess),
            "attendance_avg": _avgf([s.attendance for s in vals]),
            "course_completion": learning_all,
            "assessment_avg": assess_avg,
            "pass_rate": pass_rate,
            "at_risk": sum(1 for s in vals if s.status == "at_risk"),
            "trainees": len(vals),
        },
        "attendance_trend": att_trend,
        "assessment_trend": assess_trend,
        "learning_completion": learning,
        "skill_growth": {
            "by_skill": [{"skill": n, "confidence": round(float(a)), "trainees": c} for n, a, c in by_skill if a is not None],
            "by_month": [{"month": m, "rating": round(float(a), 2), "evaluations": c} for m, a, c in by_month if a is not None],
        },
    }


# --------------------------------------------------------------------------
# Reports
# --------------------------------------------------------------------------
REPORT_TYPES = [
    {"type": "attendance", "title": "Attendance Report", "description": "Per-trainee present, late, absent and excused sessions with attendance %."},
    {"type": "assessment", "title": "Assessment Report", "description": "Per-assessment attempts, average, highest, lowest and pass rate."},
    {"type": "course_progress", "title": "Course Progress Report", "description": "Learning completion for every class you teach."},
    {"type": "trainee_performance", "title": "Trainee Performance Report", "description": "Attendance, learning, assessment, assignments, skill readiness and status per trainee."},
    {"type": "skill_development", "title": "Skill Development Report", "description": "Average confidence and verification per skill across your trainees."},
]


@router.get("/reports/types")
async def report_types(db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    classes = await tm.trainer_classes(db, trainer.id)
    return {
        "types": REPORT_TYPES,
        "batches": [{"id": str(b.id), "name": b.name} for b in {b.id: b for _, b, _ in classes}.values()],
        "courses": [{"id": str(c.id), "title": c.title, "batch_id": str(b.id)} for _, b, c in classes],
        "pdf": False,
    }


async def _build(db, trainer, rtype, batch_id, course_id):
    classes, batch_ids, cid = await _scope(db, trainer, batch_id, course_id)
    if not batch_ids:
        return [], [], {"records": 0}
    if rtype == "attendance":
        stats = await tm.compute_stats(db, trainer.id, batch_ids)
        q = (select(AttendanceRecord.trainee_id, AttendanceRecord.status, func.count())
             .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
             .where(AttendanceSession.batch_id.in_(batch_ids), AttendanceRecord.trainee_id.in_(list(stats) or [uuid.uuid4()])))
        if cid:
            q = q.join(TimetableSlot, TimetableSlot.id == AttendanceSession.timetable_slot_id).where(TimetableSlot.course_id == cid)
        cnt = defaultdict(lambda: defaultdict(int))
        for t, s, n in (await db.execute(q.group_by(AttendanceRecord.trainee_id, AttendanceRecord.status))).all():
            cnt[t][s] = n
        cols = ["Trainee", "Batch", "Present", "Late", "Absent", "Excused", "Attendance %"]
        rows = []
        for tid, s in sorted(stats.items(), key=lambda kv: (kv[1].batch_name, kv[1].trainee.full_name or "")):
            c = cnt.get(tid, {})
            att = c.get("present", 0) + c.get("late", 0)
            rows.append([s.trainee.full_name, s.batch_name, c.get("present", 0), c.get("late", 0), c.get("absent", 0),
                         c.get("excused", 0), tm.pct(att, att + c.get("absent", 0))])
        return cols, rows, {"records": len(rows), "average_attendance_pct": _avgf([r[6] for r in rows])}
    if rtype == "assessment":
        bname = {b.id: b.name for _, b, _ in classes}
        ar = await _assessment_rows(db, trainer, batch_ids, cid)
        cols = ["Assessment", "Batch", "Date", "Attempts", "Average", "Highest", "Lowest", "Pass rate %"]
        rows = [[r["a"].title, bname.get(r["a"].batch_id), _d(r["date"]), r["n"], r["avg"], r["hi"], r["lo"], r["pass"]] for r in ar]
        return cols, rows, {"records": len(rows), "average_score": _avgf([r[4] for r in rows])}
    if rtype == "course_progress":
        stats = await tm.compute_stats(db, trainer.id, batch_ids)
        batch_of = {t: s.batch_id for t, s in stats.items()}
        ce = (await db.execute(select(CourseEnrollment.trainee_id, CourseEnrollment.course_id, CourseEnrollment.progress)
                               .where(CourseEnrollment.trainee_id.in_(list(stats) or [uuid.uuid4()])))).all()
        roster = defaultdict(int)
        for s in stats.values():
            roster[s.batch_id] += 1
        cols = ["Batch", "Course", "Trainees", "Started", "Average progress %", "Completed (100%)"]
        rows = []
        for _, b, c in classes:
            v = [p or 0 for t, cc, p in ce if cc == c.id and batch_of.get(t) == b.id]
            rows.append([b.name, c.title, roster.get(b.id, 0), len(v), _avgf(v) if v else None, sum(1 for p in v if p >= 100)])
        return cols, rows, {"records": len(rows), "average_progress_pct": _avgf([r[4] for r in rows])}
    if rtype == "trainee_performance":
        stats = await tm.compute_stats(db, trainer.id, batch_ids)
        cols = ["Trainee", "Batch", "Attendance %", "Learning %", "Assessment avg", "Assignments %", "Skill readiness %", "Status", "Risk reasons"]
        rows = []
        for s in sorted(stats.values(), key=lambda s: (s.batch_name, s.trainee.full_name or "")):
            d = tm.stat_dict(s)
            rows.append([d["name"], d["batch"], d["attendance"], d["learning"], d["assessment"], d["assignment"],
                         d["skill_readiness"], d["status_label"], "; ".join(d["risk_reasons"])])
        return cols, rows, {"records": len(rows), "at_risk": sum(1 for r in rows if r[7] == "At Risk")}
    if rtype == "skill_development":
        stats = await tm.compute_stats(db, trainer.id, batch_ids)
        ids = list(stats) or [uuid.uuid4()]
        res = (await db.execute(
            select(Skill.name, Skill.category, func.count(), func.avg(TraineeSkill.confidence),
                   func.count().filter(TraineeSkill.verified.is_(True)))
            .join(Skill, Skill.id == TraineeSkill.skill_id).where(TraineeSkill.trainee_id.in_(ids))
            .group_by(Skill.name, Skill.category).order_by(Skill.name))).all()
        cols = ["Skill", "Category", "Trainees", "Average confidence %", "Verified"]
        rows = [[n, cat, c, round(float(a)) if a is not None else None, v] for n, cat, c, a, v in res]
        return cols, rows, {"records": len(rows), "average_confidence_pct": _avgf([r[3] for r in rows])}
    raise HTTPException(status_code=404, detail="Unknown report type")


def _safe(v):
    if v is None:
        return ""
    s = str(v)
    return "'" + s if s[:1] in ("=", "+", "-", "@", "\t", "\r") else s  # CSV formula-injection guard


@router.get("/reports/{rtype}")
async def report(rtype: str, batch_id: Optional[str] = Query(None), course_id: Optional[str] = Query(None),
                 fmt: str = Query("json"), db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    if rtype not in {t["type"] for t in REPORT_TYPES}:
        raise HTTPException(status_code=404, detail="Unknown report type")
    if fmt not in ("json", "csv"):
        raise HTTPException(status_code=400, detail="fmt must be json or csv (PDF: use the print view)")
    cols, rows, summary = await _build(db, trainer, rtype, batch_id, course_id)
    if fmt == "csv":
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(cols)
        for r in rows:
            w.writerow([_safe(c) for c in r])
        stamp = tm.now_ist().strftime("%Y%m%d")
        return Response(buf.getvalue(), media_type="text/csv; charset=utf-8",
                        headers={"Content-Disposition": f'attachment; filename="{rtype}-report-{stamp}.csv"'})
    return {"type": rtype, "generated_at": tm.now_ist().isoformat(), "columns": cols, "rows": rows, "summary": summary}
