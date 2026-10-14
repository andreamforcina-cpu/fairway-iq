"""Opt-in PostgreSQL tests; never use DATABASE_URL as the test target."""
import os
from uuid import uuid4

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.core.config import Settings
from backend.db.base import Base
from backend.db.session import build_engine
from backend.models import User
from backend.tests.test_database import migration_config


@pytest.fixture
def connection():
    raw = os.getenv('TEST_DATABASE_URL')
    if not raw:
        pytest.skip('Set TEST_DATABASE_URL to an isolated fairway_iq_test database.')
    settings = Settings(_env_file=None, database_url=raw)
    if not settings.sqlalchemy_url.database.startswith('fairway_iq_test'):
        pytest.fail('Refusing integration tests: database name must start with fairway_iq_test.')
    if os.getenv('DATABASE_URL'):
        production = Settings(_env_file=None, database_url=os.environ['DATABASE_URL'])
        if production.sqlalchemy_url.database == settings.sqlalchemy_url.database:
            pytest.fail('TEST_DATABASE_URL must use a distinct database from DATABASE_URL.')
    engine = build_engine(settings)
    schema = 'test_' + uuid4().hex
    try:
        with engine.connect() as conn:
            transaction = conn.begin()
            try:
                conn.execute(text(f'CREATE SCHEMA "{schema}"'))
                conn.execute(text(f'SET LOCAL search_path TO "{schema}"'))
                config = migration_config()
                config.attributes['connection'] = conn
                command.upgrade(config, 'head')
                yield conn
            finally:
                # Rolls back only this transaction and its newly created schema.
                transaction.rollback()
    finally:
        engine.dispose()


HASH = '$argon2id$test-fixture-not-a-real-password-hash'


def test_constraints_and_defaults(connection):
    with Session(bind=connection, join_transaction_mode='create_savepoint') as session:
        user = User(email='TEST@example.test', full_name='Test Golfer', password_hash=HASH)
        session.add(user)
        session.flush()
        assert user.id and user.is_active
        assert user.created_at.tzinfo and user.updated_at.tzinfo
        for values in [
            {'email': 'test@example.test', 'full_name': 'Duplicate', 'password_hash': HASH},
            {'email': 'other@example.test', 'full_name': ' ', 'password_hash': HASH},
            {'email': 'other@example.test', 'full_name': 'Test', 'password_hash': 'plaintext'},
            {'email': None, 'full_name': 'Test', 'password_hash': HASH},
            {'email': 'other@example.test', 'full_name': 'Test', 'password_hash': None},
            {'email': 'other@example.test', 'full_name': None, 'password_hash': HASH},
        ]:
            with pytest.raises(IntegrityError):
                with session.begin_nested():
                    session.execute(User.__table__.insert().values(**values))


def test_migration_matches_orm_metadata(connection):
    context = MigrationContext.configure(connection, opts={'compare_type': True})
    assert compare_metadata(context, Base.metadata) == []


def test_database_trigger_updates_timestamp(connection):
    with Session(bind=connection, join_transaction_mode='create_savepoint') as session:
        user = User(email='trigger@example.test', full_name='Test', password_hash=HASH)
        session.add(user)
        session.flush()
        connection.execute(text("UPDATE users SET full_name = 'Updated', updated_at = '2000-01-01' WHERE id = :id"), {'id': user.id})
        session.expire(user)
        assert user.updated_at.year != 2000
