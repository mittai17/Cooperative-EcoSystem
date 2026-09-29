"""Idempotent realistic profile data for the ~608 real (non-test-fixture)
trainees seeded by app/seed.py, so employer candidate-search / talent-pool
screens (which join UserProfile.visible_to_employers, state, district — see
app/api/v1/employer.py) have real results instead of almost nobody.

Scope note: `users` also contains ad hoc `role="trainee"` rows created by
test fixtures (conftest.py's token_factory), which have no organisation and
are re-created on every test run. Seeding fabricated state/district/phone
data for those would be meaningless and would grow forever, so this only
profiles trainees who belong to a real (non-"Test Org …") institution.
"""
import random
import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import UserProfile
from app.models.user import Organisation, User
from app.seeds import register

rng = random.Random(20260928)

STATE_DISTRICTS = {
    "Maharashtra": ["Pune", "Nagpur", "Nashik", "Kolhapur", "Aurangabad"],
    "Gujarat": ["Anand", "Ahmedabad", "Rajkot", "Vadodara", "Mehsana"],
    "Delhi": ["New Delhi", "South Delhi", "North Delhi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Erode", "Salem"],
    "Karnataka": ["Bengaluru Urban", "Mysuru", "Belagavi", "Hubballi", "Mangaluru"],
    "West Bengal": ["Kolkata", "Howrah", "Nadia", "Murshidabad", "Purba Medinipur"],
    "Haryana": ["Karnal", "Panipat", "Kurukshetra", "Hisar"],
    "Bihar": ["Patna", "Muzaffarpur", "Gaya", "Bhagalpur"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Ajmer", "Bikaner"],
    "Kerala": ["Thiruvananthapuram", "Ernakulam", "Kozhikode", "Thrissur"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Puri", "Ganjam"],
    "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Patiala"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Meerut", "Agra"],
    "Andhra Pradesh": ["Vijayawada", "Guntur", "Visakhapatnam", "Krishna"],
    "Assam": ["Guwahati", "Dibrugarh", "Jorhat", "Nagaon"],
    "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior"],
    "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bastar"],
}
# Only the languages the platform actually supports (SUPPORTED_LANGS in
# app/models/content.py); other states default to Hindi/English.
STATE_LANG = {"Maharashtra": "mr", "Gujarat": "gu", "Tamil Nadu": "ta"}

EDUCATION_LEVELS = ["10th Pass", "12th Pass", "ITI Diploma", "Diploma", "Graduate", "Postgraduate"]

# (occupation, designation) — cooperative-sector-realistic, including trainees
# who are unemployed/self-employed (not everyone in a training pipeline is
# already placed).
OCCUPATIONS = [
    ("PACS Secretary", "Secretary"),
    ("Dairy Cooperative Field Officer", "Field Officer"),
    ("Cooperative Society Clerk", "Clerk"),
    ("Farmer Producer Organisation Member", "Member"),
    ("Cooperative Bank Junior Assistant", "Junior Assistant"),
    ("Self-employed farmer", None),
    ("Unemployed — seeking placement", None),
    ("Handloom Weaver", "Weaver"),
    ("Fisheries Cooperative Assistant", "Assistant"),
    ("Warehouse & Godown Supervisor", "Supervisor"),
]
SOCIETY_SUFFIXES = [
    "Primary Agricultural Credit Society", "Milk Producers Cooperative Society",
    "Farmer Producer Company", "Cooperative Credit Society", "Weavers Cooperative Society",
]


async def seed(db: AsyncSession) -> None:
    rows = (await db.execute(
        select(User.id, User.email, Organisation.state, Organisation.name)
        .join(Organisation, Organisation.id == User.organisation_id)
        .where(User.role == "trainee", Organisation.type == "institution",
               ~Organisation.name.like("Test Org%"))
        .order_by(User.email)
    )).all()
    if not rows:
        return

    existing = set((await db.execute(select(UserProfile.user_id))).scalars().all())

    to_add = []
    for user_id, _email, state, org_name in rows:
        if user_id in existing:
            continue
        if rng.random() < 0.08:
            # ~8% of real trainees stay incomplete, like real onboarding funnels.
            continue
        districts = STATE_DISTRICTS.get(state, ["Headquarters"])
        district = rng.choice(districts)
        occupation, designation = rng.choice(OCCUPATIONS)
        has_society = rng.random() < 0.6
        to_add.append(UserProfile(
            id=uuid.uuid4(),
            user_id=user_id,
            phone=f"9{rng.randrange(100000000, 999999999)}",
            date_of_birth=date(rng.randint(1985, 2005), rng.randint(1, 12), rng.randint(1, 28)),
            gender=rng.choice(["male", "male", "female", "female", "other"]),
            state=state,
            district=district,
            pincode=f"{rng.randrange(100000, 999999)}",
            address=f"{rng.randint(1, 400)}, {district}, {state}",
            education_level=rng.choice(EDUCATION_LEVELS),
            occupation=occupation,
            designation=designation,
            cooperative_society=(f"{district} {rng.choice(SOCIETY_SUFFIXES)}" if has_society else None),
            years_of_experience=rng.randint(0, 14),
            bio=f"Cooperative-sector trainee from {district}, {state}, training with "
                f"{org_name.split(',')[0]}.",
            visible_to_employers=rng.random() < 0.45,
        ))

    for row in to_add:
        db.add(row)
    await db.flush()

    # preferred_language lives on User, not UserProfile — set it alongside the
    # profile for the same trainees (additive, nullable column; never touches
    # role/email/org).
    if to_add:
        by_user = {row.user_id: row for row in to_add}
        users = (await db.execute(select(User).where(User.id.in_(by_user.keys())))).scalars().all()
        state_by_user = {user_id: row.state for user_id, row in by_user.items()}
        for user in users:
            if user.preferred_language in (None, "en"):
                user.preferred_language = STATE_LANG.get(state_by_user.get(user.id)) or rng.choice(["hi", "hi", "en"])


register("profiles", seed)
