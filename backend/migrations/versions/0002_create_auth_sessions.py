"""Create opaque-token sessions and refresh-token rotation history."""
from alembic import op
import sqlalchemy as sa

revision = '0002_create_auth_sessions'
down_revision = '0001_create_users'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'auth_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('access_hash', sa.String(64), nullable=False),
        sa.Column('access_expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_auth_sessions')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE', name=op.f('fk_auth_sessions_user_id_users')),
        sa.UniqueConstraint('access_hash', name=op.f('uq_auth_sessions_access_hash')),
        sa.CheckConstraint("access_hash ~ '^[0-9a-f]{64}$'", name=op.f('ck_auth_sessions_access_hash_format')),
        sa.CheckConstraint('access_expires_at <= expires_at', name=op.f('ck_auth_sessions_access_expiry_bound')),
    )
    op.create_index('ix_auth_sessions_user_id', 'auth_sessions', ['user_id'])
    op.create_index('ix_auth_sessions_expires_at', 'auth_sessions', ['expires_at'])
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('session_id', sa.Uuid(), nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_refresh_tokens')),
        sa.ForeignKeyConstraint(['session_id'], ['auth_sessions.id'], ondelete='CASCADE', name=op.f('fk_refresh_tokens_session_id_auth_sessions')),
        sa.UniqueConstraint('token_hash', name=op.f('uq_refresh_tokens_token_hash')),
        sa.CheckConstraint("token_hash ~ '^[0-9a-f]{64}$'", name=op.f('ck_refresh_tokens_token_hash_format')),
    )
    op.create_index('ix_refresh_tokens_session_id', 'refresh_tokens', ['session_id'])


def downgrade() -> None:
    op.drop_index('ix_refresh_tokens_session_id', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_index('ix_auth_sessions_expires_at', table_name='auth_sessions')
    op.drop_index('ix_auth_sessions_user_id', table_name='auth_sessions')
    op.drop_table('auth_sessions')
