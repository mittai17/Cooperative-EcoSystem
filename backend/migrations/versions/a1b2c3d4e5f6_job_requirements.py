"""Create job_requirements and job_details for employer job postings and the matcher.

Revision ID: a1b2c3d4e5f6
Revises: d5a9c2e7f1b3
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a1b2c3d4e5f6"
down_revision = "d5a9c2e7f1b3"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "job_requirements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False, server_default="skill"),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("skills.id", ondelete="SET NULL"), nullable=True),
        sa.Column("skill_name", sa.String(255), nullable=True),
        sa.Column("requirement_type", sa.String(20), nullable=False, server_default="required"),
        sa.Column("min_proficiency", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("min_education", sa.String(100), nullable=True),
        sa.Column("min_years", sa.Integer(), nullable=True),
        sa.Column("certification_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("kind IN ('skill','education','experience','certification')", name="ck_job_requirements_kind"),
        sa.CheckConstraint("requirement_type IN ('required','preferred')", name="ck_job_requirements_type"),
        sa.CheckConstraint("min_proficiency IS NULL OR (min_proficiency >= 0 AND min_proficiency <= 100)",
                           name="ck_job_requirements_min_proficiency"),
        sa.CheckConstraint("weight >= 1 AND weight <= 10", name="ck_job_requirements_weight"),
        sa.CheckConstraint("min_years IS NULL OR min_years >= 0", name="ck_job_requirements_min_years"),
    )
    op.create_index("ix_job_requirements_job_id", "job_requirements", ["job_id"])
    op.create_table(
        "job_details",
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("salary_min", sa.Integer(), nullable=True),
        sa.Column("salary_max", sa.Integer(), nullable=True),
        sa.Column("experience_required", sa.String(100), nullable=True),
        sa.Column("education", sa.String(255), nullable=True),
        sa.Column("responsibilities", sa.Text(), nullable=True),
        sa.Column("certifications", sa.Text(), nullable=True),
        sa.Column("languages", sa.String(255), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("salary_min IS NULL OR salary_min >= 0", name="ck_job_details_salary_min"),
        sa.CheckConstraint("salary_max IS NULL OR salary_max >= 0", name="ck_job_details_salary_max"),
    )


def downgrade():
    op.drop_table("job_details")
    op.drop_index("ix_job_requirements_job_id", table_name="job_requirements")
    op.drop_table("job_requirements")
