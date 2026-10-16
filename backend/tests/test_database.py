from io import StringIO
from pathlib import Path
from uuid import UUID

import pytest
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from pydantic import ValidationError
from sqlalchemy import CheckConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from backend.core.config import Settings
from backend.db.session import build_engine
from backend.models import User

ROOT = Path(__file__).resolve().parents[1]


def migration_config() -> Config:
    config = Config(str(ROOT / 'alembic.ini'))
    config.attributes['settings'] = Settings(_env_file=None, database_url='postgresql://test_user:test_password@localhost/fairway_iq_test')
    return config


@pytest.mark.parametrize('url', ['postgresql://localhost/fairway_iq_test', 'postgres://localhost/fairway_iq_test', 'postgresql+psycopg://localhost/fairway_iq_test'])
def test_postgresql_configuration(url):
    settings = Settings(_env_file=None, database_url=url)
    assert settings.sqlalchemy_url.drivername == 'postgresql+psycopg'
    assert settings.sqlalchemy_url.database == 'fairway_iq_test'


@pytest.mark.parametrize('url', ['', 'not-a-url', 'sqlite:///test.db', 'postgresql://localhost', 'postgresql+asyncpg://localhost/test', 'postgresql://localhost:99999/test'])
def test_configuration_rejects_invalid_urls_without_exposing_input(url):
    with pytest.raises(ValidationError) as caught:
        Settings(_env_file=None, database_url=url)
    assert 'input_value=' not in str(caught.value)


def test_missing_configuration(monkeypatch):
    monkeypatch.delenv('DATABASE_URL', raising=False)
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_settings_repr_and_engine_creation_do_not_connect():
    settings = Settings(_env_file=None, database_url='postgresql://test_user:synthetic_secret@localhost/fairway_iq_test')
    assert 'synthetic_secret' not in repr(settings)
    engine = build_engine(settings)
    assert engine.echo is False
    assert engine.hide_parameters is True
    assert engine.pool.checkedout() == 0
    engine.dispose()


def test_user_metadata_and_email_normalization():
    table = User.__table__
    assert set(table.columns.keys()) == {'id', 'email', 'password_hash', 'full_name', 'is_active', 'created_at', 'updated_at'}
    assert all(not column.nullable for column in table.columns)
    assert table.c.id.primary_key and table.c.id.type.python_type is UUID
    assert table.c.created_at.type.timezone and table.c.updated_at.type.timezone
    assert table.c.is_active.default.arg is True
    assert table.c.updated_at.onupdate is not None
    assert any(index.unique and list(index.columns.keys()) == ['email'] for index in table.indexes)
    checks = {constraint.name for constraint in table.constraints if isinstance(constraint, CheckConstraint)}
    assert checks == {'ck_users_email_normalized', 'ck_users_full_name_nonempty', 'ck_users_password_hash_argon2id'}
    assert User(email='  TEST@EXAMPLE.COM  ').email == 'test@example.com'
    assert 'password' not in table.columns
    assert 'TIMESTAMP WITH TIME ZONE' in str(CreateTable(table).compile(dialect=postgresql.dialect()))


def test_initial_migration_metadata_and_offline_sql():
    config = migration_config()
    scripts = ScriptDirectory.from_config(config)
    assert scripts.get_heads() == ['0003_create_golf_rounds']
    assert scripts.get_revision('0001_create_users').down_revision is None
    assert scripts.get_revision('0002_create_auth_sessions').down_revision == '0001_create_users'
    assert scripts.get_revision('head').down_revision == '0002_create_auth_sessions'
    sql = StringIO()
    config.output_buffer = sql
    command.upgrade(config, 'head', sql=True)
    output = sql.getvalue()
    for expected in ['CREATE TABLE users', 'UUID', 'TIMESTAMP WITH TIME ZONE', 'CREATE UNIQUE INDEX ix_users_email', 'CREATE TRIGGER users_updated_at', 'password_hash_argon2id']:
        assert expected in output
    assert 'test_password' not in output
