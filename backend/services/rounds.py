"""Immutable, owner-scoped round persistence; the API commits successful writes."""
import base64
import binascii
from datetime import datetime, timezone
from hashlib import sha256
import json
from uuid import UUID, uuid4

from sqlalchemy import and_, or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from backend.models import GolfRound, HoleScore
from backend.schemas.rounds import HoleInput, RoundCreate, RoundPage, RoundResponse


class SubmissionConflict(Exception):
    """A key already belongs to a different validated payload for this owner."""


def request_hash(data: RoundCreate) -> str:
    payload = data.model_dump(mode='json', exclude={'submission_id'})
    return sha256(json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')).hexdigest()


def owned_query(user_id: UUID):
    return select(GolfRound).where(GolfRound.user_id == user_id).options(selectinload(GolfRound.holes))


def get_round(db: Session, user_id: UUID, round_id: UUID) -> GolfRound | None:
    return db.scalar(owned_query(user_id).where(GolfRound.id == round_id))


def create_round(db: Session, user_id: UUID, data: RoundCreate) -> tuple[GolfRound, bool]:
    fingerprint = request_hash(data)
    # PostgreSQL's unique key arbitrates concurrent retries. A losing INSERT waits
    # for the winner; the following READ COMMITTED SELECT sees the committed row.
    created_id = db.scalar(insert(GolfRound).values(
        id=uuid4(), user_id=user_id, submission_id=data.submission_id,
        request_hash=fingerprint, course_name=data.course_name,
        planned_holes=data.planned_holes, played_holes=len(data.holes), completed_at=data.completed_at,
    ).on_conflict_do_nothing(constraint='uq_golf_rounds_owner_submission').returning(GolfRound.id))
    if created_id is not None:
        db.add_all([HoleScore(round_id=created_id, **hole.model_dump()) for hole in data.holes])
        db.flush()
    record = db.scalar(owned_query(user_id).where(GolfRound.submission_id == data.submission_id))
    if record is None:
        raise SQLAlchemyError('Round could not be retrieved.')
    if record.request_hash != fingerprint:
        raise SubmissionConflict
    return record, created_id is not None


def response_for(record: GolfRound) -> RoundResponse:
    holes = [HoleInput(number=h.number, par=h.par, strokes=h.strokes, putts=h.putts) for h in record.holes]
    if (record.planned_holes not in (9, 18) or not 1 <= record.played_holes <= record.planned_holes
            or len(holes) != record.played_holes
            or [h.number for h in holes] != list(range(1, len(holes) + 1))):
        raise ValueError('Stored round integrity failure.')
    strokes, par, putts = (sum(getattr(hole, field) for hole in holes) for field in ('strokes', 'par', 'putts'))
    return RoundResponse(id=record.id, submission_id=record.submission_id, course_name=record.course_name,
                         planned_holes=record.planned_holes, played_holes=record.played_holes,
                         status='complete' if record.played_holes == record.planned_holes else 'early_finished',
                         completed_at=record.completed_at, created_at=record.created_at, holes=holes,
                         strokes=strokes, par=par, putts=putts, relative_to_par=strokes - par)


def encode_cursor(record: GolfRound) -> str:
    payload = json.dumps([record.created_at.astimezone(timezone.utc).isoformat(), str(record.id)], separators=(',', ':'))
    return base64.urlsafe_b64encode(payload.encode('ascii')).decode('ascii').rstrip('=')


def decode_cursor(value: str) -> tuple[datetime, UUID]:
    try:
        if not 1 <= len(value) <= 160:
            raise ValueError
        raw = base64.b64decode(value + '=' * (-len(value) % 4), altchars=b'-_', validate=True)
        payload = json.loads(raw)
        if not isinstance(payload, list) or len(payload) != 2 or not all(isinstance(item, str) for item in payload):
            raise ValueError
        timestamp = datetime.fromisoformat(payload[0])
        if timestamp.tzinfo is None or timestamp.utcoffset() is None:
            raise ValueError
        return timestamp.astimezone(timezone.utc), UUID(payload[1])
    except (ValueError, TypeError, OverflowError, binascii.Error, UnicodeError):
        raise ValueError('Invalid history cursor.') from None


def list_rounds(db: Session, user_id: UUID, limit: int, position: tuple[datetime, UUID] | None) -> RoundPage:
    query = owned_query(user_id)
    if position is not None:
        timestamp, round_id = position
        query = query.where(or_(GolfRound.created_at < timestamp,
                                and_(GolfRound.created_at == timestamp, GolfRound.id < round_id)))
    records = list(db.scalars(query.order_by(GolfRound.created_at.desc(), GolfRound.id.desc()).limit(limit + 1)))
    items = records[:limit]
    return RoundPage(items=[response_for(record) for record in items],
                     next_cursor=encode_cursor(items[-1]) if len(records) > limit else None)
