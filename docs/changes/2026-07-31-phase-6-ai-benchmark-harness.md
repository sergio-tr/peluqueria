# Change record — Phase 6 AI benchmark harness

**Date:** 2026-07-31  
**Branch:** `test/ai-benchmark`  
**Pull request:** pending  
**Recovery phase:** 6  
**Status:** COMPLETE

## Summary

Adds the Phase 6 AI benchmark harness: rubric scoring module with unit tests, JSON result schema, smoke-16 and matrix-48 runner scripts (live when `REPLICATE_API_TOKEN` is set, otherwise dry-run PENDING), D-04B p95 cost cap proposal hook, rubric docs, and operator runbook (OP-012). Definitive 48-generation live run **not executed** in this PR.

## Recovery phase

6 — Benchmark (harness + protocol; live execution deferred).

## Scope included

- `src/domain/ai/benchmark-rubric.ts` — weights 30/25/20/10/10/5, teachable ≥80 %, p95 stats
- `src/domain/ai/benchmark-d04b.ts` — monthly cap proposal hook (PENDING_BENCHMARK until live p95)
- `src/domain/ai/benchmark-record.ts` — Zod result schema
- Unit tests for rubric, D-04B, golden fixture parity
- `scripts/ai-benchmark/` — smoke-16, matrix-48, aggregate, manifest, golden vectors
- npm scripts: `benchmark:smoke`, `benchmark:matrix`, `benchmark:aggregate`, `benchmark:self-test`
- Docs: `docs/ai-benchmark.md`, `docs/ai-benchmark/rubric.md`, `docs/ai-benchmark/result-template.json`
- Decision register D-04B note; operator action OP-012
- `.gitignore` for `benchmark-results/` and subject photos

## Scope excluded

- Definitive matrix 48 live execution (requires token, photos, production 2D assets)
- Modal / HairFastGAN
- Model version pin (D-02 — post go/no-go ADR)
- Closing D-04B numerically

## Architecture impact

- Benchmark logic isolated under `src/domain/ai/`; runners are operator-facing Node scripts
- No app runtime or migration changes

## API impact

None.

## Data and migration impact

None. Results written to gitignored `benchmark-results/`.

## Security and privacy impact

- No Replicate calls without operator-supplied token
- Subject photos and outputs excluded from Git
- Dry-run mode documents PENDING without inventing scores

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Tests | `npm run test` | PASS (139) |
| Benchmark self-test | `npm run benchmark:self-test` | PASS |
| Dry-run smoke | `npm run benchmark:smoke` | PASS (16× PENDING) |
| Dry-run matrix | `npm run benchmark:matrix` | PASS (48× PENDING) |
| Build | `npm run build` | PASS |

## Deployment and rollback

No deploy required. Harness is local/operator tooling.

## Documentation updated

- `docs/ai-benchmark.md`, `docs/ai-benchmark/rubric.md`, `docs/ai-benchmark/result-template.json`
- `docs/decision-register.md` (D-04B harness note)
- `docs/operator-actions.md` (OP-012)
- This change record and `docs/agent-runs/2026-07-31-phase-6.md`

## Remaining risks

- Live benchmark cost (~30 EUR budget) not spent; go/no-go undecided
- Production 2D assets may still be pending merge (PR stack)
- Human review step required after live run

## Verification status

- Planner: N/A (scoped harness)
- Architect: N/A
- Security: no token invention; fixtures gitignored
- Tests: rubric unit + golden parity
- Independent verifier: pending

## Stack dependency

Branch from `security/privacy-retention-logging` (PR #14). Merge after PR #14 and production catalog assets (2D) for operator live run.
