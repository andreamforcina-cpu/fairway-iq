from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
        hide_input_in_errors=True,
    )
    database_url: SecretStr

    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, value: SecretStr) -> SecretStr:
        cls.parse_url(value)
        return value

    @staticmethod
    def parse_url(value: SecretStr) -> URL:
        try:
            raw = value.get_secret_value()
            if raw.startswith('postgres://'):
                raw = 'postgresql://' + raw[len('postgres://'):]
            url = make_url(raw)
            if url.drivername not in {'postgresql', 'postgresql+psycopg'} or not url.database:
                raise ValueError
            # Access the parsed port to detect malformed values without logging input.
            if url.port is not None and not 1 <= url.port <= 65535:
                raise ValueError
            return url.set(drivername='postgresql+psycopg')
        except (ArgumentError, ValueError, TypeError):
            raise ValueError('DATABASE_URL must be a valid PostgreSQL URL with a database name.') from None

    @property
    def sqlalchemy_url(self) -> URL:
        """For driver use only; never log this URL or its rendered credentials."""
        return self.parse_url(self.database_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
