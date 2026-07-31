# Change record — Phase 9 production DoD smoke checklist

**Date:** 2026-07-31  
**Branch:** `test/production-dod-smoke`  
**Pull request:** pending  
**Recovery phase:** 9  
**Status:** COMPLETE (checklist/docs); DoD **NOT VERIFIED** — no public Replicate smoke executed

## Summary

Documents the Phase 9 production smoke Definition of Done checklist aligned with recovery plan Fase 9: full booking flow on a public URL with Replicate real and Demo Inbox confirmation. Adds evidence template JSON, CLI helper (`npm run smoke:dod`), operator action OP-017, and explicit **NOT VERIFIED** DoD status. No live production smoke was run in this PR.

## Recovery phase

9 — Smoke DoD (checklist and operator runbook only).

## Scope included

- `docs/dod-smoke-checklist.md` — step-by-step checklist with PENDING evidence slots
- `scripts/production-dod-smoke/` — evidence template + `run-checklist.mjs` (`--init`, `--validate`)
- `package.json` — `smoke:dod` npm script
- `.gitignore` — `smoke-evidence/` (screenshots, no PII in Git)
- `docs/operator-actions.md` — OP-017 production DoD smoke
- `docs/testing-strategy.md`, `docs/deployment.md`, `docs/implementation-status.md` — cross-links and DoD status
- Change record and agent run record

## Scope excluded

- Executing public Replicate smoke on production URL
- Declaring DoD VERIFIED or production live
- Playwright automation against prod (budget + secrets)
- Application code changes

## Architecture impact

None. Documentation and operator tooling only.

## API impact

None.

## Data and migration impact

None.

## Security and privacy impact

- Evidence lives under gitignored `smoke-evidence/`; checklist forbids PII in Git
- No secrets or production URLs committed
- DoD remains NOT VERIFIED until operator attestation

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (139) |
| Build | `npm run build` | PASS |
| Checklist print | `npm run smoke:dod` | PASS |
| Evidence init | `npm run smoke:dod -- --init` | PASS (PENDING record) |
| PR readiness | `node .cursor/scripts/check-pr-readiness.mjs` | PASS |

Docs-only + script helper; CI regression via existing pipeline on merge.

## Deployment and rollback

- **Operator:** complete OP-017 after OP-013–OP-016; fill evidence JSON; set `dodStatus: VERIFIED` only when all steps pass
- **Rollback during smoke:** `AI_GENERATION_ENABLED=false` (ADR-015)
- No deploy required for this PR

## Documentation updated

- `docs/dod-smoke-checklist.md`
- `docs/operator-actions.md`
- `docs/testing-strategy.md`
- `docs/deployment.md`
- `docs/implementation-status.md`
- `docs/changes/2026-07-31-phase-9-production-dod-smoke.md` (this file)
- `docs/agent-runs/2026-07-31-phase-9.md`

## Remaining risks

- Public Replicate smoke not executed — DoD **NOT VERIFIED**
- Depends on Phase 8 production deploy (PR #17) and operator credentials
- Overlap rejection step requires manual second booking attempt on prod
- Benchmark definitive 48 may remain PENDING_BENCHMARK (D-04B) — separate from this smoke

## Verification status

- Planner: scoped to checklist per recovery plan Phase 9
- Architect: N/A (no code architecture change)
- Security: no secrets; gitignored evidence; PII policy documented
- Tests: existing CI; smoke helper smoke-tested locally
- Independent verifier: blocked — no production URL or Replicate live run; Draft PR
