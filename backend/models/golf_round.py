"""Immutable completed rounds owned by an authenticated account."""
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.db.base import Base


class GolfRound(Base):
    __tablename__ = 'golf_rounds'
    __table_args__ = (
        UniqueConstraint('user_id', 'submission_id', name='uq_golf_rounds_owner_submission'),
        CheckConstraint('planned_holes IN (9, 18)', name='planned_holes'),
        CheckConstraint('played_holes BETWEEN 1 AND planned_holes', name='played_holes'),
        CheckConstraint('length(trim(course_name)) BETWEEN 1 AND 100', name='course_name'),
        CheckConstraint("request_hash ~ '^[0-9a-f]{64}$'", name='request_hash'),
        Index('ix_golf_rounds_owner_history', 'user_id', 'created_at', 'id'),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    submission_id: Mapped[UUID] = mapped_column(Uuid, nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    course_name: Mapped[str] = mapped_column(String(100), nullable=False)
    planned_holes: Mapped[int] = mapped_column(Integer, nullable=False)
    played_holes: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    holes: Mapped[list['HoleScore']] = relationship(back_populates='round', cascade='all, delete-orphan',
                                                    passive_deletes=True, order_by='HoleScore.number', lazy='raise')


class HoleScore(Base):
    __tablename__ = 'hole_scores'
    __table_args__ = (
        UniqueConstraint('round_id', 'number', name='uq_hole_scores_round_number'),
        CheckConstraint('number BETWEEN 1 AND 18', name='number'),
        CheckConstraint('par BETWEEN 1 AND 6', name='par'),
        CheckConstraint('strokes BETWEEN 1 AND 30', name='strokes'),
        CheckConstraint('putts BETWEEN 0 AND strokes', name='putts'),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    round_id: Mapped[UUID] = mapped_column(ForeignKey('golf_rounds.id', ondelete='CASCADE'), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    par: Mapped[int] = mapped_column(Integer, nullable=False)
    strokes: Mapped[int] = mapped_column(Integer, nullable=False)
    putts: Mapped[int] = mapped_column(Integer, nullable=False)
    round: Mapped[GolfRound] = relationship(back_populates='holes')
