# Operator actions

This file is updated by agents only when a human action is required.

Do not place secrets in this document.

| ID | Phase | Required action | Why | Status |
|---|---|---|---|---|
| OP-001 | Setup | Configure GitHub protection for `main` | Applied 2026-07-31 via `gh api` (required checks `governance` + `quality`, enforce admins, no force push, conversation resolution). Package script still needs UTF-8 JSON without BOM for reuse. | DONE |
| OP-002 | 3A | Run `netlify login` and confirm CLI auth | Preview deploy and site link (`netlify init` / `netlify deploy --build`) | PENDING |
| OP-003 | 3B | Provide Replicate token through secure environment | Real inference — set `REPLICATE_API_TOKEN` in Netlify preview scope | PENDING |
| OP-008 | 3B | Configure Replicate webhook signing secret and callback URL | Set `REPLICATE_WEBHOOK_SECRET` (from Replicate dashboard) and `WEBHOOK_BASE_URL` or `NEXT_PUBLIC_SITE_URL` to preview HTTPS host; register webhook URL `https://<preview-host>/api/webhooks/replicate` | PENDING |
| OP-004 | 3A | Create Supabase project and set preview env vars in Netlify | Remote persistence for preview (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `DATA_STORE=supabase`) | PENDING |
| OP-005 | 3A | Create Netlify site, connect GitHub repo, set preview env vars | Preview HTTPS URL; see `docs/deployment.md` checklist (gate secrets, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`) | PENDING |
| OP-006 | 3A | Apply Supabase migrations on remote project | `npx supabase link` + `npx supabase db push`; optional controlled seed for preview | PENDING |
| OP-007 | 3A | Run post-deploy health checklist | Verify `GET /api/health`, gate redirect, gated `GET /api/services`, cron auth — document preview URL when live | PENDING |

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
