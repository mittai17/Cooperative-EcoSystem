"""Employer AI mock interview (mounted at /employer/ai-interview).

Stateless: the client holds the transcript and sends it back on every call.
The session_id is a correlation id only and is never stored. Every route is
restricted to employer/admin and scoped to the caller's organisation through the
same helpers the employer job routes use. Only text is accepted.
"""
from __future__ import annotations

import uuid
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.employer_jobs import _employer_job, _load_requirements, _scoped_jobs
from app.database import get_db
from app.deps import require_roles
from app.models.job import Job
from app.models.user import User
from app.services import ai_interview as svc

router = APIRouter()

_EMPLOYER = require_roles("employer", "admin")
MAX_JOB_LIST = 100
MAX_SKILL_TOPICS = 10


# ---------------------------------------------------------------- schemas

class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TurnIn(_Strict):
    role: Literal["interviewer", "candidate"]
    text: str = Field(..., min_length=1, max_length=svc.MAX_ANSWER_CHARS)

    @field_validator("text")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must not be blank")
        return value


class SessionIn(_Strict):
    job_id: uuid.UUID


class TurnRequest(_Strict):
    job_id: uuid.UUID
    history: list[TurnIn] = Field(default_factory=list, max_length=svc.MAX_TURNS)
    answer: str = Field(..., min_length=1, max_length=svc.MAX_ANSWER_CHARS)

    @field_validator("answer")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("answer must not be blank")
        return value


class EvaluateRequest(_Strict):
    job_id: uuid.UUID
    history: list[TurnIn] = Field(default_factory=list, max_length=svc.MAX_TURNS)


# ---------------------------------------------------------------- helpers

def _ensure_open_for_interview(job: Job) -> None:
    if job.status == "closed":
        raise HTTPException(status_code=409, detail="Closed jobs cannot be used for a mock interview")


async def _job_brief(db: AsyncSession, job: Job) -> svc.JobBrief:
    requirements = await _load_requirements(db, job.id)
    skills: list[str] = [
        r.skill_name.strip() for r in requirements if r.kind == "skill" and r.skill_name and r.skill_name.strip()
    ]
    if not skills and isinstance(job.skills_required, list):
        for item in job.skills_required:
            if isinstance(item, str):
                skills.append(item)
            elif isinstance(item, dict):
                name = item.get("name") or item.get("skill_name")
                if isinstance(name, str):
                    skills.append(name)
    unique: list[str] = []
    for name in skills:
        cleaned = svc._clean_line(name, svc.MAX_TOPIC_CHARS)
        if cleaned and cleaned not in unique:
            unique.append(cleaned)
    return svc.JobBrief(
        title=job.title,
        sector=job.sector,
        description=job.description,
        skills=tuple(unique[:MAX_SKILL_TOPICS]),
    )


def _transcript(history: list[TurnIn]) -> list[dict[str, str]]:
    return [{"role": turn.role, "text": turn.text} for turn in history]


def _candidate_count(turns: list[dict[str, str]]) -> int:
    return sum(1 for turn in turns if turn["role"] == "candidate")


# ---------------------------------------------------------------- routes

@router.get("/jobs")
async def list_interview_jobs(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EMPLOYER),
):
    query = _scoped_jobs(user).where(Job.status != "closed").order_by(Job.title).limit(MAX_JOB_LIST)
    jobs = (await db.execute(query)).scalars().all()
    return {
        "items": [{"id": str(job.id), "title": job.title, "status": job.status} for job in jobs],
        "disclaimer": svc.DISCLAIMER,
    }


@router.post("/sessions", status_code=201)
async def start_session(
    body: SessionIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EMPLOYER),
):
    job = await _employer_job(db, body.job_id, user)
    _ensure_open_for_interview(job)
    brief = await _job_brief(db, job)
    first = await svc.next_turn([], brief)
    return {
        "session_id": str(uuid.uuid4()),
        "job": {"id": str(job.id), "title": job.title},
        "first_question": first.text,
        "source": first.source,
        "disclaimer": svc.DISCLAIMER,
    }


@router.post("/sessions/{session_id}/turns")
async def next_question(
    session_id: uuid.UUID,
    body: TurnRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EMPLOYER),
):
    job = await _employer_job(db, body.job_id, user)
    turns = _transcript(body.history)
    turns.append({"role": "candidate", "text": body.answer})

    if len(turns) > svc.MAX_TURNS:
        raise HTTPException(status_code=422, detail=f"Interview is limited to {svc.MAX_TURNS} turns")
    answered = _candidate_count(turns)
    if answered > svc.MAX_CANDIDATE_ANSWERS:
        raise HTTPException(status_code=422, detail="Interview already has the maximum number of answers")
    if answered == svc.MAX_CANDIDATE_ANSWERS:
        return {
            "session_id": str(session_id),
            "done": True,
            "turn_index": answered,
            "next_question": None,
            "source": None,
            "disclaimer": svc.DISCLAIMER,
        }

    brief = await _job_brief(db, job)
    nxt = await svc.next_turn(turns, brief)
    return {
        "session_id": str(session_id),
        "done": False,
        "turn_index": answered,
        "next_question": nxt.text,
        "source": nxt.source,
        "disclaimer": svc.DISCLAIMER,
    }


@router.post("/sessions/{session_id}/evaluate")
async def evaluate_session(
    session_id: uuid.UUID,
    body: EvaluateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EMPLOYER),
):
    job = await _employer_job(db, body.job_id, user)
    turns = _transcript(body.history)
    answered = _candidate_count(turns)
    if answered == 0:
        raise HTTPException(status_code=422, detail="At least one candidate answer is required")
    if len(turns) > svc.MAX_TURNS:
        raise HTTPException(status_code=422, detail=f"Interview is limited to {svc.MAX_TURNS} turns")

    brief = await _job_brief(db, job)
    result: dict[str, Any] = await svc.evaluate(turns, brief)
    return {
        "session_id": str(session_id),
        "label": svc.EVALUATION_LABEL,
        "source": result["source"],
        "answers_evaluated": answered,
        "scores": result["scores"],
        "strengths": result["strengths"],
        "gaps": result["gaps"],
        "follow_up_topics": result["follow_up_topics"],
        "note": result.get("note"),
        "disclaimer": svc.DISCLAIMER,
    }
