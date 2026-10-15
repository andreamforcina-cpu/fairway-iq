# Authentication rate limiting

The single-worker API now applies a sliding 60-second window per client IP and endpoint:

| Endpoint | Requests per window |
| --- | --- |
| `POST /auth/login` and `/auth/token` | 20 combined |
| `POST /auth/register` | 5 |
| `POST /auth/refresh` | 30 |
| `POST /auth/logout` | 30 |

All attempts count, including successful requests and invalid input. A rejected attempt does not extend the window. Health, documentation and unrelated routes remain unaffected. Rates are centralized in `backend/security/rate_limits.py`; changing them requires a reviewed code change and restart.

When exhausted, the middleware returns HTTP **429** before reading the request body, resolving database dependencies or performing Argon2 work:

```json
{"detail": "Too many requests. Please try again later."}
```

`Retry-After` contains a positive integer number of seconds until another attempt may be accepted; it is not a reservation if other requests arrive. Responses use `Cache-Control: no-store`. No email, password, hash or token is stored in the limiter or returned in errors.

## Scope and operational limits

This deliberately dependency-free first increment is **process-local**, with a thread lock, monotonic clock and at most 10,000 IP/endpoint buckets. Each bucket holds no more timestamps than its request limit. Expired buckets are reclaimed on incoming authentication traffic. When all bucket slots are active, new keys fail closed with the same generic 429 instead of evicting another client's active limit. Existing keys keep their normal limits. IP addresses are held temporarily in process memory; they are not logged by this module.

Limits reset on process restart/reload and are independent in each worker. They do not provide distributed protection or global concurrent-hash limits. Before a public or multi-worker deployment, use an edge limiter or shared atomic store, together with request-body size limits, concurrency limits and abuse monitoring. IP rotation can bypass per-IP limits; users behind shared NAT may share a quota. No account lockout is introduced, avoiding an unauthenticated mechanism to lock a victim's account.

The middleware uses only the ASGI client address and does not parse `X-Forwarded-For` or `Forwarded`. A server can rewrite that address before middleware sees it: configure trusted proxies explicitly and never trust arbitrary forwarding headers. For direct local preview without a reverse proxy:

```sh
backend/.venv/bin/python -m uvicorn backend.main:app --reload --no-proxy-headers
```

Behind a reverse proxy, configure its trusted addresses and forwarding behavior deliberately; disabling forwarded headers there would cause all users to share the proxy address quota. Do not deploy with a wildcard trusted-proxy setting.

## Verification and manual preview

Unit tests use an injected monotonic clock rather than sleeps. They cover exact expiry, individual sliding-window expiry, denied attempts not extending lockout, client/endpoint isolation, concurrency, bounded capacity, expired-key reclamation, generic 429/Retry-After, spoofed forwarding headers, unaffected health/docs, and refusal before body/database work. Test fixtures reset only process-local limiter state between tests.

To preview without inserting users, submit `{}` to `/auth/register` in Swagger five times (422), then a sixth time (429). Wait for the Retry-After interval before trying again. Login permits twenty attempts in its independent window. These thresholds are development defaults, not measured production capacity.

Existing login still only verifies credentials. Separate [session endpoints](backend-sessions.md) now issue opaque tokens and require their prepared migration; mobile integration is implemented; JWT is not used. Rate limiting itself adds no dependency or database change.

Rate-limiting checkpoint verification: **60 backend tests passed, none skipped**, including the five existing isolated PostgreSQL tests. One existing Starlette/httpx TestClient deprecation warning remains. No automated tests used the development database.
