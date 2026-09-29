"""Counts computed from current database rows; no illustrative national numbers."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import assert_org_access, require_roles
from app.models.analytics import SkillDemand
from app.models.assessment import AssessmentResult
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.certificate import Certificate
from app.models.job import Application, Job
from app.models.programme import Batch, Enrollment, Programme
from app.models.user import Organisation, User

router = APIRouter()
SMALL_CELL = 5
HIRED = ('offered', 'hired')


async def count(db, statement):
    return (await db.execute(statement)).scalar_one() or 0


def rate(numerator, denominator):
    return round(min(100.0, 100.0 * numerator / denominator), 1) if denominator else 0.0


def public_cell(value):
    return value if value >= SMALL_CELL else None


@router.get('/skill-demand')
async def skill_demand_analytics(user=Depends(require_roles('admin', 'ncct_admin')),
                                  db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(SkillDemand).order_by(SkillDemand.employer_demand_count.desc()))).scalars().all()
    return {'skill_demand': [
        {'skill': row.skill_name, 'demand': row.employer_demand_count or 0,
         'supply': row.trained_count or 0, 'gap': row.gap_count or 0,
         'trend': 'rising' if (row.gap_count or 0) > .3 * (row.employer_demand_count or 1) else 'stable'}
        for row in rows],
        'total_employer_demand': sum(row.employer_demand_count or 0 for row in rows),
        'total_trained': sum(row.trained_count or 0 for row in rows),
        'emerging_skills': [row.skill_name for row in sorted(rows, key=lambda r: r.gap_count or 0, reverse=True)[:3]],
    }


@router.get('/employment-funnel')
async def employment_funnel(user=Depends(require_roles('admin', 'ncct_admin')),
                            db: AsyncSession = Depends(get_db)):
    trainee_count = await count(db, select(func.count()).select_from(User).where(User.role == 'trainee'))
    certified = await count(db, select(func.count(distinct(Certificate.trainee_id))))
    applicants = await count(db, select(func.count(distinct(Application.applicant_id))))
    employed = await count(db, select(func.count(distinct(Application.applicant_id))).where(Application.status.in_(HIRED)))
    return {'funnel': [
        {'stage': 'Registered', 'count': trainee_count},
        {'stage': 'Certified', 'count': certified},
        {'stage': 'Applied to a Job', 'count': applicants},
        {'stage': 'Employed', 'count': employed}],
        'employment_rate': rate(employed, trainee_count)}


@router.get('/institution/{org_id}')
async def institution_analytics(org_id: UUID, user=Depends(require_roles('institution', 'admin', 'ncct_admin')),
                                db: AsyncSession = Depends(get_db)):
    assert_org_access(user, org_id)
    org = (await db.execute(select(Organisation).where(Organisation.id == org_id))).scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail='Organisation not found')
    prog_ids = select(Programme.id).where(Programme.organisation_id == org_id)
    batch_ids = select(Batch.id).where(Batch.programme_id.in_(prog_ids))
    trainees = await count(db, select(func.count(distinct(Enrollment.trainee_id))).where(Enrollment.batch_id.in_(batch_ids)))
    programmes = await count(db, select(func.count()).select_from(Programme).where(
        Programme.organisation_id == org_id, Programme.is_active.is_(True)))
    certificates = await count(db, select(func.count()).select_from(Certificate).where(Certificate.programme_id.in_(prog_ids)))
    sessions = await count(db, select(func.count()).select_from(AttendanceSession).where(AttendanceSession.programme_id.in_(prog_ids)))
    present = await count(db, select(func.count()).select_from(AttendanceRecord).where(
        AttendanceRecord.session_id.in_(select(AttendanceSession.id).where(AttendanceSession.programme_id.in_(prog_ids))),
        AttendanceRecord.status.in_(('present', 'late'))))
    avg_score = (await db.execute(select(func.avg(AssessmentResult.score)).where(
        AssessmentResult.trainee_id.in_(select(Enrollment.trainee_id).where(Enrollment.batch_id.in_(batch_ids)))))).scalar_one()
    hired = await count(db, select(func.count(distinct(Application.applicant_id))).where(
        Application.applicant_id.in_(select(Enrollment.trainee_id).where(Enrollment.batch_id.in_(batch_ids))),
        Application.status.in_(HIRED)))
    return {'org_id': str(org_id), 'org_name': org.name, 'trainees_total': public_cell(trainees),
            'completion_rate': None, 'avg_assessment_score': round(float(avg_score), 1) if trainees >= SMALL_CELL and avg_score else None,
            'employment_rate': rate(hired, trainees) if trainees >= SMALL_CELL else None,
            'attendance_rate': rate(present, sessions * trainees) if trainees >= SMALL_CELL else None,
            'active_programmes': programmes, 'certificates_issued': public_cell(certificates)}


@router.get('/overview')
async def platform_overview(user=Depends(require_roles('admin', 'ncct_admin')),
                            db: AsyncSession = Depends(get_db)):
    institutions = await count(db, select(func.count()).select_from(Organisation).where(Organisation.type == 'institution'))
    trainees = await count(db, select(func.count()).select_from(User).where(User.role == 'trainee'))
    trainers = await count(db, select(func.count()).select_from(User).where(User.role == 'trainer'))
    certs = await count(db, select(func.count()).select_from(Certificate))
    hired = await count(db, select(func.count(distinct(Application.applicant_id))).where(Application.status.in_(HIRED)))
    gap = await count(db, select(func.sum(SkillDemand.gap_count)))
    return {'institutions': institutions, 'trainees': trainees, 'trainers': trainers,
            'certificates': certs, 'employment_rate': rate(hired, trainees), 'skill_demand_gap': gap}
