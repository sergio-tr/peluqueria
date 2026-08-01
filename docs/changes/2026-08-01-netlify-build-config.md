# Change record — Netlify build config

**Date:** 2026-08-01  
**Branch:** `fix/netlify-build-config`  
**Pull request:** https://github.com/sergio-tr/peluqueria/pull/20  
**Recovery phase:** hotfix / deploy  
**Status:** IN_PROGRESS

## Summary

Fix Netlify production build: replace `next.config.ts` with `next.config.mjs`, set Node 22, document that `NODE_ENV` must not be set in Netlify UI. Also fix corrupted `supabase/config.toml`, rename duplicate migration version, and add private `results`/`hairstyles` buckets migration.

## Recovery phase

Hotfix after Phase 8/9 merge to `main` (deploy unblocker). Not a numbered recovery subphase.

## Scope included

- `next.config.mjs` / remove `next.config.ts`
- `netlify.toml` NODE_VERSION=22
- `docs/deployment.md` build notes
- `supabase/config.toml` restored to valid TOML
- Migration rename `20260731100500_staff_auth_user_fk.sql`
- Migration `20260801120000_results_hairstyles_buckets.sql`
- Operator-actions status updates for OP-006 / OP-009 / OP-015

## Scope excluded

- App feature changes
- Netlify UI operator steps (clear Publish directory, remove `NODE_ENV`)

## Architecture impact

None on runtime architecture. Build/config only: config load no longer requires TypeScript at Netlify install time; Node 22 aligns with `@supabase/*` engine requirement.

## API impact

None.

## Data and migration impact

Forward migration for private Storage buckets `results` and `hairstyles` (idempotent). Staff auth FK migration renamed for unique version key only.

## Security and privacy impact

Buckets remain private with deny policies for anon/authenticated; service role only. No new secrets committed. Operator must not set secrets in this change record.

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | npm run lint | NOT_RUN |
| Typecheck | npm run typecheck | NOT_RUN |
| Tests | npm test | NOT_RUN |
| Build | npm run build | PASS |

## Deployment and rollback

- Deploy via merge to `main` / Netlify production branch rebuild.
- Operator: delete `NODE_ENV` from Netlify env; leave Publish directory empty.
- Rollback: previous Netlify deploy; revert this commit if needed. No `migrate down`.

## Documentation updated

- `docs/deployment.md`
- `docs/operator-actions.md`
- This change record

## Remaining risks

- Operator must clear Publish directory and remove `NODE_ENV` in Netlify UI before rebuild succeeds.

## Verification status

- Local build PASS
- Netlify redeploy PENDING after merge + UI env fix
- Governance docs gate: headings completed
