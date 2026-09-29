"""Consent, supervised enrolment, and deletion of biometric templates."""
from datetime import datetime, timezone
import uuid
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_roles, require_user
from app.models.face import FaceEvent, FaceTemplate
from app.models.user import User
from app.services.face import MODEL_VERSION, frame_features, mean_embedding

router = APIRouter()
CONSENT_VERSION = "1"


class ConsentRequest(BaseModel):
    granted: bool
    version: str = Field(min_length=1, max_length=20)


async def template_for(db: AsyncSession, user_id: uuid.UUID) -> FaceTemplate | None:
    return (await db.execute(select(FaceTemplate).where(FaceTemplate.user_id == user_id))).scalar_one_or_none()


def event(user_id: uuid.UUID, actor_id: uuid.UUID, event_type: str, outcome: str) -> FaceEvent:
    return FaceEvent(user_id=user_id, actor_id=actor_id, event_type=event_type, outcome=outcome)


@router.post("/consent")
async def face_consent(data: ConsentRequest, actor: User = Depends(require_roles("trainee")), db: AsyncSession = Depends(get_db)):
    if data.version != CONSENT_VERSION:
        raise HTTPException(422, "Unsupported consent version")
    template = await template_for(db, actor.id)
    if template is None:
        template = FaceTemplate(user_id=actor.id)
        db.add(template)
    now = datetime.now(timezone.utc)
    if data.granted:
        template.consent_version = data.version
        template.consent_at = now
        template.revoked_at = None
    else:
        template.embedding = None
        template.enrolled_at = None
        template.consent_version = None
        template.consent_at = None
        template.revoked_at = now
    db.add(event(actor.id, actor.id, "consent", "ok" if data.granted else "revoked"))
    await db.commit()
    return {"granted": data.granted, "version": data.version}


@router.get("/status/me")
async def face_status(actor: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    template = await template_for(db, actor.id)
    consent = bool(template and template.consent_at and not template.revoked_at)
    return {"enrolled": bool(consent and template.embedding is not None),
            "enrolled_at": template.enrolled_at if template and consent else None,
            "model_version": template.model_version if template and consent else None,
            "consent": consent, "consent_version": template.consent_version if consent else None}


@router.post("/enroll")
async def face_enroll(trainee_id: uuid.UUID = Form(...),
    frames: list[UploadFile] = File(...), actor: User = Depends(require_roles("trainer", "institution", "admin")),
    db: AsyncSession = Depends(get_db)):
    trainee = (await db.execute(select(User).where(User.id == trainee_id, User.role == "trainee"))).scalar_one_or_none()
    if not trainee:
        raise HTTPException(404, "Trainee not found")
    if actor.role != "admin" and (not actor.organisation_id or trainee.organisation_id != actor.organisation_id):
        raise HTTPException(403, "Trainee belongs to a different organisation")
    template = await template_for(db, trainee_id)
    if not template or not template.consent_at or template.revoked_at or template.consent_version != CONSENT_VERSION:
        raise HTTPException(403, "Current trainee consent is required")
    if len(frames) != 3:
        raise HTTPException(422, "Three face frames are required")
    features = []
    allowed_types = ("image/jpeg", "image/png", "image/webp", "application/json", "application/octet-stream", "text/plain")
    for frame in frames:
        if frame.content_type not in allowed_types:
            raise HTTPException(422, "Unsupported image type")
        features.append(frame_features(await frame.read(2_000_001))[0])
    template.embedding = mean_embedding(features)
    template.model_version = MODEL_VERSION
    template.enrolled_at = datetime.now(timezone.utc)
    template.enrolled_by = actor.id
    template.self_enrolled = False
    db.add(event(trainee_id, actor.id, "enroll", "ok"))
    await db.commit()
    return {"enrolled": True, "user_id": str(trainee_id), "model_version": MODEL_VERSION}


@router.delete("/me")
async def revoke_face(actor: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    template = await template_for(db, actor.id)
    if template:
        template.embedding = None
        template.enrolled_at = None
        template.consent_at = None
        template.consent_version = None
        template.revoked_at = datetime.now(timezone.utc)
        db.add(event(actor.id, actor.id, "revoke", "ok"))
        await db.commit()
    return {"revoked": True}


@router.post("/challenge")
async def face_challenge(actor: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    sequence = ["centre", "left", "right"]
    if secrets.randbelow(2):
        sequence[1], sequence[2] = sequence[2], sequence[1]
    challenge = FaceEvent(user_id=actor.id, actor_id=actor.id, event_type="challenge",
        outcome="issued", details={"sequence": sequence, "expires_at":
            (datetime.now(timezone.utc) + timedelta(seconds=60)).isoformat()})
    db.add(challenge)
    await db.commit()
    return {"challenge_id": str(challenge.id), "sequence": sequence, "expires_in": 60}
