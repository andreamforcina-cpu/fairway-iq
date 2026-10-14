"""Real PostgreSQL tests reuse the rollback-only, isolated schema fixture."""
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api.auth import login_db, registration_db
from backend.main import app
from backend.models import User
from backend.tests.test_database_integration import connection  # noqa: F401


def test_registration_then_login_on_postgresql(connection):
    def test_db():
        with Session(bind=connection, join_transaction_mode='create_savepoint') as session:
            yield session

    app.dependency_overrides[login_db] = test_db
    app.dependency_overrides[registration_db] = test_db
    payload = {'full_name': 'Test Golfer', 'email': 'golfer@example.com', 'password': 'IntegrationPassword123!'}
    try:
        with TestClient(app) as client:
            assert client.post('/auth/register', json=payload).status_code == 201
            login = {'email': ' GOLFER@EXAMPLE.COM ', 'password': payload['password']}
            result = client.post('/auth/login', json=login)
            assert result.status_code == 200
            assert set(result.json()) == {'message'}
            assert not result.cookies
            for invalid in [{**login, 'password': 'wrong'}, {**login, 'email': 'unknown@example.com'}]:
                result = client.post('/auth/login', json=invalid)
                assert result.status_code == 401
                assert result.json() == {'detail': 'Invalid email or password.'}
            with Session(bind=connection, join_transaction_mode='create_savepoint') as session:
                account = session.scalar(select(User))
                assert account.email == payload['email']
                account.is_active = False
                session.commit()
            assert client.post('/auth/login', json=login).status_code == 401
    finally:
        app.dependency_overrides.pop(login_db, None)
        app.dependency_overrides.pop(registration_db, None)
