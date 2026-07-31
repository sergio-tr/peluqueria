# Change record — Phase 8 Netlify production runbook

**Date:** 2026-07-31  
**Branch:** `release/netlify-production`  
**Pull request:** pending (Draft)  
**Recovery phase:** 8  
**Status:** COMPLETE (runbook/docs); VERIFICATION blocked on operator credentials

## Summary

Production release runbook distinct from Phase 3A preview bootstrap. Documents fail-closed production env checklist (`AI_PROVIDER=replicate-qwen`, no memory runtime, gate without defaults), hourly/daily cron, production Replicate webhook URL, kill switches, and ADR-015 previous-deploy rollback. Adds `[context.production.environment]` in `netlify.toml`. No production deploy executed; production not declared live.

## Recovery phase

8 — Deploy productivo (runbook only).

## Scope included

- `docs/deployment.md` — Production release section (gates, env checklist, cron, webhook, kill switches, rollback, health checks)
- `docs/operator-actions.md` — OP-013 through OP-016 (prod env, deploy, webhook, health)
- `netlify.toml` — `[context.production.environment]` with `APP_ENV=production`
- Change record and agent run record

## Scope excluded

- Executing `netlify deploy --prod` (operator; blocked without CLI/site)
- Declaring production live (Phase 9 smoke DoD)
- Custom domain binding (documented as optional operator step)
- New application code or migrations

## Architecture impact

- Production runtime fail-closed via existing `env.ts` + `get-provider.ts`; runbook documents required Netlify Production scope
- `APP_ENV=production` in `netlify.toml` production context aligns with committed config
- Scheduled functions unchanged (`expire-bookings` @hourly, `purge-images` @daily)

## API impact

None.

## Data and migration impact

None. Rollback policy: previous Netlify deploy + kill switches; forward migrations only (ADR-015 / C-08).

## Security and privacy impact

- No secrets, site IDs, or portfolio values copied
- Production env checklist enforces gate secrets without repo defaults
- Kill switches documented for incident response without code deploy

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | pending (check-pr-readiness) |
| Typecheck | `npm run typecheck` | pending |
| Tests | `npm run test` | pending |
| Build | `npm run build` | pending |

No code changes beyond `netlify.toml` comment/context; existing CI covers regression.

## Deployment and rollback

- **Deploy (operator):** `netlify deploy --build --prod` after Production env complete (OP-013, OP-014)
- **Rollback:** Netlify UI → Deploys → publish previous deploy (ADR-015)
- **Kill switches:** `AI_GENERATION_ENABLED=false`, `PURGE_ENABLED=false`, `PHOTO_UPLOAD_ENABLED=false`
- **Database:** no `migrate down`

## Documentation updated

- `docs/deployment.md`
- `docs/operator-actions.md`
- `docs/changes/2026-07-31-phase-8-netlify-production-runbook.md` (this file)
- `docs/agent-runs/2026-07-31-phase-8.md`

## Remaining risks

- Production URL not verified until operator completes OP-002, OP-013, OP-014, OP-016
- Netlify CLI not available in agent environment
- Phase 9 required before declaring production success with Replicate real + full booking flow
- PR #16 (`test/e2e-a11y-ci`) may not be merged — production runbook branches from it per phase plan

## Verification status

- Planner: scoped to runbook/docs per recovery plan Phase 8
- Architect: aligned with ADR-001, ADR-003, ADR-015, portfolio pattern evidence
- Security: no secrets committed; fail-closed checklist documented
- Independent verifier: blocked — no Netlify CLI login; Draft PR
