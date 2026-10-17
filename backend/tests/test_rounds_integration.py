"""Real PostgreSQL round tests, using the existing guarded rollback-only schema fixture."""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.api.sessions import session_db
from backend.main import app
from backend.models import GolfRound, HoleScore, User
from backend.security.passwords import hash_password
from backend.services.sessions import create_session
from backend.tests.test_database_integration import connection  # noqa: F401
from backend.tests.test_rounds import payload


class RoundAPI:
    def __init__(self, client, headers, owners):
        self.client = client
        self._tokens = headers
        self.owners = owners

    def __repr__(self):
        return '<RoundAPI credentials withheld>'

    def request(self, account, method, path, **kwargs):
        headers = {'Authorization': 'Bearer ' + self._tokens[account].get_secret_value()}
        return self.client.request(method, path, headers=headers, **kwargs)


@pytest.fixture
def api(connection):
    def test_db():
        with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
            yield db
    tokens, owners = {}, {}
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        for name in ['first', 'second']:
            user = User(email=name + '@example.com', full_name='Synthetic Golfer',
                        password_hash=hash_password('Synthetic integration passphrase'))
            db.add(user); db.flush()
            pair = create_session(db, user.id)
            tokens[name] = SecretStr(pair.access_token)
            owners[name] = user.id
        db.commit()
    app.dependency_overrides[session_db] = test_db
    try:
        with TestClient(app) as client:
            yield RoundAPI(client, tokens, owners)
    finally:
        app.dependency_overrides.pop(session_db, None)


@pytest.mark.parametrize('planned,played', [(9, 9), (18, 18), (9, 3), (18, 1)])
def test_save_and_retrieve_real_round(api, connection, planned, played):
    body = payload(planned, played)
    created = api.request('first', 'POST', '/rounds', json=body)
    assert created.status_code == 201
    data = created.json()
    fetched = api.request('first', 'GET', '/rounds/' + data['id'])
    assert fetched.status_code == 200 and fetched.json() == data
    assert data['played_holes'] == played and data['strokes'] == played * 5
    assert data['status'] == ('complete' if planned == played else 'early_finished')
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        saved = db.get(GolfRound, UUID(data['id']))
        assert saved.user_id == api.owners['first']
        assert db.scalar(select(func.count()).select_from(HoleScore)) == played


def test_other_account_cannot_read_or_list_round_and_has_independent_submission_namespace(api):
    body = payload()
    first = api.request('first', 'POST', '/rounds', json=body).json()
    foreign = api.request('second', 'GET', '/rounds/' + first['id'])
    unknown = api.request('second', 'GET', '/rounds/' + str(uuid4()))
    assert foreign.status_code == unknown.status_code == 404
    assert foreign.json() == unknown.json()
    assert api.request('second', 'GET', '/rounds').json()['items'] == []
    second = api.request('second', 'POST', '/rounds', json=body)
    assert second.status_code == 201 and second.json()['id'] != first['id']
    assert len(api.request('first', 'GET', '/rounds').json()['items']) == 1
    assert len(api.request('second', 'GET', '/rounds').json()['items']) == 1


def test_replay_and_payload_conflict_do_not_duplicate_holes(api, connection):
    body = payload(9, 2)
    first = api.request('first', 'POST', '/rounds', json=body)
    replay = api.request('first', 'POST', '/rounds', json=body)
    assert first.status_code == 201 and replay.status_code == 200
    assert replay.json() == first.json()
    changed = deepcopy(body); changed['holes'][0]['strokes'] = 6
    assert api.request('first', 'POST', '/rounds', json=changed).status_code == 409
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        assert db.scalar(select(func.count()).select_from(GolfRound)) == 1
        assert db.scalar(select(func.count()).select_from(HoleScore)) == 2


def test_history_pagination_with_timestamp_ties_and_new_insert(api, connection):
    ids = []
    for _ in range(4):
        created = api.request('first', 'POST', '/rounds', json=payload()).json()
        ids.append(created['id'])
    tied = datetime(2026, 10, 16, 13, tzinfo=timezone.utc)
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        for record in db.scalars(select(GolfRound)):
            record.created_at = tied
        db.commit()
    first = api.request('first', 'GET', '/rounds?limit=2').json()
    assert len(first['items']) == 2 and first['next_cursor']
    # A newly received row is newer, so it cannot shift the remaining cursor page.
    newer = api.request('first', 'POST', '/rounds', json=payload()).json()
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        db.get(GolfRound, UUID(newer['id'])).created_at = tied + timedelta(seconds=1)
        db.commit()
    second = api.request('first', 'GET', '/rounds', params={'limit': 2, 'cursor': first['next_cursor']}).json()
    seen = [row['id'] for row in first['items'] + second['items']]
    assert seen == sorted(ids, reverse=True)
    assert second['next_cursor'] is None
    # A cursor is only a position, never authority to see the cursor owner's data.
    assert api.request('second', 'GET', '/rounds', params={'cursor': first['next_cursor']}).json()['items'] == []


def test_hole_insert_failure_rolls_back_parent_and_allows_retry(api, connection, monkeypatch):
    original = Session.flush
    def failed_hole_write(db, *args, **kwargs):
        if any(isinstance(item, HoleScore) for item in db.new):
            raise IntegrityError('synthetic-only', {}, Exception('synthetic-private'))
        return original(db, *args, **kwargs)
    monkeypatch.setattr(Session, 'flush', failed_hole_write)
    body = payload()
    response = api.request('first', 'POST', '/rounds', json=body)
    assert response.status_code == 503 and 'synthetic' not in response.text
    monkeypatch.setattr(Session, 'flush', original)
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        assert db.scalar(select(func.count()).select_from(GolfRound)) == 0
        assert db.scalar(select(func.count()).select_from(HoleScore)) == 0
    assert api.request('first', 'POST', '/rounds', json=body).status_code == 201


def test_database_constraints_and_round_delete_cascade(api, connection):
    created = api.request('first', 'POST', '/rounds', json=payload(9, 1)).json()
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        original = db.scalar(select(HoleScore))
        for change in [{'number': 0}, {'par': 7}, {'strokes': 0}, {'putts': 6}, {'number': 1}]:
            values = {'round_id': UUID(created['id']), 'number': 2, 'par': 4, 'strokes': 5, 'putts': 2, **change}
            with pytest.raises(IntegrityError):
                with db.begin_nested():
                    db.add(HoleScore(**values)); db.flush()
        assert original is not None
        db.delete(db.get(GolfRound, UUID(created['id']))); db.flush()
        assert db.scalar(select(func.count()).select_from(HoleScore)) == 0


@pytest.mark.parametrize('conflicting', [False, True])
def test_concurrent_submission_key_has_one_committed_round(connection, conflicting):
    """Independent connections need their own committed fixtures in a guarded test schema."""
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    from alembic import command
    from sqlalchemy import text
    from backend.schemas.rounds import RoundCreate
    from backend.services.rounds import SubmissionConflict, create_round
    from backend.tests.test_database import migration_config

    engine = connection.engine
    assert engine.url.database.startswith('fairway_iq_test')
    schema = 'round_race_' + uuid4().hex
    owner = uuid4()
    body = payload(9, 3)
    changed = deepcopy(body)
    if conflicting:
        changed['holes'][0]['strokes'] = 6
    inputs = [RoundCreate.model_validate(body), RoundCreate.model_validate(changed)]
    try:
        with engine.begin() as setup:
            setup.execute(text(f'CREATE SCHEMA "{schema}"'))
            setup.execute(text(f'SET LOCAL search_path TO "{schema}"'))
            config = migration_config(); config.attributes['connection'] = setup
            command.upgrade(config, 'head')
            setup.execute(User.__table__.insert().values(id=owner, email='race@example.com',
                          full_name='Synthetic Golfer', password_hash='$argon2id$synthetic-test-only'))
        barrier = Barrier(2)
        def submit(data):
            with engine.connect() as conn:
                with Session(bind=conn) as db:
                    db.execute(text(f'SET LOCAL search_path TO "{schema}"'))
                    db.execute(text("SET LOCAL lock_timeout TO '5s'"))
                    db.execute(text("SET LOCAL statement_timeout TO '10s'"))
                    barrier.wait(timeout=5)
                    try:
                        record, created = create_round(db, owner, data)
                        identifier = record.id
                        db.commit()
                        return identifier, created
                    except SubmissionConflict:
                        db.rollback()
                        return 'conflict', False
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(submit, inputs))
        assert sum(created for _, created in results) == 1
        if conflicting:
            assert sum(identifier == 'conflict' for identifier, _ in results) == 1
        else:
            assert results[0][0] == results[1][0]
        with engine.begin() as check:
            check.execute(text(f'SET LOCAL search_path TO "{schema}"'))
            assert check.scalar(select(func.count()).select_from(GolfRound)) == 1
            assert check.scalar(select(func.count()).select_from(HoleScore)) == 3
    finally:
        with engine.begin() as cleanup:
            cleanup.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))


def test_account_throttle_preserves_idempotent_retry_and_other_owner(api, connection, monkeypatch):
    from backend.api import rounds as routes
    from backend.security.round_limits import ROUND_ACCOUNT_LIMITS, RoundRateLimiter

    now = [0.0]
    monkeypatch.setattr(routes, 'round_account_limiter', RoundRateLimiter(ROUND_ACCOUNT_LIMITS, clock=lambda: now[0]))
    body = payload(9, 3)
    first = api.request('first', 'POST', '/rounds', json=body)
    assert first.status_code == 201
    for _ in range(ROUND_ACCOUNT_LIMITS['write'] - 1):
        replay = api.request('first', 'POST', '/rounds', json=body)
        assert replay.status_code == 200 and replay.json()['id'] == first.json()['id']
    blocked = api.request('first', 'POST', '/rounds', json=body)
    assert blocked.status_code == 429 and blocked.headers['Retry-After'] == '60'
    assert blocked.headers['Cache-Control'] == 'no-store'
    with Session(bind=connection, join_transaction_mode='create_savepoint') as db:
        assert db.scalar(select(func.count()).select_from(GolfRound)) == 1
        assert db.scalar(select(func.count()).select_from(HoleScore)) == 3
    # Quotas belong to the authenticated owner, independent of the shared peer address.
    assert api.request('second', 'POST', '/rounds', json=body).status_code == 201
    now[0] = 60
    retry = api.request('first', 'POST', '/rounds', json=body)
    assert retry.status_code == 200 and retry.json()['id'] == first.json()['id']
