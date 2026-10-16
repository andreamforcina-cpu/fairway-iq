"""Round contracts and HTTP/service boundaries; DB access is mocked, not PostgreSQL."""
from copy import deepcopy
from datetime import datetime, timezone
from io import StringIO
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import UUID, uuid4

import pytest
from alembic import command
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import OperationalError

from backend.api import rounds as routes
from backend.api.sessions import current_user, session_db
from backend.main import app
from backend.models import GolfRound, HoleScore
from backend.schemas.rounds import RoundCreate
from backend.services import rounds as service
from backend.tests.test_database import migration_config


def payload(planned=9, played=None):
    return {'submission_id': str(uuid4()), 'course_name': ' Test course ', 'planned_holes': planned,
            'completed_at': '2026-10-16T12:00:00Z',
            'holes': [{'number': n, 'par': 4, 'strokes': 5, 'putts': 2} for n in range(1, (played or planned) + 1)]}


def record_for(data, owner=None):
    return GolfRound(id=uuid4(), user_id=owner or uuid4(), submission_id=data.submission_id,
                     request_hash=service.request_hash(data), course_name=data.course_name,
                     planned_holes=data.planned_holes, played_holes=len(data.holes), completed_at=data.completed_at,
                     created_at=datetime(2026, 10, 16, 13, tzinfo=timezone.utc),
                     holes=[HoleScore(id=uuid4(), **hole.model_dump()) for hole in data.holes])


@pytest.mark.parametrize('planned,played', [(9, 9), (18, 18), (9, 1), (9, 3), (18, 9), (18, 17)])
def test_round_contract_and_derived_totals(planned, played):
    data = RoundCreate.model_validate(payload(planned, played))
    result = service.response_for(record_for(data))
    assert result.course_name == 'Test course'
    assert result.played_holes == played
    assert result.status == ('complete' if played == planned else 'early_finished')
    assert (result.strokes, result.par, result.putts, result.relative_to_par) == (played * 5, played * 4, played * 2, played)
    assert 'user_id' not in result.model_dump()
    assert 'request_hash' not in result.model_dump()


@pytest.mark.parametrize('field,value', [('number', 0), ('number', 19), ('number', True), ('number', '1'),
                                       ('par', 0), ('par', 7), ('par', 4.0), ('strokes', 0), ('strokes', 31),
                                       ('strokes', '5'), ('putts', -1), ('putts', 6), ('putts', False)])
def test_hole_validation_is_strict(field, value):
    body = payload(); body['holes'][0][field] = value
    with pytest.raises(ValidationError):
        RoundCreate.model_validate(body)


@pytest.mark.parametrize('change', [
    lambda b: b.update(planned_holes=10), lambda b: b.update(planned_holes='9'),
    lambda b: b.update(holes=[]), lambda b: b['holes'].append(b['holes'][-1]),
    lambda b: b['holes'][1].update(number=1), lambda b: b['holes'][1].update(number=3),
    lambda b: b['holes'][0].update(user_id=str(uuid4())),
    lambda b: b.update(user_id=str(uuid4())), lambda b: b.update(status='complete'),
    lambda b: b.update(played_holes=9), lambda b: b.update(course_name=' '),
    lambda b: b.update(course_name='x' * 101), lambda b: b.update(course_name='A\u200bB'),
    lambda b: b.update(completed_at='2026-10-16T12:00:00'), lambda b: b.update(completed_at=123),
    lambda b: b.update(completed_at=True), lambda b: b.update(submission_id='invalid'),
])
def test_inconsistent_or_untrusted_round_is_rejected(change):
    body = payload(); change(body)
    with pytest.raises(ValidationError):
        RoundCreate.model_validate(body)


def test_fingerprint_is_canonical_but_changes_with_scores():
    body = payload(); first = RoundCreate.model_validate(body)
    retry = {**body, 'course_name': 'Test course', 'completed_at': '2026-10-16T14:00:00+02:00'}
    assert service.request_hash(first) == service.request_hash(RoundCreate.model_validate(retry))
    changed = deepcopy(body); changed['holes'][0]['strokes'] = 6
    assert service.request_hash(first) != service.request_hash(RoundCreate.model_validate(changed))


@pytest.fixture
def api():
    db = MagicMock(); owner = uuid4()
    app.dependency_overrides[current_user] = lambda: SimpleNamespace(id=owner)
    app.dependency_overrides[session_db] = lambda: db
    try:
        with TestClient(app) as client:
            yield client, db, owner
    finally:
        app.dependency_overrides.pop(current_user, None)
        app.dependency_overrides.pop(session_db, None)


@pytest.mark.parametrize('created,status', [(True, 201), (False, 200)])
def test_submit_uses_authenticated_owner_and_commits_before_success(api, monkeypatch, created, status):
    client, db, owner = api; body = payload()
    record = record_for(RoundCreate.model_validate(body), owner)
    create = MagicMock(return_value=(record, created)); monkeypatch.setattr(routes, 'create_round', create)
    response = client.post('/rounds', json=body)
    assert response.status_code == status
    assert create.call_args.args[1] == owner
    db.commit.assert_called_once()
    assert response.headers['Cache-Control'] == 'no-store'
    assert response.json()['strokes'] == 45
    assert 'user_id' not in response.json() and 'request_hash' not in response.json()


def test_invalid_body_is_redacted_and_does_not_touch_storage(api):
    client, db, _ = api
    response = client.post('/rounds', json={**payload(), 'private-marker': 'synthetic-private-value'})
    assert response.status_code == 422
    assert response.json() == {'detail': 'Invalid round data.'}
    assert 'private-marker' not in response.text
    db.scalar.assert_not_called(); db.commit.assert_not_called()


@pytest.mark.parametrize('path', ['/rounds', '/rounds/' + str(uuid4())])
def test_history_and_detail_queries_are_owner_scoped(api, path):
    client, db, owner = api
    db.scalar.return_value = None; db.scalars.return_value = []
    response = client.get(path)
    assert response.status_code == (200 if path == '/rounds' else 404)
    stmt = db.scalars.call_args.args[0] if path == '/rounds' else db.scalar.call_args.args[0]
    compiled = stmt.compile(dialect=postgresql.dialect())
    assert compiled.params['user_id_1'] == owner
    assert 'golf_rounds.user_id =' in str(compiled)


def test_detail_and_unknown_round_response(api):
    client, db, owner = api
    record = record_for(RoundCreate.model_validate(payload(18, 3)), owner)
    db.scalar.return_value = record
    result = client.get('/rounds/' + str(record.id))
    assert result.status_code == 200 and result.json()['played_holes'] == 3
    db.scalar.return_value = None
    assert client.get('/rounds/' + str(uuid4())).json() == {'detail': 'Round not found.'}


@pytest.mark.parametrize('query', ['limit=0', 'limit=101', 'limit=x', 'cursor=bad', 'cursor='])
def test_invalid_pagination_is_safe(api, query):
    client, db, _ = api
    response = client.get('/rounds?' + query)
    assert response.status_code == 422
    assert response.headers['Cache-Control'] == 'no-store'
    db.scalars.assert_not_called()


@pytest.mark.parametrize('phase', ['query', 'commit'])
def test_database_failure_never_returns_success_or_private_details(api, monkeypatch, phase):
    client, db, owner = api; body = payload()
    if phase == 'query':
        db.scalar.side_effect = OperationalError('synthetic-query', {}, Exception('synthetic-private'))
    else:
        monkeypatch.setattr(routes, 'create_round', lambda *_: (record_for(RoundCreate.model_validate(body), owner), True))
        db.commit.side_effect = OperationalError('synthetic-query', {}, Exception('synthetic-private'))
    response = client.post('/rounds', json=body)
    assert response.status_code == 503
    assert response.json() == {'detail': 'Round storage is temporarily unavailable.'}
    assert 'synthetic' not in response.text
    db.rollback.assert_called_once()


def test_idempotent_insert_and_conflicting_retry(api):
    client, db, owner = api; body = payload(); data = RoundCreate.model_validate(body)
    record = record_for(data, owner)
    db.scalar.side_effect = [record.id, record]
    assert client.post('/rounds', json=body).status_code == 201
    assert len(db.add_all.call_args.args[0]) == 9
    insert_sql = db.scalar.call_args_list[0].args[0].compile(dialect=postgresql.dialect())
    assert 'ON CONFLICT ON CONSTRAINT uq_golf_rounds_owner_submission DO NOTHING' in str(insert_sql)
    assert insert_sql.params['user_id'] == owner
    db.reset_mock(); db.scalar.side_effect = [None, record]
    assert client.post('/rounds', json=body).status_code == 200
    db.add_all.assert_not_called()
    changed = deepcopy(body); changed['holes'][0]['strokes'] = 6
    db.scalar.side_effect = [None, record]
    response = client.post('/rounds', json=changed)
    assert response.status_code == 409
    db.rollback.assert_called_once()


def test_keyset_pagination_has_stable_tie_breaker_and_bounded_fetch(api):
    client, db, owner = api
    first, second = (record_for(RoundCreate.model_validate(payload()), owner) for _ in range(2))
    first.id, second.id = UUID(int=2), UUID(int=1)
    db.scalars.return_value = [first, second]
    result = client.get('/rounds?limit=1')
    assert result.status_code == 200 and len(result.json()['items']) == 1
    cursor = result.json()['next_cursor']
    assert service.decode_cursor(cursor) == (first.created_at, first.id)
    db.scalars.return_value = [second]
    next_page = client.get('/rounds', params={'limit': 1, 'cursor': cursor})
    assert next_page.json()['items'][0]['id'] == str(second.id)
    assert next_page.json()['next_cursor'] is None
    compiled = db.scalars.call_args.args[0].compile(dialect=postgresql.dialect())
    assert compiled.params['user_id_1'] == owner
    assert 'created_at DESC, golf_rounds.id DESC' in str(compiled)
    assert compiled.params['param_1'] == 2


@pytest.mark.parametrize('method,path', [('POST', '/rounds'), ('GET', '/rounds'), ('GET', '/rounds/' + str(uuid4()))])
def test_real_auth_dependency_denies_missing_credentials(method, path):
    with TestClient(app) as client:
        result = client.request(method, path, json=payload() if method == 'POST' else None)
    assert result.status_code == 401
    assert result.headers['WWW-Authenticate'] == 'Bearer'
    assert result.headers['Cache-Control'] == 'no-store'


def test_migration_is_prepared_offline_and_models_have_constraints():
    config = migration_config(); buffer = StringIO(); config.output_buffer = buffer
    command.upgrade(config, '0003_create_golf_rounds', sql=True)
    sql = buffer.getvalue()
    for fragment in ['CREATE TABLE golf_rounds', 'CREATE TABLE hole_scores', 'uq_golf_rounds_owner_submission',
                     'uq_hole_scores_round_number', 'ON DELETE CASCADE', 'ix_golf_rounds_owner_history']:
        assert fragment in sql
    assert GolfRound.__table__.c.user_id.foreign_keys
    assert HoleScore.__table__.c.round_id.foreign_keys
    assert GolfRound.__table__.c.id.type.python_type is UUID


@pytest.mark.parametrize('change', ['empty', 'count', 'sequence', 'planned'])
def test_corrupt_stored_round_returns_safe_unavailable(api, change):
    client, db, owner = api
    record = record_for(RoundCreate.model_validate(payload(9, 2)), owner)
    if change == 'empty':
        record.holes = []
        record.played_holes = 0
    elif change == 'count':
        record.played_holes = 3
    elif change == 'sequence':
        record.holes[1].number = 3
    else:
        record.planned_holes = 10
    db.scalar.return_value = record
    result = client.get('/rounds/' + str(record.id))
    assert result.status_code == 503
    assert result.json() == {'detail': 'Round storage is temporarily unavailable.'}
    db.rollback.assert_called_once()


@pytest.mark.parametrize('path', ['/rounds', '/rounds/' + str(uuid4())])
def test_read_database_failure_is_safe(api, path):
    client, db, _ = api
    db.scalar.side_effect = db.scalars.side_effect = OperationalError('synthetic', {}, Exception('private'))
    result = client.get(path)
    assert result.status_code == 503
    assert result.json() == {'detail': 'Round storage is temporarily unavailable.'}
    db.rollback.assert_called_once()
