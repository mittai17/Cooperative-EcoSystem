from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.deps import require_roles, org_scope
from app.models.user import User
from app.models.timetable import TimetableSlot

router = APIRouter()


@router.get("/")
async def list_timetable(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("institution", "admin", "ncct_admin"))):
    scope = org_scope(user)
    query = select(TimetableSlot)
    if scope is not None:
        query = query.where(TimetableSlot.organisation_id == scope)
    result = await db.execute(
        query.order_by(TimetableSlot.day_of_week, TimetableSlot.time_slot)
    )
    slots = result.scalars().all()
    return [
        {
            "id": str(s.id),
            "day": s.day_of_week,
            "time": s.time_slot,
            "title": s.title,
            "room": s.room,
            "trainer": s.trainer_name,
        }
        for s in slots
    ]
