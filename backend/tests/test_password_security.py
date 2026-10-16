"""Deterministic work-path assertions, not claims of constant wall-clock timing."""
from unittest.mock import MagicMock

import pytest
from argon2 import Type, extract_parameters
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from backend.security import passwords


def test_argon2id_parameters_and_independent_salts():
    # Synthetic test input only; never a real account credential.
    first = passwords.hash_password('Synthetic security test passphrase')
    second = passwords.hash_password('Synthetic security test passphrase')
    params = extract_parameters(first)
    assert params.type is Type.ID
    assert params.version == 19
    assert params.memory_cost == 65536
    assert params.time_cost == 3
    assert params.parallelism == 4
    assert params.salt_len >= 16
    assert params.hash_len >= 32
    assert first != second
    assert passwords.verify_password(first, 'Synthetic security test passphrase')
    assert not passwords.verify_password(first, 'different synthetic passphrase')


@pytest.mark.parametrize('missing', [None, ''])
def test_missing_hash_spends_dummy_work_and_never_authenticates(monkeypatch, missing):
    hasher = MagicMock()
    # Even a hypothetical matching dummy secret must not authenticate an unknown user.
    hasher.verify.return_value = True
    monkeypatch.setattr(passwords, '_hasher', hasher)
    assert not passwords.verify_password(missing, 'synthetic')
    hasher.verify.assert_called_once_with(passwords._DUMMY_HASH, 'synthetic')


def test_malformed_stored_hash_runs_dummy_verification(monkeypatch):
    hasher = MagicMock()
    hasher.verify.side_effect = [InvalidHashError('synthetic-invalid'), VerifyMismatchError('synthetic-mismatch')]
    monkeypatch.setattr(passwords, '_hasher', hasher)
    assert not passwords.verify_password('malformed', 'synthetic')
    assert hasher.verify.call_args_list[1].args == (passwords._DUMMY_HASH, 'synthetic')


def test_wrong_password_does_not_repeat_expensive_work(monkeypatch):
    hasher = MagicMock()
    hasher.verify.side_effect = VerifyMismatchError('synthetic-mismatch')
    monkeypatch.setattr(passwords, '_hasher', hasher)
    assert not passwords.verify_password('stored-hash', 'synthetic')
    hasher.verify.assert_called_once_with('stored-hash', 'synthetic')


def test_unicode_password_policy_and_exact_verification():
    from backend.schemas.auth import LoginRequest, RegistrationRequest
    from pydantic import ValidationError
    password = '🏌' * 128
    data = RegistrationRequest(full_name='𐐀' * 100, email='golfer@example.com', password=password)
    assert data.password.get_secret_value() == password
    encoded = passwords.hash_password(password)
    assert passwords.verify_password(encoded, password)
    assert not passwords.verify_password(encoded, password + ' ')
    assert LoginRequest(email='golfer@example.com', password=password).password.get_secret_value() == password
    with pytest.raises(ValidationError):
        RegistrationRequest(full_name='Golfer', email='golfer@example.com', password='🏌' * 129)
    for name in ['Alex\u0085Golfer', 'Alex\u200bGolfer', 'Alex\ue000Golfer']:
        with pytest.raises(ValidationError):
            RegistrationRequest(full_name=name, email='golfer@example.com', password='synthetic passphrase')


@pytest.mark.parametrize('character', ['\u001c', '\u0085', '\u2003', ' '])
def test_registration_rejects_python_whitespace_passwords(character):
    from backend.schemas.auth import RegistrationRequest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        RegistrationRequest(full_name='Synthetic Golfer', email='golfer@example.com', password=character * 15)


def test_password_bom_is_not_silently_trimmed_or_normalized():
    from backend.schemas.auth import RegistrationRequest
    password = '\ufeff' * 15
    assert RegistrationRequest(full_name='Synthetic Golfer', email='golfer@example.com', password=password).password.get_secret_value() == password
