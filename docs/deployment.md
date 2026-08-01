# Deployment

## Stack hosting

| Layer | Provider | Role |
|-------|----------|------|
| App + cron | Netlify | Next.js, Scheduled Functions, env vars |
| Data | Supabase | Postgres, Auth, Storage |
| AI | Replicate | Async inference (Phase 3B+) |

Resend: **not** in v1.

## Phase scope

| Phase | Scope |
|-------|-------|
| **3A** | Preview site, HTTPS URL, env checklist, health checks, demo gate |
| **8 (this runbook)** | Production release runbook, production env scope, cron, webhook prod URL |

---

## Preview bootstrap (Phase 3A)

### Prerequisites (operator)

1. Netlify account with CLI access (`netlify login`) — see `docs/operator-actions.md` OP-002.
2. Supabase project created and linked — OP-004, OP-005.
3. GitHub repo connected to Netlify (recommended) or manual CLI deploy.

### Create / link Netlify site

Use the same mechanism as the workspace portfolio: Git-connected site in the Netlify UI, or CLI:

```bash
netlify login
netlify init          # link repo or create site — operator chooses site name
netlify deploy --build   # draft preview deploy (NOT --prod)
```

Do **not** use `--prod` until Phase 8.

After link, record the preview base URL (no trailing slash):

```text
NEXT_PUBLIC_SITE_URL=https://<your-site-name>.netlify.app
```

Set this in Netlify → Site configuration → Environment variables → **Deploy previews** (and optionally **Branch deploys**).

### Build configuration

Committed in `netlify.toml`:

- Build: `npm run build`
- Plugin: `@netlify/plugin-nextjs` (Next.js App Router adapter)
- Node: 20
- Scheduled function: `netlify/functions/expire-bookings.mts` (`@hourly`)

Netlify installs the Next.js plugin from `netlify.toml`; no manual publish directory.

### Preview environment variables

Configure in Netlify UI → Environment variables → scope **Deploy previews** (and branch deploys if used).  
Copy names from `.env.example`; **leave values empty until the operator supplies secrets**. No defaults for gate or auth secrets.

| Variable | Required for preview | Notes |
|----------|---------------------|-------|
| `DATA_STORE` | Yes | `supabase` |
| `NEXT_PUBLIC_SITE_URL` | Yes | HTTPS preview URL |
| `DEMO_ACCESS_CODE` | Yes | Demo gate — operator-generated |
| `DEMO_SESSION_SECRET` | Yes | ≥32 chars random |
| `IP_HASH_SECRET` | Yes | Rate-limit hashing |
| `CRON_SECRET` | Yes | Cron + scheduled function |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side only |
| `AI_PROVIDER` | Preview smoke | `mock` or unset until 3B |
| `REPLICATE_*` | Phase 3B+ | Not required for 3A health |
| `AI_GENERATION_ENABLED` | Optional | `false` until Replicate ready |

Full list: `.env.example`.

### Supabase remote migrations

After creating the Supabase project:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

Apply seed only in a controlled preview/staging context (`supabase/seed/seed.sql`). See `supabase/README.md`.

### Preview protection (demo gate)

Preview is **not** public internet anonymous access:

- Middleware enforces demo gate on `/`, `/probar`, `/reservar`, and most `/api/*` routes.
- Visitor enters `DEMO_ACCESS_CODE` at `/acceso` → signed httpOnly cookie.
- Admin routes use Supabase Auth (`/admin/login`).
- Public exceptions: `/acceso`, `/api/demo-access`, `/api/health`, `/api/webhooks/replicate`, `/api/cron/expire`.

Optional Netlify **password protection** (Site → Access control) adds a second layer; demo gate remains required for app routes.

### HTTPS webhook-ready URL

Preview base URL must be HTTPS for future webhooks (Replicate Phase 3B):

```text
POST https://<preview-host>/api/webhooks/replicate
POST https://<preview-host>/api/cron/expire   (Authorization: Bearer $CRON_SECRET)
```

Document the chosen preview URL in operator notes; do not commit secrets.

### Health checks (manual checklist)

Run after first successful preview deploy:

| # | Check | Command / action | Expected |
|---|-------|------------------|----------|
| 1 | Liveness | `GET /api/health` | `200` `{ "ok": true, "service": "peluqueria-nowi" }` |
| 2 | Gate (HTML) | `GET /` without cookie | Redirect to `/acceso` |
| 3 | Gate (API) | `GET /api/services` without cookie | `401` `DEMO_ACCESS_REQUIRED` |
| 4 | Gate (pass) | POST `/api/demo-access` with valid code → cookie → `GET /api/services` | `200` with services (requires Supabase + seed) |
| 5 | Cron reachability | `POST /api/cron/expire` with `Authorization: Bearer $CRON_SECRET` | `200` or domain error if DB empty — not `401` |
| 6 | Scheduled function | Netlify UI → Functions → `expire-bookings` | Enabled, `@hourly` |

Example (replace host):

```bash
curl -sS "https://<preview-host>/api/health"
curl -sS -o /dev/null -w "%{http_code}" "https://<preview-host>/api/services"
```

### Local verification (pre-deploy)

```bash
npm run lint && npm run typecheck && npm test
npm run build
```

### Rollback (preview)

Per ADR-015:

- **Deploy rollback:** Netlify UI → Deploys → publish previous deploy.
- **Unpublish preview:** disable deploys or delete preview site.
- **Secrets:** rotate in Netlify UI if leaked.
- **Database:** forward migrations only; no generic `migrate down`.

---

## Production release (Phase 8)

**Status:** Runbook only — production is **not** declared live until Phase 9 smoke DoD on a verified production URL.

Promotes the same Git-connected Netlify mechanism as preview (Phase 3A) and the workspace portfolio pattern (`docs/portfolio-netlify-evidence.md`). Operator executes all steps; agents do not run `netlify deploy --prod` without CLI auth and a linked site.

### Prerequisites (gates before prod)

All must be green before the first production publish:

| Gate | Requirement |
|------|-------------|
| CI | `governance` + `quality` + `e2e` green on merge base (Phase 7) |
| Supabase | Remote project linked; all migrations applied (`npx supabase db push`) |
| Replicate | Token, webhook signing secret, production callback URL registered |
| Storage | Supabase buckets `photos`, `results`, `hairstyles` (private where required) |
| Benchmark | Phase 6 smoke pass documented (D-04B may remain PENDING_BENCHMARK) |
| Preview | Phase 3A preview deploy validated (health, gate, cron auth) |
| Operator | `netlify login` (OP-002); production env vars ready (OP-013) |

### Create / link production site

Same account and CLI login as preview (portfolio pattern). Either:

1. **Git production branch deploy** (recommended): connect repo → set production branch in Netlify UI → merge to that branch triggers prod build, or  
2. **CLI production publish** (operator only, after env configured):

```bash
netlify login
cd peluqueria
netlify link              # if not already linked from preview
netlify deploy --build --prod   # ONLY after Production env scope is complete
```

Do **not** run `--prod` until the production env checklist below is satisfied. Prefer a dedicated production site or branch deploy context over reusing an unverified preview URL.

Record the production base URL (no trailing slash):

```text
NEXT_PUBLIC_SITE_URL=https://<your-production-host>
```

Set in Netlify → Site configuration → Environment variables → **Production** scope (and **Production branch** if using branch deploys).

### Build configuration

Committed in `netlify.toml`:

- Build: `npm run build`
- Plugin: `@netlify/plugin-nextjs`
- Node: 20
- `[context.production.environment]`: `APP_ENV=production` (fail-closed runtime; no secrets in repo)
- Scheduled: `expire-bookings` (`@hourly`), `purge-images` (`@daily`)

### Production environment variables (fail-closed)

Configure in Netlify UI → Environment variables → scope **Production** only.  
Copy names from `.env.example`; **never commit values**. No defaults for gate, auth, cron, or AI secrets.

| Variable | Required | Production value / rule |
|----------|----------|-------------------------|
| `APP_ENV` | Yes (also in `netlify.toml`) | `production` |
| `DATA_STORE` | Yes | `supabase` — **`memory` rejected at runtime** |
| `NEXT_PUBLIC_SITE_URL` | Yes | HTTPS production URL (no trailing slash) |
| `DEMO_ACCESS_CODE` | Yes | Operator-generated — **no repo default** |
| `DEMO_SESSION_SECRET` | Yes | ≥32 chars random — **no repo default** |
| `IP_HASH_SECRET` | Yes | Rate-limit hashing |
| `CRON_SECRET` | Yes | Cron + scheduled functions |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side only |
| `SUPABASE_STORAGE_BUCKET_*` | Yes | `photos`, `results`, `hairstyles` |
| `AI_PROVIDER` | Yes | **`replicate-qwen`** (mock forbidden on remote runtime) |
| `AI_GENERATION_ENABLED` | Yes | `true` for live AI (kill switch: `false`) |
| `REPLICATE_API_TOKEN` | Yes | From Replicate account |
| `REPLICATE_WEBHOOK_SECRET` | Yes | From Replicate dashboard |
| `WEBHOOK_BASE_URL` | Yes | Same as production HTTPS host if not inferring from `NEXT_PUBLIC_SITE_URL` |
| `REPLICATE_MODEL` | Recommended | `qwen/qwen-image-edit-plus` |
| `AI_MONTHLY_BUDGET_EUR` | Recommended | `30` (D-04A) |
| `PURGE_ENABLED` | Optional | Default on; `false` disables purge |
| `PHOTO_UPLOAD_ENABLED` | Optional | Default on; `false` disables uploads |

Full list: `.env.example`.

**Fail-closed checks (app enforces):**

- `DATA_STORE=memory` → startup/config error in production
- Missing `DEMO_ACCESS_CODE` / `DEMO_SESSION_SECRET` → gate returns 503; demo login fails closed
- `AI_PROVIDER=mock` on remote runtime → `503 AI_NOT_CONFIGURED`
- Missing `REPLICATE_API_TOKEN` with `replicate-qwen` → `503 AI_NOT_CONFIGURED`

### HTTPS webhook and cron (production URLs)

Register in Replicate dashboard (operator):

```text
POST https://<production-host>/api/webhooks/replicate
```

Cron endpoints (scheduled functions call these with `Authorization: Bearer $CRON_SECRET`):

```text
POST https://<production-host>/api/cron/expire    (@hourly via expire-bookings)
POST https://<production-host>/api/cron/purge     (@daily via purge-images)
```

After first production deploy, verify in Netlify UI → Functions:

| Function | Schedule | Env required |
|----------|----------|--------------|
| `expire-bookings` | `@hourly` | `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` |
| `purge-images` | `@daily` | `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` |

### Kill switches (no redeploy required)

Set in Netlify UI → Production env, then trigger redeploy or wait for next build:

| Switch | Variable | Effect |
|--------|----------|--------|
| AI off | `AI_GENERATION_ENABLED=false` | Blocks new generations; existing jobs unchanged |
| Purge off | `PURGE_ENABLED=false` | Disables scheduled and manual retention purge |
| Upload off | `PHOTO_UPLOAD_ENABLED=false` | Blocks new photo uploads |

Per ADR-015 / C-08: prefer kill switches for fast incident response; use deploy rollback for code regressions.

### Production health checks (operator checklist)

Run after first successful **production** publish (replace `<production-host>`):

| # | Check | Command / action | Expected |
|---|-------|------------------|----------|
| 1 | Liveness | `GET /api/health` | `200` `{ "ok": true, "service": "peluqueria-nowi" }` |
| 2 | Gate (HTML) | `GET /` without cookie | Redirect to `/acceso` |
| 3 | Gate (API) | `GET /api/services` without cookie | `401` `DEMO_ACCESS_REQUIRED` |
| 4 | Gate (pass) | POST `/api/demo-access` with valid code → cookie → `GET /api/services` | `200` with services |
| 5 | AI fail-closed | Ensure `AI_PROVIDER=replicate-qwen` + token set; mock must not appear in UI | No mock badge on prod |
| 6 | Cron expire | `POST /api/cron/expire` with `Authorization: Bearer $CRON_SECRET` | `200` (not `401`) |
| 7 | Cron purge | `POST /api/cron/purge` with `Authorization: Bearer $CRON_SECRET` | `200` with purge JSON |
| 8 | Scheduled functions | Netlify UI → Functions | `expire-bookings` `@hourly`, `purge-images` `@daily` |
| 9 | Webhook URL | Replicate dashboard | Points to production `/api/webhooks/replicate` |

Example:

```bash
curl -sS "https://<production-host>/api/health"
curl -sS -o /dev/null -w "%{http_code}\n" "https://<production-host>/api/services"
```

Full end-to-end smoke DoD (Replicate real, Demo Inbox, booking flow) is **Phase 9**, not Phase 8.

### Rollback (production)

Per ADR-015 / C-08:

| Scenario | Action |
|----------|--------|
| Bad deploy | Netlify UI → Deploys → **Publish previous deploy** |
| AI incident | Set `AI_GENERATION_ENABLED=false` in Production env |
| Purge incident | Set `PURGE_ENABLED=false` or disable `purge-images` schedule |
| Upload incident | Set `PHOTO_UPLOAD_ENABLED=false` |
| Leaked secret | Rotate in Netlify UI + Supabase/Replicate dashboards |
| Schema issue | **Forward corrective migration only** — no generic `migrate down` |

Database rollback is not automatic with deploy rollback; data migrations are forward-only.

### Custom domain (optional, Phase 8+)

Netlify UI → Domain management → add custom domain → Netlify-managed TLS. Update `NEXT_PUBLIC_SITE_URL` and `WEBHOOK_BASE_URL` to the canonical HTTPS host before registering the Replicate webhook.

---

## Accounts

| Service | URL | Purpose |
|---------|-----|---------|
| Netlify | https://app.netlify.com | Deploy |
| Supabase | https://supabase.com | DB, Auth, Storage |
| Replicate | https://replicate.com | AI (3B+) |

---

## Reference

- Portfolio pattern evidence: `docs/portfolio-netlify-evidence.md`
- Operator actions: `docs/operator-actions.md`
- ADR-001 stack, ADR-015 rollback, ADR-003 demo gate
