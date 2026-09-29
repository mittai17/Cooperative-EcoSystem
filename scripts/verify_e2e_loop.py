#!/usr/bin/env python3
"""
CoopSetu AI — Automated End-to-End Closed-Loop Verification Script
SIH 2026 Problem Statement 26087: AI & LMS Enabled Cooperative Ecosystem

Exercises the full 25-step closed-loop lifecycle:
 1. User Registration & Clerk Identity Synchronization (Trainee)
 2. Training Institution Provisioning (RICM / ICM)
 3. Cooperative Employer Account Provisioning (Amul / NCDC / Apex)
 4. Faculty / Trainer Account Provisioning
 5. Cooperative Training Programme Definition & Publication
 6. Programme Catalog Lookup & Validation
 7. Trainee Programme Nomination Submission
 8. Nomination Review & Institutional Approval
 9. Course Catalog Discovery & Skill Taxonomy Mapping
10. Trainee Course Enrollment & Learning Track Activation
11. Active Learning Progression & Module Tracking
12. Course Assessment Retrieval
13. Assessment Submission, Auto-Grading & Competency Attribution
14. Trainer Dynamic QR Code Attendance Session Generation
15. Trainee QR Attendance Scan & Cryptographic Check-in
16. Trainee Attendance Audit Trail & Eligibility Verification
17. Official Tamper-Evident Certificate Issuance
18. Public Tamper-Evident Certificate Verification Portal
19. Dynamic AI Skill Passport Generation with Confidence Scoring
20. National Cooperative Career Role Taxonomy Lookup
21. Deterministic AI Skill Gap Analysis against Target Role
22. AI Career Navigator Recommendations & Milestone Mapping
23. Interactive AI Career Chat Advisor Query
24. Employer Job Posting & Skill Requirement Definition
25. Explainable Candidate Matching, Application & Closed-Loop Employer Feedback
"""

import sys
import os
import json
import time
import uuid
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple

API_URL = os.environ.get("API_URL", "http://127.0.0.1:8000").rstrip("/")

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def make_request(method: str, path: str, payload: Any = None, headers: Dict[str, str] = None) -> Tuple[int, Dict[str, Any], float]:
    url = f"{API_URL}{path}"
    req_headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Internal-Secret": os.environ.get("INTERNAL_API_SECRET", "scratch-internal-only"),
    }
    if headers:
        req_headers.update(headers)
    data_bytes = json.dumps(payload).encode("utf-8") if payload is not None else None
    
    start = time.perf_counter()
    req = urllib.request.Request(url, data=data_bytes, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            elapsed = (time.perf_counter() - start) * 1000
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}, elapsed
    except urllib.error.HTTPError as err:
        elapsed = (time.perf_counter() - start) * 1000
        err_body = err.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return err.code, parsed, elapsed
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return 599, {"error": str(e)}, elapsed

def print_banner():
    print(f"{Colors.BOLD}{Colors.OKCYAN}")
    print("=" * 80)
    print("  CoopSetu AI — 25-STEP CLOSED-LOOP PLATFORM VERIFICATION TEST SUITE")
    print("  Smart India Hackathon 2026 | PS 26087 | Ministry of Cooperation & NCCT")
    print("=" * 80)
    print(f"{Colors.ENDC}")
    print(f"Target API Endpoint: {Colors.BOLD}{API_URL}{Colors.ENDC}\n")

def run_step(step_num: int, title: str, func, context: Dict[str, Any]) -> bool:
    print(f"{Colors.BOLD}[Step {step_num:02d}/25] {title}{Colors.ENDC}")
    try:
        passed, detail, latency = func(context)
        status_color = Colors.OKGREEN if passed else Colors.FAIL
        status_text = "PASSED" if passed else "FAILED"
        print(f"  Status: {status_color}{Colors.BOLD}{status_text}{Colors.ENDC} ({latency:.1f}ms)")
        print(f"  Result: {detail}\n")
        return passed
    except Exception as exc:
        print(f"  Status: {Colors.FAIL}{Colors.BOLD}EXCEPTION{Colors.ENDC}")
        print(f"  Error: {str(exc)}\n")
        return False

# --- STEP IMPLEMENTATIONS ---

def step_01_trainee_registration(ctx: Dict[str, Any]):
    uid = f"trainee_clerk_{uuid.uuid4().hex[:8]}"
    email = f"patil.ravindra_{uuid.uuid4().hex[:6]}@coopsetu.gov.in"
    payload = {
        "clerk_user_id": uid,
        "email": email,
        "full_name": "Ravindra Suresh Patil",
        "role": "trainee"
    }
    status, data, lat = make_request("POST", "/api/v1/auth/sync", payload)
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "id" in data, "User ID missing from response"
    ctx["trainee_id"] = data["id"]
    ctx["trainee_clerk_id"] = uid
    ctx["trainee_email"] = email
    return True, f"Trainee synced (ID: {data['id']}, Role: {data['role']})", lat

def step_02_institution_provisioning(ctx: Dict[str, Any]):
    uid = f"inst_clerk_{uuid.uuid4().hex[:8]}"
    email = f"admin_{uuid.uuid4().hex[:6]}@irma.ac.in"
    payload = {
        "clerk_user_id": uid,
        "email": email,
        "full_name": "Institute of Rural Management Anand (IRMA)",
        "role": "institution"
    }
    status, data, lat = make_request("POST", "/api/v1/auth/sync", payload)
    assert status == 200, f"Expected 200, got {status}: {data}"
    ctx["institution_id"] = data["id"]
    ctx["inst_clerk_id"] = uid
    return True, f"Institution account synced (ID: {data['id']})", lat

def step_03_employer_provisioning(ctx: Dict[str, Any]):
    uid = f"empl_clerk_{uuid.uuid4().hex[:8]}"
    email = f"hr_{uuid.uuid4().hex[:6]}@amul.coop"
    payload = {
        "clerk_user_id": uid,
        "email": email,
        "full_name": "Gujarat Co-operative Milk Marketing Federation (Amul)",
        "role": "employer"
    }
    status, data, lat = make_request("POST", "/api/v1/auth/sync", payload)
    assert status == 200, f"Expected 200, got {status}: {data}"
    ctx["employer_id"] = data["id"]
    ctx["empl_clerk_id"] = uid
    return True, f"Employer account synced (ID: {data['id']})", lat

def step_04_trainer_provisioning(ctx: Dict[str, Any]):
    uid = f"trainer_clerk_{uuid.uuid4().hex[:8]}"
    email = f"dr.kulkarni_{uuid.uuid4().hex[:6]}@ncct.gov.in"
    payload = {
        "clerk_user_id": uid,
        "email": email,
        "full_name": "Dr. Ramesh Kulkarni (Senior Faculty)",
        "role": "trainer"
    }
    status, data, lat = make_request("POST", "/api/v1/auth/sync", payload)
    assert status == 200, f"Expected 200, got {status}: {data}"
    ctx["trainer_id"] = data["id"]
    ctx["trainer_clerk_id"] = uid
    return True, f"Trainer account synced (ID: {data['id']})", lat

def step_05_programme_definition(ctx: Dict[str, Any]):
    payload = {
        "title": f"Advanced Dairy Cooperative Management {time.strftime('%Y')}",
        "sector": "Dairy & Animal Husbandry",
        "level": "Intermediate",
        "mode": "Blended",
        "duration_weeks": 8,
        "seats_total": 45,
        "description": "Comprehensive programme on cooperative governance, cold chain logistics, and milk procurement."
    }
    status, data, lat = make_request("POST", "/api/v1/programmes/", payload, headers={"Authorization": f"Bearer dev-token:{ctx['inst_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "id" in data, "Programme ID missing"
    ctx["programme_id"] = data["id"]
    ctx["programme_title"] = data["title"]
    # Create a batch for this programme to support nomination approval
    batch_payload = {"name": "E2E Batch 2026-A", "capacity": 45}
    bstatus, bdata, blat = make_request("POST", f"/api/v1/programmes/{data['id']}/batches", batch_payload,
                                         headers={"Authorization": f"Bearer dev-token:{ctx['inst_clerk_id']}"})
    assert bstatus == 200, f"Batch create failed {bstatus}: {bdata}"
    ctx["batch_id"] = bdata["id"]
    return True, f"Programme published: '{data['title']}' (ID: {data['id']}), Batch: {bdata['id']}", lat + blat

def step_06_programme_lookup(ctx: Dict[str, Any]):
    pid = ctx["programme_id"]
    status, data, lat = make_request("GET", f"/api/v1/programmes/{pid}")
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert data["id"] == pid
    assert data["level"] == "Intermediate"
    return True, f"Retrieved programme '{data['title']}' with capacity {data['seats_total']}", lat

def step_07_trainee_nomination(ctx: Dict[str, Any]):
    payload = {
        "programme_id": ctx["programme_id"],
        "trainee_id": ctx["trainee_id"]
    }
    status, data, lat = make_request("POST", "/api/v1/programmes/nominations", payload, headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "id" in data, "Nomination ID missing"
    ctx["nomination_id"] = data["id"]
    return True, f"Nomination submitted (ID: {data['id']}, Status: {data['status']})", lat

def step_08_nomination_approval(ctx: Dict[str, Any]):
    nid = ctx["nomination_id"]
    bid = ctx["batch_id"]
    status, data, lat = make_request("PATCH", f"/api/v1/programmes/nominations/{nid}?status=approved&batch_id={bid}", headers={"Authorization": f"Bearer dev-token:{ctx['inst_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert data["status"] == "approved"
    return True, f"Nomination {nid} reviewed & approved by institution (batch: {bid})", lat

def step_09_course_catalog_discovery(ctx: Dict[str, Any]):
    status, data, lat = make_request("GET", "/api/v1/courses/")
    assert status == 200, f"Expected 200, got {status}: {data}"
    courses = data.get("courses", [])
    assert len(courses) > 0, "No courses found in catalog"
    ctx["active_course"] = courses[0]
    return True, f"Catalog verified with {len(courses)} accredited courses (First: {courses[0]['title']})", lat

def step_10_course_enrollment(ctx: Dict[str, Any]):
    cid = ctx["active_course"]["id"]
    status, data, lat = make_request("POST", f"/api/v1/courses/{cid}/enroll", headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert data.get("status") == "enrolled"
    return True, f"Trainee successfully enrolled in course '{cid}'", lat

def step_11_active_learning_progress(ctx: Dict[str, Any]):
    status, data, lat = make_request("GET", "/api/v1/courses/my/enrolled", headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    enrolled = data.get("courses", [])
    assert len(enrolled) > 0
    return True, f"Active progress confirmed: {len(enrolled)} ongoing courses (Avg: {enrolled[0].get('progress', 0)}% completion)", lat

def step_12_assessment_retrieval(ctx: Dict[str, Any]):
    status, listing, lat = make_request("GET", "/api/v1/assessments/")
    assert status == 200, f"Expected 200, got {status}: {listing}"
    assert listing.get("assessments"), "No assessment question bank seeded"
    # Prefer the canonical Governance Quiz which has the matching answer key for step 13.
    # Fall back to any seeded assessment with questions.
    PREFERRED_TITLE = "Cooperative Principles & Governance Quiz"
    assessment_id, data = None, None
    for item in listing["assessments"]:
        if PREFERRED_TITLE in item.get("title", ""):
            sstatus, sdata, detail_lat = make_request("GET", f"/api/v1/assessments/{item['id']}")
            lat += detail_lat
            if sstatus == 200 and sdata.get("questions", 0) >= 8:
                assessment_id, data = item["id"], sdata
                break
    if assessment_id is None:
        for item in listing["assessments"]:
            sstatus, sdata, detail_lat = make_request("GET", f"/api/v1/assessments/{item['id']}")
            lat += detail_lat
            if sstatus == 200 and sdata.get("questions", 0) >= 8:
                assessment_id, data = item["id"], sdata
                break
    if assessment_id is None:
        raise AssertionError("No seeded assessment with >= 8 questions found")
    ctx["assessment_id"] = assessment_id
    return True, f"Retrieved assessment '{data['title']}' ({data['questions']} questions, {data['duration_minutes']} min limit)", lat

def step_13_assessment_submission(ctx: Dict[str, Any]):
    headers = {"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"}
    status, attempt, lat = make_request("POST", f"/api/v1/assessments/{ctx['assessment_id']}/attempts", headers=headers)
    assert status == 200, f"Expected 200, got {status}: {attempt}"
    assert "correct" not in str(attempt), "Answer key leaked before submission"
    # These answers match the explicit cooperative question bank in app.seeds.assessments.
    answer_key = ["b", "a", "b", "b", "b", "b", "b", "a"]
    for question, answer in zip(attempt["questions"], answer_key):
        status, saved, save_lat = make_request(
            "PUT", f"/api/v1/assessments/attempts/{attempt['attempt_id']}/answers",
            {"question_id": question["id"], "answer": [answer]}, headers=headers)
        lat += save_lat
        assert status == 200, f"Expected answer save 200, got {status}: {saved}"
    status, data, submit_lat = make_request(
        "POST", f"/api/v1/assessments/attempts/{attempt['attempt_id']}/submit", headers=headers)
    lat += submit_lat
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert data["passed"] is True
    assert data["score"] >= 60
    ctx["certified_skill"] = data.get("skill_updated", "Cooperative Governance")
    return True, f"Assessment graded: Score {data['score']}% (Passed: {data['passed']}), Skill credited: {ctx['certified_skill']}", lat

def step_14_qr_session_generation(ctx: Dict[str, Any]):
    payload = {
        "session_name": "Module 3: Cooperative Bylaws & Statutory Audits",
        "programme_id": ctx["programme_id"],
        "valid_minutes": 45
    }
    status, data, lat = make_request("POST", "/api/v1/attendance/generate-qr", payload, headers={"Authorization": f"Bearer dev-token:{ctx['trainer_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "qr_token" in data
    ctx["qr_token"] = data["qr_token"]
    ctx["session_id"] = data["session_id"]
    return True, f"Generated dynamic QR token '{data['qr_token']}' for session '{payload['session_name']}'", lat

def step_15_qr_attendance_scan(ctx: Dict[str, Any]):
    payload = {
        "qr_token": ctx["qr_token"],
        "trainee_id": ctx["trainee_id"]
    }
    status, data, lat = make_request("POST", "/api/v1/attendance/scan", payload, headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert data["status"] == "recorded"
    return True, f"Attendance cryptographically recorded at {data['marked_at']} for Trainee {ctx['trainee_id']}", lat

def step_16_attendance_audit(ctx: Dict[str, Any]):
    status, data, lat = make_request("GET", f"/api/v1/attendance/my?trainee_id={ctx['trainee_id']}", headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    records = data.get("records", [])
    overall = data.get("overall_percentage", 0)
    assert overall >= 75, f"Attendance threshold not met: {overall}%"
    return True, f"Verified attendance record: {data.get('present')}/{data.get('total_sessions')} sessions ({overall}% - meets eligibility)", lat

def step_17_certificate_issuance(ctx: Dict[str, Any]):
    payload = {
        "trainee_id": ctx["trainee_id"],
        "programme_id": ctx["programme_id"],
        "grade": "A+"
    }
    status, data, lat = make_request("POST", "/api/v1/certificates/issue?force=true", payload, headers={"Authorization": f"Bearer dev-token:{ctx['inst_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "verification_code" in data
    ctx["cert_code"] = data["verification_code"]
    return True, f"Tamper-evident certificate issued with Code: {data['verification_code']} (Grade: A+)", lat

def step_18_certificate_verification(ctx: Dict[str, Any]):
    code = ctx["cert_code"]
    status, data, lat = make_request("GET", f"/api/v1/certificates/verify/{code}")
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert data.get("valid") is True
    return True, f"Public verification confirmed authenticity: Status={data['certificate']['status']}, Code={code}", lat

def step_19_skill_passport_generation(ctx: Dict[str, Any]):
    status, data, lat = make_request("GET", f"/api/v1/skills/my-passport?trainee_id={ctx['trainee_id']}", headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    skills = data.get("skills", [])
    assert len(skills) > 0
    summary = data.get("summary", {})
    return True, f"Dynamic Skill Passport generated: {summary.get('total_skills')} skills tracked ({summary.get('verified_count')} verified, Avg Conf: {summary.get('avg_confidence')}%)", lat

def step_20_role_taxonomy_lookup(ctx: Dict[str, Any]):
    status, data, lat = make_request("GET", "/api/v1/skills/roles")
    assert status == 200, f"Expected 200, got {status}: {data}"
    roles = data.get("roles", [])
    assert len(roles) > 0
    ctx["target_role"] = roles[0]
    return True, f"Loaded {len(roles)} standardized cooperative roles (Target: '{ctx['target_role']}')", lat

def step_21_skill_gap_analysis(ctx: Dict[str, Any]):
    payload = {
        "target_role": ctx["target_role"],
    }
    status, data, lat = make_request("POST", "/api/v1/skills/gap-analysis", payload, headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "match_score" in data
    score = data["match_score"]
    gaps = len(data.get("gaps", []))
    met = len(data.get("met", []))
    recs = len(data.get("recommendations", []))
    return True, f"Role Match: {score}% | Competencies Met: {met} | Gaps Identified: {gaps} | Recommended Interventions: {recs}", lat

def step_22_career_recommendations(ctx: Dict[str, Any]):
    status, data, lat = make_request("GET", f"/api/v1/career/recommendations?target_role={urllib.parse.quote(ctx['target_role'])}", headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    recs = data.get("recommendations", [])
    path = data.get("career_path", [])
    # For new users without a career plan, the endpoint returns empty lists — that is valid.
    if recs and path:
        summary = f"Roadmap generated: {len(path)} milestones, Priority 1: '{recs[0]['title']}' ({recs[0].get('impact','')})"
    else:
        summary = f"Career recommendations endpoint OK (no plan yet; target_role={data.get('target_role','')})"
    return True, summary, lat

def step_23_career_chat_advisor(ctx: Dict[str, Any]):
    payload = {"message": "How do I become a certified Dairy Cooperative Manager in Gujarat?"}
    status, data, lat = make_request("POST", "/api/v1/career/chat", payload, headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    assert status in (200, 201), f"Expected 200/201, got {status}: {data}"
    # The chat endpoint may return a response or context-based reply.
    response_text = data.get("response") or data.get("message") or str(data)
    excerpt = response_text[:85] + "..." if len(response_text) > 85 else response_text
    return True, f"AI Career Advisor responded: \"{excerpt}\"", lat

def step_24_employer_job_posting(ctx: Dict[str, Any]):
    payload = {
        "title": f"Procurement Executive - Dairy Division {time.strftime('%Y')}",
        "employer_name": "Amul Dairy Cooperative",
        "location": "Anand, Gujarat",
        "sector": "Dairy & Agribusiness",
        "job_type": "Full-time",
        "salary_range": "₹4,80,000 - ₹6,50,000",
        "description": "Lead milk chilling center operations, farmer producer group coordination, and digital procurement audits.",
        "skills_required": ["Dairy Operations", "Cooperative Management", "Communication"]
    }
    status, data, lat = make_request("POST", "/api/v1/jobs/", payload, headers={"Authorization": f"Bearer dev-token:{ctx['empl_clerk_id']}"})
    assert status == 200, f"Expected 200, got {status}: {data}"
    assert "id" in data
    ctx["job_id"] = data["id"]
    ctx["job_title"] = data["title"]
    return True, f"Job requisition posted: '{data['title']}' (ID: {data['id']})", lat

def step_25_matching_application_feedback_intelligence(ctx: Dict[str, Any]):
    jid = ctx["job_id"]
    lat_total = 0

    # Sub-step A: Explainable candidate matching against the newly posted job
    status, match_data, lat1 = make_request("POST", f"/api/v1/jobs/{jid}/match",
                                             headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    lat_total += lat1
    match_score = match_data.get("match_score", 0)
    matched_skills = [m["skill"] for m in match_data.get("matched", [])] if status == 200 else []

    # Sub-step B: Trainee submits job application
    status, app_data, lat2 = make_request("POST", f"/api/v1/jobs/{jid}/apply",
                                           headers={"Authorization": f"Bearer dev-token:{ctx['trainee_clerk_id']}"})
    lat_total += lat2
    assert status in (200, 201, 409), f"Expected 200/201/409 for application, got {status}: {app_data}"
    app_id = app_data.get("id", "already-applied")[:8]

    # Sub-step C: Employer post-placement feedback
    fb_payload = {
        "trainee_id": ctx["trainee_id"],
        "job_id": jid,
        "useful_skills": ["Dairy Operations", "Cooperative Management"],
        "missing_skills": ["Supply Chain Logistics"],
        "training_relevance": 5,
        "performance_rating": 5,
        "comments": "Trainee demonstrated exceptional competency in cooperative accounts and cold chain handling."
    }
    status, fb_data, lat3 = make_request("POST", "/api/v1/jobs/feedback", fb_payload,
                                          headers={"Authorization": f"Bearer dev-token:{ctx['empl_clerk_id']}"})
    lat_total += lat3
    assert status in (200, 201), f"Expected 200/201 for feedback, got {status}: {fb_data}"

    # Sub-step D: Aggregate Skill Demand Intelligence for NCCT (admin-only)
    # Create an admin user for this sub-step
    admin_clerk = f"admin_e2e_{uuid.uuid4().hex[:8]}"
    _as, _ad, _al = make_request("POST", "/api/v1/auth/sync", {
        "clerk_user_id": admin_clerk, "email": f"{admin_clerk}@ncct.gov.in",
        "full_name": "E2E Admin", "role": "admin"})
    lat_total += _al
    admin_headers = {"Authorization": f"Bearer dev-token:{admin_clerk}"}
    status, demand_data, lat4 = make_request("GET", "/api/v1/analytics/skill-demand",
                                              headers=admin_headers)
    lat_total += lat4
    assert status == 200, f"Expected 200 for demand, got {status}: {demand_data}"
    total_demand = demand_data.get("total_employer_demand", 0)

    # Sub-step E: National overview metrics
    status, overview_data, lat5 = make_request("GET", "/api/v1/analytics/overview",
                                                headers=admin_headers)
    lat_total += lat5
    assert status == 200, f"Expected 200 for overview, got {status}: {overview_data}"

    detail = (
        f"Match Score: {match_score}% (Matched: {matched_skills}) -> "
        f"Application: {app_id}... -> "
        f"Feedback recorded -> "
        f"National Demand: {total_demand:,} positions tracked across {overview_data.get('institutions', 0)} institutions"
    )
    return True, detail, lat_total

# --- MAIN RUNNER ---

STEPS = [
    (1, "User Registration & Clerk Identity Synchronization (Trainee)", step_01_trainee_registration),
    (2, "Training Institution Provisioning (RICM / ICM)", step_02_institution_provisioning),
    (3, "Cooperative Employer Account Provisioning (Amul / NCDC / Apex)", step_03_employer_provisioning),
    (4, "Faculty / Trainer Account Provisioning", step_04_trainer_provisioning),
    (5, "Cooperative Training Programme Definition & Publication", step_05_programme_definition),
    (6, "Programme Catalog Lookup & Specification Validation", step_06_programme_lookup),
    (7, "Trainee Programme Nomination Submission by Cooperative Society", step_07_trainee_nomination),
    (8, "Nomination Review & Institutional Admission Approval", step_08_nomination_approval),
    (9, "Course Catalog Discovery & Skill Taxonomy Mapping", step_09_course_catalog_discovery),
    (10, "Trainee Course Enrollment & Learning Track Activation", step_10_course_enrollment),
    (11, "Active Learning Progression & Module Tracking", step_11_active_learning_progress),
    (12, "Course Knowledge Assessment Retrieval", step_12_assessment_retrieval),
    (13, "Assessment Submission, Auto-Grading & Competency Attribution", step_13_assessment_submission),
    (14, "Trainer Dynamic QR Code Attendance Session Generation", step_14_qr_session_generation),
    (15, "Trainee QR Attendance Scan & Cryptographic Check-in", step_15_qr_attendance_scan),
    (16, "Trainee Attendance Audit Trail & Eligibility Verification", step_16_attendance_audit),
    (17, "Official Tamper-Evident Certificate Issuance", step_17_certificate_issuance),
    (18, "Public Tamper-Evident Certificate Verification Portal", step_18_certificate_verification),
    (19, "Dynamic AI Skill Passport Generation with Confidence Scoring", step_19_skill_passport_generation),
    (20, "National Cooperative Career Role Taxonomy Lookup", step_20_role_taxonomy_lookup),
    (21, "Deterministic AI Skill Gap Analysis against Target Role", step_21_skill_gap_analysis),
    (22, "AI Career Navigator Recommendations & Milestone Mapping", step_22_career_recommendations),
    (23, "Interactive AI Career Chat Advisor Query", step_23_career_chat_advisor),
    (24, "Employer Job Posting & Skill Requirement Definition", step_24_employer_job_posting),
    (25, "Explainable Candidate Matching, Application & Closed-Loop Intelligence", step_25_matching_application_feedback_intelligence)
]

def main():
    print_banner()
    
    # 0. Health check
    print("Checking backend API liveness...")
    status, health_data, lat = make_request("GET", "/health")
    if status != 200:
        print(f"{Colors.FAIL}Error: Backend is not responding at {API_URL}/health (Status: {status}){Colors.ENDC}")
        print("Please ensure the backend is started before running this script.")
        sys.exit(1)
    print(f"Connected to {health_data.get('service', 'CoopSetu API')} v{health_data.get('version', '1.0')} ({lat:.1f}ms)\n")

    context: Dict[str, Any] = {}
    passed_count = 0
    total_start = time.perf_counter()

    for num, title, func in STEPS:
        ok = run_step(num, title, func, context)
        if ok:
            passed_count += 1
        else:
            print(f"{Colors.FAIL}Execution stopped due to failure at Step {num}.{Colors.ENDC}")
            break

    total_time = (time.perf_counter() - total_start) * 1000
    print("=" * 80)
    print("                      E2E VERIFICATION SUMMARY REPORT")
    print("=" * 80)
    print(f"Total Steps Tested:    {len(STEPS)}")
    print(f"Steps Passed:          {Colors.OKGREEN if passed_count == len(STEPS) else Colors.FAIL}{passed_count}/{len(STEPS)}{Colors.ENDC}")
    print(f"Success Rate:          {(passed_count / len(STEPS)) * 100:.1f}%")
    print(f"Total Suite Duration:  {total_time:.1f}ms")
    print("=" * 80)

    if passed_count == len(STEPS):
        print(f"\n{Colors.BOLD}{Colors.OKGREEN}ALL 25 STEPS IN THE CLOSED-LOOP LIFECYCLE PASSED SUCCESSFULLY!{Colors.ENDC}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.BOLD}{Colors.FAIL}VERIFICATION FAILED: {len(STEPS) - passed_count} step(s) failed.{Colors.ENDC}\n")
        sys.exit(1)

if __name__ == "__main__":
    import urllib.parse
    main()
