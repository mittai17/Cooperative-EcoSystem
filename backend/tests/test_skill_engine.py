from app.services.skill_engine import calculate_skill_gap

def test_full_match():
    skills = [
        {"skill": "Cooperative Management", "level": "Proficient"},
        {"skill": "Communication", "level": "Proficient"},
        {"skill": "Rural Development", "level": "Intermediate"},
        {"skill": "Data Analysis", "level": "Intermediate"},
    ]
    result = calculate_skill_gap(skills, "Cooperative Development Officer")
    assert result["match_score"] >= 90
    assert len(result["met"]) >= 3

def test_partial_match():
    skills = [{"skill": "Cooperative Management", "level": "Proficient"}]
    result = calculate_skill_gap(skills, "Cooperative Development Officer")
    assert result["match_score"] < 100
    assert len(result["gaps"]) > 0

def test_unknown_role():
    result = calculate_skill_gap([], "Unknown Role XYZ")
    assert result["match_score"] == 0
