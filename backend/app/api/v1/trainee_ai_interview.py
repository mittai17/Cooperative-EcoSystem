"""Trainee AI mock interview practice (mounted at /trainee/ai-interview).

A trainee practises interview questions for their own target role. There is no
employer job here: nothing is shared with employers and no organisation scope
applies. Every route is restricted to the trainee role. Reads only the caller's
own career_target_role and TraineeSkill rows; no database writes.

Stateless like the employer path: the client holds the transcript and sends it
back on every call. The session_id is a correlation id only and is never stored.
Only text is accepted; audio and video are never persisted or sent to the model.
"""
from __future__ import annotations

import uuid
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_roles
from app.models.skill import Skill, TraineeSkill
from app.models.user import User
from app.services import ai_interview as svc

router = APIRouter()

_TRAINEE = require_roles("trainee")
MAX_PROFILE_SKILLS = 30
MAX_PROMPT_SKILLS = 10
MAX_TARGET_ROLE_CHARS = 120


# ---------------------------------------------------------------- schemas

class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _reject_blank(value: str, field: str) -> str:
    if not value.strip():
        raise ValueError(f"{field} must not be blank")
    return value


class SessionIn(_Strict):
    target_role: Optional[str] = Field(default=None, min_length=1, max_length=MAX_TARGET_ROLE_CHARS)

    @field_validator("target_role")
    @classmethod
    def _not_blank(cls, value: Optional[str]) -> Optional[str]:
        return None if value is None else _reject_blank(value, "target_role")


class TurnIn(_Strict):
    role: Literal["interviewer", "candidate"]
    text: str = Field(..., min_length=1, max_length=svc.MAX_ANSWER_CHARS)

    @field_validator("text")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        return _reject_blank(value, "text")


class TurnRequest(_Strict):
    target_role: str = Field(..., min_length=1, max_length=MAX_TARGET_ROLE_CHARS)
    history: list[TurnIn] = Field(default_factory=list, max_length=svc.MAX_TURNS)
    answer: str = Field(..., min_length=1, max_length=svc.MAX_ANSWER_CHARS)

    @field_validator("target_role")
    @classmethod
    def _role_not_blank(cls, value: str) -> str:
        return _reject_blank(value, "target_role")

    @field_validator("answer")
    @classmethod
    def _answer_not_blank(cls, value: str) -> str:
        return _reject_blank(value, "answer")


class EvaluateRequest(_Strict):
    target_role: str = Field(..., min_length=1, max_length=MAX_TARGET_ROLE_CHARS)
    history: list[TurnIn] = Field(default_factory=list, max_length=svc.MAX_TURNS)

    @field_validator("target_role")
    @classmethod
    def _role_not_blank(cls, value: str) -> str:
        return _reject_blank(value, "target_role")


# ---------------------------------------------------------------- helpers

def _profile_target(user: User) -> Optional[str]:
    cleaned = svc._clean_line(getattr(user, "career_target_role", None), MAX_TARGET_ROLE_CHARS)
    return cleaned or None


async def _own_skill_names(db: AsyncSession, trainee_id: uuid.UUID, limit: int) -> list[str]:
    """Skill names from the caller's own TraineeSkill rows only. The trainee_id
    filter is always applied; callers never supply it."""
    query = (
        select(Skill.name)
        .join(TraineeSkill, TraineeSkill.skill_id == Skill.id)
        .where(TraineeSkill.trainee_id == trainee_id)
        .order_by(Skill.name)
        .limit(limit)
    )
    rows = (await db.execute(query)).scalars().all()
    names = [name for name in rows if isinstance(name, str) and name.strip()]
    return names[:limit]


async def _context_for(db: AsyncSession, user: User, target_role: str) -> svc.JobBrief:
    skills = await _own_skill_names(db, user.id, MAX_PROMPT_SKILLS)
    return svc.trainee_context(target_role, skills)


def _transcript(history: list[TurnIn]) -> list[dict[str, str]]:
    return [{"role": turn.role, "text": turn.text} for turn in history]


def _candidate_count(turns: list[dict[str, str]]) -> int:
    return sum(1 for turn in turns if turn["role"] == "candidate")


# ---------------------------------------------------------------- routes

@router.get("/target")
async def get_target(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_TRAINEE),
):
    target = _profile_target(user)
    skills = await _own_skill_names(db, user.id, MAX_PROFILE_SKILLS)
    return {
        "target_role": target,
        "source": "profile" if target else "none",
        "skills": skills,
    }


@router.post("/sessions", status_code=201)
async def start_session(
    body: SessionIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_TRAINEE),
):
    target = svc._clean_line(body.target_role, MAX_TARGET_ROLE_CHARS) if body.target_role else _profile_target(user)
    if not target:
        raise HTTPException(
            status_code=422,
            detail="Set a target role on your profile or provide target_role in the request",
        )
    brief = await _context_for(db, user, target)
    first = await svc.next_turn([], brief)
    return {
        "session_id": str(uuid.uuid4()),
        "target_role": target,
        "first_question": first.text,
        "source": first.source,
        "disclaimer": svc.TRAINEE_DISCLAIMER,
    }


@router.post("/sessions/{session_id}/turns")
async def next_question(
    session_id: uuid.UUID,
    body: TurnRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_TRAINEE),
):
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
            "disclaimer": svc.TRAINEE_DISCLAIMER,
        }

    brief = await _context_for(db, user, body.target_role)
    nxt = await svc.next_turn(turns, brief)
    return {
        "session_id": str(session_id),
        "done": False,
        "turn_index": answered,
        "next_question": nxt.text,
        "source": nxt.source,
        "disclaimer": svc.TRAINEE_DISCLAIMER,
    }


@router.post("/sessions/{session_id}/evaluate")
async def evaluate_session(
    session_id: uuid.UUID,
    body: EvaluateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_TRAINEE),
):
    turns = _transcript(body.history)
    answered = _candidate_count(turns)
    if answered == 0:
        raise HTTPException(status_code=422, detail="At least one candidate answer is required")
    if len(turns) > svc.MAX_TURNS:
        raise HTTPException(status_code=422, detail=f"Interview is limited to {svc.MAX_TURNS} turns")

    brief = await _context_for(db, user, body.target_role)
    result: dict[str, Any] = await svc.evaluate(turns, brief)
    return {
        "session_id": str(session_id),
        "label": svc.TRAINEE_EVALUATION_LABEL,
        "source": result["source"],
        "answers_evaluated": answered,
        "scores": result["scores"],
        "strengths": result["strengths"],
        "gaps": result["gaps"],
        "follow_up_topics": result["follow_up_topics"],
        "note": result.get("note"),
        "disclaimer": svc.TRAINEE_DISCLAIMER,
    }
