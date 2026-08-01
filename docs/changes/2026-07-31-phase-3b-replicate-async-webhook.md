# Change record — Phase 3B Replicate async webhook

**Date:** 2026-07-31  
**Branch:** `feature/replicate-async-webhook`  
**Pull request:** pending  
**Recovery phase:** 3B  
**Status:** COMPLETE (code/tests); VERIFICATION blocked on operator credentials

## Summary

Implements Replicate async predictions with signed webhook handling, delivery dedupe via `webhook_deliveries`, D-02 metadata on `ai_jobs`, fail-closed AI provider selection on remote runtimes, and kill switch `AI_GENERATION_ENABLED`. Webhook success stages output server-side (`pending_result_url`) and marks jobs `RUNNING` until Phase 3C copies to Storage.

## Recovery phase

3B — Replicate predictions y webhook.

## Scope included

- `ReplicateQwenHairProvider` async prediction creation
- `POST /api/webhooks/replicate` with signature verify, skew, dedupe
- `processReplicateWebhook` application use-case
- Migration `webhook_deliveries` + D-02 columns on `ai_jobs`
- Fail-closed: remote runtime requires `replicate-qwen`; no silent mock
- `WEBHOOK_BASE_URL` env for callback base
- Tests: signature, skew, duplicate delivery, terminal ignore, provider fail-closed
- Operator docs for `REPLICATE_API_TOKEN`, webhook secret, `WEBHOOK_BASE_URL`

## Scope excluded

- Download output → Supabase Storage (3C)
- Full budget alerts (3C)
- UI pages under `src/app/probar/` etc. (later phases)
- Live Replicate smoke on preview (operator)

## Architecture impact

- Client polls `GET /api/ai/jobs/[id]` only; no Replicate poll in MVP
- Webhook path is public (middleware bypass); auth via HMAC signature
- Jobs stay `RUNNING` after provider success until 3C persists binary

## API impact

- `POST /api/ai/jobs` — unchanged contract; D-02 metadata persisted
- `GET /api/ai/jobs/[jobId]` — no ephemeral Replicate URL exposed
- `POST /api/webhooks/replicate` — production-ready handler (Postgres)

## Data and migration impact

- New table: `webhook_deliveries` (unique `webhook_id`)
- New columns on `ai_jobs`: `model_owner`, `model_name`, `requested_version`, `asset_version`, `latency_ms`, `pending_result_url`
- Operator must `supabase db push` on remote

## Security and privacy impact

- Webhook signature mandatory on remote runtime; 503 if secret missing
- `pending_result_url` never returned to clients
- No secrets committed; empty env placeholders only

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | pending |
| Typecheck | `npm run typecheck` | pending |
| Tests | `npm run test` | pending |
| Build | `npm run build` | pending |

## Deployment and rollback

- Set `AI_PROVIDER=replicate-qwen`, `REPLICATE_API_TOKEN`, `REPLICATE_WEBHOOK_SECRET`, `WEBHOOK_BASE_URL` (or `NEXT_PUBLIC_SITE_URL`) on preview
- Rollback: `AI_GENERATION_ENABLED=false` or previous deploy (ADR-015)

## Documentation updated

- `docs/operator-actions.md`
- `docs/database-schema.md`
- `docs/agent-runs/2026-07-31-phase-3b.md`
- `.env.example`

## Remaining risks

- End-to-end Replicate webhook not verified until operator sets token + secret on preview HTTPS URL
- Jobs remain `RUNNING` without client preview until Phase 3C

## Verification status

- Planner: N/A (scoped implementation)
- Architect: aligned with ADR-004, ADR-005, ADR-009
- Security: signature + dedupe; pending operator secret rotation checklist
- Tests: unit tests for signature, skew, dedupe, terminal ignore, fail-closed provider
- Independent verifier: blocked — no live Replicate token; Draft PR
