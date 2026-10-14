from alembic import context
from sqlalchemy import create_engine, pool

from backend.core.config import get_settings
from backend.db.base import Base
from backend.models import User  # noqa: F401 — register metadata


def run_migrations() -> None:
    supplied_connection = context.config.attributes.get('connection')
    if supplied_connection is not None:
        context.configure(connection=supplied_connection, target_metadata=Base.metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()
        return
    settings = context.config.attributes.get('settings') or get_settings()
    if context.is_offline_mode():
        context.configure(url=settings.sqlalchemy_url, target_metadata=Base.metadata, literal_binds=True, compare_type=True, dialect_opts={'paramstyle': 'named'})
        with context.begin_transaction():
            context.run_migrations()
    else:
        # Migration processes do not need an application connection pool.
        engine = create_engine(settings.sqlalchemy_url, poolclass=pool.NullPool, echo=False, hide_parameters=True)
        try:
            with engine.connect() as connection:
                context.configure(connection=connection, target_metadata=Base.metadata, compare_type=True)
                with context.begin_transaction():
                    context.run_migrations()
        finally:
            engine.dispose()


try:
    run_migrations()
except Exception:
    # Do not emit driver/configuration exception text or connection strings.
    raise RuntimeError('Migration failed. Check PostgreSQL configuration and migration state; connection details are withheld.') from None
