# Implementation status

**Updated:** 2026-07-31 (final hardening pass)

## Recovery execution

Autonomous recovery stack is **implemented on branch tip** (`fix/mvp-final-hardening` ← … ← `chore/agent-governance`). All phase PRs remain **open against `main`** pending ordered merge. See `docs/autonomous-recovery-summary.md` for URLs, merge order, and blockers.

## Phase stack (code on tip branch)

| Order | Phase | Branch | PR | Code status |
|---:|---|---|---|---|
| 1 | Governance | `chore/agent-governance` | [#1](https://github.com/sergio-tr/peluqueria/pull/1) | COMPLETE (open) |
| 2 | 1A | `feature/persistence-foundation` | [#2](https://github.com/sergio-tr/peluqueria/pull/2) | COMPLETE (open) |
| 3 | 1B | `feature/master-data-persistence` | [#3](https://github.com/sergio-tr/peluqueria/pull/3) | COMPLETE (open) |
| 4 | 1C | `security/secure-photo-storage` | [#4](https://github.com/sergio-tr/peluqueria/pull/4) | COMPLETE (open) |
| 5 | 1D | `feature/operational-persistence` | [#5](https://github.com/sergio-tr/peluqueria/pull/5) | COMPLETE (open) |
| 6 | 2A | `security/admin-auth-api-protection` | [#6](https://github.com/sergio-tr/peluqueria/pull/6) | COMPLETE (open) |
| 7 | 2B | `fix/booking-transaction-consistency` | [#7](https://github.com/sergio-tr/peluqueria/pull/7) | COMPLETE (open) |
| 8 | 2C | `feature/idempotent-confirmation-expiration` | [#8](https://github.com/sergio-tr/peluqueria/pull/8) | COMPLETE (open) |
| 9 | 2D | `update/catalog-production-assets` | [#9](https://github.com/sergio-tr/peluqueria/pull/9) | COMPLETE (open) |
| 10 | 3A | `chore/netlify-preview-bootstrap` | [#10](https://github.com/sergio-tr/peluqueria/pull/10) | COMPLETE (open) |
| 11 | 3B | `feature/replicate-async-webhook` | [#11](https://github.com/sergio-tr/peluqueria/pull/11) | COMPLETE (open) |
| 12 | 3C | `feature/replicate-storage-limits` | [#12](https://github.com/sergio-tr/peluqueria/pull/12) | COMPLETE (open) |
| 13 | 4 | `feature/durable-demo-inbox` | [#13](https://github.com/sergio-tr/peluqueria/pull/13) | COMPLETE (open) |
| 14 | 5 | `security/privacy-retention-logging` | [#14](https://github.com/sergio-tr/peluqueria/pull/14) | COMPLETE (open) |
| 15 | 6 | `test/ai-benchmark` | [#15](https://github.com/sergio-tr/peluqueria/pull/15) | COMPLETE (open) |
| 16 | 7 | `test/e2e-a11y-ci` | [#16](https://github.com/sergio-tr/peluqueria/pull/16) | COMPLETE (open) |
| 17 | 8 | `release/netlify-production` | [#17](https://github.com/sergio-tr/peluqueria/pull/17) | COMPLETE (open) |
| 18 | 9 | `test/production-dod-smoke` | [#18](https://github.com/sergio-tr/peluqueria/pull/18) | COMPLETE (open) |
| 19 | Final | `fix/mvp-final-hardening` | [#19](https://github.com/sergio-tr/peluqueria/pull/19) | COMPLETE (open) |

## Runtime truth (tip branch)

- Production must use Supabase (`DATA_STORE=supabase`); memory forbidden in prod (fail-closed config).
- Master-data APIs, bookings, photos, Replicate async/webhook, Demo Inbox, retention purge: implemented on tip; **not verified** on public URL until deploy + smoke.
- Kill switches: canonical table in `docs/deployment.md` § *Kill switches*.

## Local quality gates (tip branch, 2026-07-31)

| Check | Result |
|-------|--------|
| Lint | PASS |
| Typecheck | PASS |
| Tests | PASS (139) |
| Build | PASS |
| PR readiness | PASS |

CI on open PRs may be pending or failing (e.g. `governance` on stack PRs) — see `docs/autonomous-recovery-summary.md`.

## DoD

**Status: NOT VERIFIED**

- Phase 9 smoke checklist: `docs/dod-smoke-checklist.md`
- Operator action OP-017 pending — no public Replicate smoke executed with evidence
- Production not declared live until OP-013–OP-017 complete and `dodStatus` attested VERIFIED
