# Operator actions

This file is updated by agents only when a human action is required.

Do not place secrets in this document.

| ID | Phase | Required action | Why | Status |
|---|---|---|---|---|
| OP-001 | Setup | Configure GitHub protection for `main` | Applied 2026-07-31 via `gh api` (required checks `governance` + `quality`, enforce admins, no force push, conversation resolution). Package script still needs UTF-8 JSON without BOM for reuse. | DONE |
| OP-002 | 3A | Run `netlify login` and confirm CLI auth | Preview deploy and site link (`netlify init` / `netlify deploy --build`) | PENDING |
| OP-003 | 3B | Provide Replicate token through secure environment | Real inference | PENDING |
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
