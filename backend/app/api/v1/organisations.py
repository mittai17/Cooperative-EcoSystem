import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import assert_org_access, org_scope, require_roles, require_user
from app.models.programme import Programme
from app.models.user import Organisation, User
from app.schemas.organisation import OrganisationCreate
from app.schemas.user import OrganisationUpdateRequest

router = APIRouter()
PROFILE_FIELDS = ("name", "type", "state", "address", "district", "pincode", "phone", "email",
                  "website", "accreditation_number", "logo_url")


def profile(org: Organisation) -> dict:
    return {"id": str(org.id), "is_active": org.is_active, **{field: getattr(org, field) for field in PROFILE_FIELDS}}


async def load_org(db: AsyncSession, organisation_id: uuid.UUID, user: User) -> Organisation:
    assert_org_access(user, organisation_id)
    org = (await db.execute(select(Organisation).where(Organisation.id == organisation_id))).scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organisation not found")
    return org


async def _counts_for(db: AsyncSession, org_ids: list) -> tuple[dict, dict]:
    """Active-programme and trainee headcounts per organisation, batched."""
    if not org_ids:
        return {}, {}
    programme_rows = (await db.execute(
        select(Programme.organisation_id, func.count(Programme.id))
        .where(Programme.organisation_id.in_(org_ids), Programme.is_active == True)  # noqa: E712
        .group_by(Programme.organisation_id)
    )).all()
    trainee_rows = (await db.execute(
        select(User.organisation_id, func.count(User.id))
        .where(User.organisation_id.in_(org_ids), User.role == "trainee")
        .group_by(User.organisation_id)
    )).all()
    return {row[0]: row[1] for row in programme_rows}, {row[0]: row[1] for row in trainee_rows}


@router.get("/")
async def list_organisations(
    include_inactive: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Admin/ncct_admin see every institution; any org-scoped role (institution,
    trainer, employer) sees only their own organisation. org_scope() 403s a
    non-global user with no organisation, which is the correct fail-closed
    behaviour here too."""
    scope = org_scope(user)
    stmt = select(Organisation)
    if scope is not None:
        stmt = stmt.where(Organisation.id == scope)
    if not include_inactive:
        stmt = stmt.where(Organisation.is_active == True)  # noqa: E712
    orgs = (await db.execute(stmt.order_by(Organisation.name.asc()))).scalars().all()

    programme_counts, trainee_counts = await _counts_for(db, [org.id for org in orgs])
    return [
        {**profile(org), "programme_count": programme_counts.get(org.id, 0),
         "trainee_count": trainee_counts.get(org.id, 0)}
        for org in orgs
    ]


@router.post("/", status_code=201)
async def create_organisation(
    data: OrganisationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    org = Organisation(id=uuid.uuid4(), is_active=True, **data.model_dump(mode="json", exclude_none=True))
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return {**profile(org), "programme_count": 0, "trainee_count": 0}


@router.get("/{organisation_id}")
async def get_organisation(organisation_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require_user)):
    return profile(await load_org(db, organisation_id, user))


@router.post("/{organisation_id}/deactivate")
async def deactivate_organisation(
    organisation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    """Soft-delete only: flips is_active off. Refuses (409) while the
    organisation still has any trainee or active programme attached, so an
    institution's records are never orphaned by a deactivation. Idempotent:
    deactivating an already-inactive organisation is a no-op 200, not an error."""
    org = (await db.execute(select(Organisation).where(Organisation.id == organisation_id))).scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organisation not found")
    if not org.is_active:
        return {**profile(org), "programme_count": 0, "trainee_count": 0}

    trainee_count = (await db.execute(
        select(func.count(User.id)).where(User.organisation_id == organisation_id, User.role == "trainee")
    )).scalar_one()
    programme_count = (await db.execute(
        select(func.count(Programme.id)).where(Programme.organisation_id == organisation_id, Programme.is_active == True)  # noqa: E712
    )).scalar_one()
    if trainee_count > 0 or programme_count > 0:
        raise HTTPException(
            status_code=409,
            detail=(f"Cannot deactivate: {trainee_count} trainee(s) and {programme_count} active "
                    "programme(s) are still attached to this organisation"),
        )

    org.is_active = False
    await db.commit()
    await db.refresh(org)
    return {**profile(org), "programme_count": 0, "trainee_count": 0}


@router.patch("/{organisation_id}")
async def update_organisation(organisation_id: uuid.UUID, data: OrganisationUpdateRequest,
                              db: AsyncSession = Depends(get_db),
                              user: User = Depends(require_roles("institution", "employer", "admin"))):
    org = await load_org(db, organisation_id, user)
    values = data.model_dump(mode="json", exclude_unset=True)
    if "name" in values and not (values["name"] or "").strip():
        raise HTTPException(status_code=422, detail="Organisation name cannot be empty")
    for field, value in values.items():
        setattr(org, field, value)
    await db.commit()
    await db.refresh(org)
    return profile(org)
