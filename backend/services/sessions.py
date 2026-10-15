"""Transaction-aware session lifecycle; callers commit before returning tokens."""
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import AuthSession, RefreshToken, User
from backend.schemas.sessions import TokenResponse
from backend.security.tokens import ACCESS_TTL_SECONDS, SESSION_TTL_SECONDS, new_token, token_digest


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def issue_tokens(db: Session, record: AuthSession, now: datetime) -> TokenResponse:
    access, refresh = new_token('access'), new_token('refresh')
    record.access_hash = token_digest(access)
    record.access_expires_at = min(now + timedelta(seconds=ACCESS_TTL_SECONDS), record.expires_at)
    db.add(record)
    db.flush()
    db.add(RefreshToken(session_id=record.id, token_hash=token_digest(refresh)))
    return TokenResponse(access_token=access, refresh_token=refresh,
                         expires_in=int((record.access_expires_at - now).total_seconds()),
                         refresh_expires_in=int((record.expires_at - now).total_seconds()))


def create_session(db: Session, user_id: UUID) -> TokenResponse:
    now = utcnow()
    record = AuthSession(user_id=user_id, expires_at=now + timedelta(seconds=SESSION_TTL_SECONDS))
    return issue_tokens(db, record, now)


def locked_refresh_session(db: Session, refresh: str) -> AuthSession | None:
    # Look up only the parent ID first. All refresh/logout operations lock that parent
    # before re-reading refresh state, serializing races without locking in opposite order.
    session_id = db.scalar(select(RefreshToken.session_id).where(RefreshToken.token_hash == token_digest(refresh)))
    if session_id is None:
        return None
    return db.scalar(select(AuthSession).where(AuthSession.id == session_id)
                     .with_for_update().execution_options(populate_existing=True))


def rotate_session(db: Session, refresh: str) -> TokenResponse | None:
    record = locked_refresh_session(db, refresh)
    if record is None:
        return None
    now = utcnow()
    if record.revoked_at is not None or record.expires_at <= now:
        return None
    previous = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_digest(refresh))
                         .execution_options(populate_existing=True))
    if previous.used_at is not None:
        record.revoked_at = now
        return None  # Caller MUST commit this revocation, even though response is 401.
    active = db.scalar(select(User.is_active).where(User.id == record.user_id))
    if not active:
        record.revoked_at = now
        return None
    previous.used_at = now
    return issue_tokens(db, record, now)


def revoke_session(db: Session, refresh: str) -> None:
    record = locked_refresh_session(db, refresh)
    if record is not None and record.revoked_at is None:
        record.revoked_at = utcnow()


def authenticated_user(db: Session, access: str) -> User | None:
    now = utcnow()
    return db.scalar(select(User).join(AuthSession, AuthSession.user_id == User.id).where(
        AuthSession.access_hash == token_digest(access),
        AuthSession.access_expires_at > now,
        AuthSession.expires_at > now,
        AuthSession.revoked_at.is_(None),
        User.is_active.is_(True),
    ))
