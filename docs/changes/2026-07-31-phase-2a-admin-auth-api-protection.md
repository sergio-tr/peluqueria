# Change record — Phase 2A admin auth and API protection

**Date:** 2026-07-31  
**Branch:** `security/admin-auth-api-protection`  
**Pull request:** pending  
**Recovery phase:** 2A  
**Status:** COMPLETE

## Summary

Replaces the legacy `ADMIN_DEMO_KEY` header gate with Supabase Auth for professional admin access. Adds a fail-closed demo gate (env-only code, signed httpOnly cookie, IP-hash rate limiting) and middleware that separates admin session protection from demo access.

## Recovery phase

2A — Auth y protección API (recovery plan).

## Scope included

- Supabase Auth session verification in `requireAdmin` (cookie + Bearer)
- Staff linkage via `staff.auth_user_id` (403 when unlinked)
- Admin login UI (`/admin/login`) and logout API
- Demo gate middleware, secure session cookie, rate limit on `/api/demo-access`
- Forward migration: FK `staff.auth_user_id → auth.users`
- Removal of hardcoded `nowi-admin` / `ADMIN_DEMO_KEY`
- Unit tests: 401/403 admin guard, gate fail-closed, rate limiter

## Scope excluded

- Booking transactions / exclusion (2B)
- Confirm token rewrite beyond auth guards (2C)
- Catalog assets (2D)
- Netlify / Replicate changes

## Architecture impact

- `@supabase/ssr` for cookie-based sessions in middleware and API routes
- Demo rate limiter is in-process (documented; durable store deferred to multi-instance ops)
- Middleware splits admin auth paths from demo-gated public/API paths

## API impact

- All `/api/admin/*` routes require Supabase session + active staff link (401/403)
- `/api/demo-access` returns 503 without env config, 429 when rate limited
- `/api/auth/logout` clears admin session

## Data and migration impact

- `20260731100000_staff_auth_user_fk.sql` adds FK to `auth.users`
- Operator must create Auth user and update `staff.auth_user_id`

## Security and privacy impact

- Eliminates static admin key and repo-default demo codes
- Demo cookie is httpOnly, signed (HS256), secure in production
- IP hashing fail-closed in production without `IP_HASH_SECRET`
- Admin API verifies staff membership server-side

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (41) |
| Build | `npm run build` | PASS |

## Deployment and rollback

- Set `DEMO_ACCESS_CODE`, `DEMO_SESSION_SECRET`, `IP_HASH_SECRET`, Supabase anon/url
- Create Supabase Auth user; link `staff.auth_user_id`
- Rollback: previous deploy; migration is forward-only (FK drop is corrective, not automated down)

## Documentation updated

- This change record
- `docs/agent-runs/2026-07-31-phase-2a.md`
- `.env.example`

## Remaining risks

- Operator must provision Auth user + staff link before admin panel works
- In-process rate limit resets on cold start / multi-instance (documented)

## Verification status

- Planner: N/A (scoped implementation)
- Architect: N/A
- Security: pending
- Tests: pending
- Independent verifier: pending
