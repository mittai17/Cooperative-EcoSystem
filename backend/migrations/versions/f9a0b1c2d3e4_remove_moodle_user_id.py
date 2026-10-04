"""Remove the unused Moodle account link and merge the migration heads.

Revision ID: f9a0b1c2d3e4
Revises: c3d4e5f6a7b8, e8f1a2b3c4d5
Create Date: 2026-10-04
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f9a0b1c2d3e4"
down_revision: Union[str, Sequence[str], None] = ("c3d4e5f6a7b8", "e8f1a2b3c4d5")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("users_moodle_user_id_key", "users", type_="unique")
    op.drop_column("users", "moodle_user_id")


def downgrade() -> None:
    op.add_column("users", sa.Column("moodle_user_id", sa.Integer(), nullable=True))
    op.create_unique_constraint("users_moodle_user_id_key", "users", ["moodle_user_id"])
