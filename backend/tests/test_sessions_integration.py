"""Real PostgreSQL session lifecycle in an isolated rollback-only schema."""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.auth import registration_db
from backend.api.sessions import session_db
from backend.main import app
from backend.models import AuthSession, RefreshToken, User
from backend.security.tokens import new_token
from backend.services import sessions
from backend.tests.test_database_integration import connection  # noqa: F401

CREDENTIALS = {'email': 'sessions@example.com', 'password': 'IntegrationPassword123!'}


@pytest.fixture
def api(connection):
    def test_db():
        with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
            yield db

    app.dependency_overrides[session_db] = test_db
    app.dependency_overrides[registration_db] = test_db
    try:
        with TestClient(app) as client:
            assert client.post('/auth/register', json={**CREDENTIALS, 'full_name': 'Test Golfer'}).status_code == 201
            yield client
    finally:
        app.dependency_overrides.pop(session_db, None)
        app.dependency_overrides.pop(registration_db, None)


def issued(api):
    response = api.post('/auth/token', json=CREDENTIALS)
    assert response.status_code == 200
    assert response.headers['Cache-Control'] == 'no-store'
    assert not response.cookies
    result = response.json()
    assert set(result) == {'access_token', 'refresh_token', 'token_type', 'expires_in', 'refresh_expires_in'}
    assert result['token_type'] == 'bearer'
    assert result['expires_in'] == 900
    assert result['refresh_expires_in'] == 2592000
    return result


def profile(api, pair):
    return api.get('/auth/me', headers={'Authorization': 'Bearer ' + pair['access_token']})


def test_issue_profile_and_hash_only_storage(api, connection):
    pair = issued(api)
    result = profile(api, pair)
    assert result.status_code == 200
    assert set(result.json()) == {'id', 'full_name', 'email', 'created_at'}
    assert result.json()['email'] == CREDENTIALS['email']
    assert CREDENTIALS['password'] not in result.text
    assert pair['access_token'] not in result.text
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        record = db.scalar(select(AuthSession))
        refresh = db.scalar(select(RefreshToken))
        assert len(record.access_hash) == len(refresh.token_hash) == 64
        assert record.access_hash != pair['access_token']
        assert refresh.token_hash != pair['refresh_token']


def test_rotation_and_replay_revoke_entire_session(api):
    first = issued(api)
    response = api.post('/auth/refresh', json={'refresh_token': first['refresh_token']})
    assert response.status_code == 200
    second = response.json()
    assert first['refresh_token'] != second['refresh_token']
    assert first['access_token'] != second['access_token']
    assert profile(api, first).status_code == 401
    assert profile(api, second).status_code == 200
    replay = api.post('/auth/refresh', json={'refresh_token': first['refresh_token']})
    assert replay.status_code == 401
    assert profile(api, second).status_code == 401
    assert api.post('/auth/refresh', json={'refresh_token': second['refresh_token']}).status_code == 401


def test_logout_idempotent_and_does_not_revoke_other_sessions(api):
    first, other = issued(api), issued(api)
    for _ in range(2):
        response = api.post('/auth/logout', json={'refresh_token': first['refresh_token']})
        assert response.status_code == 204 and response.content == b''
    assert profile(api, first).status_code == 401
    assert api.post('/auth/refresh', json={'refresh_token': first['refresh_token']}).status_code == 401
    assert profile(api, other).status_code == 200
    assert api.post('/auth/logout', json={'refresh_token': new_token('refresh')}).status_code == 204


def test_access_expiry_and_refresh_absolute_expiry(api, monkeypatch):
    first = issued(api)
    now = sessions.utcnow()
    monkeypatch.setattr(sessions, 'utcnow', lambda: now + timedelta(minutes=16))
    assert profile(api, first).status_code == 401
    response = api.post('/auth/refresh', json={'refresh_token': first['refresh_token']})
    assert response.status_code == 200
    assert profile(api, response.json()).status_code == 200
    monkeypatch.setattr(sessions, 'utcnow', lambda: now + timedelta(days=31))
    assert profile(api, response.json()).status_code == 401
    assert api.post('/auth/refresh', json={'refresh_token': response.json()['refresh_token']}).status_code == 401


def test_refresh_cannot_extend_absolute_deadline(api, monkeypatch):
    first = issued(api)
    now = sessions.utcnow()
    monkeypatch.setattr(sessions, 'utcnow', lambda: now + timedelta(days=30) - timedelta(seconds=120))
    result = api.post('/auth/refresh', json={'refresh_token': first['refresh_token']})
    assert result.status_code == 200
    pair = result.json()
    assert 0 < pair['expires_in'] <= 120
    assert pair['expires_in'] == pair['refresh_expires_in']


def test_unknown_and_wrong_purpose_tokens_fail_closed(api):
    pair = issued(api)
    assert api.post('/auth/refresh', json={'refresh_token': new_token('refresh')}).status_code == 401
    assert api.post('/auth/refresh', json={'refresh_token': pair['access_token']}).status_code == 422
    assert api.get('/auth/me', headers={'Authorization': 'Bearer ' + pair['refresh_token']}).status_code == 401
    assert api.get('/auth/me', headers={'Authorization': 'Bearer ' + new_token('access')}).status_code == 401


def test_inactive_user_loses_access_and_refresh(api, connection):
    pair = issued(api)
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        user = db.scalar(select(User))
        user.is_active = False
        db.commit()
    assert profile(api, pair).status_code == 401
    assert api.post('/auth/refresh', json={'refresh_token': pair['refresh_token']}).status_code == 401
    assert api.post('/auth/token', json=CREDENTIALS).status_code == 401


def test_invalid_credentials_do_not_create_sessions(api, connection):
    for payload in [{**CREDENTIALS, 'password': 'wrong'}, {**CREDENTIALS, 'email': 'unknown@example.com'}]:
        result = api.post('/auth/token', json=payload)
        assert result.status_code == 401
        assert result.json() == {'detail': 'Invalid email or password.'}
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        assert db.scalar(select(AuthSession)) is None


def test_commit_failure_does_not_issue_or_persist_tokens(api, connection, monkeypatch):
    from sqlalchemy.exc import OperationalError
    original = Session.commit

    def fail_commit(db):
        raise OperationalError('private-query', {}, Exception('private-secret'))

    monkeypatch.setattr(Session, 'commit', fail_commit)
    result = api.post('/auth/token', json=CREDENTIALS)
    assert result.status_code == 503
    assert result.json() == {'detail': 'Authentication is temporarily unavailable.'}
    monkeypatch.setattr(Session, 'commit', original)
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        assert db.scalar(select(AuthSession)) is None


def test_concurrent_refresh_replay_is_serialized(connection):
    """Two real connections need committed fixtures, in a separately owned test schema."""
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    from uuid import uuid4
    from alembic import command
    from sqlalchemy import text
    from backend.security.passwords import hash_password
    from backend.tests.test_database import migration_config

    engine = connection.engine  # Existing guarded fairway_iq_test-only fixture.
    assert engine.url.database.startswith('fairway_iq_test')
    schema = 'session_race_' + uuid4().hex
    try:
        with engine.begin() as setup:
            setup.execute(text(f'CREATE SCHEMA "{schema}"'))
            setup.execute(text(f'SET LOCAL search_path TO "{schema}"'))
            config = migration_config()
            config.attributes['connection'] = setup
            command.upgrade(config, 'head')

        def transaction():
            conn = engine.connect()
            conn.execute(text(f'SET search_path TO "{schema}"'))
            conn.execute(text("SET lock_timeout TO '5s'"))
            conn.execute(text("SET statement_timeout TO '10s'"))
            conn.commit()
            return conn

        with transaction() as conn:
            with Session(bind=conn) as db:
                user = User(email='race@example.com', full_name='Test', password_hash=hash_password(CREDENTIALS['password']))
                db.add(user)
                db.flush()
                first = sessions.create_session(db, user.id)
                db.commit()
        barrier = Barrier(2)

        def refresh_once(_):
            with transaction() as conn:
                with Session(bind=conn) as db:
                    barrier.wait(timeout=5)
                    result = sessions.rotate_session(db, first.refresh_token)
                    db.commit()
                    return result

        with ThreadPoolExecutor(max_workers=2) as executor:
            outcomes = list(executor.map(refresh_once, range(2)))
        assert sum(result is not None for result in outcomes) == 1
        winner = next(result for result in outcomes if result is not None)
        with transaction() as conn:
            with Session(bind=conn) as db:
                record = db.scalar(select(AuthSession))
                assert record.revoked_at is not None
                assert sessions.authenticated_user(db, winner.access_token) is None
                assert sessions.rotate_session(db, winner.refresh_token) is None
    finally:
        # Only this random committed test schema is removed. No dev/public schema touched.
        with engine.begin() as cleanup:
            cleanup.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
