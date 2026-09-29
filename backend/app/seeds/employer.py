"""Backfill ownership for the Amul employer demo listing on a scratch database.

The domain seed is idempotent and only updates the known demo listing when it
has no owner. Other listings remain unowned until their real organisation is
known; an employer must never inherit those listings by name matching.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job
from app.models.user import Organisation, User
from app.seeds import register


async def seed(db: AsyncSession) -> None:
    org = (await db.execute(select(Organisation).where(
        Organisation.name == "Amul Dairy Cooperative Union", Organisation.type == "employer"))).scalar_one_or_none()
    if org is None:
        return
    owner = (await db.execute(select(User).where(User.organisation_id == org.id, User.role == "employer")
                              .order_by(User.created_at))).scalars().first()
    jobs = (await db.execute(select(Job).where(
        Job.title == "Dairy Procurement Supervisor",
        Job.employer_name == org.name, Job.organisation_id.is_(None)))).scalars().all()
    for job in jobs:
        job.organisation_id = org.id
        job.created_by_id = owner.id if owner else None
        job.status = "open"
        job.source = "employer"
    await db.flush()


register("employer", seed)
