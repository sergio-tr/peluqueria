# Change record — Fix production try-on photo upload

**Date:** 2026-08-01  
**Branch:** `fix/prod-tryon-photos`  
**Pull request:** pending  
**Recovery phase:** hotfix / production  
**Status:** IN_PROGRESS

## Summary

Fix `/probar` photo upload 500: UI was sending JSON `imageDataUrl` while API expected multipart `image`. Align client to FormData, accept JSON data-URL as fallback, harden hairstyles load errors.

## Recovery phase

Hotfix after production deploy (post Phase 8/9).

## Scope included

- `src/components/try-on/try-on-flow.tsx` multipart upload + catalog error handling
- `src/app/api/photos/route.ts` multipart + JSON data-URL support

## Scope excluded

- New hairstyle generation (8 seeded styles with public PNGs already live)
- Replicate model changes

## Architecture impact

None. Contract alignment between client and photo pipeline (Phase 1C).

## API impact

`POST /api/photos` accepts multipart (preferred) or JSON `{ imageDataUrl }` for compatibility.

## Data and migration impact

None. Catalog already seeded (8 hairstyles); public assets at `/hairstyles/*/catalog.png` return 200 on production.

## Security and privacy impact

Unchanged: consent + policy version still required; EXIF strip and private Storage upload unchanged.

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | npm run lint | PENDING |
| Typecheck | npm run typecheck | PENDING |
| Tests | npm test | PENDING |
| Build | npm run build | PENDING |

## Deployment and rollback

Merge to main / Netlify redeploy. Rollback: previous deploy. No migrate down.

## Documentation updated

- This change record

## Remaining risks

- Netlify must have `PRIVACY_POLICY_VERSION=2026-07-30` or upload returns 503
- Sharp native binary on Netlify must load for image processing

## Verification status

- Catalog images live: HTTP 200
- Hairstyles in DB: 8 rows
- Photo upload fix: code complete; production verify after deploy
