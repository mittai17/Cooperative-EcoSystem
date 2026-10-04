"""Employer workflow tables: interviews, offers, talent pool, team membership,
feedback ratings, company profile extras and per-user employer preferences.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None

# Created in dependency order; downgrade drops them in reverse.
NEW_TABLES = (
    "interviews", "offers", "talent_pool_entries", "employer_team_members",
    "employer_feedback_ratings", "employer_org_profiles", "employer_user_preferences",
)


def _uuid_pk():
    return sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True)


def _fk(column, target, ondelete, nullable=True):
    return sa.Column(column, postgresql.UUID(as_uuid=True),
                     sa.ForeignKey(target, ondelete=ondelete), nullable=nullable)


def _ts(name, nullable=True):
    return sa.Column(name, sa.DateTime(timezone=True), nullable=nullable)


def upgrade():
    op.create_table(
        "interviews",
        _uuid_pk(),
        _fk("application_id", "applications.id", "CASCADE", nullable=False),
        _fk("job_id", "jobs.id", "CASCADE", nullable=False),
        _fk("trainee_id", "users.id", "CASCADE", nullable=False),
        _fk("organisation_id", "organisations.id", "SET NULL"),
        _ts("scheduled_at", nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="45"),
        sa.Column("mode", sa.String(10), nullable=False, server_default="online"),
        sa.Column("meeting_link", sa.String(1000), nullable=True),
        sa.Column("interviewer_name", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="scheduled"),
        sa.Column("decision", sa.String(10), nullable=True),
        _fk("decided_by_id", "users.id", "SET NULL"),
        sa.Column("evaluation", postgresql.JSONB(), nullable=True),
        sa.Column("overall_rating", sa.Integer(), nullable=True),
        _fk("created_by_id", "users.id", "SET NULL"),
        _ts("created_at"),
        _ts("updated_at"),
        sa.CheckConstraint("status IN ('scheduled','completed','cancelled')", name="ck_interviews_status"),
        sa.CheckConstraint("decision IS NULL OR decision IN ('proceed','hold','reject')", name="ck_interviews_decision"),
        sa.CheckConstraint("overall_rating IS NULL OR (overall_rating BETWEEN 1 AND 5)", name="ck_interviews_rating"),
        sa.CheckConstraint("mode IN ('online','onsite')", name="ck_interviews_mode"),
    )
    op.create_index("ix_interviews_application_id", "interviews", ["application_id"])
    op.create_index("ix_interviews_org_scheduled", "interviews", ["organisation_id", "scheduled_at"])

    op.create_table(
        "offers",
        _uuid_pk(),
        _fk("application_id", "applications.id", "CASCADE", nullable=False),
        _fk("job_id", "jobs.id", "CASCADE", nullable=False),
        _fk("trainee_id", "users.id", "CASCADE", nullable=False),
        _fk("organisation_id", "organisations.id", "SET NULL"),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("salary", sa.Integer(), nullable=True),
        sa.Column("employment_type", sa.String(50), nullable=True),
        sa.Column("joining_date", sa.Date(), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("benefits", sa.Text(), nullable=True),
        sa.Column("additional_terms", sa.Text(), nullable=True),
        _ts("sent_at"),
        _ts("responded_at"),
        _fk("created_by_id", "users.id", "SET NULL"),
        _ts("created_at"),
        _ts("updated_at"),
        sa.CheckConstraint("status IN ('draft','sent','accepted','declined','withdrawn','expired')", name="ck_offers_status"),
        sa.CheckConstraint("salary IS NULL OR salary >= 0", name="ck_offers_salary"),
    )
    op.create_index("ix_offers_application_id", "offers", ["application_id"])
    op.create_index("ix_offers_org_status", "offers", ["organisation_id", "status"])

    op.create_table(
        "talent_pool_entries",
        _uuid_pk(),
        _fk("organisation_id", "organisations.id", "CASCADE", nullable=False),
        _fk("trainee_id", "users.id", "CASCADE", nullable=False),
        sa.Column("category", sa.String(30), nullable=False, server_default="saved"),
        sa.Column("note", sa.Text(), nullable=True),
        _fk("added_by_id", "users.id", "SET NULL"),
        _ts("created_at"),
        _ts("updated_at"),
        sa.UniqueConstraint("organisation_id", "trainee_id", name="uq_talent_pool_org_trainee"),
        sa.CheckConstraint("category IN ('saved','high_potential','future_hiring','interviewed','previously_hired')",
                           name="ck_talent_pool_category"),
    )
    op.create_index("ix_talent_pool_entries_organisation_id", "talent_pool_entries", ["organisation_id"])
    op.create_index("ix_talent_pool_entries_trainee_id", "talent_pool_entries", ["trainee_id"])

    op.create_table(
        "employer_team_members",
        _uuid_pk(),
        _fk("organisation_id", "organisations.id", "CASCADE", nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("team_role", sa.String(30), nullable=False),
        _fk("added_by_id", "users.id", "SET NULL"),
        _ts("created_at"),
        _ts("updated_at"),
        sa.CheckConstraint("team_role IN ('employer_admin','recruiter','hiring_manager')", name="ck_team_role"),
    )
    op.create_index("ix_employer_team_members_organisation_id", "employer_team_members", ["organisation_id"])

    op.create_table(
        "employer_feedback_ratings",
        sa.Column("feedback_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("employer_feedbacks.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("ratings", postgresql.JSONB(), nullable=False),
        _ts("created_at"),
    )

    op.create_table(
        "employer_org_profiles",
        sa.Column("organisation_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organisations.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("departments", postgresql.JSONB(), nullable=False, server_default="[]"),
        _ts("updated_at"),
    )

    op.create_table(
        "employer_user_preferences",
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("notifications", postgresql.JSONB(), nullable=False, server_default="{}"),
        _ts("updated_at"),
    )


def downgrade():
    # Drops only the objects this revision created.
    for table in reversed(NEW_TABLES):
        op.drop_table(table)
