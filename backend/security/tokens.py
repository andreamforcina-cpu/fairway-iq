"""Opaque, purpose-separated 256-bit tokens; no embedded personal information."""
from hashlib import sha256
from secrets import token_urlsafe
import re

ACCESS_TTL_SECONDS = 15 * 60
SESSION_TTL_SECONDS = 30 * 24 * 60 * 60


def new_token(purpose: str) -> str:
    if purpose not in {'access', 'refresh'}:
        raise ValueError('Unsupported token purpose.')
    return ('fiqa_' if purpose == 'access' else 'fiqr_') + token_urlsafe(32)


def valid_token(token: str, purpose: str) -> bool:
    prefix = 'fiqa_' if purpose == 'access' else 'fiqr_'
    return re.fullmatch(prefix + r'[A-Za-z0-9_-]{43}', token) is not None


def token_digest(token: str) -> str:
    # Fast hashing is appropriate for a uniformly random 256-bit secret, not passwords.
    return sha256(token.encode('ascii')).hexdigest()
