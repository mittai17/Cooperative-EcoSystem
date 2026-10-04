"""NCCT admin portal: dashboard aggregates, institutions, trainers, trainees,
employers, programmes, jobs/placements, assessments, certifications, users,
reports, platform settings and the audit log.

Every route requires the platform `admin` role (401 without a token, 403 for
any other role, including `ncct_admin`). Every mutation writes an `audit_logs`
row in the same transaction. Aggregations return zero or null for missing
source data; nothing is invented.
"""
from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from sqlalchemy import Text, and_, case, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_roles
from app.models.assessment import Assessment, AssessmentAttempt, AssessmentResult
from app.models.audit_log import AuditLog
from app.models.certificate import Certificate
from app.models.course import Course
from app.models.job import Application, Job
from app.models.notification import PushToken
from app.models.platform_settings import PlatformSetting
from app.models.profile import UserProfile
from app.models.programme import Enrollment, Nomination, Programme
from app.models.skill import Skill, TraineeSkill
from app.models.user import PENDING_CLERK_PREFIX, Organisation, User
from app.services.certificate_service import certificate_integrity

router = APIRouter(dependencies=[Depends(require_roles("admin"))])

PAGE_SIZE_DEFAULT = 10
PAGE_SIZE_MAX = 100
ROLES = ("trainee", "trainer", "institution", "employer", "admin", "ncct_admin")
INSTITUTION_TYPE = "institution"
REPORT_KEYS = Literal["enrollment", "placements", "assessments", "certifications"]


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def percent(part: int | float, whole: int | float, digits: int = 1) -> float:
    """Zero-safe percentage: 0.0 when there is no denominator."""
    if not whole:
        return 0.0
    return round(part * 100.0 / whole, digits)


def iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def search_clause(term: Optional[str], *columns):
    cleaned = (term or "").strip()
    if not cleaned:
        return None
    pattern = f"%{escape_like(cleaned)}%"
    return or_(*(col.ilike(pattern, escape="\\") for col in columns))


async def paginate(db: AsyncSession, stmt, page: int, page_size: int) -> tuple[int, list]:
    """Count then fetch one page. `stmt` must be a SELECT of full entities or
    labelled columns; ordering is applied by the caller before this call."""
    total = (await db.execute(select(func.count()).select_from(stmt.order_by(None).subquery()))).scalar_one()
    rows = (await db.execute(stmt.offset((page - 1) * page_size).limit(page_size))).all()
    return int(total or 0), rows


def page_payload(items: list, total: int, page: int, page_size: int) -> dict:
    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def record_audit(db: AsyncSession, actor: User, action: str, entity: str,
                       entity_id: Optional[uuid.UUID | str], meta: Optional[dict] = None) -> None:
    db.add(AuditLog(
        id=uuid.uuid4(), actor_id=actor.id, action=action, entity=entity,
        entity_id=str(entity_id) if entity_id is not None else None,
        created_at=utcnow(), meta=meta or None,
    ))


def status_of(is_active: Optional[bool]) -> str:
    return "active" if is_active is not False else "inactive"


def month_starts(count: int) -> list[datetime]:
    """First instant of each of the last `count` calendar months, oldest first."""
    now = utcnow()
    current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    starts = [current]
    for _ in range(count - 1):
        prev_last = starts[0] - timedelta(days=1)
        starts.insert(0, prev_last.replace(day=1))
    return starts


async def monthly_counts(db: AsyncSession, column, since: datetime, extra=None) -> dict[str, int]:
    """Count rows per 'YYYY-MM' bucket of `column` since `since`."""
    bucket = func.date_trunc("month", column).label("bucket")
    stmt = select(bucket, func.count()).where(column >= since, column.isnot(None))
    if extra is not None:
        stmt = stmt.where(extra)
    rows = (await db.execute(stmt.group_by(bucket))).all()
    return {row[0].strftime("%Y-%m"): int(row[1]) for row in rows if row[0] is not None}


async def count_where(db: AsyncSession, stmt) -> int:
    return int((await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0)


# ---------------------------------------------------------------------------
# Request models (extra="forbid", length and range limits)
# ---------------------------------------------------------------------------

class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class InstitutionCreate(_Strict):
    name: str = Field(min_length=1, max_length=255)
    state: str = Field(min_length=1, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=500)
    pincode: Optional[str] = Field(default=None, pattern=r"^\d{6}$")
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    website: Optional[str] = Field(default=None, max_length=255)
    accreditation_number: Optional[str] = Field(default=None, max_length=100)


class InstitutionUpdate(_Strict):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    state: Optional[str] = Field(default=None, min_length=1, max_length=100)
    district: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=500)
    pincode: Optional[str] = Field(default=None, pattern=r"^\d{6}$")
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    website: Optional[str] = Field(default=None, max_length=255)
    accreditation_number: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update")
        return self


class TrainerCreate(_Strict):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    organisation_id: Optional[uuid.UUID] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    state: Optional[str] = Field(default=None, max_length=100)
    qualification: Optional[str] = Field(default=None, max_length=255)
    expertise: Optional[list[str]] = Field(default=None, max_length=20)

    @field_validator("expertise")
    @classmethod
    def _expertise_items(cls, value):
        if value is not None and any(not (1 <= len(item.strip()) <= 100) for item in value):
            raise ValueError("Each expertise entry must be 1-100 characters")
        return value


class TraineeCreate(_Strict):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    organisation_id: Optional[uuid.UUID] = None
    phone: Optional[str] = Field(default=None, max_length=20)
    state: Optional[str] = Field(default=None, max_length=100)
    programme_id: Optional[uuid.UUID] = None


class ProgrammeCreate(_Strict):
    title: str = Field(min_length=1, max_length=255)
    sector: Optional[str] = Field(default=None, max_length=100)
    level: Optional[str] = Field(default=None, max_length=50)
    mode: Optional[str] = Field(default=None, max_length=50)
    duration_weeks: Optional[int] = Field(default=None, ge=1, le=520)
    seats_total: int = Field(default=0, ge=0, le=100000)
    organisation_id: Optional[uuid.UUID] = None
    start_date: Optional[datetime] = None
    description: Optional[str] = Field(default=None, max_length=5000)
    is_active: bool = True


class JobCreate(_Strict):
    title: str = Field(min_length=1, max_length=255)
    employer_name: str = Field(min_length=1, max_length=255)
    location: Optional[str] = Field(default=None, max_length=255)
    sector: str = Field(default="Cooperative", max_length=100)
    job_type: str = Field(default="Full-time", max_length=50)
    salary_range: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=5000)
    skills_required: Optional[list[str]] = Field(default=None, max_length=50)
    openings: Optional[int] = Field(default=None, ge=1, le=10000)
    deadline: Optional[datetime] = None
    status: Literal["draft", "open"] = "open"

    @field_validator("skills_required")
    @classmethod
    def _skill_items(cls, value):
        if value is not None and any(not (1 <= len(item.strip()) <= 100) for item in value):
            raise ValueError("Each skill must be 1-100 characters")
        return value


class AssessmentCreate(_Strict):
    title: str = Field(min_length=1, max_length=255)
    programme_id: Optional[uuid.UUID] = None
    course_id: Optional[uuid.UUID] = None
    skill_name: Optional[str] = Field(default=None, max_length=255)
    total_questions: int = Field(default=25, ge=1, le=500)
    duration_minutes: int = Field(default=45, ge=1, le=600)
    passing_score: int = Field(default=60, ge=0, le=100)
    due_date: Optional[datetime] = None
    max_attempts: int = Field(default=3, ge=1, le=10)
    show_answers: Literal["after_submit", "never"] = "after_submit"


class UserCreate(_Strict):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    role: Literal["trainee", "trainer", "institution", "employer", "admin", "ncct_admin"]
    organisation_id: Optional[uuid.UUID] = None


class UserUpdate(_Strict):
    role: Optional[Literal["trainee", "trainer", "institution", "employer", "admin", "ncct_admin"]] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_fields_set:
            raise ValueError("Provide role or is_active")
        return self


class GeneralSettings(_Strict):
    org_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    admin_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    contact_address: Optional[str] = Field(default=None, max_length=500)


class AppearanceSettings(_Strict):
    accent_color: Optional[str] = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    density: Optional[Literal["compact", "comfortable"]] = None


class NotificationSettings(_Strict):
    email_enabled: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    placement_alerts: Optional[bool] = None
    digest_frequency: Optional[Literal["daily", "weekly", "monthly"]] = None


class SecuritySettings(_Strict):
    session_timeout_minutes: Optional[int] = Field(default=None, ge=5, le=1440)
    mfa_required: Optional[bool] = None
    password_min_length: Optional[int] = Field(default=None, ge=8, le=128)
    allowed_email_domains: Optional[list[str]] = Field(default=None, max_length=20)

    @field_validator("allowed_email_domains")
    @classmethod
    def _domains(cls, value):
        if value is not None and any(not (3 <= len(d) <= 255) or "@" in d for d in value):
            raise ValueError("Each domain must be 3-255 characters and must not contain '@'")
        return value


class SettingsPatch(_Strict):
    general: Optional[GeneralSettings] = None
    appearance: Optional[AppearanceSettings] = None
    notifications: Optional[NotificationSettings] = None
    security: Optional[SecuritySettings] = None

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_fields_set:
            raise ValueError("Provide at least one settings section")
        return self


SETTINGS_DEFAULTS: dict[str, dict[str, Any]] = {
    "general": {"org_name": "National Cooperative Training (NCCT)", "admin_email": None,
                "contact_phone": None, "contact_address": None},
    "appearance": {"accent_color": "#E31B23", "density": "comfortable"},
    "notifications": {"email_enabled": True, "weekly_digest": True, "placement_alerts": True,
                      "digest_frequency": "weekly"},
    "security": {"session_timeout_minutes": 60, "mfa_required": False, "password_min_length": 8,
                 "allowed_email_domains": []},
}
SETTINGS_MODELS = {"general": GeneralSettings, "appearance": AppearanceSettings,
                   "notifications": NotificationSettings, "security": SecuritySettings}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

def build_insights(kpis: dict, placements: dict, top_sector: Optional[dict]) -> list[dict]:
    """Templated insight sentences from real counts. Zero-safe: with an empty
    database every sentence describes the absence of data instead of dividing
    by zero or inventing a figure."""
    trainees = kpis["trainees"]
    institutions = kpis["institutions"]
    insights = []
    if trainees:
        insights.append({"title": "Enrolment",
                         "text": f"{trainees} trainees are on record across {institutions} institutions."})
    else:
        insights.append({"title": "Enrolment", "text": "No trainees are on record yet."})
    if placements["applications"]:
        insights.append({"title": "Placements",
                         "text": (f"Placement rate over the last 6 months is {placements['rate']}% "
                                  f"({placements['placements']} of {placements['applications']} applications).")})
    else:
        insights.append({"title": "Placements", "text": "No job applications in the last 6 months yet."})
    if top_sector:
        insights.append({"title": "Programme mix",
                         "text": f"{top_sector['label']} is the largest programme sector at {top_sector['percent']}% of programmes."})
    insights.append({"title": "Certifications", "text": f"{kpis['certified']} certificates are currently valid."})
    return insights


async def _kpis(db: AsyncSession, since_30d: datetime) -> dict:
    def org_count(extra=None):
        stmt = select(Organisation.id).where(Organisation.type == INSTITUTION_TYPE)
        return stmt if extra is None else stmt.where(extra)

    def user_count(role: str, extra=None):
        stmt = select(User.id).where(User.role == role)
        return stmt if extra is None else stmt.where(extra)

    cert_valid = and_(Certificate.revoked_at.is_(None), Certificate.status != "revoked")
    kpis = {
        "institutions": await count_where(db, org_count()),
        "trainers": await count_where(db, user_count("trainer")),
        "trainees": await count_where(db, user_count("trainee")),
        "certified": await count_where(db, select(Certificate.id).where(cert_valid)),
        "employers": await count_where(db, user_count("employer")),
    }
    kpis["deltas"] = {
        "institutions": await count_where(db, org_count(Organisation.created_at >= since_30d)),
        "trainers": await count_where(db, user_count("trainer", User.created_at >= since_30d)),
        "trainees": await count_where(db, user_count("trainee", User.created_at >= since_30d)),
        "certified": await count_where(db, select(Certificate.id).where(
            cert_valid, Certificate.issue_date >= since_30d)),
        "employers": await count_where(db, user_count("employer", User.created_at >= since_30d)),
    }
    return kpis


@router.get("/dashboard")
async def admin_dashboard(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles("admin"))):
    now = utcnow()
    since_30d = now - timedelta(days=30)
    months = month_starts(6)
    since_6m = months[0]
    keys = [m.strftime("%Y-%m") for m in months]

    kpis = await _kpis(db, since_30d)

    enrol = await monthly_counts(db, Enrollment.enrolled_at, since_6m)
    certs = await monthly_counts(db, Certificate.issue_date, since_6m)
    enrollment_trend = [
        {"month": m.strftime("%b"), "new_enrollments": enrol.get(k, 0), "certifications": certs.get(k, 0)}
        for m, k in zip(months, keys)
    ]

    state_label = func.coalesce(Organisation.state, "Unspecified")
    state_rows = (await db.execute(
        select(state_label.label("state"), func.count(Organisation.id).label("count"))
        .where(Organisation.type == INSTITUTION_TYPE)
        .group_by(state_label).order_by(func.count(Organisation.id).desc(), state_label).limit(20)
    )).all()
    institutions_by_state = [{"state": row.state, "count": int(row.count)} for row in state_rows]

    sector_label = func.coalesce(Programme.sector, "Unspecified")
    sector_rows = (await db.execute(
        select(sector_label.label("label"), func.count(Programme.id).label("count"))
        .group_by(sector_label).order_by(func.count(Programme.id).desc(), sector_label).limit(8)
    )).all()
    programme_total = await count_where(db, select(Programme.id))
    program_distribution = [
        {"label": row.label, "percent": percent(int(row.count), programme_total)} for row in sector_rows
    ]

    applied = await monthly_counts(db, Application.applied_at, since_6m)
    hired = await monthly_counts(db, Application.applied_at, since_6m, extra=Application.status == "hired")
    placement_overview = []
    for m, k in zip(months, keys):
        apps, placed = applied.get(k, 0), hired.get(k, 0)
        placement_overview.append({"month": m.strftime("%b"), "placements": placed,
                                   "rate": percent(placed, apps)})
    total_apps = await count_where(db, select(Application.id).where(Application.applied_at >= since_6m))
    total_placed = await count_where(db, select(Application.id).where(
        Application.applied_at >= since_6m, Application.status == "hired"))
    placement_summary = {"applications": total_apps, "placements": total_placed,
                         "rate": percent(total_placed, total_apps)}

    trainee_count = (select(func.count(User.id)).where(
        User.organisation_id == Organisation.id, User.role == "trainee").correlate(Organisation).scalar_subquery())
    trainer_count = (select(func.count(User.id)).where(
        User.organisation_id == Organisation.id, User.role == "trainer").correlate(Organisation).scalar_subquery())
    top_rows = (await db.execute(
        select(Organisation.id, Organisation.name, Organisation.state,
               trainee_count.label("trainees"), trainer_count.label("trainers"))
        .where(Organisation.type == INSTITUTION_TYPE)
        .order_by(trainee_count.desc(), Organisation.name).limit(5)
    )).all()
    top_institutions = [
        {"id": str(row.id), "name": row.name, "state": row.state,
         "trainees": int(row.trainees or 0), "trainers": int(row.trainers or 0),
         "rating": None}  # no rating source exists yet; never invented
        for row in top_rows
    ]

    audit_rows = (await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(8))).scalars().all()
    recent_activity = [
        {"kind": "audit", "title": row.action,
         "subtitle": " ".join(part for part in (row.entity, row.entity_id) if part),
         "at": iso(row.created_at)}
        for row in audit_rows
    ]

    placed_rows = (await db.execute(
        select(User.full_name, Job.title, Job.employer_name, Application.updated_at, Application.applied_at)
        .join(User, User.id == Application.applicant_id)
        .join(Job, Job.id == Application.job_id)
        .where(Application.status == "hired")
        .order_by(func.coalesce(Application.updated_at, Application.applied_at).desc()).limit(5)
    )).all()
    recent_placements = [
        {"candidate_name": row.full_name, "role": row.title, "employer": row.employer_name,
         "date": iso(row.updated_at or row.applied_at)}
        for row in placed_rows
    ]

    top_sector = program_distribution[0] if program_distribution else None
    return {
        "kpis": kpis,
        "enrollment_trend": enrollment_trend,
        "institutions_by_state": institutions_by_state,
        "program_distribution": program_distribution,
        "placement_overview": placement_overview,
        "top_institutions": top_institutions,
        "recent_activity": recent_activity,
        "recent_placements": recent_placements,
        "ai_insights": build_insights(kpis, placement_summary, top_sector),
    }


# ---------------------------------------------------------------------------
# Institutions
# ---------------------------------------------------------------------------

def _institution_row(org: Organisation, trainees: int, trainers: int, programmes: int) -> dict:
    return {
        "id": str(org.id), "name": org.name, "type": org.type, "state": org.state,
        "district": org.district, "address": org.address, "pincode": org.pincode,
        "phone": org.phone, "email": org.email, "website": org.website,
        "accreditation_number": org.accreditation_number, "status": status_of(org.is_active),
        "trainees": trainees, "trainers": trainers, "programmes": programmes,
    }


@router.get("/institutions")
async def list_institutions(
    q: Optional[str] = Query(None, max_length=100),
    state: Optional[str] = Query(None, max_length=100),
    type: Optional[str] = Query(None, max_length=50),
    status: Optional[Literal["active", "inactive"]] = Query(None),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Organisation).where(Organisation.type == (type or INSTITUTION_TYPE))
    if (clause := search_clause(q, Organisation.name, Organisation.email)) is not None:
        stmt = stmt.where(clause)
    if state:
        stmt = stmt.where(Organisation.state == state)
    if status:
        stmt = stmt.where(Organisation.is_active.is_(status == "active"))
    stmt = stmt.order_by(Organisation.name, Organisation.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = []
    for (org,) in rows:
        items.append(_institution_row(
            org,
            await count_where(db, select(User.id).where(User.organisation_id == org.id, User.role == "trainee")),
            await count_where(db, select(User.id).where(User.organisation_id == org.id, User.role == "trainer")),
            await count_where(db, select(Programme.id).where(Programme.organisation_id == org.id)),
        ))
    return page_payload(items, total, page, page_size)


@router.get("/institutions/{institution_id}")
async def get_institution(institution_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    org = (await db.execute(select(Organisation).where(Organisation.id == institution_id))).scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Institution not found")
    return _institution_row(
        org,
        await count_where(db, select(User.id).where(User.organisation_id == org.id, User.role == "trainee")),
        await count_where(db, select(User.id).where(User.organisation_id == org.id, User.role == "trainer")),
        await count_where(db, select(Programme.id).where(Programme.organisation_id == org.id)),
    )


@router.post("/institutions", status_code=201)
async def create_institution(data: InstitutionCreate, db: AsyncSession = Depends(get_db),
                             actor: User = Depends(require_roles("admin"))):
    payload = data.model_dump(exclude_none=True)
    if "email" in payload:
        payload["email"] = str(payload["email"])
    org = Organisation(id=uuid.uuid4(), type=INSTITUTION_TYPE, is_active=True, **payload)
    db.add(org)
    await record_audit(db, actor, "institution.create", "institution", org.id, {"name": org.name})
    await db.commit()
    return _institution_row(org, 0, 0, 0)


@router.patch("/institutions/{institution_id}")
async def update_institution(institution_id: uuid.UUID, data: InstitutionUpdate,
                             db: AsyncSession = Depends(get_db), actor: User = Depends(require_roles("admin"))):
    org = (await db.execute(select(Organisation).where(Organisation.id == institution_id))).scalar_one_or_none()
    if org is None or org.type != INSTITUTION_TYPE:
        raise HTTPException(status_code=404, detail="Institution not found")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(org, field, str(value) if field == "email" and value is not None else value)
    await record_audit(db, actor, "institution.update", "institution", org.id, {"fields": sorted(changes)})
    await db.commit()
    return await get_institution(institution_id, db)


# ---------------------------------------------------------------------------
# Trainers, trainees, employers (users + profiles)
# ---------------------------------------------------------------------------

def _person_row(user: User, org_name: Optional[str], state: Optional[str],
                last_active: Optional[datetime] = None) -> dict:
    return {
        "id": str(user.id), "full_name": user.full_name, "email": user.email, "role": user.role,
        "organisation_id": str(user.organisation_id) if user.organisation_id else None,
        "organisation_name": org_name, "state": state, "status": status_of(user.is_active),
        "created_at": iso(user.created_at),
    }


def _person_query(role: str, q: Optional[str], state: Optional[str], status: Optional[str],
                  subject: Optional[str] = None):
    stmt = (select(User, Organisation.name, UserProfile.state)
            .outerjoin(Organisation, Organisation.id == User.organisation_id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .where(User.role == role))
    if (clause := search_clause(q, User.full_name, User.email)) is not None:
        stmt = stmt.where(clause)
    if (subject_clause := search_clause(subject, cast(UserProfile.expertise, Text))) is not None:
        stmt = stmt.where(subject_clause)
    if state:
        stmt = stmt.where(UserProfile.state == state)
    if status:
        stmt = stmt.where(User.is_active.is_(status == "active"))
    return stmt.order_by(User.full_name, User.id)


async def _person_page(db, stmt, page, page_size):
    total, rows = await paginate(db, stmt, page, page_size)
    return page_payload([_person_row(u, org, st) for u, org, st in rows], total, page, page_size)


StatusFilter = Optional[Literal["active", "inactive"]]


@router.get("/trainers")
async def list_trainers(
    q: Optional[str] = Query(None, max_length=100),
    state: Optional[str] = Query(None, max_length=100),
    subject: Optional[str] = Query(None, max_length=100),
    status: StatusFilter = Query(None),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    stmt = _person_query("trainer", q, state, status, subject)
    return await _person_page(db, stmt, page, page_size)


@router.post("/trainers", status_code=201)
async def create_trainer(data: TrainerCreate, db: AsyncSession = Depends(get_db),
                         actor: User = Depends(require_roles("admin"))):
    user = await _create_local_user(db, actor, email=str(data.email), full_name=data.full_name,
                                    role="trainer", organisation_id=data.organisation_id)
    profile_fields = {"phone": data.phone, "state": data.state, "qualification": data.qualification,
                      "expertise": [e.strip() for e in data.expertise] if data.expertise is not None else None}
    if any(v is not None for v in profile_fields.values()):
        db.add(UserProfile(id=uuid.uuid4(), user_id=user.id, visible_to_employers=False,
                           **{k: v for k, v in profile_fields.items() if v is not None}))
    await record_audit(db, actor, "trainer.create", "trainer", user.id, {"organisation_id": str(data.organisation_id) if data.organisation_id else None})
    await db.commit()
    return _person_row(user, None, data.state)


@router.get("/trainees")
async def list_trainees(
    q: Optional[str] = Query(None, max_length=100),
    program: Optional[uuid.UUID] = Query(None),
    state: Optional[str] = Query(None, max_length=100),
    status: StatusFilter = Query(None),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    stmt = _person_query("trainee", q, state, status)
    if program is not None:
        enrolled = select(Nomination.trainee_id).where(
            Nomination.programme_id == program, Nomination.status == "approved")
        stmt = stmt.where(User.id.in_(enrolled))
    return await _person_page(db, stmt, page, page_size)


@router.post("/trainees", status_code=201)
async def enrol_trainee(data: TraineeCreate, db: AsyncSession = Depends(get_db),
                        actor: User = Depends(require_roles("admin"))):
    if data.programme_id is not None:
        programme = (await db.execute(select(Programme.id).where(Programme.id == data.programme_id))).scalar_one_or_none()
        if programme is None:
            raise HTTPException(status_code=422, detail="Programme not found")
    user = await _create_local_user(db, actor, email=str(data.email), full_name=data.full_name,
                                    role="trainee", organisation_id=data.organisation_id)
    if data.phone is not None or data.state is not None:
        db.add(UserProfile(id=uuid.uuid4(), user_id=user.id, phone=data.phone, state=data.state,
                           visible_to_employers=False))
    if data.programme_id is not None:
        db.add(Nomination(id=uuid.uuid4(), trainee_id=user.id, programme_id=data.programme_id,
                          status="approved", nominated_by_id=actor.id, decision_note="Enrolled by NCCT admin"))
    await record_audit(db, actor, "trainee.enrol", "trainee", user.id,
                       {"programme_id": str(data.programme_id) if data.programme_id else None})
    await db.commit()
    return _person_row(user, None, data.state)


@router.get("/employers")
async def list_employers(
    q: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    return await _person_page(db, _person_query("employer", q, None, None), page, page_size)


# ---------------------------------------------------------------------------
# Users (platform accounts)
# ---------------------------------------------------------------------------

async def _create_local_user(db: AsyncSession, actor: User, *, email: str, full_name: str,
                             role: str, organisation_id: Optional[uuid.UUID]) -> User:
    """Create a local user row with the pending-Clerk sentinel. The real
    Clerk identity is linked on the person's first sign-in by email, the same
    flow POST /users uses."""
    if (await db.execute(select(User.id).where(User.email == email))).first() is not None:
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    if organisation_id is not None:
        org = (await db.execute(select(Organisation.id).where(Organisation.id == organisation_id))).first()
        if org is None:
            raise HTTPException(status_code=422, detail="Organisation not found")
    user = User(id=uuid.uuid4(), clerk_user_id=f"{PENDING_CLERK_PREFIX}{uuid.uuid4().hex}", email=email,
                full_name=full_name, role=role, organisation_id=organisation_id, is_active=True)
    db.add(user)
    await db.flush()
    return user


@router.get("/users")
async def list_users(
    q: Optional[str] = Query(None, max_length=100),
    role: Optional[Literal["trainee", "trainer", "institution", "employer", "admin", "ncct_admin"]] = Query(None),
    status: StatusFilter = Query(None),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    last_seen = (select(func.max(PushToken.last_seen_at)).where(PushToken.user_id == User.id)
                 .correlate(User).scalar_subquery())
    stmt = (select(User, Organisation.name, UserProfile.state, last_seen.label("last_active"))
            .outerjoin(Organisation, Organisation.id == User.organisation_id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id))
    if (clause := search_clause(q, User.full_name, User.email)) is not None:
        stmt = stmt.where(clause)
    if role:
        stmt = stmt.where(User.role == role)
    if status:
        stmt = stmt.where(User.is_active.is_(status == "active"))
    stmt = stmt.order_by(User.full_name, User.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = [_person_row(u, org, st) | {"last_active": iso(last)} for u, org, st, last in rows]
    return page_payload(items, total, page, page_size)


@router.post("/users", status_code=201)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db),
                      actor: User = Depends(require_roles("admin"))):
    user = await _create_local_user(db, actor, email=str(data.email), full_name=data.full_name,
                                    role=data.role, organisation_id=data.organisation_id)
    await record_audit(db, actor, "user.create", "user", user.id, {"role": data.role})
    await db.commit()
    return _person_row(user, None, None)


@router.patch("/users/{user_id}")
async def update_user(user_id: uuid.UUID, data: UserUpdate, db: AsyncSession = Depends(get_db),
                      actor: User = Depends(require_roles("admin"))):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    changes = data.model_dump(exclude_unset=True)
    if target.id == actor.id and (changes.get("is_active") is False or
                                  ("role" in changes and changes["role"] != "admin")):
        raise HTTPException(status_code=409, detail="You cannot deactivate or demote your own admin account")
    before = {"role": target.role, "is_active": target.is_active}
    for field, value in changes.items():
        setattr(target, field, value)
    await record_audit(db, actor, "user.update", "user", target.id,
                       {"before": before, "after": {"role": target.role, "is_active": target.is_active}})
    await db.commit()
    return _person_row(target, None, None)


# ---------------------------------------------------------------------------
# Programmes and skill passport
# ---------------------------------------------------------------------------

@router.get("/programmes")
async def list_programmes(
    q: Optional[str] = Query(None, max_length=100),
    status: StatusFilter = Query(None),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Programme, Organisation.name).outerjoin(Organisation, Organisation.id == Programme.organisation_id)
    if (clause := search_clause(q, Programme.title, Programme.sector)) is not None:
        stmt = stmt.where(clause)
    if status:
        stmt = stmt.where(Programme.is_active.is_(status == "active"))
    stmt = stmt.order_by(Programme.title, Programme.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = [{
        "id": str(p.id), "title": p.title, "sector": p.sector, "level": p.level, "mode": p.mode,
        "duration_weeks": p.duration_weeks, "seats_total": p.seats_total or 0,
        "seats_filled": p.seats_filled or 0, "organisation_name": org_name,
        "start_date": iso(p.start_date), "status": status_of(p.is_active),
    } for p, org_name in rows]
    return page_payload(items, total, page, page_size)


@router.post("/programmes", status_code=201)
async def create_programme(data: ProgrammeCreate, db: AsyncSession = Depends(get_db),
                           actor: User = Depends(require_roles("admin"))):
    if data.organisation_id is not None:
        org = (await db.execute(select(Organisation.id).where(Organisation.id == data.organisation_id))).first()
        if org is None:
            raise HTTPException(status_code=422, detail="Organisation not found")
    programme = Programme(id=uuid.uuid4(), created_by_id=actor.id, seats_filled=0, **data.model_dump())
    db.add(programme)
    await record_audit(db, actor, "programme.create", "programme", programme.id, {"title": programme.title})
    await db.commit()
    return {"id": str(programme.id), "title": programme.title, "sector": programme.sector,
            "seats_total": programme.seats_total, "status": status_of(programme.is_active)}


@router.get("/skill-passport")
async def skill_passport(
    q: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    verified_count = func.count(TraineeSkill.id)
    stmt = (select(Skill.id, Skill.name, Skill.category, verified_count.label("verified_count"),
                   func.count(func.distinct(TraineeSkill.trainee_id)).label("trainees"),
                   func.avg(TraineeSkill.confidence).label("avg_proficiency"))
            .join(TraineeSkill, TraineeSkill.skill_id == Skill.id)
            .where(TraineeSkill.verified.is_(True))
            .group_by(Skill.id, Skill.name, Skill.category))
    if (clause := search_clause(q, Skill.name, Skill.category)) is not None:
        stmt = stmt.where(clause)
    stmt = stmt.order_by(verified_count.desc(), Skill.name)
    total, rows = await paginate(db, stmt, page, page_size)
    items = [{
        "skill_id": str(row.id), "skill": row.name, "category": row.category,
        "verified_count": int(row.verified_count), "trainees": int(row.trainees),
        "avg_proficiency": round(float(row.avg_proficiency), 1) if row.avg_proficiency is not None else None,
    } for row in rows]
    return page_payload(items, total, page, page_size)


# ---------------------------------------------------------------------------
# Jobs and placements
# ---------------------------------------------------------------------------

@router.get("/jobs")
async def list_jobs(
    q: Optional[str] = Query(None, max_length=100),
    status: Optional[Literal["draft", "open", "closed"]] = Query(None),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    applicants = (select(func.count(Application.id)).where(Application.job_id == Job.id)
                  .correlate(Job).scalar_subquery())
    stmt = select(Job, applicants.label("applicants"))
    if (clause := search_clause(q, Job.title, Job.employer_name, Job.location)) is not None:
        stmt = stmt.where(clause)
    if status:
        stmt = stmt.where(Job.status == status)
    stmt = stmt.order_by(Job.posted_at.desc().nulls_last(), Job.title, Job.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = [{
        "id": str(job.id), "title": job.title, "employer_name": job.employer_name,
        "location": job.location, "job_type": job.job_type, "openings": job.openings,
        "status": job.status, "source": job.source, "applicants": int(count or 0),
        "posted_at": iso(job.posted_at),
    } for job, count in rows]
    return page_payload(items, total, page, page_size)


@router.post("/jobs", status_code=201)
async def create_job(data: JobCreate, db: AsyncSession = Depends(get_db),
                     actor: User = Depends(require_roles("admin"))):
    payload = data.model_dump()
    skills = payload.pop("skills_required")
    job = Job(
        id=uuid.uuid4(), source="employer", created_by_id=actor.id,
        posted_at=utcnow(), skills_required=skills, **payload,
    )
    db.add(job)
    await record_audit(db, actor, "job.create", "job", job.id,
                       {"employer_name": job.employer_name, "status": job.status})
    await db.commit()
    return {"id": str(job.id), "title": job.title, "employer_name": job.employer_name, "status": job.status,
            "source": job.source, "posted_at": iso(job.posted_at)}


@router.get("/placements")
async def list_placements(
    q: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    stmt = (select(Application, User.full_name, Job.title, Job.employer_name)
            .join(User, User.id == Application.applicant_id)
            .join(Job, Job.id == Application.job_id)
            .where(Application.status == "hired"))
    if (clause := search_clause(q, User.full_name, Job.title, Job.employer_name)) is not None:
        stmt = stmt.where(clause)
    stmt = stmt.order_by(Application.updated_at.desc().nulls_last(), Application.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = [{
        "id": str(app.id), "candidate_name": name, "role": title, "employer": employer,
        "date": iso(app.updated_at or app.applied_at),
    } for app, name, title, employer in rows]
    return page_payload(items, total, page, page_size)


# ---------------------------------------------------------------------------
# Assessments and certifications
# ---------------------------------------------------------------------------

@router.get("/assessments")
async def list_assessments(
    q: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    attempts = (select(func.count(AssessmentAttempt.id)).where(AssessmentAttempt.assessment_id == Assessment.id)
                .correlate(Assessment).scalar_subquery())
    stmt = (select(Assessment, Programme.title, attempts.label("attempts"))
            .outerjoin(Programme, Programme.id == Assessment.programme_id))
    if (clause := search_clause(q, Assessment.title, Assessment.skill_name)) is not None:
        stmt = stmt.where(clause)
    stmt = stmt.order_by(Assessment.created_at.desc().nulls_last(), Assessment.title, Assessment.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = [{
        "id": str(a.id), "title": a.title, "skill_name": a.skill_name,
        "programme_id": str(a.programme_id) if a.programme_id else None, "programme_title": prog_title,
        "total_questions": a.total_questions, "duration_minutes": a.duration_minutes,
        "passing_score": a.passing_score, "due_date": iso(a.due_date), "attempts": int(count or 0),
    } for a, prog_title, count in rows]
    return page_payload(items, total, page, page_size)


@router.post("/assessments", status_code=201)
async def create_assessment(data: AssessmentCreate, db: AsyncSession = Depends(get_db),
                            actor: User = Depends(require_roles("admin"))):
    if data.programme_id is not None:
        if (await db.execute(select(Programme.id).where(Programme.id == data.programme_id))).first() is None:
            raise HTTPException(status_code=422, detail="Programme not found")
    if data.course_id is not None:
        if (await db.execute(select(Course.id).where(Course.id == data.course_id))).first() is None:
            raise HTTPException(status_code=422, detail="Course not found")
    assessment =Assessment(id=uuid.uuid4(), **data.model_dump())
    db.add(assessment)
    await record_audit(db, actor, "assessment.create", "assessment", assessment.id, {"title": assessment.title})
    await db.commit()
    return {"id": str(assessment.id), "title": assessment.title, "passing_score": assessment.passing_score}


CERT_STATUSES = Literal["valid", "revoked", "expired"]


@router.get("/certifications")
async def list_certifications(
    q: Optional[str] = Query(None, max_length=100),
    status: Optional[CERT_STATUSES] = Query(None),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    now = utcnow()
    revoked = or_(Certificate.revoked_at.isnot(None), Certificate.status == "revoked")
    expired = and_(~revoked, Certificate.expiry_date.isnot(None), Certificate.expiry_date < now)
    stmt = select(Certificate)
    if (clause := search_clause(q, Certificate.holder_name, Certificate.verification_code,
                                Certificate.programme_title)) is not None:
        stmt = stmt.where(clause)
    if status == "revoked":
        stmt = stmt.where(revoked)
    elif status == "expired":
        stmt = stmt.where(expired)
    elif status == "valid":
        stmt = stmt.where(~revoked, ~expired)
    stmt = stmt.order_by(Certificate.issue_date.desc().nulls_last(), Certificate.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = []
    for (cert,) in rows:
        state = "revoked" if (cert.revoked_at or cert.status == "revoked") else (
            "expired" if cert.expiry_date and cert.expiry_date < now else "valid")
        items.append({
            "id": str(cert.id), "verification_code": cert.verification_code, "holder_name": cert.holder_name,
            "programme_title": cert.programme_title, "grade": cert.grade,
            "issue_date": iso(cert.issue_date), "expiry_date": iso(cert.expiry_date), "status": state,
        })
    return page_payload(items, total, page, page_size)


@router.post("/certifications/{certificate_id}/verify")
async def verify_certification(certificate_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                               actor: User = Depends(require_roles("admin"))):
    cert = (await db.execute(select(Certificate).where(Certificate.id == certificate_id))).scalar_one_or_none()
    if cert is None:
        raise HTTPException(status_code=404, detail="Certificate not found")
    try:
        integrity = "ok" if certificate_integrity(cert) else "failed"
    except RuntimeError:
        integrity = "unverified"  # signing secret not configured; report, do not guess
    revoked = cert.revoked_at is not None or cert.status == "revoked"
    await record_audit(db, actor, "certificate.verify", "certificate", cert.id,
                       {"integrity": integrity, "revoked": revoked})
    await db.commit()
    return {"id": str(cert.id), "verification_code": cert.verification_code,
            "status": "revoked" if revoked else "valid", "integrity": integrity}


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

async def _report_enrollment(db: AsyncSession) -> tuple[list, list, dict]:
    months = month_starts(12)
    since = months[0]
    enrol = await monthly_counts(db, Enrollment.enrolled_at, since)
    certs = await monthly_counts(db, Certificate.issue_date, since)
    keys = [m.strftime("%Y-%m") for m in months]
    rows = [[k, enrol.get(k, 0), certs.get(k, 0)] for k in keys]
    chart = {"type": "bar", "labels": keys,
             "series": [{"name": "New enrollments", "values": [r[1] for r in rows]},
                        {"name": "Certifications", "values": [r[2] for r in rows]}]}
    return ["Month", "New enrollments", "Certifications"], rows, chart


async def _report_placements(db: AsyncSession) -> tuple[list, list, dict]:
    months = month_starts(12)
    since = months[0]
    applied = await monthly_counts(db, Application.applied_at, since)
    hired = await monthly_counts(db, Application.applied_at, since, extra=Application.status == "hired")
    keys = [m.strftime("%Y-%m") for m in months]
    rows = [[k, applied.get(k, 0), hired.get(k, 0), percent(hired.get(k, 0), applied.get(k, 0))] for k in keys]
    chart = {"type": "line", "labels": keys,
             "series": [{"name": "Placements", "values": [r[2] for r in rows]},
                        {"name": "Rate %", "values": [r[3] for r in rows]}]}
    return ["Month", "Applications", "Placements", "Rate %"], rows, chart


async def _report_assessments(db: AsyncSession) -> tuple[list, list, dict]:
    attempts = (await db.execute(
        select(AssessmentResult.assessment_id, func.count(AssessmentResult.id),
               func.sum(case((AssessmentResult.passed.is_(True), 1), else_=0)))
        .group_by(AssessmentResult.assessment_id))).all()
    per = {row[0]: (int(row[1]), int(row[2] or 0)) for row in attempts}
    assessments = (await db.execute(
        select(Assessment.id, Assessment.title, Programme.title)
        .outerjoin(Programme, Programme.id == Assessment.programme_id)
        .order_by(Assessment.title).limit(500))).all()
    rows = []
    for aid, title, prog in assessments:
        taken, passed = per.get(aid, (0, 0))
        rows.append([title, prog, taken, passed, percent(passed, taken)])
    chart = {"type": "bar", "labels": [r[0] for r in rows[:10]],
             "series": [{"name": "Pass rate %", "values": [r[4] for r in rows[:10]]}]}
    return ["Assessment", "Programme", "Attempts", "Passed", "Pass rate %"], rows, chart


async def _report_certifications(db: AsyncSession) -> tuple[list, list, dict]:
    months = month_starts(12)
    since = months[0]
    issued = await monthly_counts(db, Certificate.issue_date, since)
    revoked = await monthly_counts(db, Certificate.revoked_at, since)
    keys = [m.strftime("%Y-%m") for m in months]
    rows = [[k, issued.get(k, 0), revoked.get(k, 0)] for k in keys]
    chart = {"type": "bar", "labels": keys,
             "series": [{"name": "Issued", "values": [r[1] for r in rows]},
                        {"name": "Revoked", "values": [r[2] for r in rows]}]}
    return ["Month", "Issued", "Revoked"], rows, chart


REPORT_BUILDERS = {
    "enrollment": _report_enrollment,
    "placements": _report_placements,
    "assessments": _report_assessments,
    "certifications": _report_certifications,
}


@router.get("/reports/{key}")
async def get_report(key: REPORT_KEYS = Path(...), db: AsyncSession = Depends(get_db)):
    columns, rows, chart = await REPORT_BUILDERS[key](db)
    return {"key": key, "columns": columns, "rows": rows, "chart": chart}


def _csv_safe(value: Any) -> Any:
    """Neutralise spreadsheet formula injection in exported text cells."""
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return "" if value is None else value


@router.get("/reports/{key}/export")
async def export_report(key: REPORT_KEYS = Path(...), format: Literal["csv"] = Query("csv"),
                        db: AsyncSession = Depends(get_db)):
    columns, rows, _chart = await REPORT_BUILDERS[key](db)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(columns)
    for row in rows:
        writer.writerow([_csv_safe(cell) for cell in row])
    return Response(content=buffer.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{key}-report.csv"'})


# ---------------------------------------------------------------------------
# Platform settings and audit logs
# ---------------------------------------------------------------------------

async def _load_settings(db: AsyncSession) -> dict:
    stored = {row.key: row.value or {} for row in (await db.execute(select(PlatformSetting))).scalars().all()}
    return {section: {**defaults, **{k: v for k, v in stored.get(section, {}).items() if k in defaults}}
            for section, defaults in SETTINGS_DEFAULTS.items()}


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    return await _load_settings(db)


@router.patch("/settings")
async def patch_settings(data: SettingsPatch, db: AsyncSession = Depends(get_db),
                         actor: User = Depends(require_roles("admin"))):
    changes = data.model_dump(exclude_unset=True)
    current = await _load_settings(db)
    for section, fields in changes.items():
        if not fields:
            continue
        model_cls = SETTINGS_MODELS[section]
        validated = model_cls(**fields).model_dump(exclude_unset=True)
        if "admin_email" in validated and validated["admin_email"] is not None:
            validated["admin_email"] = str(validated["admin_email"])
        merged = {**current[section], **validated}
        row = await db.get(PlatformSetting, section)
        if row is None:
            row = PlatformSetting(key=section, value=merged)
            db.add(row)
        else:
            row.value = merged
        row.updated_by_id = actor.id
        row.updated_at = utcnow()
        current[section] = merged
    await record_audit(db, actor, "settings.update", "settings", None,
                       {"sections": sorted(k for k, v in changes.items() if v)})
    await db.commit()
    return current


@router.get("/audit-logs")
async def list_audit_logs(
    q: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1, le=100000),
    page_size: int = Query(PAGE_SIZE_DEFAULT, ge=1, le=PAGE_SIZE_MAX),
    db: AsyncSession = Depends(get_db),
):
    stmt = (select(AuditLog, User.full_name, User.email)
            .outerjoin(User, User.id == AuditLog.actor_id))
    if (clause := search_clause(q, AuditLog.action, AuditLog.entity, AuditLog.entity_id)) is not None:
        stmt = stmt.where(clause)
    stmt = stmt.order_by(AuditLog.created_at.desc(), AuditLog.id)
    total, rows = await paginate(db, stmt, page, page_size)
    items = [{
        "id": str(log.id), "actor_name": name or email, "action": log.action, "entity": log.entity,
        "entity_id": log.entity_id, "created_at": iso(log.created_at), "meta": log.meta,
    } for log, name, email in rows]
    return page_payload(items, total, page, page_size)
