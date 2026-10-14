from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.core.config import Settings, get_settings


def build_engine(settings: Settings) -> Engine:
    # Construction is lazy; no connection, schema creation, or migration occurs here.
    return create_engine(settings.sqlalchemy_url, pool_pre_ping=True, echo=False, hide_parameters=True)


@lru_cache
def get_engine() -> Engine:
    return build_engine(get_settings())


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False, autoflush=False)


def get_db() -> Iterator[Session]:
    # Callers explicitly commit successful writes. Close rolls back unfinished work.
    with get_session_factory()() as session:
        yield session
