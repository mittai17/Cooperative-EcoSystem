"""Trainer attendance endpoints (included under /api/v1/trainer).

Sessions reuse the existing rotating-QR scheme from app.api.v1.attendance
(`coopsetu:attend:<session>.<window>.<hmac>`), so trainees scanning through the
existing /attendance/scan endpoint keep working. Everything is scoped through
`trainer_metrics.trainer_classes` / `timetable_slots.trainer_id`.
"""
import secrets
import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.attendance import QR_WINDOW_SECONDS, rotating_token
from app.api.v1.trainer import (
    _cancelled, _hhmm, _label, _occurrences, _slots_for_trainer, current_trainer,
)
from app.database import get_db
from app.models import (
    AttendanceRecord, AttendanceSession, Batch, Course, Enrollment, TimetableSlot, User,
)
from app.services import trainer_metrics as tm

router = APIRouter()

METHODS = {"qr", "manual", "face", "nfc"}
STATUSES = ("present", "absent", "late", "excused")


def _utc(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _initials(name: str) -> str:
    parts = [p for p in name.replace(".", " ").split() if p]
    return ("".join(p[0] for p in parts[:2]) or "?").upper()


def _bounds(s: AttendanceSession) -> tuple[datetime, datetime]:
    opened = _utc(s.opens_at or s.created_at)
    closed = _utc(s.closes_at) if s.closes_at else opened + timedelta(minutes=s.valid_minutes or 30)
    return opened, closed


def _ist(dt: Optional[datetime]) -> Optional[datetime]:
    return _utc(dt).astimezone(tm.IST) if dt else None


class _Scope:
    """Trainer's classes, resolved once per request."""

    def __init__(self, classes):
        self.classes = classes
        self.batch = {b.id: b for _, b, _ in classes}
        self.course = {c.id: c for _, _, c in classes}
        self.pairs = {(b.id, c.id) for _, b, c in classes}


async def _scope(db: AsyncSession, trainer: User) -> _Scope:
    return _Scope(await tm.trainer_classes(db, trainer.id))


async def _roster(db: AsyncSession, batch_id: uuid.UUID) -> list[tuple[uuid.UUID, str, str]]:
    """[(trainee_id, full_name, enrollment_no)] - never email/phone."""
    rows = await db.execute(
        select(User.id, User.full_name, User.id).join(Enrollment, Enrollment.trainee_id == User.id)
        .where(Enrollment.batch_id == batch_id, Enrollment.status == "active").order_by(User.full_name))
    return [(r[0], r[1] or "Trainee", str(r[0])[:8].upper()) for r in rows.all()]


async def _own_session(db: AsyncSession, trainer: User, sc: _Scope, session_id: uuid.UUID) -> AttendanceSession:
    s = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == session_id))).scalar_one_or_none()
    if s is None or s.batch_id not in sc.batch or (s.created_by != trainer.id and not await _slot_is_mine(db, trainer, s)):
        raise HTTPException(404, "Attendance session not found")
    return s


async def _slot_is_mine(db: AsyncSession, trainer: User, s: AttendanceSession) -> bool:
    if not s.timetable_slot_id:
        return False
    slot = await db.get(TimetableSlot, s.timetable_slot_id)
    return bool(slot and slot.trainer_id == trainer.id)


async def _course_for(db: AsyncSession, sc: _Scope, s: AttendanceSession, slots: dict) -> Optional[Course]:
    slot = slots.get(s.timetable_slot_id)
    if slot and slot.course_id in sc.course:
        return sc.course[slot.course_id]
    name = (s.session_name or "").lower()
    for (bid, cid) in sc.pairs:
        if bid == s.batch_id and sc.course[cid].title.lower() in name:
            return sc.course[cid]
    return None


async def _slot_map(db: AsyncSession, sessions) -> dict:
    ids = {s.timetable_slot_id for s in sessions if s.timetable_slot_id}
    if not ids:
        return {}
    rows = await db.execute(select(TimetableSlot).where(TimetableSlot.id.in_(ids)))
    return {r.id: r for r in rows.scalars()}


async def _counts(db: AsyncSession, session_ids: list[uuid.UUID]) -> dict[uuid.UUID, dict[str, int]]:
    out: dict[uuid.UUID, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    if session_ids:
        rows = await db.execute(select(AttendanceRecord.session_id, AttendanceRecord.status, func.count())
                                .where(AttendanceRecord.session_id.in_(session_ids))
                                .group_by(AttendanceRecord.session_id, AttendanceRecord.status))
        for sid, st, n in rows.all():
            out[sid][st] += n
    return out


def _qr_payload(s: AttendanceSession) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    return f"coopsetu:attend:{rotating_token(s)}", QR_WINDOW_SECONDS - int(now.timestamp()) % QR_WINDOW_SECONDS


# --------------------------------------------------------------------------
@router.get("/attendance")
async def attendance_overview(
    tab: Literal["today", "upcoming", "history"] = "today",
    batch_id: Optional[uuid.UUID] = None, course_id: Optional[uuid.UUID] = None, q: Optional[str] = None,
    from_: Optional[date] = Query(None, alias="from"), to: Optional[date] = None,
    db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer),
):
    sc = await _scope(db, trainer)
    now = tm.now_ist()
    today = now.date()
    options = {
        "batches": [{"id": str(b.id), "name": b.name} for b in sorted(sc.batch.values(), key=lambda b: b.name)],
        "courses": [{"id": str(c.id), "title": c.title} for c in sorted(sc.course.values(), key=lambda c: c.title)],
        "classes": [{"batch_id": str(b.id), "course_id": str(c.id), "batch": b.name, "course": c.title}
                    for _, b, c in sc.classes],
    }
    if batch_id and batch_id not in sc.batch:
        raise HTTPException(404, "Batch not found")
    if course_id and course_id not in sc.course:
        raise HTTPException(404, "Course not found")
    roster_n: dict[uuid.UUID, int] = {}
    if sc.batch:
        rows = await db.execute(select(Enrollment.batch_id, func.count()).where(
            Enrollment.batch_id.in_(list(sc.batch)), Enrollment.status == "active").group_by(Enrollment.batch_id))
        roster_n = dict(rows.all())

    if tab in ("today", "upcoming"):
        slots = [s for s in await _slots_for_trainer(db, trainer.id)
                 if s.batch_id in sc.batch and (not batch_id or s.batch_id == batch_id)
                 and (not course_id or s.course_id == course_id)]
        start, end = (today, today) if tab == "today" else (today + timedelta(days=1), today + timedelta(days=7))
        cancelled = await _cancelled(db, [s.id for s in slots], start, end)
        sess_by_slot: dict = {}
        counts: dict = {}
        if tab == "today":
            sess = (await db.execute(select(AttendanceSession).where(
                AttendanceSession.timetable_slot_id.in_([s.id for s in slots] or [uuid.uuid4()]),
                AttendanceSession.opens_at >= datetime.combine(today, time.min, tzinfo=tm.IST),
                AttendanceSession.opens_at < datetime.combine(today + timedelta(days=1), time.min, tzinfo=tm.IST))
                .order_by(AttendanceSession.opens_at))).scalars().all()
            for s in sess:
                sess_by_slot[s.timetable_slot_id] = s
            counts = await _counts(db, [s.id for s in sess])
        items = []
        for slot, d in _occurrences(slots, start, end, cancelled):
            s = sess_by_slot.get(slot.id)
            status = "not_started"
            if s:
                status = "live" if _bounds(s)[1] > datetime.now(timezone.utc) else "completed"
            c = counts.get(s.id, {}) if s else {}
            items.append({
                "slot_id": str(slot.id), "date": d.isoformat(), "course": sc.course[slot.course_id].title if slot.course_id in sc.course else slot.title,
                "course_id": str(slot.course_id) if slot.course_id else None, "batch": sc.batch[slot.batch_id].name,
                "batch_id": str(slot.batch_id), "start": _hhmm(slot.start_time), "end": _hhmm(slot.end_time),
                "start_label": _label(slot.start_time), "end_label": _label(slot.end_time), "room": slot.room,
                "roster": roster_n.get(slot.batch_id, 0), "status": status,
                "session_id": str(s.id) if s else None,
                "present": (c.get("present", 0) + c.get("late", 0)) if s else None,
            })
        items.sort(key=lambda i: (i["date"], i["start"] or ""))
        if q:
            items = [i for i in items if q.lower() in f"{i['course']} {i['batch']}".lower()]
        return {"tab": tab, "items": items, **options}

    # ---- history ------------------------------------------------------
    stmt = select(AttendanceSession).where(AttendanceSession.batch_id.in_(list(sc.batch) or [uuid.uuid4()]),
                                           AttendanceSession.opens_at.is_not(None))
    if batch_id:
        stmt = stmt.where(AttendanceSession.batch_id == batch_id)
    if from_:
        stmt = stmt.where(AttendanceSession.opens_at >= datetime.combine(from_, time.min, tzinfo=tm.IST))
    if to:
        stmt = stmt.where(AttendanceSession.opens_at < datetime.combine(to + timedelta(days=1), time.min, tzinfo=tm.IST))
    sessions = [s for s in (await db.execute(stmt.order_by(AttendanceSession.opens_at.desc()).limit(300))).scalars()
                if s.created_by == trainer.id or s.timetable_slot_id]
    slots_by_id = await _slot_map(db, sessions)
    sessions = [s for s in sessions if s.created_by == trainer.id or (slots_by_id.get(s.timetable_slot_id) and slots_by_id[s.timetable_slot_id].trainer_id == trainer.id)]
    counts = await _counts(db, [s.id for s in sessions])
    items = []
    for s in sessions:
        course = await _course_for(db, sc, s, slots_by_id)
        if course_id and (not course or course.id != course_id):
            continue
        c = counts.get(s.id, {})
        present, late = c.get("present", 0), c.get("late", 0)
        excused = c.get("excused", 0)
        roster = roster_n.get(s.batch_id, 0)
        absent = max(roster - present - late - excused, 0)
        loc = _ist(s.opens_at)
        item = {
            "session_id": str(s.id), "date": loc.date().isoformat(), "time": loc.strftime("%I:%M %p"),
            "name": s.session_name, "course": course.title if course else (s.session_name or "Session"),
            "course_id": str(course.id) if course else None, "batch": sc.batch[s.batch_id].name, "batch_id": str(s.batch_id),
            "present": present, "late": late, "excused": excused, "absent": absent, "roster": roster,
            "percentage": tm.pct(present + late, roster),
            "status": "live" if _bounds(s)[1] > datetime.now(timezone.utc) else "completed",
        }
        if q and q.lower() not in f"{item['course']} {item['batch']} {item['date']} {item['name'] or ''}".lower():
            continue
        items.append(item)
    return {"tab": "history", "items": items, **options}


# --------------------------------------------------------------------------
class SessionCreate(BaseModel):
    slot_id: Optional[uuid.UUID] = None
    batch_id: Optional[uuid.UUID] = None
    course_id: Optional[uuid.UUID] = None
    room: Optional[str] = Field(None, max_length=100)
    valid_minutes: int = Field(15, ge=1, le=240)
    methods: list[str] = Field(default_factory=lambda: ["qr", "manual"])


async def _session_view(db: AsyncSession, s: AttendanceSession, sc: _Scope, *, detail: bool = True) -> dict:
    slots = await _slot_map(db, [s])
    course = await _course_for(db, sc, s, slots)
    roster = await _roster(db, s.batch_id)
    recs = (await db.execute(select(AttendanceRecord).where(AttendanceRecord.session_id == s.id))).scalars().all()
    rec_by = {r.trainee_id: r for r in recs}
    opened, closed = _bounds(s)
    now = datetime.now(timezone.utc)
    live = opened <= now <= closed
    names = {tid: n for tid, n, _ in roster}
    present = sum(1 for r in recs if r.status in tm.ATTENDED and r.trainee_id in names)
    view = {
        "id": str(s.id), "name": s.session_name, "course": course.title if course else s.session_name,
        "batch": sc.batch[s.batch_id].name, "batch_id": str(s.batch_id), "room": s.room,
        "methods": s.allowed_methods or ["qr"], "status": "live" if live else "closed",
        "opens_at": _ist(opened).isoformat(), "closes_at": _ist(closed).isoformat(),
        "seconds_left": max(int((closed - now).total_seconds()), 0) if live else 0,
        "present": present, "roster_size": len(roster),
        "late": sum(1 for r in recs if r.status == "late"),
        "qr": None, "qr_expires_in": None,
    }
    if live and "qr" in (s.allowed_methods or ["qr"]) and s.qr_secret:
        view["qr"], view["qr_expires_in"] = _qr_payload(s)
    feed = sorted((r for r in recs if r.trainee_id in names and r.status in tm.ATTENDED and r.marked_at),
                  key=lambda r: _utc(r.marked_at), reverse=True)[:12]
    view["recent"] = [{"trainee_id": str(r.trainee_id), "name": names[r.trainee_id],
                       "time": _ist(r.marked_at).strftime("%I:%M:%S %p"), "method": r.method, "status": r.status} for r in feed]
    if detail:
        view["roster"] = [{
            "trainee_id": str(tid), "name": n, "initials": _initials(n), "code": code,
            "status": rec_by[tid].status if tid in rec_by else "absent", "marked": tid in rec_by,
            "method": rec_by[tid].method if tid in rec_by else None,
            "time": _ist(rec_by[tid].marked_at).strftime("%I:%M %p") if tid in rec_by and rec_by[tid].marked_at else None,
        } for tid, n, code in roster]
    return view


@router.post("/attendance/session")
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    sc = await _scope(db, trainer)
    methods = [m for m in dict.fromkeys(body.methods) if m in METHODS]
    if not methods:
        raise HTTPException(422, "Choose at least one attendance method")
    slot = None
    if body.slot_id:
        slot = await db.get(TimetableSlot, body.slot_id)
        if slot is None or slot.trainer_id != trainer.id or slot.batch_id not in sc.batch:
            raise HTTPException(404, "Timetable slot not found")
        batch_id, course_id = slot.batch_id, slot.course_id
    else:
        batch_id, course_id = body.batch_id, body.course_id
    if not batch_id or not course_id or (batch_id, course_id) not in sc.pairs:
        raise HTTPException(404, "Class not found for this trainer")
    batch, course = sc.batch[batch_id], sc.course[course_id]
    now = datetime.now(timezone.utc)
    today = tm.now_ist().date()
    if slot is None:
        slot = (await db.execute(select(TimetableSlot).where(
            TimetableSlot.trainer_id == trainer.id, TimetableSlot.batch_id == batch_id,
            TimetableSlot.course_id == course_id, TimetableSlot.day_of_week == tm.now_ist().strftime("%A")))).scalars().first()
    # one live session per slot/class: return the existing one instead of duplicating
    live = (await db.execute(select(AttendanceSession).where(
        AttendanceSession.batch_id == batch_id, AttendanceSession.created_by == trainer.id,
        AttendanceSession.closes_at > now, AttendanceSession.opens_at <= now))).scalars().all()
    for ex in live:
        c = await _course_for(db, sc, ex, await _slot_map(db, [ex]))
        if c and c.id == course_id:
            v = await _session_view(db, ex, sc)
            return {**v, "reused": True}
    s = AttendanceSession(
        id=uuid.uuid4(), session_name=f"{course.title} — {today:%d %b}", programme_id=batch.programme_id, batch_id=batch_id,
        timetable_slot_id=slot.id if slot else None, qr_token=secrets.token_urlsafe(24), qr_secret=secrets.token_hex(32),
        valid_minutes=body.valid_minutes, opens_at=now, closes_at=now + timedelta(minutes=body.valid_minutes),
        allowed_methods=methods, created_by=trainer.id, room=body.room or (slot.room if slot else None), created_at=now)
    db.add(s)
    await db.commit()
    return {**(await _session_view(db, s, sc)), "reused": False}


@router.get("/attendance/session/{session_id}")
async def session_state(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    sc = await _scope(db, trainer)
    s = await _own_session(db, trainer, sc, session_id)
    return await _session_view(db, s, sc)


@router.get("/attendance/session/{session_id}/details")
async def session_details(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    sc = await _scope(db, trainer)
    s = await _own_session(db, trainer, sc, session_id)
    v = await _session_view(db, s, sc)
    v["percentage"] = tm.pct(v["present"], v["roster_size"])
    v["counts"] = {st: sum(1 for r in v["roster"] if r["status"] == st) for st in STATUSES}
    return v


@router.post("/attendance/session/{session_id}/simulate-checkin")
async def simulate_checkin(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    """PROTOTYPE/DEMO ONLY: marks the next not-yet-present trainee present via 'qr'
    so the live count updates without a phone. Real scans go through /attendance/scan."""
    sc = await _scope(db, trainer)
    s = await _own_session(db, trainer, sc, session_id)
    opened, closed = _bounds(s)
    if not opened <= datetime.now(timezone.utc) <= closed:
        raise HTTPException(410, "Attendance session is closed")
    roster = await _roster(db, s.batch_id)
    done = set((await db.execute(select(AttendanceRecord.trainee_id).where(AttendanceRecord.session_id == s.id))).scalars())
    nxt = next(((tid, n) for tid, n, _ in roster if tid not in done), None)
    if nxt is None:
        return {"marked": None, "detail": "Everyone is already marked"}
    await db.execute(pg_insert(AttendanceRecord).values(
        id=uuid.uuid4(), session_id=s.id, trainee_id=nxt[0], marked_at=datetime.now(timezone.utc), method="qr", status="present",
        offline=False, needs_review=False).on_conflict_do_nothing(constraint="uq_attendance_session_trainee"))
    await db.commit()
    return {"marked": {"trainee_id": str(nxt[0]), "name": nxt[1]}}


class MarkRecord(BaseModel):
    trainee_id: uuid.UUID
    status: Literal["present", "absent", "late", "excused"]


class MarkBody(BaseModel):
    session_id: uuid.UUID
    records: list[MarkRecord] = Field(min_length=1, max_length=500)


@router.post("/attendance/mark")
async def mark(body: MarkBody, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    sc = await _scope(db, trainer)
    s = await _own_session(db, trainer, sc, body.session_id)
    allowed = {tid for tid, _, _ in await _roster(db, s.batch_id)}
    bad = [str(r.trainee_id) for r in body.records if r.trainee_id not in allowed]
    if bad:
        raise HTTPException(422, f"{len(bad)} trainee(s) are not enrolled in this session's batch")
    latest = {r.trainee_id: r.status for r in body.records}  # last write wins, no duplicates
    now = datetime.now(timezone.utc)
    for tid, st in latest.items():
        stmt = pg_insert(AttendanceRecord).values(
            id=uuid.uuid4(), session_id=s.id, trainee_id=tid, marked_at=now, method="manual", status=st,
            override_by=trainer.id, offline=False, needs_review=False)
        stmt = stmt.on_conflict_do_update(constraint="uq_attendance_session_trainee", set_={
            "status": st, "method": "manual", "marked_at": now, "override_by": trainer.id})
        await db.execute(stmt)
    await db.commit()
    return {"saved": len(latest), "session": await _session_view(db, s, sc, detail=False)}


@router.post("/attendance/session/{session_id}/close")
async def close_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(current_trainer)):
    sc = await _scope(db, trainer)
    s = await _own_session(db, trainer, sc, session_id)
    now = datetime.now(timezone.utc)
    if _bounds(s)[1] > now:
        s.closes_at = now
        await db.commit()
    return await _session_view(db, s, sc, detail=False)
