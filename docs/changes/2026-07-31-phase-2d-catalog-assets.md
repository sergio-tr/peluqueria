# Change record — Phase 2D catalog production assets

**Date:** 2026-07-31  
**Branch:** `update/catalog-production-assets`  
**Pull request:** pending  
**Recovery phase:** 2D  
**Status:** COMPLETE

## Summary

Replaces SVG catalog placeholders with programmatic synthetic raster PNGs per hairstyle (catalog, ai_reference, thumbnail), adds D-05 asset metadata columns, updates seed and attribution, and exposes new paths via GET `/api/hairstyles`. SVG is explicitly disallowed as AI reference for smoke/benchmark; non-SVG synthetics unblock the pipeline until operator swaps production-quality assets.

## Recovery phase

2D — Activos definitivos del catálogo (D-05).

## Scope included

- Migration `20260731130000_hairstyle_asset_metadata.sql` (`thumbnail_image_path`, `asset_version`, `provenance`, `usage_rights`)
- `scripts/generate-hairstyle-assets.mjs` + 24 PNG assets under `public/hairstyles/{slug}/`
- Seed SQL and `seed-data.ts` raster paths
- Catalog repository/API: `thumbnailUrl`, asset metadata on GET hairstyles
- Tests: seed asset paths, no SVG ai_reference, on-disk PNG presence
- `docs/assets-attribution.md` complete attribution table

## Scope excluded

- Benchmark execution (Phase 6)
- Public smoke (Phase 9)
- Replicate integration
- Paid generative API calls

## Architecture impact

- Asset layout: `public/hairstyles/{slug}/{catalog|ai-reference|thumbnail}.png`
- Rollback via `asset_version` bump and path revert

## API impact

- `GET /api/hairstyles`: each item includes `catalogImageUrl`, `thumbnailUrl`, `assetVersion`, `provenance`, `usageRights` (raster URLs)

## Data and migration impact

- Forward migration backfills all hairstyle rows to raster paths and metadata
- Seed idempotent with new columns

## Security and privacy impact

- Synthetic assets only; no real persons or licensed stock
- `usage_rights: demo-internal-only`

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Lint | `npm run lint` | pending |
| Typecheck | `npm run typecheck` | pending |
| Tests | `npm run test` | pending |
| Build | `npm run build` | pending |

## Deployment and rollback

- Apply `20260731130000_hairstyle_asset_metadata.sql` before deploy
- Static PNGs served from `public/` (no Storage upload required for MVP)
- Rollback: redeploy previous `asset_version` paths

## Documentation updated

- `docs/assets-attribution.md`
- `docs/database-schema.md` (hairstyles columns)
- This change record
- `docs/agent-runs/2026-07-31-phase-2d.md`

## Remaining risks

- Synthetic visuals not suitable for public marketing smoke — **Draft PR** until operator replaces with production-generated set
- Operator must apply migration on live Supabase

## Verification status

- Independent verifier: pending CI run

## Stack dependency

Merge after PR #8 (`feature/idempotent-confirmation-expiration`). Targets `main`.
