"""Transactional inbox delivery. Callers own commit/rollback.

Remote push delivery is not implemented; never mark an inbox event as sent
or queued solely because a device token exists.
"""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification


async def notify(db: AsyncSession, user_id: UUID, kind: str, payload: dict | None = None,
                 *, title: str | None = None, body: str | None = None) -> Notification:
    if not kind or len(kind) > 50:
        raise ValueError("Notification kind must contain 1 to 50 characters")
    if title is not None and len(title) > 255:
        raise ValueError("Notification title must not exceed 255 characters")
    notification = Notification(user_id=user_id, kind=kind, payload=payload,
                                title=title, body=body, push_status=None)
    db.add(notification)
    await db.flush()
    return notification
