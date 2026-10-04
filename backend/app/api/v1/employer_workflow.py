"""Employer dashboard, interviews, offers, talent pool, post-hire feedback,
analytics, reports, company profile, team and settings (mounted at /employer).

Every decision here is a human-initiated, deterministic database write. No LLM
output is read or persisted. Interview decisions are set only by an authenticated
employer through PATCH, never by the evaluation endpoint."""
import csv
import io
import math
import uuid
from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Literal, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.jobs import _TRANSITIONS, submit_employer_feedback
from app.database import get_db
from app.deps import GLOBAL_ROLES, assert_org_access, org_scope, require_roles
from app.models.employer_workflow import (
    FEEDBACK_KEYS, NOTIFICATION_DEFAULTS, EmployerFeedbackRatings, EmployerOrgProfile, EmployerTeamMember,
    EmployerUserPreferences, Interview, Offer, TalentPoolEntry,
)
from app.models.job import Application, EmployerFeedback, Job, JobMatch
from app.models.profile import UserProfile
from app.models.skill import Skill, TraineeSkill
from app.models.user import Organisation, User
from app.schemas.job import FeedbackCreate
from app.services.notifications import notify

router = APIRouter()

_employer = require_roles("employer", "admin")
IST = ZoneInfo("Asia/Kolkata")
ADMIN_ROLE = "employer_admin"
RECRUITER_ROLE = "recruiter"
PIPELINE_BEYOND_SHORTLIST = ("shortlisted", "interview", "offered", "hired")
OFFER_TRANSITIONS = {
    "draft": {"sent", "withdrawn"},
    "sent": {"accepted", "declined", "withdrawn", "expired"},
    "accepted": set(), "declined": set(), "withdrawn": set(), "expired": set(),
}
TalentCategory = Literal["saved", "high_potential", "future_hiring", "interviewed", "previously_hired"]
TeamRoleName = Literal["employer_admin", "recruiter", "hiring_manager"]
Recommendation = Literal["strongly_recommend", "recommend", "undecided", "not_recommend"]
REPORT_CATALOG = {
    "recruitment": ("Recruitment pipeline", "Every application to your postings with its current stage."),
    "hiring_funnel": ("Hiring funnel", "Applications counted at each stage of the pipeline."),
    "job_performance": ("Job performance", "Applications, shortlists, interviews and hires per posting."),
    "candidate_skills": ("Candidate skills", "Verified and self-reported skills of candidates who applied to you."),
    "interview": ("Interviews", "Scheduled, completed and cancelled interviews with outcomes."),
    "employment": ("Employment", "Offers and their responses, with hires."),
    "employer_feedback": ("Post-hire feedback", "Six-criteria feedback logged for hired candidates."),
}
REPORT_PREVIEW_ROWS = 25


# ---------------------------------------------------------------- helpers

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value) -> Optional[str]:
    return value.isoformat() if value else None


def _round_half_up(value: float) -> int:
    return math.floor(value + 0.5)


def _caller_org_id(user: User) -> uuid.UUID:
    org_id = org_scope(user) or user.organisation_id
    if org_id is None:
        raise HTTPException(status_code=422, detail="No organisation is linked to this account")
    return org_id


def _employer_job_ids(scope: Optional[uuid.UUID]):
    query = select(Job.id).where(Job.source == "employer")
    if scope is not None:
        query = query.where(Job.organisation_id == scope)
    return query


def _ist_day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=IST)
    return start, start + timedelta(days=1)


def _month_key(value: datetime) -> str:
    return value.astimezone(IST).strftime("%Y-%m")


def _last_months(count: int) -> list[str]:
    today = datetime.now(IST).date()
    year, month = today.year, today.month
    keys = []
    for _ in range(count):
        keys.insert(0, f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    return keys


def _location(district: Optional[str], state: Optional[str]) -> Optional[str]:
    return ", ".join(v for v in (district, state) if v) or None


def _email_match(email: str):
    return func.lower(User.email) == email.strip().lower()


def _pct(numerator: int, denominator: int) -> Optional[float]:
    return round(100.0 * numerator / denominator, 1) if denominator else None


def _advance(application: Application, target: str) -> None:
    """Move an application along the existing state machine in jobs._TRANSITIONS,
    the same rules update_application enforces."""
    if application.status == target:
        return
    if target not in _TRANSITIONS.get(application.status, set()):
        raise HTTPException(status_code=422, detail=f"Application cannot move from {application.status} to {target}")
    application.status = target
    application.updated_at = _now()


async def _wants(db: AsyncSession, user_id: uuid.UUID, key: str) -> bool:
    prefs = await db.get(EmployerUserPreferences, user_id)
    merged = {**NOTIFICATION_DEFAULTS, **((prefs.notifications if prefs else None) or {})}
    return bool(merged.get(key, True))


async def _load_application(db: AsyncSession, application_id: uuid.UUID, user: User) -> tuple[Application, Job]:
    row = (await db.execute(select(Application, Job).join(Job, Job.id == Application.job_id)
                            .where(Application.id == application_id))).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    application, job = row
    assert_org_access(user, job.organisation_id)
    if job.source != "employer":
        raise HTTPException(status_code=422, detail="Only CoopSetu postings support this workflow")
    return application, job


async def _load_interview(db: AsyncSession, interview_id: uuid.UUID, user: User):
    row = (await db.execute(select(Interview, Job.title, User.full_name)
                            .join(Job, Job.id == Interview.job_id)
                            .join(User, User.id == Interview.trainee_id)
                            .where(Interview.id == interview_id))).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    assert_org_access(user, row[0].organisation_id)
    return row


async def _load_offer(db: AsyncSession, offer_id: uuid.UUID, user: User):
    row = (await db.execute(select(Offer, Job.title, User.full_name)
                            .join(Job, Job.id == Offer.job_id)
                            .join(User, User.id == Offer.trainee_id)
                            .where(Offer.id == offer_id))).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Offer not found")
    assert_org_access(user, row[0].organisation_id)
    return row


def _interview_out(iv: Interview, job_title: Optional[str], candidate_name: Optional[str]) -> dict:
    evaluation = iv.evaluation or {}
    return {
        "id": str(iv.id), "application_id": str(iv.application_id), "job_id": str(iv.job_id),
        "job_title": job_title, "trainee_id": str(iv.trainee_id), "candidate_name": candidate_name,
        "scheduled_at": _iso(iv.scheduled_at), "duration_minutes": iv.duration_minutes, "mode": iv.mode,
        "meeting_link": iv.meeting_link, "interviewer_name": iv.interviewer_name, "notes": iv.notes,
        "status": iv.status, "decision": iv.decision,
        "overall_recommendation": evaluation.get("overall_recommendation"),
        "overall_rating": iv.overall_rating,
        "evaluation": evaluation.get("scores"),
        "evaluation_notes": evaluation.get("notes"),
        "created_at": _iso(iv.created_at),
    }


def _offer_out(offer: Offer, job_title: Optional[str], candidate_name: Optional[str]) -> dict:
    return {
        "id": str(offer.id), "application_id": str(offer.application_id), "job_id": str(offer.job_id),
        "job_title": job_title, "trainee_id": str(offer.trainee_id), "candidate_name": candidate_name,
        "status": offer.status, "salary": offer.salary, "employment_type": offer.employment_type,
        "joining_date": offer.joining_date.isoformat() if offer.joining_date else None,
        "location": offer.location, "benefits": offer.benefits, "additional_terms": offer.additional_terms,
        "sent_at": _iso(offer.sent_at), "responded_at": _iso(offer.responded_at),
        "created_at": _iso(offer.created_at),
    }


async def _status_counts(db: AsyncSession, scope: Optional[uuid.UUID], since: Optional[datetime] = None) -> dict[str, int]:
    query = (select(Application.status, func.count(Application.id))
             .where(Application.job_id.in_(_employer_job_ids(scope))))
    if since is not None:
        query = query.where(Application.applied_at >= since)
    rows = (await db.execute(query.group_by(Application.status))).all()
    return {status: count for status, count in rows}


async def _source_breakdown(db: AsyncSession, scope: Optional[uuid.UUID]) -> list[dict]:
    job_ids = _employer_job_ids(scope)
    applicant_ids = select(Application.applicant_id).where(
        Application.job_id.in_(job_ids), Application.applicant_id.is_not(None))
    applied = (await db.execute(select(func.count(func.distinct(Application.applicant_id)))
                                .where(Application.job_id.in_(job_ids)))).scalar_one()
    matched_only = (await db.execute(select(func.count(func.distinct(JobMatch.trainee_id)))
                                     .where(JobMatch.job_id.in_(job_ids),
                                            JobMatch.trainee_id.is_not(None),
                                            JobMatch.trainee_id.not_in(applicant_ids)))).scalar_one()
    talent_query = select(func.count(TalentPoolEntry.id))
    if scope is not None:
        talent_query = talent_query.where(TalentPoolEntry.organisation_id == scope)
    talent = (await db.execute(talent_query)).scalar_one()
    return [
        {"source": "applied", "label": "Applied on CoopSetu", "count": applied or 0},
        {"source": "matched", "label": "Matched, not yet applied", "count": matched_only or 0},
        {"source": "talent_pool", "label": "Saved to talent pool", "count": talent or 0},
    ]


async def _job_performance(db: AsyncSession, scope: Optional[uuid.UUID], since: Optional[datetime] = None) -> list[dict]:
    jobs = (await db.execute(select(Job).where(Job.id.in_(_employer_job_ids(scope)))
                             .order_by(Job.posted_at.desc().nullslast(), Job.title))).scalars().all()
    if not jobs:
        return []
    job_ids = [job.id for job in jobs]
    app_query = (select(Application.job_id, Application.status, func.count(Application.id))
                 .where(Application.job_id.in_(job_ids)))
    if since is not None:
        app_query = app_query.where(Application.applied_at >= since)
    app_rows = (await db.execute(app_query.group_by(Application.job_id, Application.status))).all()
    interview_rows = (await db.execute(select(Interview.job_id, func.count(Interview.id))
                                       .where(Interview.job_id.in_(job_ids), Interview.status != "cancelled")
                                       .group_by(Interview.job_id))).all()
    per_job: dict = {}
    for job_id, status, count in app_rows:
        bucket = per_job.setdefault(job_id, Counter())
        bucket["applications"] += count
        if status in PIPELINE_BEYOND_SHORTLIST:
            bucket["shortlisted"] += count
        if status == "hired":
            bucket["hires"] += count
    interviews = {job_id: count for job_id, count in interview_rows}
    result = []
    for job in jobs:
        bucket = per_job.get(job.id, Counter())
        result.append({
            "job_id": str(job.id), "job_title": job.title, "title": job.title, "status": job.status,
            "applications": bucket["applications"], "shortlisted": bucket["shortlisted"],
            "interviews": interviews.get(job.id, 0), "hires": bucket["hires"],
            "conversion_pct": _pct(bucket["hires"], bucket["applications"]),
        })
    return result


async def _skill_demand_aggregate(db: AsyncSession) -> dict:
    """Counts only. Reads the skill arrays of feedback rows; job, employer and
    trainee identities are never selected."""
    rows = (await db.execute(select(EmployerFeedback.useful_skills, EmployerFeedback.missing_skills))).all()
    mentions: Counter = Counter()
    for useful_skills, missing_skills in rows:
        mentions.update(s for s in (useful_skills or []) if isinstance(s, str) and s.strip())
        mentions.update(s for s in (missing_skills or []) if isinstance(s, str) and s.strip())
    skills = [{"skill": name, "mentions": count}
              for name, count in sorted(mentions.items(), key=lambda kv: (-kv[1], kv[0]))[:50]]
    return {"responses": len(rows), "skills": skills}


async def _best_matches(db: AsyncSession, scope: Optional[uuid.UUID], trainee_ids: list[uuid.UUID]) -> dict:
    if not trainee_ids:
        return {}
    rows = (await db.execute(select(JobMatch.trainee_id, func.max(JobMatch.match_score))
                             .where(JobMatch.job_id.in_(_employer_job_ids(scope)),
                                    JobMatch.trainee_id.in_(trainee_ids))
                             .group_by(JobMatch.trainee_id))).all()
    return {trainee_id: score for trainee_id, score in rows}


# ---------------------------------------------------------------- dashboard

FunnelRangeName = Literal["30d", "3m", "6m", "custom"]
TimelineRangeName = Literal["3m", "6m", "1y"]
FUNNEL_WINDOW_DAYS = {"30d": 30, "3m": 90, "6m": 180}
FUNNEL_STAGES = (("applied", "Applied"), ("screened", "Screened"), ("shortlisted", "Shortlisted"),
                 ("interview", "Interview"), ("offered", "Offered"), ("hired", "Hired"))
PERIOD_LABEL = {"30d": "Last 30 days", "3m": "Last 3 months", "6m": "Last 6 months", "custom": "Custom range"}
TIMELINE_MONTHS = {"3m": 3, "6m": 6, "1y": 12}
SHORTLIST_PLUS = ("shortlisted", "interview", "offered", "hired")


def _funnel_window(range_name: str, date_from: Optional[date], date_to: Optional[date],
                   now: datetime) -> tuple[datetime, datetime]:
    """[start, end) for the funnel and KPIs. Relative ranges end tomorrow so today counts."""
    if range_name == "custom":
        if date_from is None or date_to is None:
            raise HTTPException(status_code=422, detail="funnel_from and funnel_to are required for a custom range")
        if date_to < date_from:
            raise HTTPException(status_code=422, detail="funnel_to must not be before funnel_from")
        if (date_to - date_from).days > 366:
            raise HTTPException(status_code=422, detail="A custom range cannot exceed one year")
        return _ist_day_bounds(date_from)[0], _ist_day_bounds(date_to)[1]
    return now - timedelta(days=FUNNEL_WINDOW_DAYS[range_name]), now + timedelta(days=1)


def _ago(moment: Optional[datetime], now: datetime) -> str:
    if moment is None:
        return ""
    days = (now - moment).days
    if days <= 0:
        return "today"
    if days == 1:
        return "1 day ago"
    if days < 60:
        return f"{days} days ago"
    return f"{days // 30} months ago"


async def _count_applications(db: AsyncSession, job_ids, lo: datetime, hi: datetime, statuses=None) -> int:
    query = select(func.count(Application.id)).where(
        Application.job_id.in_(job_ids), Application.applied_at >= lo, Application.applied_at < hi)
    if statuses:
        query = query.where(Application.status.in_(statuses))
    return (await db.execute(query)).scalar_one()


async def _count_interviews(db: AsyncSession, scope, lo: datetime, hi: datetime) -> int:
    query = select(func.count(Interview.id)).where(
        Interview.scheduled_at >= lo, Interview.scheduled_at < hi, Interview.status != "cancelled")
    if scope is not None:
        query = query.where(Interview.organisation_id == scope)
    return (await db.execute(query)).scalar_one()


async def _count_offers(db: AsyncSession, scope, lo: datetime, hi: datetime) -> int:
    query = select(func.count(Offer.id)).where(Offer.sent_at.is_not(None), Offer.sent_at >= lo, Offer.sent_at < hi)
    if scope is not None:
        query = query.where(Offer.organisation_id == scope)
    return (await db.execute(query)).scalar_one()


async def _count_hires(db: AsyncSession, job_ids, lo: datetime, hi: datetime) -> int:
    return (await db.execute(select(func.count(Application.id)).where(
        Application.job_id.in_(job_ids), Application.status == "hired",
        Application.updated_at >= lo, Application.updated_at < hi))).scalar_one()


async def _count_postings(db: AsyncSession, scope, lo: datetime, hi: datetime) -> int:
    query = select(func.count(Job.id)).where(Job.source == "employer", Job.posted_at >= lo, Job.posted_at < hi)
    if scope is not None:
        query = query.where(Job.organisation_id == scope)
    return (await db.execute(query)).scalar_one()


@router.get("/dashboard")
async def employer_dashboard(
    funnel_range: FunnelRangeName = Query("6m"),
    funnel_from: Optional[date] = Query(None),
    funnel_to: Optional[date] = Query(None),
    timeline_range: TimelineRangeName = Query("6m"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_employer),
):
    scope = org_scope(user)
    job_ids = _employer_job_ids(scope)
    now = _now()
    start, end = _funnel_window(funnel_range, funnel_from, funnel_to, now)
    prev_start, prev_end = start - (end - start), start
    period = PERIOD_LABEL[funnel_range]

    def kpi(current: int, previous: int) -> dict:
        return {"value": current, "delta": current - previous, "period": period}

    open_jobs = (await db.execute(select(func.count(Job.id)).where(
        Job.id.in_(job_ids), Job.status == "open"))).scalar_one()
    postings_now = await _count_postings(db, scope, start, end)
    postings_before = await _count_postings(db, scope, prev_start, prev_end)
    kpis = {
        # Open jobs now; delta is postings made in this window versus the previous one.
        "active_jobs": {"value": open_jobs, "delta": postings_now - postings_before, "period": period},
        "applications": kpi(await _count_applications(db, job_ids, start, end),
                            await _count_applications(db, job_ids, prev_start, prev_end)),
        "shortlisted": kpi(await _count_applications(db, job_ids, start, end, SHORTLIST_PLUS),
                           await _count_applications(db, job_ids, prev_start, prev_end, SHORTLIST_PLUS)),
        "interviews": kpi(await _count_interviews(db, scope, start, end),
                          await _count_interviews(db, scope, prev_start, prev_end)),
        "offers": kpi(await _count_offers(db, scope, start, end), await _count_offers(db, scope, prev_start, prev_end)),
        "hired": kpi(await _count_hires(db, job_ids, start, end), await _count_hires(db, job_ids, prev_start, prev_end)),
    }

    window_rows = (await db.execute(select(Application.status, func.count(Application.id)).where(
        Application.job_id.in_(job_ids), Application.applied_at >= start, Application.applied_at < end)
        .group_by(Application.status))).all()
    counts = {status: count for status, count in window_rows}
    total = sum(counts.values())
    stage_counts = {
        "applied": total,
        # "screened" is not a stored state: it counts applications the employer has acted on.
        "screened": total - counts.get("applied", 0),
        "shortlisted": sum(counts.get(s, 0) for s in SHORTLIST_PLUS),
        "interview": sum(counts.get(s, 0) for s in ("interview", "offered", "hired")),
        "offered": sum(counts.get(s, 0) for s in ("offered", "hired")),
        "hired": counts.get("hired", 0),
    }
    funnel = []
    previous_stage = None
    for key, label in FUNNEL_STAGES:
        count = stage_counts[key]
        funnel.append({"key": key, "label": label, "count": count,
                       "percent": round(100.0 * count / total, 1) if total else 0.0,
                       "conversion": _pct(count, previous_stage) if previous_stage is not None else None})
        previous_stage = count

    org_id = scope or user.organisation_id
    org = await db.get(Organisation, org_id) if org_id else None

    day_start, day_end = _ist_day_bounds(datetime.now(IST).date())
    today_rows = (await db.execute(
        select(Interview, Job.title, User.full_name)
        .join(Job, Job.id == Interview.job_id).join(User, User.id == Interview.trainee_id)
        .where(Interview.status != "cancelled", Interview.scheduled_at >= day_start, Interview.scheduled_at < day_end,
               *([Interview.organisation_id == scope] if scope is not None else []))
        .order_by(Interview.scheduled_at).limit(10))).all()
    today = [{"id": str(iv.id), "starts_at": _iso(iv.scheduled_at), "kind": "interview",
              "candidate_name": name, "subtitle": f"{title} · {iv.mode}"} for iv, title, name in today_rows]

    upcoming_rows = (await db.execute(
        select(Interview, Job.title, User.full_name)
        .join(Job, Job.id == Interview.job_id).join(User, User.id == Interview.trainee_id)
        .where(Interview.status == "scheduled", Interview.scheduled_at >= now,
               *([Interview.organisation_id == scope] if scope is not None else []))
        .order_by(Interview.scheduled_at).limit(5))).all()
    upcoming = [{"id": str(iv.id), "candidate_name": name, "role": title, "starts_at": _iso(iv.scheduled_at),
                 "mode": iv.mode, "meeting_link": iv.meeting_link, "status": iv.status}
                for iv, title, name in upcoming_rows]

    skill_rows = (await db.execute(select(Job.skills_required).where(Job.id.in_(job_ids)))).scalars().all()
    wanted = sorted({s for skills in skill_rows for s in (skills or []) if isinstance(s, str) and s.strip()})
    matched_trainees = select(JobMatch.trainee_id).where(JobMatch.job_id.in_(job_ids), JobMatch.trainee_id.is_not(None))
    skill_match = []
    if wanted:
        skill_match = [{"skill": name, "count": count} for name, count in (await db.execute(
            select(Skill.name, func.count(func.distinct(TraineeSkill.trainee_id)))
            .join(TraineeSkill, TraineeSkill.skill_id == Skill.id)
            .where(TraineeSkill.trainee_id.in_(matched_trainees), Skill.name.in_(wanted))
            .group_by(Skill.name).order_by(func.count(func.distinct(TraineeSkill.trainee_id)).desc(), Skill.name)
            .limit(8))).all()]

    best = (await db.execute(
        select(JobMatch, Job.title, User.full_name, UserProfile.occupation, UserProfile.district, UserProfile.state)
        .join(Job, Job.id == JobMatch.job_id).join(User, User.id == JobMatch.trainee_id)
        .join(UserProfile, UserProfile.user_id == User.id)
        .where(JobMatch.job_id.in_(job_ids), JobMatch.match_score.is_not(None),
               UserProfile.visible_to_employers.is_(True))
        .order_by(JobMatch.match_score.desc(), User.full_name).limit(40))).all()
    top_rows, seen = [], set()
    for match, title, name, occupation, district, state in best:
        if match.trainee_id in seen:
            continue
        seen.add(match.trainee_id)
        top_rows.append((match, title, name, occupation, district, state))
        if len(top_rows) == 5:
            break
    skills_by_trainee: dict = {}
    if seen:
        for trainee_id, skill_name in (await db.execute(
                select(TraineeSkill.trainee_id, Skill.name).join(Skill, Skill.id == TraineeSkill.skill_id)
                .where(TraineeSkill.trainee_id.in_(seen)).order_by(TraineeSkill.confidence.desc(), Skill.name))).all():
            skills_by_trainee.setdefault(trainee_id, [])
            if len(skills_by_trainee[trainee_id]) < 3:
                skills_by_trainee[trainee_id].append(skill_name)
    top_candidates = [{"trainee_id": str(m.trainee_id), "name": name, "headline": occupation,
                       "location": _location(district, state), "match_score": m.match_score,
                       "top_skills": skills_by_trainee.get(m.trainee_id, []), "job_id": str(m.job_id)}
                      for m, _title, name, occupation, district, state in top_rows]

    recent_rows = (await db.execute(select(Application, Job.title, User.full_name)
        .join(Job, Job.id == Application.job_id).outerjoin(User, User.id == Application.applicant_id)
        .where(Application.job_id.in_(job_ids))
        .order_by(Application.applied_at.desc().nullslast()).limit(8))).all()
    score_map = {}
    if recent_rows:
        for job_id, trainee_id, score in (await db.execute(select(JobMatch.job_id, JobMatch.trainee_id, JobMatch.match_score)
                .where(JobMatch.job_id.in_(job_ids), JobMatch.trainee_id.in_([a.applicant_id for a, _, _ in recent_rows if a.applicant_id])))).all():
            score_map[(job_id, trainee_id)] = score
    recent = [{"id": str(app.id), "candidate_name": name, "role": title,
               "match_score": score_map.get((app.job_id, app.applicant_id)),
               "status": app.status, "applied_at": _iso(app.applied_at)}
              for app, title, name in recent_rows]

    sources = await _source_breakdown(db, scope)
    source_total = sum(row["count"] for row in sources)
    candidate_sources = [{"label": row["label"], "percent": round(100.0 * row["count"] / source_total, 1) if source_total else 0.0}
                         for row in sources]

    feedback_rows = (await db.execute(select(EmployerFeedback, Job.title, User.full_name)
        .join(Job, Job.id == EmployerFeedback.job_id).join(User, User.id == EmployerFeedback.trainee_id)
        .where(Job.id.in_(job_ids), EmployerFeedback.performance_rating.is_not(None))
        .order_by(EmployerFeedback.created_at.desc().nullslast()).limit(5))).all()
    feedback = [{"id": str(fb.id), "trainee_id": str(fb.trainee_id), "candidate_name": name, "role": title,
                 "hired_ago": _ago(fb.created_at, now), "rating": fb.performance_rating,
                 "comment": fb.comments or ""} for fb, title, name in feedback_rows]

    return {
        "viewer_name": user.full_name,
        "organisation_name": org.name if org else None,
        "kpis": kpis,
        "today": today,
        "funnel": funnel,
        "skill_match": skill_match,
        "top_candidates": top_candidates,
        "recent_applications": recent,
        "candidate_sources": candidate_sources,
        "hiring_timeline": await _hiring_timeline(db, job_ids, scope, TIMELINE_MONTHS[timeline_range]),
        "upcoming_interviews": upcoming,
        "feedback": feedback,
    }


async def _hiring_timeline(db: AsyncSession, job_ids, scope, months: int) -> list[dict]:
    keys = _last_months(months)
    since = datetime.combine(date(int(keys[0][:4]), int(keys[0][5:]), 1), time.min, tzinfo=IST)
    applied_at = (await db.execute(select(Application.applied_at).where(
        Application.job_id.in_(job_ids), Application.applied_at.is_not(None),
        Application.applied_at >= since))).scalars().all()
    interview_query = select(Interview.scheduled_at).where(Interview.scheduled_at >= since, Interview.status != "cancelled")
    if scope is not None:
        interview_query = interview_query.where(Interview.organisation_id == scope)
    interview_at = (await db.execute(interview_query)).scalars().all()
    hired_at = (await db.execute(select(Application.updated_at).where(
        Application.job_id.in_(job_ids), Application.status == "hired",
        Application.updated_at.is_not(None), Application.updated_at >= since))).scalars().all()
    applied = Counter(_month_key(ts) for ts in applied_at)
    interviews = Counter(_month_key(ts) for ts in interview_at)
    hires = Counter(_month_key(ts) for ts in hired_at)
    return [{"month": k, "applications": applied.get(k, 0), "interviews": interviews.get(k, 0),
             "hired": hires.get(k, 0)} for k in keys]



# ---------------------------------------------------------------- interviews

def _require_future(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("scheduled_at must include a timezone offset")
    if value <= _now():
        raise ValueError("scheduled_at must be in the future")
    return value


class InterviewCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    application_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int = Field(45, ge=15, le=480)
    mode: Literal["online", "onsite"] = "online"
    meeting_link: Optional[str] = Field(None, max_length=1000, pattern=r"^https?://\S+$")
    interviewer_name: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=5000)

    @field_validator("scheduled_at")
    @classmethod
    def _check_future(cls, value: datetime) -> datetime:
        return _require_future(value)


class InterviewUpdate(BaseModel):
    """Reschedule or edit (scheduled only), cancel or complete (scheduled only),
    and record the human decision (scheduled or completed). Cancelled interviews
    are read-only."""
    model_config = ConfigDict(extra="forbid")
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=480)
    mode: Optional[Literal["online", "onsite"]] = None
    meeting_link: Optional[str] = Field(None, max_length=1000, pattern=r"^https?://\S+$")
    interviewer_name: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=5000)
    status: Optional[Literal["cancelled", "completed"]] = None
    decision: Optional[Literal["proceed", "hold", "reject"]] = None

    @field_validator("scheduled_at")
    @classmethod
    def _check_future(cls, value: Optional[datetime]) -> Optional[datetime]:
        return None if value is None else _require_future(value)


SCHEDULE_FIELDS = ("scheduled_at", "duration_minutes", "mode", "meeting_link", "interviewer_name", "notes")


class RatingSet(BaseModel):
    model_config = ConfigDict(extra="forbid")
    technical_skills: Optional[int] = Field(None, ge=1, le=5)
    communication: Optional[int] = Field(None, ge=1, le=5)
    problem_solving: Optional[int] = Field(None, ge=1, le=5)
    domain_knowledge: Optional[int] = Field(None, ge=1, le=5)
    cooperative_sector_knowledge: Optional[int] = Field(None, ge=1, le=5)

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_none=True):
            raise ValueError("At least one criterion score is required")
        return self


class InterviewEvaluationIn(BaseModel):
    """Written by a human interviewer. This body has no decision field: an extra
    key such as `decision` or `decision_source` is rejected with 422, so the
    evaluation can record scores and a recommendation but never moves a candidate."""
    model_config = ConfigDict(extra="forbid")
    scores: RatingSet
    overall_recommendation: Optional[Recommendation] = None
    notes: str = Field("", max_length=5000)


@router.get("/interviews")
async def list_interviews(
    status: Optional[Literal["scheduled", "completed", "cancelled"]] = None,
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    application_id: Optional[uuid.UUID] = None,
    job_id: Optional[uuid.UUID] = None,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_employer),
):
    scope = org_scope(user)
    query = (select(Interview, Job.title, User.full_name)
             .join(Job, Job.id == Interview.job_id).join(User, User.id == Interview.trainee_id))
    if scope is not None:
        query = query.where(Interview.organisation_id == scope)
    if status:
        query = query.where(Interview.status == status)
    if from_date:
        query = query.where(Interview.scheduled_at >= _ist_day_bounds(from_date)[0])
    if to_date:
        query = query.where(Interview.scheduled_at < _ist_day_bounds(to_date)[1])
    if application_id:
        query = query.where(Interview.application_id == application_id)
    if job_id:
        query = query.where(Interview.job_id == job_id)
    rows = (await db.execute(query.order_by(Interview.scheduled_at).offset(offset).limit(limit))).all()
    return {"interviews": [_interview_out(iv, title, name) for iv, title, name in rows]}


@router.post("/interviews", status_code=201)
async def create_interview(data: InterviewCreate, db: AsyncSession = Depends(get_db),
                           user: User = Depends(_employer)):
    application, job = await _load_application(db, data.application_id, user)
    if application.applicant_id is None:
        raise HTTPException(status_code=422, detail="Application has no candidate")
    if application.status not in ("shortlisted", "interview"):
        raise HTTPException(status_code=422, detail="Shortlist the candidate before scheduling an interview")
    _advance(application, "interview")
    now = _now()
    application.interview_at = data.scheduled_at
    application.updated_at = now
    interview = Interview(
        id=uuid.uuid4(), application_id=application.id, job_id=job.id, trainee_id=application.applicant_id,
        organisation_id=job.organisation_id, scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes, mode=data.mode, meeting_link=data.meeting_link,
        interviewer_name=data.interviewer_name, notes=data.notes, status="scheduled",
        created_by_id=user.id, created_at=now, updated_at=now,
    )
    db.add(interview)
    trainee = await db.get(User, application.applicant_id)
    await notify(db, application.applicant_id, "interview_scheduled",
                 {"interview_id": str(interview.id), "job_id": str(job.id),
                  "scheduled_at": data.scheduled_at.isoformat()},
                 title="Interview scheduled", body=f"An interview for {job.title} has been scheduled.")
    await db.commit()
    return _interview_out(interview, job.title, trainee.full_name if trainee else None)


@router.get("/interviews/{interview_id}")
async def get_interview(interview_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                        user: User = Depends(_employer)):
    iv, title, name = await _load_interview(db, interview_id, user)
    return _interview_out(iv, title, name)


@router.patch("/interviews/{interview_id}")
async def update_interview(interview_id: uuid.UUID, data: InterviewUpdate,
                           db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    iv, title, name = await _load_interview(db, interview_id, user)
    if iv.status == "cancelled":
        raise HTTPException(status_code=409, detail="A cancelled interview cannot be changed")
    application = await db.get(Application, iv.application_id)
    values = data.model_dump(exclude_unset=True)
    status = values.pop("status", None)
    now = _now()
    body = None

    if status == "cancelled":
        if values:
            raise HTTPException(status_code=422, detail="A cancellation cannot be combined with other changes")
        if iv.status != "scheduled":
            raise HTTPException(status_code=409, detail="Only a scheduled interview can be cancelled")
        iv.status = "cancelled"
        if application is not None and application.interview_at == iv.scheduled_at:
            application.interview_at = None
        body = f"Your interview for {title} has been cancelled."
    elif status == "completed" and iv.status == "scheduled":
        iv.status = "completed"

    if any(field in values for field in SCHEDULE_FIELDS):
        if iv.status != "scheduled":
            raise HTTPException(status_code=409, detail="Only a scheduled interview can be rescheduled or edited")
        rescheduled = "scheduled_at" in values and values["scheduled_at"] != iv.scheduled_at
        for field in SCHEDULE_FIELDS:
            if field in values:
                setattr(iv, field, values[field])
        if rescheduled and application is not None:
            application.interview_at = iv.scheduled_at
        body = (f"Your interview for {title} has been rescheduled." if rescheduled
                else f"Your interview details for {title} were updated.")

    if "decision" in values:
        iv.decision = values["decision"]
        iv.decided_by_id = user.id if values["decision"] is not None else None

    iv.updated_at = now
    if application is not None:
        application.updated_at = now
    if body is not None:
        await notify(db, iv.trainee_id, "interview_updated", {"interview_id": str(iv.id), "status": iv.status},
                     title="Interview update", body=body)
    await db.commit()
    return _interview_out(iv, title, name)


@router.post("/interviews/{interview_id}/evaluation")
async def submit_evaluation(interview_id: uuid.UUID, data: InterviewEvaluationIn,
                            db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    iv, title, name = await _load_interview(db, interview_id, user)
    if iv.status == "cancelled":
        raise HTTPException(status_code=409, detail="A cancelled interview cannot be evaluated")
    scores = data.scores.model_dump(exclude_none=True)
    now = _now()
    iv.evaluation = {
        "scores": scores,
        "overall_recommendation": data.overall_recommendation,
        "notes": data.notes,
        "evaluated_by_id": str(user.id),
        "evaluated_at": now.isoformat(),
    }
    iv.overall_rating = _round_half_up(sum(scores.values()) / len(scores))
    iv.status = "completed"
    iv.updated_at = now
    await db.commit()
    return _interview_out(iv, title, name)


# ---------------------------------------------------------------- offers

class OfferCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    application_id: uuid.UUID
    salary: Optional[int] = Field(None, ge=0, le=100_000_000)
    employment_type: Optional[Literal["full_time", "part_time", "contract", "internship"]] = None
    joining_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=255)
    benefits: Optional[str] = Field(None, max_length=5000)
    additional_terms: Optional[str] = Field(None, max_length=5000)
    status: Literal["draft", "sent"] = "draft"


class OfferUpdate(BaseModel):
    """Field edits apply to drafts only. `status` moves the offer through
    OFFER_TRANSITIONS and records the candidate's response when accepted/declined."""
    model_config = ConfigDict(extra="forbid")
    status: Optional[Literal["sent", "withdrawn", "accepted", "declined", "expired"]] = None
    salary: Optional[int] = Field(None, ge=0, le=100_000_000)
    employment_type: Optional[Literal["full_time", "part_time", "contract", "internship"]] = None
    joining_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=255)
    benefits: Optional[str] = Field(None, max_length=5000)
    additional_terms: Optional[str] = Field(None, max_length=5000)


async def _apply_offer_status(db: AsyncSession, offer: Offer, target: str, title: str,
                              candidate: str, actor: User) -> None:
    """Single place for offer side effects so create-as-sent and PATCH agree."""
    application = await db.get(Application, offer.application_id)
    now = _now()
    if target == "sent":
        if application is None or application.status not in ("shortlisted", "interview", "offered"):
            raise HTTPException(status_code=422, detail="The application is no longer open for an offer")
        _advance(application, "offered")
        offer.sent_at = now
        await notify(db, offer.trainee_id, "offer_received", {"offer_id": str(offer.id)},
                     title="Offer received", body=f"You have received an offer for {title}.")
    elif target == "accepted":
        if application is None or application.status != "offered":
            raise HTTPException(status_code=409, detail="Only an application with a sent offer can be hired")
        _advance(application, "hired")
        offer.responded_at = now
        await notify(db, offer.trainee_id, "offer_accepted",
                     {"offer_id": str(offer.id), "job_id": str(offer.job_id)},
                     title="Offer accepted", body=f"Your offer for {title} has been accepted.")
        if offer.created_by_id and offer.created_by_id != actor.id and await _wants(db, offer.created_by_id, "candidate_response"):
            await notify(db, offer.created_by_id, "offer_response",
                         {"offer_id": str(offer.id), "response": "accepted"},
                         title="Candidate responded", body=f"{candidate} accepted the offer for {title}.")
    elif target == "declined":
        offer.responded_at = now
        if offer.created_by_id and offer.created_by_id != actor.id and await _wants(db, offer.created_by_id, "candidate_response"):
            await notify(db, offer.created_by_id, "offer_response",
                         {"offer_id": str(offer.id), "response": "declined"},
                         title="Candidate responded", body=f"{candidate} declined the offer for {title}.")
    elif target == "withdrawn":
        offer.responded_at = now
        if offer.status == "sent":
            await notify(db, offer.trainee_id, "offer_withdrawn", {"offer_id": str(offer.id)},
                         title="Offer withdrawn", body=f"The offer for {title} has been withdrawn.")
    offer.status = target
    offer.updated_at = now


@router.get("/offers")
async def list_offers(status: Optional[Literal["draft", "sent", "accepted", "declined", "withdrawn", "expired"]] = None,
                      application_id: Optional[uuid.UUID] = None,
                      limit: int = Query(100, ge=1, le=200), offset: int = Query(0, ge=0),
                      db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    scope = org_scope(user)
    query = (select(Offer, Job.title, User.full_name)
             .join(Job, Job.id == Offer.job_id).join(User, User.id == Offer.trainee_id))
    if scope is not None:
        query = query.where(Offer.organisation_id == scope)
    if status:
        query = query.where(Offer.status == status)
    if application_id:
        query = query.where(Offer.application_id == application_id)
    rows = (await db.execute(query.order_by(Offer.created_at.desc()).offset(offset).limit(limit))).all()
    return {"offers": [_offer_out(o, title, name) for o, title, name in rows]}


@router.post("/offers", status_code=201)
async def create_offer(data: OfferCreate, db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    application, job = await _load_application(db, data.application_id, user)
    if application.applicant_id is None:
        raise HTTPException(status_code=422, detail="Application has no candidate")
    if application.status not in ("shortlisted", "interview", "offered"):
        raise HTTPException(status_code=422, detail="Only shortlisted or interviewed candidates can receive an offer")
    if data.status == "sent" and None in (data.salary, data.employment_type, data.joining_date, data.location):
        raise HTTPException(status_code=422, detail="Salary, employment type, joining date and location are required to send an offer")
    live = (await db.execute(select(Offer.id).where(
        Offer.application_id == application.id, Offer.status.in_(("draft", "sent", "accepted"))).limit(1))).scalar_one_or_none()
    if live is not None:
        raise HTTPException(status_code=409, detail="This application already has an open offer")
    now = _now()
    offer = Offer(
        id=uuid.uuid4(), application_id=application.id, job_id=job.id, trainee_id=application.applicant_id,
        organisation_id=job.organisation_id, status="draft", salary=data.salary,
        employment_type=data.employment_type, joining_date=data.joining_date, location=data.location,
        benefits=data.benefits, additional_terms=data.additional_terms, created_by_id=user.id,
        created_at=now, updated_at=now,
    )
    db.add(offer)
    trainee = await db.get(User, application.applicant_id)
    candidate = trainee.full_name if trainee else None
    if data.status == "sent":
        await _apply_offer_status(db, offer, "sent", job.title, candidate or "", user)
    await db.commit()
    return _offer_out(offer, job.title, candidate)


@router.get("/offers/{offer_id}")
async def get_offer(offer_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    offer, title, name = await _load_offer(db, offer_id, user)
    return _offer_out(offer, title, name)


@router.patch("/offers/{offer_id}")
async def update_offer(offer_id: uuid.UUID, data: OfferUpdate, db: AsyncSession = Depends(get_db),
                       user: User = Depends(_employer)):
    offer, title, name = await _load_offer(db, offer_id, user)
    values = data.model_dump(exclude_unset=True)
    target = values.pop("status", None)
    if target is not None and target == offer.status:
        raise HTTPException(status_code=409, detail=f"Offer is already {target}")
    if values and offer.status != "draft":
        raise HTTPException(status_code=409, detail="Only draft offers can be edited")
    if target is not None and target not in OFFER_TRANSITIONS[offer.status]:
        raise HTTPException(status_code=422, detail=f"Offer cannot move from {offer.status} to {target}")
    for field, value in values.items():
        setattr(offer, field, value)
    if target == "sent" and None in (offer.salary, offer.employment_type, offer.joining_date, offer.location):
        raise HTTPException(status_code=422, detail="Salary, employment type, joining date and location are required to send an offer")
    if target is not None:
        await _apply_offer_status(db, offer, target, title, name or "", user)
    offer.updated_at = _now()
    await db.commit()
    return _offer_out(offer, title, name)


# ---------------------------------------------------------------- talent pool

class TalentPoolCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    trainee_id: uuid.UUID
    category: TalentCategory = "saved"
    note: Optional[str] = Field(None, max_length=2000)


class TalentPoolUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    category: Optional[TalentCategory] = None
    note: Optional[str] = Field(None, max_length=2000)


def _pool_out(entry: TalentPoolEntry, name: Optional[str], occupation: Optional[str],
              location: Optional[str], match_score: Optional[int]) -> dict:
    return {"id": str(entry.id), "trainee_id": str(entry.trainee_id), "candidate_name": name,
            "location": location, "occupation": occupation, "category": entry.category,
            "note": entry.note, "match_score": match_score, "added_at": _iso(entry.created_at)}


_POOL_COLUMNS = (TalentPoolEntry, User.full_name, UserProfile.occupation, UserProfile.district, UserProfile.state)


@router.get("/talent-pool")
async def list_talent_pool(category: Optional[TalentCategory] = None,
                           limit: int = Query(100, ge=1, le=200), offset: int = Query(0, ge=0),
                           db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    scope = org_scope(user)
    query = (select(*_POOL_COLUMNS).join(User, User.id == TalentPoolEntry.trainee_id)
             .outerjoin(UserProfile, UserProfile.user_id == User.id))
    if scope is not None:
        query = query.where(TalentPoolEntry.organisation_id == scope)
    if category:
        query = query.where(TalentPoolEntry.category == category)
    rows = (await db.execute(query.order_by(TalentPoolEntry.created_at.desc()).offset(offset).limit(limit))).all()
    scores = await _best_matches(db, scope, [e.trainee_id for e, *_ in rows])
    return {"entries": [_pool_out(e, name, occ, _location(d, s), scores.get(e.trainee_id))
                        for e, name, occ, d, s in rows]}


@router.post("/talent-pool", status_code=201)
async def add_talent_pool_entry(data: TalentPoolCreate, db: AsyncSession = Depends(get_db),
                                user: User = Depends(_employer)):
    org_id = _caller_org_id(user)
    trainee = (await db.execute(select(User).where(User.id == data.trainee_id, User.role == "trainee"))).scalar_one_or_none()
    if trainee is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    profile = (await db.execute(select(UserProfile).where(UserProfile.user_id == trainee.id))).scalar_one_or_none()
    applied = (await db.execute(select(Application.id).join(Job, Job.id == Application.job_id).where(
        Application.applicant_id == trainee.id, Job.organisation_id == org_id).limit(1))).scalar_one_or_none()
    visible = profile is not None and profile.visible_to_employers is True
    if not visible and applied is None:
        raise HTTPException(status_code=403, detail="Candidate is not visible to this employer")
    existing = (await db.execute(select(TalentPoolEntry.id).where(
        TalentPoolEntry.organisation_id == org_id, TalentPoolEntry.trainee_id == trainee.id))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Candidate is already in your talent pool")
    now = _now()
    entry = TalentPoolEntry(id=uuid.uuid4(), organisation_id=org_id, trainee_id=trainee.id,
                            category=data.category, note=data.note, added_by_id=user.id,
                            created_at=now, updated_at=now)
    db.add(entry)
    await db.commit()
    scores = await _best_matches(db, org_id, [trainee.id])
    return _pool_out(entry, trainee.full_name, profile.occupation if profile else None,
                     _location(profile.district if profile else None, profile.state if profile else None),
                     scores.get(trainee.id))


async def _pool_entry(db: AsyncSession, entry_id: uuid.UUID, user: User):
    row = (await db.execute(select(*_POOL_COLUMNS).select_from(TalentPoolEntry)
                            .join(User, User.id == TalentPoolEntry.trainee_id)
                            .outerjoin(UserProfile, UserProfile.user_id == User.id)
                            .where(TalentPoolEntry.id == entry_id))).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Talent pool entry not found")
    assert_org_access(user, row[0].organisation_id)
    return row


@router.patch("/talent-pool/{entry_id}")
async def update_talent_pool_entry(entry_id: uuid.UUID, data: TalentPoolUpdate,
                                   db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    entry, name, occupation, district, state = await _pool_entry(db, entry_id, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    entry.updated_at = _now()
    await db.commit()
    scores = await _best_matches(db, entry.organisation_id, [entry.trainee_id])
    return _pool_out(entry, name, occupation, _location(district, state), scores.get(entry.trainee_id))


@router.delete("/talent-pool/{entry_id}")
async def delete_talent_pool_entry(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                                   user: User = Depends(_employer)):
    entry = (await db.execute(select(TalentPoolEntry).where(TalentPoolEntry.id == entry_id))).scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=404, detail="Talent pool entry not found")
    assert_org_access(user, entry.organisation_id)
    await db.delete(entry)
    await db.commit()
    return {"id": str(entry_id), "status": "deleted"}


# ---------------------------------------------------------------- post-hire feedback

class FeedbackRatingsIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    technical_skills: int = Field(..., ge=1, le=5)
    communication: int = Field(..., ge=1, le=5)
    problem_solving: int = Field(..., ge=1, le=5)
    domain_knowledge: int = Field(..., ge=1, le=5)
    digital_skills: int = Field(..., ge=1, le=5)
    work_readiness: int = Field(..., ge=1, le=5)


class FeedbackIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    job_id: uuid.UUID
    trainee_id: uuid.UUID
    ratings: FeedbackRatingsIn
    additional_skills_needed: list[str] = Field(default_factory=list, max_length=30)
    comments: str = Field("", max_length=2000)

    @field_validator("additional_skills_needed")
    @classmethod
    def _clean_skills(cls, values: list[str]) -> list[str]:
        cleaned = [v.strip()[:100] for v in values if isinstance(v, str) and v.strip()]
        return list(dict.fromkeys(cleaned))


def _feedback_out(fb: EmployerFeedback, job_title: Optional[str], employee: Optional[str],
                  ratings: Optional[dict]) -> dict:
    return {
        "id": str(fb.id), "job_id": str(fb.job_id) if fb.job_id else None, "job_title": job_title,
        "trainee_id": str(fb.trainee_id), "employee_name": employee,
        "ratings": ratings, "performance_rating": fb.performance_rating,
        "additional_skills_needed": fb.missing_skills or [], "comments": fb.comments,
        "created_at": _iso(fb.created_at),
    }


@router.get("/feedback")
async def list_feedback(limit: int = Query(50, ge=1, le=200), offset: int = Query(0, ge=0),
                        db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    scope = org_scope(user)
    job_ids = _employer_job_ids(scope)
    hire_query = (select(Application, Job.title, User.full_name)
                  .join(Job, Job.id == Application.job_id).join(User, User.id == Application.applicant_id)
                  .where(Application.job_id.in_(job_ids), Application.status == "hired")
                  .order_by(Application.updated_at.desc().nullslast()).limit(200))
    hire_rows = (await db.execute(hire_query)).all()
    logged = {(job_id, trainee_id) for job_id, trainee_id in (await db.execute(
        select(EmployerFeedback.job_id, EmployerFeedback.trainee_id).where(EmployerFeedback.job_id.in_(job_ids)))).all()}
    hires = [{
        "application_id": str(app.id), "job_id": str(app.job_id), "job_title": title,
        "trainee_id": str(app.applicant_id), "employee_name": name,
        "hired_at": _iso(app.updated_at),
        "feedback_submitted": (app.job_id, app.applicant_id) in logged,
    } for app, title, name in hire_rows]

    query = (select(EmployerFeedback, Job.title, User.full_name, EmployerFeedbackRatings.ratings)
             .join(Job, Job.id == EmployerFeedback.job_id)
             .join(User, User.id == EmployerFeedback.trainee_id)
             .outerjoin(EmployerFeedbackRatings, EmployerFeedbackRatings.feedback_id == EmployerFeedback.id))
    if scope is not None:
        query = query.where(Job.organisation_id == scope)
    rows = (await db.execute(query.order_by(EmployerFeedback.created_at.desc()).offset(offset).limit(limit))).all()
    return {"hires": hires,
            "feedback": [_feedback_out(fb, title, name, ratings) for fb, title, name, ratings in rows]}


@router.post("/feedback", status_code=201)
async def submit_feedback(data: FeedbackIn, db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    """Post-hire feedback. Writes through the /jobs/feedback handler so skill-demand
    bookkeeping is unchanged; this wrapper adds the hired gate, a duplicate check
    and the six-criteria sidecar."""
    job = (await db.execute(select(Job).where(Job.id == data.job_id))).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    assert_org_access(user, job.organisation_id)
    if job.source != "employer":
        raise HTTPException(status_code=422, detail="Feedback requires an employer-owned job")
    hired = (await db.execute(select(Application.id).where(
        Application.job_id == job.id, Application.applicant_id == data.trainee_id,
        Application.status == "hired").limit(1))).scalar_one_or_none()
    if hired is None:
        raise HTTPException(status_code=422, detail="Feedback can be logged once the candidate is hired for this job")
    duplicate = (await db.execute(select(EmployerFeedback.id).where(
        EmployerFeedback.job_id == job.id, EmployerFeedback.trainee_id == data.trainee_id).limit(1))).scalar_one_or_none()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="Feedback has already been logged for this hire")

    ratings = data.ratings.model_dump()
    performance = _round_half_up(sum(ratings.values()) / len(ratings))
    relevance = _round_half_up((ratings["domain_knowledge"] + ratings["digital_skills"] + ratings["work_readiness"]) / 3)
    payload = FeedbackCreate(trainee_id=str(data.trainee_id), job_id=str(job.id), useful_skills=[],
                             missing_skills=data.additional_skills_needed, training_relevance=relevance,
                             performance_rating=performance, comments=data.comments)
    created = await submit_employer_feedback(payload, user, db)
    feedback_id = uuid.UUID(created["id"])
    db.add(EmployerFeedbackRatings(feedback_id=feedback_id, ratings=ratings, created_at=_now()))
    await db.commit()
    fb = await db.get(EmployerFeedback, feedback_id)
    trainee = await db.get(User, data.trainee_id)
    return _feedback_out(fb, job.title, trainee.full_name if trainee else None, ratings)


@router.get("/feedback/aggregate")
async def feedback_aggregate(db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    """Platform-wide skill demand, counts only. Other employers' identities, job
    titles and trainee details are never returned."""
    return await _skill_demand_aggregate(db)


# ---------------------------------------------------------------- analytics

@router.get("/analytics")
async def employer_analytics(months: int = Query(6, ge=1, le=24), db: AsyncSession = Depends(get_db),
                             user: User = Depends(_employer)):
    """Cohort view: applications submitted in the window, with interviews, offers
    and hires that happened in it. Stage counts use each application's current
    status, so they are a snapshot of where the cohort stands today."""
    scope = org_scope(user)
    job_ids = _employer_job_ids(scope)
    since = _now() - timedelta(days=30 * months)
    cohort = await _status_counts(db, scope, since)
    applications = sum(cohort.values())
    shortlists = sum(cohort.get(s, 0) for s in PIPELINE_BEYOND_SHORTLIST)
    hires = cohort.get("hired", 0)

    interview_query = select(func.count(Interview.id)).where(
        Interview.scheduled_at >= since, Interview.status != "cancelled")
    offer_query = select(func.count(Offer.id)).where(Offer.sent_at.is_not(None), Offer.sent_at >= since)
    if scope is not None:
        interview_query = interview_query.where(Interview.organisation_id == scope)
        offer_query = offer_query.where(Offer.organisation_id == scope)
    interviews = (await db.execute(interview_query)).scalar_one()
    offers = (await db.execute(offer_query)).scalar_one()

    hired_rows = (await db.execute(select(Application.applied_at, Application.updated_at).where(
        Application.job_id.in_(job_ids), Application.status == "hired",
        Application.applied_at.is_not(None), Application.updated_at.is_not(None),
        Application.updated_at >= since))).all()
    days_by_month: dict[str, list[float]] = {}
    all_days: list[float] = []
    for applied, updated in hired_rows:
        if updated < applied:
            continue
        days = (updated - applied).total_seconds() / 86400
        all_days.append(days)
        days_by_month.setdefault(_month_key(updated), []).append(days)

    keys = _last_months(months)
    applied_months = Counter(_month_key(ts) for ts in (await db.execute(select(Application.applied_at).where(
        Application.job_id.in_(job_ids), Application.applied_at.is_not(None),
        Application.applied_at >= since))).scalars().all())
    hire_months = Counter(_month_key(updated) for _, updated in hired_rows)

    skill_rows = (await db.execute(select(Job.skills_required, func.count(Application.id))
                                   .outerjoin(Application, and_(Application.job_id == Job.id,
                                                                Application.applied_at >= since))
                                   .where(Job.id.in_(job_ids)).group_by(Job.id, Job.skills_required))).all()
    skill_counts: Counter = Counter()
    for skills, app_count in skill_rows:
        for skill in {s for s in (skills or []) if isinstance(s, str) and s.strip()}:
            skill_counts[skill] += app_count
    top_skills = [{"skill": s, "count": c} for s, c in sorted(skill_counts.items(), key=lambda kv: (-kv[1], kv[0]))[:10]]

    interview_stage = cohort.get("interview", 0) + cohort.get("offered", 0) + hires
    offered_stage = cohort.get("offered", 0) + hires
    return {
        "range_months": months,
        "kpis": {
            "applications": applications,
            "shortlists": shortlists,
            "interviews": interviews or 0,
            "offers": offers or 0,
            "hires": hires,
            "time_to_hire_days": round(sum(all_days) / len(all_days), 1) if all_days else None,
            "hiring_conversion_pct": _pct(hires, applications),
        },
        "funnel": [
            {"stage": "applied", "count": applications},
            {"stage": "shortlisted", "count": shortlists},
            {"stage": "interview", "count": interview_stage},
            {"stage": "offered", "count": offered_stage},
            {"stage": "hired", "count": hires},
        ],
        "hiring_timeline": [{"month": k, "applications": applied_months.get(k, 0), "hires": hire_months.get(k, 0)}
                            for k in keys],
        "top_skills": top_skills,
        "candidate_sources": [{"source": row["label"], "count": row["count"]} for row in await _source_breakdown(db, scope)],
        "time_to_hire_trend": [{"month": k, "days": round(sum(days_by_month[k]) / len(days_by_month[k]), 1)}
                               for k in keys if k in days_by_month],
        "job_performance": [{"job_id": p["job_id"], "job_title": p["job_title"], "applications": p["applications"],
                             "shortlisted": p["shortlisted"], "hires": p["hires"],
                             "conversion_pct": p["conversion_pct"]}
                            for p in await _job_performance(db, scope, since)],
    }


# ---------------------------------------------------------------- reports

ReportColumn = tuple[str, str]


def _cell(value: Any):
    if value is None or isinstance(value, (int, float, str)):
        return value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, (list, tuple)):
        return "; ".join(str(v) for v in value)
    return str(value)


async def _report_table(key: str, db: AsyncSession, scope: Optional[uuid.UUID]) -> tuple[list[ReportColumn], list[dict]]:
    job_ids = _employer_job_ids(scope)
    if key == "recruitment":
        columns = [("job_title", "Job"), ("candidate", "Candidate"), ("stage", "Stage"),
                   ("applied_at", "Applied on"), ("interview_at", "Interview at")]
        rows = (await db.execute(select(Application, Job.title, User.full_name)
            .join(Job, Job.id == Application.job_id).outerjoin(User, User.id == Application.applicant_id)
            .where(Application.job_id.in_(job_ids))
            .order_by(Application.applied_at.desc().nullslast()))).all()
        return columns, [{"job_title": t, "candidate": n, "stage": a.status, "applied_at": a.applied_at,
                          "interview_at": a.interview_at} for a, t, n in rows]
    if key == "hiring_funnel":
        columns = [("stage", "Stage"), ("count", "Applications")]
        counts = await _status_counts(db, scope)
        return columns, [{"stage": status, "count": count} for status, count in sorted(counts.items())]
    if key == "job_performance":
        columns = [("job_title", "Job"), ("status", "Status"), ("applications", "Applications"),
                   ("shortlisted", "Shortlisted"), ("interviews", "Interviews"), ("hires", "Hires"),
                   ("conversion_pct", "Conversion %")]
        return columns, [{"job_title": p["job_title"], "status": p["status"], "applications": p["applications"],
                          "shortlisted": p["shortlisted"], "interviews": p["interviews"], "hires": p["hires"],
                          "conversion_pct": p["conversion_pct"]} for p in await _job_performance(db, scope)]
    if key == "candidate_skills":
        columns = [("candidate", "Candidate"), ("skill", "Skill"), ("level", "Level"), ("verified", "Verified")]
        applicant_ids = select(Application.applicant_id).where(
            Application.job_id.in_(job_ids), Application.applicant_id.is_not(None))
        rows = (await db.execute(select(User.full_name, Skill.name, TraineeSkill.level, TraineeSkill.verified)
            .join(TraineeSkill, TraineeSkill.trainee_id == User.id)
            .join(Skill, Skill.id == TraineeSkill.skill_id)
            .where(User.id.in_(applicant_ids))
            .order_by(User.full_name, Skill.name))).all()
        return columns, [{"candidate": n, "skill": s, "level": lv, "verified": bool(v)} for n, s, lv, v in rows]
    if key == "interview":
        columns = [("job_title", "Job"), ("candidate", "Candidate"), ("scheduled_at", "Scheduled at"),
                   ("mode", "Mode"), ("status", "Status"), ("decision", "Decision"),
                   ("overall_rating", "Overall rating"), ("recommendation", "Recommendation")]
        query = (select(Interview, Job.title, User.full_name).join(Job, Job.id == Interview.job_id)
                 .join(User, User.id == Interview.trainee_id).order_by(Interview.scheduled_at))
        if scope is not None:
            query = query.where(Interview.organisation_id == scope)
        rows = (await db.execute(query)).all()
        return columns, [{"job_title": t, "candidate": n, "scheduled_at": i.scheduled_at, "mode": i.mode,
                          "status": i.status, "decision": i.decision, "overall_rating": i.overall_rating,
                          "recommendation": (i.evaluation or {}).get("overall_recommendation")}
                         for i, t, n in rows]
    if key == "employment":
        columns = [("job_title", "Job"), ("candidate", "Candidate"), ("status", "Offer status"),
                   ("salary", "Salary (INR/yr)"), ("employment_type", "Employment type"),
                   ("joining_date", "Joining date"), ("sent_at", "Sent at"), ("responded_at", "Responded at")]
        query = (select(Offer, Job.title, User.full_name).join(Job, Job.id == Offer.job_id)
                 .join(User, User.id == Offer.trainee_id).order_by(Offer.created_at.desc()))
        if scope is not None:
            query = query.where(Offer.organisation_id == scope)
        rows = (await db.execute(query)).all()
        return columns, [{"job_title": t, "candidate": n, "status": o.status, "salary": o.salary,
                          "employment_type": o.employment_type, "joining_date": o.joining_date,
                          "sent_at": o.sent_at, "responded_at": o.responded_at} for o, t, n in rows]
    if key == "employer_feedback":
        columns = [("job_title", "Job"), ("candidate", "Candidate")] + \
                  [(k, k.replace("_", " ").capitalize()) for k in FEEDBACK_KEYS] + \
                  [("performance_rating", "Performance (avg)"), ("additional_skills_needed", "Skills needed"),
                   ("comments", "Comments"), ("created_at", "Logged at")]
        query = (select(EmployerFeedback, Job.title, User.full_name, EmployerFeedbackRatings.ratings)
                 .join(Job, Job.id == EmployerFeedback.job_id)
                 .join(User, User.id == EmployerFeedback.trainee_id)
                 .outerjoin(EmployerFeedbackRatings, EmployerFeedbackRatings.feedback_id == EmployerFeedback.id)
                 .order_by(EmployerFeedback.created_at.desc()))
        if scope is not None:
            query = query.where(Job.organisation_id == scope)
        rows = (await db.execute(query)).all()
        out = []
        for fb, title, name, ratings in rows:
            record = {"job_title": title, "candidate": name, "performance_rating": fb.performance_rating,
                      "additional_skills_needed": fb.missing_skills or [], "comments": fb.comments,
                      "created_at": fb.created_at}
            for k in FEEDBACK_KEYS:
                record[k] = (ratings or {}).get(k)
            out.append(record)
        return columns, out
    raise HTTPException(status_code=404, detail="Unknown report")


def _csv_cell(value) -> str:
    """Neutralise spreadsheet formula injection in exported text cells."""
    text = "" if value is None else str(value)
    if text[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + text
    return text


@router.get("/reports")
async def list_reports(user: User = Depends(_employer)):
    return {"reports": [{"key": key, "title": title, "description": desc, "formats": ["csv"]}
                        for key, (title, desc) in REPORT_CATALOG.items()]}


@router.get("/reports/{key}")
async def preview_report(key: str, db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    if key not in REPORT_CATALOG:
        raise HTTPException(status_code=404, detail="Unknown report")
    columns, rows = await _report_table(key, db, org_scope(user))
    title, description = REPORT_CATALOG[key]
    return {
        "key": key, "title": title, "description": description,
        "columns": [{"key": k, "label": label} for k, label in columns],
        "rows": [{k: _cell(row.get(k)) for k, _ in columns} for row in rows[:REPORT_PREVIEW_ROWS]],
        "total_rows": len(rows),
    }


@router.get("/reports/{key}/export")
async def export_report(key: str, format: Literal["csv"] = Query("csv"), db: AsyncSession = Depends(get_db),
                        user: User = Depends(_employer)):
    if key not in REPORT_CATALOG:
        raise HTTPException(status_code=404, detail="Unknown report")
    columns, rows = await _report_table(key, db, org_scope(user))
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([k for k, _ in columns])
    for row in rows:
        writer.writerow([_csv_cell(_cell(row.get(k))) for k, _ in columns])
    filename = f"coopsetu-{key}-{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    return Response(content=buffer.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# ---------------------------------------------------------------- company

class CompanyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sector: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=3000)
    location: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=255, pattern=r"^https?://\S+$")
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    departments: Optional[list[str]] = Field(None, max_length=50)

    @field_validator("departments")
    @classmethod
    def _clean_departments(cls, values):
        if values is None:
            return None
        return list(dict.fromkeys(v.strip()[:100] for v in values if v and v.strip()))


async def _load_company(db: AsyncSession, user: User) -> Organisation:
    org = (await db.execute(select(Organisation).where(Organisation.id == _caller_org_id(user)))).scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return org


async def _company_out(db: AsyncSession, org: Organisation) -> dict:
    profile = await db.get(EmployerOrgProfile, org.id)
    return {
        "id": str(org.id), "name": org.name, "sector": org.type,
        "description": profile.description if profile else None,
        "location": org.address, "website": org.website,
        "contact_email": org.email, "contact_phone": org.phone,
        "departments": (profile.departments if profile else None) or [],
    }


@router.get("/company")
async def get_company(db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    return await _company_out(db, await _load_company(db, user))


@router.patch("/company")
async def update_company(data: CompanyUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    org_id = _caller_org_id(user)
    await _require_team_admin(db, user, org_id)
    org = await _load_company(db, user)
    values = data.model_dump(exclude_unset=True, mode="json")
    if "name" in values and not (values["name"] or "").strip():
        raise HTTPException(status_code=422, detail="Company name cannot be empty")
    column_for = {"name": "name", "sector": "type", "location": "address", "website": "website",
                  "contact_email": "email", "contact_phone": "phone"}
    for field, value in values.items():
        if field in column_for:
            setattr(org, column_for[field], value)
    if "description" in values or "departments" in values:
        profile = await db.get(EmployerOrgProfile, org.id)
        if profile is None:
            profile = EmployerOrgProfile(organisation_id=org.id, departments=[])
            db.add(profile)
        if "description" in values:
            profile.description = values["description"]
        if "departments" in values:
            profile.departments = values["departments"]
        profile.updated_at = _now()
    await db.commit()
    return await _company_out(db, org)


# ---------------------------------------------------------------- team

class TeamInvite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(None, max_length=255)
    email: EmailStr
    role: TeamRoleName = "recruiter"


class TeamRoleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: TeamRoleName


async def _effective_team_roles(db: AsyncSession, org_id: uuid.UUID, persist: bool = False) -> dict[uuid.UUID, str]:
    """Team role for every active employer account in the organisation. Accounts
    without a stored row are recruiters. If no active Employer Admin exists, the
    oldest active employer account is treated as admin so an organisation can
    never be left without one. With persist=True that bootstrap is written."""
    members = (await db.execute(select(User, EmployerTeamMember.team_role)
        .outerjoin(EmployerTeamMember, EmployerTeamMember.user_id == User.id)
        .where(User.organisation_id == org_id, User.role == "employer", User.is_active.is_(True))
        .order_by(User.created_at.asc().nullslast(), User.id.asc()))).all()
    roles: dict[uuid.UUID, str] = {user.id: (stored or RECRUITER_ROLE) for user, stored in members}
    if members and ADMIN_ROLE not in roles.values():
        bootstrap = members[0][0]
        roles[bootstrap.id] = ADMIN_ROLE
        if persist:
            row = (await db.execute(select(EmployerTeamMember).where(
                EmployerTeamMember.user_id == bootstrap.id))).scalar_one_or_none()
            if row is None:
                db.add(EmployerTeamMember(id=uuid.uuid4(), organisation_id=org_id, user_id=bootstrap.id,
                                          team_role=ADMIN_ROLE, created_at=_now(), updated_at=_now()))
            else:
                row.team_role = ADMIN_ROLE
                row.updated_at = _now()
            await db.flush()
    return roles


async def _require_team_admin(db: AsyncSession, user: User, org_id: uuid.UUID) -> None:
    if user.role in GLOBAL_ROLES:
        return
    roles = await _effective_team_roles(db, org_id, persist=True)
    if roles.get(user.id) != ADMIN_ROLE:
        raise HTTPException(status_code=403, detail="Only an Employer Admin can manage the team")


async def _current_role(db: AsyncSession, user: User) -> str:
    if user.role in GLOBAL_ROLES:
        return ADMIN_ROLE
    roles = await _effective_team_roles(db, _caller_org_id(user))
    return roles.get(user.id, RECRUITER_ROLE)


def _member_out(user: User, role: str) -> dict:
    return {"id": str(user.id), "name": user.full_name, "email": user.email, "role": role,
            "status": "active" if user.is_active else "disabled", "last_active": None}


@router.get("/team")
async def list_team(db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    org_id = _caller_org_id(user)
    roles = await _effective_team_roles(db, org_id)
    members = (await db.execute(select(User)
        .where(User.organisation_id == org_id, User.role == "employer")
        .order_by(User.full_name.asc().nullslast(), User.email))).scalars().all()
    current = await _current_role(db, user)
    return {
        "current_role": current,
        "can_manage": current == ADMIN_ROLE,
        "roles": [{"value": r, "label": label} for r, label in (
            ("employer_admin", "Employer Admin"), ("recruiter", "Recruiter"), ("hiring_manager", "Hiring Manager"))],
        "members": [_member_out(m, roles.get(m.id, RECRUITER_ROLE)) for m in members],
    }


@router.post("/team", status_code=201)
async def invite_team_member(data: TeamInvite, db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    org_id = _caller_org_id(user)
    await _require_team_admin(db, user, org_id)
    target = (await db.execute(select(User).where(_email_match(data.email)))).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404,
                            detail="No CoopSetu account exists for this email. The person must sign in once first.")
    if target.role != "employer":
        raise HTTPException(status_code=422, detail="Only employer accounts can join the team")
    if target.organisation_id is not None and target.organisation_id != org_id:
        raise HTTPException(status_code=409, detail="This account belongs to another organisation")
    if target.organisation_id == org_id:
        raise HTTPException(status_code=409, detail="This person is already on the team. Change their role instead.")
    target.organisation_id = org_id
    if not target.full_name and data.name:
        target.full_name = data.name.strip()
    now = _now()
    db.add(EmployerTeamMember(id=uuid.uuid4(), organisation_id=org_id, user_id=target.id,
                              team_role=data.role, added_by_id=user.id, created_at=now, updated_at=now))
    await db.commit()
    return _member_out(target, data.role)


@router.patch("/team/{member_id}")
async def update_team_member(member_id: uuid.UUID, data: TeamRoleUpdate, db: AsyncSession = Depends(get_db),
                             user: User = Depends(_employer)):
    org_id = _caller_org_id(user)
    await _require_team_admin(db, user, org_id)
    target = (await db.execute(select(User).where(User.id == member_id, User.role == "employer",
                                                  User.organisation_id == org_id))).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="Team member not found")
    roles = await _effective_team_roles(db, org_id, persist=True)
    if roles.get(target.id) == ADMIN_ROLE and data.role != ADMIN_ROLE:
        other_admins = [uid for uid, role in roles.items() if role == ADMIN_ROLE and uid != target.id]
        if not other_admins:
            raise HTTPException(status_code=409, detail="The organisation must keep at least one Employer Admin")
    now = _now()
    row = (await db.execute(select(EmployerTeamMember).where(
        EmployerTeamMember.user_id == target.id))).scalar_one_or_none()
    if row is None:
        row = EmployerTeamMember(id=uuid.uuid4(), organisation_id=org_id, user_id=target.id,
                                 team_role=data.role, added_by_id=user.id, created_at=now)
        db.add(row)
    row.team_role = data.role
    row.updated_at = now
    await db.commit()
    return _member_out(target, data.role)


# ---------------------------------------------------------------- settings

class NotificationPrefsPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    interview_reminders: Optional[bool] = None
    new_application: Optional[bool] = None
    candidate_response: Optional[bool] = None
    job_deadline: Optional[bool] = None


class AccountPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(..., min_length=1, max_length=255)


class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    notifications: Optional[NotificationPrefsPatch] = None
    account: Optional[AccountPatch] = None


async def _settings_out(db: AsyncSession, user: User) -> dict:
    prefs = await db.get(EmployerUserPreferences, user.id)
    merged = {**NOTIFICATION_DEFAULTS, **((prefs.notifications if prefs else None) or {})}
    return {
        "account": {"name": user.full_name, "email": user.email, "role": await _current_role(db, user)},
        "notifications": {k: bool(merged.get(k, True)) for k in NOTIFICATION_DEFAULTS},
    }


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    return await _settings_out(db, user)


@router.patch("/settings")
async def update_settings(data: SettingsUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(_employer)):
    if data.account is not None:
        user.full_name = data.account.name.strip()
    if data.notifications is not None:
        changes = data.notifications.model_dump(exclude_none=True)
        prefs = await db.get(EmployerUserPreferences, user.id)
        if prefs is None:
            prefs = EmployerUserPreferences(user_id=user.id, notifications={})
            db.add(prefs)
        prefs.notifications = {**(prefs.notifications or {}), **changes}
        prefs.updated_at = _now()
    await db.commit()
    return await _settings_out(db, user)
