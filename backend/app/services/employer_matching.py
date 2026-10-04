"""Deterministic candidate-to-job scorer for the employer module.

Pure functions only: no database access and no LLM call. Callers load facts
from the database (see `app.api.v1.employer_jobs`) and pass them in, so the
same inputs always produce the same output. All explanation text is templated
from these computed facts.

Weighted score (0-100), nominal weights:
    40  required_skills     (requirement-weighted share of required skills held)
    25  skill_proficiency   (held required skills vs their min_proficiency)
    15  education           (candidate level vs job minimum)
    10  certification       (valid certificate matching the requirement)
    10  experience          (years vs job minimum)

A factor the job does not request is "unknown" and dropped; the remaining
nominal weights are renormalised to 100 so a job is never scored down for a
criterion it did not ask for. Location is reported for information only and is
never part of the score.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Optional

FACTOR_WEIGHTS: dict[str, int] = {
    "required_skills": 40,
    "skill_proficiency": 25,
    "education": 15,
    "certification": 10,
    "experience": 10,
}

# Mirrors skill_engine.LEVEL_SCORES on a 0-100 scale.
LEVEL_PROFICIENCY: dict[str, int] = {"Foundational": 25, "Intermediate": 50, "Proficient": 75, "Expert": 100}
DEFAULT_LEVEL = "Foundational"

# Ordered education ladder. Index is the rank used for comparison.
EDUCATION_LEVELS: tuple[str, ...] = ("Below SSC", "SSC", "HSC", "Diploma", "Graduate", "Postgraduate")

_DEGREE_CODES: dict[str, int] = {
    "phd": 5, "mtech": 5, "mba": 5, "msc": 5, "ma": 5, "mcom": 5, "mca": 5,
    "btech": 4, "bsc": 4, "ba": 4, "bcom": 4, "be": 4, "bca": 4, "bba": 4, "bed": 4,
}
# Keyword rules checked in order (more specific first). Unknown text maps to None.
_EDUCATION_KEYWORDS: tuple[tuple[tuple[str, ...], int], ...] = (
    (("phd", "doctor", "post graduate", "postgraduate", "post-graduate", "master"), 5),
    (("graduat", "bachelor"), 4),
    (("diploma", "industrial training", "polytechnic"), 3),
    (("hsc", "12th", "higher secondary", "intermediate", "plus two", "+2"), 2),
    (("ssc", "10th", "matric", "secondary"), 1),
)


@dataclass(frozen=True)
class SkillFact:
    name: str
    level: Optional[str]
    verified: bool = False
    confidence: Optional[int] = None


@dataclass(frozen=True)
class CertificateFact:
    title: Optional[str]
    skills_certified: tuple[str, ...] = ()
    valid: bool = False


@dataclass(frozen=True)
class CandidateFacts:
    skills: tuple[SkillFact, ...] = ()
    education_level: Optional[str] = None
    years_of_experience: Optional[int] = None
    certificates: tuple[CertificateFact, ...] = ()
    district: Optional[str] = None
    state: Optional[str] = None


@dataclass(frozen=True)
class RequirementFact:
    kind: str  # skill|education|experience|certification
    skill_name: Optional[str] = None
    requirement_type: str = "required"  # required|preferred (skills only)
    min_proficiency: Optional[int] = None
    weight: int = 1
    min_education: Optional[str] = None
    min_years: Optional[int] = None
    certification_name: Optional[str] = None


@dataclass(frozen=True)
class JobFacts:
    location: Optional[str] = None


def _norm(value: Optional[str]) -> str:
    return " ".join((value or "").split()).casefold()


def education_rank(value: Optional[str]) -> Optional[int]:
    """Rank of a free-text education level on EDUCATION_LEVELS, or None.

    Long words match as substrings; short degree codes (BA, M.Sc, ...) only
    match the leading token(s), so "Diploma" never matches the code "MA".
    """
    text = _norm(value)
    if not text:
        return None
    tokens = re.findall(r"[a-z0-9+]+", text)
    if tokens:
        prefixes = {tokens[0]} | ({tokens[0] + tokens[1]} if len(tokens) > 1 else set())
        for code in sorted(prefixes):
            if code in _DEGREE_CODES:
                return _DEGREE_CODES[code]
    for keywords, rank in _EDUCATION_KEYWORDS:
        if any(keyword in text for keyword in keywords):
            return rank
    return None


def _level_proficiency(level: Optional[str]) -> int:
    return LEVEL_PROFICIENCY.get(level or DEFAULT_LEVEL, LEVEL_PROFICIENCY[DEFAULT_LEVEL])


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def _half_up(value: float) -> int:
    return int(math.floor(value + 0.5))


def _certificate_covers(cert: CertificateFact, wanted: str) -> bool:
    target = _norm(wanted)
    if _norm(cert.title) == target:
        return True
    return any(_norm(item) == target for item in cert.skills_certified)


def _skill_lookup(candidate: CandidateFacts) -> dict[str, SkillFact]:
    lookup: dict[str, SkillFact] = {}
    for skill in sorted(candidate.skills, key=lambda s: (_norm(s.name), s.name)):
        key = _norm(skill.name)
        current = lookup.get(key)
        # Keep the strongest entry when the same skill name appears twice.
        if current is None or _level_proficiency(skill.level) > _level_proficiency(current.level):
            lookup[key] = skill
    return lookup


def _factor(status: str, value: Optional[int], detail: str, fraction: float, **extra) -> dict:
    """One scored factor. `fraction` (0-1) drives the score; it is stripped from the output."""
    return {"status": status, "value": value, "detail": detail, "fraction": fraction, **extra}


def score_candidate(job: JobFacts, requirements: list[RequirementFact], candidate: CandidateFacts) -> dict:
    """Score one candidate against one job. Deterministic for equal inputs."""
    ordered = sorted(requirements, key=lambda r: (r.kind, r.requirement_type, _norm(r.skill_name),
                                                  _norm(r.min_education), r.min_years or 0,
                                                  _norm(r.certification_name)))
    skill_reqs = [r for r in ordered if r.kind == "skill" and r.requirement_type == "required" and r.skill_name]
    preferred_reqs = [r for r in ordered if r.kind == "skill" and r.requirement_type == "preferred" and r.skill_name]
    education_req = next((r for r in ordered if r.kind == "education"), None)
    experience_req = next((r for r in ordered if r.kind == "experience"), None)
    certification_reqs = [r for r in ordered if r.kind == "certification" and r.certification_name]

    skills = _skill_lookup(candidate)
    matched_skills: list[dict] = []
    missing_required: list[str] = []
    missing_all: list[str] = []
    present_weight = 0
    total_weight = sum(r.weight for r in skill_reqs)
    held_required = 0
    proficiency_weighted = 0.0
    proficiency_weight = 0
    for req in skill_reqs + preferred_reqs:
        entry = skills.get(_norm(req.skill_name))
        if entry is None:
            missing_all.append(req.skill_name)
            if req.requirement_type == "required":
                missing_required.append(req.skill_name)
            continue
        trainee_pct = _level_proficiency(entry.level)
        required_pct = req.min_proficiency or 0
        ratio = 1.0 if required_pct <= 0 else _clamp01(trainee_pct / required_pct)
        matched_skills.append({
            "name": req.skill_name, "requirement_type": req.requirement_type,
            "status": "matched" if ratio >= 1.0 else "partial",
            "level": entry.level or DEFAULT_LEVEL, "verified": bool(entry.verified),
            "confidence": entry.confidence, "trainee_proficiency": trainee_pct,
            "required_proficiency": req.min_proficiency,
        })
        if req.requirement_type == "required":
            held_required += 1
            present_weight += req.weight
            proficiency_weighted += req.weight * ratio
            proficiency_weight += req.weight

    factors: dict[str, dict] = {}
    if skill_reqs:
        coverage = present_weight / total_weight
        factors["required_skills"] = _factor(
            "matched" if held_required == len(skill_reqs) else ("partial" if held_required else "missing"),
            held_required, f"Holds {held_required} of {len(skill_reqs)} required skills.",
            fraction=coverage, total=len(skill_reqs))
        proficiency = (proficiency_weighted / proficiency_weight) if proficiency_weight else 0.0
        meeting = sum(1 for m in matched_skills if m["requirement_type"] == "required" and m["status"] == "matched")
        factors["skill_proficiency"] = _factor(
            "matched" if meeting == len(skill_reqs) else ("partial" if proficiency_weight else "missing"),
            _half_up(proficiency * 100),
            f"{meeting} of {len(skill_reqs)} required skills meet the minimum proficiency.",
            fraction=proficiency)

    if education_req is not None and education_req.min_education:
        required_rank = education_rank(education_req.min_education)
        candidate_rank = education_rank(candidate.education_level)
        required_label = education_req.min_education
        if required_rank is None:
            factors["education"] = _factor("unknown", 0,
                                           f"Job education requirement '{required_label}' is not recognised.", 0.0)
        elif candidate_rank is None:
            factors["education"] = _factor("missing", 0,
                                           f"Education not recorded; job requires {EDUCATION_LEVELS[required_rank]}.", 0.0)
        else:
            ratio = _clamp01(candidate_rank / required_rank)
            factors["education"] = _factor(
                "matched" if candidate_rank >= required_rank else "partial", _half_up(ratio * 100),
                f"Candidate has {EDUCATION_LEVELS[candidate_rank]}; job requires {EDUCATION_LEVELS[required_rank]}.",
                fraction=ratio)

    if certification_reqs:
        held_names = [r.certification_name for r in certification_reqs
                      if any(cert.valid and _certificate_covers(cert, r.certification_name)
                             for cert in candidate.certificates)]
        missing_names = [r.certification_name for r in certification_reqs if r.certification_name not in held_names]
        fraction = len(held_names) / len(certification_reqs)
        if not missing_names:
            detail = f"Holds all {len(certification_reqs)} required certificate(s)."
        elif held_names:
            detail = f"Holds {len(held_names)} of {len(certification_reqs)} required certificates; missing: " \
                     + ", ".join(missing_names[:3]) + "."
        else:
            detail = "No valid certificate for " + ", ".join(f"'{n}'" for n in missing_names[:3]) + " on record."
        factors["certification"] = _factor(
            "matched" if not missing_names else ("partial" if held_names else "missing"),
            _half_up(fraction * 100), detail, fraction=fraction)

    if experience_req is not None and experience_req.min_years is not None:
        years = candidate.years_of_experience
        needed = experience_req.min_years
        if needed <= 0:
            # A zero-year minimum (e.g. "Fresher") is met without a recorded value.
            factors["experience"] = _factor("matched", 100, "Job accepts freshers.", fraction=1.0)
        elif years is None:
            factors["experience"] = _factor("missing", 0, f"Experience not recorded; job asks for {needed} years.", 0.0)
        else:
            ratio = 1.0 if needed <= 0 else _clamp01(years / needed)
            factors["experience"] = _factor(
                "matched" if years >= needed else "partial", _half_up(ratio * 100),
                f"Has {years} years of experience; job asks for {needed}.", fraction=ratio)

    applicable_nominal = sum(FACTOR_WEIGHTS[name] for name in factors)
    breakdown: dict[str, dict] = {}
    raw_total = 0.0
    for name, nominal in FACTOR_WEIGHTS.items():
        if name not in factors:
            breakdown[name] = {"status": "unknown", "value": None, "weight": nominal, "effective_weight": 0.0,
                               "contribution": 0.0, "detail": "Not requested by this job."}
            continue
        factor = factors[name]
        effective = nominal * 100.0 / applicable_nominal
        contribution = effective * factor["fraction"]
        raw_total += contribution
        entry = {k: v for k, v in factor.items() if k != "fraction"}
        entry.update({"weight": nominal, "effective_weight": round(effective, 2),
                      "contribution": round(contribution, 2)})
        breakdown[name] = entry

    location_match = None
    job_location = _norm(job.location)
    candidate_places = [_norm(v) for v in (candidate.district, candidate.state) if _norm(v)]
    if job_location and candidate_places:
        location_match = any(place in job_location for place in candidate_places)
    breakdown["location"] = {
        "status": "unknown" if location_match is None else ("matched" if location_match else "missing"),
        "value": None, "weight": 0, "effective_weight": 0.0, "contribution": 0.0, "informational": True,
        "detail": ("Location not recorded." if location_match is None
                   else ("Candidate is in the job's location." if location_match
                         else "Candidate is outside the job's location.")),
    }

    score = 0 if applicable_nominal == 0 else max(0, min(100, _half_up(raw_total)))
    return {
        "score": score,
        "breakdown": breakdown,
        "matched_skills": matched_skills,
        "missing_skills": missing_all,
        "explanation": _explanation(score, breakdown, missing_required, applicable_nominal),
        "recommended_action": _recommended_action(score, applicable_nominal),
    }


def _recommended_action(score: int, applicable_nominal: int) -> Optional[str]:
    if applicable_nominal == 0:
        return None
    if score >= 80:
        return "Shortlist: strong coverage of the scored requirements."
    if score >= 50:
        return "Review: partial coverage; check the missing requirements."
    return "Not recommended yet: significant gaps against the scored requirements."


def _explanation(score: int, breakdown: dict, missing_required: list[str], applicable_nominal: int) -> list[dict]:
    """Templated explanation items, built only from the computed facts."""
    if applicable_nominal == 0:
        return [{"kind": "gap", "text": "This job has no scored requirements yet, so no match score is available."}]
    items: list[dict] = []
    for name in ("required_skills", "skill_proficiency", "education", "certification", "experience"):
        factor = breakdown[name]
        if factor["status"] == "unknown":
            continue
        kind = "match" if factor["status"] == "matched" else "gap"
        items.append({"kind": kind, "text": factor["detail"]})
    if missing_required:
        items.append({"kind": "gap", "text": "Missing required skills: " + ", ".join(missing_required[:5]) + "."})
    location = breakdown["location"]
    if location["status"] != "unknown":
        items.append({"kind": "match" if location["status"] == "matched" else "gap",
                      "text": location["detail"] + " (informational, not scored)"})
    return items
