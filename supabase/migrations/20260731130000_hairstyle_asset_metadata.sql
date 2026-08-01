-- Phase 2D (D-05): catalog asset metadata and raster paths

alter table public.hairstyles
  add column if not exists thumbnail_image_path text,
  add column if not exists asset_version text not null default '0.0.0-placeholder',
  add column if not exists provenance text not null default 'unknown',
  add column if not exists usage_rights text not null default 'unknown';

comment on column public.hairstyles.thumbnail_image_path is
  'Public path to catalog thumbnail (raster; not SVG).';
comment on column public.hairstyles.asset_version is
  'Semantic version of the asset set for rollback and cache busting.';
comment on column public.hairstyles.provenance is
  'Origin of assets (e.g. synthetic-generated-mvp, licensed-stock).';
comment on column public.hairstyles.usage_rights is
  'Permitted usage scope (e.g. demo-internal-only, commercial).';

-- Backfill all rows to raster layout keyed by slug
update public.hairstyles
set
  catalog_image_path = 'hairstyles/' || slug || '/catalog.png',
  ai_reference_image_path = 'hairstyles/' || slug || '/ai-reference.png',
  thumbnail_image_path = 'hairstyles/' || slug || '/thumbnail.png',
  asset_version = '1.0.0-synthetic-mvp',
  provenance = 'synthetic-generated-mvp',
  usage_rights = 'demo-internal-only';

alter table public.hairstyles
  alter column thumbnail_image_path set not null;
