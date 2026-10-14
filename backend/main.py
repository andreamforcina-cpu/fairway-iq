from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.responses import JSONResponse

from backend.api.auth import router as auth_router
from backend.security.rate_limits import AuthRateLimiter, AuthRateLimitMiddleware

app = FastAPI(
    title="FAIRWAY IQ API",
    description="AI-Powered Golf Analytics Platform",
    version="0.1.0"
)

auth_rate_limiter = AuthRateLimiter()
app.add_middleware(AuthRateLimitMiddleware, limiter=auth_rate_limiter)


@app.get("/")
def home():
    return {
        "message": "Welcome to FAIRWAY IQ",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }

app.include_router(auth_router)


@app.exception_handler(RequestValidationError)
async def safe_auth_validation(request: Request, error: RequestValidationError):
    if request.url.path not in {'/auth/register', '/auth/login'}:
        return await request_validation_exception_handler(request, error)
    # FastAPI's default errors echo rejected input, including plaintext passwords.
    messages = {
        'full_name': 'Enter a name of 1–100 characters without control characters.',
        'email': 'Enter a valid email address (maximum 254 characters).',
        'password': 'Enter a password of 15–128 characters that is not only whitespace.',
    }
    if request.url.path == '/auth/login':
        messages.pop('full_name')
        messages['password'] = 'Enter a password of 1–128 characters.'
    details = []
    for item in error.errors():
        location = item.get('loc', ())
        field = location[1] if len(location) == 2 and location[0] == 'body' else None
        known = field in messages
        details.append({'loc': ['body', field] if known else ['body'],
                        'msg': messages[field] if known else 'Invalid authentication data.',
                        'type': 'value_error'})
    return JSONResponse(status_code=422, content={'detail': details})
