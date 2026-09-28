import os

base = "/home/mittai/Documents/Cooperative-EcoSystem/backend/app"

files = {
    f"{base}/__init__.py": "",
    f"{base}/models/__init__.py": "",
    f"{base}/schemas/__init__.py": "",
    f"{base}/api/__init__.py": "",
    f"{base}/api/v1/__init__.py": "",
    f"{base}/services/__init__.py": "",
    f"{base}/config.py": '''from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    clerk_secret_key: str
    clerk_jwt_issuer: str = "https://adapted-squirrel-3042.clerk.accounts.dev"
    app_env: str = "development"
    log_level: str = "info"
    allowed_origins: str = "http://localhost:3000"
    
    @property
    def origins_list(self):
        return [o.strip() for o in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
''',
    f"{base}/database.py": '''from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from app.config import get_settings

settings = get_settings()

# async engine for server
async_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(async_url, poolclass=NullPool, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# sync engine for alembic
sync_engine = create_engine(settings.database_url, poolclass=NullPool)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
''',
    f"{base}/deps.py": '''from fastapi import HTTPException, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.config import get_settings
import httpx
from jose import jwt

async def get_current_user_clerk_id(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    settings = get_settings()
    try:
        unverified = jwt.get_unverified_header(token)
        jwks_url = f"{settings.clerk_jwt_issuer}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            jwks_resp = await client.get(jwks_url)
            jwks = jwks_resp.json()
        payload = jwt.decode(token, jwks, algorithms=["RS256"], options={"verify_aud": False})
        return payload.get("sub")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
''',
    f"{base}/models/user.py": '''from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base

class Organisation(Base):
    __tablename__ = "organisations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    state = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="trainee")
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
''',
    f"{base}/models/programme.py": '''from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base

class Programme(Base):
    __tablename__ = "programmes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    sector = Column(String(100))
    level = Column(String(50))
    mode = Column(String(50))
    duration_weeks = Column(Integer)
    seats_total = Column(Integer, default=0)
    seats_filled = Column(Integer, default=0)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"))
    start_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Nomination(Base):
    __tablename__ = "nominations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"))
    status = Column(String(50), default="pending")
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

class Batch(Base):
    __tablename__ = "batches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"))
    name = Column(String(100))
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True), nullable=True)
    capacity = Column(Integer, default=30)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"))
    enrolled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="active")
''',
    f"{base}/models/course.py": '''from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
class Course(Base):
    __tablename__ = "courses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255))
class Module(Base):
    __tablename__ = "modules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"))
class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"))
''',
    f"{base}/models/assessment.py": '''from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
class AssessmentResult(Base):
    __tablename__ = "assessment_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"))
''',
    f"{base}/models/attendance.py": '''from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base
class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    qr_token = Column(String(255))
class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id"))
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
''',
    f"{base}/models/certificate.py": '''from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"))
    verification_code = Column(String(255), unique=True)
    issue_date = Column(DateTime)
    status = Column(String(50))
    grade = Column(String(50))
''',
    f"{base}/models/skill.py": '''from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
class Skill(Base):
    __tablename__ = "skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255))
class TraineeSkill(Base):
    __tablename__ = "trainee_skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"))
    level = Column(String(50))
class SkillGap(Base):
    __tablename__ = "skill_gaps"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
''',
    f"{base}/models/job.py": '''from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base
class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255))
class JobMatch(Base):
    __tablename__ = "job_matches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
class Application(Base):
    __tablename__ = "applications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
class EmployerFeedback(Base):
    __tablename__ = "employer_feedbacks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
''',
    f"{base}/models/analytics.py": '''from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base
class SkillDemand(Base):
    __tablename__ = "skill_demand"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_name = Column(String(255))
    employer_demand_count = Column(Integer)
    trained_count = Column(Integer)
    gap_count = Column(Integer)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
''',
    f"{base}/services/clerk.py": '''import httpx
from app.config import get_settings

async def verify_clerk_token(token: str) -> dict:
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.clerk.com/v1/tokens/{token}",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"}
        )
        if response.status_code == 200:
            return response.json()
        raise ValueError("Invalid token")

async def get_clerk_user(user_id: str) -> dict:
    settings = get_settings()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"}
        )
        return response.json()
''',
    f"{base}/services/skill_engine.py": '''from typing import List, Dict

ROLE_REQUIREMENTS = {
    "Cooperative Development Officer": [
        {"skill": "Cooperative Management", "required_level": "Proficient", "weight": 1.0},
        {"skill": "Communication", "required_level": "Intermediate", "weight": 0.8},
        {"skill": "Rural Development", "required_level": "Intermediate", "weight": 0.9},
        {"skill": "Data Analysis", "required_level": "Intermediate", "weight": 0.7},
    ],
    "Dairy Cooperative Manager": [
        {"skill": "Dairy Operations", "required_level": "Advanced", "weight": 1.0},
        {"skill": "Financial Management", "required_level": "Intermediate", "weight": 0.9},
        {"skill": "Leadership", "required_level": "Intermediate", "weight": 0.8},
    ]
}

LEVEL_SCORES = {"Foundational": 1, "Intermediate": 2, "Proficient": 3, "Expert": 4}

def calculate_skill_gap(trainee_skills: List[Dict], target_role: str) -> Dict:
    requirements = ROLE_REQUIREMENTS.get(target_role, [])
    if not requirements:
        return {"error": "Role not found", "match_score": 0, "gaps": [], "met": []}
    
    skill_map = {s["skill"]: s for s in trainee_skills}
    gaps = []
    met = []
    total_weight = sum(r["weight"] for r in requirements)
    weighted_score = 0
    
    for req in requirements:
        skill_name = req["skill"]
        required_score = LEVEL_SCORES.get(req["required_level"], 2)
        trainee_entry = skill_map.get(skill_name)
        
        if not trainee_entry:
            gaps.append({**req, "current_level": None, "status": "missing", "match_pct": 0})
        else:
            current_score = LEVEL_SCORES.get(trainee_entry.get("level", "Foundational"), 1)
            match_pct = min(100, int((current_score / required_score) * 100))
            weighted_score += (match_pct / 100) * req["weight"]
            if current_score >= required_score:
                met.append({**req, "current_level": trainee_entry["level"], "status": "met", "match_pct": 100})
            else:
                gaps.append({**req, "current_level": trainee_entry["level"], "status": "gap", "match_pct": match_pct})
        
    overall_match = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    return {"target_role": target_role, "match_score": overall_match, "met": met, "gaps": gaps, "total_requirements": len(requirements)}
''',
    f"{base}/services/job_matching.py": '''from typing import List, Dict
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
''',
    f"{base}/services/certificate_service.py": '''import uuid
def generate_verification_code():
    return str(uuid.uuid4()).split('-')[0].upper()
''',
    f"{base}/api/v1/router.py": '''from fastapi import APIRouter
from app.api.v1 import auth, users, programmes, courses, assessments, attendance, certificates, skills, jobs, analytics, career

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(programmes.router, prefix="/programmes", tags=["Programmes"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(career.router, prefix="/career", tags=["Career"])
''',
    f"{base}/main.py": '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.config import get_settings

app = FastAPI(
    title="CoopSetu AI API",
    description="AI-powered cooperative training to employment platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "CoopSetu AI API", "version": "1.0.0"}
'''
}

# Create routers
routers = ["auth", "users", "programmes", "courses", "assessments", "attendance", "certificates", "skills", "jobs", "analytics", "career"]
for r in routers:
    if r == "auth":
        content = '''from fastapi import APIRouter\nrouter = APIRouter()\n@router.post("/sync")\nasync def sync(): return {}\n@router.get("/me")\nasync def me(): return {}'''
    elif r == "certificates":
        content = '''from fastapi import APIRouter\nrouter = APIRouter()\n@router.post("/issue")\nasync def issue(): return {}\n@router.get("/{verification_code}/verify")\nasync def verify(): return {}\n@router.get("/my")\nasync def my(): return {}'''
    elif r == "skills":
        content = '''from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/my-passport")\nasync def my_passport(): return {}\n@router.post("/gap-analysis")\nasync def gap_analysis(): return {}\n@router.get("/roles")\nasync def roles(): return []'''
    elif r == "jobs":
        content = '''from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/")\nasync def list_jobs(): return []\n@router.post("/{id}/match")\nasync def match(): return {}\n@router.post("/{id}/apply")\nasync def apply(): return {}'''
    elif r == "attendance":
        content = '''from fastapi import APIRouter\nrouter = APIRouter()\n@router.post("/generate-qr")\nasync def generate_qr(): return {}\n@router.post("/scan")\nasync def scan(): return {}\n@router.get("/my")\nasync def my(): return {}'''
    elif r == "career":
        content = '''from fastapi import APIRouter\nrouter = APIRouter()\n@router.post("/chat")\nasync def chat(): return {}\n@router.get("/recommendations")\nasync def recommendations(): return []'''
    elif r == "analytics":
        content = '''from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/skill-demand")\nasync def skill_demand(): return {}\n@router.get("/employment-funnel")\nasync def funnel(): return {}\n@router.get("/institution/{org_id}")\nasync def inst(): return {}'''
    else:
        content = f'''from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/")\nasync def get_all(): return []'''
    files[f"{base}/api/v1/{r}.py"] = content

# Write files
for path, content in files.items():
    with open(path, "w") as f:
        f.write(content)
print("Files created.")
