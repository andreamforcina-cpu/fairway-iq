"""Registration and credential verification; no authenticated session or tokens are issued."""
from collections.abc import Iterator

from argon2.exceptions import HashingError
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models import User
from backend.schemas.auth import LoginRequest, LoginResponse, RegistrationRequest, RegistrationResponse
from backend.security.passwords import hash_password, verify_password

router = APIRouter(prefix='/auth', tags=['Authentication'])


def registration_db() -> Iterator[Session]:
    try:
        yield from get_db()
    except (SQLAlchemyError, ValidationError):
        raise HTTPException(503, 'Registration is temporarily unavailable.') from None


def rollback_safely(session: Session) -> None:
    try:
        session.rollback()
    except SQLAlchemyError:
        pass  # Closing the dependency releases the failed session; never log SQL parameters.


@router.post('/register', status_code=201, response_model=RegistrationResponse)
def register(data: RegistrationRequest, session: Session = Depends(registration_db)) -> RegistrationResponse:
    try:
        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash=hash_password(data.password.get_secret_value()),
        )
        session.add(user)
        session.flush()
        # Read server-generated fields before committing; response uses an explicit allowlist.
        response = RegistrationResponse.model_validate(user)
        session.commit()
        return response
    except IntegrityError as error:
        rollback_safely(session)
        original = error.orig
        if (getattr(original, 'sqlstate', None) == '23505'
                and getattr(getattr(original, 'diag', None), 'constraint_name', None) == 'ix_users_email'):
            raise HTTPException(409, 'Unable to register with these details.') from None
        raise HTTPException(503, 'Registration is temporarily unavailable.') from None
    except (SQLAlchemyError, HashingError):
        rollback_safely(session)
        raise HTTPException(503, 'Registration is temporarily unavailable.') from None


def login_db() -> Iterator[Session]:
    try:
        yield from get_db()
    except (SQLAlchemyError, ValidationError):
        raise HTTPException(503, 'Credential verification is temporarily unavailable.') from None


@router.post('/login', response_model=LoginResponse)
def login(data: LoginRequest, session: Session = Depends(login_db)) -> LoginResponse:
    try:
        # Select only what verification needs; no deferred second lookup or user serialization.
        account = session.execute(
            select(User.password_hash, User.is_active).where(User.email == data.email)
        ).one_or_none()
        matched = verify_password(account.password_hash if account else None, data.password.get_secret_value())
    except SQLAlchemyError:
        rollback_safely(session)
        raise HTTPException(503, 'Credential verification is temporarily unavailable.') from None
    if not matched or account is None or not account.is_active:
        raise HTTPException(401, 'Invalid email or password.')
    return LoginResponse()
