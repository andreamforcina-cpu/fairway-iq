"""Create users and database-maintained update timestamps."""
from alembic import op
import sqlalchemy as sa

revision = '0001_create_users'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('email', sa.String(254), nullable=False),
        sa.Column('password_hash', sa.String(512), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("email = lower(trim(email)) AND length(email) BETWEEN 3 AND 254 AND position('@' in email) > 1", name=op.f('ck_users_email_normalized')),
        sa.CheckConstraint('length(trim(full_name)) BETWEEN 1 AND 100', name=op.f('ck_users_full_name_nonempty')),
        sa.CheckConstraint("password_hash LIKE '$argon2id$%'", name=op.f('ck_users_password_hash_argon2id')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.execute('''CREATE FUNCTION fairway_users_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$''')
    op.execute('''CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION fairway_users_updated_at()''')


def downgrade() -> None:
    op.execute('DROP TRIGGER users_updated_at ON users')
    op.execute('DROP FUNCTION fairway_users_updated_at()')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
