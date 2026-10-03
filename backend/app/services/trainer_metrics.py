"""Per-trainee / per-class metrics for the trainer workspace.

Everything is derived from stored rows (attendance records, course enrollments,
assessment attempts, assignment submissions, trainee skills). Nothing here is
fabricated: a metric with no underlying data is returned as None, not 0.

Risk uses measurable educational indicators only.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Batch, BatchCourse, Course, Enrollment, User, AttendanceSession, AttendanceRecord, CourseEnrollment,
    Assessment, AssessmentAttempt, Assignment, AssignmentSubmission, TraineeSkill,
)

IST = ZoneInfo("Asia/Kolkata")

LOW_ATTENDANCE = 70
LOW_LEARNING = 50
LOW_SCORE = 50
INACTIVE_DAYS = 5
ATTENDED = ("present", "late")


def now_ist() -> datetime:
    return datetime.now(IST)


def pct(num: float, den: float) -> Optional[int]:
    return round(100 * num / den) if den else None


def avg(values) -> Optional[int]:
    vals = [v for v in values if v is not None]
    return round(sum(vals) / len(vals)) if vals else None


@dataclass
class TraineeStat:
    trainee: User
    batch_id: uuid.UUID
    batch_name: str
    enrollment_status: str
    attendance: Optional[int] = None
    learning: Optional[int] = None
    assessment: Optional[int] = None
    assignment: Optional[int] = None
    overdue_assignments: int = 0
    skill_readiness: Optional[int] = None
    last_activity: Optional[datetime] = None
    reasons: list[str] = field(default_factory=list)
    status: str = "on_track"

    @property
    def inactive_days(self) -> Optional[int]:
        if self.last_activity is None:
            return None
        return max(0, (datetime.now(timezone.utc) - self.last_activity).days)


def classify(s: TraineeStat) -> None:
    reasons: list[str] = []
    if s.attendance is not None and s.attendance < LOW_ATTENDANCE:
        reasons.append("Low attendance")
    if s.learning is not None and s.learning < LOW_LEARNING:
        reasons.append("Incomplete learning")
    if s.assessment is not None and s.assessment < LOW_SCORE:
        reasons.append("Low assessment scores")
    if s.overdue_assignments >= 2 or (s.overdue_assignments >= 1 and (s.assignment or 0) < 50):
        reasons.append("Overdue assignments")
    if s.inactive_days is not None and s.inactive_days >= INACTIVE_DAYS:
        reasons.append(f"No activity for {s.inactive_days} days")
    s.reasons = reasons
    if s.learning == 100 and not reasons:
        s.status = "completed"
    elif len(reasons) >= 2 or (s.attendance is not None and s.attendance < 65):
        s.status = "at_risk"
    elif reasons:
        s.status = "needs_attention"
    else:
        s.status = "on_track"


STATUS_LABEL = {"on_track": "On Track", "needs_attention": "Needs Attention", "at_risk": "At Risk", "completed": "Completed"}


async def trainer_classes(db: AsyncSession, trainer_id: uuid.UUID):
    """[(BatchCourse, Batch, Course)] the trainer teaches - the permission root."""
    rows = await db.execute(
        select(BatchCourse, Batch, Course)
        .join(Batch, Batch.id == BatchCourse.batch_id)
        .join(Course, Course.id == BatchCourse.course_id)
        .where(BatchCourse.trainer_id == trainer_id)
        .order_by(Batch.name, Course.title)
    )
    return rows.all()


async def compute_stats(db: AsyncSession, trainer_id: uuid.UUID, batch_ids: Optional[list[uuid.UUID]] = None) -> dict[uuid.UUID, TraineeStat]:
    """TraineeStat per trainee across the trainer's batches (optionally narrowed)."""
    classes = await trainer_classes(db, trainer_id)
    allowed = {b.id for _, b, _ in classes}
    target = [b for b in (batch_ids or allowed) if b in allowed]
    if not target:
        return {}
    course_ids_by_batch: dict[uuid.UUID, list[uuid.UUID]] = {}
    for bc, b, _ in classes:
        course_ids_by_batch.setdefault(b.id, []).append(bc.course_id)

    enr = (await db.execute(
        select(Enrollment, User, Batch).join(User, User.id == Enrollment.trainee_id).join(Batch, Batch.id == Enrollment.batch_id)
        .where(Enrollment.batch_id.in_(target)))).all()
    stats: dict[uuid.UUID, TraineeStat] = {}
    for e, u, b in enr:
        stats[u.id] = TraineeStat(trainee=u, batch_id=b.id, batch_name=b.name, enrollment_status=e.status or "active")
    if not stats:
        return {}
    ids = list(stats)
    batch_of = {tid: s.batch_id for tid, s in stats.items()}

    # attendance
    att = await db.execute(
        select(AttendanceRecord.trainee_id, AttendanceRecord.status, func.count())
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .where(AttendanceSession.batch_id.in_(target), AttendanceRecord.trainee_id.in_(ids))
        .group_by(AttendanceRecord.trainee_id, AttendanceRecord.status))
    counts: dict[uuid.UUID, dict[str, int]] = {}
    for tid, st, n in att.all():
        counts.setdefault(tid, {})[st] = n
    for tid, c in counts.items():
        attended = sum(c.get(k, 0) for k in ATTENDED)
        denom = attended + c.get("absent", 0)  # excused sessions don't count against the trainee
        stats[tid].attendance = pct(attended, denom)

    # learning progress + last activity
    ce = await db.execute(select(CourseEnrollment).where(CourseEnrollment.trainee_id.in_(ids)))
    per: dict[uuid.UUID, list[int]] = {}
    for r in ce.scalars():
        if r.course_id in course_ids_by_batch.get(batch_of[r.trainee_id], []):
            per.setdefault(r.trainee_id, []).append(r.progress or 0)
            la = r.last_accessed
            if la is not None:
                if la.tzinfo is None:
                    la = la.replace(tzinfo=timezone.utc)
                cur = stats[r.trainee_id].last_activity
                if cur is None or la > cur:
                    stats[r.trainee_id].last_activity = la
    for tid, vals in per.items():
        stats[tid].learning = avg(vals)

    # assessments (submitted attempts of published/completed assessments of these batches)
    aa = await db.execute(
        select(AssessmentAttempt.trainee_id, AssessmentAttempt.score)
        .join(Assessment, Assessment.id == AssessmentAttempt.assessment_id)
        .where(Assessment.batch_id.in_(target), Assessment.status != "draft",
               AssessmentAttempt.trainee_id.in_(ids), AssessmentAttempt.score.is_not(None)))
    sc: dict[uuid.UUID, list[int]] = {}
    for tid, score in aa.all():
        sc.setdefault(tid, []).append(score)
    for tid, vals in sc.items():
        stats[tid].assessment = avg(vals)

    # assignments
    asg = (await db.execute(select(Assignment).where(Assignment.batch_id.in_(target), Assignment.status == "published"))).scalars().all()
    subs = (await db.execute(select(AssignmentSubmission.assignment_id, AssignmentSubmission.trainee_id)
                             .where(AssignmentSubmission.trainee_id.in_(ids)))).all()
    submitted = {(a, t) for a, t in subs}
    now = datetime.now(timezone.utc)
    for tid, s in stats.items():
        mine = [a for a in asg if a.batch_id == s.batch_id]
        done = sum(1 for a in mine if (a.id, tid) in submitted)
        s.assignment = pct(done, len(mine))
        s.overdue_assignments = sum(1 for a in mine if a.deadline and a.deadline < now and (a.id, tid) not in submitted)

    # skill readiness
    sk = await db.execute(select(TraineeSkill.trainee_id, func.avg(TraineeSkill.confidence))
                          .where(TraineeSkill.trainee_id.in_(ids)).group_by(TraineeSkill.trainee_id))
    for tid, a in sk.all():
        stats[tid].skill_readiness = round(float(a)) if a is not None else None

    for s in stats.values():
        classify(s)
    return stats


def stat_dict(s: TraineeStat) -> dict:
    return {
        "id": str(s.trainee.id),
        "trainee_code": f"TR-{str(s.trainee.id)[:6].upper()}",
        "name": s.trainee.full_name,
        "batch": s.batch_name,
        "batch_id": str(s.batch_id),
        "attendance": s.attendance,
        "learning": s.learning,
        "assessment": s.assessment,
        "assignment": s.assignment,
        "skill_readiness": s.skill_readiness,
        "last_activity": s.last_activity.isoformat() if s.last_activity else None,
        "inactive_days": s.inactive_days,
        "status": s.status,
        "status_label": STATUS_LABEL[s.status],
        "risk_reasons": s.reasons,
    }
