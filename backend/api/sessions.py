"""Opaque-token sessions; preserves the existing credential-only /auth/login API."""
from collections.abc import Iterator
from contextlib import contextmanager

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.api.auth import rollback_safely, verify_login_credentials
from backend.db.session import get_db
from backend.models import User
from backend.schemas.auth import LoginRequest, RegistrationResponse
from backend.schemas.sessions import RefreshRequest, TokenResponse
from backend.security.tokens import valid_token
from backend.services.sessions import authenticated_user, create_session, revoke_session, rotate_session

router = APIRouter(prefix='/auth', tags=['Sessions'])
bearer = HTTPBearer(auto_error=False)


def session_db() -> Iterator[Session]:
    try:
        yield from get_db()
    except (SQLAlchemyError, ValidationError):
        raise HTTPException(503, 'Authentication is temporarily unavailable.') from None


@contextmanager
def safe_operation(db: Session):
    try:
        yield
    except SQLAlchemyError:
        rollback_safely(db)
        raise HTTPException(503, 'Authentication is temporarily unavailable.') from None


def no_store(response: Response) -> None:
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Pragma'] = 'no-cache'


def unauthorized() -> HTTPException:
    return HTTPException(401, 'Invalid or expired session.', headers={'WWW-Authenticate': 'Bearer', 'Cache-Control': 'no-store'})


@router.post('/token', response_model=TokenResponse)
def token(data: LoginRequest, response: Response, db: Session = Depends(session_db)) -> TokenResponse:
    with safe_operation(db):
        account = verify_login_credentials(data, db)
        result = create_session(db, account.id)
        db.commit()
    no_store(response)
    return result


@router.post('/refresh', response_model=TokenResponse)
def refresh(data: RefreshRequest, response: Response, db: Session = Depends(session_db)) -> TokenResponse:
    with safe_operation(db):
        result = rotate_session(db, data.refresh_token.get_secret_value())
        # Includes replay-triggered revocation. Never roll it back with the 401.
        db.commit()
    if result is None:
        raise unauthorized()
    no_store(response)
    return result


@router.post('/logout', status_code=204)
def logout(data: RefreshRequest, db: Session = Depends(session_db)) -> Response:
    # Idempotent for validly shaped unknown/already revoked tokens; no account oracle.
    with safe_operation(db):
        revoke_session(db, data.refresh_token.get_secret_value())
        db.commit()
    return Response(status_code=204, headers={'Cache-Control': 'no-store'})


def access_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if credentials is None or not valid_token(credentials.credentials, 'access'):
        raise unauthorized()
    return credentials.credentials


def current_user(access: str = Depends(access_token), db: Session = Depends(session_db)) -> User:
    with safe_operation(db):
        user = authenticated_user(db, access)
    if user is None:
        raise unauthorized()
    return user


@router.get('/me', response_model=RegistrationResponse)
def me(response: Response, user: User = Depends(current_user)) -> RegistrationResponse:
    no_store(response)
    return RegistrationResponse.model_validate(user)
