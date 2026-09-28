import uuid
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.hostel import HostelBlock, HostelRoom, HostelWaitlistEntry
from app.schemas.hostel import AllocateRequest

router = APIRouter()

# Default allocation horizon applied when a waitlisted trainee moves in.
DEFAULT_STAY_DAYS = 90

# DB stores lowercase status values (consistent with the rest of this
# codebase's status columns); the frontend expects title-cased labels.
STATUS_DISPLAY = {"occupied": "Occupied", "vacant": "Vacant", "maintenance": "Maintenance"}


def _room_dict(r: HostelRoom) -> dict:
    return {
        "id": str(r.id),
        "code": r.code,
        "blockId": str(r.block_id),
        "floor": r.floor,
        "capacity": r.capacity,
        "status": STATUS_DISPLAY.get(r.status, r.status),
        "occupant": r.occupant_name,
        "occupantProgramme": r.occupant_programme,
        "checkIn": r.check_in.isoformat() if r.check_in else None,
        "checkOut": r.check_out.isoformat() if r.check_out else None,
        "note": r.note,
    }


def _block_dict(b: HostelBlock) -> dict:
    return {
        "id": str(b.id),
        "name": b.name,
        "kind": b.kind,
        "floors": b.floors or [],
    }


def _waitlist_dict(w: HostelWaitlistEntry) -> dict:
    days_waiting = (date.today() - w.applied_on).days if w.applied_on else 0
    return {
        "id": str(w.id),
        "name": w.name,
        "programme": w.programme,
        "appliedOn": w.applied_on.isoformat() if w.applied_on else None,
        "daysWaiting": max(days_waiting, 0),
        "preference": w.preference,
    }


async def _get_room(db: AsyncSession, room_id: str) -> HostelRoom:
    try:
        rid = uuid.UUID(room_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Room not found")
    result = await db.execute(select(HostelRoom).where(HostelRoom.id == rid))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.get("/")
async def get_hostel(db: AsyncSession = Depends(get_db)):
    blocks_result = await db.execute(select(HostelBlock).order_by(HostelBlock.code))
    blocks = blocks_result.scalars().all()

    rooms_result = await db.execute(select(HostelRoom).order_by(HostelRoom.code))
    rooms = rooms_result.scalars().all()

    waitlist_result = await db.execute(
        select(HostelWaitlistEntry).order_by(HostelWaitlistEntry.applied_on)
    )
    waitlist = waitlist_result.scalars().all()

    return {
        "blocks": [_block_dict(b) for b in blocks],
        "rooms": [_room_dict(r) for r in rooms],
        "waitlist": [_waitlist_dict(w) for w in waitlist],
    }


@router.post("/rooms/{room_id}/check-out")
async def check_out_room(room_id: str, db: AsyncSession = Depends(get_db)):
    room = await _get_room(db, room_id)
    if room.status != "occupied":
        raise HTTPException(status_code=409, detail="Room is not occupied")

    room.status = "vacant"
    room.occupant_trainee_id = None
    room.occupant_name = None
    room.occupant_programme = None
    room.check_in = None
    room.check_out = None
    room.note = None
    room.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(room)
    return _room_dict(room)


@router.post("/rooms/{room_id}/maintenance")
async def mark_maintenance(room_id: str, db: AsyncSession = Depends(get_db)):
    room = await _get_room(db, room_id)

    if room.occupant_name:
        block_result = await db.execute(select(HostelBlock).where(HostelBlock.id == room.block_id))
        block = block_result.scalar_one_or_none()
        entry = HostelWaitlistEntry(
            id=uuid.uuid4(),
            organisation_id=block.organisation_id if block else None,
            trainee_id=room.occupant_trainee_id,
            name=room.occupant_name,
            programme=room.occupant_programme or "Programme on record",
            applied_on=date.today(),
            preference=f"Re-housed after maintenance in {room.code}",
        )
        db.add(entry)

    room.status = "maintenance"
    room.occupant_trainee_id = None
    room.occupant_name = None
    room.occupant_programme = None
    room.check_in = None
    room.check_out = None
    if not room.note:
        room.note = "Marked by warden — inspection pending"
    room.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(room)
    return _room_dict(room)


@router.post("/rooms/{room_id}/return-to-service")
async def return_to_service(room_id: str, db: AsyncSession = Depends(get_db)):
    room = await _get_room(db, room_id)
    room.status = "vacant"
    room.note = None
    room.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(room)
    return _room_dict(room)


@router.post("/allocate")
async def allocate_room(data: AllocateRequest, db: AsyncSession = Depends(get_db)):
    room = await _get_room(db, data.room_id)
    if room.status != "vacant":
        raise HTTPException(status_code=409, detail="Room is not vacant")

    try:
        wid = uuid.UUID(data.waitlist_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    result = await db.execute(select(HostelWaitlistEntry).where(HostelWaitlistEntry.id == wid))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    room.status = "occupied"
    room.occupant_trainee_id = entry.trainee_id
    room.occupant_name = entry.name
    room.occupant_programme = entry.programme
    room.check_in = date.today()
    room.check_out = date.today() + timedelta(days=DEFAULT_STAY_DAYS)
    room.note = None
    room.updated_at = datetime.now(timezone.utc)

    await db.delete(entry)
    await db.commit()
    await db.refresh(room)
    return _room_dict(room)
