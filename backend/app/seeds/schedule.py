"""Idempotent timetable and hostel expansion for the mobile "my schedule" /
"stay and travel" screens (see docs/MOBILE_COMPLETION_PLAN.md, feature 5).

Scope note: like app/seeds/profiles.py, this only touches real institutions
(Organisation.type == "institution", name not starting with "Test Org") and
real batches/trainers/trainees created by app/seed.py — never the ad hoc
organisations/users that test fixtures create on every run.
"""
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hostel import HostelBlock, HostelRoom, HostelWaitlistEntry
from app.models.programme import Batch, Programme
from app.models.timetable import TimetableSlot
from app.models.user import Organisation, User
from app.seed import bulk_sync
from app.seeds import register

MAX_TIMETABLE_BATCHES = 15
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIME_SLOTS = ["09:00 AM", "11:00 AM", "02:00 PM"]
TIME_MAP = {"09:00 AM": (time(9, 0), time(10, 30)),
            "11:00 AM": (time(11, 0), time(12, 30)),
            "02:00 PM": (time(14, 0), time(15, 30))}
ROOMS = ["Hall A", "Seminar Room 1", "Computer Lab", "Conference Room", "Field Study Centre"]


async def _seed_timetable(db: AsyncSession) -> None:
    rows = (await db.execute(
        select(Batch.id, Batch.name, Programme.id, Programme.title,
               Organisation.id, Organisation.name)
        .join(Programme, Programme.id == Batch.programme_id)
        .join(Organisation, Organisation.id == Programme.organisation_id)
        .where(Organisation.type == "institution", ~Organisation.name.like("Test Org%"))
        .order_by(Organisation.name, Batch.id)
    )).all()
    if not rows:
        return

    picked, seen_orgs = [], set()
    for batch_id, batch_name, prog_id, prog_title, org_id, org_name in rows:
        if org_id in seen_orgs:
            continue
        seen_orgs.add(org_id)
        picked.append((batch_id, prog_id, prog_title, org_id, org_name))
        if len(picked) >= MAX_TIMETABLE_BATCHES:
            break

    slot_rows = []
    for batch_id, prog_id, prog_title, org_id, org_name in picked:
        trainers = (await db.execute(
            select(User.id, User.full_name).where(User.role == "trainer", User.organisation_id == org_id)
            .order_by(User.email).limit(2)
        )).all()
        if not trainers:
            continue
        for day_idx, day in enumerate(WEEKDAYS):
            trainer_id, trainer_name = trainers[day_idx % len(trainers)]
            time_slot = TIME_SLOTS[day_idx % len(TIME_SLOTS)]
            start_time, end_time = TIME_MAP[time_slot]
            room = ROOMS[day_idx % len(ROOMS)]
            title = prog_title if day_idx % 2 == 0 else f"{prog_title} — Practical Workshop"
            slot_rows.append(dict(
                organisation_id=org_id, programme_id=prog_id, batch_id=batch_id,
                trainer_id=trainer_id, day_of_week=day, time_slot=time_slot, title=title,
                room=room, trainer_name=trainer_name, start_time=start_time, end_time=end_time,
            ))

    if slot_rows:
        await bulk_sync(db, TimetableSlot, ("batch_id", "day_of_week"), slot_rows)


# (institution name, block code prefix)
HOSTEL_EXPANSION = [
    ("Vaikunth Mehta National Institute of Cooperative Management", "VM"),
    ("Regional Institute of Cooperative Management, Chennai", "CH"),
]


async def _seed_hostel(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    for org_name, prefix in HOSTEL_EXPANSION:
        org = (await db.execute(select(Organisation).where(Organisation.name == org_name))).scalar_one_or_none()
        if org is None:
            continue

        trainees = (await db.execute(
            select(User.id, User.full_name).where(User.role == "trainee", User.organisation_id == org.id)
            .order_by(User.email).limit(20)
        )).all()
        programme_title = (await db.execute(
            select(Programme.title).where(Programme.organisation_id == org.id).order_by(Programme.created_at).limit(1)
        )).scalar_one_or_none() or "Cooperative Management Fundamentals"

        block_defs = [(f"{prefix}-A", f"{org_name.split(',')[0]} Boys Hostel", "Boys", [1, 2]),
                      (f"{prefix}-B", f"{org_name.split(',')[0]} Girls Hostel", "Girls", [1, 2])]
        block_ids = await bulk_sync(db, HostelBlock, ("organisation_id", "code"), [
            dict(organisation_id=org.id, code=code, name=name, kind=kind, floors=floors)
            for code, name, kind, floors in block_defs
        ])

        statuses = ["occupied", "occupied", "occupied", "vacant", "occupied", "maintenance"]
        room_rows = []
        occ_idx = 0
        for code, _name, _kind, _floors in block_defs:
            block_id = block_ids[(org.id, code)]
            for i in range(8):
                floor = 1 + (i // 4)
                room_code = f"{code}-{floor}{i % 4 + 1:02d}"
                status = statuses[i % len(statuses)]
                row = dict(block_id=block_id, code=room_code, floor=floor, capacity=2 if i % 3 else 3,
                           status=status, occupant_trainee_id=None, occupant_name=None,
                           occupant_programme=None, check_in=None, check_out=None, note=None)
                if status == "occupied" and occ_idx < len(trainees):
                    trainee_id, trainee_name = trainees[occ_idx]
                    occ_idx += 1
                    row.update(occupant_trainee_id=trainee_id, occupant_name=trainee_name,
                               occupant_programme=programme_title,
                               check_in=(now - timedelta(days=30 + i)).date(),
                               check_out=(now + timedelta(days=60 + i)).date())
                elif status == "maintenance":
                    row["note"] = "Routine maintenance in progress"
                room_rows.append(row)
        if room_rows:
            await bulk_sync(db, HostelRoom, "code", room_rows)

        waitlist_pool = trainees[occ_idx:occ_idx + 4]
        preferences = ["Single occupancy preferred", "Any room, ground floor preferred",
                       "Near the library", "Block A preferred"]
        waitlist_rows = [
            dict(organisation_id=org.id, trainee_id=trainee_id, name=trainee_name, programme=programme_title,
                 applied_on=(now - timedelta(days=3 + idx * 2)).date(), preference=preferences[idx % len(preferences)])
            for idx, (trainee_id, trainee_name) in enumerate(waitlist_pool)
        ]
        if waitlist_rows:
            await bulk_sync(db, HostelWaitlistEntry, "trainee_id", waitlist_rows)


async def seed(db: AsyncSession) -> None:
    await _seed_timetable(db)
    await _seed_hostel(db)
    await db.flush()


register("schedule", seed)
