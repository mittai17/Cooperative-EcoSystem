"""
Mobile demo data: stores everything the mobile app used to hardcode in
apps/mobile/src/services/mockData.ts in the database, attached to the demo
users, and provisions those demo users in Clerk.

ADDITIVE + IDEMPOTENT. Every entity is insert-if-missing by a natural key
(users by email, courses by title, ...). Nothing is deleted or overwritten,
except that the two allowlisted demo users' own row (email demo.*@coopsetu.demo)
may have its clerk_user_id/name/role refreshed. Existing courses/jobs/
programmes are only reused (modules are added to a course only if it has none;
new nullable jobs.openings/posted_at are filled only where NULL). It does NOT
re-run the 600+ trainee web seed (app/seed.py).

Run from backend/:
    python -m app.seed_mobile                # Clerk users + local rows + data
    python -m app.seed_mobile --skip-clerk   # local DB only (no network)
    python -m app.seed_mobile --counts       # print row counts, change nothing
    python -m app.seed_mobile --schema-snapshot .schema-before.txt   # no data
"""
import argparse
import asyncio
import sys
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from urllib.parse import urlparse

from sqlalchemy import select, func, update, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.config import get_settings
from app.demo_users import DEMO_ACCOUNTS, VAMNICOM_ORG_NAME, DemoAccount
from app.models.assessment import Assessment  # noqa: F401  (metadata registration)
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.certificate import Certificate
from app.models.course import Course, CourseEnrollment, Module, ModuleProgress
from app.models.job import Application, Job, JobMatch
from app.models.mobile import (
    CareerPlan, CareerPlanStep, CareerRecommendation, OfflinePackage,
)
from app.models.programme import Batch, Enrollment, Nomination, Programme, ProgrammeCourse
from app.models.skill import Skill, TraineeSkill
from app.models.user import Organisation, User
from app.seed import bulk_sync
from app.services.mobile import IST

DEMO_PROGRAMME_TITLE = "National Cooperative Management & Leadership Diploma"
DEMO_BATCH_NAME = "Diploma Batch 2026-A"

# ---------------------------------------------------------------------------
# Data ported 1:1 from apps/mobile/src/services/mockData.ts
# ---------------------------------------------------------------------------
COURSES = [
    dict(title="Cooperative Management Fundamentals", category="Management", level="Foundation", duration_hours=40,
         instructor="Dr. Ramesh Kulkarni", rating=4.8, enrolled_count=1240,
         skills=["Cooperative Management", "Cooperative Governance"],
         description="Core cooperative principles, governance, and management.", progress=75, last_days=1,
         modules=[
             ("1. Introduction to Cooperative Principles & Values", 18, True, "Seven Rochdale principles and legal framework under MSCS Act."),
             ("2. Democratic Governance & Member Elections", 24, True, "General body meetings, board composition, and voter audit trails."),
             ("3. Financial Accounting in Cooperatives", 32, True, "P&L, balance sheets, statutory reserve funds, and dividend distribution."),
             ("4. Cooperative Byelaws & Regulatory Compliance", 22, False, "Statutory returns, ROC/RCS inspections, and audit compliance checklist."),
             ("5. Modernization & Digitization Roadmap", 30, False, "ERP integration, mobile banking for PACS, and traceability systems."),
         ]),
    dict(title="Data Analytics for Cooperatives", category="Technology", level="Intermediate", duration_hours=48,
         instructor="Prof. Sunita Agarwal", rating=4.6, enrolled_count=640,
         skills=["Data Analysis", "Digital Tools"],
         description="Applied analytics for cooperative decision-making.", progress=20, last_days=3,
         modules=[
             ("1. Fundamentals of Member Data & Ledger Analysis", 25, True, "Cleaning transaction logs and tracking member shareholdings."),
             ("2. Inventory & Procurement Forecasting", 35, False, "Predicting seasonal milk and agri procurement using trends."),
         ]),
    dict(title="Rural Development Fundamentals", category="Rural", level="Foundation", duration_hours=32,
         instructor="Dr. Mohan Rao", rating=4.7, enrolled_count=820,
         skills=["Rural Development"],
         description="Fundamentals of rural development in the cooperative sector.", progress=None, last_days=None,
         modules=[
             ("1. Socio-Economic Framework of Rural Cooperatives", 20, False, "Community needs assessment and SHG-Cooperative linkages."),
         ]),
    dict(title="Dairy Cooperative Operations", category="Dairy", level="Intermediate", duration_hours=60,
         instructor="Er. Vijay Patil", rating=4.9, enrolled_count=980,
         skills=["Dairy Operations", "Quality Assurance"],
         description="Dairy procurement, chilling, and cooperative operations.", progress=100, last_days=60,
         modules=[
             ("1. Cold Chain Logistics & Chilling Plants", 40, True, "Bulk milk cooling units, temperature sensing, and logistics dispatch."),
         ]),
]

JOBS = [
    dict(title="Dairy Procurement Supervisor", employer_name="Amul Dairy Cooperative Union", location="Anand, Gujarat",
         sector="Dairy", job_type="Full-time", salary_range="₹4,50,000 - ₹6,00,000",
         skills_required=["Dairy Operations", "Communication", "Leadership"], openings=5, days_ago=3,
         match=92, application="shortlisted",
         description="Lead milk chilling center operations and farmer producer group coordination."),
    dict(title="Cooperative Development Officer", employer_name="National Cooperative Development Corporation (NCDC)",
         location="New Delhi", sector="Cooperative Management", job_type="Full-time", salary_range="₹5,50,000 - ₹7,00,000",
         skills_required=["Cooperative Management", "Rural Development", "Data Analysis", "Communication"], openings=3,
         days_ago=7, match=85, application="applied",
         description="Drive cooperative society development programmes nationally."),
    dict(title="Credit Officer - Cooperative Bank", employer_name="Maharashtra State Cooperative Bank",
         location="Pune, Maharashtra", sector="Banking", job_type="Full-time", salary_range="₹3,80,000 - ₹5,20,000",
         skills_required=["Credit Appraisal", "Financial Management", "Data Analysis"], openings=8, days_ago=2,
         match=78, application=None,
         description="Appraise credit proposals and support cooperative bank branch operations."),
    dict(title="Agri-Marketing Specialist", employer_name="Rajasthan Cooperative Marketing Federation",
         location="Jaipur, Rajasthan", sector="Agriculture", job_type="Full-time", salary_range="₹3,50,000 - ₹4,80,000",
         skills_required=["Digital Marketing", "Communication", "Rural Development"], openings=4, days_ago=10,
         match=64, application=None,
         description="Market cooperative agri produce and build buyer linkages."),
]

PASSPORT = [
    ("Cooperative Management", "Management", "Proficient", 92, True, [
        ("Course", "Cooperative Management Fundamentals", "2026-08-15"),
        ("Institutional Assessment", "VAMNICOM Leadership Certification", "2026-09-02")]),
    ("Communication & Facilitation", "Soft Skills", "Proficient", 85, True, [
        ("Assessment", "Community Facilitation Skills Test", "2026-08-20")]),
    ("Cooperative Governance", "Management", "Intermediate", 78, True, [
        ("Assessment", "Governance & Byelaws Test", "2026-09-10")]),
    ("Rural Development", "Domain", "Foundational", 60, False, [
        ("Course", "Rural Development Basics", "2026-09-01")]),
    ("Data Analysis", "Technical", "Foundational", 45, False, []),
]

CERTIFICATES = [
    dict(code="CST-2026-DAI-00842", programme_title="Dairy Cooperative Operations",
         issuer="Institute of Rural Management, Anand (IRMA)", issue=(2026, 7, 15), expiry=(2029, 7, 15), grade="A",
         skills=["Dairy Operations", "Cooperative Management", "Quality Assurance"], link_programme="Dairy Cooperative Operations"),
    dict(code="CST-2026-MGT-00192", programme_title="Cooperative Governance & Legal Framework",
         issuer="National Council for Cooperative Training (NCCT)", issue=(2026, 8, 28), expiry=None, grade="A+",
         skills=["Cooperative Governance", "Statutory Compliance"], link_programme="Cooperative Governance & Audit Certification"),
]

# (date, time IST, session name, status, method key)
ATTENDANCE = [
    ((2026, 9, 25), (9, 42), "Cooperative Management Fundamentals - Batch B", "present", "qr"),
    ((2026, 9, 24), (9, 38), "Financial Accounting in PACS - Workshop", "present", "qr"),
    ((2026, 9, 23), (10, 5), "Data Analytics for Cooperatives - Lab", "present", "biometric_qr"),
    ((2026, 9, 22), (10, 25), "Rural Banking & Credit Supervision", "late", "manual"),
]

CAREER_TARGET_ROLE = "Cooperative Development Officer"
CAREER_MATCH = 72
CAREER_RECS = [
    (1, "course", "Data Analytics for Cooperatives", "Fills biggest skill gap (Data Analysis missing for CDO role)", "6 weeks", "+15% match"),
    (2, "course", "Rural Development Fundamentals", "Required for CDO role at Intermediate level", "4 weeks", "+8% match"),
    (3, "assessment", "Cooperative Governance Assessment", "Verify your governance knowledge for cooperative employers", "2 hours", "+5% match"),
]
CAREER_STEPS = [
    (1, "Current: Diploma Trainee", "current", "Enrolled"),
    (2, "Junior Cooperative Officer", "next", "3-6 months"),
    (3, "Cooperative Development Officer (CDO)", "future", "12-18 months"),
    (4, "Senior CDO / Regional Programme Manager", "future", "3-5 years"),
]


def _ist(y, mo, d, h=12, mi=0) -> datetime:
    return datetime(y, mo, d, h, mi, tzinfo=IST).astimezone(timezone.utc)


async def _sync(db: AsyncSession, model, key, rows, stats: Dict[str, int], label: str) -> dict:
    """bulk_sync + count of newly inserted rows (bulk_sync stamps `id` only on inserts)."""
    ids = await bulk_sync(db, model, key, rows)
    stats[label] = stats.get(label, 0) + sum(1 for r in rows if "id" in r)
    return ids


# ---------------------------------------------------------------------------
# Clerk
# ---------------------------------------------------------------------------
async def provision_clerk_users() -> Dict[str, str]:
    """Create (or find) the demo users in the project's Clerk instance.
    Idempotent: looked up by external_id, then email. No password is set.
    Returns {role: clerk_user_id}."""
    from app.services import clerk as clerk_service

    out: Dict[str, str] = {}
    for role, acct in DEMO_ACCOUNTS.items():
        meta = {"role": acct.role, "demo": True}
        cu = await clerk_service.find_clerk_user(email=acct.email, external_id=acct.external_id)
        if cu is None:
            cu = await clerk_service.create_clerk_user(
                email=acct.email, first_name=acct.first_name, last_name=acct.last_name,
                external_id=acct.external_id, public_metadata=meta,
            )
            print(f"  clerk: created demo {role} user")
        else:
            current = cu.get("public_metadata") or {}
            if current.get("role") != acct.role or current.get("demo") is not True:
                await clerk_service.update_clerk_user_metadata(cu["id"], meta)
                print(f"  clerk: refreshed metadata of demo {role} user")
            else:
                print(f"  clerk: demo {role} user already present")
        if acct.clerk_org_id:
            try:
                await clerk_service.add_user_to_organization(cu["id"], acct.clerk_org_id)
            except Exception as e:
                print(f"  clerk: attach {role} to org note: {e}")
        out[role] = cu["id"]
    return out


# ---------------------------------------------------------------------------
# Local users
# ---------------------------------------------------------------------------
async def _upsert_demo_user(db: AsyncSession, acct: DemoAccount, clerk_id: Optional[str], org_id, stats) -> User:
    user = (await db.execute(select(User).where(User.email == acct.email))).scalar_one_or_none()
    if user is None and clerk_id:
        user = (await db.execute(select(User).where(User.clerk_user_id == clerk_id))).scalar_one_or_none()
    if user is None:
        user = User(
            id=uuid.uuid4(), clerk_user_id=clerk_id or f"demo_local_{acct.role}", email=acct.email,
            full_name=acct.full_name, role=acct.role, organisation_id=org_id,
        )
        db.add(user)
        stats["users"] = stats.get("users", 0) + 1
    else:
        # Only ever touches the allowlisted demo rows themselves.
        if clerk_id:
            user.clerk_user_id = clerk_id
        user.email = acct.email
        user.full_name = acct.full_name
        user.role = acct.role
        user.organisation_id = org_id
        user.is_active = True
    await db.flush()
    return user


# ---------------------------------------------------------------------------
# Main data seed
# ---------------------------------------------------------------------------
async def seed_mobile_data(db: AsyncSession, clerk_ids: Optional[Dict[str, str]] = None) -> Dict[str, int]:
    """Insert-if-missing all mobile demo entities. Returns {label: rows inserted}."""
    clerk_ids = clerk_ids or {}
    stats: Dict[str, int] = {}
    now = datetime.now(timezone.utc)

    # organisation
    org = (await db.execute(select(Organisation).where(Organisation.name == VAMNICOM_ORG_NAME))).scalar_one_or_none()
    if org is None:
        org = Organisation(id=uuid.uuid4(), name=VAMNICOM_ORG_NAME, type="institution", state="Maharashtra")
        db.add(org)
        await db.flush()
        stats["organisations"] = 1

    org_amul = (await db.execute(select(Organisation).where(Organisation.name == "Amul Dairy Cooperative Union"))).scalar_one_or_none()
    if org_amul is None:
        org_amul = Organisation(id=uuid.uuid4(), name="Amul Dairy Cooperative Union", type="employer", state="Gujarat")
        db.add(org_amul)
        await db.flush()

    org_ncct = (await db.execute(select(Organisation).where(Organisation.name == "NCCT - National Council for Cooperative Training"))).scalar_one_or_none()
    if org_ncct is None:
        org_ncct = Organisation(id=uuid.uuid4(), name="NCCT - National Council for Cooperative Training", type="ncct", state="Delhi")
        db.add(org_ncct)
        await db.flush()

    role_to_org = {
        "trainee": org.id,
        "trainer": org.id,
        "institution": org.id,
        "employer": org_amul.id,
        "admin": org_ncct.id,
    }

    trainee = None
    for r, acct in DEMO_ACCOUNTS.items():
        u = await _upsert_demo_user(db, acct, clerk_ids.get(r), role_to_org.get(r, org.id), stats)
        if r == "trainee":
            trainee = u

    # skills taxonomy
    skill_rows = [dict(name=n, category=cat) for n, cat, *_ in PASSPORT]
    skill_ids = await _sync(db, Skill, "name", skill_rows, stats, "skills")

    # courses (existing ones are reused untouched)
    course_rows = [{k: v for k, v in c.items() if k not in ("progress", "last_days", "modules")} for c in COURSES]
    course_ids = await _sync(db, Course, "title", course_rows, stats, "courses")

    # modules: only for courses that have none yet
    module_ids: Dict[tuple, uuid.UUID] = {}  # (course title, position) -> module id
    for c in COURSES:
        cid = course_ids[c["title"]]
        existing = (
            await db.execute(select(Module).where(Module.course_id == cid).order_by(Module.position.asc().nulls_last(), Module.title))
        ).scalars().all()
        if not existing:
            rows = [
                dict(course_id=cid, title=t, position=i + 1, duration_minutes=mins, summary=summary)
                for i, (t, mins, _done, summary) in enumerate(c["modules"])
            ]
            ids = await _sync(db, Module, ("course_id", "title"), rows, stats, "modules")
            for i, (t, *_rest) in enumerate(c["modules"]):
                module_ids[(c["title"], i + 1)] = ids[(cid, t)]
        else:
            # A course that already had modules: map by matching title, else by order.
            by_title = {m.title: m.id for m in existing}
            for i, (t, *_rest) in enumerate(c["modules"]):
                mid = by_title.get(t) or (existing[i].id if i < len(existing) else None)
                if mid:
                    module_ids[(c["title"], i + 1)] = mid

    # programme, batch, nomination, enrolment, curriculum
    prog_ids = await _sync(
        db, Programme, "title",
        [dict(title=DEMO_PROGRAMME_TITLE, sector="Cooperative Management", level="Diploma", mode="Blended",
              duration_weeks=52, seats_total=60, seats_filled=1, organisation_id=org.id, start_date=_ist(2026, 7, 1),
              description="Flagship diploma in cooperative management, governance and leadership.")],
        stats, "programmes",
    )
    prog_id = prog_ids[DEMO_PROGRAMME_TITLE]
    batch_ids = await _sync(
        db, Batch, ("programme_id", "name"),
        [dict(programme_id=prog_id, name=DEMO_BATCH_NAME, start_date=_ist(2026, 7, 1), capacity=60)], stats, "batches",
    )
    await _sync(db, Nomination, ("trainee_id", "programme_id"),
                [dict(trainee_id=trainee.id, programme_id=prog_id, status="approved",
                      submitted_at=_ist(2026, 6, 10), reviewed_at=_ist(2026, 6, 20))], stats, "nominations")
    await _sync(db, Enrollment, ("trainee_id", "batch_id"),
                [dict(trainee_id=trainee.id, batch_id=batch_ids[(prog_id, DEMO_BATCH_NAME)], status="active",
                      enrolled_at=_ist(2026, 7, 1))], stats, "enrollments")
    await _sync(db, ProgrammeCourse, ("programme_id", "course_id"),
                [dict(programme_id=prog_id, course_id=course_ids[c["title"]], sequence_order=i + 1, is_mandatory=True)
                 for i, c in enumerate(COURSES)], stats, "programme_courses")

    # per-trainee course progress
    enroll_rows = [
        dict(trainee_id=trainee.id, course_id=course_ids[c["title"]], progress=c["progress"],
             status="completed" if c["progress"] >= 100 else "active",
             enrolled_at=now - timedelta(days=(c["last_days"] or 0) + 30),
             last_accessed=now - timedelta(days=c["last_days"]))
        for c in COURSES if c["progress"] is not None
    ]
    await _sync(db, CourseEnrollment, ("trainee_id", "course_id"), enroll_rows, stats, "course_enrollments")
    done_rows = []
    for c in COURSES:
        for i, (_t, _m, done, _s) in enumerate(c["modules"]):
            mid = module_ids.get((c["title"], i + 1))
            if done and mid:
                done_rows.append(dict(trainee_id=trainee.id, module_id=mid, completed_at=now - timedelta(days=5 + i)))
    await _sync(db, ModuleProgress, ("trainee_id", "module_id"), done_rows, stats, "module_progress")

    # skill passport
    ts_rows = [
        dict(trainee_id=trainee.id, skill_id=skill_ids[name], level=level, confidence=conf, verified=verified,
             evidence=[dict(type=t, title=title, date=d) for t, title, d in ev])
        for name, _cat, level, conf, verified, ev in PASSPORT
    ]
    await _sync(db, TraineeSkill, ("trainee_id", "skill_id"), ts_rows, stats, "trainee_skills")

    # certificates (programme FK only when a matching programme already exists)
    titles = {c["link_programme"] for c in CERTIFICATES}
    existing_progs = dict((await db.execute(select(Programme.title, Programme.id).where(Programme.title.in_(titles)))).all())
    cert_rows = [
        dict(trainee_id=trainee.id, programme_id=existing_progs.get(c["link_programme"]), verification_code=c["code"],
             issue_date=_ist(*c["issue"]), expiry_date=_ist(*c["expiry"]) if c["expiry"] else None, status="valid",
             grade=c["grade"], holder_name=DEMO_ACCOUNTS["trainee"].full_name, programme_title=c["programme_title"],
             issuer=c["issuer"], skills_certified=c["skills"])
        for c in CERTIFICATES
    ]
    await _sync(db, Certificate, "verification_code", cert_rows, stats, "certificates")
    # The two fixed demo certificate codes belong to the demo trainee (heals a
    # re-created demo user); nothing else is touched.
    await db.execute(
        update(Certificate)
        .where(Certificate.verification_code.in_([c["code"] for c in CERTIFICATES]), Certificate.trainee_id != trainee.id)
        .values(trainee_id=trainee.id)
    )

    # attendance: one session (+ the trainee's record) per mock row
    session_rows, record_meta = [], []
    for (y, mo, d), (h, mi), name, status, method in ATTENDANCE:
        session_rows.append(dict(session_name=name, programme_id=prog_id, qr_token=f"demo-session-{y}{mo:02d}{d:02d}",
                                 valid_minutes=30, created_at=_ist(y, mo, d, 9, 0)))
        record_meta.append((name, _ist(y, mo, d, h, mi), status, method))
    session_ids = await _sync(db, AttendanceSession, ("programme_id", "session_name"), session_rows, stats, "attendance_sessions")
    await _sync(db, AttendanceRecord, ("session_id", "trainee_id"),
                [dict(session_id=session_ids[(prog_id, name)], trainee_id=trainee.id, marked_at=at, status=status, method=method)
                 for name, at, status, method in record_meta], stats, "attendance_records")

    # jobs, stored matches, applications
    job_ids = await _sync(
        db, Job, ("title", "employer_name"),
        [{k: v for k, v in j.items() if k not in ("openings", "days_ago", "match", "application")}
         | dict(openings=j["openings"], posted_at=now - timedelta(days=j["days_ago"])) for j in JOBS],
        stats, "jobs",
    )
    for j in JOBS:  # fill the new nullable columns on pre-existing rows only where NULL
        jid = job_ids[(j["title"], j["employer_name"])]
        await db.execute(update(Job).where(Job.id == jid, Job.openings.is_(None)).values(openings=j["openings"]))
        await db.execute(update(Job).where(Job.id == jid, Job.posted_at.is_(None)).values(posted_at=now - timedelta(days=j["days_ago"])))
    passport_names = {p[0] for p in PASSPORT}
    match_rows = []
    for j in JOBS:
        req = j["skills_required"]
        hit = [s for s in req if any(s.lower() in n.lower() or n.lower() in s.lower() for n in passport_names)]
        match_rows.append(dict(
            job_id=job_ids[(j["title"], j["employer_name"])], trainee_id=trainee.id, match_score=j["match"],
            matched_skills=hit, missing_skills=[s for s in req if s not in hit],
            explanation=f"{j['match']}% fit from the trainee's Skill Passport against this role's required skills.",
        ))
    await _sync(db, JobMatch, ("trainee_id", "job_id"), match_rows, stats, "job_matches")
    await _sync(db, Application, ("job_id", "applicant_id"),
                [dict(job_id=job_ids[(j["title"], j["employer_name"])], applicant_id=trainee.id, status=j["application"],
                      applied_at=now - timedelta(days=j["days_ago"] - 1))
                 for j in JOBS if j["application"]], stats, "applications")

    # career plan
    plan_ids = await _sync(db, CareerPlan, "trainee_id",
                           [dict(trainee_id=trainee.id, target_role=CAREER_TARGET_ROLE, current_match=CAREER_MATCH)],
                           stats, "career_plans")
    plan_id = plan_ids[trainee.id]
    await _sync(db, CareerPlanStep, ("plan_id", "step"),
                [dict(plan_id=plan_id, step=s, title=t, status=st, timeline=tl) for s, t, st, tl in CAREER_STEPS],
                stats, "career_plan_steps")
    await _sync(db, CareerRecommendation, ("plan_id", "priority"),
                [dict(plan_id=plan_id, priority=p, type=ty, title=t, reason=r, duration=d, impact=i)
                 for p, ty, t, r, d, i in CAREER_RECS], stats, "career_recommendations")

    # offline packages (descriptor only; content is the course's modules)
    await _sync(db, OfflinePackage, "course_id",
                [dict(course_id=course_ids[c["title"]], version=1, size_kb=len(c["modules"]) * 1800) for c in COURSES],
                stats, "offline_packages")

    await db.commit()
    return stats


# ---------------------------------------------------------------------------
# Row counts / schema snapshot (rollback documentation) - never prints data
# ---------------------------------------------------------------------------
COUNT_TABLES = ["users", "courses", "programmes", "course_enrollments", "enrollments", "attendance_records",
                "attendance_sessions", "jobs", "applications", "certificates", "trainee_skills", "modules"]


async def table_counts(db: AsyncSession) -> Dict[str, Optional[int]]:
    out: Dict[str, Optional[int]] = {}
    for t in COUNT_TABLES + ["module_progress", "career_plans", "career_recommendations", "career_chat_messages",
                             "offline_packages", "offline_downloads", "job_matches"]:
        try:
            out[t] = (await db.execute(text(f"select count(*) from {t}"))).scalar()
        except Exception:
            await db.rollback()
            out[t] = None
    return out


async def schema_snapshot(db: AsyncSession) -> str:
    ver = (await db.execute(text("select version_num from alembic_version"))).scalars().all()
    tables = (await db.execute(text(
        "select table_name from information_schema.tables where table_schema='public' order by 1"))).scalars().all()
    lines = [f"alembic_version: {', '.join(ver)}", f"tables ({len(tables)}):"] + [f"  {t}" for t in tables]
    return "\n".join(lines) + "\n"


def _session_factory():
    settings = get_settings()
    url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://").replace("?sslmode=require", "")
    engine = create_async_engine(url, poolclass=NullPool)
    return engine, sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def _db_label() -> str:
    """Host prefix only (never the URL, user or password)."""
    return (urlparse(get_settings().database_url).hostname or "?").split(".")[0]


async def _main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--skip-clerk", action="store_true", help="do not call Clerk; local DB only")
    ap.add_argument("--counts", action="store_true", help="print row counts and exit")
    ap.add_argument("--schema-snapshot", metavar="PATH", help="write alembic version + table list (no data) and exit")
    args = ap.parse_args(argv)

    engine, Session = _session_factory()
    print(f"database endpoint: {_db_label()}")
    try:
        async with Session() as db:
            if args.schema_snapshot:
                with open(args.schema_snapshot, "w") as fh:
                    fh.write(await schema_snapshot(db))
                print(f"schema snapshot written to {args.schema_snapshot}")
                return 0
            if args.counts:
                for k, v in (await table_counts(db)).items():
                    print(f"  {k}: {v}")
                return 0
            clerk_ids = {} if args.skip_clerk else await provision_clerk_users()
            stats = await seed_mobile_data(db, clerk_ids)
            print("inserted this run (0 everywhere on a re-run):")
            for k, v in stats.items():
                print(f"  {k}: {v}")
    finally:
        await engine.dispose()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
