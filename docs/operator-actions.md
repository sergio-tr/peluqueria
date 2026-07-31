# Operator actions

This file is updated by agents only when a human action is required.

Do not place secrets in this document.

| ID | Phase | Required action | Why | Status |
|---|---|---|---|---|
| OP-001 | Setup | Configure GitHub protection for `main` | Applied 2026-07-31 via `gh api` (required checks `governance` + `quality`, enforce admins, no force push, conversation resolution). Package script still needs UTF-8 JSON without BOM for reuse. | DONE |
| OP-002 | 3A | Run `netlify login` and confirm CLI auth | Preview deploy and site link (`netlify init` / `netlify deploy --build`) | PENDING |
| OP-003 | 3B | Provide Replicate token through secure environment | Real inference — set `REPLICATE_API_TOKEN` in Netlify preview scope | PENDING |
| OP-008 | 3B | Configure Replicate webhook signing secret and callback URL | Set `REPLICATE_WEBHOOK_SECRET` (from Replicate dashboard) and `WEBHOOK_BASE_URL` or `NEXT_PUBLIC_SITE_URL` to preview HTTPS host; register webhook URL `https://<preview-host>/api/webhooks/replicate` | PENDING |
| OP-009 | 3C | Create Supabase `results` Storage bucket (private) | AI output persistence; set `SUPABASE_STORAGE_BUCKET_RESULTS=results` in Netlify preview env | PENDING |
| OP-010 | 3C | Set AI budget env on preview | `AI_MONTHLY_BUDGET_EUR=30` (default); optional `AI_EUR_USD_RATE` for USD→EUR estimate | PENDING |
| OP-004 | 3A | Create Supabase project and set preview env vars in Netlify | Remote persistence for preview (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `DATA_STORE=supabase`) | PENDING |
| OP-005 | 3A | Create Netlify site, connect GitHub repo, set preview env vars | Preview HTTPS URL; see `docs/deployment.md` checklist (gate secrets, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`) | PENDING |
| OP-006 | 3A | Apply Supabase migrations on remote project | `npx supabase link` + `npx supabase db push`; optional controlled seed for preview | PENDING |
| OP-007 | 3A | Run post-deploy health checklist | Verify `GET /api/health`, gate redirect, gated `GET /api/services`, cron auth — document preview URL when live | PENDING |
| OP-011 | 5 | Verify purge cron after deploy | `POST /api/cron/purge` with `CRON_SECRET`; confirm Netlify function `purge-images` scheduled; set `PURGE_ENABLED=false` to disable | PENDING |
| OP-012 | 6 | Run AI benchmark (smoke 16 → matrix 48) | Requires `REPLICATE_API_TOKEN`, 6 subject photos in `benchmark-fixtures/photos/`, production 2D PNG ai_reference assets (not SVG); budget ~30 EUR | PENDING |
| OP-013 | 8 | Set production env vars in Netlify (Production scope) | Fail-closed checklist: `APP_ENV=production`, `DATA_STORE=supabase`, `AI_PROVIDER=replicate-qwen`, gate secrets (no defaults), Replicate token + webhook secret, `NEXT_PUBLIC_SITE_URL` — see `docs/deployment.md` | PENDING |
| OP-014 | 8 | Production deploy (`netlify deploy --build --prod` or Git production branch) | After OP-013; requires OP-002 login and linked site; **do not** publish until env complete | PENDING |
| OP-015 | 8 | Register Replicate webhook for production URL | `WEBHOOK_BASE_URL` / `NEXT_PUBLIC_SITE_URL` = production HTTPS host; register `https://<production-host>/api/webhooks/replicate` in Replicate dashboard | PENDING |
| OP-016 | 8 | Run production post-deploy health checklist | Health, gate, cron auth, scheduled functions `@hourly` / `@daily`; document production URL when verified — Phase 9 owns full smoke DoD | PENDING |
| OP-017 | 9 | Run production DoD smoke checklist | Full E2E on public URL with Replicate real + Demo Inbox; fill evidence JSON; see `docs/dod-smoke-checklist.md` | PENDING |

## OP-002 — Netlify CLI login

```bash
netlify login
netlify status   # should show linked account
```

## OP-005 — Preview site (after OP-002)

```bash
cd peluqueria
netlify init              # link existing site or create new
netlify deploy --build    # draft preview — NOT --prod
```

Set environment variables in Netlify UI → **Deploy previews** scope using names from `.env.example` (empty placeholders until values are ready).

## OP-006 — Supabase remote

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

## OP-007 — Health verification

Replace `<preview-host>` with the deploy URL from Netlify:

```bash
curl -sS "https://<preview-host>/api/health"
curl -sS -o /dev/null -w "%{http_code}\n" "https://<preview-host>/api/services"
```

Expected: health `200`; services `401` without demo cookie.

## OP-011 — Purge cron (Phase 5)

Replace `<preview-host>` and use the same `CRON_SECRET` as expire cron:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://<preview-host>/api/cron/purge"
```

Expected: `200` with JSON `{ purgedPhotos, purgedPaths, clearedBookings, clearedJobs, tiers }`.

Kill switch: set `PURGE_ENABLED=false` in Netlify env to disable purge without redeploying code logic.

Verify in Netlify UI → Functions → `purge-images` is scheduled (`@daily`).

## OP-008 — Replicate webhook (Phase 3B)

1. In [Replicate](https://replicate.com) account settings, create a webhook signing secret.
2. In Netlify preview env, set:
   - `AI_PROVIDER=replicate-qwen`
   - `REPLICATE_API_TOKEN=` (from Replicate account)
   - `REPLICATE_WEBHOOK_SECRET=` (signing secret, often `whsec_…`)
   - `WEBHOOK_BASE_URL=https://<preview-host>` (no trailing slash; optional if same as `NEXT_PUBLIC_SITE_URL`)
   - `AI_GENERATION_ENABLED=true`
3. Apply migration `20260731140000_webhook_deliveries_ai_job_d02.sql` on remote Supabase (OP-006).
4. Smoke: create job via demo flow → verify webhook delivery row and job `RUNNING` with D-02 metadata.

Kill switch: set `AI_GENERATION_ENABLED=false` to disable generation without redeploying code.

## OP-009 — Results Storage bucket (Phase 3C)

1. In Supabase Dashboard → Storage, create a **private** bucket named `results` (or match `SUPABASE_STORAGE_BUCKET_RESULTS`).
2. In Netlify preview env, set `SUPABASE_STORAGE_BUCKET_RESULTS=results`.
3. Smoke: create AI job → webhook succeeds → `GET /api/ai/jobs/[id]` returns `resultPreviewUrl` (signed, ~60s TTL) with no Replicate URL in response.

## OP-010 — AI budget (Phase 3C)

Default budget is **30 €/month** (`AI_MONTHLY_BUDGET_EUR=30`, D-04A). Alerts log at 70%, 90%, and 100% of budget (`[ai-budget-alert]` in function logs). Admin panel: `GET /api/admin/ai-usage` (auth required). Numeric monthly generation cap remains pending benchmark (D-04B).

## OP-012 — AI benchmark (Phase 6)

Prerequisites:

1. Merge production 2D catalog assets (`update/catalog-production-assets`) — SVG ai_reference is invalid.
2. Set `REPLICATE_API_TOKEN` in shell (never commit).
3. Place 6 licensed/synthetic subject photos per `scripts/ai-benchmark/fixtures/manifest.json` under `benchmark-fixtures/photos/` (gitignored).
4. Confirm monthly budget headroom (~30 EUR for 48 gens + smoke).

```bash
cd peluqueria

# Dry-run (no token) — writes PENDING records to benchmark-results/
npm run benchmark:smoke
npm run benchmark:matrix

# Live smoke gate (16 gens)
export REPLICATE_API_TOKEN=<from Replicate dashboard>
npm run benchmark:smoke
# Note output path: benchmark-results/smoke-16-<runId>.json

# Live definitive matrix (48 gens) — only after smoke passes
npm run benchmark:matrix -- --require-smoke-pass --smoke-result benchmark-results/smoke-16-<runId>.json

# After human review of outputs, fill teachable + dimensionScores in result JSON, then:
npm run benchmark:aggregate -- benchmark-results/matrix-48-<runId>.json

# Copy conclusions to docs/ai-benchmark.md; if d04b.status=PROPOSED, open ADR to close D-04B
```

Expected dry-run: all generations `status: PENDING`, `d04b.status: PENDING_BENCHMARK`.

Do not commit `benchmark-results/` or subject photos.

## OP-013 — Production environment (Phase 8)

After preview validation (OP-005, OP-007), configure Netlify UI → Environment variables → **Production** scope.

Required names (values operator-supplied only; never commit):

- `APP_ENV=production`, `DATA_STORE=supabase`
- `NEXT_PUBLIC_SITE_URL=https://<production-host>` (no trailing slash)
- `DEMO_ACCESS_CODE`, `DEMO_SESSION_SECRET` (≥32 chars), `IP_HASH_SECRET`, `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, storage bucket names
- `AI_PROVIDER=replicate-qwen`, `AI_GENERATION_ENABLED=true`
- `REPLICATE_API_TOKEN`, `REPLICATE_WEBHOOK_SECRET`, `WEBHOOK_BASE_URL` (or rely on site URL)

**Forbidden in production:** `DATA_STORE=memory`, unset gate secrets, `AI_PROVIDER=mock`.

Kill switches (set without code change): `AI_GENERATION_ENABLED=false`, `PURGE_ENABLED=false`, `PHOTO_UPLOAD_ENABLED=false`.

Full checklist: `docs/deployment.md` → Production release (Phase 8).

## OP-014 — Production deploy (Phase 8)

Prerequisites: OP-002 (CLI login), OP-013 (Production env complete).

```bash
cd peluqueria
netlify login
netlify link                    # if not linked
netlify deploy --build --prod   # operator only — NOT until OP-013 done
```

Alternative: Git-connected production branch deploy in Netlify UI (no CLI).

**Production is not declared live** until OP-016 and Phase 9 smoke DoD.

## OP-015 — Replicate webhook (production)

1. Confirm production HTTPS host is live (OP-014).
2. In Netlify Production env, set `WEBHOOK_BASE_URL=https://<production-host>` (or match `NEXT_PUBLIC_SITE_URL`).
3. In Replicate dashboard, register webhook URL:

   `https://<production-host>/api/webhooks/replicate`

4. Set `REPLICATE_WEBHOOK_SECRET` in Production env to match Replicate signing secret.

Kill switch: `AI_GENERATION_ENABLED=false`.

## OP-016 — Production health verification

Replace `<production-host>` with the production deploy URL:

```bash
curl -sS "https://<production-host>/api/health"
curl -sS -o /dev/null -w "%{http_code}\n" "https://<production-host>/api/services"
curl -sS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://<production-host>/api/cron/expire"
```

Expected: health `200`; services `401` without demo cookie; cron expire `200` (not `401`).

Verify Netlify UI → Functions → `expire-bookings` (`@hourly`), `purge-images` (`@daily`).

Rollback: Netlify UI → Deploys → publish previous deploy (ADR-015). No `migrate down`.

## OP-017 — Production DoD smoke (Phase 9)

**DoD status: NOT VERIFIED** until this operator action completes with dated evidence.

Prerequisites: OP-013 (production env), OP-014 (prod deploy), OP-015 (Replicate webhook), OP-016 (health checks pass).

1. Record production URL and deploy commit in evidence file:

   ```bash
   cd peluqueria
   npm run smoke:dod -- --init
   # → smoke-evidence/dod-smoke-<runId>.json (gitignored)
   ```

2. Edit the JSON: set `productionUrl`, `gitCommit`, then execute each step in `docs/dod-smoke-checklist.md`.

3. For each step, capture:
   - ISO-8601 `timestamp`
   - `status`: `PASS` or `FAIL`
   - `evidence.screenshot` path under `smoke-evidence/` (no faces or PII in Git)
   - `internalIds` only (booking ID, job ID, inbox message ID — no customer data)

4. Flow sequence (must all pass):

   Acceso → foto → consent → corte → **Replicate real** (no mock badge) → solicitud → admin revisión → propuesta → **Demo Inbox** → confirm (incognito) → agenda bloqueada → solape rechazado.

5. Overlap test: after confirming booking A, submit booking B for the same barber/time window — expect rejection.

6. When all steps pass, set `dodStatus` to `VERIFIED`, fill `attestation`, then validate:

   ```bash
   npm run smoke:dod -- --validate smoke-evidence/dod-smoke-<runId>.json
   ```

7. Update `docs/implementation-status.md` DoD section with run ID and date — **only after** validation passes.

Kill switch during smoke: `AI_GENERATION_ENABLED=false`.

**Do not** commit `smoke-evidence/` or subject photos.
