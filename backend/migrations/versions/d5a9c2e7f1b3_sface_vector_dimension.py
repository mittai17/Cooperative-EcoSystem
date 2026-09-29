"""Allow 128-dimensional OpenCV SFace embeddings.

Revision ID: d5a9c2e7f1b3
Revises: c4d8e1a7b2f6
"""
from alembic import op

revision = "d5a9c2e7f1b3"
down_revision = "c4d8e1a7b2f6"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE face_templates ALTER COLUMN embedding TYPE vector(128)")


def downgrade():
    op.execute("ALTER TABLE face_templates ALTER COLUMN embedding TYPE vector(512)")
