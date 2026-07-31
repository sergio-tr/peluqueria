# Change record — Phase 3C Replicate storage, retry, and durable limits

**Date:** 2026-07-31  
**Branch:** `feature/replicate-storage-limits`  
**Pull request:** pending  
**Recovery phase:** 3C  
**Status:** COMPLETE (code/tests); VERIFICATION blocked on operator credentials

## Summary

Completes the Replicate webhook success path: download provider output, validate, persist to private `results` Storage bucket, set `result_image_path`, and mark jobs `SUCCEEDED`. Adds signed preview from Storage (short TTL), real retry with limit enforcement, durable PG counters, €30 monthly budget (D-04A) with 70/90/100% alert hooks, kill switch, and admin AI usage endpoint. Numeric monthly generation cap remains PENDING_BENCHMARK (D-04B).

## Recovery phase

3C — Outputs, retry y límites.

## Scope included

- `persistReplicateOutput` — download, validate, upload to `results` bucket
- `processReplicateWebhook` — SUCCEEDED + `result_image_path` (no client Replicate URL)
- `enforceAiLimits` — session/day/concurrent/budget; shared by create + retry
- Budget alerts via hooks + structured log (`[ai-budget-alert]`)
- `retryAiJob` — re-creates prediction; respects limits without double-counting usage
- `GET /api/admin/ai-usage` — month stats, cost, budget percent
- `resultsBucket` in typed config
- Tests: output path, retry limits, alert emission
- Operator docs for results bucket and budget env

## Scope excluded

- Formal benchmark (Phase 6)
- Modal / HairFastGAN
- UI pages under untracked `src/app/probar/` (later phases)
- Live Replicate + Storage smoke on preview (operator)

## Architecture impact

- UI polls `GET /api/ai/jobs/[id]` → signed Storage URL only; never Replicate CDN
- `pending_result_url` cleared on success; retained only on persist failure for ops recovery
- Monthly gen cap numeric limit deferred; budget € enforced via estimated cost

## API impact

- `GET /api/ai/jobs/[jobId]` — result preview from `results` bucket when `result_image_path` set
- `POST /api/ai/jobs/[jobId]/retry` — real re-queue with limits
- `GET /api/admin/ai-usage` — new admin endpoint
- `POST /api/webhooks/replicate` — completes job to SUCCEEDED after Storage copy

## Data and migration impact

- No new migration; uses existing `ai_usage_counters` and `result_image_path`
- Operator must ensure `results` Storage bucket exists on remote Supabase

## Security and privacy impact

- Replicate output URLs never exposed to clients
- Budget/usage admin-only
- Kill switch `AI_GENERATION_ENABLED=false` unchanged

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | pending |
| Typecheck | `npm run typecheck` | pending |
| Tests | `npm run test` | pending |
| Build | `npm run build` | pending |

## Deployment and rollback

- Set `SUPABASE_STORAGE_BUCKET_RESULTS=results` on preview
- Set `AI_MONTHLY_BUDGET_EUR=30` (default)
- Rollback: `AI_GENERATION_ENABLED=false` or previous deploy (ADR-015)

## Documentation updated

- `docs/operator-actions.md`
- `docs/database-schema.md`
- `docs/ai-provider.md`
- `docs/agent-runs/2026-07-31-phase-3c.md`
- `.env.example`

## Remaining risks

- End-to-end Storage copy not verified until operator configures Supabase buckets on preview
- Persist failure leaves `OUTPUT_PERSIST_FAILED` with server-only `pending_result_url` for manual recovery

## Verification status

- Planner: N/A (scoped implementation)
- Architect: aligned with ADR-006, D-04A/B
- Security: no client exposure of provider URLs; admin auth on usage endpoint
- Tests: unit tests for persist path, limits, alerts, webhook SUCCEEDED
- Independent verifier: blocked — no live Supabase Storage on preview; Draft PR
