from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, DateTime, String, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column, validates

from backend.db.base import Base


class User(Base):
    __tablename__ = 'users'
    __table_args__ = (
        CheckConstraint("email = lower(trim(email)) AND length(email) BETWEEN 3 AND 254 AND position('@' in email) > 1", name='email_normalized'),
        CheckConstraint('length(trim(full_name)) BETWEEN 1 AND 100', name='full_name_nonempty'),
        CheckConstraint("password_hash LIKE '$argon2id$%'", name='password_hash_argon2id'),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4, server_default=text('gen_random_uuid()'))
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False, deferred=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text('true'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    @validates('email')
    def normalize_email(self, _key: str, value: str) -> str:
        return value.strip().lower()
