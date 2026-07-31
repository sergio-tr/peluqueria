# Agent operations runbook

## One-time setup

1. Bootstrap `main` from the current repository state.
2. Install this governance package in `chore/agent-governance`.
3. Open PR against `main`.
4. Start subsequent branches from `chore/agent-governance` when the PR has not yet been merged.

## Autonomous recovery stack

| Order | Phase | Branch |
|---:|---|---|
| 1 | Governance | `chore/agent-governance` |
| 2 | 1A | `feature/persistence-foundation` |
| 3 | 1B | `feature/master-data-persistence` |
| 4 | 1C | `security/secure-photo-storage` |
| 5 | 1D | `feature/operational-persistence` |
| 6 | 2A | `security/admin-auth-api-protection` |
| 7 | 2B | `fix/booking-transaction-consistency` |
| 8 | 2C | `feature/idempotent-confirmation-expiration` |
| 9 | 2D | `update/catalog-production-assets` |
| 10 | 3A | `chore/netlify-preview-bootstrap` |
| 11 | 3B | `feature/replicate-async-webhook` |
| 12 | 3C | `feature/replicate-storage-limits` |
| 13 | 4 | `feature/durable-demo-inbox` |
| 14 | 5 | `security/privacy-retention-logging` |
| 15 | 6 | `test/ai-benchmark` |
| 16 | 7 | `test/e2e-a11y-ci` |
| 17 | 8 | `release/netlify-production` |
| 18 | 9 | `test/production-dod-smoke` |
| 19 | Final | `fix/mvp-final-hardening` |

## Branch base

- Create each branch from the previous branch if the previous PR remains unmerged.
- Open every PR against `main`.
- Mention the predecessor in the PR body.
- The user merges in order with merge commits.

## External blockers

Credentials or approvals may block:

- Supabase remote;
- Netlify authentication;
- Replicate token;
- webhook secret;
- GitHub permissions;
- benchmark budget.

When blocked:

1. complete all non-secret code;
2. add tests with controlled adapters;
3. open Draft PR;
4. update `docs/operator-actions.md`;
5. do not claim VERIFIED;
6. continue only when the next task is not dependent on the missing resource.

## Agent run records

Each phase creates:

`docs/agent-runs/<phase>-<branch-slug>.md`

Include:

- start/end status;
- base commit;
- branch;
- PR URL;
- agents used;
- files changed;
- commands;
- tests;
- blockers;
- remaining risks.
