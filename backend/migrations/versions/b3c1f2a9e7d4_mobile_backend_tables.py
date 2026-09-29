"""mobile_backend_tables

Additive only: new nullable columns on modules/jobs and new tables for
module progress, career plan/recommendations/chat history and offline
packages. No existing table or row is dropped, truncated or rewritten.

Revision ID: b3c1f2a9e7d4
Revises: a95b84ecdefe
Create Date: 2026-09-28 19:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b3c1f2a9e7d4'
down_revision: Union[str, None] = 'a95b84ecdefe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('modules', sa.Column('position', sa.Integer(), nullable=True))
    op.add_column('modules', sa.Column('duration_minutes', sa.Integer(), nullable=True))
    op.add_column('modules', sa.Column('summary', sa.Text(), nullable=True))
    op.add_column('modules', sa.Column('video_url', sa.String(length=500), nullable=True))
    op.add_column('jobs', sa.Column('openings', sa.Integer(), nullable=True))
    op.add_column('jobs', sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table('module_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trainee_id', sa.UUID(), nullable=False),
        sa.Column('module_id', sa.UUID(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trainee_id', 'module_id', name='uq_module_progress_trainee_module'),
    )
    op.create_index(op.f('ix_module_progress_trainee_id'), 'module_progress', ['trainee_id'], unique=False)

    op.create_table('career_plans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trainee_id', sa.UUID(), nullable=False),
        sa.Column('target_role', sa.String(length=255), nullable=False),
        sa.Column('current_match', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trainee_id'),
    )
    op.create_table('career_plan_steps',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('plan_id', sa.UUID(), nullable=False),
        sa.Column('step', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('timeline', sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['career_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_id', 'step', name='uq_career_plan_step'),
    )
    op.create_table('career_recommendations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('plan_id', sa.UUID(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('duration', sa.String(length=50), nullable=True),
        sa.Column('impact', sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(['plan_id'], ['career_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_id', 'priority', name='uq_career_recommendation_priority'),
    )
    op.create_table('career_chat_messages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trainee_id', sa.UUID(), nullable=False),
        sa.Column('sender', sa.String(length=10), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('suggested_actions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_career_chat_messages_trainee_id'), 'career_chat_messages', ['trainee_id'], unique=False)

    op.create_table('offline_packages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('size_kb', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('course_id'),
    )
    op.create_table('offline_downloads',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trainee_id', sa.UUID(), nullable=False),
        sa.Column('package_id', sa.UUID(), nullable=False),
        sa.Column('downloaded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['package_id'], ['offline_packages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trainee_id', 'package_id', name='uq_offline_download'),
    )
    op.create_index(op.f('ix_offline_downloads_trainee_id'), 'offline_downloads', ['trainee_id'], unique=False)


def downgrade() -> None:
    # Only ever drops objects created by this revision.
    op.drop_index(op.f('ix_offline_downloads_trainee_id'), table_name='offline_downloads')
    op.drop_table('offline_downloads')
    op.drop_table('offline_packages')
    op.drop_index(op.f('ix_career_chat_messages_trainee_id'), table_name='career_chat_messages')
    op.drop_table('career_chat_messages')
    op.drop_table('career_recommendations')
    op.drop_table('career_plan_steps')
    op.drop_table('career_plans')
    op.drop_index(op.f('ix_module_progress_trainee_id'), table_name='module_progress')
    op.drop_table('module_progress')
    op.drop_column('jobs', 'posted_at')
    op.drop_column('jobs', 'openings')
    op.drop_column('modules', 'video_url')
    op.drop_column('modules', 'summary')
    op.drop_column('modules', 'duration_minutes')
    op.drop_column('modules', 'position')
