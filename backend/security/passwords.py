"""Argon2id hashing with fresh, library-generated salts for every password."""
from secrets import token_urlsafe

from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, type=Type.ID)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


# Paid once per worker, never derived from a real user's password or account.
_DUMMY_HASH = _hasher.hash(token_urlsafe(32))


def verify_password(password_hash: str | None, password: str) -> bool:
    """Spend Argon2 work on unknown accounts too; malformed stored hashes fail closed."""
    try:
        matched = _hasher.verify(password_hash or _DUMMY_HASH, password)
        return bool(password_hash) and matched
    except VerifyMismatchError:
        return False
    except (InvalidHashError, VerificationError):
        # Invalid hashes must neither authenticate nor become a fast account oracle.
        try:
            _hasher.verify(_DUMMY_HASH, password)
        except VerifyMismatchError:
            pass
        return False
