"""Trainer messages + announcements (included under /api/v1/trainer).

Direct messages are only possible between the trainer and trainees of their
batches (or an institution admin of the trainer's organisation). Contact
details (email/phone) are never returned.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Announcement, DirectMessage, User
from app.services import trainer_metrics as tm

router = APIRouter()

DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"


async def _trainer(x_demo_user: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


async def _recipients(db: AsyncSession, trainer: User) -> list[dict]:
    stats = await tm.compute_stats(db, trainer.id)
    out = [{"id": str(s.trainee.id), "name": s.trainee.full_name, "role": "trainee", "batch": s.batch_name,
            "batch_id": str(s.batch_id)} for s in stats.values()]
    out.sort(key=lambda r: (r["batch"] or "", r["name"] or ""))
    if trainer.organisation_id:
        admins = (await db.execute(select(User).where(
            User.organisation_id == trainer.organisation_id, User.role == "institution",
            User.is_active.is_not(False)))).scalars().all()
        out += [{"id": str(a.id), "name": a.full_name, "role": "institution_admin", "batch": None, "batch_id": None}
                for a in admins]
    return out


@router.get("/messages/recipients")
async def message_recipients(db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    return {"recipients": await _recipients(db, trainer)}


@router.get("/messages")
async def conversations(q: Optional[str] = Query(None, max_length=100), db: AsyncSession = Depends(get_db),
                        trainer: User = Depends(_trainer)):
    msgs = (await db.execute(select(DirectMessage).where(
        or_(DirectMessage.sender_id == trainer.id, DirectMessage.recipient_id == trainer.id))
        .order_by(DirectMessage.created_at.desc()))).scalars().all()
    if not msgs:
        return {"conversations": [], "unread_total": 0}
    rec = {r["id"]: r for r in await _recipients(db, trainer)}
    other_ids = {m.recipient_id if m.sender_id == trainer.id else m.sender_id for m in msgs}
    users = {u.id: u for u in (await db.execute(select(User).where(User.id.in_(other_ids)))).scalars()}
    convs: dict[uuid.UUID, dict] = {}
    for m in msgs:  # newest first
        other = m.recipient_id if m.sender_id == trainer.id else m.sender_id
        u = users.get(other)
        c = convs.get(other)
        if c is None:
            r = rec.get(str(other), {})
            c = convs[other] = {
                "user_id": str(other), "name": u.full_name if u else "Unknown", "role": r.get("role", u.role if u else None),
                "batch": r.get("batch"), "last_message": m.body[:140], "last_subject": m.subject,
                "last_at": _iso(m.created_at), "last_from_me": m.sender_id == trainer.id, "unread": 0, "_text": [],
            }
        if m.recipient_id == trainer.id and m.read_at is None:
            c["unread"] += 1
        c["_text"].append(f"{m.subject or ''} {m.body}".lower())
    out = list(convs.values())
    if q and q.strip():
        needle = q.strip().lower()
        out = [c for c in out if needle in (c["name"] or "").lower() or any(needle in t for t in c["_text"])]
    for c in out:
        c.pop("_text")
    return {"conversations": out, "unread_total": sum(c["unread"] for c in out)}


async def _assert_counterpart(db: AsyncSession, trainer: User, user_id: uuid.UUID) -> dict:
    for r in await _recipients(db, trainer):
        if r["id"] == str(user_id):
            return r
    # Allow viewing existing threads is covered by scoping; anything else is forbidden.
    raise HTTPException(status_code=403, detail="You can only message trainees of your batches or your institution admin")


@router.get("/messages/thread/{user_id}")
async def thread(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    other = await _assert_counterpart(db, trainer, user_id)
    msgs = (await db.execute(select(DirectMessage).where(or_(
        and_(DirectMessage.sender_id == trainer.id, DirectMessage.recipient_id == user_id),
        and_(DirectMessage.sender_id == user_id, DirectMessage.recipient_id == trainer.id)))
        .order_by(DirectMessage.created_at.asc()))).scalars().all()
    return {"user": other, "messages": [{
        "id": str(m.id), "from_me": m.sender_id == trainer.id, "subject": m.subject, "body": m.body,
        "created_at": _iso(m.created_at), "read": m.read_at is not None or m.sender_id == trainer.id,
    } for m in msgs]}


class MessageIn(BaseModel):
    recipient_id: uuid.UUID
    subject: Optional[str] = Field(None, max_length=255)
    body: str = Field(min_length=1, max_length=5000)


@router.post("/messages")
async def send_message(body: MessageIn, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    await _assert_counterpart(db, trainer, body.recipient_id)
    text = body.body.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Message body is required")
    m = DirectMessage(sender_id=trainer.id, recipient_id=body.recipient_id,
                      subject=(body.subject or "").strip() or None, body=text, created_at=datetime.now(timezone.utc))
    db.add(m)
    await db.commit()
    return {"id": str(m.id), "created_at": _iso(m.created_at)}


@router.post("/messages/{message_id}/read")
async def mark_read(message_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    m = await db.get(DirectMessage, message_id)
    if m is None or m.recipient_id != trainer.id:
        raise HTTPException(status_code=404, detail="Message not found")
    if m.read_at is None:
        m.read_at = datetime.now(timezone.utc)
        await db.commit()
    return {"ok": True}


# --------------------------------------------------------------------------
# Announcements
# --------------------------------------------------------------------------
@router.get("/announcements")
async def list_announcements(db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    classes = await tm.trainer_classes(db, trainer.id)
    batch_name = {b.id: b.name for _, b, _ in classes}
    course_name = {c.id: c.title for _, _, c in classes}
    rows = (await db.execute(select(Announcement).where(Announcement.created_by == trainer.id)
                             .order_by(Announcement.created_at.desc()))).scalars().all()
    out = []
    for a in rows:
        ids = a.trainee_ids if isinstance(a.trainee_ids, list) else []
        if a.audience_type == "trainees":
            label = f"{len(ids)} selected trainee{'s' if len(ids) != 1 else ''}"
        elif a.audience_type == "course":
            label = f"{batch_name.get(a.batch_id, 'Batch')} · {course_name.get(a.course_id, 'Course')}"
        else:
            label = f"Batch {batch_name.get(a.batch_id, '')}".strip()
        out.append({"id": str(a.id), "title": a.title, "message": a.message, "audience_type": a.audience_type,
                    "audience": label, "batch_id": str(a.batch_id) if a.batch_id else None,
                    "course_id": str(a.course_id) if a.course_id else None, "status": a.status,
                    "created_at": _iso(a.created_at)})
    return {"announcements": out}


class AnnouncementIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=5000)
    audience_type: str = Field(pattern="^(batch|course|trainees)$")
    batch_id: uuid.UUID
    course_id: Optional[uuid.UUID] = None
    trainee_ids: Optional[list[uuid.UUID]] = None
    status: str = Field("sent", pattern="^(sent|draft)$")


@router.post("/announcements")
async def create_announcement(body: AnnouncementIn, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    classes = await tm.trainer_classes(db, trainer.id)
    if body.batch_id not in {b.id for _, b, _ in classes}:
        raise HTTPException(status_code=404, detail="Batch not found")
    course_id, trainee_ids = None, None
    if body.audience_type == "course":
        if body.course_id is None or not any(b.id == body.batch_id and c.id == body.course_id for _, b, c in classes):
            raise HTTPException(status_code=404, detail="Course not found for this batch")
        course_id = body.course_id
    elif body.audience_type == "trainees":
        if not body.trainee_ids:
            raise HTTPException(status_code=422, detail="Select at least one trainee")
        stats = await tm.compute_stats(db, trainer.id, [body.batch_id])
        bad = [t for t in body.trainee_ids if t not in stats]
        if bad:
            raise HTTPException(status_code=403, detail="Some trainees are not in this batch")
        trainee_ids = [str(t) for t in dict.fromkeys(body.trainee_ids)]
    a = Announcement(title=body.title.strip(), message=body.message.strip(), audience_type=body.audience_type,
                     batch_id=body.batch_id, course_id=course_id, trainee_ids=trainee_ids, status=body.status,
                     created_by=trainer.id, created_at=datetime.now(timezone.utc))
    db.add(a)
    await db.commit()
    return {"id": str(a.id), "status": a.status, "created_at": _iso(a.created_at)}
