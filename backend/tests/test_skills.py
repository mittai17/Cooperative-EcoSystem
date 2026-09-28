from app.services.skill_engine import calculate_skill_gap

def test_skill_gap_all_met():
    trainee_skills = [
        {"skill": "Cooperative Management", "level": "Proficient"},
        {"skill": "Communication", "level": "Proficient"},
        {"skill": "Rural Development", "level": "Intermediate"},
        {"skill": "Data Analysis", "level": "Intermediate"},
    ]
    result = calculate_skill_gap(trainee_skills, "Cooperative Development Officer")
    assert result["match_score"] == 100
    assert len(result["gaps"]) == 0

def test_skill_gap_partial():
    trainee_skills = [
        {"skill": "Cooperative Management", "level": "Proficient"},
    ]
    result = calculate_skill_gap(trainee_skills, "Cooperative Development Officer")
    assert result["match_score"] < 100
    assert len(result["gaps"]) > 0
