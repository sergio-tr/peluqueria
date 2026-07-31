# Change record — Phase 1B master data persistence

**Date:** 2026-07-31  
**Branch:** `feature/master-data-persistence`  
**Pull request:** PASS  
**Recovery phase:** `1B`  
**Status:** IN_PROGRESS

## Summary

Postgres-backed catalog repositories and GET APIs for services, hairstyles, and availability. Seed paths aligned to SVG placeholders.

## Recovery phase

1B

## Scope included

- Catalog repositories and mappers
- GET `/api/services`, `/api/hairstyles`, `/api/availability`
- Domain helpers required by APIs
- Seed image path fix (.svg)

## Scope excluded

- Photo upload (1C)
- Booking writes / busy intervals from DB (1D/2B)
- Auth (2A)

## Architecture impact

Master data reads go through Supabase store only.

## API impact

Services/hairstyles/availability require DATA_STORE=supabase.

## Data and migration impact

Seed path strings updated to .svg

## Security and privacy impact

None beyond existing RLS read policies.

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Tests | npm test | PASS |
| Typecheck | npm run typecheck | PASS |
| Lint | npm run lint | PASS |
| Build | npm run build | PASS |

## Deployment and rollback

Previous deploy / revert PR. No migrate down.

## Documentation updated

This change record; agent run; implementation-status.

## Remaining risks

APIs return 503 without Supabase credentials.

## Verification status

- Planner: scoped
- Architect: repository boundary
- Security: N/A
- Tests: mapper unit
- Independent verifier: PASS

