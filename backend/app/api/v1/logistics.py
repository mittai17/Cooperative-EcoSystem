import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.deps import require_roles, org_scope, assert_org_access
from app.models.user import User
from app.models.logistics import LogisticsTask, VehicleAllocation, LogisticsBudget
from app.models.programme import Programme
from app.schemas.logistics import LogisticsTaskCreate, LogisticsTaskUpdate

router = APIRouter()


def programme_code(title: str) -> str:
    """Derive a short display code from a programme title, e.g. "Cooperative
    Management Fundamentals" -> "CMF". Purely cosmetic; never persisted as an
    identifier — programmes are always addressed by their real UUID."""
    words = [w for w in title.replace("&", " ").replace("-", " ").split() if w[:1].isalpha()]
    letters = "".join(w[0].upper() for w in words[:4])
    return letters[:4] or "GEN"


def _task_dict(t: LogisticsTask) -> dict:
    return {
        "id": str(t.id),
        "title": t.title,
        "category": t.category,
        "programme": t.programme,
        "programmeCode": t.programme_code,
        "batchCode": t.batch_code,
        "dueDate": t.due_date.isoformat() if t.due_date else None,
        "owner": t.owner,
        "done": t.done,
        "estimatedCost": t.estimated_cost,
    }


def _vehicle_dict(v: VehicleAllocation) -> dict:
    return {
        "id": str(v.id),
        "vehicleNo": v.vehicle_no,
        "type": v.type,
        "seats": v.seats,
        "route": v.route,
        "batchCode": v.batch_code,
        "pickUpPoint": v.pick_up_point,
        "departure": v.departure,
        "driver": v.driver,
        "driverPhone": v.driver_phone,
        "status": v.status,
    }


@router.get("/")
async def get_logistics(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("institution", "admin"))):
    scope = org_scope(user)
    def scoped(model):
        query = select(model)
        return query.where(model.organisation_id == scope) if scope is not None else query

    tasks_result = await db.execute(scoped(LogisticsTask).order_by(LogisticsTask.due_date))
    tasks = tasks_result.scalars().all()

    vehicles_result = await db.execute(scoped(VehicleAllocation).order_by(VehicleAllocation.vehicle_no))
    vehicles = vehicles_result.scalars().all()

    budget_result = await db.execute(scoped(LogisticsBudget).limit(1))
    budget = budget_result.scalars().first()

    prog_result = await db.execute(scoped(Programme).where(Programme.is_active == True))
    programmes = prog_result.scalars().all()

    return {
        "tasks": [_task_dict(t) for t in tasks],
        "vehicles": [_vehicle_dict(v) for v in vehicles],
        "contingencyReserve": budget.contingency_reserve if budget else 0,
        "programmes": [
            {"id": str(p.id), "code": programme_code(p.title), "title": p.title}
            for p in programmes
        ],
    }


@router.post("/tasks")
async def create_task(data: LogisticsTaskCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("institution", "admin"))):
    try:
        prog_uuid = uuid.UUID(data.programme_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="programme_id must be a valid UUID")

    result = await db.execute(select(Programme).where(Programme.id == prog_uuid))
    programme = result.scalar_one_or_none()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")

    assert_org_access(user, programme.organisation_id)

    try:
        due = date.fromisoformat(data.due_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="due_date must be an ISO date (YYYY-MM-DD)")

    task = LogisticsTask(
        id=uuid.uuid4(),
        organisation_id=programme.organisation_id,
        programme_id=programme.id,
        programme=programme.title,
        programme_code=programme_code(programme.title),
        category=data.category,
        title=data.title.strip(),
        due_date=due,
        owner=data.owner.strip(),
        done=False,
        estimated_cost=data.estimated_cost,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _task_dict(task)


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, data: LogisticsTaskUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("institution", "admin"))):
    try:
        tid = uuid.UUID(task_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Task not found")

    result = await db.execute(select(LogisticsTask).where(LogisticsTask.id == tid))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    assert_org_access(user, task.organisation_id)
    task.done = data.done
    await db.commit()
    await db.refresh(task)
    return _task_dict(task)
