# Change record — Netlify build config

**Date:** 2026-08-01
**Branch:** `fix/netlify-build-config`
**Recovery phase:** hotfix / deploy

## Summary

Fix Netlify production build: replace `next.config.ts` with `next.config.mjs`, set Node 22, document that `NODE_ENV` must not be set in Netlify UI.

## Scope included

- `next.config.mjs` / remove `next.config.ts`
- `netlify.toml` NODE_VERSION=22
- `docs/deployment.md` build notes

## Scope excluded

- App feature changes

## Testing evidence

| Check | Result |
|------|--------|
| npm run build | PASS |

## Documentation updated

- docs/deployment.md

## Remaining risks

- Operator must clear Publish directory and remove NODE_ENV in Netlify UI

## Verification status

- Local build PASS; Netlify redeploy PENDING
