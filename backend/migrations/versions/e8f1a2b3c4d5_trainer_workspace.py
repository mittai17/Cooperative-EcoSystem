"""Trainer workspace: batch_courses, assignments, announcements, messages,
skill evaluations, manual grades + additive columns on assessments/timetable_slots.

Revision ID: e8f1a2b3c4d5
Revises: d5a9c2e7f1b3

Idempotent (IF NOT EXISTS / checkfirst) so it is safe on databases whose
alembic_version lags behind the real schema.
"""
from alembic import op

revision = "e8f1a2b3c4d5"
down_revision = "d5a9c2e7f1b3"
branch_labels = None
depends_on = None

NEW_TABLES = [
    "batch_courses", "assignments", "assignment_submissions", "announcements",
    "direct_messages", "skill_evaluations", "assessment_manual_grades",
]


def upgrade():
    import app.models  # noqa: F401  (registers every table)
    from app.database import Base

    bind = op.get_bind()
    op.execute("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'published'")
    op.execute("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS module_title VARCHAR(255)")
    op.execute("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS description TEXT")
    op.execute("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS instructions TEXT")
    op.execute("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ")
    op.execute("ALTER TABLE timetable_slots ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL")
    for name in NEW_TABLES:
        Base.metadata.tables[name].create(bind, checkfirst=True)


def downgrade():
    from app.database import Base

    bind = op.get_bind()
    for name in reversed(NEW_TABLES):
        Base.metadata.tables[name].drop(bind, checkfirst=True)
    op.execute("ALTER TABLE timetable_slots DROP COLUMN IF EXISTS course_id")
    for col in ("scheduled_at", "instructions", "description", "module_title", "status", "created_by", "batch_id"):
        op.execute(f"ALTER TABLE assessments DROP COLUMN IF EXISTS {col}")
