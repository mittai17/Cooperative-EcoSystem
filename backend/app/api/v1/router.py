from fastapi import APIRouter
from app.api.v1 import auth, users, programmes, courses, assessments, attendance, certificates, skills, jobs, analytics, career, offline_sync, timetable, hostel, logistics

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
api_router.include_router(offline_sync.router, prefix="/offline-sync", tags=["Offline Sync"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
api_router.include_router(hostel.router, prefix="/hostel", tags=["Hostel"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["Logistics"])
