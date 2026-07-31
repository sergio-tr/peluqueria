# Change record — Phase 3A Netlify preview bootstrap

**Date:** 2026-07-31  
**Branch:** `chore/netlify-preview-bootstrap`  
**Pull request:** https://github.com/sergio-tr/peluqueria/pull/10 (Draft)  
**Recovery phase:** 3A  
**Status:** COMPLETE (config/docs); VERIFICATION blocked on operator credentials

## Summary

Bootstrap remote preview infrastructure documentation and Netlify configuration for Next.js on Netlify. Adds public liveness endpoint, refines `netlify.toml` for `@netlify/plugin-nextjs`, documents portfolio deployment pattern evidence, preview env checklist, health checks, demo gate protection, and operator runbook. No production release; no secrets committed.

## Recovery phase

3A — Bootstrap remoto Netlify/Supabase (preview only).

## Scope included

- `netlify.toml` preview-oriented build config (Node 20, Next.js plugin, functions bundler)
- `GET /api/health` liveness probe + unit test
- Middleware bypass for `/api/health`
- `docs/deployment.md` preview runbook (HTTPS URL, env checklist, health checks, rollback)
- `docs/portfolio-netlify-evidence.md` sibling scan and pattern reuse
- `docs/operator-actions.md` OP-002, OP-004–OP-007

## Scope excluded

- Production deploy (`netlify deploy --prod`) — Phase 8
- Replicate webhook functional verification — Phase 3B
- Supabase project creation (operator)
- Live preview URL verification — blocked on Netlify login (OP-002)

## Architecture impact

- Health endpoint is intentionally public and stateless (no DB/secrets)
- Preview protection remains demo gate + optional Netlify access control
- Scheduled function unchanged from 2C; requires preview env at deploy time

## API impact

- New: `GET /api/health` → `{ ok: true, service: "peluqueria-nowi" }`

## Data and migration impact

- Operator must apply existing migrations on remote Supabase (OP-006); no new migrations in this phase

## Security and privacy impact

- No secrets in repo; env checklist uses empty placeholders only
- Health endpoint exposes no PII or configuration
- Demo gate unchanged; fail-closed without `DEMO_ACCESS_CODE`

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (76) |
| Build | `npm run build` | PASS |

## Deployment and rollback

- Preview: `netlify deploy --build` after `netlify login` + `netlify init`
- Rollback: previous Netlify deploy; rotate secrets if leaked (ADR-015)
- Unpublish preview site if bootstrap abandoned

## Documentation updated

- `docs/deployment.md`
- `docs/portfolio-netlify-evidence.md`
- `docs/operator-actions.md`
- `docs/agent-runs/2026-07-31-phase-3a.md`

## Remaining risks

- Preview URL not verified until operator completes OP-002, OP-005, OP-007
- Supabase remote empty until OP-004/OP-006 — `GET /api/services` returns 503 until configured
- Scheduled function not verified until first Netlify deploy with env vars

## Verification status

- Planner: N/A (scoped runbook)
- Architect: aligned with ADR-001, ADR-003, ADR-015
- Security: no secrets copied; health endpoint public by design
- Tests: unit test for `/api/health`
- Independent verifier: blocked — Netlify CLI not logged in; Draft PR
