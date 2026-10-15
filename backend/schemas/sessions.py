from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator

from backend.security.tokens import valid_token


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)
    refresh_token: SecretStr

    @field_validator('refresh_token')
    @classmethod
    def validate_token(cls, value: SecretStr) -> SecretStr:
        if not valid_token(value.get_secret_value(), 'refresh'):
            raise ValueError('Invalid refresh token.')
        return value


class TokenResponse(BaseModel):
    access_token: str = Field(repr=False)
    refresh_token: str = Field(repr=False)
    token_type: Literal['bearer'] = 'bearer'
    expires_in: int
    refresh_expires_in: int
