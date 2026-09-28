from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os

from app.config import get_settings
settings = get_settings()

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from app.database import Base
from app.models.user import User, Organisation
from app.models.programme import Programme, Nomination, Batch, Enrollment, ProgrammeCourse
from app.models.course import Course, Module, Lesson, CourseEnrollment
from app.models.assessment import Assessment, AssessmentResult
from app.models.attendance import AttendanceSession, AttendanceRecord
from app.models.certificate import Certificate
from app.models.skill import Skill, TraineeSkill, SkillGap
from app.models.job import Job, JobMatch, Application, EmployerFeedback
from app.models.analytics import SkillDemand
from app.models.timetable import TimetableSlot
from app.models.hostel import HostelBlock, HostelRoom, HostelWaitlistEntry
from app.models.logistics import LogisticsTask, VehicleAllocation, LogisticsBudget

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
