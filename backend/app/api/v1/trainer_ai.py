"""Trainer AI teaching assistant (included under /api/v1/trainer).

POST /ai/assist generates editable DRAFTS only (never auto-published).
 - quiz / lesson_plan / explain / activities: Gemini when GEMINI_API_KEY is genuinely
   configured, otherwise a deterministic topic-bank / template fallback.
 - struggling_summary / course_summary: built ONLY from stored metrics
   (trainer_metrics.compute_stats); no model-invented analytics or trainee observations.
Never 500s because the LLM is unavailable.
"""
import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.services import trainer_metrics as tm

logger = logging.getLogger("trainer_ai")
router = APIRouter()
DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
PLACEHOLDER = re.compile(r"(your|placeholder|changeme|xxx|example|<)", re.I)


async def _trainer(x_demo_user: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


Task = Literal["quiz", "lesson_plan", "explain", "activities", "struggling_summary", "course_summary"]
QType = Literal["mcq_single", "true_false", "short_answer"]


class AssistRequest(BaseModel):
    task: Task
    prompt: str = Field("", max_length=1000)
    course_id: Optional[uuid.UUID] = None
    batch_id: Optional[uuid.UUID] = None
    count: int = Field(5, ge=1, le=20)
    question_types: Optional[list[QType]] = None
    exclude: list[str] = Field(default_factory=list, max_length=50)  # prompts to avoid (regenerate)


# --------------------------------------------------------------------------
# Topic bank: (prompt, options[4], correct index, explanation)
# --------------------------------------------------------------------------
def _m(p, o, c, e):
    return {"p": p, "o": o, "c": c, "e": e}


BANK: dict[str, dict] = {
    "governance": {
        "title": "Cooperative Governance",
        "keywords": ["governance", "board", "agm", "general body", "committee", "election", "bye-law", "bylaw", "management"],
        "mcq": [
            _m("Which body is the supreme authority of a cooperative society?", ["Board of Directors", "General Body", "Chief Executive", "Registrar"], 1, "The General Body of members is the supreme authority; the board acts on its behalf."),
            _m("How is the Board of Directors of a cooperative normally chosen?", ["Appointed by the Registrar", "Elected by members", "Nominated by the CEO", "Chosen by lenders"], 1, "Directors are elected democratically by the members."),
            _m("Which principle describes the voting rule 'one member, one vote'?", ["Autonomy and independence", "Democratic member control", "Concern for community", "Education and training"], 1, "Democratic member control gives each member an equal vote regardless of shares held."),
            _m("What is the main purpose of an Annual General Meeting (AGM)?", ["To declare new products", "To review accounts and policies and elect representatives", "To hire staff", "To change the Registrar"], 1, "The AGM lets members approve accounts, discuss performance and elect the board."),
            _m("Which document sets out the internal rules of a cooperative society?", ["Balance sheet", "Bye-laws", "Loan register", "Audit memo"], 1, "Bye-laws, approved by the Registrar, govern membership, management and operations."),
            _m("Who is responsible for ensuring the cooperative follows its bye-laws day to day?", ["Board of Directors", "External customers", "Local police", "Suppliers"], 0, "The elected board is accountable to members for compliance with bye-laws and the Act."),
            _m("A conflict of interest arises when a director...", ["Attends every meeting", "Has a personal interest in a decision of the society", "Asks questions on accounts", "Retires by rotation"], 1, "Directors should disclose personal interests and abstain from related decisions."),
        ],
        "tf": [
            ("The General Body is the supreme authority of a cooperative society.", True, "Members in General Body hold ultimate authority."),
            ("In a cooperative, voting power depends on the number of shares a member holds.", False, "Cooperatives follow one member, one vote."),
            ("Minutes of board meetings should be recorded and kept as official records.", True, "Written minutes ensure transparency and accountability."),
            ("A board may ignore the bye-laws if it decides unanimously.", False, "Bye-laws bind the board; they can only be amended through the proper procedure."),
        ],
        "sa": [
            ("List any three responsibilities of the Board of Directors of a cooperative society.", "Policy making, financial oversight, ensuring bye-law compliance, appointing/supervising the CEO, convening the AGM, protecting member interests."),
            ("Explain why transparency in governance matters to members.", "Transparency lets members monitor decisions and finances, builds trust, prevents misuse of funds and supports accountability of leaders."),
        ],
    },
    "rights": {
        "title": "Member Rights and Duties",
        "keywords": ["right", "member", "membership", "duty", "duties", "share", "dividend", "participation"],
        "mcq": [
            _m("Which is a fundamental right of a cooperative member?", ["Unlimited credit", "Right to vote in the General Body", "Right to appoint auditors alone", "Right to veto the board"], 1, "Voting is a core member right under cooperative principles."),
            _m("Which of the following is a duty of a member?", ["Participate in the democratic process", "Ignore society decisions", "Avoid using society services", "Withhold share capital"], 0, "Members are expected to participate, use services and contribute capital."),
            _m("Member economic participation means members...", ["Contribute equitably to and democratically control the capital", "Only borrow money", "Own no capital", "Pay no fees"], 0, "The principle states members contribute to and control the society's capital."),
            _m("A member who wants to inspect the society's records should ordinarily...", ["Be refused", "Follow the procedure in the bye-laws", "Ask an outsider", "Go to a bank"], 1, "Members may inspect records as provided in the Act and bye-laws."),
            _m("What is a patronage dividend or bonus usually based on?", ["Seniority of the member", "Member's use of society services", "Age of the member", "Distance from office"], 1, "Surplus is shared in proportion to transactions with the society."),
            _m("Open and voluntary membership means...", ["Anyone may be forced to join", "Membership is open to those able to use services and accept responsibilities, without discrimination", "Only relatives may join", "Membership is fixed forever"], 1, "Membership is voluntary and non-discriminatory."),
        ],
        "tf": [
            ("Members have the right to attend and vote at the General Body meeting.", True, "This is a basic democratic right."),
            ("Members have no duty to use the services of their own cooperative.", False, "Member patronage sustains the cooperative."),
            ("Membership in a cooperative must be open without gender or social discrimination.", True, "Open and voluntary membership is a core principle."),
        ],
        "sa": [
            ("State two rights and two duties of a cooperative member.", "Rights: vote, stand for election, inspect records, receive dividend/bonus. Duties: attend meetings, use services, repay dues, follow bye-laws."),
        ],
    },
    "accounting": {
        "title": "Cooperative Accounting and Finance",
        "keywords": ["account", "audit", "ledger", "balance", "finance", "cash", "bookkeeping", "profit", "loan", "credit", "budget"],
        "mcq": [
            _m("Which book records day-to-day cash receipts and payments?", ["Cash book", "Minute book", "Share register", "Stock register"], 0, "The cash book records all cash and bank transactions chronologically."),
            _m("The accounting equation is...", ["Assets = Liabilities + Capital", "Assets = Capital - Liabilities - Profit", "Liabilities = Assets + Capital", "Capital = Assets + Liabilities"], 0, "Every asset is financed by liabilities or owners'/members' capital."),
            _m("A balance sheet shows...", ["Income over one year", "The financial position at a point in time", "Only cash flows", "Member attendance"], 1, "It lists assets, liabilities and capital on a given date."),
            _m("Why is a statutory audit required for cooperatives?", ["To increase share price", "To verify accounts and ensure accountability to members", "To appoint directors", "To set interest rates"], 1, "Audit provides independent assurance on the accounts."),
            _m("Which of these is a liability of a cooperative credit society?", ["Member deposits", "Loans given to members", "Furniture", "Cash in hand"], 0, "Deposits received are owed back to members."),
            _m("Net surplus of a cooperative is calculated as...", ["Total income minus total expenses", "Total assets minus cash", "Total shares plus loans", "Income plus expenses"], 0, "Surplus is income less expenses for the period."),
            _m("What does NPA stand for in lending?", ["Net Profit Amount", "Non-Performing Asset", "National Payment Authority", "New Principal Account"], 1, "A loan on which interest or principal remains overdue beyond the norm is an NPA."),
        ],
        "tf": [
            ("Every transaction should be supported by a voucher or document.", True, "Vouchers provide audit evidence."),
            ("A cooperative may distribute the entire surplus among members without any reserve fund contribution.", False, "Statutory reserves must be created before distribution."),
            ("Double-entry bookkeeping records each transaction as a debit and a credit.", True, "Every transaction has equal debit and credit effects."),
        ],
        "sa": [
            ("Differentiate between a receipt and a payment in the cash book.", "A receipt is money coming in (debit side); a payment is money going out (credit side)."),
            ("Why should a cooperative maintain a reserve fund?", "To meet unforeseen losses, strengthen financial stability and protect member funds."),
        ],
    },
    "entrepreneurship": {
        "title": "Entrepreneurship and Business Planning",
        "keywords": ["entrepreneur", "business", "startup", "enterprise", "market", "plan", "marketing", "customer", "sell", "product"],
        "mcq": [
            _m("What does a business plan primarily describe?", ["Only the owner's hobbies", "Goals, market, operations and financial projections", "Employee holidays", "Only loan terms"], 1, "A plan sets goals and how the venture will achieve them."),
            _m("Which is an example of a fixed cost?", ["Raw material", "Monthly rent", "Packaging per unit", "Sales commission"], 1, "Fixed costs do not vary with output in the short run."),
            _m("The break-even point is where...", ["Profit is maximum", "Total revenue equals total cost", "Sales are zero", "Costs are zero"], 1, "At break-even there is neither profit nor loss."),
            _m("SWOT analysis examines...", ["Sales, wages, output, tax", "Strengths, weaknesses, opportunities, threats", "Suppliers, workers, orders, targets", "Stock, wealth, orders, trade"], 1, "SWOT reviews internal and external factors."),
            _m("A cooperative enterprise differs from a private firm mainly because it is...", ["Owned and controlled by its members", "Owned by a single investor", "Always larger", "Free from audit"], 0, "Cooperatives are member-owned and democratically controlled."),
            _m("Market segmentation means...", ["Dividing customers into groups with similar needs", "Closing a market", "Raising prices", "Copying competitors"], 0, "Segmentation helps tailor products and messages."),
        ],
        "tf": [
            ("Understanding customer needs is a key step before launching a product.", True, "Market research reduces risk."),
            ("Profit and cash flow are always the same thing.", False, "A business can be profitable yet short of cash."),
            ("Self-help groups and producer cooperatives can both be vehicles for entrepreneurship.", True, "Both pool resources for collective enterprise."),
        ],
        "sa": [
            ("List three components of a simple business plan.", "Business idea/objectives, market analysis, operations plan, marketing strategy, financial plan, risk assessment."),
        ],
    },
    "digital": {
        "title": "Digital Skills",
        "keywords": ["digital", "computer", "internet", "online", "upi", "cyber", "password", "phishing", "app", "technology", "excel", "software"],
        "mcq": [
            _m("Which password practice is safest?", ["Reuse one password everywhere", "Use a long, unique password per account", "Share it with colleagues", "Use your birth date"], 1, "Unique long passwords limit damage from any single breach."),
            _m("Phishing is...", ["A fishing technique", "A fraud attempt to steal information through deceptive messages", "A software update", "A spreadsheet function"], 1, "Phishing tricks users into revealing credentials or paying money."),
            _m("What should you never share with anyone for a UPI payment?", ["Your UPI ID", "Your UPI PIN or OTP", "Your name", "Your payee's UPI ID"], 1, "The PIN/OTP authorises payments; never share it."),
            _m("Which tool is best suited for tabulating and calculating member dues?", ["Spreadsheet software", "Image editor", "Video player", "Web browser only"], 0, "Spreadsheets support tables and formulas."),
            _m("Which connection icon in the browser address bar suggests the page is encrypted?", ["A padlock with https", "A star", "A warning triangle", "A plain http link"], 0, "HTTPS indicates encrypted traffic, though it does not alone prove a site is trustworthy."),
            _m("What is the purpose of regularly backing up data?", ["To recover from loss or corruption", "To slow the computer", "To remove viruses automatically", "To increase internet speed"], 0, "Backups let you restore records after failures."),
        ],
        "tf": [
            ("Banks will never ask you to share your OTP over a phone call.", True, "Genuine institutions do not request OTPs or PINs."),
            ("Two-factor authentication makes accounts less secure.", False, "A second factor adds protection."),
            ("Free public Wi-Fi is always safe for online banking.", False, "Public networks can be monitored; avoid sensitive transactions."),
        ],
        "sa": [
            ("Describe two steps to verify whether a message asking for payment is genuine.", "Check sender identity through an official channel, do not click unknown links, verify the amount/payee, and never share OTP/PIN."),
        ],
    },
}

GENERIC_TOPIC = {"title": "General Cooperative Principles"}
GENERIC_MCQ = [
    _m("Which is one of the seven international cooperative principles?", ["Profit maximisation", "Voluntary and open membership", "Government ownership", "Unlimited liability for outsiders"], 1, "Voluntary and open membership is the first cooperative principle."),
    _m("A cooperative society is best described as...", ["An association of persons united voluntarily to meet common needs through a jointly owned, democratically controlled enterprise", "A company owned by one family", "A government department", "A charity that cannot earn income"], 0, "This is the standard ICA-based definition."),
    _m("Which principle says cooperatives should provide education and training to members?", ["Education, training and information", "Autonomy and independence", "Cooperation among cooperatives", "Open membership"], 0, "The fifth principle covers education, training and information."),
    _m("Cooperation among cooperatives means...", ["Competing aggressively", "Working together through local, national and international structures", "Merging with private firms", "Avoiding other societies"], 1, "Cooperatives strengthen the movement by collaborating."),
    _m("Surplus in a cooperative is usually used for...", ["Reserves, member benefit and community activities", "Only paying the chairperson", "Being returned to the Registrar", "Nothing at all"], 0, "Surplus supports reserves, patronage returns and member-approved activities."),
]
GENERIC_TF = [
    ("Cooperatives are autonomous, self-help organisations controlled by their members.", True, "Autonomy and independence is a core principle."),
    ("Only wealthy individuals can join a cooperative society.", False, "Membership is open to all who can use the services and accept responsibilities."),
]
GENERIC_SA = [("Explain, in two or three sentences, what makes a cooperative different from a private company.", "Member ownership, democratic control (one member one vote), service motive rather than profit maximisation, and surplus shared by patronage.")]


def _pick_topic(text: str) -> Optional[str]:
    t = text.lower()
    best, score = None, 0
    for k, v in BANK.items():
        s = sum(1 for w in v["keywords"] if w in t)
        if s > score:
            best, score = k, s
    return best


def _topic_label(prompt: str, topic: Optional[str], course_title: Optional[str]) -> str:
    m = re.search(r"\b(?:on|about|for|of|covering)\s+(.{3,80}?)\s*$", prompt.strip().rstrip(".?!"), re.I)
    if topic:
        return BANK[topic]["title"]
    if m:
        return m.group(1).strip()
    return course_title or GENERIC_TOPIC["title"]


def _rot(seq: list, seed: int) -> list:
    if not seq:
        return seq
    k = seed % len(seq)
    return seq[k:] + seq[:k]


def _seed(*parts: str) -> int:
    return int(hashlib.sha256("|".join(parts).encode()).hexdigest()[:8], 16)


def fallback_quiz(req: AssistRequest, course_title: Optional[str]) -> dict:
    topic = _pick_topic(f"{req.prompt} {course_title or ''}") if _pick_topic(req.prompt) is None else _pick_topic(req.prompt)
    types = req.question_types or ["mcq_single"]
    bank = BANK.get(topic) if topic else None
    mcqs = list(bank["mcq"]) if bank else list(GENERIC_MCQ)
    tfs = list(bank["tf"]) if bank else list(GENERIC_TF)
    sas = list(bank["sa"]) if bank else list(GENERIC_SA)
    # Fill short pools with neighbours from other topics so any count is satisfiable
    if len(mcqs) < req.count:
        for k, v in BANK.items():
            if k != topic:
                mcqs += v["mcq"]
    seed = _seed(req.prompt, str(req.count), "|".join(req.exclude))
    excluded = {e.strip() for e in req.exclude}
    items: list[dict] = []
    pools = {
        "mcq_single": [("m", x) for x in _rot(mcqs, seed)],
        "true_false": [("t", x) for x in _rot(tfs, seed)],
        "short_answer": [("s", x) for x in _rot(sas, seed)],
    }
    idx = {t: 0 for t in types}
    guard = 0
    while len(items) < req.count and guard < 200:
        guard += 1
        qt = types[len(items) % len(types)]
        pool = pools[qt]
        if idx[qt] >= len(pool):
            # pool exhausted: fall back to mcq from remaining bank
            qt = "mcq_single"
            pool = pools[qt]
            if idx[qt] >= len(pool):
                break
        kind, x = pool[idx[qt]]
        idx[qt] += 1
        if kind == "m":
            if x["p"] in excluded:
                continue
            ids = ["a", "b", "c", "d"]
            items.append({"type": "mcq_single", "prompt": x["p"], "options": [{"id": i, "text": t} for i, t in zip(ids, x["o"])],
                          "correct": [ids[x["c"]]], "explanation": x["e"]})
        elif kind == "t":
            if x[0] in excluded:
                continue
            items.append({"type": "true_false", "prompt": x[0], "options": [{"id": "true", "text": "True"}, {"id": "false", "text": "False"}],
                          "correct": ["true" if x[1] else "false"], "explanation": x[2]})
        else:
            if x[0] in excluded:
                continue
            items.append({"type": "short_answer", "prompt": x[0], "correct": [x[1]], "explanation": "Model answer for the trainer's reference; adapt marking to your rubric."})
    return {"title": f"{_topic_label(req.prompt, topic, course_title)} - practice questions", "questions": items}


def _plan_sections(topic_name: str, req: AssistRequest, course_title: Optional[str]) -> dict:
    ctx = f" ({course_title})" if course_title else ""
    return {"title": f"Lesson plan: {topic_name}", "sections": [
        {"heading": "Learning objectives", "body": f"By the end of the session trainees should be able to:\n- Explain the key ideas of {topic_name}{ctx} in their own words.\n- Relate the concepts to a real cooperative society they know.\n- Apply the concepts in a short practical exercise."},
        {"heading": "Prior knowledge check (5 min)", "body": f"Ask 3 quick oral questions to find out what trainees already know about {topic_name}. Note common gaps on the board."},
        {"heading": "Introduction (10 min)", "body": f"Start with a local, relatable example of {topic_name} in a cooperative. State the objectives and why the topic matters at work."},
        {"heading": "Core teaching (25 min)", "body": f"Present the main concepts of {topic_name} in 3-4 short chunks. After each chunk pause for questions and check understanding with a show-of-hands poll."},
        {"heading": "Guided activity (20 min)", "body": "Small groups of 4-5 work on a short scenario or case, then share findings with the class. Trainer circulates and prompts with questions rather than answers."},
        {"heading": "Assessment for learning (10 min)", "body": "Use 3-5 quick questions (MCQ or short answer) to check the objectives. Review answers together and clarify misconceptions."},
        {"heading": "Wrap-up and homework (5 min)", "body": "Summarise 3 key take-aways. Assign a short follow-up task (e.g. write a half-page reflection or collect one real example)."},
        {"heading": "Materials", "body": "Whiteboard/markers, printed case scenario, attendance sheet, optional slides. Edit this plan to match your module's exact content."},
    ]}


def fallback_explain(req: AssistRequest, course_title: Optional[str]) -> dict:
    topic = _pick_topic(req.prompt)
    name = _topic_label(req.prompt, topic, course_title)
    sections = [
        {"heading": "Simple explanation", "body": f"Start from one sentence: {name} is about how a cooperative stays member-owned, fair and well run. Explain each part using everyday words and one local example before introducing technical terms."},
        {"heading": "Key points to cover", "body": "\n".join(f"- {q['e']}" for q in (BANK[topic]["mcq"][:4] if topic else GENERIC_MCQ[:4]))},
        {"heading": "Example to use in class", "body": f"Walk through a small village cooperative and ask trainees to identify where {name.lower()} applies. Invite them to share examples from their own societies."},
        {"heading": "Check for understanding", "body": "Ask trainees to explain the idea back to a partner in two sentences. Listen for misconceptions and correct them gently."},
    ]
    return {"title": f"Explaining: {name}", "sections": sections}


def fallback_activities(req: AssistRequest, course_title: Optional[str]) -> dict:
    topic = _pick_topic(req.prompt)
    name = _topic_label(req.prompt, topic, course_title)
    return {"title": f"Classroom activities: {name}", "sections": [
        {"heading": "1. Think-Pair-Share (10 min)", "body": f"Pose one open question on {name}. Trainees think alone for 1 minute, discuss with a partner, then share with the class."},
        {"heading": "2. Case scenario in groups (20 min)", "body": f"Give each group a short scenario involving {name} in a cooperative society. Groups decide what the society should do and present in 2 minutes."},
        {"heading": "3. Role play (20 min)", "body": "Assign roles (chairperson, member, secretary, auditor). Act out a meeting where the topic is discussed; the audience notes what went well and what could improve."},
        {"heading": "4. Quiz relay (10 min)", "body": "Split the class into teams. One member answers a question at the board, then passes the marker to the next teammate. Review wrong answers together."},
        {"heading": "5. Exit ticket (5 min)", "body": "Each trainee writes one thing they learnt and one question they still have. Use these to plan the next session."},
    ]}


def fallback_lesson(req: AssistRequest, course_title: Optional[str]) -> dict:
    topic = _pick_topic(req.prompt)
    return _plan_sections(_topic_label(req.prompt, topic, course_title), req, course_title)


# --------------------------------------------------------------------------
# Metric-based summaries (real data only)
# --------------------------------------------------------------------------
async def _scope_stats(db: AsyncSession, trainer: User, req: AssistRequest):
    classes = await tm.trainer_classes(db, trainer.id)
    if req.batch_id is not None and req.batch_id not in {b.id for _, b, _ in classes}:
        raise HTTPException(status_code=404, detail="Batch not found among your classes")
    if req.course_id is not None and req.course_id not in {c.id for _, _, c in classes}:
        raise HTTPException(status_code=404, detail="Course not found among your classes")
    batch_ids = {b.id for _, b, _ in classes}
    if req.batch_id:
        batch_ids = {req.batch_id}
    elif req.course_id:
        batch_ids = {b.id for bc, b, c in classes if c.id == req.course_id}
    stats = await tm.compute_stats(db, trainer.id, list(batch_ids)) if batch_ids else {}
    course_title = next((c.title for _, _, c in classes if c.id == req.course_id), None)
    batch_name = next((b.name for _, b, _ in classes if b.id == req.batch_id), None)
    return list(stats.values()), course_title, batch_name


def _fmt(v) -> str:
    return "no data" if v is None else f"{v}%"


def _avg(vals) -> Optional[int]:
    return tm.avg([v for v in vals if v is not None])


def metrics_summary(task: str, stats: list, course_title: Optional[str], batch_name: Optional[str]) -> dict:
    scope = " / ".join(x for x in (course_title, batch_name) if x) or "all your classes"
    if not stats:
        return {"title": "No data available", "sections": [{"heading": "Nothing to summarise", "body": f"No enrolled trainees were found for {scope}, so no summary can be produced."}]}
    n = len(stats)
    counts = {k: sum(1 for s in stats if s.status == k) for k in ("on_track", "needs_attention", "at_risk", "completed")}
    a, l, s_, g = (_avg(s.attendance for s in stats), _avg(s.learning for s in stats), _avg(s.assessment for s in stats), _avg(s.assignment for s in stats))
    note = "Figures come from stored attendance, learning progress, assessment and assignment records. Missing data is shown as 'no data', not estimated."
    if task == "course_summary":
        lows = [(name, v) for name, v in (("attendance", a), ("learning progress", l), ("assessment scores", s_), ("assignment scores", g)) if v is not None]
        weakest = min(lows, key=lambda x: x[1]) if lows else None
        sections = [
            {"heading": "Overview", "body": f"Scope: {scope}. {n} trainees. On track: {counts['on_track']}, needs attention: {counts['needs_attention']}, at risk: {counts['at_risk']}, completed: {counts['completed']}."},
            {"heading": "Class averages", "body": f"- Attendance: {_fmt(a)}\n- Learning progress: {_fmt(l)}\n- Assessment scores: {_fmt(s_)}\n- Assignment scores: {_fmt(g)}"},
            {"heading": "Area to focus on", "body": (f"The lowest class average is {weakest[0]} at {weakest[1]}%. Consider a short revision or follow-up on this area." if weakest else "There is not enough recorded data to identify a focus area yet.")},
            {"heading": "Data note", "body": note},
        ]
        return {"title": f"Class summary - {scope}", "sections": sections}
    flagged = sorted([s for s in stats if s.status in ("at_risk", "needs_attention")], key=lambda s: (s.status != "at_risk", s.attendance if s.attendance is not None else 101))
    if not flagged:
        return {"title": f"Trainees needing support - {scope}", "sections": [
            {"heading": "No trainees flagged", "body": f"None of the {n} trainees in {scope} currently meet the attention or at-risk criteria based on stored metrics."},
            {"heading": "Data note", "body": note}]}
    lines = []
    for s in flagged[:15]:
        why = "; ".join(s.reasons) or "flagged by metrics"
        lines.append(f"- {s.trainee.full_name} ({s.batch_name}) - {tm.STATUS_LABEL[s.status]}. Attendance {_fmt(s.attendance)}, learning {_fmt(s.learning)}, assessments {_fmt(s.assessment)}, assignments {_fmt(s.assignment)}. Flags: {why}.")
    reason_counts: dict[str, int] = {}
    for s in flagged:
        for r in s.reasons:
            r = re.sub(r"\d+ days", "N days", r)
            reason_counts[r] = reason_counts.get(r, 0) + 1
    common = ", ".join(f"{k} ({v})" for k, v in sorted(reason_counts.items(), key=lambda x: -x[1])) or "none recorded"
    return {"title": f"Trainees needing support - {scope}", "sections": [
        {"heading": "Summary", "body": f"{len(flagged)} of {n} trainees are flagged ({counts['at_risk']} at risk, {counts['needs_attention']} need attention)."},
        {"heading": "Most common flags", "body": common},
        {"heading": "Trainee details", "body": "\n".join(lines) + (f"\n- ...and {len(flagged) - 15} more" if len(flagged) > 15 else "")},
        {"heading": "Suggested follow-up (for your judgement)", "body": "- Reach out to flagged trainees and ask whether they need support.\n- Offer catch-up material for the lowest-scoring areas.\n- Review the list again after the next assessment."},
        {"heading": "Data note", "body": note + " Flags describe recorded metrics only, not reasons or personal circumstances."},
    ]}


# --------------------------------------------------------------------------
# Gemini (only when genuinely configured)
# --------------------------------------------------------------------------
def _key() -> Optional[str]:
    k = (get_settings().gemini_api_key or "").strip()
    return k if len(k) >= 20 and not PLACEHOLDER.search(k) else None


async def gemini_generate(req: AssistRequest, course_title: Optional[str]) -> Optional[dict]:
    key = _key()
    if not key:
        return None
    ctx = f"Course: {course_title}. " if course_title else ""
    if req.task == "quiz":
        types = ", ".join(req.question_types or ["mcq_single"])
        ask = (f"Create {req.count} quiz questions. Allowed types: {types}. Return JSON {{\"title\": str, \"questions\": [{{\"type\": \"mcq_single|true_false|short_answer\", "
               "\"prompt\": str, \"options\": [{\"id\": \"a\", \"text\": str}] (mcq only, 4 options; true_false uses ids true/false), "
               "\"correct\": [option id] (short_answer: [model answer text]), \"explanation\": str}]}")
    else:
        ask = (f"Task: {req.task.replace('_', ' ')}. Return JSON {{\"title\": str, \"sections\": [{{\"heading\": str, \"body\": str}}]}} with 4-8 sections.")
    prompt = ("You are a teaching assistant for cooperative-sector trainers in India (CoopSetu AI). Produce accurate, neutral, classroom-ready draft content. "
              "Do not make claims about individual trainees. " + ctx + ask + f"\nTrainer request: {req.prompt}\nAvoid repeating: {req.exclude[:10]}")
    payload = {"contents": [{"parts": [{"text": prompt}]}],
               "generationConfig": {"temperature": 0.5, "maxOutputTokens": 4000, "responseMimeType": "application/json", "thinkingConfig": {"thinkingBudget": 0}}}
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.post(GEMINI_URL, params={"key": key}, json=payload)
        if r.status_code != 200:
            logger.warning("Gemini status %s", r.status_code)
            return None
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        return _validate(req.task, json.loads(text))
    except Exception as exc:  # noqa: BLE001 - any failure falls back deterministically
        logger.warning("Gemini call failed: %s", exc)
        return None


def _validate(task: str, d) -> Optional[dict]:
    if not isinstance(d, dict):
        return None
    if task == "quiz":
        qs = []
        for q in d.get("questions") or []:
            if not isinstance(q, dict) or q.get("type") not in ("mcq_single", "true_false", "short_answer") or not q.get("prompt"):
                continue
            corr = q.get("correct")
            corr = [str(c) for c in corr] if isinstance(corr, list) else ([str(corr)] if corr else [])
            opts = [{"id": str(o["id"]), "text": str(o["text"])} for o in q.get("options") or [] if isinstance(o, dict) and "id" in o and "text" in o]
            if q["type"] != "short_answer" and (not opts or not set(corr) <= {o["id"] for o in opts} or not corr):
                continue
            qs.append({"type": q["type"], "prompt": str(q["prompt"]), **({"options": opts} if q["type"] != "short_answer" else {}),
                       "correct": corr, "explanation": str(q.get("explanation") or "")})
        return {"title": str(d.get("title") or "Generated quiz"), "questions": qs} if qs else None
    secs = [{"heading": str(s["heading"]), "body": str(s["body"])} for s in d.get("sections") or [] if isinstance(s, dict) and s.get("heading") and s.get("body")]
    return {"title": str(d.get("title") or "Generated draft"), "sections": secs} if secs else None


@router.post("/ai/assist")
async def ai_assist(req: AssistRequest, trainer: User = Depends(_trainer), db: AsyncSession = Depends(get_db)):
    metric_task = req.task in ("struggling_summary", "course_summary")
    stats, course_title, batch_name = await _scope_stats(db, trainer, req)
    # Metric summaries are always built from stored data (templates), never free-form model output.
    if metric_task:
        result = metrics_summary(req.task, stats, course_title, batch_name)
        return {"task": req.task, "source": "fallback", "disclaimer": "AI-generated draft — review before use", **result}
    result = await gemini_generate(req, course_title)
    source = "gemini"
    if result is None:
        source = "fallback"
        result = {"quiz": fallback_quiz, "lesson_plan": fallback_lesson, "explain": fallback_explain, "activities": fallback_activities}[req.task](req, course_title)
    return {"task": req.task, "source": source, "disclaimer": "AI-generated draft — review before use", **result}
