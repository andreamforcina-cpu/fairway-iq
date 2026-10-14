"""Registration contracts; secrets are never part of the response model."""
from datetime import datetime
from uuid import UUID
import unicodedata

from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, ConfigDict, SecretStr, field_validator


class RegistrationRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)

    full_name: str
    email: str
    password: SecretStr

    @field_validator('full_name')
    @classmethod
    def valid_name(cls, value: str) -> str:
        value = value.strip()
        if not 1 <= len(value) <= 100 or any(unicodedata.category(c).startswith('C') for c in value):
            raise ValueError('Name must contain 1–100 characters without control characters.')
        return value

    @field_validator('email')
    @classmethod
    def valid_email(cls, value: str) -> str:
        if len(value) > 320:
            raise ValueError('Invalid email address.')
        try:
            normalized = validate_email(value.strip(), check_deliverability=False).normalized.lower()
        except EmailNotValidError:
            raise ValueError('Invalid email address.') from None
        if len(normalized) > 254:
            raise ValueError('Invalid email address.')
        return normalized

    @field_validator('password')
    @classmethod
    def valid_password(cls, value: SecretStr) -> SecretStr:
        password = value.get_secret_value()
        if not 15 <= len(password) <= 128 or password.isspace():
            raise ValueError('Password must contain 15–128 characters.')
        return value


class RegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str
    created_at: datetime


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)

    email: str
    password: SecretStr

    @field_validator('email')
    @classmethod
    def valid_email(cls, value: str) -> str:
        return RegistrationRequest.valid_email(value)

    @field_validator('password')
    @classmethod
    def valid_password(cls, value: SecretStr) -> SecretStr:
        # Login accepts shorter guesses; registration policy is not reapplied here.
        if not 1 <= len(value.get_secret_value()) <= 128:
            raise ValueError('Password must contain 1–128 characters.')
        return value


class LoginResponse(BaseModel):
    message: str = 'Credentials verified. No authenticated session has been created.'
