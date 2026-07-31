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
| **3A (this runbook)** | Preview site, HTTPS URL, env checklist, health checks, demo gate |
| 8 | Production release, custom domain, production env scope |

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

## Production (Phase 8 — not in scope for 3A)

Production release, custom domain, and production-scoped env vars are handled in Phase 8 (`release/netlify-production`). Do not run `netlify deploy --prod` during 3A.

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
