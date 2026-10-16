"""Authenticated round submission/history; never accepts client ownership."""
from contextlib import contextmanager
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.api.auth import rollback_safely
from backend.api.sessions import current_user, session_db
from backend.models import User
from backend.schemas.rounds import RoundCreate, RoundPage, RoundResponse
from backend.services.rounds import SubmissionConflict, create_round, decode_cursor, get_round, list_rounds, response_for

router = APIRouter(prefix='/rounds', tags=['Rounds'])


@contextmanager
def safe_round_operation(db: Session):
    try:
        yield
    except SubmissionConflict:
        rollback_safely(db)
        raise HTTPException(409, 'Submission ID already used with different round data.') from None
    except (SQLAlchemyError, ValueError):
        rollback_safely(db)
        raise HTTPException(503, 'Round storage is temporarily unavailable.') from None


@router.post('', response_model=RoundResponse, status_code=201, responses={200: {'description': 'Identical submission replay'}})
def submit_round(data: RoundCreate, response: Response, user: User = Depends(current_user),
                 db: Session = Depends(session_db)) -> RoundResponse:
    with safe_round_operation(db):
        record, created = create_round(db, user.id, data)
        result = response_for(record)
        db.commit()
    response.status_code = 201 if created else 200
    return result


@router.get('', response_model=RoundPage)
def history(limit: Annotated[int, Query(ge=1, le=100)] = 20,
            cursor: Annotated[str | None, Query(min_length=1, max_length=160)] = None,
            user: User = Depends(current_user), db: Session = Depends(session_db)) -> RoundPage:
    try:
        position = decode_cursor(cursor) if cursor is not None else None
    except ValueError:
        raise HTTPException(422, 'Invalid history cursor.') from None
    with safe_round_operation(db):
        return list_rounds(db, user.id, limit, position)


@router.get('/{round_id}', response_model=RoundResponse)
def detail(round_id: UUID, user: User = Depends(current_user), db: Session = Depends(session_db)) -> RoundResponse:
    with safe_round_operation(db):
        record = get_round(db, user.id, round_id)
        if record is None:
            raise HTTPException(404, 'Round not found.')
        return response_for(record)
