"""Add DIKSHA learning resources, progress tracking, and event tables.

Revision ID: g1a2b3c4d5e6
Revises: f9a0b1c2d3e4
Create Date: 2026-10-04
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "g1a2b3c4d5e6"
down_revision: Union[str, Sequence[str], None] = "f9a0b1c2d3e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. learning_resources
    op.create_table(
        "learning_resources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("external_id", sa.String(255), nullable=False),
        sa.Column("source", sa.String(30), nullable=False, server_default="DIKSHA"),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.String(1000), nullable=True),
        sa.Column("language", sa.String(50), nullable=True),
        sa.Column("content_type", sa.String(50), nullable=False, server_default="video"),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("organization", sa.String(255), nullable=True),
        sa.Column("license", sa.String(255), nullable=True),
        sa.Column("license_url", sa.String(1000), nullable=True),
        sa.Column("attribution", sa.Text(), nullable=True),
        sa.Column("license_status", sa.String(50), nullable=False, server_default="ALLOWED_WITH_ATTRIBUTION"),
        sa.Column("embedding_allowed", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("commercial_use_allowed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("modification_allowed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("source_url", sa.String(1000), nullable=True),
        sa.Column("player_url", sa.String(1000), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("source", "external_id", name="uq_learning_resources_source_external_id"),
    )
    op.create_index(
        "ix_learning_resources_source_type",
        "learning_resources",
        ["source", "content_type"],
    )

    # 2. learning_progress
    op.create_table(
        "learning_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="SET NULL"), nullable=True),
        sa.Column("content_id", sa.String(255), nullable=False),
        sa.Column("source", sa.String(30), nullable=False, server_default="DIKSHA"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("last_accessed_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("last_position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completion_percentage", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.UniqueConstraint("user_id", "content_id", name="uq_learning_progress_user_content"),
    )
    op.create_index("ix_learning_progress_user", "learning_progress", ["user_id"])

    # 3. learning_events
    op.create_table(
        "learning_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content_id", sa.String(255), nullable=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
    )
    op.create_index("ix_learning_events_user_type", "learning_events", ["user_id", "event_type"])
    op.create_index("ix_learning_events_timestamp", "learning_events", ["timestamp"])


def downgrade() -> None:
    op.drop_table("learning_events")
    op.drop_table("learning_progress")
    op.drop_table("learning_resources")
