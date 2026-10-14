from fastapi.testclient import TestClient
from backend.main import app


def test_existing_endpoints_work_without_database(monkeypatch):
    monkeypatch.delenv('DATABASE_URL', raising=False)
    with TestClient(app) as client:
        assert client.get('/').json() == {'message': 'Welcome to FAIRWAY IQ', 'status': 'running'}
        assert client.get('/health').json() == {'status': 'healthy'}
