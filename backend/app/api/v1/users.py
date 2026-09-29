import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import assert_org_access, org_scope, require_roles, require_user
from app.models.profile import UserProfile
from app.models.programme import Batch, Enrollment, Programme
from app.models.user import Organisation, PENDING_CLERK_PREFIX, User, is_pending_clerk_link
from app.schemas.user import ProfileUpdateRequest, UserAdminUpdateRequest, UserCreateRequest, UserUpdateRequest

router = APIRouter()
UserUpdate = UserUpdateRequest


def profile(user: User, *, private: bool = False) -> dict:
    result = {
        "id": str(user.id),
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "pending_clerk_link": is_pending_clerk_link(user.clerk_user_id),
    }
    if private:
        result.update(email=user.email, preferred_language=user.preferred_language,
                      career_target_role=user.career_target_role,
                      organisation_id=str(user.organisation_id) if user.organisation_id else None)
    return result


async def _enrich_trainees(db: AsyncSession, rows: list[User]) -> dict:
    """Most recent batch/programme for each trainee row, for roster display."""
    trainee_ids = [row.id for row in rows if row.role == "trainee"]
    if not trainee_ids:
        return {}
    result = await db.execute(
        select(Enrollment.trainee_id, Batch.id, Batch.name, Programme.id, Programme.title)
        .join(Batch, Enrollment.batch_id == Batch.id)
        .join(Programme, Batch.programme_id == Programme.id)
        .where(Enrollment.trainee_id.in_(trainee_ids))
        .order_by(Enrollment.enrolled_at.desc())
    )
    out: dict = {}
    for trainee_id, batch_id, batch_name, programme_id, programme_title in result.all():
        out.setdefault(trainee_id, {
            "batch_id": str(batch_id), "batch": batch_name,
            "programme_id": str(programme_id), "programme": programme_title,
        })
    return out


async def _enrich_trainers(db: AsyncSession, rows: list[User]) -> dict:
    trainer_ids = [row.id for row in rows if row.role == "trainer"]
    if not trainer_ids:
        return {}
    result = await db.execute(select(UserProfile).where(UserProfile.user_id.in_(trainer_ids)))
    return {p.user_id: {"qualification": p.qualification, "expertise": p.expertise or []} for p in result.scalars().all()}


async def _serialize_roster(db: AsyncSession, rows: list[User], viewer: User) -> list[dict]:
    trainee_map = await _enrich_trainees(db, rows)
    trainer_map = await _enrich_trainers(db, rows)
    out = []
    for row in rows:
        item = profile(row, private=row.id == viewer.id or viewer.role == "admin")
        item.update(trainee_map.get(row.id, {}))
        item.update(trainer_map.get(row.id, {}))
        out.append(item)
    return out


async def _load_batch_for_org(db: AsyncSession, batch_id: str, org_id: Optional[uuid.UUID]) -> Batch:
    try:
        bid = uuid.UUID(str(batch_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Invalid batch_id")
    result = await db.execute(
        select(Batch, Programme.organisation_id).join(Programme, Batch.programme_id == Programme.id).where(Batch.id == bid)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch, programme_org_id = row
    if org_id is not None and programme_org_id != org_id:
        raise HTTPException(status_code=403, detail="Batch belongs to a different organisation")
    return batch


@router.get("/me")
async def my_profile(user: User = Depends(require_user)):
    return profile(user, private=True)


@router.patch("/me")
async def update_profile(data: ProfileUpdateRequest, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return profile(user, private=True)


@router.post("/")
async def create_user(
    data: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles("institution", "admin")),
):
    """Institution-admin or admin creates a local trainee/trainer row under
    an organisation. The person doesn't need a Clerk account yet - see the
    `pending_clerk_link` note above `PENDING_CLERK_PREFIX`."""
    target_org_id: Optional[uuid.UUID] = None
    if actor.role == "institution":
        target_org_id = org_scope(actor)  # 403s if actor has no org
        if data.organisation_id and str(data.organisation_id) != str(target_org_id):
            raise HTTPException(status_code=403, detail="Cannot create a user in another organisation")
    else:  # admin
        if data.organisation_id:
            try:
                target_org_id = uuid.UUID(str(data.organisation_id))
            except (ValueError, TypeError):
                raise HTTPException(status_code=422, detail="Invalid organisation_id")
            org = await db.get(Organisation, target_org_id)
            if org is None:
                raise HTTPException(status_code=404, detail="Organisation not found")

    existing = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    batch = None
    if data.role == "trainee" and data.batch_id:
        batch = await _load_batch_for_org(db, data.batch_id, target_org_id)

    user = User(
        id=uuid.uuid4(),
        clerk_user_id=f"{PENDING_CLERK_PREFIX}{uuid.uuid4().hex}",
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        organisation_id=target_org_id,
        is_active=True,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    if data.role == "trainer" and (data.qualification or data.expertise):
        db.add(UserProfile(id=uuid.uuid4(), user_id=user.id, qualification=data.qualification, expertise=data.expertise))

    if batch is not None:
        db.add(Enrollment(id=uuid.uuid4(), trainee_id=user.id, batch_id=batch.id, status="active"))

    await db.commit()
    await db.refresh(user)
    result = profile(user, private=True)
    if batch is not None:
        result.update(batch_id=str(batch.id))
    return result


@router.get("/")
async def list_users(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None),
    organisation_id: Optional[uuid.UUID] = Query(None),
    q: Optional[str] = Query(None, max_length=255),
):
    query = select(User)
    if user.role not in ("admin", "ncct_admin"):
        if user.role in ("institution", "trainer", "employer") and user.organisation_id:
            query = query.where(User.organisation_id == user.organisation_id)
        else:
            query = query.where(User.id == user.id)
    elif organisation_id is not None:
        query = query.where(User.organisation_id == organisation_id)
    if role is not None:
        if role not in ("trainee", "trainer", "institution", "employer", "admin", "ncct_admin"):
            raise HTTPException(status_code=422, detail="Unknown role filter")
        query = query.where(User.role == role)
    if q:
        term = q.strip()
        if term:
            like = f"%{term}%"
            query = query.where(or_(User.full_name.ilike(like), User.email.ilike(like)))
    rows = (await db.execute(query.order_by(User.full_name, User.id).offset(skip).limit(limit))).scalars().all()
    return await _serialize_roster(db, rows, user)


@router.get("/batches")
async def list_assignable_batches(
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles("institution", "admin")),
    programme_id: Optional[uuid.UUID] = Query(None),
):
    """Batches an institution-admin may assign a new/existing trainee into
    (see `batch_id` on POST / and PATCH /{id}). Deliberately minimal and
    scoped to this router's own create/edit-trainee UI - the full
    programme/batch CRUD surface is owned separately by programmes.py, which
    has no org-scoped "list batches" endpoint of its own yet. Registered
    before `/{user_id}` so it isn't swallowed by that UUID route."""
    scope = org_scope(actor)
    query = select(Batch.id, Batch.name, Programme.id, Programme.title).join(Programme, Batch.programme_id == Programme.id)
    if scope is not None:
        query = query.where(Programme.organisation_id == scope)
    if programme_id is not None:
        query = query.where(Programme.id == programme_id)
    rows = (await db.execute(query.order_by(Programme.title, Batch.name))).all()
    return [
        {"id": str(batch_id), "name": batch_name, "programme_id": str(prog_id), "programme_title": prog_title}
        for batch_id, batch_name, prog_id, prog_title in rows
    ]


@router.get("/{user_id}")
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), actor: User = Depends(require_user)):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if actor.id != target.id and actor.role not in ("admin", "ncct_admin"):
        if actor.role not in ("institution", "trainer", "employer") or not actor.organisation_id or actor.organisation_id != target.organisation_id:
            raise HTTPException(status_code=403, detail="Cannot access this profile")
    return profile(target, private=actor.id == target.id or actor.role == "admin")


@router.patch("/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    data: UserAdminUpdateRequest,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_roles("admin", "institution")),
):
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    updates = data.model_dump(exclude_unset=True)

    if actor.role == "institution":
        # Institution admins may only edit trainees/trainers inside their own
        # organisation, and never through the `role` field - that stays
        # admin-only (Codex's fix): this is a widened caller list on the same
        # PATCH, not a relaxation of who may change `role`.
        assert_org_access(actor, target.organisation_id)
        if target.role not in ("trainee", "trainer"):
            raise HTTPException(status_code=403, detail="Institution admins may only manage trainees and trainers")
        if "role" in updates:
            raise HTTPException(status_code=403, detail="Role cannot be changed through this endpoint")

    if "role" in updates:
        if actor.role != "admin":
            raise HTTPException(status_code=403, detail="Only an admin may change a user's role")
        target.role = updates["role"]
    if "full_name" in updates:
        target.full_name = updates["full_name"]
    if "is_active" in updates:
        target.is_active = updates["is_active"]

    if "qualification" in updates or "expertise" in updates:
        prof = (await db.execute(select(UserProfile).where(UserProfile.user_id == target.id))).scalar_one_or_none()
        if prof is None:
            prof = UserProfile(id=uuid.uuid4(), user_id=target.id)
            db.add(prof)
        if "qualification" in updates:
            prof.qualification = updates["qualification"]
        if "expertise" in updates:
            prof.expertise = updates["expertise"]

    new_batch = None
    if updates.get("batch_id"):
        org_id = target.organisation_id if actor.role == "institution" else None
        new_batch = await _load_batch_for_org(db, updates["batch_id"], org_id)
        db.add(Enrollment(id=uuid.uuid4(), trainee_id=target.id, batch_id=new_batch.id, status="active"))

    await db.commit()
    await db.refresh(target)
    # Same email-visibility rule as GET /{id}/list: an institution-admin
    # editing a peer's non-role fields still doesn't get their email back
    # (Codex's fix scopes email exposure to the account owner and admin only).
    result = profile(target, private=actor.id == target.id or actor.role == "admin")
    if new_batch is not None:
        result.update(batch_id=str(new_batch.id))
    result["status"] = "updated"
    return result
