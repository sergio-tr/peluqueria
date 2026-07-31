# Change record — Phase 1C secure photo storage

**Date:** 2026-07-31  
**Branch:** `security/secure-photo-storage`  
**Pull request:** TBD  
**Recovery phase:** `1C`  
**Status:** IN_PROGRESS

## Summary

Private Supabase Storage pipeline for customer photos: content validation (magic bytes), size/dimension limits, JPEG normalization, EXIF strip before persist, `storage_path` in `photos` table, short-lived signed preview URLs.

## Recovery phase

1C

## Scope included

- Photo validation and processing (`sharp`)
- Private `photos` storage bucket migration + deny policies for anon/auth
- `POST /api/photos` (multipart, consent required)
- Kill switch `PHOTO_UPLOAD_ENABLED`
- `PRIVACY_POLICY_VERSION` in typed config
- Unit tests: mime spoof, oversize, dimensions, EXIF strip

## Scope excluded

- Replicate output copy (3C)
- Full retention purge (Phase 5)
- Booking/AI/auth persistence (1D+)
- Client UI updates (prototype try-on still uses JSON data URL locally)

## Architecture impact

Photos are stored in private bucket; DB holds `storage_path` only. API requires `DATA_STORE=supabase`.

## API impact

`POST /api/photos` accepts `multipart/form-data` with `sessionId`, `consentPolicyVersion`, `isOwnImage=true`, and `image` file. Returns `{ photoId, path, previewUrl }`.

## Data and migration impact

New migration `20260731100000_photos_storage_bucket.sql`.

## Security and privacy impact

EXIF stripped before upload. MIME validated by content. Bucket private; preview via short TTL signed URL only.

## Testing evidence

| Check | Command | Result |
|------|---------|--------|
| Tests | npm test | TBD |
| Typecheck | npm run typecheck | TBD |
| Lint | npm run lint | TBD |
| Build | npm run build | TBD |

## Deployment and rollback

Apply storage migration; set `PHOTO_UPLOAD_ENABLED=false` to disable upload. Previous deploy / revert PR.

## Documentation updated

This change record; agent run.

## Remaining risks

Live Supabase Storage upload not verified without credentials. Draft PR until operator confirms bucket migration.

## Verification status

- Planner: scoped
- Architect: application/storage boundary
- Security: EXIF + private bucket
- Tests: validation unit tests
- Independent verifier: TBD
