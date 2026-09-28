# CoopSetu AI — System Architecture & Data Flow

> **Smart India Hackathon 2026 | PS 26087**  
> *AI & LMS Enabled Cooperative Ecosystem*  
> Document Version: 1.0.0 | Status: Production Design

---

## 1. Multi-Tier System Architecture

CoopSetu AI is engineered as an enterprise-grade, multi-tier distributed platform designed to operate seamlessly across high-bandwidth metropolitan institutes and rural cooperative training centers with intermittent internet connectivity.

```mermaid
graph TB
    subgraph "Tier 1: Client & User Experience"
        WEB["Next.js 16 Web Application<br/>(App Router, React 19, Tailwind CSS v4)"]
        MOBILE["Expo Mobile App<br/>(React Native for iOS & Android)"]
        KIOSK["Edge Kiosk Terminal<br/>(Offline-first Attendance & Check-in)"]
        PUBLIC["Public Verification Portal<br/>(Zero-auth Certificate Verification)"]
    end

    subgraph "Tier 2: Edge, Gateway & Security"
        EDGE["Edge Routing & SSL Termination"]
        CLERK["Clerk Identity Provider<br/>(OAuth, JWT, Session & Org Management)"]
        CORS["CORS & Request Throttling Middleware"]
    end

    subgraph "Tier 3: Backend API & Application Services"
        FASTAPI["FastAPI High-Performance Engine<br/>(Python 3.12+, Asyncpg, SQLAlchemy 2.0)"]
        
        subgraph "Application Core Modules"
            AUTH_MOD["Auth & Identity Sync Module"]
            LMS_MOD["LMS & Programme Module"]
            ATT_MOD["QR Attendance & Offline Sync"]
            CERT_MOD["Tamper-Evident Certificate Engine"]
            SKILL_MOD["AI Skill Passport & Graph Engine"]
            JOB_MOD["Explainable Job Matching Engine"]
            ANALYTICS_MOD["National Demand Intelligence Engine"]
        end
    end

    subgraph "Tier 4: AI & Vector Intelligence"
        PGVECTOR["pgvector Engine<br/>(Cosine & HNSW Embeddings)"]
        GEMINI["Google Gemini / LLM Gateway<br/>(Explainability & Career Advisory)"]
        MATH_ENGINE["Deterministic Skill Gap Math"]
    end

    subgraph "Tier 5: Persistence & Storage"
        NEON["Neon Serverless PostgreSQL<br/>(Branching: main & dev, ACID Compliant)"]
        CACHE["In-Memory & Edge Session Cache"]
    end

    %% Client to Edge
    WEB --> EDGE
    MOBILE --> EDGE
    KIOSK --> EDGE
    PUBLIC --> EDGE

    %% Edge to Services
    EDGE --> CLERK
    EDGE --> CORS
    CORS --> FASTAPI

    %% Backend Routing
    FASTAPI --> AUTH_MOD
    FASTAPI --> LMS_MOD
    FASTAPI --> ATT_MOD
    FASTAPI --> CERT_MOD
    FASTAPI --> SKILL_MOD
    FASTAPI --> JOB_MOD
    FASTAPI --> ANALYTICS_MOD

    %% Services to AI
    SKILL_MOD --> PGVECTOR
    SKILL_MOD --> MATH_ENGINE
    JOB_MOD --> PGVECTOR
    JOB_MOD --> GEMINI
    ANALYTICS_MOD --> MATH_ENGINE

    %% Backend to DB
    AUTH_MOD --> NEON
    LMS_MOD --> NEON
    ATT_MOD --> NEON
    CERT_MOD --> NEON
    SKILL_MOD --> NEON
    JOB_MOD --> NEON
    ANALYTICS_MOD --> NEON
```

---

## 2. The 25-Step Closed-Loop Lifecycle

The platform solves systemic labor and training mismatches in the Indian cooperative sector by closing the loop between education, certification, job placement, and post-placement feedback.

```mermaid
sequenceDiagram
    autonumber
    actor Trainee as Trainee / Candidate
    actor Institution as Training Institute (RICM/ICM)
    actor Trainer as Faculty / Trainer
    actor Employer as Cooperative Employer (Amul, PACS)
    participant System as CoopSetu Core API
    actor NCCT as NCCT Central HQ

    %% Phase 1: Onboarding & Programme Initiation
    Trainee->>System: 1. Register & Clerk Identity Sync
    Institution->>System: 2. Provision Training Institute Org
    Employer->>System: 3. Provision Employer Org
    Trainer->>System: 4. Provision Faculty Account
    Institution->>System: 5. Define & Publish Programme
    Trainee->>System: 6. Browse & Validate Programme Details
    Institution->>System: 7. Society Nominates Trainee
    Institution->>System: 8. Review & Approve Admission

    %% Phase 2: Learning & Attendance
    Trainee->>System: 9. Discover Course Catalog
    Trainee->>System: 10. Enroll in Course
    Trainee->>System: 11. Complete Modules & Track Progress
    Trainee->>System: 12. Fetch Course Assessment
    Trainee->>System: 13. Submit Assessment (Auto-Graded)
    Trainer->>System: 14. Generate Dynamic QR Code Session
    Trainee->>System: 15. Scan QR Code via Mobile / Kiosk
    Trainee->>System: 16. Verify 85%+ Attendance Audit Trail

    %% Phase 3: Credentialing & Skill Passport
    Institution->>System: 17. Issue Tamper-Evident Certificate
    Employer->>System: 18. Verify Certificate Authenticity via Public Code
    System->>Trainee: 19. Generate Dynamic AI Skill Passport

    %% Phase 4: Career Guidance & Job Matching
    Trainee->>System: 20. Lookup National Role Taxonomy
    Trainee->>System: 21. Compute Deterministic Skill Gap
    System->>Trainee: 22. Generate AI Career Recommendations
    Trainee->>System: 23. Query Interactive Career AI Chat

    %% Phase 5: Employment & Closed Loop Feedback
    Employer->>System: 24. Post Job with Competency Criteria
    System->>Employer: 25a. Compute Explainable Match (Matched vs Gaps)
    Trainee->>Employer: 25b. Submit Job Application
    Employer->>System: 25c. Record Post-Hire Skill Feedback
    System->>NCCT: 25d. Aggregate into National Skill Demand Intelligence
```

---

## 3. Data Flows Across Subsystems

### 3.1 Trainee Skill Acquisition & Credentialing Flow
1. **Nomination & Admission**: Primary Agricultural Credit Societies (PACS) or Dairy Cooperatives nominate members or staff for structured diploma/certificate programmes.
2. **Assessment & Evidence Logging**: When a learner completes quizzes, tests, or case study evaluations, each graded component generates an immutable evidence item (`SkillEvidence`) linking course ID, score, date, and verified competencies.
3. **Attendance Validation**: Dynamic QR tokens enforce physical classroom and practical lab presence. The system verifies attendance thresholds ($\ge 75\%$) before releasing the final evaluation.
4. **Certificate Generation**: Upon completion, the system generates a cryptographically signed serial identifier (format: `CST-YYYY-XXXXXXXX`) stored in `certificates`.

### 3.2 Explainable Job Matching Data Flow
1. **Job Requirement Extraction**: Employer posts positions with explicit skill requirements and expected proficiency levels (*Foundational, Intermediate, Proficient, Expert*).
2. **Deterministic Evaluation**: The AI engine compares the applicant's verified skill level against the required level:
   $$\text{Score}(s) = \min\left(1.0, \frac{\text{Candidate Level Value}}{\text{Job Required Level Value}}\right)$$
   $$\text{Overall Match} = \frac{\sum_{i=1}^N w_i \cdot \text{Score}(s_i)}{\sum_{i=1}^N w_i} \times 100$$
3. **Missing Competency Categorization**: Every skill is bucketed into *Matched*, *Gap* (competency present but below target level), or *Missing* (competency absent).
4. **Actionable Remediation**: For every gap, the recommendation engine maps remedial accredited modules from the national catalog.

### 3.3 Closed-Loop Employer Feedback & Curriculum Adaptation Flow
1. **Post-Placement Survey**: After 30–90 days on the job, the cooperative employer evaluates the placed trainee across useful skills, missing skills, and training relevance (1–5 scale).
2. **Aggregated Demand Updates**: Feedback records automatically increment the demand count and deficit count in `skill_demand`.
3. **NCCT Macro Dashboard**: NCCT directors can view real-time surplus and shortage trends nationwide, allowing data-backed allocation of training budgets and rapid updates to syllabi.

---

## 4. Low-Connectivity & Offline Kiosk Architecture

In remote regional cooperative training centers where broadband internet is unreliable:

1. **Local SQLite / IndexedDB Storage**: The edge kiosk runs a client-side local cache storing active student roll numbers and scheduled session tokens.
2. **Cryptographic QR Cards**: Trainees carry dynamic or static QR badges containing signed candidate tokens.
3. **Offline Ingestion Queue**: If the kiosk loses internet connectivity:
   - Trainee scans are validated locally and appended to an offline JSON append-only journal.
   - The UI indicates "Offline Mode — Stored Locally".
4. **Idempotent Background Synchronization**: When network connectivity is restored:
   - The kiosk background worker submits batches of stored check-ins to `/api/v1/attendance/scan`.
   - The backend checks for duplicate timestamps and records attendance idempotently without data loss.

---

## 5. Security & Verification Architecture

- **Tamper-Evident Certificates**: Each certificate is associated with an unforgeable alphanumeric hash generated via cryptographic entropy. The public endpoint `/api/v1/certificates/verify/{code}` does not require login, enabling instant verification on physical printed diplomas.
- **Clerk Identity & RBAC**: Requests are authenticated using RS256-signed JWTs verified against Clerk's JWKS endpoint. 
- **Tenancy Isolation**: Multi-tenant database schema ensures that institutions and employers only access candidate data according to permissible RBAC scopes.
