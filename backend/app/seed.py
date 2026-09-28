"""
CoopSetu AI — Comprehensive Demo Seed Script
============================================
Idempotent: safe to re-run at any time.  Every entity is get-or-created by a
natural key using bulk (set-based) sync helpers, so re-running never
duplicates rows.  All row data is generated deterministically (seeded RNG,
no branching on current DB state while *building* rows) so two runs against
an empty DB and a fully-seeded DB produce byte-identical row payloads —
the bulk sync step then inserts only what's actually missing.

Scale target (India / cooperative-sector themed):
  ~20 training institutions (dairy / PACS / FPO / handloom / fisheries)
  ~17 employers, ~500 trainees, ~23 programmes, ~36 courses,
  ~36 assessments, ~25 jobs, 14 skill-demand rows across 26 skills.

Run from the backend/ directory:
    python3 -m app.seed
"""

import asyncio
import hashlib
import random
import time
import uuid
from datetime import datetime, timezone, timedelta, date

from sqlalchemy import select, insert, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.models.user import User, Organisation
from app.models.programme import Programme, Nomination, Batch, ProgrammeCourse, Enrollment
from app.models.course import Course, CourseEnrollment
from app.models.assessment import Assessment, AssessmentResult
from app.models.skill import Skill, TraineeSkill
from app.models.certificate import Certificate
from app.models.job import Job, Application, EmployerFeedback
from app.models.analytics import SkillDemand
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.timetable import TimetableSlot
from app.models.hostel import HostelBlock, HostelRoom, HostelWaitlistEntry
from app.models.logistics import LogisticsTask, VehicleAllocation, LogisticsBudget
from app.config import get_settings

# ---------------------------------------------------------------------------
# Deterministic RNG so every re-run produces the same data
# ---------------------------------------------------------------------------
rng = random.Random(42)

NOW = datetime.now(timezone.utc)


# ===========================================================================
# Generic bulk get-or-create helper
# ===========================================================================

async def bulk_sync(db: AsyncSession, model, key_attrs, rows: list) -> dict:
    """Idempotent, bulk get-or-create.

    `key_attrs` is a column name (str) or a tuple of column names forming the
    natural key. `rows` is a list of plain dicts (column -> value) — an `id`
    will be assigned for any row that needs inserting.

    Does exactly ONE SELECT (to discover what already exists) and at most ONE
    bulk INSERT (for whatever's missing), regardless of how many rows are
    passed in. Returns {key_value_or_tuple: id} covering every row in `rows`
    (pre-existing or freshly inserted). Duplicate keys within `rows` are
    de-duplicated (first occurrence wins).
    """
    composite = isinstance(key_attrs, tuple)
    attrs = key_attrs if composite else (key_attrs,)
    cols = [getattr(model, a) for a in attrs]

    result = await db.execute(select(*cols, model.id))
    existing: dict = {}
    for rec in result.all():
        *k, rid = rec
        existing[tuple(k) if composite else k[0]] = rid

    to_insert = []
    for row in rows:
        k = tuple(row[a] for a in attrs) if composite else row[attrs[0]]
        if k in existing:
            continue
        rid = row.get("id") or uuid.uuid4()
        row["id"] = rid
        existing[k] = rid
        to_insert.append(row)

    if to_insert:
        await db.execute(insert(model), to_insert)

    return existing


def make_verification_code(trainee_name: str, programme_title: str, year: int) -> str:
    raw = f"{trainee_name}|{programme_title}|{year}|{rng.random()}"
    h = hashlib.sha256(raw.encode()).hexdigest()[:8].upper()
    return f"CST-{year}-{h}"


# ===========================================================================
# Regional name pools (first names, surnames) per institution — used only to
# generate realistic, regionally-flavoured trainee/trainer names. Purely
# cosmetic; uniqueness is guaranteed via index-suffixed emails, not names.
# ===========================================================================

REGION_NAMES = {
    "vamnicom":      (["Ravindra", "Priya", "Pooja", "Nikhil", "Snehal", "Abhijit", "Madhavi", "Chetan"],
                       ["Patil", "Deshmukh", "Kulkarni", "Joshi", "Kale", "Pawar", "Bhosale", "Gaikwad"]),
    "irma":          (["Arjun", "Meenakshi", "Suresh", "Hardik", "Falguni", "Jignesh", "Bhavika", "Ketan"],
                       ["Kulkarni", "Venkataraman", "Shinde", "Patel", "Shah", "Trivedi", "Vyas", "Desai"]),
    "ricm_del":      (["Rajesh", "Anjali", "Vikram", "Sunita", "Aakash", "Ritu", "Deepak", "Kavita"],
                       ["Kumar", "Verma", "Tomar", "Chaudhary", "Mishra", "Tripathi", "Aggarwal", "Sharma"]),
    "ricm_che":      (["Karthikeyan", "Lakshmi", "Murugan", "Deepa", "Senthil", "Revathi", "Bala", "Priya"],
                       ["Subramanian", "Rajan", "Thangavel", "Krishnan", "Arumugam", "Chandrasekaran", "Iyer", "Pillai"]),
    "icm_blr":       (["Venkatesh", "Bhavana", "Naveen", "Meena", "Harish", "Kavitha", "Manju", "Shashank"],
                       ["Reddy", "Shetty", "Gowda", "Krishnaswamy", "Nayak", "Murthy", "Rao", "Hegde"]),
    "icm_kol":       (["Arindam", "Sandip", "Mita", "Ranjit", "Tanushree", "Pranab", "Nandita", "Supriyo"],
                       ["Chatterjee", "Das", "Ghosh", "Biswas", "Roy", "Banerjee", "Paul", "Chakraborty"]),
    "ndri_karnal":   (["Baljeet", "Harpreet", "Gurmeet", "Simran", "Manpreet", "Kuldeep", "Amarjit", "Jasbir"],
                       ["Singh", "Gill", "Sandhu", "Dhillon", "Brar", "Cheema", "Sidhu", "Mann"]),
    "bihar_bank":    (["Ramanand", "Kumud", "Shatrughan", "Kiran", "Vidyanand", "Rekha", "Awadhesh", "Sarita"],
                       ["Kumar", "Singh", "Prasad", "Thakur", "Jha", "Mishra", "Yadav", "Chaudhary"]),
    "rajasthan_icm": (["Bhanwar", "Kamla", "Mohanlal", "Gayatri", "Prahlad", "Sarla", "Devendra", "Manju"],
                       ["Rathore", "Solanki", "Chauhan", "Meena", "Sharma", "Jangid", "Bishnoi", "Choudhary"]),
    "kerala_icm":    (["Suresh", "Latha", "Pradeep", "Anitha", "Rajan", "Deepthi", "Vinod", "Sreeja"],
                       ["Nair", "Menon", "Pillai", "Kurup", "Namboodiri", "Varma", "Panicker", "Warrier"]),
    "odisha_coop":   (["Bijay", "Sabita", "Prasanna", "Manorama", "Santosh", "Jharana", "Debasis", "Snehalata"],
                       ["Mohanty", "Patra", "Nayak", "Sahoo", "Das", "Behera", "Rout", "Mishra"]),
    "punjab_coop":   (["Balwant", "Manpreet", "Ranbir", "Tejinder", "Surjit", "Amarjit", "Kuldeep", "Harjit"],
                       ["Sandhu", "Dhillon", "Gill", "Sidhu", "Brar", "Mann", "Cheema", "Bajwa"]),
    "up_coop":       (["Rajendra", "Sarita", "Yogendra", "Kavita", "Brijesh", "Pushpa", "Dharmendra", "Sushma"],
                       ["Yadav", "Singh", "Gupta", "Verma", "Tiwari", "Pandey", "Dubey", "Shukla"]),
    "ap_handloom":   (["Venkata", "Padma", "Srinivas", "Lakshmi", "Ramachandra", "Sarojini", "Krishna", "Anasuya"],
                       ["Naidu", "Reddy", "Rao", "Chowdary", "Sastry", "Prasad", "Varma", "Raju"]),
    "wb_fisheries":  (["Subrata", "Bandana", "Debasish", "Ratna", "Amit", "Chaitali", "Soumen", "Anima"],
                       ["Mondal", "Halder", "Sarkar", "Bhowmik", "Naskar", "Mandal", "Pramanik", "Dutta"]),
    "assam_coop":    (["Bhaskar", "Anima", "Dilip", "Rina", "Prasanta", "Mridula", "Nabin", "Jyotsna"],
                       ["Bora", "Baruah", "Saikia", "Das", "Gogoi", "Hazarika", "Kalita", "Deka"]),
    "telangana_icm": (["Srinivas", "Padmavathi", "Ravi", "Anitha", "Narsimha", "Vijaya", "Krishna", "Swarna"],
                       ["Rao", "Reddy", "Goud", "Naidu", "Chary", "Sharma", "Yadav", "Rathod"]),
    "mp_coop":       (["Ramesh", "Kamla", "Om", "Sushila", "Girish", "Pushpa", "Ashok", "Rukmini"],
                       ["Chouhan", "Tiwari", "Sharma", "Malviya", "Dubey", "Yadav", "Rajput", "Verma"]),
    "tn_handloom":   (["Muthu", "Kalaivani", "Rajan", "Selvi", "Kumaran", "Vasanthi", "Elango", "Meenal"],
                       ["Pandian", "Nadar", "Chettiar", "Gounder", "Thevar", "Pillai", "Raja", "Devar"]),
    "cg_coop":       (["Ram", "Sita", "Ghanshyam", "Kaushalya", "Bhupendra", "Rajkumari", "Tilak", "Savitri"],
                       ["Sahu", "Verma", "Nirmalkar", "Dewangan", "Yadav", "Patel", "Sinha", "Chandra"]),
}

TRAINEES_PER_INSTITUTION = 25  # 20 institutions * 25 = 500 trainees


def gen_people(inst_key: str, count: int, start_idx: int, tag: str) -> list:
    """Generate `count` (full_name, email, clerk_user_id) tuples for an
    institution's regional name pool, offset by `start_idx` so trainer and
    trainee pools don't collide."""
    firsts, lasts = REGION_NAMES[inst_key]
    out = []
    for i in range(count):
        gi = start_idx + i
        fname = firsts[gi % len(firsts)]
        lname = lasts[(gi * 5 + 3) % len(lasts)]
        full_name = f"{fname} {lname}"
        email = f"{tag}{gi:04d}.{inst_key}@coopsetu.gov.in"
        clerk_id = f"{tag}_seed_{inst_key}_{gi:04d}"
        out.append((full_name, email, clerk_id))
    return out


# ===========================================================================
# Main seed function
# ===========================================================================

async def seed():
    t_start = time.perf_counter()
    settings = get_settings()
    async_url = (
        settings.database_url
        .replace("postgresql://", "postgresql+asyncpg://")
        .replace("?sslmode=require", "")
    )
    engine = create_async_engine(async_url, poolclass=NullPool)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as db:

        # ===================================================================
        # 1. ORGANISATIONS (1 NCCT + 20 institutions + 17 employers)
        # ===================================================================
        print("  [1/15] Seeding organisations...")

        institution_defs = [
            ("vamnicom",      "Vaikunth Mehta National Institute of Cooperative Management", "Maharashtra"),
            ("irma",          "Institute of Rural Management, Anand", "Gujarat"),
            ("ricm_del",      "Regional Institute of Cooperative Management, Delhi", "Delhi"),
            ("ricm_che",      "Regional Institute of Cooperative Management, Chennai", "Tamil Nadu"),
            ("icm_blr",       "Institute of Cooperative Management, Bangalore", "Karnataka"),
            ("icm_kol",       "Institute of Cooperative Management, Kolkata", "West Bengal"),
            ("ndri_karnal",   "National Dairy Research Institute Training Centre, Karnal", "Haryana"),
            ("bihar_bank",    "Bihar State Cooperative Bank Training College, Patna", "Bihar"),
            ("rajasthan_icm", "Rajasthan State Institute of Cooperative Management, Jaipur", "Rajasthan"),
            ("kerala_icm",    "Kerala Institute of Cooperative Management, Thiruvananthapuram", "Kerala"),
            ("odisha_coop",   "Odisha State Cooperative Training Institute, Bhubaneswar", "Odisha"),
            ("punjab_coop",   "Punjab Cooperative Training Institute, Chandigarh", "Punjab"),
            ("up_coop",       "Uttar Pradesh Cooperative Union Training Centre, Lucknow", "Uttar Pradesh"),
            ("ap_handloom",   "Andhra Pradesh Handloom & Handicrafts Training Institute, Vijayawada", "Andhra Pradesh"),
            ("wb_fisheries",  "West Bengal State Fisheries Cooperative Training Centre, Kolkata", "West Bengal"),
            ("assam_coop",    "Assam Cooperative Training Institute, Guwahati", "Assam"),
            ("telangana_icm", "Telangana State Institute of Cooperative Management, Hyderabad", "Telangana"),
            ("mp_coop",       "Madhya Pradesh Cooperative Training Institute, Bhopal", "Madhya Pradesh"),
            ("tn_handloom",   "Tamil Nadu Handloom Weavers Cooperative Training Centre, Kanchipuram", "Tamil Nadu"),
            ("cg_coop",       "Chhattisgarh State Cooperative Union Training Institute, Raipur", "Chhattisgarh"),
        ]
        employer_defs = [
            ("amul",      "Amul Dairy Cooperative Union", "Gujarat"),
            ("iffco",     "IFFCO - Indian Farmers Fertiliser Cooperative", "Delhi"),
            ("nabard",    "NABARD - National Bank for Agriculture and Rural Development", "Maharashtra"),
            ("nafscob",   "National Federation of State Cooperative Banks (NAFSCOB)", "Maharashtra"),
            ("ka_apex",   "Karnataka State Cooperative Apex Bank", "Karnataka"),
            ("ncdc",      "National Cooperative Development Corporation (NCDC)", "Delhi"),
            ("aavin",     "Tamil Nadu Cooperative Milk Producers Federation (Aavin)", "Tamil Nadu"),
            ("kerala_bk", "Kerala State Cooperative Bank", "Kerala"),
            ("omfed",     "Odisha State Cooperative Milk Producers Federation (OMFED)", "Odisha"),
            ("punjab_bk", "Punjab State Cooperative Bank", "Punjab"),
            ("rajfed",    "Rajasthan State Cooperative Marketing Federation (RAJFED)", "Rajasthan"),
            ("upcf",      "Uttar Pradesh Cooperative Federation Ltd (UPCF)", "Uttar Pradesh"),
            ("wb_fish_fed","West Bengal State Fishermen's Cooperative Federation", "West Bengal"),
            ("bihar_bk",  "Bihar State Cooperative Bank", "Bihar"),
            ("tg_apex",   "Telangana State Cooperative Apex Bank", "Telangana"),
            ("apco",      "Andhra Pradesh State Handloom Weavers Cooperative Society (APCO)", "Andhra Pradesh"),
            ("markfed",   "Madhya Pradesh State Cooperative Marketing Federation (MARKFED)", "Madhya Pradesh"),
        ]

        org_rows = [dict(name="NCCT - National Council for Cooperative Training", type="ncct", state="Delhi")]
        org_rows += [dict(name=name, type="institution", state=state) for _key, name, state in institution_defs]
        org_rows += [dict(name=name, type="employer", state=state) for _key, name, state in employer_defs]

        org_ids = await bulk_sync(db, Organisation, "name", org_rows)

        ncct_id = org_ids["NCCT - National Council for Cooperative Training"]
        inst_org_id = {key: org_ids[name] for key, name, _state in institution_defs}
        emp_org_id = {key: org_ids[name] for key, name, _state in employer_defs}
        institution_names = [name for _k, name, _s in institution_defs]

        # ===================================================================
        # 2. SKILLS TAXONOMY (26 skills)
        # ===================================================================
        print("  [2/15] Seeding skills taxonomy...")

        skill_defs = [
            ("Cooperative Management",      "Management"),
            ("Cooperative Governance",      "Management"),
            ("Communication",               "Soft Skills"),
            ("Rural Development",           "Domain"),
            ("Data Analysis",               "Technical"),
            ("Dairy Operations",            "Domain"),
            ("Financial Management",        "Management"),
            ("Leadership",                  "Soft Skills"),
            ("Credit Appraisal",            "Domain"),
            ("Digital Marketing",           "Technical"),
            ("Quality Assurance",           "Domain"),
            ("Supply Chain Logistics",      "Domain"),
            ("AgriTech",                    "Technical"),
            ("Organic Farming",             "Domain"),
            ("Cold Chain Management",       "Domain"),
            ("Digital Credit Appraisal",    "Technical"),
            ("Audit & Compliance",          "Management"),
            ("Risk Management",             "Management"),
            ("Python Programming",          "Technical"),
            ("GIS & Remote Sensing",        "Technical"),
            ("Handloom Design & Weaving",   "Domain"),
            ("Fisheries Management",        "Domain"),
            ("FPO Governance",              "Management"),
            ("Warehouse Management",        "Domain"),
            ("E-NAM Trading",               "Technical"),
            ("Micro-Credit & SHG Linkage",  "Domain"),
        ]
        skill_rows = [dict(name=n, category=c) for n, c in skill_defs]
        skill_ids = await bulk_sync(db, Skill, "name", skill_rows)
        all_skill_names = [n for n, _c in skill_defs]

        # ===================================================================
        # 3. TRAINER / FACULTY USERS (role="trainer" — matches attendance.py /
        #    certificates.py RBAC checks and analytics.py's overview count)
        # ===================================================================
        print("  [3/15] Seeding trainer users...")

        named_trainers = [
            ("Dr. Ramesh Kulkarni",       "ramesh.kulkarni@vamnicom.edu.in",     "vamnicom"),
            ("Prof. Sunita Agarwal",      "sunita.agarwal@vamnicom.edu.in",      "vamnicom"),
            ("Dr. Pradeep Joshi",         "pradeep.joshi@vamnicom.edu.in",       "vamnicom"),
            ("Dr. Mohan Rao",             "mohan.rao@irma.ac.in",                "irma"),
            ("Prof. Kavitha Nair",        "kavitha.nair@irma.ac.in",             "irma"),
            ("Dr. Suresh Menon",          "suresh.menon@irma.ac.in",             "irma"),
            ("Prof. Anjali Sharma",       "anjali.sharma@ricm-delhi.gov.in",     "ricm_del"),
            ("Dr. Rajiv Verma",           "rajiv.verma@ricm-delhi.gov.in",       "ricm_del"),
            ("Er. Pooja Gupta",           "pooja.gupta@ricm-delhi.gov.in",       "ricm_del"),
            ("Dr. Lakshmi Rajan",         "lakshmi.rajan@ricm-chennai.gov.in",   "ricm_che"),
            ("Prof. Murugan Subramanian", "murugan.s@ricm-chennai.gov.in",       "ricm_che"),
            ("Dr. Priya Annamalai",       "priya.annamalai@ricm-chennai.gov.in", "ricm_che"),
            ("Prof. Venkatesh Reddy",     "venkatesh.reddy@icm-blr.gov.in",      "icm_blr"),
            ("Dr. Meena Krishnaswamy",    "meena.k@icm-blr.gov.in",              "icm_blr"),
            ("Er. Sunil Kumar B.",        "sunil.kumar@icm-blr.gov.in",          "icm_blr"),
            ("Dr. Arindam Chatterjee",    "arindam.c@icm-kolkata.gov.in",        "icm_kol"),
            ("Prof. Sandip Das",          "sandip.das@icm-kolkata.gov.in",       "icm_kol"),
            ("Dr. Mita Ghosh",            "mita.ghosh@icm-kolkata.gov.in",       "icm_kol"),
        ]

        new_inst_keys = [k for k, _n, _s in institution_defs if k not in
                          {"vamnicom", "irma", "ricm_del", "ricm_che", "icm_blr", "icm_kol"}]

        trainer_rows = [
            dict(clerk_user_id=f"trainer_seed_{i+1:03d}", email=email, full_name=name,
                 role="trainer", organisation_id=inst_org_id[key])
            for i, (name, email, key) in enumerate(named_trainers)
        ]
        # 2 additional generated trainers per new institution
        new_trainer_names: dict = {}
        for key in new_inst_keys:
            people = gen_people(key, 2, start_idx=50, tag="trainer")
            new_trainer_names[key] = [p[0] for p in people]
            for full_name, email, clerk_id in people:
                trainer_rows.append(dict(
                    clerk_user_id=clerk_id, email=email, full_name=f"Prof. {full_name}",
                    role="trainer", organisation_id=inst_org_id[key],
                ))

        trainer_ids = await bulk_sync(db, User, "email", trainer_rows)

        def instructor_for(key: str, idx: int = 0) -> str:
            if key in new_trainer_names:
                return f"Prof. {new_trainer_names[key][idx % len(new_trainer_names[key])]}"
            return next(n for n, e, k in named_trainers if k == key)

        # ===================================================================
        # 4. COURSES (16 original + 20 new = 36)
        # ===================================================================
        print("  [4/15] Seeding courses...")

        course_defs = [
            dict(title="Cooperative Management Fundamentals",  category="Management",  level="Foundation",    duration_hours=40, instructor="Dr. Ramesh Kulkarni",       rating=4.8, enrolled_count=1240, skills=["Cooperative Management", "Cooperative Governance"],                          description="Core cooperative principles, governance, and management."),
            dict(title="Data Analytics for Cooperatives",      category="Technology",  level="Intermediate",  duration_hours=48, instructor="Prof. Sunita Agarwal",      rating=4.6, enrolled_count=640,  skills=["Data Analysis", "Digital Marketing"],                                       description="Applied analytics for cooperative decision-making."),
            dict(title="Rural Development Fundamentals",       category="Rural",       level="Foundation",    duration_hours=32, instructor="Dr. Mohan Rao",             rating=4.7, enrolled_count=820,  skills=["Rural Development", "Communication"],                                       description="Fundamentals of rural development in the cooperative sector."),
            dict(title="Dairy Cooperative Operations",         category="Dairy",       level="Intermediate",  duration_hours=60, instructor="Er. Vijay Patil",           rating=4.9, enrolled_count=980,  skills=["Dairy Operations", "Quality Assurance", "Supply Chain Logistics"],           description="Dairy procurement, chilling, and cooperative operations."),
            dict(title="Dairy Farm Management",                category="Dairy",       level="Foundation",    duration_hours=36, instructor="Dr. Mohan Rao",             rating=4.7, enrolled_count=560,  skills=["Dairy Operations", "Rural Development"],                                    description="Scientific dairy farm management and animal husbandry basics."),
            dict(title="Cooperative Credit Operations",        category="Finance",     level="Intermediate",  duration_hours=44, instructor="Dr. Pradeep Joshi",         rating=4.5, enrolled_count=490,  skills=["Credit Appraisal", "Financial Management"],                                 description="Loan appraisal, PACS operations, and credit monitoring."),
            dict(title="AgriTech Fundamentals",                category="Technology",  level="Foundation",    duration_hours=30, instructor="Prof. Anjali Sharma",       rating=4.4, enrolled_count=310,  skills=["AgriTech", "GIS & Remote Sensing"],                                         description="Precision farming, IoT sensors, and agri-fintech integration."),
            dict(title="Rural Finance & PACS Operations",     category="Finance",     level="Intermediate",  duration_hours=48, instructor="Dr. Rajiv Verma",           rating=4.6, enrolled_count=420,  skills=["Credit Appraisal", "Financial Management", "Rural Development"],            description="Primary Agricultural Credit Society operations and rural finance."),
            dict(title="Cold Chain Logistics Management",      category="Logistics",   level="Advanced",      duration_hours=52, instructor="Dr. Lakshmi Rajan",         rating=4.7, enrolled_count=280,  skills=["Cold Chain Management", "Supply Chain Logistics", "Quality Assurance"],     description="Temperature-controlled supply chain for perishable agricultural commodities."),
            dict(title="Digital Credit Appraisal",            category="Finance",     level="Advanced",      duration_hours=40, instructor="Prof. Venkatesh Reddy",     rating=4.8, enrolled_count=350,  skills=["Digital Credit Appraisal", "Credit Appraisal", "Data Analysis"],            description="AI-enabled digital credit scoring and appraisal for cooperative banks."),
            dict(title="Cooperative Governance & Audit",       category="Management",  level="Advanced",      duration_hours=44, instructor="Dr. Arindam Chatterjee",    rating=4.6, enrolled_count=390,  skills=["Cooperative Governance", "Audit & Compliance", "Risk Management"],          description="Statutory audit, internal controls, and cooperative governance frameworks."),
            dict(title="Organic Farming Certification",        category="Agriculture", level="Intermediate",  duration_hours=56, instructor="Dr. Mita Ghosh",            rating=4.8, enrolled_count=240,  skills=["Organic Farming", "Quality Assurance", "Rural Development"],                 description="Soil health, organic certification standards, and market linkages."),
            dict(title="Financial Management for Cooperatives",category="Finance",     level="Foundation",    duration_hours=36, instructor="Dr. Suresh Menon",          rating=4.5, enrolled_count=480,  skills=["Financial Management", "Cooperative Management"],                           description="Budgeting, financial reporting, and member equity management."),
            dict(title="Leadership & Communication Skills",    category="Soft Skills", level="Foundation",    duration_hours=24, instructor="Prof. Kavitha Nair",        rating=4.4, enrolled_count=720,  skills=["Leadership", "Communication"],                                              description="Effective leadership, public speaking, and cooperative communication."),
            dict(title="Supply Chain & Quality Management",    category="Operations",  level="Intermediate",  duration_hours=40, instructor="Prof. Murugan Subramanian", rating=4.5, enrolled_count=310,  skills=["Supply Chain Logistics", "Quality Assurance"],                              description="End-to-end supply chain visibility, SLA management, and quality audits."),
            dict(title="Python for Data Science",              category="Technology",  level="Advanced",      duration_hours=64, instructor="Er. Sunil Kumar B.",        rating=4.7, enrolled_count=290,  skills=["Python Programming", "Data Analysis"],                                      description="Python programming for cooperative sector data science use-cases."),
            # --- new (20) ---
            dict(title="Handloom Design and Weaving Techniques", category="Handloom",   level="Foundation",   duration_hours=48, instructor=instructor_for("ap_handloom", 0), rating=4.6, enrolled_count=180, skills=["Handloom Design & Weaving", "Quality Assurance"],            description="Traditional and modern handloom weaving design techniques."),
            dict(title="Handloom Export Marketing",              category="Handloom",   level="Intermediate", duration_hours=32, instructor=instructor_for("tn_handloom", 0), rating=4.5, enrolled_count=140, skills=["Handloom Design & Weaving", "Digital Marketing"],            description="Export documentation and marketing for handloom weaver cooperatives."),
            dict(title="Fisheries Cooperative Management",       category="Fisheries",  level="Foundation",   duration_hours=40, instructor=instructor_for("kerala_icm", 0), rating=4.6, enrolled_count=160, skills=["Fisheries Management", "Cooperative Management"],            description="Fisheries cooperative formation, member services, and market linkages."),
            dict(title="Fish Processing & Cold Storage",         category="Fisheries",  level="Intermediate", duration_hours=44, instructor=instructor_for("wb_fisheries", 0), rating=4.7, enrolled_count=150, skills=["Fisheries Management", "Cold Chain Management"],            description="Fish processing quality standards and cold storage operations."),
            dict(title="Farmer Producer Organisation Formation & Governance", category="Agriculture", level="Foundation", duration_hours=36, instructor=instructor_for("assam_coop", 0), rating=4.5, enrolled_count=220, skills=["FPO Governance", "Cooperative Governance"],   description="End-to-end FPO formation, registration, and governance."),
            dict(title="FPO Business Development & Market Linkages", category="Agriculture", level="Advanced", duration_hours=40, instructor=instructor_for("telangana_icm", 0), rating=4.6, enrolled_count=190, skills=["FPO Governance", "Digital Marketing"],        description="FPO business planning, market linkages, and revenue models."),
            dict(title="Warehouse & Post-Harvest Management",    category="Logistics",  level="Intermediate", duration_hours=40, instructor=instructor_for("mp_coop", 0), rating=4.5, enrolled_count=170, skills=["Warehouse Management", "Supply Chain Logistics"],            description="Post-harvest handling, storage, and warehouse operations."),
            dict(title="Warehouse Receipt Financing",            category="Finance",    level="Advanced",     duration_hours=32, instructor=instructor_for("mp_coop", 1), rating=4.6, enrolled_count=130, skills=["Warehouse Management", "Financial Management"],              description="Warehouse receipt-backed credit and collateral management."),
            dict(title="E-NAM Digital Trading Platform",         category="Technology", level="Advanced",     duration_hours=28, instructor=instructor_for("rajasthan_icm", 0), rating=4.5, enrolled_count=120, skills=["E-NAM Trading", "Data Analysis"],             description="Electronic National Agriculture Market trading and price discovery."),
            dict(title="Micro-Credit & SHG Linkage Programme",   category="Finance",    level="Foundation",   duration_hours=36, instructor=instructor_for("kerala_icm", 1), rating=4.6, enrolled_count=260, skills=["Micro-Credit & SHG Linkage", "Rural Development"],           description="Self-help group formation and bank linkage for micro-credit."),
            dict(title="PACS Computerisation & Digital Ledgers", category="Finance",    level="Intermediate", duration_hours=32, instructor=instructor_for("bihar_bank", 0), rating=4.5, enrolled_count=210, skills=["Digital Credit Appraisal", "Data Analysis"],   description="Core banking migration and digital ledgers for PACS."),
            dict(title="Cooperative Marketing & Branding",       category="Marketing",  level="Intermediate", duration_hours=28, instructor=instructor_for("up_coop", 0), rating=4.4, enrolled_count=200, skills=["Digital Marketing", "Communication"],                 description="Branding and marketing strategy for cooperative products."),
            dict(title="GIS Applications in Cooperative Agriculture", category="Technology", level="Advanced", duration_hours=36, instructor=instructor_for("ndri_karnal", 0), rating=4.6, enrolled_count=110, skills=["GIS & Remote Sensing", "AgriTech"],           description="GIS and remote sensing for crop and land monitoring."),
            dict(title="Poultry & Livestock Cooperative Management", category="Dairy",  level="Foundation",   duration_hours=32, instructor=instructor_for("ndri_karnal", 1), rating=4.5, enrolled_count=150, skills=["Dairy Operations", "Rural Development"],       description="Poultry and livestock cooperative operations and animal husbandry."),
            dict(title="Cooperative Law & Bylaws Drafting",      category="Governance", level="Advanced",     duration_hours=40, instructor=instructor_for("punjab_coop", 0), rating=4.6, enrolled_count=180, skills=["Cooperative Governance", "Audit & Compliance"], description="Statutory bylaws drafting and cooperative law compliance."),
            dict(title="Cooperative HR & Member Relations",      category="Management", level="Foundation",   duration_hours=24, instructor=instructor_for("odisha_coop", 0), rating=4.4, enrolled_count=160, skills=["Leadership", "Communication"],                description="HR practices and member relationship management for cooperatives."),
            dict(title="Export Documentation for Agri Cooperatives", category="Logistics", level="Intermediate", duration_hours=28, instructor=instructor_for("rajasthan_icm", 1), rating=4.4, enrolled_count=100, skills=["Supply Chain Logistics", "Audit & Compliance"], description="Export documentation, customs, and compliance for agri cooperatives."),
            dict(title="Insurance & Risk Products for Cooperative Members", category="Finance", level="Intermediate", duration_hours=28, instructor=instructor_for("telangana_icm", 1), rating=4.5, enrolled_count=140, skills=["Risk Management", "Financial Management"], description="Crop and livestock insurance products for cooperative members."),
            dict(title="Women SHG Leadership Programme",         category="Soft Skills", level="Foundation",  duration_hours=24, instructor=instructor_for("cg_coop", 0), rating=4.7, enrolled_count=230, skills=["Leadership", "Micro-Credit & SHG Linkage"],          description="Leadership development for women self-help group members."),
            dict(title="Coir & Handicraft Cooperative Enterprise", category="Handloom", level="Foundation",   duration_hours=32, instructor=instructor_for("tn_handloom", 1), rating=4.5, enrolled_count=120, skills=["Handloom Design & Weaving", "Rural Development"],  description="Coir and handicraft cooperative enterprise development."),
        ]
        course_rows = [dict(cd) for cd in course_defs]
        course_ids = await bulk_sync(db, Course, "title", course_rows)

        # ===================================================================
        # 5. PROGRAMMES (9 original + 14 new = 23)
        # ===================================================================
        print("  [5/15] Seeding programmes...")

        prog_defs = [
            dict(title="Cooperative Management Fundamentals",       sector="Cooperative Management", level="Foundation",    mode="Blended",   duration_weeks=8,  seats_total=50, seats_filled=47, organisation_id=inst_org_id["irma"],     description="Core cooperative principles, governance, and management."),
            dict(title="Dairy Cooperative Operations",              sector="Dairy",                  level="Intermediate",  mode="In-person", duration_weeks=12, seats_total=40, seats_filled=40, organisation_id=inst_org_id["irma"],     description="Dairy procurement, processing, and cooperative management."),
            dict(title="Data Analytics for Cooperative Decision-Making", sector="Technology",       level="Intermediate",  mode="Online",    duration_weeks=6,  seats_total=60, seats_filled=38, organisation_id=inst_org_id["vamnicom"], description="Data analysis skills for cooperative sector professionals."),
            dict(title="Dairy Farm Management Programme",           sector="Dairy",                  level="Foundation",    mode="In-person", duration_weeks=10, seats_total=35, seats_filled=32, organisation_id=inst_org_id["ricm_che"], description="Scientific dairy farm management and animal husbandry."),
            dict(title="Cooperative Credit Operations Certificate", sector="Finance",                level="Intermediate",  mode="Blended",   duration_weeks=8,  seats_total=45, seats_filled=40, organisation_id=inst_org_id["ricm_del"], description="Loan appraisal, PACS operations, and credit monitoring."),
            dict(title="AgriTech Fundamentals Programme",           sector="Technology",             level="Foundation",    mode="Online",    duration_weeks=6,  seats_total=60, seats_filled=52, organisation_id=inst_org_id["icm_blr"],  description="Precision farming, IoT sensors, and agri-fintech."),
            dict(title="Cold Chain Logistics & Quality Management", sector="Logistics",              level="Advanced",      mode="Blended",   duration_weeks=10, seats_total=30, seats_filled=25, organisation_id=inst_org_id["vamnicom"], description="Temperature-controlled supply chain management."),
            dict(title="Cooperative Governance & Audit Certification", sector="Governance",         level="Advanced",      mode="In-person", duration_weeks=8,  seats_total=40, seats_filled=35, organisation_id=inst_org_id["icm_kol"],  description="Statutory audit and cooperative governance frameworks."),
            dict(title="Organic Farming Certification Programme",   sector="Agriculture",            level="Intermediate",  mode="Blended",   duration_weeks=12, seats_total=35, seats_filled=30, organisation_id=inst_org_id["ricm_che"], description="Organic certification, soil health, and market linkages."),
            # --- new (14) ---
            dict(title="Advanced Dairy Technology & Quality Assurance Programme", sector="Dairy",      level="Advanced",     mode="In-person", duration_weeks=10, seats_total=40, seats_filled=34, organisation_id=inst_org_id["ndri_karnal"],   description="Advanced dairy processing technology, quality assurance and cold chain integration."),
            dict(title="PACS Computerisation & Digital Banking Programme",       sector="Finance",    level="Intermediate", mode="Blended",   duration_weeks=8,  seats_total=45, seats_filled=38, organisation_id=inst_org_id["bihar_bank"],    description="Digitisation of Primary Agricultural Credit Societies and core banking migration."),
            dict(title="Cooperative Marketing & Rural Enterprise Programme",     sector="Agriculture",level="Foundation",   mode="Blended",   duration_weeks=8,  seats_total=50, seats_filled=41, organisation_id=inst_org_id["rajasthan_icm"], description="Rural cooperative marketing, branding and enterprise development."),
            dict(title="Fisheries Cooperative Management Programme",            sector="Fisheries",  level="Foundation",   mode="In-person", duration_weeks=10, seats_total=35, seats_filled=29, organisation_id=inst_org_id["kerala_icm"],    description="Fisheries cooperative formation, member services and market linkages."),
            dict(title="Coastal Fisheries & Cold Storage Cooperative Programme", sector="Fisheries",  level="Intermediate", mode="Blended",   duration_weeks=12, seats_total=30, seats_filled=24, organisation_id=inst_org_id["odisha_coop"],   description="Coastal fisheries operations, cold storage and post-harvest handling."),
            dict(title="Punjab Dairy & PACS Modernisation Programme",           sector="Dairy",      level="Intermediate", mode="Blended",   duration_weeks=8,  seats_total=40, seats_filled=33, organisation_id=inst_org_id["punjab_coop"],   description="Modernising Punjab's dairy cooperatives and PACS credit delivery."),
            dict(title="PACS Governance & Member Services Programme",           sector="Governance", level="Foundation",   mode="In-person", duration_weeks=6,  seats_total=50, seats_filled=44, organisation_id=inst_org_id["up_coop"],       description="Governance, bylaws and member services for Primary Agricultural Credit Societies."),
            dict(title="Handloom Weaving & Export Marketing Programme",         sector="Handloom",   level="Intermediate", mode="Blended",   duration_weeks=10, seats_total=35, seats_filled=28, organisation_id=inst_org_id["ap_handloom"],   description="Handloom weaving techniques, design and export marketing for weaver cooperatives."),
            dict(title="Fish Processing & Cooperative Trade Programme",         sector="Fisheries",  level="Intermediate", mode="In-person", duration_weeks=8,  seats_total=30, seats_filled=22, organisation_id=inst_org_id["wb_fisheries"],  description="Fish processing, quality standards and cooperative trade operations."),
            dict(title="Farmer Producer Organisation (FPO) Formation Programme",sector="Agriculture",level="Foundation",   mode="Online",    duration_weeks=6,  seats_total=60, seats_filled=48, organisation_id=inst_org_id["assam_coop"],    description="End-to-end FPO formation, registration and governance."),
            dict(title="FPO Business Development & E-NAM Trading Programme",    sector="Technology", level="Advanced",     mode="Blended",   duration_weeks=8,  seats_total=45, seats_filled=36, organisation_id=inst_org_id["telangana_icm"], description="FPO business planning, digital trading and e-NAM market linkages."),
            dict(title="PACS Credit & Warehouse Receipt Financing Programme",   sector="Finance",    level="Advanced",     mode="Blended",   duration_weeks=8,  seats_total=40, seats_filled=31, organisation_id=inst_org_id["mp_coop"],       description="Warehouse receipt financing and credit appraisal for PACS."),
            dict(title="Handloom & Handicraft Cooperative Enterprise Programme",sector="Handloom",   level="Foundation",   mode="In-person", duration_weeks=12, seats_total=35, seats_filled=27, organisation_id=inst_org_id["tn_handloom"],   description="Handloom and handicraft cooperative enterprise development and market access."),
            dict(title="FPO Governance & Rural Marketing Programme",           sector="Governance", level="Intermediate", mode="Blended",   duration_weeks=8,  seats_total=40, seats_filled=30, organisation_id=inst_org_id["cg_coop"],       description="FPO governance frameworks and rural marketing strategy."),
        ]
        prog_rows = [dict(pd) for pd in prog_defs]
        prog_ids = await bulk_sync(db, Programme, "title", prog_rows)
        # NOTE: prog_ids may contain extra keys for programmes this script
        # didn't define (e.g. stray rows created by repeatedly running
        # pytest / verify_e2e_loop.py against this same DB via
        # POST /api/v1/programmes/). Anything iterating "our" programmes
        # must use `own_prog_titles`, never `prog_ids.keys()`, or every
        # such stray row would silently accumulate its own Batch and
        # AttendanceSession on each seed run.
        own_prog_titles = [pd["title"] for pd in prog_defs]

        # ===================================================================
        # 6. PROGRAMME <-> COURSE LINKAGES
        # ===================================================================
        print("  [6/15] Seeding programme-course linkages...")

        pc_links = [
            ("Cooperative Management Fundamentals",           "Cooperative Management Fundamentals",   1, True),
            ("Cooperative Management Fundamentals",           "Rural Development Fundamentals",         2, True),
            ("Cooperative Management Fundamentals",           "Financial Management for Cooperatives",  3, True),
            ("Cooperative Management Fundamentals",           "Leadership & Communication Skills",      4, False),
            ("Cooperative Management Fundamentals",           "Data Analytics for Cooperatives",        5, False),
            ("Dairy Cooperative Operations",                  "Dairy Cooperative Operations",          1, True),
            ("Dairy Cooperative Operations",                  "Cooperative Management Fundamentals",    2, True),
            ("Dairy Cooperative Operations",                  "Supply Chain & Quality Management",      3, False),
            ("Data Analytics for Cooperative Decision-Making","Data Analytics for Cooperatives",        1, True),
            ("Data Analytics for Cooperative Decision-Making","Python for Data Science",                2, False),
            ("Data Analytics for Cooperative Decision-Making","Cooperative Management Fundamentals",    3, False),
            ("Dairy Farm Management Programme",               "Dairy Farm Management",                 1, True),
            ("Dairy Farm Management Programme",               "Dairy Cooperative Operations",          2, True),
            ("Dairy Farm Management Programme",               "Leadership & Communication Skills",      3, False),
            ("Cooperative Credit Operations Certificate",     "Cooperative Credit Operations",         1, True),
            ("Cooperative Credit Operations Certificate",     "Rural Finance & PACS Operations",       2, True),
            ("Cooperative Credit Operations Certificate",     "Financial Management for Cooperatives",  3, False),
            ("AgriTech Fundamentals Programme",               "AgriTech Fundamentals",                 1, True),
            ("AgriTech Fundamentals Programme",               "Data Analytics for Cooperatives",       2, False),
            ("Cold Chain Logistics & Quality Management",     "Cold Chain Logistics Management",       1, True),
            ("Cold Chain Logistics & Quality Management",     "Supply Chain & Quality Management",     2, True),
            ("Cold Chain Logistics & Quality Management",     "Dairy Cooperative Operations",          3, False),
            ("Cooperative Governance & Audit Certification",  "Cooperative Governance & Audit",        1, True),
            ("Cooperative Governance & Audit Certification",  "Cooperative Management Fundamentals",   2, True),
            ("Cooperative Governance & Audit Certification",  "Financial Management for Cooperatives", 3, False),
            ("Organic Farming Certification Programme",       "Organic Farming Certification",         1, True),
            ("Organic Farming Certification Programme",       "Rural Development Fundamentals",        2, True),
            ("Organic Farming Certification Programme",       "Supply Chain & Quality Management",     3, False),
            # --- new programmes ---
            ("Advanced Dairy Technology & Quality Assurance Programme", "Dairy Cooperative Operations", 1, True),
            ("Advanced Dairy Technology & Quality Assurance Programme", "Poultry & Livestock Cooperative Management", 2, True),
            ("Advanced Dairy Technology & Quality Assurance Programme", "Cold Chain Logistics Management", 3, False),
            ("PACS Computerisation & Digital Banking Programme", "PACS Computerisation & Digital Ledgers", 1, True),
            ("PACS Computerisation & Digital Banking Programme", "Rural Finance & PACS Operations", 2, True),
            ("PACS Computerisation & Digital Banking Programme", "Digital Credit Appraisal", 3, False),
            ("Cooperative Marketing & Rural Enterprise Programme", "Cooperative Marketing & Branding", 1, True),
            ("Cooperative Marketing & Rural Enterprise Programme", "Rural Development Fundamentals", 2, True),
            ("Cooperative Marketing & Rural Enterprise Programme", "Leadership & Communication Skills", 3, False),
            ("Fisheries Cooperative Management Programme", "Fisheries Cooperative Management", 1, True),
            ("Fisheries Cooperative Management Programme", "Cooperative Management Fundamentals", 2, False),
            ("Coastal Fisheries & Cold Storage Cooperative Programme", "Fish Processing & Cold Storage", 1, True),
            ("Coastal Fisheries & Cold Storage Cooperative Programme", "Cold Chain Logistics Management", 2, True),
            ("Coastal Fisheries & Cold Storage Cooperative Programme", "Supply Chain & Quality Management", 3, False),
            ("Punjab Dairy & PACS Modernisation Programme", "Dairy Cooperative Operations", 1, True),
            ("Punjab Dairy & PACS Modernisation Programme", "PACS Computerisation & Digital Ledgers", 2, True),
            ("Punjab Dairy & PACS Modernisation Programme", "Cooperative Credit Operations", 3, False),
            ("PACS Governance & Member Services Programme", "Cooperative Law & Bylaws Drafting", 1, True),
            ("PACS Governance & Member Services Programme", "Cooperative Governance & Audit", 2, True),
            ("PACS Governance & Member Services Programme", "Cooperative HR & Member Relations", 3, False),
            ("Handloom Weaving & Export Marketing Programme", "Handloom Design and Weaving Techniques", 1, True),
            ("Handloom Weaving & Export Marketing Programme", "Handloom Export Marketing", 2, True),
            ("Handloom Weaving & Export Marketing Programme", "Cooperative Marketing & Branding", 3, False),
            ("Fish Processing & Cooperative Trade Programme", "Fish Processing & Cold Storage", 1, True),
            ("Fish Processing & Cooperative Trade Programme", "Export Documentation for Agri Cooperatives", 2, False),
            ("Farmer Producer Organisation (FPO) Formation Programme", "Farmer Producer Organisation Formation & Governance", 1, True),
            ("Farmer Producer Organisation (FPO) Formation Programme", "Cooperative Law & Bylaws Drafting", 2, False),
            ("FPO Business Development & E-NAM Trading Programme", "FPO Business Development & Market Linkages", 1, True),
            ("FPO Business Development & E-NAM Trading Programme", "E-NAM Digital Trading Platform", 2, True),
            ("FPO Business Development & E-NAM Trading Programme", "Data Analytics for Cooperatives", 3, False),
            ("PACS Credit & Warehouse Receipt Financing Programme", "Warehouse Receipt Financing", 1, True),
            ("PACS Credit & Warehouse Receipt Financing Programme", "Warehouse & Post-Harvest Management", 2, True),
            ("PACS Credit & Warehouse Receipt Financing Programme", "Cooperative Credit Operations", 3, False),
            ("Handloom & Handicraft Cooperative Enterprise Programme", "Coir & Handicraft Cooperative Enterprise", 1, True),
            ("Handloom & Handicraft Cooperative Enterprise Programme", "Handloom Design and Weaving Techniques", 2, True),
            ("Handloom & Handicraft Cooperative Enterprise Programme", "Women SHG Leadership Programme", 3, False),
            ("FPO Governance & Rural Marketing Programme", "Farmer Producer Organisation Formation & Governance", 1, True),
            ("FPO Governance & Rural Marketing Programme", "Cooperative Marketing & Branding", 2, True),
            ("FPO Governance & Rural Marketing Programme", "Micro-Credit & SHG Linkage Programme", 3, False),
        ]
        pc_rows = [
            dict(programme_id=prog_ids[pt], course_id=course_ids[ct], sequence_order=seq, is_mandatory=mand)
            for pt, ct, seq, mand in pc_links
        ]
        await bulk_sync(db, ProgrammeCourse, ("programme_id", "course_id"), pc_rows)

        # Direct programme_id on course rows (kept for legacy queries); only
        # set if currently NULL so re-runs / manual overrides aren't clobbered.
        direct_links = {
            "Cooperative Management Fundamentals": "Cooperative Management Fundamentals",
            "Dairy Cooperative Operations":        "Dairy Cooperative Operations",
            "Data Analytics for Cooperatives":     "Data Analytics for Cooperative Decision-Making",
            "Rural Development Fundamentals":      "Cooperative Management Fundamentals",
            "Dairy Farm Management":               "Dairy Farm Management Programme",
            "Cooperative Credit Operations":       "Cooperative Credit Operations Certificate",
            "AgriTech Fundamentals":               "AgriTech Fundamentals Programme",
            "Cold Chain Logistics Management":     "Cold Chain Logistics & Quality Management",
            "Cooperative Governance & Audit":      "Cooperative Governance & Audit Certification",
            "Organic Farming Certification":       "Organic Farming Certification Programme",
            "Handloom Design and Weaving Techniques": "Handloom Weaving & Export Marketing Programme",
            "Fisheries Cooperative Management":       "Fisheries Cooperative Management Programme",
            "Farmer Producer Organisation Formation & Governance": "Farmer Producer Organisation (FPO) Formation Programme",
            "PACS Computerisation & Digital Ledgers": "PACS Computerisation & Digital Banking Programme",
            "Warehouse Receipt Financing":            "PACS Credit & Warehouse Receipt Financing Programme",
            "Coir & Handicraft Cooperative Enterprise": "Handloom & Handicraft Cooperative Enterprise Programme",
        }
        for ctitle, ptitle in direct_links.items():
            await db.execute(
                update(Course)
                .where(Course.id == course_ids[ctitle], Course.programme_id.is_(None))
                .values(programme_id=prog_ids[ptitle])
            )

        # ===================================================================
        # 7. ASSESSMENTS (16 original + 20 new = 36)
        # ===================================================================
        print("  [7/15] Seeding assessments...")

        assessment_defs = [
            ("Cooperative Principles & Governance Quiz",     "Cooperative Management Fundamentals",   "Cooperative Governance",    25, 45, 60, 14),
            ("Data Analytics Proficiency Test",              "Data Analytics for Cooperatives",       "Data Analysis",             30, 60, 60, 21),
            ("Dairy Operations Practical Assessment",        "Dairy Cooperative Operations",          "Dairy Operations",          20, 40, 65, 10),
            ("Dairy Farm Management Test",                   "Dairy Farm Management",                 "Dairy Operations",          20, 35, 60, 12),
            ("Credit Operations Proficiency Quiz",           "Cooperative Credit Operations",         "Credit Appraisal",          25, 50, 65, 18),
            ("AgriTech Knowledge Assessment",                "AgriTech Fundamentals",                 "AgriTech",                  20, 40, 60, 15),
            ("Rural Finance & PACS Test",                    "Rural Finance & PACS Operations",       "Credit Appraisal",          25, 50, 65, 20),
            ("Cold Chain Operations Assessment",             "Cold Chain Logistics Management",       "Cold Chain Management",     20, 40, 65, 16),
            ("Digital Credit Appraisal Certification Test",  "Digital Credit Appraisal",              "Digital Credit Appraisal",  30, 60, 70, 25),
            ("Governance & Audit Proficiency Test",          "Cooperative Governance & Audit",        "Audit & Compliance",        25, 50, 65, 22),
            ("Organic Farming Standards Quiz",               "Organic Farming Certification",         "Organic Farming",           20, 40, 60, 18),
            ("Financial Management for Coops Test",          "Financial Management for Cooperatives", "Financial Management",      20, 40, 60, 14),
            ("Leadership Skills Self-Assessment",            "Leadership & Communication Skills",     "Leadership",                15, 30, 55, 10),
            ("Supply Chain Management Test",                 "Supply Chain & Quality Management",     "Supply Chain Logistics",    20, 40, 60, 19),
            ("Python Data Science Assessment",               "Python for Data Science",               "Python Programming",        30, 90, 65, 28),
            ("Rural Development Fundamentals Quiz",          "Rural Development Fundamentals",        "Rural Development",         20, 35, 60, 12),
            # --- new ---
            ("Handloom Weaving Techniques Assessment",       "Handloom Design and Weaving Techniques", "Handloom Design & Weaving", 20, 40, 60, 15),
            ("Handloom Export Marketing Test",               "Handloom Export Marketing",              "Handloom Design & Weaving", 20, 35, 60, 17),
            ("Fisheries Cooperative Management Quiz",        "Fisheries Cooperative Management",        "Fisheries Management",      20, 40, 60, 14),
            ("Fish Processing Standards Test",                "Fish Processing & Cold Storage",          "Fisheries Management",      20, 40, 65, 16),
            ("FPO Formation & Governance Test",               "Farmer Producer Organisation Formation & Governance", "FPO Governance", 25, 45, 60, 18),
            ("FPO Business Development Assessment",           "FPO Business Development & Market Linkages", "FPO Governance",        25, 50, 65, 20),
            ("Warehouse Management Proficiency Test",         "Warehouse & Post-Harvest Management",     "Warehouse Management",      20, 40, 60, 16),
            ("Warehouse Receipt Financing Test",              "Warehouse Receipt Financing",             "Warehouse Management",      20, 40, 65, 18),
            ("E-NAM Trading Platform Assessment",             "E-NAM Digital Trading Platform",          "E-NAM Trading",             20, 35, 65, 20),
            ("Micro-Credit & SHG Linkage Test",               "Micro-Credit & SHG Linkage Programme",    "Micro-Credit & SHG Linkage", 20, 40, 60, 14),
            ("PACS Digital Ledgers Assessment",               "PACS Computerisation & Digital Ledgers",  "Digital Credit Appraisal",  25, 45, 65, 19),
            ("Cooperative Marketing & Branding Quiz",         "Cooperative Marketing & Branding",        "Digital Marketing",         20, 35, 60, 15),
            ("GIS Applications Assessment",                   "GIS Applications in Cooperative Agriculture", "GIS & Remote Sensing",  20, 40, 60, 17),
            ("Poultry & Livestock Management Test",           "Poultry & Livestock Cooperative Management", "Dairy Operations",       20, 35, 60, 13),
            ("Cooperative Law & Bylaws Test",                 "Cooperative Law & Bylaws Drafting",       "Cooperative Governance",    25, 45, 65, 21),
            ("Cooperative HR & Member Relations Quiz",        "Cooperative HR & Member Relations",       "Leadership",                15, 30, 55, 11),
            ("Export Documentation Test",                     "Export Documentation for Agri Cooperatives", "Supply Chain Logistics", 20, 35, 60, 16),
            ("Insurance & Risk Products Quiz",                "Insurance & Risk Products for Cooperative Members", "Risk Management", 20, 40, 60, 14),
            ("Women SHG Leadership Assessment",               "Women SHG Leadership Programme",          "Leadership",                15, 30, 55, 12),
            ("Coir & Handicraft Enterprise Quiz",             "Coir & Handicraft Cooperative Enterprise", "Handloom Design & Weaving", 20, 35, 60, 15),
        ]
        assessment_rows = []
        course_assessment: dict = {}   # course_title -> (assessment_row_ref, skill_name)
        for title, ctitle, skill_name, tq, dm, ps, due_days in assessment_defs:
            row = dict(
                title=title, course_id=course_ids[ctitle], skill_name=skill_name,
                total_questions=tq, duration_minutes=dm, passing_score=ps,
                due_date=NOW + timedelta(days=due_days),
            )
            assessment_rows.append(row)
            if ctitle not in course_assessment:
                course_assessment[ctitle] = (row, skill_name)

        assessment_ids = await bulk_sync(db, Assessment, "title", assessment_rows)
        # resolve to (assessment_id, skill_name) now that ids are known
        course_to_assessment = {
            ctitle: (assessment_ids[row["title"]], skill_name)
            for ctitle, (row, skill_name) in course_assessment.items()
        }

        # ===================================================================
        # 8. TRAINEE USERS (~500 across 20 institutions)
        # ===================================================================
        print("  [8/15] Seeding trainee users...")

        trainee_rows = []
        trainee_meta = []  # (email, full_name, inst_key)
        for key, _name, _state in institution_defs:
            for full_name, email, clerk_id in gen_people(key, TRAINEES_PER_INSTITUTION, start_idx=0, tag="trainee"):
                trainee_rows.append(dict(
                    clerk_user_id=clerk_id, email=email, full_name=full_name,
                    role="trainee", organisation_id=inst_org_id[key],
                ))
                trainee_meta.append((email, full_name, key))

        trainee_email_ids = await bulk_sync(db, User, "email", trainee_rows)
        trainees = [
            {"id": trainee_email_ids[email], "full_name": full_name, "inst_key": key,
             "organisation_id": inst_org_id[key]}
            for email, full_name, key in trainee_meta
        ]

        # ===================================================================
        # 9. EMPLOYER / INSTITUTION ADMIN USERS
        # ===================================================================
        print("  [9/15] Seeding admin/employer users...")

        admin_rows = [
            dict(clerk_user_id="demo_institution_seed_001", email="admin.demo@irma.ac.in",       full_name="IRMA Admissions Office",      role="institution", organisation_id=inst_org_id["irma"]),
            dict(clerk_user_id="demo_employer_seed_001",    email="hr.demo@amul.coop",            full_name="Amul HR Desk",                role="employer",    organisation_id=emp_org_id["amul"]),
            dict(clerk_user_id="employer_seed_002",         email="hr.iffco@iffco.coop",          full_name="IFFCO Recruitment Team",      role="employer",    organisation_id=emp_org_id["iffco"]),
            dict(clerk_user_id="employer_seed_003",         email="careers@nabard.org",           full_name="NABARD HR Division",          role="employer",    organisation_id=emp_org_id["nabard"]),
            dict(clerk_user_id="employer_seed_004",         email="hr@nafscob.coop",              full_name="NAFSCOB Talent Acquisition",  role="employer",    organisation_id=emp_org_id["nafscob"]),
            dict(clerk_user_id="employer_seed_005",         email="hr@kscapex.coop",              full_name="Karnataka Apex Coop Bank HR", role="employer",    organisation_id=emp_org_id["ka_apex"]),
            dict(clerk_user_id="ncct_admin_seed_001",       email="director@ncct.gov.in",         full_name="NCCT Director General",       role="ncct_admin",  organisation_id=ncct_id),
            dict(clerk_user_id="inst_admin_vamnicom_001",   email="director@vamnicom.edu.in",     full_name="VAMNICOM Director",           role="institution", organisation_id=inst_org_id["vamnicom"]),
            dict(clerk_user_id="inst_admin_ricm_del_001",   email="director@ricm-delhi.gov.in",   full_name="RICM Delhi Director",         role="institution", organisation_id=inst_org_id["ricm_del"]),
            dict(clerk_user_id="inst_admin_icm_kol_001",    email="director@icm-kolkata.gov.in",  full_name="ICM Kolkata Principal",       role="institution", organisation_id=inst_org_id["icm_kol"]),
        ]
        await bulk_sync(db, User, "email", admin_rows)

        # ===================================================================
        # 10. BATCHES (one per programme)
        # ===================================================================
        print("  [10/15] Seeding batches...")

        batch_defs = [(title, f"{title[:30]} — Batch 2025-A") for title in own_prog_titles]
        batch_rows = [
            dict(programme_id=prog_ids[title], name=name,
                 start_date=NOW - timedelta(days=60), end_date=NOW + timedelta(days=30), capacity=40)
            for title, name in batch_defs
        ]
        batch_key_ids = await bulk_sync(db, Batch, ("programme_id", "name"), batch_rows)
        batch_ids = {title: batch_key_ids[(prog_ids[title], name)] for title, name in batch_defs}

        # ===================================================================
        # 11. NOMINATIONS, ENROLLMENTS, COURSE ENROLLMENTS, ASSESSMENT
        #     RESULTS, TRAINEE SKILLS, CERTIFICATES — the big scaling section.
        #     All rows are built in memory first (deterministic RNG order),
        #     then synced with ONE bulk call per table.
        # ===================================================================
        print("  [11/15] Seeding nominations, enrollments, assessments, certificates...")

        inst_to_progs: dict = {
            inst_org_id["vamnicom"]:      ["Cooperative Management Fundamentals", "Data Analytics for Cooperative Decision-Making", "Cold Chain Logistics & Quality Management"],
            inst_org_id["irma"]:          ["Cooperative Management Fundamentals", "Dairy Cooperative Operations", "Organic Farming Certification Programme"],
            inst_org_id["ricm_del"]:      ["Cooperative Credit Operations Certificate", "Cooperative Management Fundamentals", "AgriTech Fundamentals Programme"],
            inst_org_id["ricm_che"]:      ["Dairy Farm Management Programme", "Organic Farming Certification Programme", "Cooperative Management Fundamentals"],
            inst_org_id["icm_blr"]:       ["AgriTech Fundamentals Programme", "Cooperative Governance & Audit Certification", "Cooperative Management Fundamentals"],
            inst_org_id["icm_kol"]:       ["Cooperative Governance & Audit Certification", "Cooperative Credit Operations Certificate", "Cooperative Management Fundamentals"],
            inst_org_id["ndri_karnal"]:   ["Advanced Dairy Technology & Quality Assurance Programme", "Cooperative Management Fundamentals"],
            inst_org_id["bihar_bank"]:    ["PACS Computerisation & Digital Banking Programme", "Cooperative Management Fundamentals"],
            inst_org_id["rajasthan_icm"]: ["Cooperative Marketing & Rural Enterprise Programme", "Cooperative Management Fundamentals"],
            inst_org_id["kerala_icm"]:    ["Fisheries Cooperative Management Programme", "Cooperative Management Fundamentals"],
            inst_org_id["odisha_coop"]:   ["Coastal Fisheries & Cold Storage Cooperative Programme", "Cooperative Management Fundamentals"],
            inst_org_id["punjab_coop"]:   ["Punjab Dairy & PACS Modernisation Programme", "Cooperative Management Fundamentals"],
            inst_org_id["up_coop"]:       ["PACS Governance & Member Services Programme", "Cooperative Management Fundamentals"],
            inst_org_id["ap_handloom"]:   ["Handloom Weaving & Export Marketing Programme", "Cooperative Management Fundamentals"],
            inst_org_id["wb_fisheries"]:  ["Fish Processing & Cooperative Trade Programme", "Cooperative Management Fundamentals"],
            inst_org_id["assam_coop"]:    ["Farmer Producer Organisation (FPO) Formation Programme", "Cooperative Management Fundamentals"],
            inst_org_id["telangana_icm"]: ["FPO Business Development & E-NAM Trading Programme", "Cooperative Management Fundamentals"],
            inst_org_id["mp_coop"]:       ["PACS Credit & Warehouse Receipt Financing Programme", "Cooperative Management Fundamentals"],
            inst_org_id["tn_handloom"]:   ["Handloom & Handicraft Cooperative Enterprise Programme", "Cooperative Management Fundamentals"],
            inst_org_id["cg_coop"]:       ["FPO Governance & Rural Marketing Programme", "Cooperative Management Fundamentals"],
        }

        prog_to_courses: dict = {
            "Cooperative Management Fundamentals":       ["Cooperative Management Fundamentals", "Rural Development Fundamentals", "Financial Management for Cooperatives", "Leadership & Communication Skills"],
            "Dairy Cooperative Operations":              ["Dairy Cooperative Operations", "Cooperative Management Fundamentals", "Supply Chain & Quality Management"],
            "Data Analytics for Cooperative Decision-Making": ["Data Analytics for Cooperatives", "Python for Data Science"],
            "Dairy Farm Management Programme":           ["Dairy Farm Management", "Dairy Cooperative Operations"],
            "Cooperative Credit Operations Certificate": ["Cooperative Credit Operations", "Rural Finance & PACS Operations"],
            "AgriTech Fundamentals Programme":           ["AgriTech Fundamentals", "Data Analytics for Cooperatives"],
            "Cold Chain Logistics & Quality Management": ["Cold Chain Logistics Management", "Supply Chain & Quality Management"],
            "Cooperative Governance & Audit Certification": ["Cooperative Governance & Audit", "Cooperative Management Fundamentals"],
            "Organic Farming Certification Programme":   ["Organic Farming Certification", "Rural Development Fundamentals"],
            "Advanced Dairy Technology & Quality Assurance Programme": ["Dairy Cooperative Operations", "Poultry & Livestock Cooperative Management"],
            "PACS Computerisation & Digital Banking Programme": ["PACS Computerisation & Digital Ledgers", "Rural Finance & PACS Operations"],
            "Cooperative Marketing & Rural Enterprise Programme": ["Cooperative Marketing & Branding", "Rural Development Fundamentals"],
            "Fisheries Cooperative Management Programme": ["Fisheries Cooperative Management"],
            "Coastal Fisheries & Cold Storage Cooperative Programme": ["Fish Processing & Cold Storage", "Cold Chain Logistics Management"],
            "Punjab Dairy & PACS Modernisation Programme": ["Dairy Cooperative Operations", "PACS Computerisation & Digital Ledgers"],
            "PACS Governance & Member Services Programme": ["Cooperative Law & Bylaws Drafting", "Cooperative Governance & Audit"],
            "Handloom Weaving & Export Marketing Programme": ["Handloom Design and Weaving Techniques", "Handloom Export Marketing"],
            "Fish Processing & Cooperative Trade Programme": ["Fish Processing & Cold Storage", "Export Documentation for Agri Cooperatives"],
            "Farmer Producer Organisation (FPO) Formation Programme": ["Farmer Producer Organisation Formation & Governance", "Cooperative Law & Bylaws Drafting"],
            "FPO Business Development & E-NAM Trading Programme": ["FPO Business Development & Market Linkages", "E-NAM Digital Trading Platform"],
            "PACS Credit & Warehouse Receipt Financing Programme": ["Warehouse Receipt Financing", "Warehouse & Post-Harvest Management"],
            "Handloom & Handicraft Cooperative Enterprise Programme": ["Coir & Handicraft Cooperative Enterprise", "Handloom Design and Weaving Techniques"],
            "FPO Governance & Rural Marketing Programme": ["Farmer Producer Organisation Formation & Governance", "Micro-Credit & SHG Linkage Programme"],
        }

        prog_to_skills: dict = {
            "Cooperative Management Fundamentals":       ["Cooperative Management", "Cooperative Governance", "Rural Development"],
            "Dairy Cooperative Operations":              ["Dairy Operations", "Quality Assurance", "Supply Chain Logistics"],
            "Data Analytics for Cooperative Decision-Making": ["Data Analysis", "Python Programming"],
            "Dairy Farm Management Programme":           ["Dairy Operations", "Rural Development"],
            "Cooperative Credit Operations Certificate": ["Credit Appraisal", "Financial Management"],
            "AgriTech Fundamentals Programme":           ["AgriTech", "Data Analysis"],
            "Cold Chain Logistics & Quality Management": ["Cold Chain Management", "Supply Chain Logistics"],
            "Cooperative Governance & Audit Certification": ["Cooperative Governance", "Audit & Compliance"],
            "Organic Farming Certification Programme":   ["Organic Farming", "Quality Assurance"],
            "Advanced Dairy Technology & Quality Assurance Programme": ["Dairy Operations", "Quality Assurance"],
            "PACS Computerisation & Digital Banking Programme": ["Digital Credit Appraisal", "Credit Appraisal"],
            "Cooperative Marketing & Rural Enterprise Programme": ["Digital Marketing", "Rural Development"],
            "Fisheries Cooperative Management Programme": ["Fisheries Management", "Cooperative Management"],
            "Coastal Fisheries & Cold Storage Cooperative Programme": ["Fisheries Management", "Cold Chain Management"],
            "Punjab Dairy & PACS Modernisation Programme": ["Dairy Operations", "Credit Appraisal"],
            "PACS Governance & Member Services Programme": ["Cooperative Governance", "Audit & Compliance"],
            "Handloom Weaving & Export Marketing Programme": ["Handloom Design & Weaving", "Digital Marketing"],
            "Fish Processing & Cooperative Trade Programme": ["Fisheries Management", "Quality Assurance"],
            "Farmer Producer Organisation (FPO) Formation Programme": ["FPO Governance", "Cooperative Governance"],
            "FPO Business Development & E-NAM Trading Programme": ["FPO Governance", "E-NAM Trading"],
            "PACS Credit & Warehouse Receipt Financing Programme": ["Warehouse Management", "Financial Management"],
            "Handloom & Handicraft Cooperative Enterprise Programme": ["Handloom Design & Weaving", "Rural Development"],
            "FPO Governance & Rural Marketing Programme": ["FPO Governance", "Digital Marketing"],
        }

        nomination_rows, enrollment_rows = [], []
        course_enrollment_rows, assessment_result_rows = [], []
        trainee_skill_rows, certificate_rows = [], []
        certified_trainees = []

        for t in trainees:
            # ~12% of trainees have registered but not yet been nominated
            # anywhere — realistic funnel drop-off at the very first stage.
            if rng.random() < 0.12:
                continue

            org_id = t["organisation_id"]
            prog_titles = inst_to_progs.get(org_id, ["Cooperative Management Fundamentals"])

            for p_idx, ptitle in enumerate(prog_titles[:2]):
                if ptitle not in prog_ids:
                    continue
                status = "approved" if p_idx == 0 or rng.random() < 0.7 else "pending"
                nomination_rows.append(dict(
                    trainee_id=t["id"], programme_id=prog_ids[ptitle], status=status,
                    reviewed_at=NOW - timedelta(days=rng.randint(5, 30)),
                ))
                if status != "approved":
                    continue

                enrollment_rows.append(dict(trainee_id=t["id"], batch_id=batch_ids[ptitle], status="active"))

                # ~15% of approved nominations: enrolled but training not
                # started yet (0 course progress) — another funnel stage.
                if rng.random() < 0.15:
                    continue

                course_titles_for_prog = prog_to_courses.get(ptitle, [])
                total_score_sum, scored_courses = 0, 0

                for c_idx, ctitle in enumerate(course_titles_for_prog):
                    if ctitle not in course_ids:
                        continue
                    if c_idx == 0:
                        progress = rng.randint(70, 100)
                    elif c_idx == 1:
                        progress = rng.randint(40, 90)
                    else:
                        progress = rng.randint(10, 70)

                    ce_status = "completed" if progress >= 100 else "active"
                    course_enrollment_rows.append(dict(
                        trainee_id=t["id"], course_id=course_ids[ctitle],
                        progress=progress, status=ce_status,
                        last_accessed=NOW - timedelta(days=rng.randint(0, 10)),
                    ))

                    if ctitle in course_to_assessment:
                        a_id, skill_name = course_to_assessment[ctitle]
                        score = rng.randint(50, 96)
                        assessment_result_rows.append(dict(
                            assessment_id=a_id, trainee_id=t["id"], score=score,
                            passed=(score >= 60),
                            submitted_at=NOW - timedelta(days=rng.randint(1, 20)),
                            feedback="Excellent work!" if score >= 75 else "Good attempt. Focus on practical application.",
                        ))
                        total_score_sum += score
                        scored_courses += 1

                        if skill_name in skill_ids:
                            conf = min(100, score)
                            level = "Proficient" if score >= 80 else "Intermediate" if score >= 65 else "Foundational"
                            trainee_skill_rows.append(dict(
                                trainee_id=t["id"], skill_id=skill_ids[skill_name],
                                level=level, confidence=conf, verified=(score >= 70), evidence=[],
                            ))

                if scored_courses > 0:
                    avg_score = total_score_sum // scored_courses
                    if avg_score >= 70:
                        grade = "Distinction" if avg_score >= 85 else "First Class" if avg_score >= 75 else "Pass"
                        issue_date = NOW - timedelta(days=rng.randint(10, 90))
                        certificate_rows.append(dict(
                            trainee_id=t["id"], programme_id=prog_ids[ptitle],
                            verification_code=make_verification_code(t["full_name"], ptitle, issue_date.year),
                            issue_date=issue_date, status="active", grade=grade,
                            holder_name=t["full_name"], programme_title=ptitle,
                            issuer="National Council for Cooperative Training (NCCT)",
                            expiry_date=issue_date + timedelta(days=3 * 365),
                            skills_certified=prog_to_skills.get(ptitle, []),
                        ))
                        certified_trainees.append(t)

        await bulk_sync(db, Nomination, ("trainee_id", "programme_id"), nomination_rows)
        await bulk_sync(db, Enrollment, ("trainee_id", "batch_id"), enrollment_rows)
        await bulk_sync(db, CourseEnrollment, ("trainee_id", "course_id"), course_enrollment_rows)
        await bulk_sync(db, AssessmentResult, ("assessment_id", "trainee_id"), assessment_result_rows)
        await bulk_sync(db, TraineeSkill, ("trainee_id", "skill_id"), trainee_skill_rows)
        await bulk_sync(db, Certificate, ("trainee_id", "programme_id"), certificate_rows)

        # ===================================================================
        # 12. JOBS, APPLICATIONS & EMPLOYER FEEDBACK
        # ===================================================================
        print("  [12/15] Seeding jobs, applications and employer feedback...")

        jobs_defs = [
            dict(title="Dairy Procurement Supervisor",          employer_name="Amul Dairy Cooperative Union",                            location="Anand, Gujarat",       sector="Dairy",                   job_type="Full-time",  salary_range="₹4,50,000 – ₹6,00,000",  description="Lead milk chilling center operations and farmer producer group coordination.",                              skills_required=["Dairy Operations", "Communication", "Leadership"]),
            dict(title="Cold Chain Quality Analyst",            employer_name="Amul Dairy Cooperative Union",                            location="Ahmedabad, Gujarat",    sector="Dairy",                   job_type="Full-time",  salary_range="₹3,80,000 – ₹5,50,000",  description="Monitor temperature-controlled transport and enforce quality SLAs.",                                         skills_required=["Cold Chain Management", "Quality Assurance", "Supply Chain Logistics"]),
            dict(title="Agricultural Extension Officer",        employer_name="IFFCO - Indian Farmers Fertiliser Cooperative",           location="New Delhi",             sector="Agriculture",             job_type="Full-time",  salary_range="₹4,00,000 – ₹5,50,000",  description="Promote modern agricultural inputs and cooperative membership drives.",                                      skills_required=["Rural Development", "AgriTech", "Communication"]),
            dict(title="Cooperative Development Officer",       employer_name="NABARD - National Bank for Agriculture and Rural Development", location="Mumbai, Maharashtra", sector="Cooperative Management", job_type="Full-time",  salary_range="₹5,50,000 – ₹7,00,000",  description="Drive cooperative society development programmes nationally.",                                               skills_required=["Cooperative Management", "Rural Development", "Data Analysis", "Communication"]),
            dict(title="Rural Finance Analyst",                 employer_name="NABARD - National Bank for Agriculture and Rural Development", location="Hyderabad, Telangana", sector="Finance",              job_type="Full-time",  salary_range="₹5,00,000 – ₹6,50,000",  description="Appraise rural credit proposals and manage SHG linkage programmes.",                                        skills_required=["Credit Appraisal", "Financial Management", "Rural Development"]),
            dict(title="Digital Credit Officer",                employer_name="NABARD - National Bank for Agriculture and Rural Development", location="Pune, Maharashtra",  sector="Finance",              job_type="Full-time",  salary_range="₹5,50,000 – ₹7,50,000",  description="Deploy AI-enabled digital credit scoring for kisan credit cards.",                                          skills_required=["Digital Credit Appraisal", "Data Analysis", "Credit Appraisal"]),
            dict(title="PACS Audit Officer",                    employer_name="National Federation of State Cooperative Banks (NAFSCOB)", location="Kolkata, West Bengal",  sector="Governance",            job_type="Full-time",  salary_range="₹4,50,000 – ₹5,80,000",  description="Conduct statutory audits of Primary Agricultural Credit Societies.",                                         skills_required=["Audit & Compliance", "Cooperative Governance", "Financial Management"]),
            dict(title="Cooperative Credit Appraiser",         employer_name="National Federation of State Cooperative Banks (NAFSCOB)", location="Chennai, Tamil Nadu",   sector="Finance",              job_type="Contract",   salary_range="₹3,50,000 – ₹4,80,000",  description="Evaluate credit proposals from farmer groups and cooperative societies.",                                   skills_required=["Credit Appraisal", "Risk Management", "Communication"]),
            dict(title="Branch Manager – Cooperative Banking",  employer_name="Karnataka State Cooperative Apex Bank",                   location="Bengaluru, Karnataka",  sector="Banking",              job_type="Full-time",  salary_range="₹6,00,000 – ₹8,00,000",  description="Lead branch operations, deposit mobilisation, and member engagement.",                                      skills_required=["Cooperative Management", "Financial Management", "Leadership", "Communication"]),
            dict(title="AgriTech Solutions Executive",          employer_name="Karnataka State Cooperative Apex Bank",                   location="Mysuru, Karnataka",     sector="Technology",           job_type="Full-time",  salary_range="₹4,80,000 – ₹6,50,000",  description="Drive adoption of precision farming tools and agri-fintech products among member societies.",               skills_required=["AgriTech", "Data Analysis", "Communication"]),
            # --- new (15) ---
            dict(title="Handloom Marketing Executive",          employer_name="Andhra Pradesh State Handloom Weavers Cooperative Society (APCO)", location="Vijayawada, Andhra Pradesh", sector="Handloom", job_type="Full-time", salary_range="₹3,20,000 – ₹4,50,000", description="Drive marketing and e-commerce sales for handloom weaver cooperative products.", skills_required=["Handloom Design & Weaving", "Digital Marketing", "Communication"]),
            dict(title="Handloom Export Coordinator",           employer_name="Andhra Pradesh State Handloom Weavers Cooperative Society (APCO)", location="Vijayawada, Andhra Pradesh", sector="Handloom", job_type="Full-time", salary_range="₹3,80,000 – ₹5,20,000", description="Coordinate export documentation and buyer relationships for handloom exports.", skills_required=["Handloom Design & Weaving", "Supply Chain Logistics"]),
            dict(title="Fisheries Extension Officer",           employer_name="West Bengal State Fishermen's Cooperative Federation", location="Kolkata, West Bengal",        sector="Fisheries",  job_type="Full-time", salary_range="₹3,60,000 – ₹5,00,000", description="Provide technical extension services to coastal fishing cooperative societies.",   skills_required=["Fisheries Management", "Rural Development"]),
            dict(title="Fish Processing Plant Supervisor",      employer_name="West Bengal State Fishermen's Cooperative Federation", location="Digha, West Bengal",          sector="Fisheries",  job_type="Full-time", salary_range="₹4,00,000 – ₹5,40,000", description="Supervise fish processing quality standards and cold storage operations.",         skills_required=["Fisheries Management", "Quality Assurance", "Cold Chain Management"]),
            dict(title="FPO Business Development Executive",    employer_name="NABARD - National Bank for Agriculture and Rural Development", location="Bhopal, Madhya Pradesh", sector="Agriculture", job_type="Full-time", salary_range="₹4,20,000 – ₹6,00,000", description="Support Farmer Producer Organisations with business planning and market linkages.", skills_required=["FPO Governance", "Digital Marketing", "Communication"]),
            dict(title="Warehouse Operations Manager",          employer_name="Madhya Pradesh State Cooperative Marketing Federation (MARKFED)", location="Bhopal, Madhya Pradesh", sector="Logistics", job_type="Full-time", salary_range="₹4,50,000 – ₹6,20,000", description="Manage warehouse receipt operations and post-harvest storage facilities.",          skills_required=["Warehouse Management", "Supply Chain Logistics"]),
            dict(title="E-NAM Trading Desk Officer",            employer_name="Rajasthan State Cooperative Marketing Federation (RAJFED)", location="Jaipur, Rajasthan",      sector="Technology", job_type="Full-time", salary_range="₹4,00,000 – ₹5,60,000", description="Operate the e-NAM digital trading desk for agri-commodity price discovery.",       skills_required=["E-NAM Trading", "Data Analysis"]),
            dict(title="PACS Computerisation Officer",          employer_name="Bihar State Cooperative Bank",                          location="Patna, Bihar",                sector="Finance",    job_type="Full-time", salary_range="₹3,80,000 – ₹5,20,000", description="Roll out core banking and digital ledgers across Primary Agricultural Credit Societies.", skills_required=["Digital Credit Appraisal", "Data Analysis"]),
            dict(title="Micro-Credit & SHG Coordinator",        employer_name="Kerala State Cooperative Bank",                         location="Thiruvananthapuram, Kerala",  sector="Finance",    job_type="Full-time", salary_range="₹3,50,000 – ₹4,80,000", description="Coordinate self-help group formation and micro-credit bank linkage.",              skills_required=["Micro-Credit & SHG Linkage", "Rural Development"]),
            dict(title="Cooperative Society Accountant",        employer_name="Punjab State Cooperative Bank",                         location="Chandigarh, Punjab",          sector="Finance",    job_type="Full-time", salary_range="₹3,20,000 – ₹4,50,000", description="Maintain cooperative society accounts, audits, and statutory filings.",            skills_required=["Financial Management", "Audit & Compliance"]),
            dict(title="Milk Procurement Officer",              employer_name="Tamil Nadu Cooperative Milk Producers Federation (Aavin)", location="Chennai, Tamil Nadu",    sector="Dairy",      job_type="Full-time", salary_range="₹3,60,000 – ₹5,00,000", description="Manage milk procurement routes and farmer cooperative relationships.",             skills_required=["Dairy Operations", "Communication"]),
            dict(title="Dairy Quality Control Executive",       employer_name="Odisha State Cooperative Milk Producers Federation (OMFED)", location="Bhubaneswar, Odisha", sector="Dairy",      job_type="Full-time", salary_range="₹3,80,000 – ₹5,20,000", description="Enforce quality control standards across dairy cooperative processing units.",      skills_required=["Dairy Operations", "Quality Assurance"]),
            dict(title="Cooperative Marketing Officer",         employer_name="Uttar Pradesh Cooperative Federation Ltd (UPCF)",       location="Lucknow, Uttar Pradesh",      sector="Marketing",  job_type="Full-time", salary_range="₹3,40,000 – ₹4,70,000", description="Lead branding and marketing campaigns for cooperative federation products.",       skills_required=["Digital Marketing", "Communication"]),
            dict(title="Risk & Compliance Officer",             employer_name="Telangana State Cooperative Apex Bank",                 location="Hyderabad, Telangana",        sector="Banking",    job_type="Full-time", salary_range="₹4,60,000 – ₹6,30,000", description="Monitor risk exposure and regulatory compliance across cooperative bank branches.", skills_required=["Risk Management", "Audit & Compliance"]),
            dict(title="Rural Development Officer",             employer_name="National Cooperative Development Corporation (NCDC)",   location="New Delhi",                    sector="Rural Development", job_type="Full-time", salary_range="₹4,20,000 – ₹5,80,000", description="Implement national cooperative rural development schemes across states.",          skills_required=["Rural Development", "Communication", "Leadership"]),
        ]
        job_rows = [dict(jd) for jd in jobs_defs]
        job_key_ids = await bulk_sync(db, Job, ("title", "employer_name"), job_rows)
        # Restrict to jobs THIS script defines (job_key_ids may also contain
        # unrelated jobs created elsewhere, e.g. by repeated pytest /
        # verify_e2e_loop.py runs via POST /api/v1/jobs/ — sampling from
        # those too would make applications/feedback non-deterministic
        # across reruns and could keep adding new rows for the same
        # trainee every run).
        job_ids = [job_key_ids[(jd["title"], jd["employer_name"])] for jd in job_rows]

        application_rows = []
        for t in certified_trainees:
            target_jobs = rng.sample(job_ids, k=min(3, len(job_ids)))
            for jid in target_jobs:
                status = rng.choices(["applied", "shortlisted", "interviewed", "offered"], weights=[40, 30, 20, 10])[0]
                application_rows.append(dict(job_id=jid, applicant_id=t["id"], status=status))
        await bulk_sync(db, Application, ("job_id", "applicant_id"), application_rows)

        missing_skill_pool = ["Digital Marketing", "Python Programming", "GIS & Remote Sensing", "E-NAM Trading", "Warehouse Management"]
        feedback_rows = []
        hired = [t for t in certified_trainees if rng.random() < 0.3]
        for t in hired[:40]:
            jid = rng.choice(job_ids)
            feedback_rows.append(dict(
                trainee_id=t["id"], job_id=jid,
                useful_skills=rng.sample(all_skill_names, k=3),
                missing_skills=rng.sample(missing_skill_pool, k=1),
                training_relevance=rng.randint(7, 10),
                performance_rating=rng.randint(7, 10),
                comments="Good foundational training. More hands-on case studies would help.",
            ))
        await bulk_sync(db, EmployerFeedback, ("trainee_id", "job_id"), feedback_rows)

        # ===================================================================
        # 13. SKILL DEMAND INTELLIGENCE (14 entries across 14 distinct skills)
        # ===================================================================
        print("  [13/15] Seeding skill demand intelligence...")

        skill_demand_data = [
            dict(skill_name="Digital Marketing",        employer_demand_count=1240, trained_count=640,  gap_count=600),
            dict(skill_name="Credit Appraisal",         employer_demand_count=870,  trained_count=320,  gap_count=550),
            dict(skill_name="Data Analysis",            employer_demand_count=740,  trained_count=280,  gap_count=460),
            dict(skill_name="Dairy Operations",         employer_demand_count=980,  trained_count=820,  gap_count=160),
            dict(skill_name="Cooperative Governance",   employer_demand_count=650,  trained_count=590,  gap_count=60),
            dict(skill_name="Cold Chain Management",    employer_demand_count=520,  trained_count=180,  gap_count=340),
            dict(skill_name="Digital Credit Appraisal", employer_demand_count=610,  trained_count=140,  gap_count=470),
            dict(skill_name="AgriTech",                 employer_demand_count=480,  trained_count=210,  gap_count=270),
            dict(skill_name="Handloom Design & Weaving",employer_demand_count=430,  trained_count=150,  gap_count=280),
            dict(skill_name="Fisheries Management",     employer_demand_count=390,  trained_count=120,  gap_count=270),
            dict(skill_name="FPO Governance",           employer_demand_count=560,  trained_count=190,  gap_count=370),
            dict(skill_name="Warehouse Management",     employer_demand_count=340,  trained_count=110,  gap_count=230),
            dict(skill_name="E-NAM Trading",            employer_demand_count=310,  trained_count=80,   gap_count=230),
            dict(skill_name="Micro-Credit & SHG Linkage", employer_demand_count=480, trained_count=210, gap_count=270),
        ]
        skill_demand_rows = [dict(sd, updated_at=NOW) for sd in skill_demand_data]
        await bulk_sync(db, SkillDemand, "skill_name", skill_demand_rows)

        # ===================================================================
        # 14. ATTENDANCE SESSIONS & RECORDS (one QR session per programme)
        # ===================================================================
        print("  [14/15] Seeding attendance sessions and records...")

        session_defs = [(title, f"Day 1 Orientation — {title[:40]}") for title in own_prog_titles]
        session_rows = []
        for title, name in session_defs:
            token_raw = f"{prog_ids[title]}|{name}|{rng.random()}"
            session_rows.append(dict(
                programme_id=prog_ids[title], session_name=name,
                qr_token=hashlib.sha256(token_raw.encode()).hexdigest()[:32],
                valid_minutes=30, created_at=NOW - timedelta(days=rng.randint(1, 30)),
            ))
        session_key_ids = await bulk_sync(db, AttendanceSession, ("programme_id", "session_name"), session_rows)
        session_ids = {title: session_key_ids[(prog_ids[title], name)] for title, name in session_defs}

        attendance_rows = []
        for t in trainees:
            prog_titles_for_org = inst_to_progs.get(t["organisation_id"], [])
            for ptitle in prog_titles_for_org:
                if ptitle in session_ids and rng.random() < 0.85:
                    attendance_rows.append(dict(
                        session_id=session_ids[ptitle], trainee_id=t["id"],
                        method="qr", status="present",
                    ))
        await bulk_sync(db, AttendanceRecord, ("session_id", "trainee_id"), attendance_rows)

        # ===================================================================
        # 15. TIMETABLE, HOSTEL & LOGISTICS (IRMA campus)
        #     These three modules model a single physical campus (no
        #     institution selector exists in that part of the UI yet), so
        #     they're scoped to IRMA and reuse its real programmes, batches,
        #     trainers and trainees via foreign keys rather than inventing
        #     disconnected rows.
        # ===================================================================
        print("  [15/15] Seeding timetable, hostel and logistics...")

        def _prog_code(title: str) -> str:
            words = [w for w in title.replace("&", " ").replace("-", " ").split() if w[:1].isalpha()]
            return ("".join(w[0].upper() for w in words[:4]) or "GEN")[:4]

        irma_org_id = inst_org_id["irma"]
        irma_progs = ["Cooperative Management Fundamentals", "Dairy Cooperative Operations"]
        irma_trainees = [t for t in trainees if t["inst_key"] == "irma"]

        def _irma_batch_code(prog_title: str) -> str:
            return f"{prog_title[:30]} — Batch 2025-A"

        mohan_rao_id = trainer_ids["mohan.rao@irma.ac.in"]
        kavitha_nair_id = trainer_ids["kavitha.nair@irma.ac.in"]
        suresh_menon_id = trainer_ids["suresh.menon@irma.ac.in"]

        # --- 15a. Timetable slots -----------------------------------------
        timetable_defs = [
            ("Monday",    "09:00 AM", "Cooperative Management Fundamentals", "Hall A, IRMA Campus",       mohan_rao_id,    "Dr. Mohan Rao"),
            ("Tuesday",   "11:00 AM", "Dairy Cooperative Operations",        "Lab 2, Commerce Block",     suresh_menon_id, "Dr. Suresh Menon"),
            ("Wednesday", "02:00 PM", "Dairy Cooperative Operations",        "Dairy Plant Annexe, Anand", kavitha_nair_id, "Prof. Kavitha Nair"),
            ("Wednesday", "09:00 AM", "Cooperative Management Fundamentals", "Hall A, IRMA Campus",       suresh_menon_id, "Dr. Suresh Menon"),
            ("Friday",    "09:00 AM", "Cooperative Management Fundamentals", "Hall A, IRMA Campus",       mohan_rao_id,    "Dr. Mohan Rao"),
            ("Saturday",  "11:00 AM", "Dairy Cooperative Operations",        "Dairy Plant Annexe, Anand", kavitha_nair_id, "Prof. Kavitha Nair"),
        ]
        timetable_rows = [
            dict(
                organisation_id=irma_org_id, programme_id=prog_ids[title],
                batch_id=batch_ids[title], trainer_id=trainer_id,
                day_of_week=day, time_slot=time_slot, title=title,
                room=room, trainer_name=trainer_name,
            )
            for day, time_slot, title, room, trainer_id, trainer_name in timetable_defs
        ]
        await bulk_sync(db, TimetableSlot, ("day_of_week", "time_slot", "title"), timetable_rows)

        # --- 15b. Hostel blocks & rooms -------------------------------------
        block_defs = [
            ("A", "Nilkanth Boys Hostel", "Boys", [1, 2]),
            ("B", "Saraswati Girls Hostel", "Girls", [1, 2]),
        ]
        hostel_block_rows = [
            dict(organisation_id=irma_org_id, code=code, name=name, kind=kind, floors=floors)
            for code, name, kind, floors in block_defs
        ]
        hostel_block_ids = await bulk_sync(db, HostelBlock, "code", hostel_block_rows)

        # (room_code, block_code, floor, capacity, status)
        room_defs = [
            ("A-101", "A", 1, 3, "occupied"), ("A-102", "A", 1, 2, "occupied"),
            ("A-103", "A", 1, 3, "occupied"), ("A-104", "A", 1, 2, "vacant"),
            ("A-105", "A", 1, 3, "occupied"), ("A-106", "A", 1, 2, "maintenance"),
            ("A-201", "A", 2, 2, "occupied"), ("A-202", "A", 2, 2, "vacant"),
            ("A-203", "A", 2, 3, "occupied"), ("A-204", "A", 2, 2, "occupied"),
            ("A-205", "A", 2, 3, "vacant"),   ("A-206", "A", 2, 2, "occupied"),
            ("B-101", "B", 1, 2, "occupied"), ("B-102", "B", 1, 2, "occupied"),
            ("B-103", "B", 1, 3, "vacant"),   ("B-104", "B", 1, 2, "occupied"),
            ("B-201", "B", 2, 2, "occupied"), ("B-202", "B", 2, 2, "occupied"),
            ("B-203", "B", 2, 3, "maintenance"), ("B-204", "B", 2, 2, "vacant"),
        ]
        occupant_pool = irma_trainees[:13]
        occ_idx = 0
        hostel_room_rows = []
        for code, block_code, floor, capacity, status in room_defs:
            row = dict(
                block_id=hostel_block_ids[block_code], code=code, floor=floor,
                capacity=capacity, status=status,
                occupant_trainee_id=None, occupant_name=None, occupant_programme=None,
                check_in=None, check_out=None, note=None,
            )
            if status == "occupied" and occ_idx < len(occupant_pool):
                trainee = occupant_pool[occ_idx]
                occ_idx += 1
                prog_title = irma_progs[occ_idx % len(irma_progs)]
                row.update(
                    occupant_trainee_id=trainee["id"], occupant_name=trainee["full_name"],
                    occupant_programme=prog_title,
                    check_in=(NOW - timedelta(days=rng.randint(30, 90))).date(),
                    check_out=(NOW + timedelta(days=rng.randint(30, 90))).date(),
                )
            elif status == "maintenance":
                row["note"] = "Ceiling seepage — rewiring in progress" if code.startswith("A") else "Washroom seepage — plumber engaged"
            hostel_room_rows.append(row)
        await bulk_sync(db, HostelRoom, "code", hostel_room_rows)

        # --- 15c. Hostel waitlist -------------------------------------------
        waitlist_pool = irma_trainees[13:16]
        waitlist_preferences = [
            "Single occupancy, Block B only",
            "Any room, Block B preferred",
            "Ground floor preferred",
        ]
        hostel_waitlist_rows = [
            dict(
                organisation_id=irma_org_id, trainee_id=trainee["id"], name=trainee["full_name"],
                programme=irma_progs[idx % len(irma_progs)],
                applied_on=(NOW - timedelta(days=2 + idx * 3)).date(),
                preference=waitlist_preferences[idx % len(waitlist_preferences)],
            )
            for idx, trainee in enumerate(waitlist_pool)
        ]
        await bulk_sync(db, HostelWaitlistEntry, "trainee_id", hostel_waitlist_rows)

        # --- 15d. Logistics budget & tasks -----------------------------------
        await bulk_sync(db, LogisticsBudget, "organisation_id", [
            dict(organisation_id=irma_org_id, contingency_reserve=60000),
        ])

        logistics_task_defs = [
            ("Book two mini buses for the Anand dairy procurement visit", "Travel",    "Dairy Cooperative Operations",        "Mr. Sanjay Kulkarni",  2,   18000, False),
            ("Arrange lunch for the practical bookkeeping session",       "Catering",  "Cooperative Management Fundamentals", "Prof. Kavitha Nair",   3,   9500,  False),
            ("Print 200 bilingual trainee handbooks",                    "Materials", "Cooperative Management Fundamentals", "Dr. Suresh Menon",     -2,  22000, False),
            ("Confirm Hall A availability for the governance workshop",   "Venue",     "Cooperative Management Fundamentals", "Dr. Mohan Rao",        -4,  4000,  True),
            ("Procure 12 milk testing kits for FAT and SNF analysis",     "Equipment", "Dairy Cooperative Operations",        "Dr. Suresh Menon",     5,   74000, False),
            ("Run the daily shuttle from Anand railway station to campus","Travel",    "Cooperative Management Fundamentals", "Dr. Mohan Rao",        -8,  12000, True),
            ("Refreshments for the AGM case-study clinic",                "Catering",  "Cooperative Management Fundamentals", "Dr. Mohan Rao",        -3,  6800,  False),
            ("Reserve 20 dormitory beds for the incoming dairy cohort",   "Venue",     "Dairy Cooperative Operations",        "Prof. Kavitha Nair",   10,  52000, False),
            ("Hire a diesel generator backup for the Anand campus",      "Equipment", "Dairy Cooperative Operations",        "Mr. Sanjay Kulkarni",  12,  15500, False),
            ("Pull the QR kiosk attendance export for the CMF cohort",   "Materials", "Cooperative Management Fundamentals", "Dr. Suresh Menon",     -1,  0,     True),
        ]
        logistics_task_rows = [
            dict(
                organisation_id=irma_org_id, programme_id=prog_ids[prog_title],
                programme=prog_title, programme_code=_prog_code(prog_title),
                batch_id=batch_ids[prog_title], batch_code=_irma_batch_code(prog_title),
                category=category, title=title, owner=owner,
                due_date=(NOW + timedelta(days=due_offset)).date(),
                done=done, estimated_cost=cost,
            )
            for title, category, prog_title, owner, due_offset, cost, done in logistics_task_defs
        ]
        await bulk_sync(db, LogisticsTask, "title", logistics_task_rows)

        # --- 15e. Vehicle allocations -----------------------------------------
        vehicle_defs = [
            ("GJ-04-KL-2287", "Mini Bus",        26, "Anand Railway Station → IRMA Campus",  "Cooperative Management Fundamentals", "Anand Railway Station, Platform 4",   "08:15", "Ramesh Bhai Solanki", "9825014477", "Confirmed"),
            ("GJ-18-FG-9012", "Tempo Traveller",  12, "Kheda → Anand procurement cluster",     "Dairy Cooperative Operations",        "Kheda District Dairy Union Gate",     "07:00", "Hitesh Parmar",       "9879551204", "Confirmed"),
            ("GJ-01-HD-7734", "Car",               4, "Pune → Anand (faculty arrival)",        "Cooperative Management Fundamentals", "Pune Airport, Terminal 2",             "13:20", "Suresh Jadhav",       "9922880163", "Awaiting confirmation"),
        ]
        vehicle_rows = [
            dict(
                organisation_id=irma_org_id, batch_id=batch_ids[prog_title],
                batch_code=_irma_batch_code(prog_title), vehicle_no=vehicle_no, type=vtype,
                seats=seats, route=route, pick_up_point=pick_up, departure=departure,
                driver=driver, driver_phone=phone, status=status,
            )
            for vehicle_no, vtype, seats, route, prog_title, pick_up, departure, driver, phone, status in vehicle_defs
        ]
        await bulk_sync(db, VehicleAllocation, "vehicle_no", vehicle_rows)

        await db.commit()

        elapsed = time.perf_counter() - t_start
        print("")
        print("✅  Seed complete! Summary of entities generated this run:")
        print(f"    Institutions        : {len(institution_names)} + {len(employer_defs)} employer orgs + 1 NCCT")
        print(f"    Trainers            : {len(trainer_rows)}")
        print(f"    Programmes          : {len(prog_rows)}")
        print(f"    Courses             : {len(course_rows)}")
        print(f"    Assessments         : {len(assessment_rows)}")
        print(f"    Trainees            : {len(trainees)}")
        print(f"    Nominations         : {len(nomination_rows)}")
        print(f"    Enrollments         : {len(enrollment_rows)}")
        print(f"    Course enrollments  : {len(course_enrollment_rows)}")
        print(f"    Assessment results  : {len(assessment_result_rows)}")
        print(f"    Trainee skills      : {len(trainee_skill_rows)}")
        print(f"    Certificates        : {len(certificate_rows)}")
        print(f"    Jobs                : {len(job_ids)}")
        print(f"    Applications        : {len(application_rows)}")
        print(f"    Employer feedback   : {len(feedback_rows)}")
        print(f"    Skill demand rows   : {len(skill_demand_rows)}")
        print(f"    Attendance sessions : {len(session_ids)}")
        print(f"    Attendance records  : {len(attendance_rows)}")
        print(f"    Timetable slots     : {len(timetable_rows)}")
        print(f"    Hostel rooms        : {len(hostel_room_rows)}")
        print(f"    Hostel waitlist     : {len(hostel_waitlist_rows)}")
        print(f"    Logistics tasks     : {len(logistics_task_rows)}")
        print(f"    Vehicle allocations : {len(vehicle_rows)}")
        print(f"    Elapsed             : {elapsed:.1f}s")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
