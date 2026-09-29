"""Idempotent authored learning content for the scratch demo catalogue."""
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, Module, Lesson
from app.seeds import register


COURSES = (
    ("Cooperative Management Fundamentals", "Management", "Foundation",
     "1. Introduction to Cooperative Principles & Values", [
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
    ("Data Analytics for Cooperatives", "Technology", "Intermediate",
     "1. Fundamentals of Member Data & Ledger Analysis", [
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
)


async def seed_learning(db: AsyncSession) -> None:
    for title, category, level, module_title, lesson_specs in COURSES:
        course = (await db.execute(select(Course).where(Course.title == title).limit(1))).scalar_one_or_none()
        if course is None:
            course = Course(id=uuid.uuid4(), title=title, category=category, level=level,
                            duration_hours=2, source="native", is_active=True)
            db.add(course)
            await db.flush()
        # Find (or create) the specific named module for these authored lessons.
        module = (await db.execute(select(Module).where(
            Module.course_id == course.id, Module.title == module_title).limit(1)
        )).scalar_one_or_none()
        if module is None:
            module = Module(id=uuid.uuid4(), course_id=course.id, title=module_title, position=999)
            db.add(module)
            await db.flush()
        for position, (lesson_title, lesson_type, blocks) in enumerate(lesson_specs, 1):
            lesson = (await db.execute(select(Lesson).where(
                Lesson.module_id == module.id, Lesson.title == lesson_title).limit(1)
            )).scalar_one_or_none()
            if lesson is None:
                db.add(Lesson(id=uuid.uuid4(), module_id=module.id, title=lesson_title,
                              position=position, lesson_type=lesson_type, duration_min=8,
                              content=blocks, content_version=1))
            elif lesson.content is None:
                lesson.content = blocks
                lesson.position = position
                lesson.lesson_type = lesson_type
                lesson.duration_min = 8
    await db.flush()


register("learning", seed_learning)
