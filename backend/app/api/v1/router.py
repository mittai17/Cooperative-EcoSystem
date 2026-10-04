from fastapi import APIRouter
from app.api.v1 import (
    analytics,
    assessments,
    attendance,
    auth,
    career,
    certificates,
    courses,
    employer,
    employer_jobs,
    employer_workflow,
    face,
    hostel,
    jobs,
    logistics,
    mobile,
    notifications,
    offline_sync,
    organisations,
    programmes,
    skills,
    system,
    timetable,
    users,
)
from app.api.v1 import employer_ai_interview

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(organisations.router, prefix="/organisations", tags=["Organisations"])
api_router.include_router(programmes.router, prefix="/programmes", tags=["Programmes"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(assessments.router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(face.router, prefix="/face", tags=["Face"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(employer.router, prefix="/employer", tags=["Employer"])
api_router.include_router(employer_jobs.router, prefix="/employer", tags=["Employer"])
api_router.include_router(employer_workflow.router, prefix="/employer", tags=["Employer"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(career.router, prefix="/career", tags=["Career"])
api_router.include_router(offline_sync.router, prefix="/offline-sync", tags=["Offline Sync"])
api_router.include_router(offline_sync.router, prefix="/offline_sync", tags=["Offline Sync"])
api_router.include_router(offline_sync.router, prefix="/sync", tags=["Offline Sync"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
api_router.include_router(hostel.router, prefix="/hostel", tags=["Hostel"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["Logistics"])
api_router.include_router(mobile.router, prefix="/mobile", tags=["Mobile"])
api_router.include_router(system.router, prefix="/system", tags=["System"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(employer_ai_interview.router, prefix="/employer/ai-interview", tags=["Employer"])
from app.api.v1 import admin_portal  # noqa: E402
api_router.include_router(admin_portal.router, prefix="/admin", tags=["Admin"])
from app.api.v1 import trainee_ai_interview  # noqa: E402
api_router.include_router(trainee_ai_interview.router, prefix="/trainee/ai-interview", tags=["Trainee"])
from app.api.v1 import diksha_content  # noqa: E402
api_router.include_router(diksha_content.router, prefix="/content/diksha", tags=["Content"])
from app.api.v1 import learning  # noqa: E402
api_router.include_router(learning.router, prefix="/learning", tags=["Learning"])
