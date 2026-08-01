# Change record — Fix try-on photos + Replicate create

**Date:** 2026-08-01
**Branch:** `fix/prod-tryon-photos`
**Pull request:** https://github.com/sergio-tr/peluqueria/pull/21
**Recovery phase:** hotfix / production
**Status:** IN_PROGRESS

## Summary

Fix production try-on: multipart photo upload, correct Replicate API (`image` array + models endpoint), replace text-card PNG placeholders with distinct silhouette portraits, surface Replicate credit errors.

## Recovery phase

Hotfix after production deploy.

## Scope included

- try-on FormData upload + photos API JSON fallback
- ReplicateQwenHairProvider input contract for qwen-image-edit-plus
- Regenerated `public/hairstyles/**` silhouette assets v1.1.0
- Seed / attribution asset_version bump

## Scope excluded

- Purchasing Replicate credit (operator)
- Photoreal licensed stock (operator may replace later)

## Architecture impact

Provider calls `POST /v1/models/{owner}/{name}/predictions` with `input.image` as URI array.

## API impact

`POST /api/photos` multipart + JSON. AI job create uses corrected Replicate payload.

## Data and migration impact

No schema migration. Remote `hairstyles.asset_version` updated to `1.1.0-synthetic-silhouette`.

## Security and privacy impact

Unchanged consent/storage pipeline.

## Testing evidence

| Check | Result |
|------|--------|
| typecheck | PENDING |
| lint | PENDING |
| Replicate probe | 402 insufficient credit (payload accepted) |

## Deployment and rollback

Merge + Netlify redeploy. Operator must add Replicate billing credit. Rollback: previous deploy.

## Documentation updated

- docs/assets-attribution.md
- This change record

## Remaining risks

- Replicate account has no credit (402) until operator tops up
- Silhouettes are synthetic, not photoreal

## Verification status

- API validation error fixed (was 422 wrong fields)
- Credit blocker confirmed on live token
