# Change record — Phase 1A persistence foundation

**Date:** 2026-07-31  
**Branch:** `feature/persistence-foundation`  
**Pull request:** pending  
**Recovery phase:** `1A`  
**Status:** IN_PROGRESS

## Summary

Introduce typed fail-closed configuration, persistence store factory, server-only Supabase client, reproducible migrations/seed documentation, and an `.env.example` without operational default secrets.

## Recovery phase

1A — Fundación de persistencia.

## Scope included

- `src/infrastructure/config/env.ts` (+ tests)
- `src/infrastructure/persistence/store-factory.ts` (+ tests)
- `src/infrastructure/supabase/client.ts`
- `supabase/` migrations, seed, README
- `.env.example` without default access codes
- Baseline product governance docs (decision register, recovery, audit, gaps, ADR 011–016)
- Tooling: zod, supabase-js, vitest, eslint/typecheck scripts

## Scope excluded

- Master-data APIs (1B)
- Photo upload / Storage (1C)
- Bookings / ai_jobs writes (1D)
- Auth admin (2A)
- Replicate (3B/3C)

## Architecture impact

Defines the persistence selection boundary; production cannot use in-memory store.

## API impact

None in this phase.

## Data and migration impact

Documents and ships existing init migration + seed; no destructive changes.

## Security and privacy impact

Removes insecure example defaults for demo/admin codes; service role remains server-only.

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | npm run lint | PASS |
| Typecheck | npm run typecheck | PASS |
| Tests | npm test (16) | PASS |
| Build | npm run build | PASS |

## Deployment and rollback

Rollback: previous deploy / revert PR. No migrate down. Kill switch: keep DATA_STORE unset locally.

## Documentation updated

- `supabase/README.md`
- `docs/implementation-status.md`
- `docs/changes/2026-07-31-phase-1a-persistence-foundation.md`
- Canonical decision/recovery/audit docs committed to branch

## Remaining risks

- Supabase project not yet provisioned (operator action)
- CI quality may need dependency install on fresh runners

## Verification status

- Planner: scoped to 1A
- Architect: store factory boundary
- Security: no secrets in example env
- Tests: unit config/factory
- Independent verifier: pending PR
