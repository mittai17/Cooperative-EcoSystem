"""Learning progress tracking, event telemetry, and DIKSHA-connected assessment & certification."""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import hmac
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.deps import require_user
from app.models.certificate import Certificate
from app.models.learning import LearningEvent, LearningProgress, LearningResource
from app.models.user import User
from app.services.certificate_service import certificate_digest, generate_verification_code
from app.services.skill_engine import level_for_score, upsert_trainee_skill
from integrations.diksha import (
    DikshaNotFound,
    DikshaUnavailable,
    LearningResourceModel,
    diksha_service,
)

router = APIRouter()


def _now() -> datetime:
    return datetime.now(timezone.utc)


# -------------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------------

class ProgressUpdateRequest(BaseModel):
    content_id: str
    course_id: Optional[str] = None
    source: str = "DIKSHA"
    last_position: int = Field(default=0, ge=0)
    completion_percentage: int = Field(default=0, ge=0, le=100)
    time_spent_seconds: int = Field(default=0, ge=0)
    completed: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LearningEventRequest(BaseModel):
    content_id: Optional[str] = None
    course_id: Optional[str] = None
    event_type: str = Field(
        ...,
        description="CONTENT_OPENED | CONTENT_STARTED | CONTENT_PAUSED | CONTENT_RESUMED | CONTENT_PROGRESS | CONTENT_COMPLETED | LESSON_COMPLETED | COURSE_STARTED | COURSE_COMPLETED | ASSESSMENT_STARTED | ASSESSMENT_SUBMITTED | ASSESSMENT_PASSED | ASSESSMENT_FAILED | CERTIFICATE_ISSUED",
    )
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AssessmentAnswerSubmission(BaseModel):
    answers: Dict[str, Any]  # question_id -> option_id or list
    time_spent_seconds: int = Field(default=0, ge=0)


# -------------------------------------------------------------------------
# Helper: get or persist resource
# -------------------------------------------------------------------------

async def get_or_import_resource(
    db: AsyncSession, content_id: str
) -> Optional[LearningResource]:
    result = await db.execute(
        select(LearningResource).where(
            LearningResource.external_id == content_id,
            LearningResource.source == "DIKSHA",
        )
    )
    resource = result.scalar_one_or_none()
    if resource is not None:
        return resource

    # Try fetching from DIKSHA service
    try:
        norm = await diksha_service.get_resource_details(content_id)
    except (DikshaNotFound, DikshaUnavailable):
        return None
    except Exception:
        return None

    resource = LearningResource(
        id=uuid.uuid4(),
        external_id=norm.external_id,
        source="DIKSHA",
        title=norm.title,
        description=norm.description,
        thumbnail_url=norm.thumbnail_url,
        language=norm.language,
        content_type=norm.content_type,
        duration=norm.duration,
        author=norm.author,
        organization=norm.organization,
        license=norm.license,
        license_url=norm.license_url,
        attribution=norm.attribution,
        license_status=norm.license_status.value if hasattr(norm.license_status, "value") else str(norm.license_status),
        embedding_allowed=norm.embedding_allowed,
        commercial_use_allowed=norm.commercial_use_allowed,
        modification_allowed=norm.modification_allowed,
        source_url=norm.source_url,
        player_url=norm.player_url,
        extra_metadata=norm.metadata,
    )
    db.add(resource)
    await db.flush()
    return resource


# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------

@router.get("/resources/{content_id}")
async def get_resource_endpoint(
    content_id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves normalized resource details, fetching from DIKSHA if not yet stored."""
    resource = await get_or_import_resource(db, content_id)
    if resource is None:
        raise HTTPException(status_code=404, detail="Educational resource not found")

    return {
        "id": str(resource.id),
        "external_id": resource.external_id,
        "source": resource.source,
        "title": resource.title,
        "description": resource.description,
        "thumbnail_url": resource.thumbnail_url,
        "language": resource.language,
        "content_type": resource.content_type,
        "duration": resource.duration,
        "author": resource.author,
        "organization": resource.organization,
        "license": resource.license,
        "license_url": resource.license_url,
        "attribution": resource.attribution,
        "license_status": resource.license_status,
        "embedding_allowed": resource.embedding_allowed,
        "source_url": resource.source_url,
        "player_url": resource.player_url,
        "metadata": resource.extra_metadata,
    }


@router.post("/progress")
async def update_learning_progress(
    data: ProgressUpdateRequest,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Records or updates a user's progress on an educational resource."""
    course_uuid = None
    if data.course_id:
        try:
            course_uuid = uuid.UUID(data.course_id)
        except (ValueError, TypeError):
            pass

    # Ensure resource is cached in CoopSetu
    await get_or_import_resource(db, data.content_id)

    # Check existing progress
    stmt = select(LearningProgress).where(
        LearningProgress.user_id == user.id,
        LearningProgress.content_id == data.content_id,
    )
    progress_row = (await db.execute(stmt)).scalar_one_or_none()

    now = _now()
    is_newly_completed = False

    if progress_row is None:
        completed = data.completed or data.completion_percentage >= 90
        progress_row = LearningProgress(
            id=uuid.uuid4(),
            user_id=user.id,
            course_id=course_uuid,
            content_id=data.content_id,
            source=data.source,
            started_at=now,
            last_accessed_at=now,
            last_position=data.last_position,
            completion_percentage=data.completion_percentage,
            time_spent_seconds=data.time_spent_seconds,
            completed=completed,
            completed_at=now if completed else None,
            attempt_count=1,
            extra_metadata=data.metadata,
        )
        db.add(progress_row)
        if completed:
            is_newly_completed = True
    else:
        # Never un-complete a previously completed resource
        was_completed = progress_row.completed
        new_completed = was_completed or data.completed or data.completion_percentage >= 90

        progress_row.last_accessed_at = now
        progress_row.last_position = max(progress_row.last_position, data.last_position)
        progress_row.completion_percentage = max(
            progress_row.completion_percentage, data.completion_percentage
        )
        progress_row.time_spent_seconds += data.time_spent_seconds
        progress_row.completed = new_completed
        if new_completed and not progress_row.completed_at:
            progress_row.completed_at = now
            is_newly_completed = True
        if data.metadata:
            merged = dict(progress_row.extra_metadata or {})
            merged.update(data.metadata)
            progress_row.extra_metadata = merged

    # If completed, emit event
    if is_newly_completed:
        db.add(
            LearningEvent(
                id=uuid.uuid4(),
                user_id=user.id,
                content_id=data.content_id,
                course_id=course_uuid,
                event_type="CONTENT_COMPLETED",
                timestamp=now,
                extra_metadata={
                    "completion_percentage": progress_row.completion_percentage,
                    "time_spent_seconds": progress_row.time_spent_seconds,
                },
            )
        )

    await db.commit()
    return {
        "status": "success",
        "content_id": data.content_id,
        "completion_percentage": progress_row.completion_percentage,
        "completed": progress_row.completed,
        "last_position": progress_row.last_position,
        "time_spent_seconds": progress_row.time_spent_seconds,
    }


@router.get("/progress/{content_id}")
async def get_learning_progress(
    content_id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves the caller's current learning progress on a resource."""
    stmt = select(LearningProgress).where(
        LearningProgress.user_id == user.id,
        LearningProgress.content_id == content_id,
    )
    progress_row = (await db.execute(stmt)).scalar_one_or_none()

    if progress_row is None:
        return {
            "content_id": content_id,
            "completion_percentage": 0,
            "last_position": 0,
            "completed": False,
            "time_spent_seconds": 0,
        }

    return {
        "content_id": content_id,
        "completion_percentage": progress_row.completion_percentage,
        "last_position": progress_row.last_position,
        "completed": progress_row.completed,
        "completed_at": progress_row.completed_at.isoformat() if progress_row.completed_at else None,
        "time_spent_seconds": progress_row.time_spent_seconds,
        "started_at": progress_row.started_at.isoformat() if progress_row.started_at else None,
    }


@router.post("/events")
async def record_learning_event(
    event: LearningEventRequest,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Records an educational telemetry event."""
    course_uuid = None
    if event.course_id:
        try:
            course_uuid = uuid.UUID(event.course_id)
        except (ValueError, TypeError):
            pass

    log_entry = LearningEvent(
        id=uuid.uuid4(),
        user_id=user.id,
        content_id=event.content_id,
        course_id=course_uuid,
        event_type=event.event_type.upper(),
        timestamp=_now(),
        extra_metadata=event.metadata,
    )
    db.add(log_entry)
    await db.commit()
    return {"status": "recorded", "event_id": str(log_entry.id)}


@router.get("/history")
async def get_learning_history(
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves full learning history for Trainee Profile and Skill Passport."""
    progress_records = (
        await db.execute(
            select(LearningProgress)
            .where(LearningProgress.user_id == user.id)
            .order_by(desc(LearningProgress.last_accessed_at))
        )
    ).scalars().all()

    content_ids = [p.content_id for p in progress_records]
    resources = {}
    if content_ids:
        res_rows = (
            await db.execute(
                select(LearningResource).where(LearningResource.external_id.in_(content_ids))
            )
        ).scalars().all()
        resources = {r.external_id: r for r in res_rows}

    items = []
    total_time_spent = 0
    completed_count = 0

    for p in progress_records:
        r = resources.get(p.content_id)
        total_time_spent += p.time_spent_seconds
        if p.completed:
            completed_count += 1
        items.append({
            "content_id": p.content_id,
            "title": r.title if r else f"Resource {p.content_id}",
            "content_type": r.content_type if r else "video",
            "thumbnail_url": r.thumbnail_url if r else None,
            "source": p.source,
            "completion_percentage": p.completion_percentage,
            "completed": p.completed,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None,
            "time_spent_seconds": p.time_spent_seconds,
            "last_accessed_at": p.last_accessed_at.isoformat() if p.last_accessed_at else None,
            "attribution": r.attribution if r else None,
            "license": r.license if r else None,
        })

    return {
        "total_enrolled": len(items),
        "total_completed": completed_count,
        "total_time_spent_seconds": total_time_spent,
        "items": items,
    }


# -------------------------------------------------------------------------
# Assessment & Certification for DIKSHA Content
# -------------------------------------------------------------------------

@router.get("/content/{content_id}/assessment")
async def get_content_assessment(
    content_id: str,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Generates or retrieves a knowledge assessment for the DIKSHA learning resource."""
    resource = await get_or_import_resource(db, content_id)
    title = resource.title if resource else "Cooperative Principles & Operations"
    subject = (resource.extra_metadata or {}).get("subject", "Cooperative Studies") if resource else "Cooperative Studies"

    questions = [
        {
            "id": "q1",
            "position": 1,
            "prompt": f"Which fundamental principle is highlighted in the study of {title}?",
            "options": [
                {"id": "a", "text": "Democratic Member Control & Mutual Benefit"},
                {"id": "b", "text": "Maximizing Sole Private Capital Gain"},
                {"id": "c", "text": "Elimination of Member Voting Rights"},
                {"id": "d", "text": "Exclusion of Cooperative Federations"},
            ],
            "topic": subject,
        },
        {
            "id": "q2",
            "position": 2,
            "prompt": "How does digital record-keeping impact primary cooperative societies (PACS)?",
            "options": [
                {"id": "a", "text": "Increases transparency, auditability, and speed of member loan clearance"},
                {"id": "b", "text": "Forces the society to shut down all physical operations"},
                {"id": "c", "text": "Prevents members from inspecting annual accounting records"},
                {"id": "d", "text": "Eliminates all governance responsibilities"},
            ],
            "topic": "Cooperative Governance",
        },
        {
            "id": "q3",
            "position": 3,
            "prompt": "Under national cooperative training standards (NCCT), what ensures continuous skill development?",
            "options": [
                {"id": "a", "text": "Periodic modular assessments linked to verifiable Skill Passports"},
                {"id": "b", "text": "One-time attendance without evaluation or verification"},
                {"id": "c", "text": "Ignoring statutory cooperative bylaws"},
                {"id": "d", "text": "Restricting learning to paper registers only"},
            ],
            "topic": "Skill Standards",
        },
        {
            "id": "q4",
            "position": 4,
            "prompt": "What role does member education play in the sustained success of a cooperative?",
            "options": [
                {"id": "a", "text": "It strengthens informed participation, governance, and business viability"},
                {"id": "b", "text": "It has no impact on cooperative sustainability"},
                {"id": "c", "text": "It is discouraged by the International Cooperative Alliance"},
                {"id": "d", "text": "It replaces financial auditing requirements"},
            ],
            "topic": "Cooperative Education",
        },
    ]

    return {
        "content_id": content_id,
        "title": f"Knowledge Assessment: {title}",
        "subject": subject,
        "total_questions": len(questions),
        "passing_score": 75,
        "duration_minutes": 15,
        "questions": questions,
    }


@router.post("/content/{content_id}/evaluate-assessment")
async def evaluate_content_assessment(
    content_id: str,
    submission: AssessmentAnswerSubmission,
    user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    """Evaluates the trainee's assessment answers, updates Skill Passport, and generates a certificate upon passing."""
    resource = await get_or_import_resource(db, content_id)
    resource_title = resource.title if resource else "Cooperative Study"
    subject = (resource.extra_metadata or {}).get("subject", "Cooperative Management") if resource else "Cooperative Management"

    # Answer key
    correct_answers = {
        "q1": "a",
        "q2": "a",
        "q3": "a",
        "q4": "a",
    }

    correct_count = 0
    total = len(correct_answers)

    for qid, correct_opt in correct_answers.items():
        ans = submission.answers.get(qid)
        if ans == correct_opt or (isinstance(ans, list) and correct_opt in ans):
            correct_count += 1

    score = int(round((correct_count / total) * 100))
    passed = score >= 75
    now = _now()

    # Track assessment events
    db.add(
        LearningEvent(
            id=uuid.uuid4(),
            user_id=user.id,
            content_id=content_id,
            event_type="ASSESSMENT_PASSED" if passed else "ASSESSMENT_FAILED",
            timestamp=now,
            extra_metadata={
                "score": score,
                "passed": passed,
                "time_spent_seconds": submission.time_spent_seconds,
            },
        )
    )

    certificate_info = None
    skill_updated = None

    if passed:
        # 1. Update Trainee Skill Passport (upsert_trainee_skill)
        skill_name = subject if subject and subject != "General" else "Cooperative Management"
        proficiency_level = level_for_score(score)

        await upsert_trainee_skill(
            db=db,
            trainee_id=user.id,
            skill_name=skill_name,
            confidence=score,
            level=proficiency_level,
            verified=True,
            evidence_item={
                "type": "DIKSHA Educational Assessment",
                "title": f"Course: {resource_title}",
                "score": score,
                "content_id": content_id,
                "source": "DIKSHA / CoopSetu AI",
            },
            category="Cooperative Operations",
        )
        skill_updated = {"name": skill_name, "level": proficiency_level, "score": score}

        # 2. Issue CoopSetu verified Certificate
        verification_code = generate_verification_code()
        cert_id = uuid.uuid4()
        cert = Certificate(
            id=cert_id,
            trainee_id=user.id,
            programme_id=None,
            verification_code=verification_code,
            issue_date=now,
            status="valid",
            grade="Distinction" if score >= 90 else "Merit" if score >= 80 else "Pass",
            holder_name=user.full_name or "Trainee",
            programme_title=f"DIKSHA Certified: {resource_title}",
            issuer="CoopSetu AI National Cooperative Learning Platform",
            skills_certified=[skill_name],
            created_at=now,
        )

        cert.content_hash = certificate_digest(cert)
        db.add(cert)

        # 3. Mark progress as completed
        stmt = select(LearningProgress).where(
            LearningProgress.user_id == user.id,
            LearningProgress.content_id == content_id,
        )
        prog = (await db.execute(stmt)).scalar_one_or_none()
        if prog:
            prog.completed = True
            prog.completion_percentage = 100
            prog.completed_at = now

        db.add(
            LearningEvent(
                id=uuid.uuid4(),
                user_id=user.id,
                content_id=content_id,
                event_type="CERTIFICATE_ISSUED",
                timestamp=now,
                extra_metadata={
                    "verification_code": verification_code,
                    "grade": cert.grade,
                },
            )
        )

        certificate_info = {
            "id": str(cert.id),
            "verification_code": verification_code,
            "holder_name": cert.holder_name,
            "course_title": cert.programme_title,
            "grade": cert.grade,
            "issue_date": now.isoformat(),
            "verify_url": f"/verify-certificate/{verification_code}",
        }

    await db.commit()

    return {
        "passed": passed,
        "score": score,
        "correct_answers": correct_count,
        "total_questions": total,
        "skill_updated": skill_updated,
        "certificate": certificate_info,
    }
