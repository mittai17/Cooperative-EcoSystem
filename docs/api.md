# CoopSetu AI — REST API & OpenAPI Specification

> **Smart India Hackathon 2026 | PS 26087**  
> *Base URL: `http://localhost:8000` (Local) | API Prefix: `/api/v1`*  
> Document Version: 1.0.0

---

## 1. Authentication & Headers

CoopSetu AI integrates with Clerk for identity verification and organization management.

### Headers
| Header | Type | Description |
|---|---|---|
| `Authorization` | `Bearer <JWT>` | Signed Clerk session JWT token (RS256 verified) |
| `Content-Type` | `application/json` | Required for all `POST`, `PATCH`, and `PUT` requests |
| `X-Internal-Secret` | `string` | Webhook verification secret between Next.js and FastAPI |

---

## 2. API Endpoints by Domain

### 2.1 System Health
```http
GET /health
```
Checks API service health and database connectivity.
- **Response (200 OK)**:
```json
{
  "status": "ok",
  "service": "CoopSetu AI API",
  "version": "1.0.0"
}
```

---

### 2.2 Authentication & User Synchronization

#### `POST /api/v1/auth/sync`
Upserts a user synchronized from Clerk into the local relational database.
- **Request Body**:
```json
{
  "clerk_user_id": "user_2test123456",
  "email": "ravindra.patil@coopsetu.gov.in",
  "full_name": "Ravindra Suresh Patil",
  "role": "trainee"
}
```
- **Response (200 OK)**:
```json
{
  "id": "8fd67121-3c5e-4127-8d48-103efbde3d67",
  "email": "ravindra.patil@coopsetu.gov.in",
  "role": "trainee",
  "created": true
}
```

---

### 2.3 Training Programmes & Nominations

#### `GET /api/v1/programmes/`
Lists all active cooperative training programmes with pagination.
- **Query Parameters**: `skip` (default 0), `limit` (default 20)
- **Response (200 OK)**:
```json
[
  {
    "id": "a86fce59-a457-44b3-8e05-57d527957780",
    "title": "Dairy Cooperative Operations",
    "sector": "Dairy",
    "level": "Intermediate",
    "mode": "In-person",
    "duration_weeks": 12,
    "seats_total": 40,
    "seats_filled": 38
  }
]
```

#### `POST /api/v1/programmes/`
Publishes a new training programme.
- **Request Body**:
```json
{
  "title": "Credit Appraisal & Cooperative Risk Management",
  "sector": "Banking & Credit",
  "level": "Intermediate",
  "mode": "Blended",
  "duration_weeks": 6,
  "seats_total": 35,
  "description": "Risk mitigation, loan scrutiny, and NPA recovery strategies for DCCBs and PACS."
}
```
- **Response (200 OK)**:
```json
{
  "id": "d9812903-51bf-45ba-8b83-a99120e98f01",
  "title": "Credit Appraisal & Cooperative Risk Management",
  "status": "created"
}
```

#### `POST /api/v1/programmes/nominations`
Submits a sponsorship nomination for a candidate.
- **Request Body**:
```json
{
  "programme_id": "d9812903-51bf-45ba-8b83-a99120e98f01",
  "trainee_id": "8fd67121-3c5e-4127-8d48-103efbde3d67"
}
```
- **Response (200 OK)**:
```json
{
  "id": "5fdb39ad-44b7-4431-a353-ce9622fa60cc",
  "status": "pending",
  "message": "Nomination submitted"
}
```

#### `PATCH /api/v1/programmes/nominations/{nomination_id}`
Updates nomination review status (`approved` or `rejected`).
- **Query Parameters**: `status=approved`
- **Response (200 OK)**:
```json
{
  "id": "5fdb39ad-44b7-4431-a353-ce9622fa60cc",
  "status": "approved"
}
```

---

### 2.4 Courses & LMS

#### `GET /api/v1/courses/`
Retrieves accredited learning course modules with skill tags.
- **Response (200 OK)**:
```json
{
  "courses": [
    {
      "id": "crs-coop-mgmt",
      "title": "Cooperative Management Fundamentals",
      "category": "Management",
      "level": "Foundation",
      "duration_hours": 40,
      "instructor": "Dr. Ramesh Kulkarni",
      "rating": 4.8,
      "enrolled": 1240,
      "skills": ["Cooperative Management", "Cooperative Governance"]
    }
  ],
  "total": 4
}
```

#### `POST /api/v1/courses/{course_id}/enroll`
Enrolls the logged-in trainee into a course.
- **Response (200 OK)**:
```json
{
  "status": "enrolled",
  "course_id": "crs-coop-mgmt"
}
```

#### `GET /api/v1/courses/my/enrolled`
Returns the logged-in learner's course progression.
- **Response (200 OK)**:
```json
{
  "courses": [
    {
      "id": "crs-coop-mgmt",
      "title": "Cooperative Management Fundamentals",
      "progress": 78,
      "last_accessed": "2026-09-26"
    }
  ]
}
```

---

### 2.5 Dynamic QR Code Attendance

#### `POST /api/v1/attendance/generate-qr`
Generates a rotating, time-bound attendance QR token for classroom or lab sessions.
- **Request Body**:
```json
{
  "session_name": "Cooperative Accounts & Statutory Audit - Lab 2",
  "programme_id": "d9812903-51bf-45ba-8b83-a99120e98f01",
  "valid_minutes": 30
}
```
- **Response (200 OK)**:
```json
{
  "qr_token": "FP3TJNS4wv3uPW7kh-BgKA",
  "session_id": "a3163169-0a84-4b9b-9e63-6d86e5adea08",
  "valid_minutes": 30,
  "qr_data": "coopsetu:attend:FP3TJNS4wv3uPW7kh-BgKA"
}
```

#### `POST /api/v1/attendance/scan`
Validates and records attendance cryptographically.
- **Request Body**:
```json
{
  "qr_token": "FP3TJNS4wv3uPW7kh-BgKA",
  "trainee_id": "8fd67121-3c5e-4127-8d48-103efbde3d67"
}
```
- **Response (200 OK)**:
```json
{
  "status": "recorded",
  "session": "Cooperative Accounts & Statutory Audit - Lab 2",
  "trainee_id": "8fd67121-3c5e-4127-8d48-103efbde3d67",
  "marked_at": "2026-09-27 12:16:17.488179+00:00"
}
```

---

### 2.6 Tamper-Evident Certificates

#### `POST /api/v1/certificates/issue`
Issues an accredited digital credential with a collision-resistant verification code.
- **Request Body**:
```json
{
  "trainee_id": "8fd67121-3c5e-4127-8d48-103efbde3d67",
  "programme_id": "d9812903-51bf-45ba-8b83-a99120e98f01",
  "grade": "A+"
}
```
- **Response (200 OK)**:
```json
{
  "verification_code": "CST-2026-S3QXQD8K",
  "status": "issued",
  "id": "70c84100-6a8f-4039-a6f0-21a58f94167f"
}
```

#### `GET /api/v1/certificates/verify/{verification_code}` *(Public)*
Instant verification endpoint for employers and verifiers.
- **Response (200 OK)**:
```json
{
  "valid": true,
  "certificate": {
    "id": "70c84100-6a8f-4039-a6f0-21a58f94167f",
    "verification_code": "CST-2026-S3QXQD8K",
    "status": "valid",
    "issue_date": "2026-09-27 12:15:17.813941"
  }
}
```

---

### 2.7 AI Skills, Gap Analysis & Career Intelligence

#### `GET /api/v1/skills/my-passport`
Returns the learner's multi-source verified Skill Passport.
- **Response (200 OK)**:
```json
{
  "skills": [
    {
      "name": "Cooperative Management",
      "level": "Proficient",
      "confidence": 92,
      "verified": true,
      "category": "Management",
      "evidence": [
        {
          "type": "Course",
          "title": "Cooperative Management Fundamentals",
          "date": "2026-08-15"
        }
      ]
    }
  ],
  "summary": {
    "total_skills": 5,
    "verified_count": 3,
    "avg_confidence": 72
  }
}
```

#### `POST /api/v1/skills/gap-analysis`
Computes deterministic skill gaps against a standardized cooperative role.
- **Request Body**:
```json
{
  "target_role": "Cooperative Development Officer",
  "trainee_skills": [
    {"skill": "Cooperative Management", "level": "Proficient", "confidence": 92},
    {"skill": "Communication", "level": "Proficient", "confidence": 85}
  ]
}
```
- **Response (200 OK)**:
```json
{
  "target_role": "Cooperative Development Officer",
  "match_score": 64,
  "met": [
    {"skill": "Cooperative Management", "current_level": "Proficient", "status": "met", "match_pct": 100}
  ],
  "gaps": [
    {"skill": "Data Analysis", "required_level": "Intermediate", "current_level": null, "status": "missing", "match_pct": 0}
  ],
  "total_requirements": 4,
  "recommendations": [
    {
      "title": "Data Analytics for Cooperatives",
      "duration": "6 weeks",
      "fills_gap": "Data Analysis"
    }
  ]
}
```

#### `POST /api/v1/career/chat`
Conversational career advisor answering pathway and certification inquiries.
- **Request Body**: `{"message": "What roles can I apply for with Dairy Operations?"}`
- **Response (200 OK)**:
```json
{
  "response": "Based on your Dairy Operations certification and 92% confidence score, you match well for Dairy Procurement Supervisor roles...",
  "sources": ["skill_passport", "job_market_data", "ncct_programmes"],
  "suggested_actions": [
    {"label": "View Skill Gap", "href": "/skill-gap"},
    {"label": "Browse Courses", "href": "/courses"}
  ]
}
```

---

### 2.8 Jobs & Closed-Loop Employer Feedback

#### `POST /api/v1/jobs/`
Creates a job requisition with required competencies.
- **Request Body**:
```json
{
  "title": "Dairy Procurement Executive",
  "employer_name": "Amul Dairy Cooperative",
  "location": "Anand, Gujarat",
  "sector": "Dairy",
  "job_type": "Full-time",
  "salary_range": "₹4,50,000 - ₹6,00,000",
  "skills_required": ["Dairy Operations", "Communication", "Cooperative Management"]
}
```
- **Response (200 OK)**:
```json
{
  "id": "bf39a16b-d13c-4100-859b-6e4445f0f74f",
  "title": "Dairy Procurement Executive",
  "status": "created"
}
```

#### `POST /api/v1/jobs/{job_id}/match`
Evaluates a candidate against job requirements with explainable transparency.
- **Response (200 OK)**:
```json
{
  "match_score": 66,
  "matched": [
    {"skill": "Dairy Operations", "status": "matched", "confidence": 92}
  ],
  "missing": [
    {"skill": "Communication", "status": "gap", "required": "Intermediate", "current": "Foundational"}
  ],
  "explanation": "2 of 3 required skills matched."
}
```

#### `POST /api/v1/jobs/feedback`
Submits post-hire performance and competency evaluation.
- **Request Body**:
```json
{
  "trainee_id": "8fd67121-3c5e-4127-8d48-103efbde3d67",
  "job_id": "bf39a16b-d13c-4100-859b-6e4445f0f74f",
  "useful_skills": ["Dairy Operations", "Cooperative Management"],
  "missing_skills": ["Cold Chain Logistics"],
  "training_relevance": 5,
  "performance_rating": 4,
  "comments": "Strong grasp of milk testing and farmer cooperative accounting."
}
```
- **Response (200 OK)**:
```json
{
  "id": "5468ede3-4335-4d1e-ab48-554d4be24915",
  "status": "submitted",
  "message": "Feedback recorded. Skill demand intelligence updated."
}
```

---

### 2.9 NCCT Macro Demand Intelligence

#### `GET /api/v1/analytics/skill-demand`
- **Response (200 OK)**:
```json
{
  "skill_demand": [
    {"skill": "Digital Marketing", "demand": 1240, "supply": 640, "gap": 600, "trend": "rising"},
    {"skill": "Credit Appraisal", "demand": 870, "supply": 320, "gap": 550, "trend": "rising"},
    {"skill": "Data Analysis", "demand": 740, "supply": 280, "gap": 460, "trend": "rising"}
  ],
  "total_employer_demand": 24800,
  "total_trained": 18650,
  "emerging_skills": ["AgriTech Operations", "ESG Reporting", "Digital Credit Assessment"]
}
```
