"""Idempotent authored learning content for the scratch demo catalogue, plus
a curated SWAYAM/NPTEL external-course catalogue (app.models.content.ExternalCourse).

Course entries are (title, category, level, modules), where modules is a list
of (module_title, lesson_specs) so a course can carry more than one authored
module. Existing (course, module, lesson) triples are matched by title and
never overwritten once they have content — only missing ones are filled in,
so re-running this after a schema/content change is always safe and a prior
authored lesson is never silently replaced.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import ExternalCourse
from app.models.course import Course, Module, Lesson
from app.seeds import register


def _now():
    return datetime.now(timezone.utc)


COURSES = (
    ("Cooperative Management Fundamentals", "Management", "Foundation", [
        ("1. Introduction to Cooperative Principles & Values", [
            ("A member owned enterprise", "mixed", [
                {"type": "text", "text": "A cooperative is owned and governed by its members. Each member has a voice in major decisions."},
                {"type": "image", "url": "/media/learning/cooperative-members.svg", "alt": "Members voting at a cooperative meeting"},
                {"type": "callout", "title": "Remember", "text": "Member benefit guides the enterprise."},
                {"type": "flashcards", "cards": [
                    {"front": "Member", "back": "An owner and participant in the cooperative."},
                    {"front": "General body", "back": "The assembly where members vote on major decisions."},
                ]},
            ]),
            ("Choose a fair decision", "scenario", [
                {"type": "scenario", "prompt": "A dairy cooperative has a surplus. What should its board do first?", "options": [
                    {"id": "a", "text": "Ask members to decide how the surplus serves shared goals.", "consequence": "Members can choose a fair, transparent use of the surplus."},
                    {"id": "b", "text": "Pay only board members.", "consequence": "This conflicts with member ownership and trust."},
                ]},
                {"type": "quiz", "question": "Who owns a cooperative?", "options": ["Its members", "Only its chair", "A supplier"], "correct_index": 0, "explanation": "Members jointly own and govern it."},
            ]),
        ]),
        ("3. Financial Accounting in Cooperatives", [
            ("Reading a cooperative's balance sheet", "mixed", [
                {"type": "text", "text": "A cooperative's balance sheet separates member funds, statutory reserves and outside liabilities. Reading it correctly protects members' money and builds trust with auditors and lenders."},
                {"type": "image", "url": "/media/learning/balance-sheet-sample.svg", "alt": "Sample cooperative balance sheet layout"},
                {"type": "callout", "title": "Why it matters", "text": "Byelaws usually require the statutory reserve to be funded every year before any dividend is paid."},
                {"type": "quiz", "question": "Which fund must a cooperative build up before distributing a dividend?", "options": ["Statutory reserve fund", "Staff welfare fund", "Marketing fund"], "correct_index": 0, "explanation": "Most cooperative byelaws require the statutory reserve to be funded first."},
                {"type": "text", "text": "Summary: check the reserve fund, member equity and liabilities before approving any surplus distribution."},
            ], 9),
            ("Statutory reserves and dividend rules", "mixed", [
                {"type": "text", "text": "A cooperative's surplus is not company profit — its use is governed by the byelaws and the general body, not by management alone."},
                {"type": "video", "url": "https://www.w3schools.com/html/mov_bbb.mp4", "title": "How cooperative dividends are calculated", "downloadable": True},
                {"type": "flashcards", "cards": [
                    {"front": "Statutory reserve", "back": "A mandatory share of surplus set aside before any dividend."},
                    {"front": "Patronage dividend", "back": "A surplus return based on a member's use of the cooperative, not their shareholding."},
                ]},
                {"type": "quiz", "question": "A patronage dividend is based mainly on:", "options": ["How much a member used the cooperative's services", "How many shares a member holds", "How long a member has been on the board"], "correct_index": 0, "explanation": "Patronage dividends reward usage, which is a core cooperative principle."},
                {"type": "text", "text": "Summary: reserves come first, then any dividend follows the byelaws — usually weighted by patronage, not just shareholding."},
            ], 11),
        ]),
    ]),
    ("Data Analytics for Cooperatives", "Technology", "Intermediate", [
        ("1. Fundamentals of Member Data & Ledger Analysis", [
            ("Understand a sales trend", "mixed", [
                {"type": "text", "text": "Record sales consistently before comparing periods. Check units, missing entries and seasonal changes."},
                {"type": "video", "url": "https://www.youtube.com/watch?v=2I6uyr0pW7k", "title": "Introduction to data analysis", "downloadable": False},
                {"type": "audio", "url": "/media/learning/data-summary.mp3", "title": "Sales data summary"},
                {"type": "quiz", "question": "What should you check before comparing monthly sales?", "options": ["Units and missing entries", "Only the chart colour", "The file name"], "correct_index": 0, "explanation": "Reliable comparisons start with consistent data."},
            ]),
            ("Explain a result", "scenario", [
                {"type": "scenario", "prompt": "Sales rise during a festival month. How do you report this?", "options": [
                    {"id": "a", "text": "Mention the seasonal event and compare with the same month last year.", "consequence": "This gives members useful context."},
                    {"id": "b", "text": "Claim growth will continue every month.", "consequence": "One seasonal month does not establish a trend."},
                ]},
            ]),
        ]),
    ]),
    ("Rural Development Fundamentals", "Rural", "Foundation", [
        ("1. Socio-Economic Framework of Rural Cooperatives", [
            ("Understanding rural livelihoods", "mixed", [
                {"type": "text", "text": "Most rural households combine farming with a second activity — dairy, wage labour, a small trade — to manage seasonal risk. A cooperative that understands this mix serves its members better."},
                {"type": "image", "url": "/media/learning/rural-livelihoods.svg", "alt": "A farming household's mixed sources of income"},
                {"type": "callout", "title": "Remember", "text": "A single-crop failure should not mean a member has no income at all."},
                {"type": "quiz", "question": "Why do many rural households combine farming with another activity?", "options": ["To manage seasonal and crop risk", "Because farming is not allowed alone", "To avoid joining a cooperative"], "correct_index": 0, "explanation": "Diversified income cushions the household against a bad season."},
                {"type": "text", "text": "Summary: a resilient rural livelihood usually blends farming with dairy, labour or trade — plan cooperative services around that mix."},
            ], 8),
            ("SHG–cooperative linkages in practice", "mixed", [
                {"type": "text", "text": "Self-Help Groups (SHGs) pool small savings and lend within the group. Linking an SHG to a cooperative bank or PACS gives members access to larger, cheaper credit once the group has a track record."},
                {"type": "video", "url": "https://www.w3schools.com/html/mov_bbb.mp4", "title": "How an SHG links to a cooperative bank", "downloadable": True},
                {"type": "flashcards", "cards": [
                    {"front": "SHG", "back": "A small group of members who save and lend among themselves."},
                    {"front": "SHG-Bank linkage", "back": "A scheme where a bank or PACS lends to an SHG based on its savings and repayment record."},
                ]},
                {"type": "scenario", "prompt": "An SHG with a strong 18-month repayment record asks a PACS for a larger loan to buy shared irrigation equipment.", "options": [
                    {"id": "a", "text": "Review its savings and repayment history and consider a linkage loan.", "consequence": "This follows the standard SHG-bank linkage practice and rewards a good track record."},
                    {"id": "b", "text": "Refuse without reviewing the record.", "consequence": "This misses a low-risk lending opportunity the record actually supports."},
                ]},
                {"type": "text", "text": "Summary: an SHG's savings and repayment record — not just its request — should drive the linkage lending decision."},
            ], 10),
        ]),
    ]),
)


async def seed_learning(db: AsyncSession) -> None:
    for title, category, level, modules in COURSES:
        course = (await db.execute(select(Course).where(Course.title == title).limit(1))).scalar_one_or_none()
        if course is None:
            course = Course(id=uuid.uuid4(), title=title, category=category, level=level,
                            duration_hours=2, source="native", is_active=True)
            db.add(course)
            await db.flush()
        for module_position, (module_title, lesson_specs) in enumerate(modules, 1):
            module = (await db.execute(select(Module).where(
                Module.course_id == course.id, Module.title == module_title).limit(1)
            )).scalar_one_or_none()
            if module is None:
                module = Module(id=uuid.uuid4(), course_id=course.id, title=module_title, position=999 + module_position)
                db.add(module)
                await db.flush()
            for position, spec in enumerate(lesson_specs, 1):
                lesson_title, lesson_type, blocks = spec[0], spec[1], spec[2]
                duration_min = spec[3] if len(spec) > 3 else 8
                lesson = (await db.execute(select(Lesson).where(
                    Lesson.module_id == module.id, Lesson.title == lesson_title).limit(1)
                )).scalar_one_or_none()
                if lesson is None:
                    db.add(Lesson(id=uuid.uuid4(), module_id=module.id, title=lesson_title,
                                  position=position, lesson_type=lesson_type, duration_min=duration_min,
                                  content=blocks, content_version=1))
                elif lesson.content is None:
                    lesson.content = blocks
                    lesson.position = position
                    lesson.lesson_type = lesson_type
                    lesson.duration_min = duration_min
    await db.flush()
    await _seed_external_catalogue(db)
    await db.flush()


# ---------------------------------------------------------------------------
# Curated free SWAYAM/NPTEL catalogue (app.models.content.ExternalCourse).
#
# Schema note: ExternalCourse has no dedicated `category`/`level` column (only
# source, external_id, title, description, url, provider_name, thumbnail_url,
# language, duration_min, rating, skills, course_id — see app/models/content.py).
# Category and level are therefore recorded in `description` and `skills`
# rather than inventing new columns, per this task's no-new-migration rule.
# (source, provider display, title, url, category, level, language, duration_min, rating, skills)
# ---------------------------------------------------------------------------
EXTERNAL_COURSES = (
    ("nptel", "NPTEL — IIT Kharagpur", "Cooperation and Rural Development", "https://onlinecourses.nptel.ac.in/noc24_mg51/preview", "Management", "Beginner", "en", 480, 4.4, ["Cooperative Management", "Rural Development"]),
    ("nptel", "NPTEL — IIT Kharagpur", "Agricultural Finance and Rural Credit", "https://onlinecourses.nptel.ac.in/noc24_ag18/preview", "Finance", "Intermediate", "en", 600, 4.3, ["Financial Management", "Credit Appraisal"]),
    ("nptel", "NPTEL — IIT Kharagpur", "Farm Machinery and Equipment", "https://onlinecourses.nptel.ac.in/noc23_ag29/preview", "Agriculture", "Beginner", "en", 540, 4.2, ["Rural Development"]),
    ("nptel", "NPTEL — IIT Roorkee", "Principles of Management", "https://onlinecourses.nptel.ac.in/noc24_mg14/preview", "Management", "Beginner", "en", 480, 4.5, ["Cooperative Management", "Leadership"]),
    ("nptel", "NPTEL — IIT Kanpur", "Human Resource Management", "https://onlinecourses.nptel.ac.in/noc24_mg22/preview", "Management", "Intermediate", "en", 600, 4.3, ["Leadership", "Communication"]),
    ("nptel", "NPTEL — IIT Madras", "Fundamentals of Financial Management", "https://onlinecourses.nptel.ac.in/noc24_mg09/preview", "Finance", "Beginner", "en", 540, 4.4, ["Financial Management"]),
    ("nptel", "NPTEL — IIM Bangalore", "Rural Marketing", "https://onlinecourses.nptel.ac.in/noc24_mg37/preview", "Marketing", "Intermediate", "en", 480, 4.2, ["Digital Marketing", "Rural Development"]),
    ("nptel", "NPTEL — IIT Kharagpur", "Value Chain Management for Agribusiness", "https://onlinecourses.nptel.ac.in/noc24_ag27/preview", "Agriculture", "Advanced", "en", 660, 4.1, ["Supply Chain Logistics"]),
    ("nptel", "NPTEL — IIT Roorkee", "Soil and Water Conservation Engineering", "https://onlinecourses.nptel.ac.in/noc23_ag12/preview", "Agriculture", "Intermediate", "en", 600, 4.0, ["Organic Farming"]),
    ("nptel", "NPTEL — IIT Delhi", "Project Management", "https://onlinecourses.nptel.ac.in/noc24_mg44/preview", "Management", "Intermediate", "en", 480, 4.3, ["Cooperative Management"]),
    ("nptel", "NPTEL — IIT Kanpur", "Organizational Behaviour", "https://onlinecourses.nptel.ac.in/noc24_hs45/preview", "Management", "Beginner", "en", 420, 4.2, ["Leadership", "Communication"]),
    ("nptel", "NPTEL — IIT Bombay", "GIS Applications in Rural Development", "https://onlinecourses.nptel.ac.in/noc24_ce41/preview", "Technology", "Advanced", "en", 600, 4.1, ["GIS & Remote Sensing"]),
    ("swayam", "SWAYAM — IGNOU", "Cooperative Management and Administration", "https://onlinecourses.swayam2.ac.in/cec24_ge08/preview", "Management", "Beginner", "en", 420, 4.5, ["Cooperative Management", "Cooperative Governance"]),
    ("swayam", "SWAYAM — IGNOU", "Banking and Insurance", "https://onlinecourses.swayam2.ac.in/cec24_cm12/preview", "Finance", "Beginner", "en", 480, 4.2, ["Financial Management", "Risk Management"]),
    ("swayam", "SWAYAM — NIOS", "Financial Literacy and Inclusion", "https://onlinecourses.swayam2.ac.in/ntr24_ge05/preview", "Finance", "Beginner", "hi", 360, 4.3, ["Financial Management", "Micro-Credit & SHG Linkage"]),
    ("swayam", "SWAYAM — IGNOU", "Women Empowerment and Rural Development", "https://onlinecourses.swayam2.ac.in/cec24_ge19/preview", "Rural Development", "Beginner", "hi", 420, 4.4, ["Rural Development", "Micro-Credit & SHG Linkage"]),
    ("swayam", "SWAYAM — NIRDPR", "Agripreneurship and Rural Enterprise", "https://onlinecourses.swayam2.ac.in/ntr24_mg09/preview", "Agriculture", "Intermediate", "en", 540, 4.1, ["Rural Development", "Digital Marketing"]),
    ("swayam", "SWAYAM — IGNOU", "Fundamentals of Accounting and Bookkeeping", "https://onlinecourses.swayam2.ac.in/cec24_cm21/preview", "Finance", "Beginner", "en", 420, 4.3, ["Financial Management"]),
    ("swayam", "SWAYAM — NIRDPR", "e-Governance in Panchayati Raj Institutions", "https://onlinecourses.swayam2.ac.in/ntr24_ge13/preview", "Governance", "Intermediate", "en", 480, 4.0, ["Cooperative Governance", "Audit & Compliance"]),
    ("swayam", "SWAYAM — ICAR", "Sustainable Agriculture Practices", "https://onlinecourses.swayam2.ac.in/aic24_ag06/preview", "Agriculture", "Intermediate", "en", 540, 4.4, ["Organic Farming"]),
    ("swayam", "SWAYAM — NDRI Karnal", "Dairy Technology and Quality Assurance", "https://onlinecourses.swayam2.ac.in/aic24_ag14/preview", "Agriculture", "Advanced", "en", 660, 4.5, ["Dairy Operations", "Quality Assurance"]),
    ("swayam", "SWAYAM — NIRDPR", "Microfinance and Self-Help Groups", "https://onlinecourses.swayam2.ac.in/ntr24_mg17/preview", "Finance", "Intermediate", "hi", 480, 4.3, ["Micro-Credit & SHG Linkage", "Rural Development"]),
)


def _slug(text: str) -> str:
    return "-".join("".join(ch.lower() if ch.isalnum() else " " for ch in text).split())


async def _seed_external_catalogue(db: AsyncSession) -> None:
    existing = set((await db.execute(select(ExternalCourse.source, ExternalCourse.external_id))).all())
    now = _now()
    for source, provider_name, title, url, category, level, language, duration_min, rating, skills in EXTERNAL_COURSES:
        external_id = _slug(title)
        if (source, external_id) in existing:
            continue
        db.add(ExternalCourse(
            id=uuid.uuid4(), source=source, external_id=external_id, title=title,
            description=f"Category: {category}. Level: {level}. A free self-paced course on {title.lower()} "
                        f"for cooperative-sector learners, hosted on {provider_name.split(' — ')[0]}.",
            url=url, provider_name=provider_name, language=language, duration_min=duration_min,
            rating=rating, skills=skills, fetched_at=now, last_seen_at=now,
        ))


register("learning", seed_learning)
