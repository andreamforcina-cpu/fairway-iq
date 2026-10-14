from sqlalchemy import text
from backend.db.session import get_engine


def main() -> int:
    try:
        engine = get_engine()
        try:
            with engine.connect() as connection:
                if connection.scalar(text('SELECT 1')) != 1:
                    raise RuntimeError
        finally:
            engine.dispose()
    except Exception:
        print('Database check failed. Verify configuration and connectivity; connection details are withheld.')
        return 1
    print('PostgreSQL connection verified.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
