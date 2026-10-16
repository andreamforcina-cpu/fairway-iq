"""Account-owned immutable rounds and hole scores; does not import local history."""
from alembic import op
import sqlalchemy as sa

revision = '0003_create_golf_rounds'
down_revision = '0002_create_auth_sessions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'golf_rounds',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('submission_id', sa.Uuid(), nullable=False),
        sa.Column('request_hash', sa.String(64), nullable=False),
        sa.Column('course_name', sa.String(100), nullable=False),
        sa.Column('planned_holes', sa.Integer(), nullable=False),
        sa.Column('played_holes', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_golf_rounds')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name=op.f('fk_golf_rounds_user_id_users')),
        sa.UniqueConstraint('user_id', 'submission_id', name='uq_golf_rounds_owner_submission'),
        sa.CheckConstraint('planned_holes IN (9, 18)', name=op.f('ck_golf_rounds_planned_holes')),
        sa.CheckConstraint('played_holes BETWEEN 1 AND planned_holes', name=op.f('ck_golf_rounds_played_holes')),
        sa.CheckConstraint('length(trim(course_name)) BETWEEN 1 AND 100', name=op.f('ck_golf_rounds_course_name')),
        sa.CheckConstraint("request_hash ~ '^[0-9a-f]{64}$'", name=op.f('ck_golf_rounds_request_hash')),
    )
    op.create_index('ix_golf_rounds_owner_history', 'golf_rounds', ['user_id', 'created_at', 'id'])
    op.create_table(
        'hole_scores',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('round_id', sa.Uuid(), nullable=False),
        sa.Column('number', sa.Integer(), nullable=False),
        sa.Column('par', sa.Integer(), nullable=False),
        sa.Column('strokes', sa.Integer(), nullable=False),
        sa.Column('putts', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_hole_scores')),
        sa.ForeignKeyConstraint(['round_id'], ['golf_rounds.id'], ondelete='CASCADE', name=op.f('fk_hole_scores_round_id_golf_rounds')),
        sa.UniqueConstraint('round_id', 'number', name='uq_hole_scores_round_number'),
        sa.CheckConstraint('number BETWEEN 1 AND 18', name=op.f('ck_hole_scores_number')),
        sa.CheckConstraint('par BETWEEN 1 AND 6', name=op.f('ck_hole_scores_par')),
        sa.CheckConstraint('strokes BETWEEN 1 AND 30', name=op.f('ck_hole_scores_strokes')),
        sa.CheckConstraint('putts BETWEEN 0 AND strokes', name=op.f('ck_hole_scores_putts')),
    )


def downgrade() -> None:
    op.drop_table('hole_scores')
    op.drop_index('ix_golf_rounds_owner_history', table_name='golf_rounds')
    op.drop_table('golf_rounds')
