"""Authenticated inbox and device registration; identity always comes from JWT."""
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.deps import require_user
from app.models.notification import Notification, PushToken
from app.models.user import User

router = APIRouter()


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    kind: str
    title: str | None
    body: str | None
    payload: dict | None
    read_at: datetime | None
    created_at: datetime


class DeviceRegistration(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    token: str = Field(min_length=1, max_length=512)
    provider: Literal["expo", "fcm"] = "expo"
    platform: Literal["android", "ios", "web"] | None = None


@router.get("")
async def inbox(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
                unread_only: bool = False, user: User = Depends(require_user),
                db: AsyncSession = Depends(get_db)):
    filters = [Notification.user_id == user.id]
    if unread_only:
        filters.append(Notification.read_at.is_(None))
    rows = (await db.execute(select(Notification).where(*filters).order_by(
        Notification.created_at.desc(), Notification.id.desc()).limit(limit).offset(offset))).scalars().all()
    unread_count = (await db.execute(select(func.count()).select_from(Notification).where(
        Notification.user_id == user.id, Notification.read_at.is_(None)))).scalar_one()
    return {"items": [NotificationOut.model_validate(row) for row in rows],
            "unread_count": unread_count, "limit": limit, "offset": offset}


@router.post("/devices", status_code=201)
async def register_device(body: DeviceRegistration, user: User = Depends(require_user),
                          db: AsyncSession = Depends(get_db)):
    # Atomic upsert makes retries safe and transfers a shared device on login.
    now = datetime.now(timezone.utc)
    statement = insert(PushToken).values(user_id=user.id, token=body.token,
        provider=body.provider, platform=body.platform, last_seen_at=now)
    statement = statement.on_conflict_do_update(index_elements=[PushToken.token], set_={
        "user_id": user.id, "provider": body.provider, "platform": body.platform,
        "last_seen_at": now}).returning(PushToken.id)
    device_id = (await db.execute(statement)).scalar_one()
    await db.commit()
    return {"id": device_id, "registered": True, "remote_push_available": False}


@router.delete("/devices/{device_id}", status_code=204)
async def unregister_device(device_id: UUID, user: User = Depends(require_user),
                            db: AsyncSession = Depends(get_db)):
    await db.execute(delete(PushToken).where(PushToken.id == device_id, PushToken.user_id == user.id))
    await db.commit()
    return Response(status_code=204)


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(notification_id: UUID, user: User = Depends(require_user),
                    db: AsyncSession = Depends(get_db)):
    notification = (await db.execute(select(Notification).where(
        Notification.id == notification_id, Notification.user_id == user.id).with_for_update())).scalar_one_or_none()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        await db.commit()
    return notification
