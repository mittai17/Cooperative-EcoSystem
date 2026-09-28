from typing import List, Dict
from app.services.skill_engine import LEVEL_SCORES

def match_candidate_to_job(trainee_skills: List[Dict], job_requirements: List[Dict]) -> Dict:
    if not job_requirements:
        return {"match_score": 0, "matched": [], "missing": [], "explanation": "No requirements"}
    
    skill_map = {s["skill"]: s for s in trainee_skills}
    matched = []
    missing = []
    
    for req in job_requirements:
        skill_name = req["skill"]
        entry = skill_map.get(skill_name)
        req_level = LEVEL_SCORES.get(req.get("required_level", "Foundational"), 1)
        
        if entry:
            current = LEVEL_SCORES.get(entry.get("level", "Foundational"), 1)
            if current >= req_level:
                matched.append({"skill": skill_name, "status": "matched", "confidence": entry.get("confidence", 80)})
            else:
                missing.append({"skill": skill_name, "status": "gap", "required": req.get("required_level"), "current": entry.get("level")})
        else:
            missing.append({"skill": skill_name, "status": "missing", "required": req.get("required_level"), "current": None})
    
    match_score = int((len(matched) / len(job_requirements)) * 100)
    
    return {
        "match_score": match_score,
        "matched": matched,
        "missing": missing,
        "explanation": f"{len(matched)} of {len(job_requirements)} required skills matched."
    }
