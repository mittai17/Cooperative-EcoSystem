"""Authenticated offline outbox receipts with server checked action semantics."""
from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_roles, get_optional_identity, AuthenticatedIdentity
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.course import Module, Lesson
from app.models.content import LessonProgress
from app.models.infra import SyncReceipt
from app.models.mobile import OfflinePackage
from app.models.user import User
from app.services.mobile import set_module_completion

router = APIRouter()


class OfflineSyncItem(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    action: Literal['MARK_LESSON_COMPLETE', 'RECORD_ATTENDANCE']
    payload: dict[str, Any]
    client_timestamp: datetime | None = None


class OfflineSyncBatchRequest(BaseModel):
    items: list[OfflineSyncItem] = Field(max_length=100)


def _time(value):
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _uuid(value):
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        raise ValueError('Invalid identifier')


async def _lesson(db: AsyncSession, user: User, payload: dict):
    identifier = _uuid(payload.get('lesson_id') or payload.get('module_id'))
    lesson = (await db.execute(select(Lesson).where(Lesson.id == identifier))).scalar_one_or_none()
    if lesson is not None:
        row = (await db.execute(select(LessonProgress).where(
            LessonProgress.trainee_id == user.id, LessonProgress.lesson_id == lesson.id
        ).with_for_update())).scalar_one_or_none()
        if row is None:
            db.add(LessonProgress(id=uuid4(), trainee_id=user.id, lesson_id=lesson.id,
                                  status='completed', completed_at=datetime.now(timezone.utc)))
        elif row.status != 'completed':
            row.status = 'completed'
            row.completed_at = datetime.now(timezone.utc)
        return {'lesson_id': str(lesson.id)}
    module = (await db.execute(select(Module).where(Module.id == identifier))).scalar_one_or_none()
    if module is None:
        raise ValueError('Lesson or module not found')
    await set_module_completion(db, user.id, module.id, True)
    return {'module_id': str(module.id)}


async def _attendance(db: AsyncSession, user: User, payload: dict, captured_at: datetime | None):
    raw = str(payload.get('qr_token', '')).strip()
    token = raw.removeprefix('coopsetu:attend:')
    session = (await db.execute(select(AttendanceSession).where(AttendanceSession.qr_token == token))).scalar_one_or_none()
    if session is None:
        raise ValueError('Attendance session not found')
    now = datetime.now(timezone.utc)
    if captured_at is None:
        raise ValueError('Capture time is required for offline attendance')
    captured_at = _time(captured_at)
    # Device clocks are untrusted. Future timestamps and stale uploads are held for review.
    if captured_at > now:
        raise ValueError('Capture time is in the future')
    opens = _time(session.opens_at or session.created_at)
    closes = _time(session.closes_at)
    if closes is None and opens is not None:
        from datetime import timedelta
        closes = opens + timedelta(minutes=session.valid_minutes or 30)
    if opens is None or closes is None or not (opens <= captured_at <= closes):
        raise ValueError('Scan was outside the attendance window')
    duplicate = (await db.execute(select(AttendanceRecord).where(
        AttendanceRecord.session_id == session.id, AttendanceRecord.trainee_id == user.id
    ))).scalar_one_or_none()
    if duplicate is not None:
        return {'session_id': str(session.id), 'already_recorded': True}
    db.add(AttendanceRecord(id=uuid4(), session_id=session.id, trainee_id=user.id,
                            marked_at=now, method='offline_sync_qr', status='present',
                            offline=True, needs_review=True, captured_at=captured_at))
    return {'session_id': str(session.id), 'needs_review': True}


@router.get('/status')
async def sync_status():
    return {'status': 'online', 'server_time': datetime.now(timezone.utc).isoformat(),
            'sync_supported': True,
            'supported_actions': ['MARK_LESSON_COMPLETE', 'RECORD_ATTENDANCE']}


@router.get('/pull')
async def pull_sync_data(
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Offline pull endpoint: returns server timestamp, active sync status, and downloadable packages."""
    now = datetime.now(timezone.utc)
    pkgs = list((await db.execute(select(OfflinePackage))).scalars().all())
    return {
        'status': 'online',
        'server_time': now.isoformat(),
        'sync_supported': True,
        'supported_actions': ['MARK_LESSON_COMPLETE', 'RECORD_ATTENDANCE'],
        'packages': [
            {'id': str(p.id), 'course_id': str(p.course_id), 'version': p.version, 'size_kb': p.size_kb}
            for p in pkgs
        ],
    }


@router.post('/batch')
@router.post('/push')
async def process_batch_sync(request: OfflineSyncBatchRequest,
                             user: User = Depends(require_roles('trainee', 'admin')),
                             db: AsyncSession = Depends(get_db)):
    results = []
    actor_id = user.id
    for item in request.items:
        receipt = (await db.execute(select(SyncReceipt).where(SyncReceipt.client_id == item.id))).scalar_one_or_none()
        if receipt is not None:
            if receipt.user_id != actor_id:
                results.append({'id': item.id, 'action': item.action, 'status': 'rejected',
                                'message': 'Receipt belongs to another user'})
            else:
                results.append({'id': item.id, 'action': item.action, 'status': 'duplicate',
                                'message': receipt.reason, 'data': receipt.response})
            continue
        try:
            async with db.begin_nested():
                if item.action == 'MARK_LESSON_COMPLETE':
                    data = await _lesson(db, user, item.payload)
                else:
                    captured = item.client_timestamp
                    if captured is None and item.payload.get('scanned_at'):
                        captured = datetime.fromisoformat(str(item.payload['scanned_at']))
                    data = await _attendance(db, user, item.payload, captured)
                db.add(SyncReceipt(id=uuid4(), client_id=item.id, user_id=actor_id,
                                   action=item.action, status='applied', response=data))
                await db.flush()
            await db.commit()
            results.append({'id': item.id, 'action': item.action, 'status': 'success', 'data': data})
        except (ValueError, TypeError) as exc:
            await db.rollback()
            reason = str(exc)
            db.add(SyncReceipt(id=uuid4(), client_id=item.id, user_id=actor_id,
                               action=item.action, status='rejected', reason=reason))
            await db.commit()
            results.append({'id': item.id, 'action': item.action, 'status': 'rejected', 'message': reason})
    return {'processed_count': len(results), 'results': results,
            'synced_at': datetime.now(timezone.utc).isoformat()}
