# Autonomous recovery summary — Peluquería Nowi

**Date:** 2026-07-31  
**Tip branch:** `fix/mvp-final-hardening`  
**Base stack:** `test/production-dod-smoke` (PR #18)  
**Merge target:** `main` (ordered merge commits; operator merges)

## Branches and pull requests

| # | Phase | Branch | PR | Draft |
|---:|---|---|---|:---:|
| 1 | Governance | `chore/agent-governance` | https://github.com/sergio-tr/peluqueria/pull/1 | |
| 2 | 1A Persistence foundation | `feature/persistence-foundation` | https://github.com/sergio-tr/peluqueria/pull/2 | |
| 3 | 1B Master data | `feature/master-data-persistence` | https://github.com/sergio-tr/peluqueria/pull/3 | |
| 4 | 1C Secure photos | `security/secure-photo-storage` | https://github.com/sergio-tr/peluqueria/pull/4 | ✓ |
| 5 | 1D Operational persistence | `feature/operational-persistence` | https://github.com/sergio-tr/peluqueria/pull/5 | ✓ |
| 6 | 2A Admin auth | `security/admin-auth-api-protection` | https://github.com/sergio-tr/peluqueria/pull/6 | |
| 7 | 2B Booking transactions | `fix/booking-transaction-consistency` | https://github.com/sergio-tr/peluqueria/pull/7 | ✓ |
| 8 | 2C Idempotent confirm | `feature/idempotent-confirmation-expiration` | https://github.com/sergio-tr/peluqueria/pull/8 | ✓ |
| 9 | 2D Catalog assets | `update/catalog-production-assets` | https://github.com/sergio-tr/peluqueria/pull/9 | ✓ |
| 10 | 3A Netlify preview | `chore/netlify-preview-bootstrap` | https://github.com/sergio-tr/peluqueria/pull/10 | ✓ |
| 11 | 3B Replicate webhook | `feature/replicate-async-webhook` | https://github.com/sergio-tr/peluqueria/pull/11 | ✓ |
| 12 | 3C Storage + limits | `feature/replicate-storage-limits` | https://github.com/sergio-tr/peluqueria/pull/12 | ✓ |
| 13 | 4 Demo Inbox | `feature/durable-demo-inbox` | https://github.com/sergio-tr/peluqueria/pull/13 | |
| 14 | 5 Retention / privacy | `security/privacy-retention-logging` | https://github.com/sergio-tr/peluqueria/pull/14 | ✓ |
| 15 | 6 AI benchmark | `test/ai-benchmark` | https://github.com/sergio-tr/peluqueria/pull/15 | ✓ |
| 16 | 7 E2E / a11y / CI | `test/e2e-a11y-ci` | https://github.com/sergio-tr/peluqueria/pull/16 | |
| 17 | 8 Production runbook | `release/netlify-production` | https://github.com/sergio-tr/peluqueria/pull/17 | ✓ |
| 18 | 9 DoD smoke checklist | `test/production-dod-smoke` | https://github.com/sergio-tr/peluqueria/pull/18 | ✓ |
| 19 | Final hardening | `fix/mvp-final-hardening` | https://github.com/sergio-tr/peluqueria/pull/19 | ✓ |

**Total open PRs:** 19

## Merge order

Merge **in numeric order** (#1 → #19). Each branch was created from its predecessor while PRs remain unmerged (`docs/agent-operations.md`).

```
#1 governance → #2 1A → #3 1B → #4 1C → #5 1D → #6 2A → #7 2B → #8 2C → #9 2D
→ #10 3A → #11 3B → #12 3C → #13 4 → #14 5 → #15 6 → #16 7 → #17 8 → #18 9 → #19 final
```

After #19 merges to `main`, operator runs production deploy and DoD smoke (OP-013–OP-017).

## Checks status

### Local (tip branch `fix/mvp-final-hardening`, 2026-07-31)

| Check | Result |
|-------|--------|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS (139 tests) |
| `npm run build` | PASS |
| `node .cursor/scripts/check-pr-readiness.mjs` | PASS |

### CI (GitHub Actions — sample, may change)

| PR | governance | quality | e2e | Notes |
|----|:---:|:---:|:---:|---|
| #1 | fail | pass | — | Re-run or fix governance gate on merge |
| #18 | fail | pending | pending | Stack tip before final PR |

CI status is **not fully green** on several stack PRs at time of final pass. Re-verify after each merge.

## Kill switches (single canonical doc)

**Source of truth:** `docs/deployment.md` § *Kill switches (no redeploy required)*

| Switch | Variable | Effect |
|--------|----------|--------|
| AI off | `AI_GENERATION_ENABLED=false` | Blocks new generations |
| Purge off | `PURGE_ENABLED=false` | Disables retention purge |
| Upload off | `PHOTO_UPLOAD_ENABLED=false` | Blocks new photo uploads |

Policy: ADR-015 / C-08 — prefer kill switches for incidents; previous Netlify deploy for code regressions.

## Blockers and operator actions

| ID | Phase | Action | Status |
|----|-------|--------|--------|
| OP-001 | Setup | GitHub branch protection | DONE |
| OP-002 | 3A | `netlify login` | PENDING |
| OP-003 | 3B | Replicate token (preview) | PENDING |
| OP-004 | 3A | Supabase project + preview env | PENDING |
| OP-005 | 3A | Netlify site + preview env | PENDING |
| OP-006 | 3A | Supabase migrations remote | PENDING |
| OP-007 | 3A | Preview health checklist | PENDING |
| OP-008 | 3B | Replicate webhook secret + URL | PENDING |
| OP-009 | 3C | Supabase `results` bucket | PENDING |
| OP-010 | 3C | AI budget env | PENDING |
| OP-011 | 5 | Purge cron verification | PENDING |
| OP-012 | 6 | AI benchmark smoke 16 → matrix 48 | PENDING |
| OP-013 | 8 | Production env vars (Netlify) | PENDING |
| OP-014 | 8 | Production deploy | PENDING |
| OP-015 | 8 | Replicate webhook (production URL) | PENDING |
| OP-016 | 8 | Production health checklist | PENDING |
| OP-017 | 9 | Production DoD smoke + evidence | PENDING |

Full detail: `docs/operator-actions.md`

**Stack merge:** operator merges PRs #1–#19 in order (merge commits, not squash if history matters for stack).

**External credentials:** Supabase, Netlify, Replicate, GitHub — never committed; placeholders only in `.env.example`.

## Definition of Done

**DoD status: NOT VERIFIED**

- No public URL smoke with live Replicate has been executed
- No production deploy attested in this recovery pass
- Evidence template: `docs/dod-smoke-checklist.md`, `npm run smoke:dod`
- Do not set `dodStatus: VERIFIED` until OP-017 completes with evidence

## Remaining P0 / P1 (post-code, pre-verification)

Gaps below are **addressed in tip branch code** but remain **unverified** until merge, deploy, and operator smoke/benchmark.

### P0 — still blocking production readiness

| ID | Gap | Mitigation on stack | Verification needed |
|----|-----|---------------------|---------------------|
| P0-2 | No prod deploy / public URL | Phase 8 runbook (#17) | OP-013–OP-016 |
| P0-3 | No Replicate real smoke | Phases 3B–3C + 9 checklist | OP-017 |
| P0-6 | Benchmark 48 not executed | Phase 6 harness (#15) | OP-012 |

### P1 — monitor after deploy

| ID | Gap | Phase | Notes |
|----|-----|-------|-------|
| P1-9 | RLS not fully exercised | 1A–1D | Verify with Supabase policies post-deploy |
| P1-10 | AI limits / budget alerts | 3C | Confirm counters + alerts on preview/prod |
| P1-13 | Seed vs asset formats | 1B / 2D | 2D PNG assets required for benchmark |

### Deferred by decision (not blockers for MVP smoke)

| Item | Status |
|------|--------|
| D-04B monthly generation cap | PENDING_BENCHMARK (after OP-012) |
| Resend / email | Out of scope (D-01 Demo Inbox) |

Full gap catalog: `docs/production-gap-analysis.md`

## Related documents

- Recovery plan: `docs/recovery-implementation-plan.md`
- Implementation status: `docs/implementation-status.md`
- Agent operations / stack: `docs/agent-operations.md`
- Deployment + kill switches: `docs/deployment.md`
- Baseline audit (pre-merge `main`): `docs/current-state-audit.md`
