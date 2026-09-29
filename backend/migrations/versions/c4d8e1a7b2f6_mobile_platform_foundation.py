"""mobile_platform_foundation

One additive migration for the whole mobile completion plan (features 1-11):
translations, lesson content/progress/media, assessment bank + attempts,
certificate integrity/verification log, profiles, notifications/push tokens,
attendance v2 (window, unique per trainee), face templates/events, timetable
times + exceptions, hostel requests, batch logistics fields, jobs/applications
ownership and external listings, external courses, integration usage, AI/TTS
caches and offline sync receipts.

Nothing is dropped from existing tables. The only row-level changes to existing
data are: (1) duplicate attendance_records per (session_id, trainee_id) are
moved to attendance_records_dedup_archive (earliest mark kept) so the unique
constraint can be created - downgrade restores them; (2) timetable_slots
start_time/end_time are backfilled by parsing the legacy time_slot text;
(3) jobs.organisation_id is set where employer_name matches exactly one
employer organisation.

Revision ID: c4d8e1a7b2f6
Revises: b3c1f2a9e7d4
Create Date: 2026-09-28 22:10:00.000000

"""
import re
from datetime import time
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c4d8e1a7b2f6'
down_revision: Union[str, None] = 'b3c1f2a9e7d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TS = sa.DateTime(timezone=True)
JSONB = postgresql.JSONB(astext_type=sa.Text())
EMPTY_OBJ = sa.text("'{}'::jsonb")


def _cols(table, *columns):
    for c in columns:
        op.add_column(table, c)


def _drop_cols(table, *names):
    for n in names:
        op.drop_column(table, n)


def _fk(table, col, target, ondelete=None, name=None):
    op.create_foreign_key(name or f"fk_{table}_{col}", table, target.split(".")[0], [col], [target.split(".")[1]], ondelete=ondelete)


_TIME_RE = re.compile(r"(\d{1,2})[:.](\d{2})\s*([AaPp][Mm])?")


def _parse_times(text):
    """'09:00 AM' -> (09:00, 10:00); '9:00 - 10:30' -> (09:00, 10:30)."""
    found = _TIME_RE.findall(text or "")
    if not found:
        return None, None

    def to_time(h, m, ap):
        h, m = int(h), int(m)
        if ap:
            ap = ap.lower()
            if ap == "pm" and h < 12:
                h += 12
            if ap == "am" and h == 12:
                h = 0
        if h > 23 or m > 59:
            return None
        return time(h, m)

    start = to_time(*found[0])
    if start is None:
        return None, None
    end = to_time(*found[1]) if len(found) > 1 else None
    if end is None or end <= start:
        end = time(min(start.hour + 1, 23), start.minute if start.hour < 23 else 59)
    return start, end


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # ------------------------------------------------------------------ users / orgs
    _cols('users',
          sa.Column('preferred_language', sa.String(5), nullable=True, server_default='en'),
          sa.Column('career_target_role', sa.String(255), nullable=True),
          sa.Column('moodle_user_id', sa.Integer(), nullable=True))
    op.create_unique_constraint('users_moodle_user_id_key', 'users', ['moodle_user_id'])
    _cols('organisations',
          sa.Column('address', sa.String(500), nullable=True),
          sa.Column('district', sa.String(100), nullable=True),
          sa.Column('pincode', sa.String(10), nullable=True),
          sa.Column('phone', sa.String(20), nullable=True),
          sa.Column('email', sa.String(255), nullable=True),
          sa.Column('website', sa.String(255), nullable=True),
          sa.Column('accreditation_number', sa.String(100), nullable=True),
          sa.Column('logo_url', sa.String(500), nullable=True))

    op.create_table('user_profiles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(20), nullable=True),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('district', sa.String(100), nullable=True),
        sa.Column('pincode', sa.String(10), nullable=True),
        sa.Column('address', sa.String(500), nullable=True),
        sa.Column('education_level', sa.String(100), nullable=True),
        sa.Column('occupation', sa.String(150), nullable=True),
        sa.Column('designation', sa.String(150), nullable=True),
        sa.Column('cooperative_society', sa.String(255), nullable=True),
        sa.Column('years_of_experience', sa.Integer(), nullable=True),
        sa.Column('photo_url', sa.String(500), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('visible_to_employers', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('qualification', sa.String(255), nullable=True),
        sa.Column('expertise', JSONB, nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.Column('updated_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # ------------------------------------------------------------------ programmes / nominations / batches
    _cols('programmes',
          sa.Column('eligibility', sa.Text(), nullable=True),
          sa.Column('application_deadline', TS, nullable=True),
          sa.Column('end_date', TS, nullable=True),
          sa.Column('venue', sa.String(255), nullable=True),
          sa.Column('created_by_id', sa.UUID(), nullable=True))
    _fk('programmes', 'created_by_id', 'users.id', 'SET NULL')

    _cols('nominations',
          sa.Column('batch_id', sa.UUID(), nullable=True),
          sa.Column('nominated_by_id', sa.UUID(), nullable=True),
          sa.Column('note', sa.Text(), nullable=True),
          sa.Column('decision_note', sa.Text(), nullable=True))
    _fk('nominations', 'batch_id', 'batches.id', 'SET NULL')
    _fk('nominations', 'nominated_by_id', 'users.id', 'SET NULL')

    _cols('batches',
          sa.Column('venue', sa.String(255), nullable=True),
          sa.Column('reporting_instructions', sa.Text(), nullable=True),
          sa.Column('contact_phone', sa.String(20), nullable=True),
          sa.Column('min_attendance_pct', sa.Integer(), nullable=True, server_default='75'))

    # ------------------------------------------------------------------ courses / modules / lessons
    for table in ('courses', 'modules'):
        _cols(table,
              sa.Column('source', sa.String(30), nullable=False, server_default='native'),
              sa.Column('external_id', sa.String(255), nullable=True),
              sa.Column('external_url', sa.String(1000), nullable=True),
              sa.Column('synced_at', TS, nullable=True))
        op.create_unique_constraint(f'uq_{table}_source_external_id', table, ['source', 'external_id'])
    _cols('lessons',
          sa.Column('position', sa.Integer(), nullable=True),
          sa.Column('lesson_type', sa.String(30), nullable=False, server_default='text'),
          sa.Column('duration_min', sa.Integer(), nullable=True),
          sa.Column('content', JSONB, nullable=True),
          sa.Column('content_version', sa.Integer(), nullable=False, server_default='1'),
          sa.Column('source', sa.String(30), nullable=False, server_default='native'),
          sa.Column('external_id', sa.String(255), nullable=True),
          sa.Column('external_url', sa.String(1000), nullable=True),
          sa.Column('synced_at', TS, nullable=True))
    op.create_unique_constraint('uq_lessons_source_external_id', 'lessons', ['source', 'external_id'])

    op.create_table('content_translations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('entity_type', sa.String(30), nullable=False),
        sa.Column('entity_id', sa.UUID(), nullable=False),
        sa.Column('lang', sa.String(5), nullable=False),
        sa.Column('fields', JSONB, server_default=EMPTY_OBJ, nullable=False),
        sa.Column('status', sa.String(20), server_default='draft', nullable=False),
        sa.Column('created_at', TS, nullable=True),
        sa.Column('updated_at', TS, nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('entity_type', 'entity_id', 'lang', name='uq_content_translation'),
        sa.CheckConstraint("lang in ('en','hi','mr','gu','ta')", name='ck_content_translations_lang'),
        sa.CheckConstraint("status in ('draft','reviewed')", name='ck_content_translations_status'),
    )
    op.create_index('ix_content_translations_entity', 'content_translations', ['entity_type', 'entity_id'])

    op.create_table('lesson_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trainee_id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(20), server_default='in_progress', nullable=False),
        sa.Column('position_sec', sa.Integer(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('completed_at', TS, nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.Column('updated_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trainee_id', 'lesson_id', name='uq_lesson_progress_trainee_lesson'),
    )
    op.create_index(op.f('ix_lesson_progress_trainee_id'), 'lesson_progress', ['trainee_id'])
    op.create_index(op.f('ix_lesson_progress_lesson_id'), 'lesson_progress', ['lesson_id'])

    op.create_table('media_assets',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=True),
        sa.Column('kind', sa.String(20), server_default='video', nullable=False),
        sa.Column('provider', sa.String(20), server_default='native', nullable=False),
        sa.Column('external_id', sa.String(255), nullable=True),
        sa.Column('lang', sa.String(5), nullable=True),
        sa.Column('url', sa.String(1000), nullable=False),
        sa.Column('downloadable', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('sha256', sa.String(64), nullable=True),
        sa.Column('size', sa.BigInteger(), nullable=True),
        sa.Column('mime', sa.String(100), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('lesson_id', 'provider', 'external_id', name='uq_media_asset_lesson_provider_ext'),
    )
    op.create_index(op.f('ix_media_assets_lesson_id'), 'media_assets', ['lesson_id'])

    op.create_table('external_courses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('source', sa.String(30), nullable=False),
        sa.Column('external_id', sa.String(255), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('url', sa.String(1000), nullable=True),
        sa.Column('provider_name', sa.String(255), nullable=True),
        sa.Column('thumbnail_url', sa.String(1000), nullable=True),
        sa.Column('language', sa.String(10), nullable=True),
        sa.Column('duration_min', sa.Integer(), nullable=True),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('skills', JSONB, nullable=True),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('fetched_at', TS, nullable=True),
        sa.Column('last_seen_at', TS, nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source', 'external_id', name='uq_external_courses_source_external_id'),
    )

    # ------------------------------------------------------------------ assessments
    _cols('assessments',
          sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
          sa.Column('shuffle', sa.Boolean(), nullable=False, server_default=sa.text('false')),
          sa.Column('show_answers', sa.String(20), nullable=False, server_default='after_submit'))
    op.create_table('assessment_questions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('assessment_id', sa.UUID(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(20), server_default='mcq_single', nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('options', JSONB, nullable=True),
        sa.Column('correct', JSONB, nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('marks', sa.Integer(), server_default='1', nullable=False),
        sa.Column('topic', sa.String(100), nullable=True),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id', 'position', name='uq_assessment_question_position'),
    )
    op.create_index(op.f('ix_assessment_questions_assessment_id'), 'assessment_questions', ['assessment_id'])
    op.create_table('assessment_attempts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('assessment_id', sa.UUID(), nullable=False),
        sa.Column('trainee_id', sa.UUID(), nullable=False),
        sa.Column('attempt_no', sa.Integer(), server_default='1', nullable=False),
        sa.Column('started_at', TS, nullable=True),
        sa.Column('expires_at', TS, nullable=True),
        sa.Column('submitted_at', TS, nullable=True),
        sa.Column('question_order', JSONB, nullable=True),
        sa.Column('answers', JSONB, nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('passed', sa.Boolean(), nullable=True),
        sa.Column('status', sa.String(20), server_default='in_progress', nullable=False),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id', 'trainee_id', 'attempt_no', name='uq_assessment_attempt_no'),
    )
    op.create_index('ix_assessment_attempts_trainee_assessment', 'assessment_attempts', ['trainee_id', 'assessment_id'])

    # ------------------------------------------------------------------ certificates
    _cols('certificates',
          sa.Column('content_hash', sa.String(64), nullable=True),
          sa.Column('revoked_at', TS, nullable=True),
          sa.Column('revoked_reason', sa.Text(), nullable=True))
    op.create_table('certificate_verifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('certificate_id', sa.UUID(), nullable=True),
        sa.Column('code', sa.String(255), nullable=False),
        sa.Column('result', sa.String(20), nullable=True),
        sa.Column('ip_hash', sa.String(64), nullable=True),
        sa.Column('verified_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['certificate_id'], ['certificates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_certificate_verifications_code'), 'certificate_verifications', ['code'])

    # ------------------------------------------------------------------ timetable
    _cols('timetable_slots',
          sa.Column('start_time', sa.Time(), nullable=True),
          sa.Column('end_time', sa.Time(), nullable=True))
    bind = op.get_bind()
    for row in bind.execute(sa.text("SELECT id, time_slot FROM timetable_slots")).fetchall():
        start, end = _parse_times(row.time_slot)
        if start is not None:
            bind.execute(
                sa.text("UPDATE timetable_slots SET start_time = :s, end_time = :e WHERE id = :i"),
                {"s": start, "e": end, "i": row.id},
            )
    op.create_table('timetable_exceptions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('slot_id', sa.UUID(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('new_room', sa.String(100), nullable=True),
        sa.Column('new_start_time', sa.Time(), nullable=True),
        sa.Column('new_end_time', sa.Time(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['slot_id'], ['timetable_slots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slot_id', 'date', name='uq_timetable_exception_slot_date'),
    )
    op.create_index(op.f('ix_timetable_exceptions_slot_id'), 'timetable_exceptions', ['slot_id'])

    # ------------------------------------------------------------------ hostel
    op.create_table('hostel_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('organisation_id', sa.UUID(), nullable=True),
        sa.Column('trainee_id', sa.UUID(), nullable=False),
        sa.Column('programme_id', sa.UUID(), nullable=True),
        sa.Column('batch_id', sa.UUID(), nullable=True),
        sa.Column('from_date', sa.Date(), nullable=True),
        sa.Column('to_date', sa.Date(), nullable=True),
        sa.Column('preference', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('waitlist_entry_id', sa.UUID(), nullable=True),
        sa.Column('room_id', sa.UUID(), nullable=True),
        sa.Column('decided_by', sa.UUID(), nullable=True),
        sa.Column('decision_note', sa.Text(), nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.Column('updated_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['organisation_id'], ['organisations.id']),
        sa.ForeignKeyConstraint(['trainee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['programme_id'], ['programmes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['waitlist_entry_id'], ['hostel_waitlist_entries.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['room_id'], ['hostel_rooms.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['decided_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_hostel_requests_organisation_id'), 'hostel_requests', ['organisation_id'])
    op.create_index(op.f('ix_hostel_requests_trainee_id'), 'hostel_requests', ['trainee_id'])

    # ------------------------------------------------------------------ attendance
    _cols('attendance_sessions',
          sa.Column('batch_id', sa.UUID(), nullable=True),
          sa.Column('timetable_slot_id', sa.UUID(), nullable=True),
          sa.Column('opens_at', TS, nullable=True),
          sa.Column('closes_at', TS, nullable=True),
          sa.Column('allowed_methods', JSONB, nullable=True),
          sa.Column('created_by', sa.UUID(), nullable=True),
          sa.Column('room', sa.String(100), nullable=True),
          sa.Column('qr_secret', sa.String(64), nullable=True))
    _fk('attendance_sessions', 'batch_id', 'batches.id', 'SET NULL')
    _fk('attendance_sessions', 'timetable_slot_id', 'timetable_slots.id', 'SET NULL')
    _fk('attendance_sessions', 'created_by', 'users.id', 'SET NULL')

    _cols('attendance_records',
          sa.Column('confidence', sa.Float(), nullable=True),
          sa.Column('client_id', sa.String(64), nullable=True),
          sa.Column('offline', sa.Boolean(), nullable=False, server_default=sa.text('false')),
          sa.Column('needs_review', sa.Boolean(), nullable=False, server_default=sa.text('false')),
          sa.Column('captured_at', TS, nullable=True),
          sa.Column('override_by', sa.UUID(), nullable=True),
          sa.Column('override_reason', sa.Text(), nullable=True))
    _fk('attendance_records', 'override_by', 'users.id', 'SET NULL')

    # Dedupe (session_id, trainee_id): move later duplicates to an archive table
    # (never a hard delete), keep the earliest mark.
    op.create_table('attendance_records_dedup_archive',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('session_id', sa.UUID(), nullable=True),
        sa.Column('trainee_id', sa.UUID(), nullable=True),
        sa.Column('marked_at', TS, nullable=True),
        sa.Column('method', sa.String(50), nullable=True),
        sa.Column('status', sa.String(50), nullable=True),
        sa.Column('archived_at', TS, nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute("""
        INSERT INTO attendance_records_dedup_archive (id, session_id, trainee_id, marked_at, method, status, archived_at)
        SELECT id, session_id, trainee_id, marked_at, method, status, now()
        FROM (
            SELECT ar.*, row_number() OVER (
                PARTITION BY session_id, trainee_id ORDER BY marked_at ASC NULLS LAST, id ASC) AS rn
            FROM attendance_records ar
            WHERE session_id IS NOT NULL AND trainee_id IS NOT NULL
        ) d WHERE d.rn > 1
    """)
    op.execute("DELETE FROM attendance_records WHERE id IN (SELECT id FROM attendance_records_dedup_archive)")
    op.create_unique_constraint('uq_attendance_session_trainee', 'attendance_records', ['session_id', 'trainee_id'])

    # ------------------------------------------------------------------ face
    # vector(128) via raw DDL so the migration has no dependency on the pgvector python package.
    op.execute("""
        CREATE TABLE face_templates (
            id UUID NOT NULL PRIMARY KEY,
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            embedding vector(128),
            model_version VARCHAR(50),
            enrolled_at TIMESTAMPTZ,
            enrolled_by UUID REFERENCES users(id) ON DELETE SET NULL,
            self_enrolled BOOLEAN NOT NULL DEFAULT false,
            verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
            verified_at TIMESTAMPTZ,
            consent_version VARCHAR(20),
            consent_at TIMESTAMPTZ,
            revoked_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ
        )
    """)
    op.create_table('face_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('actor_id', sa.UUID(), nullable=True),
        sa.Column('session_id', sa.UUID(), nullable=True),
        sa.Column('event_type', sa.String(20), nullable=False),
        sa.Column('outcome', sa.String(20), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('liveness', sa.Boolean(), nullable=True),
        sa.Column('details', JSONB, nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['session_id'], ['attendance_sessions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_face_events_user_created', 'face_events', ['user_id', 'created_at'])
    op.create_index(op.f('ix_face_events_session_id'), 'face_events', ['session_id'])

    # ------------------------------------------------------------------ jobs / applications
    _cols('jobs',
          sa.Column('organisation_id', sa.UUID(), nullable=True),
          sa.Column('created_by_id', sa.UUID(), nullable=True),
          sa.Column('status', sa.String(20), nullable=False, server_default='open'),
          sa.Column('deadline', TS, nullable=True),
          sa.Column('source', sa.String(20), nullable=False, server_default='employer'),
          sa.Column('external_id', sa.String(255), nullable=True),
          sa.Column('apply_url', sa.String(1000), nullable=True),
          sa.Column('fetched_at', TS, nullable=True),
          sa.Column('last_seen_at', TS, nullable=True),
          sa.Column('dedupe_key', sa.String(255), nullable=True))
    _fk('jobs', 'organisation_id', 'organisations.id', 'SET NULL')
    _fk('jobs', 'created_by_id', 'users.id', 'SET NULL')
    op.create_unique_constraint('uq_jobs_source_external_id', 'jobs', ['source', 'external_id'])
    op.create_index(op.f('ix_jobs_organisation_id'), 'jobs', ['organisation_id'])
    op.create_index(op.f('ix_jobs_dedupe_key'), 'jobs', ['dedupe_key'])
    # Ownership backfill: only an exact, unambiguous employer-name match.
    op.execute("""
        UPDATE jobs j SET organisation_id = o.id
        FROM organisations o
        WHERE j.organisation_id IS NULL AND j.employer_name IS NOT NULL
          AND o.type = 'employer' AND lower(o.name) = lower(j.employer_name)
          AND (SELECT count(*) FROM organisations o2
               WHERE o2.type = 'employer' AND lower(o2.name) = lower(j.employer_name)) = 1
    """)
    _cols('applications',
          sa.Column('employer_note', sa.Text(), nullable=True),
          sa.Column('interview_at', TS, nullable=True),
          sa.Column('updated_at', TS, nullable=True))

    # ------------------------------------------------------------------ chat extension
    _cols('career_chat_messages',
          sa.Column('conversation_id', sa.UUID(), nullable=True),
          sa.Column('lang', sa.String(5), nullable=True))
    op.create_index(op.f('ix_career_chat_messages_conversation_id'), 'career_chat_messages', ['conversation_id'])

    # ------------------------------------------------------------------ notifications
    op.create_table('notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('kind', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('payload', JSONB, nullable=True),
        sa.Column('read_at', TS, nullable=True),
        sa.Column('push_status', sa.String(20), nullable=True),
        sa.Column('push_sent_at', TS, nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_user_created', 'notifications', ['user_id', 'created_at'])
    op.create_table('push_tokens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token', sa.String(512), nullable=False),
        sa.Column('provider', sa.String(10), server_default='expo', nullable=False),
        sa.Column('platform', sa.String(10), nullable=True),
        sa.Column('last_seen_at', TS, nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
    )
    op.create_index(op.f('ix_push_tokens_user_id'), 'push_tokens', ['user_id'])

    # ------------------------------------------------------------------ platform
    op.create_table('integration_usage',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('integration', sa.String(30), nullable=False),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('calls', sa.Integer(), server_default='0', nullable=False),
        sa.Column('errors', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('updated_at', TS, nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('integration', 'day', name='uq_integration_usage_day'),
    )
    op.create_table('ai_cache',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('cache_key', sa.String(128), nullable=False),
        sa.Column('kind', sa.String(30), nullable=False),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('lang', sa.String(5), nullable=True),
        sa.Column('response', JSONB, nullable=True),
        sa.Column('hits', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', TS, nullable=True),
        sa.Column('expires_at', TS, nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cache_key'),
    )
    op.create_table('tts_audio',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('text_hash', sa.String(64), nullable=False),
        sa.Column('lang', sa.String(5), nullable=False),
        sa.Column('voice', sa.String(50), server_default='default', nullable=False),
        sa.Column('provider', sa.String(30), server_default='bhashini_tts', nullable=False),
        sa.Column('media_asset_id', sa.UUID(), nullable=True),
        sa.Column('url', sa.String(1000), nullable=True),
        sa.Column('mime', sa.String(100), nullable=True),
        sa.Column('size', sa.BigInteger(), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['media_asset_id'], ['media_assets.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('text_hash', 'lang', 'voice', name='uq_tts_audio_text_lang_voice'),
    )
    op.create_table('sync_receipts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('client_id', sa.String(64), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('response', JSONB, nullable=True),
        sa.Column('created_at', TS, nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id'),
    )
    op.create_index(op.f('ix_sync_receipts_user_id'), 'sync_receipts', ['user_id'])


def downgrade() -> None:
    # Only ever drops objects created by this revision (and restores the
    # attendance duplicates that were archived).
    op.drop_index(op.f('ix_sync_receipts_user_id'), table_name='sync_receipts')
    for t in ('sync_receipts', 'tts_audio', 'ai_cache', 'integration_usage'):
        op.drop_table(t)
    op.drop_index(op.f('ix_push_tokens_user_id'), table_name='push_tokens')
    op.drop_table('push_tokens')
    op.drop_index('ix_notifications_user_created', table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_career_chat_messages_conversation_id'), table_name='career_chat_messages')
    _drop_cols('career_chat_messages', 'lang', 'conversation_id')

    _drop_cols('applications', 'updated_at', 'interview_at', 'employer_note')
    op.drop_index(op.f('ix_jobs_dedupe_key'), table_name='jobs')
    op.drop_index(op.f('ix_jobs_organisation_id'), table_name='jobs')
    op.drop_constraint('uq_jobs_source_external_id', 'jobs', type_='unique')
    op.drop_constraint('fk_jobs_created_by_id', 'jobs', type_='foreignkey')
    op.drop_constraint('fk_jobs_organisation_id', 'jobs', type_='foreignkey')
    _drop_cols('jobs', 'dedupe_key', 'last_seen_at', 'fetched_at', 'apply_url', 'external_id', 'source',
               'deadline', 'status', 'created_by_id', 'organisation_id')

    op.drop_index(op.f('ix_face_events_session_id'), table_name='face_events')
    op.drop_index('ix_face_events_user_created', table_name='face_events')
    op.drop_table('face_events')
    op.drop_table('face_templates')

    # attendance: drop the unique constraint first, then put archived duplicates back.
    op.drop_constraint('uq_attendance_session_trainee', 'attendance_records', type_='unique')
    op.execute("""
        INSERT INTO attendance_records (id, session_id, trainee_id, marked_at, method, status)
        SELECT id, session_id, trainee_id, marked_at, method, status FROM attendance_records_dedup_archive
        ON CONFLICT (id) DO NOTHING
    """)
    op.drop_table('attendance_records_dedup_archive')
    op.drop_constraint('fk_attendance_records_override_by', 'attendance_records', type_='foreignkey')
    _drop_cols('attendance_records', 'override_reason', 'override_by', 'captured_at', 'needs_review',
               'offline', 'client_id', 'confidence')
    op.drop_constraint('fk_attendance_sessions_created_by', 'attendance_sessions', type_='foreignkey')
    op.drop_constraint('fk_attendance_sessions_timetable_slot_id', 'attendance_sessions', type_='foreignkey')
    op.drop_constraint('fk_attendance_sessions_batch_id', 'attendance_sessions', type_='foreignkey')
    _drop_cols('attendance_sessions', 'qr_secret', 'room', 'created_by', 'allowed_methods', 'closes_at',
               'opens_at', 'timetable_slot_id', 'batch_id')

    op.drop_index(op.f('ix_hostel_requests_trainee_id'), table_name='hostel_requests')
    op.drop_index(op.f('ix_hostel_requests_organisation_id'), table_name='hostel_requests')
    op.drop_table('hostel_requests')

    op.drop_index(op.f('ix_timetable_exceptions_slot_id'), table_name='timetable_exceptions')
    op.drop_table('timetable_exceptions')
    _drop_cols('timetable_slots', 'end_time', 'start_time')

    op.drop_index(op.f('ix_certificate_verifications_code'), table_name='certificate_verifications')
    op.drop_table('certificate_verifications')
    _drop_cols('certificates', 'revoked_reason', 'revoked_at', 'content_hash')

    op.drop_index('ix_assessment_attempts_trainee_assessment', table_name='assessment_attempts')
    op.drop_table('assessment_attempts')
    op.drop_index(op.f('ix_assessment_questions_assessment_id'), table_name='assessment_questions')
    op.drop_table('assessment_questions')
    _drop_cols('assessments', 'show_answers', 'shuffle', 'max_attempts')

    op.drop_table('external_courses')
    op.drop_index(op.f('ix_media_assets_lesson_id'), table_name='media_assets')
    op.drop_table('media_assets')
    op.drop_index(op.f('ix_lesson_progress_lesson_id'), table_name='lesson_progress')
    op.drop_index(op.f('ix_lesson_progress_trainee_id'), table_name='lesson_progress')
    op.drop_table('lesson_progress')
    op.drop_index('ix_content_translations_entity', table_name='content_translations')
    op.drop_table('content_translations')

    op.drop_constraint('uq_lessons_source_external_id', 'lessons', type_='unique')
    _drop_cols('lessons', 'synced_at', 'external_url', 'external_id', 'source', 'content_version', 'content',
               'duration_min', 'lesson_type', 'position')
    for table in ('modules', 'courses'):
        op.drop_constraint(f'uq_{table}_source_external_id', table, type_='unique')
        _drop_cols(table, 'synced_at', 'external_url', 'external_id', 'source')

    _drop_cols('batches', 'min_attendance_pct', 'contact_phone', 'reporting_instructions', 'venue')
    op.drop_constraint('fk_nominations_nominated_by_id', 'nominations', type_='foreignkey')
    op.drop_constraint('fk_nominations_batch_id', 'nominations', type_='foreignkey')
    _drop_cols('nominations', 'decision_note', 'note', 'nominated_by_id', 'batch_id')
    op.drop_constraint('fk_programmes_created_by_id', 'programmes', type_='foreignkey')
    _drop_cols('programmes', 'created_by_id', 'venue', 'end_date', 'application_deadline', 'eligibility')

    op.drop_table('user_profiles')
    _drop_cols('organisations', 'logo_url', 'accreditation_number', 'website', 'email', 'phone', 'pincode',
               'district', 'address')
    op.drop_constraint('users_moodle_user_id_key', 'users', type_='unique')
    _drop_cols('users', 'moodle_user_id', 'career_target_role', 'preferred_language')
    # The pgvector extension is intentionally left installed (shared, harmless).
