"""LLM-backed career advisor.

Where an LLM adds real value in this product: turning a trainee's
structured Skill Passport / skill-gap numbers into a natural-language
explanation and conversational career guidance ("why am I only 65% matched,
and what's the fastest path to closing it"). Everything upstream of this
(skill gap %, matched/missing skill lists, level scoring) stays deterministic
and DB-driven (see skill_engine.py, job_matching.py) - the LLM is only used
for the explanation layer, never for the numbers themselves, so results stay
auditable.

Calls Google's Gemini API directly over HTTPS (no SDK dependency) using
GEMINI_API_KEY from config. Falls back to a deterministic canned response
on any failure (missing key, network error, non-2xx, malformed response) so
the endpoint never 500s just because an external LLM provider is unreachable.
"""
import logging
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger("career_ai")

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

SYSTEM_PREAMBLE = (
    "You are CoopSetu AI's Career Navigator, an assistant embedded in a "
    "cooperative-sector (India) training-to-employment platform run for the "
    "Ministry of Cooperation / NCCT. Answer the trainee's question directly, "
    "grounded ONLY in the structured context provided (their skill passport, "
    "skill-gap results, or job-match breakdown). Be concise (3-5 sentences), "
    "concrete, and cooperative-sector specific. Never invent skills, scores, "
    "or job titles that are not present in the provided context."
)


async def generate_career_response(message: str, context: Optional[dict] = None) -> Optional[str]:
    """Returns a natural-language response from Gemini, or None if the LLM
    call could not be completed (caller should fall back to a deterministic
    response in that case)."""
    settings = get_settings()
    if not settings.gemini_api_key:
        return None

    context_block = ""
    if context:
        context_block = f"\n\nStructured context (JSON):\n{context}"

    prompt = f"{SYSTEM_PREAMBLE}\n\nTrainee question: {message}{context_block}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        # thinkingBudget: 0 disables Gemini 2.5's internal reasoning tokens, which
        # otherwise silently eat most of maxOutputTokens and truncate short chat
        # replies (observed: 285 of 300 tokens spent "thinking", finishReason
        # MAX_TOKENS with only a few words of visible output).
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 400,
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                GEMINI_URL,
                params={"key": settings.gemini_api_key},
                json=payload,
            )
        if resp.status_code != 200:
            logger.warning("Gemini call failed with status %s", resp.status_code)
            return None
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts).strip()
        return text or None
    except httpx.HTTPError as exc:
        logger.warning("Gemini call raised HTTP error: %s", exc)
        return None
    except Exception as exc:  # defensive: never let an LLM hiccup break the endpoint
        logger.warning("Gemini call raised unexpected error: %s", exc)
        return None
