"""Attendance sessions, rotating QR credentials, and roster-scoped records."""
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.deps import AuthenticatedIdentity, get_optional_identity, require_roles, require_user, resolve_actor_id
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.face import FaceEvent, FaceTemplate
from app.services.face import MODEL_VERSION, cosine, frame_features
from app.models.programme import Batch, Enrollment, Nomination, Programme
from app.models.user import User
from app.schemas.attendance import GenerateQRRequest, ScanQRRequest
from app.services.mobile import ATTENDANCE_METHOD_LABELS, IST

router = APIRouter()
QR_WINDOW_SECONDS = 30
CLOCK_SKEW_SECONDS = 30


def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def session_bounds(session: AttendanceSession) -> tuple[datetime, datetime]:
    source = session.opens_at or session.created_at
    if source is None:
        raise HTTPException(410, "Attendance session has no valid time window")
    opened = utc(source)
    closed = utc(session.closes_at) if session.closes_at else opened + timedelta(minutes=session.valid_minutes or 30)
    return opened, closed


def rotating_token(session: AttendanceSession, at: Optional[datetime] = None) -> str:
    if not session.qr_secret:
        raise ValueError("Session does not have a rotating QR secret")
    window = int((at or datetime.now(timezone.utc)).timestamp()) // QR_WINDOW_SECONDS
    message = f"{session.id}.{window}".encode()
    digest = hmac.new(session.qr_secret.encode(), message, hashlib.sha256).hexdigest()[:32]
    return f"{session.id}.{window}.{digest}"


def verify_rotating_token(session: AttendanceSession, credential: str, at: datetime) -> bool:
    if not session.qr_secret:
        return False
    parts = credential.split(".")
    if len(parts) != 3 or parts[0] != str(session.id):
        return False
    try:
        window = int(parts[1])
    except ValueError:
        return False
    current = int(at.timestamp()) // QR_WINDOW_SECONDS
    if window not in (current, current - 1):
        return False
    expected = rotating_token(session, datetime.fromtimestamp(window * QR_WINDOW_SECONDS, timezone.utc))
    return hmac.compare_digest(expected, credential)


async def trainee_in_session(db: AsyncSession, trainee_id: uuid.UUID, session: AttendanceSession) -> bool:
    if session.batch_id:
        return bool((await db.execute(select(Enrollment.id).where(
            Enrollment.trainee_id == trainee_id, Enrollment.batch_id == session.batch_id,
            Enrollment.status == "active",
        ))).scalar_one_or_none())
    if session.programme_id:
        return bool((await db.execute(select(Nomination.id).where(
            Nomination.trainee_id == trainee_id, Nomination.programme_id == session.programme_id,
            Nomination.status == "approved",
        ))).scalar_one_or_none()) or bool((await db.execute(
            select(Enrollment.id).join(Batch, Batch.id == Enrollment.batch_id).where(
                Enrollment.trainee_id == trainee_id, Batch.programme_id == session.programme_id,
                Enrollment.status == "active",
            )
        )).scalar_one_or_none())
    return False


async def mark_attendance(db: AsyncSession, session: AttendanceSession, trainee_id: uuid.UUID,
                          method: str, *, confidence: Optional[float] = None,
                          captured_at: Optional[datetime] = None, client_id: Optional[str] = None) -> AttendanceRecord:
    now = datetime.now(timezone.utc)
    opened, closed = session_bounds(session)
    if not opened <= now <= closed and captured_at is None:
        raise HTTPException(410, "Attendance session is closed")
    if method not in (session.allowed_methods or ["qr", "nfc", "face"]):
        raise HTTPException(403, "Attendance method is not allowed for this session")
    if not await trainee_in_session(db, trainee_id, session):
        raise HTTPException(403, "Trainee is not enrolled in this session")
    offline = captured_at is not None
    if offline:
        capture = utc(captured_at)
        if not opened - timedelta(seconds=CLOCK_SKEW_SECONDS) <= capture <= closed + timedelta(seconds=CLOCK_SKEW_SECONDS):
            raise HTTPException(422, "Offline scan was outside the attendance window")
        if capture > now + timedelta(seconds=CLOCK_SKEW_SECONDS):
            raise HTTPException(422, "Offline scan is in the future")
    duplicate = (await db.execute(select(AttendanceRecord.id).where(
        AttendanceRecord.session_id == session.id, AttendanceRecord.trainee_id == trainee_id,
    ))).scalar_one_or_none()
    if duplicate:
        raise HTTPException(409, "Attendance already recorded for this session")
    record = AttendanceRecord(id=uuid.uuid4(), session_id=session.id, trainee_id=trainee_id,
                              marked_at=now, method=method, status="present", confidence=confidence,
                              client_id=client_id, captured_at=utc(captured_at) if captured_at else None,
                              offline=offline, needs_review=offline)
    db.add(record)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(409, "Attendance already recorded for this session") from exc
    return record


class SessionCreate(BaseModel):
    session_name: str
    programme_id: uuid.UUID
    batch_id: Optional[uuid.UUID] = None
    timetable_slot_id: Optional[uuid.UUID] = None
    valid_minutes: int = Field(30, ge=1, le=480)
    allowed_methods: list[str] = Field(default_factory=lambda: ["qr", "nfc", "face"])
    room: Optional[str] = None


@router.get("/classes/mine")
async def my_classes(actor: User = Depends(require_roles("trainer", "institution", "admin")), db: AsyncSession = Depends(get_db)):
    """Batches (and batch-less programmes running on nominations) the caller's
    organisation runs, for the trainer/institution class list and the
    attendance-session class picker. Read-only; does not touch programmes.py."""
    scope = None if actor.role == "admin" else actor.organisation_id
    if scope is None and actor.role != "admin":
        raise HTTPException(403, "Your account is not linked to an organisation")
    batch_query = select(Batch, Programme).join(Programme, Programme.id == Batch.programme_id)
    if scope is not None:
        batch_query = batch_query.where(Programme.organisation_id == scope)
    batch_rows = (await db.execute(batch_query.order_by(Batch.start_date.desc().nullslast()))).all()
    classes = []
    covered_programme_ids = set()
    for batch, programme in batch_rows:
        covered_programme_ids.add(programme.id)
        enrolled = (await db.execute(select(func.count(Enrollment.id)).where(
            Enrollment.batch_id == batch.id, Enrollment.status == "active"))).scalar_one()
        classes.append({
            "batch_id": str(batch.id), "programme_id": str(programme.id),
            "title": programme.title, "batch_name": batch.name,
            "sector": programme.sector, "level": programme.level,
            "venue": batch.venue, "capacity": batch.capacity, "enrolled": enrolled,
            "start_date": batch.start_date.isoformat() if batch.start_date else None,
            "end_date": batch.end_date.isoformat() if batch.end_date else None,
        })
    prog_query = select(Programme)
    if scope is not None:
        prog_query = prog_query.where(Programme.organisation_id == scope)
    programmes = (await db.execute(prog_query)).scalars().all()
    for programme in programmes:
        if programme.id in covered_programme_ids:
            continue
        nominated = (await db.execute(select(func.count(Nomination.id)).where(
            Nomination.programme_id == programme.id, Nomination.status == "approved"))).scalar_one()
        classes.append({
            "batch_id": None, "programme_id": str(programme.id),
            "title": programme.title, "batch_name": None,
            "sector": programme.sector, "level": programme.level,
            "venue": programme.venue, "capacity": programme.seats_total, "enrolled": nominated,
            "start_date": programme.start_date.isoformat() if programme.start_date else None,
            "end_date": programme.end_date.isoformat() if programme.end_date else None,
        })
    return {"classes": classes}


@router.get("/sessions/mine")
async def my_sessions(limit: int = 20, actor: User = Depends(require_roles("trainer", "institution", "admin")),
                      db: AsyncSession = Depends(get_db)):
    """Recent attendance sessions run by the caller's organisation, with a
    present/marked rollup, for the trainer's session history view."""
    query = select(AttendanceSession, Programme).join(Programme, Programme.id == AttendanceSession.programme_id)
    if actor.role != "admin":
        query = query.where(Programme.organisation_id == actor.organisation_id)
    query = query.order_by(AttendanceSession.created_at.desc().nullslast()).limit(min(limit, 100))
    rows = (await db.execute(query)).all()
    sessions = []
    for session, programme in rows:
        counts = (await db.execute(select(AttendanceRecord.status, func.count(AttendanceRecord.id))
            .where(AttendanceRecord.session_id == session.id).group_by(AttendanceRecord.status))).all()
        by_status = {status: count for status, count in counts}
        present = by_status.get("present", 0) + by_status.get("late", 0)
        marked_total = sum(by_status.values())
        opened, closed = session_bounds(session)
        now = datetime.now(timezone.utc)
        sessions.append({
            "session_id": str(session.id), "session_name": session.session_name,
            "programme_title": programme.title, "batch_id": str(session.batch_id) if session.batch_id else None,
            "opens_at": opened.isoformat(), "closes_at": closed.isoformat(),
            "present": present, "marked_total": marked_total, "is_open": opened <= now <= closed,
        })
    return {"sessions": sessions}


@router.post("/sessions")
async def create_session(data: SessionCreate, actor: User = Depends(require_roles("trainer", "institution", "admin")), db: AsyncSession = Depends(get_db)):
    programme = (await db.execute(select(Programme).where(Programme.id == data.programme_id))).scalar_one_or_none()
    if not programme:
        raise HTTPException(404, "Programme not found")
    if actor.role != "admin" and programme.organisation_id != actor.organisation_id:
        raise HTTPException(403, "Programme belongs to a different organisation")
    if data.batch_id:
        batch = (await db.execute(select(Batch).where(Batch.id == data.batch_id, Batch.programme_id == programme.id))).scalar_one_or_none()
        if not batch:
            raise HTTPException(404, "Batch not found in programme")
    if not data.allowed_methods or set(data.allowed_methods) - {"qr", "nfc", "face"}:
        raise HTTPException(422, "Unsupported attendance method")
    now = datetime.now(timezone.utc)
    session = AttendanceSession(id=uuid.uuid4(), session_name=data.session_name, programme_id=programme.id,
        batch_id=data.batch_id, timetable_slot_id=data.timetable_slot_id, room=data.room,
        qr_token=secrets.token_urlsafe(24), qr_secret=secrets.token_hex(32),
        valid_minutes=data.valid_minutes, opens_at=now, closes_at=now + timedelta(minutes=data.valid_minutes),
        allowed_methods=data.allowed_methods, created_by=actor.id, created_at=now)
    db.add(session)
    await db.commit()
    return {"session_id": str(session.id), "opens_at": session.opens_at, "closes_at": session.closes_at,
            "qr_data": f"coopsetu:attend:{rotating_token(session)}"}


@router.post("/generate-qr")
async def generate_qr(data: GenerateQRRequest,
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity), db: AsyncSession = Depends(get_db)):
    if identity is not None and identity.role not in ("trainer", "institution", "admin"):
        raise HTTPException(403, "Only trainers, institutions, or admins can generate QR attendance sessions")
    programme_id = uuid.UUID(data.programme_id)
    programme = (await db.execute(select(Programme).where(Programme.id == programme_id))).scalar_one_or_none()
    if not programme:
        raise HTTPException(404, "Programme not found")
    if identity and identity.role != "admin" and (not identity.db_user or identity.db_user.organisation_id != programme.organisation_id):
        raise HTTPException(403, "Programme belongs to a different organisation")
    now = datetime.now(timezone.utc)
    session = AttendanceSession(id=uuid.uuid4(), session_name=data.session_name, programme_id=programme_id,
        qr_token=secrets.token_urlsafe(24), qr_secret=secrets.token_hex(32), created_at=now,
        opens_at=now, closes_at=now + timedelta(minutes=data.valid_minutes), valid_minutes=data.valid_minutes,
        allowed_methods=["qr", "nfc", "face"], created_by=identity.db_user.id if identity and identity.db_user else None)
    db.add(session)
    await db.commit()
    token = rotating_token(session)
    return {"qr_token": token, "session_id": str(session.id), "valid_minutes": data.valid_minutes,
            "qr_data": f"coopsetu:attend:{token}"}


@router.get("/sessions/{session_id}/qr")
async def session_qr(session_id: uuid.UUID, actor: User = Depends(require_roles("trainer", "institution", "admin")), db: AsyncSession = Depends(get_db)):
    session = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    programme = (await db.execute(select(Programme).where(Programme.id == session.programme_id))).scalar_one_or_none()
    if actor.role != "admin" and (not programme or programme.organisation_id != actor.organisation_id):
        raise HTTPException(403, "Session belongs to a different organisation")
    now = datetime.now(timezone.utc)
    opened, closed = session_bounds(session)
    if not opened <= now <= closed:
        raise HTTPException(410, "Attendance session is closed")
    token = rotating_token(session)
    return {"qr_token": token, "qr_data": f"coopsetu:attend:{token}", "expires_in": QR_WINDOW_SECONDS - int(now.timestamp()) % QR_WINDOW_SECONDS}


@router.post("/scan")
async def scan_attendance(data: ScanQRRequest, identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity), db: AsyncSession = Depends(get_db)):
    credential = data.qr_token.strip()
    if credential.lower().startswith("coopsetu:attend:"):
        credential = credential[len("coopsetu:attend:"):].strip()
    session = None
    try:
        session_id = uuid.UUID(credential.split(".", 1)[0])
        session = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == session_id))).scalar_one_or_none()
    except ValueError:
        # Legacy static tokens remain readable only on legacy sessions.
        session = (await db.execute(select(AttendanceSession).where(AttendanceSession.qr_token == credential,
            AttendanceSession.qr_secret.is_(None)))).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if not session or (session.qr_secret and not verify_rotating_token(session, credential, now)):
        raise HTTPException(404, "Invalid QR token")
    opened, closed = session_bounds(session)
    if not opened <= now <= closed:
        raise HTTPException(410, "Attendance session is closed")
    trainee_id = resolve_actor_id(identity, data.trainee_id, allowed_roles=("trainee", "admin"))
    if not trainee_id:
        raise HTTPException(422, "trainee_id must be provided or derived from authenticated identity")
    user = (await db.execute(select(User).where(User.id == trainee_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Trainee not found")
    record = await mark_attendance(db, session, trainee_id, "qr")
    return {"status": "recorded", "session": session.session_name, "trainee_id": str(trainee_id), "marked_at": str(record.marked_at)}


@router.get("/my")
async def my_attendance(trainee_id: Optional[str] = None,
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity), db: AsyncSession = Depends(get_db)):
    trainee_uuid = resolve_actor_id(identity, trainee_id)
    if trainee_uuid:
        rows = (await db.execute(select(AttendanceRecord, AttendanceSession)
            .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
            .where(AttendanceRecord.trainee_id == trainee_uuid)
            .order_by(AttendanceRecord.marked_at.desc()))).all()
        batch_ids = set((await db.execute(select(Enrollment.batch_id).where(
            Enrollment.trainee_id == trainee_uuid, Enrollment.status == "active"))).scalars().all())
        if batch_ids:
            programme_ids = set((await db.execute(select(Batch.programme_id).where(Batch.id.in_(batch_ids)))).scalars().all())
            scoped = (AttendanceSession.batch_id.in_(batch_ids)) | (
                AttendanceSession.batch_id.is_(None) & AttendanceSession.programme_id.in_(programme_ids))
            total_sessions = (await db.execute(select(func.count()).select_from(AttendanceSession).where(scoped))).scalar() or 0
        else:
            total_sessions = 0
        attended = sum(1 for record, session in rows if record.status in ("present", "late") and (
            session.batch_id in batch_ids or (session.batch_id is None and session.programme_id in (programme_ids if batch_ids else set()))))
        records = []
        for record, session in rows:
            local = utc(record.marked_at).astimezone(IST) if record.marked_at else None
            records.append({"date": local.date().isoformat() if local else None,
                "session": session.session_name or "Session", "status": record.status,
                "method": ATTENDANCE_METHOD_LABELS.get(record.method, record.method),
                "timestamp": local.strftime("%I:%M %p") if local else None})
        return {"records": records, "overall_percentage": round(attended / total_sessions * 100, 1) if total_sessions else 0.0,
            "total_sessions": total_sessions, "present": attended}
    return {"records": [], "overall_percentage": 0.0, "total_sessions": 0, "present": 0}


@router.get("/sessions/active")
async def active_sessions(actor: User = Depends(require_roles("trainee")), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    batch_ids = set((await db.execute(select(Enrollment.batch_id).where(
        Enrollment.trainee_id == actor.id, Enrollment.status == "active"))).scalars().all())
    if not batch_ids:
        return {"sessions": []}
    sessions = (await db.execute(select(AttendanceSession).where(
        AttendanceSession.batch_id.in_(batch_ids), AttendanceSession.opens_at <= now,
        AttendanceSession.closes_at >= now).order_by(AttendanceSession.closes_at))).scalars().all()
    return {"sessions": [{"session_id": str(item.id), "session_name": item.session_name,
        "opens_at": item.opens_at, "closes_at": item.closes_at,
        "allowed_methods": item.allowed_methods or ["qr"]} for item in sessions]}


@router.get("/sessions/{session_id}")
async def session_roster(session_id: uuid.UUID, actor: User = Depends(require_roles("trainer", "institution", "admin")), db: AsyncSession = Depends(get_db)):
    session = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    programme = (await db.execute(select(Programme).where(Programme.id == session.programme_id))).scalar_one_or_none()
    if actor.role != "admin" and (not programme or programme.organisation_id != actor.organisation_id):
        raise HTTPException(403, "Session belongs to a different organisation")
    if session.batch_id:
        people = (await db.execute(select(User).join(Enrollment, Enrollment.trainee_id == User.id).where(
            Enrollment.batch_id == session.batch_id, Enrollment.status == "active"))).scalars().all()
    else:
        people = (await db.execute(select(User).join(Nomination, Nomination.trainee_id == User.id).where(
            Nomination.programme_id == session.programme_id, Nomination.status == "approved"))).scalars().all()
    marks = (await db.execute(select(AttendanceRecord).where(AttendanceRecord.session_id == session.id))).scalars().all()
    marked = {item.trainee_id: item for item in marks}
    return {"session_id": str(session.id), "session_name": session.session_name,
        "opens_at": session_bounds(session)[0], "closes_at": session_bounds(session)[1],
        "roster": [{"trainee_id": str(person.id), "name": person.full_name,
            "status": marked[person.id].status if person.id in marked else "unmarked",
            "method": marked[person.id].method if person.id in marked else None} for person in people]}


class MarkRequest(BaseModel):
    session_id: uuid.UUID
    method: str
    credential: str
    client_id: Optional[str] = Field(None, max_length=64)
    captured_at: Optional[datetime] = None


@router.post("/mark")
async def mark_endpoint(data: MarkRequest, actor: User = Depends(require_roles("trainee")), db: AsyncSession = Depends(get_db)):
    if data.method != "qr":
        raise HTTPException(503, "This attendance method is not configured")
    session = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == data.session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    credential = data.credential.removeprefix("coopsetu:attend:")
    capture = utc(data.captured_at) if data.captured_at else datetime.now(timezone.utc)
    if not verify_rotating_token(session, credential, capture):
        raise HTTPException(404, "Invalid QR token")
    record = await mark_attendance(db, session, actor.id, "qr", captured_at=data.captured_at, client_id=data.client_id)
    return {"status": "recorded", "record_id": str(record.id), "offline": record.offline,
            "needs_review": record.needs_review}


class OverrideRequest(BaseModel):
    status: str
    reason: str = Field(min_length=3, max_length=1000)


@router.patch("/records/{record_id}")
async def override_record(record_id: uuid.UUID, data: OverrideRequest,
    actor: User = Depends(require_roles("trainer", "institution", "admin")), db: AsyncSession = Depends(get_db)):
    if data.status not in ("present", "late", "absent"):
        raise HTTPException(422, "Unsupported attendance status")
    row = (await db.execute(select(AttendanceRecord, AttendanceSession, Programme)
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .join(Programme, Programme.id == AttendanceSession.programme_id)
        .where(AttendanceRecord.id == record_id))).one_or_none()
    if not row:
        raise HTTPException(404, "Attendance record not found")
    record, _, programme = row
    if actor.role != "admin" and programme.organisation_id != actor.organisation_id:
        raise HTTPException(403, "Session belongs to a different organisation")
    record.status = data.status
    record.override_by = actor.id
    record.override_reason = data.reason
    record.needs_review = False
    await db.commit()
    return {"record_id": str(record.id), "status": record.status, "needs_review": False}


async def _face_frames(frames: list[UploadFile], count: int) -> list[tuple[list[float], float]]:
    if len(frames) != count:
        raise HTTPException(422, f"{count} face frames are required")
    result = []
    allowed_types = ("image/jpeg", "image/png", "image/webp", "application/json", "application/octet-stream", "text/plain")
    for frame in frames:
        if frame.content_type not in allowed_types:
            raise HTTPException(422, "Unsupported image type")
        result.append(frame_features(await frame.read(2_000_001)))
    return result


@router.post("/face/verify")
@router.post("/face-verify")
async def face_verify(session_id: uuid.UUID = Form(...), challenge_id: uuid.UUID = Form(...),
    frames: list[UploadFile] = File(...), actor: User = Depends(require_roles("trainee")),
    db: AsyncSession = Depends(get_db)):
    session = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    now = datetime.now(timezone.utc)
    opened, closed = session_bounds(session)
    if not opened <= now <= closed:
        raise HTTPException(410, "Attendance session is closed")
    if "face" not in (session.allowed_methods or ["qr"]):
        raise HTTPException(403, "Face attendance is not allowed")
    if not await trainee_in_session(db, actor.id, session):
        raise HTTPException(403, "Trainee is not enrolled in this session")
    template = (await db.execute(select(FaceTemplate).where(FaceTemplate.user_id == actor.id))).scalar_one_or_none()
    if not template or template.embedding is None or not template.consent_at or template.revoked_at or template.model_version != MODEL_VERSION:
        raise HTTPException(403, "An active face template and consent are required")
    attempts = (await db.execute(select(func.count()).select_from(FaceEvent).where(
        FaceEvent.user_id == actor.id, FaceEvent.event_type == "verify",
        FaceEvent.created_at >= now - timedelta(minutes=5)))).scalar() or 0
    if attempts >= 5:
        raise HTTPException(429, "Too many face verification attempts")
    challenge = (await db.execute(select(FaceEvent).where(FaceEvent.id == challenge_id,
        FaceEvent.user_id == actor.id, FaceEvent.event_type == "challenge").with_for_update())).scalar_one_or_none()
    if not challenge or challenge.outcome != "issued":
        raise HTTPException(422, "Challenge is invalid or already used")
    expires_at = datetime.fromisoformat((challenge.details or {}).get("expires_at", "1970-01-01T00:00:00+00:00"))
    if utc(expires_at) < now:
        challenge.outcome = "expired"
        await db.commit()
        raise HTTPException(422, "Challenge expired")
    features = await _face_frames(frames, 3)
    challenge.outcome = "used"
    sequence = (challenge.details or {}).get("sequence")
    yaws = [yaw for _, yaw in features]
    # YuNet eye/nose landmarks provide an approximate pose signal. The exact
    # sign is camera dependent, so require opposite movement and a centre pose.
    centre_index = sequence.index("centre") if isinstance(sequence, list) and "centre" in sequence else -1
    turns = [yaws[i] for i, pose in enumerate(sequence or []) if pose != "centre"]
    liveness = centre_index >= 0 and len(turns) == 2 and abs(yaws[centre_index]) < 0.16 and abs(turns[0] - turns[1]) > 0.22 and turns[0] * turns[1] < 0
    score = min(cosine(embedding, list(template.embedding)) for embedding, _ in features)
    threshold = get_settings().face_match_threshold or 0.363
    matched = liveness and score >= threshold
    db.add(FaceEvent(user_id=actor.id, actor_id=actor.id, session_id=session.id,
        event_type="verify", outcome="matched" if matched else "rejected",
        score=score, liveness=liveness))
    await db.commit()
    if not matched:
        return {"matched": False, "score": score, "liveness": liveness, "record": None}
    record = await mark_attendance(db, session, actor.id, "face", confidence=score)
    return {"matched": True, "score": score, "liveness": True, "record": {"id": str(record.id), "status": record.status}}


@router.post("/face/identify")
async def face_identify(session_id: uuid.UUID = Form(...), frame: UploadFile = File(...),
    actor: User = Depends(require_roles("trainer", "institution", "admin")), db: AsyncSession = Depends(get_db)):
    session = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == session_id))).scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    programme = (await db.execute(select(Programme).where(Programme.id == session.programme_id))).scalar_one_or_none()
    if actor.role != "admin" and (not programme or programme.organisation_id != actor.organisation_id):
        raise HTTPException(403, "Session belongs to a different organisation")
    now = datetime.now(timezone.utc)
    opened, closed = session_bounds(session)
    if not opened <= now <= closed:
        raise HTTPException(410, "Attendance session is closed")
    if "face" not in (session.allowed_methods or ["qr"]):
        raise HTTPException(403, "Face attendance is not allowed")
    features = await _face_frames([frame], 1)
    embedding = features[0][0]
    if session.batch_id:
        roster = select(Enrollment.trainee_id).where(Enrollment.batch_id == session.batch_id, Enrollment.status == "active")
    else:
        roster = select(Nomination.trainee_id).where(Nomination.programme_id == session.programme_id, Nomination.status == "approved")
    templates = (await db.execute(select(FaceTemplate, User).join(User, User.id == FaceTemplate.user_id).where(
        FaceTemplate.user_id.in_(roster), FaceTemplate.embedding.is_not(None),
        FaceTemplate.revoked_at.is_(None), FaceTemplate.model_version == MODEL_VERSION))).all()
    threshold = get_settings().face_match_threshold or 0.363
    candidates = sorted(({"trainee_id": str(person.id), "name": person.full_name,
        "score": cosine(embedding, list(template.embedding))} for template, person in templates),
        key=lambda item: item["score"], reverse=True)
    candidates = [item for item in candidates if item["score"] >= threshold][:3]
    db.add(FaceEvent(actor_id=actor.id, session_id=session.id, event_type="identify",
        outcome="candidates" if candidates else "rejected", score=candidates[0]["score"] if candidates else None))
    await db.commit()
    return {"candidates": candidates, "decision": "trainer_confirmation_required" if candidates else "no_match"}
