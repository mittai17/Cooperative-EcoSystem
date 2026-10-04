"""Import every model module so all tables are registered on `Base.metadata`
(used by Alembic autogenerate/`alembic check` and by test setup). Feature
agents add columns/tables through a new migration owned by the foundation
owner, not by editing these modules."""
from app.models.user import User, Organisation  # noqa: F401
from app.models.profile import UserProfile  # noqa: F401
from app.models.programme import Programme, Nomination, Batch, Enrollment, ProgrammeCourse  # noqa: F401
from app.models.course import Course, Module, Lesson, CourseEnrollment, ModuleProgress  # noqa: F401
from app.models.content import ContentTranslation, LessonProgress, MediaAsset, ExternalCourse  # noqa: F401
from app.models.assessment import Assessment, AssessmentResult, AssessmentQuestion, AssessmentAttempt  # noqa: F401
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceRecordDedupArchive  # noqa: F401
from app.models.face import FaceTemplate, FaceEvent  # noqa: F401
from app.models.certificate import Certificate, CertificateVerification  # noqa: F401
from app.models.skill import Skill, TraineeSkill, SkillGap  # noqa: F401
from app.models.job import Job, JobMatch, Application, EmployerFeedback  # noqa: F401
from app.models.analytics import SkillDemand  # noqa: F401
from app.models.timetable import TimetableSlot, TimetableException  # noqa: F401
from app.models.hostel import HostelBlock, HostelRoom, HostelWaitlistEntry, HostelRequest  # noqa: F401
from app.models.logistics import LogisticsTask, VehicleAllocation, LogisticsBudget  # noqa: F401
from app.models.mobile import (  # noqa: F401
    CareerPlan, CareerPlanStep, CareerRecommendation, CareerChatMessage, OfflinePackage, OfflineDownload,
)
from app.models.notification import Notification, PushToken  # noqa: F401
from app.models.infra import IntegrationUsage, AiCache, TtsAudio, SyncReceipt  # noqa: F401
from app.models.job_requirement import JobRequirement  # noqa: F401
from app.models.employer_workflow import (  # noqa: F401
    Interview, Offer, TalentPoolEntry, EmployerTeamMember, EmployerFeedbackRatings, EmployerOrgProfile,
    EmployerUserPreferences,
)
from app.models.job_detail import JobDetail  # noqa: F401
from app.models.platform_settings import PlatformSetting  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.trainer import (  # noqa: F401
    BatchCourse, Assignment, AssignmentSubmission, Announcement, DirectMessage, SkillEvaluation, ManualGrade,
)
from app.models.learning import LearningResource, LearningProgress, LearningEvent  # noqa: F401
