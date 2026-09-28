from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.timetable import TimetableSlot

router = APIRouter()


@router.get("/")
async def list_timetable(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TimetableSlot).order_by(TimetableSlot.day_of_week, TimetableSlot.time_slot)
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
