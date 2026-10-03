"""Idempotent demo seed for the Trainer workspace (Dr. S. Kumar, VAMNICOM).

Run:  PYTHONPATH=backend python -m app.seed_trainer  [--reset]

All people/records are fictional prototype data. It only INSERTs new rows and
never touches rows belonging to other seeds; --reset removes only what this
script created (identified by the trainer's organisation + `@vamnicom-demo` emails).
"""
import asyncio
import random
import secrets
import sys
import uuid
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select, delete, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models import (
    Organisation, User, Programme, Batch, Enrollment, ProgrammeCourse, Course, CourseEnrollment,
    TimetableSlot, AttendanceSession, AttendanceRecord, Assessment, AssessmentQuestion,
    AssessmentAttempt, AssessmentResult, Skill, TraineeSkill, BatchCourse, Assignment,
    AssignmentSubmission, Announcement, DirectMessage, SkillEvaluation, Module, Lesson, ModuleProgress,
)

IST = ZoneInfo("Asia/Kolkata")
TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"
TRAINEE_DOMAIN = "@vamnicom-demo.example.com"

FIRST = ["Rahul", "Priya", "Kiran", "Anjali", "Vikram", "Sneha", "Amit", "Pooja", "Rohan", "Neha", "Suresh", "Meera",
         "Arjun", "Divya", "Manish", "Kavita", "Sanjay", "Rekha", "Deepak", "Sunita", "Nitin", "Asha", "Ganesh",
         "Lata", "Prakash", "Shweta", "Mahesh", "Swati", "Yogesh", "Madhuri", "Rajesh", "Anita", "Sachin", "Usha",
         "Ramesh", "Geeta", "Tushar", "Jyoti", "Harish", "Bhavna"]
LAST = ["Kumar", "Sharma", "Deshmukh", "Patil", "Joshi", "Kulkarni", "Pawar", "Jadhav", "More", "Shinde", "Gaikwad",
        "Thakur", "Iyer", "Nair", "Reddy", "Singh", "Verma", "Mishra", "Chavan", "Bhosale", "Naik", "Desai", "Mehta"]

COURSES = {
    "CM": ("Cooperative Management", "Management"),
    "RE": ("Rural Entrepreneurship", "Entrepreneurship"),
    "DS": ("Digital Skills for Cooperatives", "Digital"),
    "CA": ("Cooperative Accounting", "Finance"),
}
# batch -> (programme title, size, [course keys])
BATCHES = {
    "CM-24": ("Cooperative Management Certificate", 44, ["CM", "CA"]),
    "RE-12": ("Rural Entrepreneurship Programme", 44, ["RE"]),
    "DS-18": ("Digital Skills for Cooperatives", 40, ["DS"]),
}
# (weekday, start, end, batch, course key, room)
SLOTS = [
    ("Monday", "09:30", "11:00", "CM-24", "CM", "Room 204"),
    ("Monday", "11:30", "13:00", "RE-12", "RE", "Room 108"),
    ("Monday", "14:00", "15:30", "DS-18", "DS", "Lab 3"),
    ("Tuesday", "09:30", "11:00", "CM-24", "CA", "Room 204"),
    ("Tuesday", "11:30", "13:00", "RE-12", "RE", "Room 108"),
    ("Tuesday", "14:00", "15:30", "DS-18", "DS", "Lab 3"),
    ("Wednesday", "09:30", "11:00", "CM-24", "CM", "Room 204"),
    ("Wednesday", "11:30", "13:00", "RE-12", "RE", "Room 108"),
    ("Wednesday", "14:00", "15:30", "DS-18", "DS", "Lab 3"),
    ("Thursday", "09:30", "11:00", "CM-24", "CA", "Room 204"),
    ("Thursday", "11:30", "13:00", "RE-12", "RE", "Room 108"),
    ("Thursday", "14:00", "15:30", "DS-18", "DS", "Lab 3"),
    ("Friday", "09:30", "11:00", "CM-24", "CM", "Room 204"),
    ("Friday", "11:30", "13:00", "RE-12", "RE", "Room 108"),
    ("Friday", "14:00", "15:30", "CM-24", "CA", "Room 204"),
    ("Saturday", "09:30", "11:00", "CM-24", "CM", "Room 204"),
    ("Saturday", "11:30", "13:00", "DS-18", "DS", "Lab 3"),
    ("Saturday", "14:00", "15:30", "RE-12", "RE", "Room 108"),
]
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

SKILL_OF = {"CM": "Cooperative Management", "CA": "Data Analysis", "DS": "Digital Literacy", "RE": "Communication"}
SKILLS = ["Cooperative Management", "Communication", "Digital Literacy", "Data Analysis"]

MCQ = {
    "CM": [
        ("Which principle states that members control the cooperative democratically?", ["Open membership", "Democratic member control", "Autonomy", "Concern for community"], 1),
        ("The ultimate authority in a cooperative society is the…", ["Chairperson", "General body", "Manager", "Registrar"], 1),
        ("Share capital of a member is generally…", ["Unlimited", "Limited to face value", "Refundable daily", "Transferable freely"], 1),
        ("A cooperative's surplus is distributed primarily as…", ["Dividend on patronage", "Executive bonus", "Tax", "Donation only"], 0),
        ("Which body audits a cooperative society?", ["Statutory auditor", "Local panchayat", "Bank", "Employer"], 0),
    ],
    "RE": [
        ("The first step in a business plan is…", ["Hiring staff", "Market research", "Buying machinery", "Advertising"], 1),
        ("Working capital is used for…", ["Land purchase", "Day-to-day operations", "Building", "Patents"], 1),
        ("A SWOT analysis examines…", ["Strengths and weaknesses only", "Internal and external factors", "Tax only", "Staff"], 1),
        ("Break-even means…", ["Profit is maximum", "Revenue equals total cost", "Loss is maximum", "No sales"], 1),
        ("Which scheme supports rural micro-enterprises?", ["MUDRA", "FIFA", "NASA", "WTO"], 0),
    ],
    "DS": [
        ("UPI stands for…", ["Unified Payments Interface", "Universal Pay Index", "United Payment ID", "User Pay Interface"], 0),
        ("A strong password should…", ["Be a birthday", "Mix letters, digits, symbols", "Be 'password'", "Be shared"], 1),
        ("Which tool is best for tabular calculation?", ["Spreadsheet", "Browser", "Calendar", "Email"], 0),
        ("Phishing is…", ["A fishing sport", "Fraudulent attempt to steal data", "A backup method", "A firewall"], 1),
        ("Cloud storage lets you…", ["Access files from any device", "Print faster", "Avoid internet", "Charge phone"], 0),
    ],
    "CA": [
        ("The accounting equation is…", ["Assets = Liabilities + Capital", "Assets = Income", "Capital = Expenses", "Liabilities = Assets + Capital"], 0),
        ("A trial balance checks…", ["Arithmetical accuracy of ledgers", "Cash only", "Taxes", "Stock"], 0),
        ("Which is a current asset?", ["Building", "Cash in hand", "Machinery", "Goodwill"], 1),
        ("Depreciation is…", ["Increase in asset value", "Allocation of asset cost over life", "A tax", "A loan"], 1),
        ("Bank reconciliation compares…", ["Cash book and passbook", "Two ledgers", "Stock and sales", "Tax returns"], 0),
    ],
}
SHORT = {
    "CM": "Explain one way the cooperative principle of member participation improves governance.",
    "RE": "Describe a viable micro-enterprise idea for your village and its key customers.",
    "DS": "Explain how you would protect a cooperative's member data online.",
    "CA": "State two differences between a receipts & payments account and an income & expenditure account.",
}
EVAL_NOTES = {
    "communication": "Communicates clearly during group activities.",
    "teamwork": "Collaborates well and supports peers during practicals.",
    "problem_solving": "Breaks problems down methodically in case discussions.",
    "digital_skills": "Comfortable with spreadsheets; needs practice with online forms.",
    "technical_knowledge": "Good grasp of cooperative law concepts.",
    "practical_application": "Applied ledger entries accurately in the lab.",
}


def profile_for(rng: random.Random) -> str:
    r = rng.random()
    if r < 0.66:
        return "on_track"
    if r < 0.84:
        return "attention"
    if r < 0.90:
        return "at_risk"
    return "completed"


PROFILE = {  # attendance prob, learning range, quiz mean, assignment submit prob, inactive days range
    "on_track": (0.92, (62, 96), 0.80, 0.90, (0, 3)),
    "attention": (0.76, (45, 72), 0.62, 0.70, (2, 5)),
    "at_risk": (0.55, (18, 48), 0.42, 0.40, (6, 11)),
    "completed": (0.96, (100, 100), 0.88, 0.98, (0, 2)),
}


def _dt(d, hhmm: str) -> datetime:
    h, m = map(int, hhmm.split(":"))
    return datetime.combine(d, time(h, m), tzinfo=IST)


async def reset(db: AsyncSession):
    trainer = (await db.execute(select(User).where(User.email == TRAINER_EMAIL))).scalar_one_or_none()
    if not trainer:
        print("nothing to reset")
        return
    users = (await db.execute(select(User.id).where(User.email.like(f"%{TRAINEE_DOMAIN}")))).scalars().all()
    batch_ids = (await db.execute(select(BatchCourse.batch_id).where(BatchCourse.trainer_id == trainer.id))).scalars().all()
    prog_ids = (await db.execute(select(Batch.programme_id).where(Batch.id.in_(batch_ids)))).scalars().all()
    course_ids = (await db.execute(select(BatchCourse.course_id).where(BatchCourse.trainer_id == trainer.id))).scalars().all()
    assess = (await db.execute(select(Assessment.id).where(Assessment.created_by == trainer.id))).scalars().all()
    sess = (await db.execute(select(AttendanceSession.id).where(AttendanceSession.batch_id.in_(batch_ids)))).scalars().all()
    await db.execute(delete(AssessmentResult).where(AssessmentResult.assessment_id.in_(assess)))
    await db.execute(delete(Assessment).where(Assessment.id.in_(assess)))
    await db.execute(delete(AttendanceRecord).where(AttendanceRecord.session_id.in_(sess)))
    await db.execute(delete(AttendanceSession).where(AttendanceSession.id.in_(sess)))
    await db.execute(delete(TimetableSlot).where(TimetableSlot.trainer_id == trainer.id))
    await db.execute(delete(Announcement).where(Announcement.created_by == trainer.id))
    await db.execute(delete(Assignment).where(Assignment.created_by == trainer.id))
    await db.execute(delete(DirectMessage).where(or_(DirectMessage.sender_id == trainer.id, DirectMessage.recipient_id == trainer.id)))
    await db.execute(delete(SkillEvaluation).where(SkillEvaluation.trainer_id == trainer.id))
    await db.execute(delete(TraineeSkill).where(TraineeSkill.trainee_id.in_(users)))
    await db.execute(delete(CourseEnrollment).where(CourseEnrollment.trainee_id.in_(users)))
    await db.execute(delete(Enrollment).where(Enrollment.batch_id.in_(batch_ids)))
    await db.execute(delete(BatchCourse).where(BatchCourse.trainer_id == trainer.id))
    await db.execute(delete(Batch).where(Batch.id.in_(batch_ids)))
    await db.execute(delete(ProgrammeCourse).where(ProgrammeCourse.programme_id.in_(prog_ids)))
    mod_ids = (await db.execute(select(Module.id).where(Module.course_id.in_(course_ids)))).scalars().all()
    await db.execute(delete(Lesson).where(Lesson.module_id.in_(mod_ids)))  # lessons cascade to media/translations
    await db.execute(delete(ModuleProgress).where(ModuleProgress.module_id.in_(mod_ids)))
    await db.execute(delete(Module).where(Module.id.in_(mod_ids)))
    await db.execute(delete(Course).where(Course.id.in_(course_ids)))
    await db.execute(delete(Programme).where(Programme.id.in_(prog_ids)))
    await db.execute(delete(User).where(User.email.like(f"%{TRAINEE_DOMAIN}")))
    await db.commit()
    print("reset done")


async def seed(db: AsyncSession):
    if (await db.execute(select(User).where(User.email == TRAINER_EMAIL))).scalar_one_or_none():
        print("trainer demo data already present (use --reset to rebuild)")
        return
    rng = random.Random(24)
    now = datetime.now(IST)
    today = now.date()

    org = (await db.execute(select(Organisation).where(Organisation.name.like("Vaikunth Mehta%")))).scalars().first()
    if org is None:
        org = Organisation(name="VAMNICOM Training Centre", type="institution", state="Maharashtra")
        db.add(org)
        await db.flush()

    trainer = User(clerk_user_id=f"pending:{secrets.token_hex(8)}", email=TRAINER_EMAIL, full_name="Dr. S. Kumar",
                   role="trainer", organisation_id=org.id)
    db.add(trainer)

    skills = {}
    for name in SKILLS:
        s = (await db.execute(select(Skill).where(Skill.name == name))).scalar_one_or_none()
        if s is None:
            s = Skill(name=name, category="Core")
            db.add(s)
        skills[name] = s
    await db.flush()

    courses = {}
    for key, (title, cat) in COURSES.items():
        c = Course(title=title, category=cat, level="Foundation", duration_hours=40, instructor="Dr. S. Kumar",
                   skills=[title], description=f"{title} — prototype course for the VAMNICOM training centre.")
        db.add(c)
        courses[key] = c
    await db.flush()

    batches, programmes = {}, {}
    for bname, (ptitle, size, ckeys) in BATCHES.items():
        p = Programme(title=ptitle, sector="Cooperative", level="Certificate", mode="Offline", duration_weeks=12,
                      seats_total=size, seats_filled=size, organisation_id=org.id, venue="VAMNICOM, Pune",
                      start_date=now - timedelta(days=56), end_date=now + timedelta(days=28), created_by_id=trainer.id)
        db.add(p)
        await db.flush()
        b = Batch(programme_id=p.id, name=bname, start_date=now - timedelta(days=56), end_date=now + timedelta(days=28),
                  capacity=size, venue="VAMNICOM, Pune", min_attendance_pct=75)
        db.add(b)
        await db.flush()
        programmes[bname], batches[bname] = p, b
        for i, ck in enumerate(ckeys, 1):
            courses[ck].programme_id = p.id
            db.add(ProgrammeCourse(programme_id=p.id, course_id=courses[ck].id, sequence_order=i))
            room = next((s[5] for s in SLOTS if s[3] == bname and s[4] == ck), None)
            db.add(BatchCourse(batch_id=b.id, course_id=courses[ck].id, trainer_id=trainer.id, room=room))

    # ---- trainees -------------------------------------------------------
    trainees = {}  # batch -> [(user, profile)]
    used = set()
    for bname, (_, size, ckeys) in BATCHES.items():
        trainees[bname] = []
        for i in range(size):
            while True:
                fn, ln = rng.choice(FIRST), rng.choice(LAST)
                if (fn, ln) not in used:
                    used.add((fn, ln))
                    break
            prof = profile_for(rng)
            u = User(clerk_user_id=f"pending:{secrets.token_hex(8)}",
                     email=f"{fn}.{ln}.{bname}.{i}{TRAINEE_DOMAIN}".lower(), full_name=f"{fn} {ln}",
                     role="trainee", organisation_id=org.id)
            db.add(u)
            trainees[bname].append((u, prof))
    await db.flush()
    # a recognisable at-risk trainee for demos
    kiran = trainees["CM-24"][3][0]
    kiran.full_name = "Kiran Deshmukh"
    trainees["CM-24"][3] = (kiran, "at_risk")

    for bname, rows in trainees.items():
        ckeys = BATCHES[bname][2]
        for u, prof in rows:
            _, lrange, _, _, inactive = PROFILE[prof]
            db.add(Enrollment(trainee_id=u.id, batch_id=batches[bname].id, status="completed" if prof == "completed" else "active"))
            last = now - timedelta(days=rng.randint(*inactive), hours=rng.randint(0, 8))
            for ck in ckeys:
                db.add(CourseEnrollment(trainee_id=u.id, course_id=courses[ck].id, progress=rng.randint(*lrange),
                                        status="completed" if prof == "completed" else "active", last_accessed=last))
            for sk in SKILLS:
                base = {"on_track": 78, "attention": 64, "at_risk": 48, "completed": 88}[prof]
                conf = max(20, min(98, base + rng.randint(-12, 12)))
                db.add(TraineeSkill(trainee_id=u.id, skill_id=skills[sk].id, confidence=conf,
                                    level="Advanced" if conf >= 85 else "Intermediate" if conf >= 65 else "Foundational",
                                    verified=prof in ("on_track", "completed"), evidence=[]))
    await db.flush()

    # ---- timetable ------------------------------------------------------
    slots = []
    for day, st, en, bname, ck, room in SLOTS:
        slot = TimetableSlot(
            organisation_id=org.id, programme_id=programmes[bname].id, batch_id=batches[bname].id, trainer_id=trainer.id,
            course_id=courses[ck].id, day_of_week=day, time_slot=_dt(today, st).strftime("%I:%M %p"),
            title=COURSES[ck][0], room=room, trainer_name="Dr. S. Kumar",
            start_time=time(*map(int, st.split(":"))), end_time=time(*map(int, en.split(":"))))
        db.add(slot)
        slots.append(slot)
    await db.flush()

    # ---- past attendance sessions --------------------------------------
    for slot in slots:
        wd = WEEKDAYS.index(slot.day_of_week)
        bname = next(k for k, v in batches.items() if v.id == slot.batch_id)
        d = today - timedelta(days=(today.weekday() - wd) % 7 or 7)  # most recent past occurrence
        for n in range(3):
            day = d - timedelta(days=7 * n)
            opens = datetime.combine(day, slot.start_time, tzinfo=IST)
            sess = AttendanceSession(
                session_name=f"{slot.title} — {day:%d %b}", programme_id=slot.programme_id, batch_id=slot.batch_id,
                timetable_slot_id=slot.id, qr_token=secrets.token_hex(8), qr_secret=secrets.token_hex(16),
                valid_minutes=15, opens_at=opens, closes_at=opens + timedelta(minutes=15), created_by=trainer.id,
                room=slot.room, allowed_methods=["qr", "manual"], created_at=opens)
            db.add(sess)
            await db.flush()
            for u, prof in trainees[bname]:
                p_att = PROFILE[prof][0]
                r = rng.random()
                status = "present" if r < p_att * 0.93 else "late" if r < p_att else ("excused" if rng.random() < 0.12 else "absent")
                db.add(AttendanceRecord(session_id=sess.id, trainee_id=u.id, status=status,
                                        method="qr" if status in ("present", "late") else "manual",
                                        marked_at=opens + timedelta(minutes=rng.randint(1, 12))))

    # ---- assessments ----------------------------------------------------
    sched_future = datetime(2026, 10, 10, 10, 0, tzinfo=IST)
    ass_by_course = {}
    for bname, (_, _, ckeys) in BATCHES.items():
        for ck in ckeys:
            cname = COURSES[ck][0]
            defs = [(f"{cname} — Module 1", "completed", now - timedelta(days=21)),
                    (f"{cname} — Module 2", "completed", now - timedelta(days=7)),
                    (f"{cname} — Module 3", "published", sched_future),
                    (f"{cname} — Module 4", "draft", None)]
            for title, status, when in defs:
                a = Assessment(title=title, course_id=courses[ck].id, programme_id=programmes[bname].id, batch_id=batches[bname].id,
                               created_by=trainer.id, status=status, module_title=title.split("— ")[1], duration_minutes=30,
                               passing_score=50, total_questions=6, scheduled_at=when, due_date=when,
                               skill_name=SKILL_OF[ck], description=f"Module assessment for {cname}.",
                               instructions="Answer all questions. Short answers are graded by your trainer.")
                db.add(a)
                await db.flush()
                qs = []
                for pos, (prompt, opts, correct) in enumerate(MCQ[ck], 1):
                    q = AssessmentQuestion(assessment_id=a.id, position=pos, type="mcq_single", prompt=prompt,
                                           options=[{"id": "abcd"[i], "text": t} for i, t in enumerate(opts)],
                                           correct=["abcd"[correct]], marks=1, topic=cname)
                    db.add(q)
                    qs.append(q)
                sq = AssessmentQuestion(assessment_id=a.id, position=6, type="short_answer", prompt=SHORT[ck],
                                        options=None, correct=["rubric: clear, relevant, cooperative-context example"],
                                        marks=5, topic=cname)
                db.add(sq)
                qs.append(sq)
                await db.flush()
                ass_by_course.setdefault((bname, ck), []).append((a, qs, status, when))
                if status != "completed":
                    continue
                for u, prof in trainees[bname]:
                    if rng.random() > {"on_track": 0.97, "attention": 0.88, "at_risk": 0.6, "completed": 1}[prof]:
                        continue  # did not submit
                    mean = PROFILE[prof][2]
                    answers, correct_n = {}, 0
                    for q in qs[:5]:
                        if rng.random() < mean:
                            answers[str(q.id)] = q.correct
                            correct_n += 1
                        else:
                            wrong = [o["id"] for o in q.options if [o["id"]] != q.correct]
                            answers[str(q.id)] = [rng.choice(wrong)]
                    answers[str(sq.id)] = "Sample trainee answer (prototype)."
                    needs_review = rng.random() < 0.03
                    short_marks = 0 if needs_review else min(5, max(0, round(5 * mean + rng.uniform(-1.5, 1.5))))
                    pct = round(100 * (correct_n + short_marks) / 10) if not needs_review else round(100 * correct_n / 5)
                    passed = pct >= 50
                    submitted = when + timedelta(minutes=rng.randint(5, 25))
                    att = AssessmentAttempt(
                        assessment_id=a.id, trainee_id=u.id, attempt_no=1, started_at=submitted - timedelta(minutes=25),
                        expires_at=submitted + timedelta(minutes=5), submitted_at=submitted, question_order=[str(q.id) for q in qs],
                        answers=answers, score=pct, passed=passed, status="needs_review" if needs_review else "submitted")
                    db.add(att)
                    if not needs_review:
                        db.add(AssessmentResult(assessment_id=a.id, trainee_id=u.id, score=pct, passed=passed, submitted_at=submitted))
    await db.flush()

    # ---- assignments ----------------------------------------------------
    asg_titles = {"CM-24": [("Rural Cooperative Case Study", 2), ("Cooperative Governance Report", 9)],
                  "RE-12": [("Village Micro-Enterprise Plan", 3), ("Market Survey Summary", 10)],
                  "DS-18": [("Digital Payments Walkthrough", 4), ("Spreadsheet Ledger Exercise", 11)]}
    for bname, items in asg_titles.items():
        ck = BATCHES[bname][2][0]
        for idx, (title, days) in enumerate(items):
            past = idx == 0
            dl = now + timedelta(days=(-days if past else days))
            a = Assignment(batch_id=batches[bname].id, course_id=courses[ck].id, title=title, status="published",
                           description=f"{title}: submit a 1–2 page write-up.", deadline=dl, max_marks=100,
                           resources=[{"title": "Reading pack", "url": "https://example.com/resources"}], created_by=trainer.id)
            db.add(a)
            await db.flush()
            for u, prof in trainees[bname]:
                if rng.random() > PROFILE[prof][3] * (1 if past else 0.45):
                    continue
                graded = past and rng.random() < 0.97
                db.add(AssignmentSubmission(
                    assignment_id=a.id, trainee_id=u.id, content="Prototype submission text.",
                    submitted_at=min(dl - timedelta(days=rng.randint(0, 3)), now - timedelta(hours=rng.randint(1, 48))), status="graded" if graded else "submitted",
                    marks=min(100, int(rng.gauss(PROFILE[prof][2] * 100, 8))) if graded else None,
                    feedback="Good effort." if graded else None, graded_by=trainer.id if graded else None,
                    graded_at=now - timedelta(days=1) if graded else None))

    # ---- announcements, messages, evaluations ---------------------------
    db.add(Announcement(title="Tomorrow's class timing", message="Tomorrow's class will begin at 10:00 AM.",
                        audience_type="batch", batch_id=batches["CM-24"].id, created_by=trainer.id,
                        created_at=now - timedelta(days=1)))
    db.add(Announcement(title="Module 3 assessment on Oct 10", message="Revise governance and member rights chapters.",
                        audience_type="course", batch_id=batches["CM-24"].id, course_id=courses["CM"].id,
                        created_by=trainer.id, created_at=now - timedelta(days=2)))
    db.add(Announcement(title="Lab 3 access", message="Bring your ID card for lab entry.", audience_type="batch",
                        batch_id=batches["DS-18"].id, created_by=trainer.id, created_at=now - timedelta(days=4)))
    msgs = [("Doubt about Module 3", "Sir, could you explain member rights again?", 0),
            ("Leave request", "I will miss Friday's class due to a family function.", 1),
            ("Assignment extension", "May I submit the case study a day late?", 2)]
    for i, (subj, body, idx) in enumerate(msgs):
        u = trainees["CM-24"][idx + 5][0]
        db.add(DirectMessage(sender_id=u.id, recipient_id=trainer.id, subject=subj, body=body,
                             created_at=now - timedelta(hours=3 + i * 20), read_at=None if i < 2 else now))
    dims = list(EVAL_NOTES)
    for bname in batches:
        for u, prof in trainees[bname][:4]:
            for dim in rng.sample(dims, 2):
                rating = {"on_track": 4, "attention": 3, "at_risk": 2, "completed": 5}[prof]
                db.add(SkillEvaluation(trainee_id=u.id, batch_id=batches[bname].id, trainer_id=trainer.id, dimension=dim,
                                       rating=rating, observation=EVAL_NOTES[dim], created_at=now - timedelta(days=rng.randint(1, 20))))
    await db.commit()
    total = sum(len(v) for v in trainees.values())
    print(f"seeded trainer Dr. S. Kumar ({TRAINER_EMAIL}): {len(batches)} batches, {total} trainees, {len(slots)} weekly slots")


async def main():
    async with AsyncSessionLocal() as db:
        if "--reset" in sys.argv:
            await reset(db)
        await seed(db)


if __name__ == "__main__":
    asyncio.run(main())
