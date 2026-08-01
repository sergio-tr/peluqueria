-- Seed Peluquer�a Nowi (demo)
-- Staff auth_user_id left null; link after creating admin in Supabase Auth.

insert into public.salons (id, name, slug, timezone, address_json, phone, instagram)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Peluquer�a Nowi',
  'nowi',
  'Europe/Madrid',
  '{"line1":"Calle de Vel�zquez, 118","postalCode":"28006","city":"Madrid","country":"ES"}'::jsonb,
  '+34 910 245 782',
  '@peluquerianowi'
);

insert into public.staff (id, salon_id, display_name, active)
values (
  'a0000000-0000-4000-8000-000000000010',
  'a0000000-0000-4000-8000-000000000001',
  '�lex Nowi',
  true
);

insert into public.services (salon_id, slug, name, price_cents, base_minutes, requires_tryon, sort_order) values
  ('a0000000-0000-4000-8000-000000000001', 'corte-nowi', 'Corte Nowi', 2400, 45, true, 1),
  ('a0000000-0000-4000-8000-000000000001', 'corte-barba', 'Corte + barba', 3400, 60, true, 2),
  ('a0000000-0000-4000-8000-000000000001', 'fade-premium', 'Fade premium', 2900, 60, true, 3),
  ('a0000000-0000-4000-8000-000000000001', 'cambio-look', 'Cambio de look', 3900, 75, true, 4),
  ('a0000000-0000-4000-8000-000000000001', 'arreglo-barba', 'Arreglo de barba', 1600, 30, false, 5);

insert into public.hairstyles (
  salon_id, slug, name,
  catalog_image_path, ai_reference_image_path, thumbnail_image_path,
  asset_version, provenance, usage_rights,
  source_url, source_author, source_license, license_checked_at,
  prompt_modifier, complexity, extra_minutes, sort_order
) values
  ('a0000000-0000-4000-8000-000000000001', 'low-fade', 'Low fade',
   'hairstyles/low-fade/catalog.png', 'hairstyles/low-fade/ai-reference.png', 'hairstyles/low-fade/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'Clean low fade with gradual blend near the ears.', 'high', 30, 1),
  ('a0000000-0000-4000-8000-000000000001', 'mid-fade', 'Mid fade',
   'hairstyles/mid-fade/catalog.png', 'hairstyles/mid-fade/ai-reference.png', 'hairstyles/mid-fade/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'Mid fade with balanced contrast and clean sides.', 'high', 30, 2),
  ('a0000000-0000-4000-8000-000000000001', 'high-fade', 'High fade',
   'hairstyles/high-fade/catalog.png', 'hairstyles/high-fade/ai-reference.png', 'hairstyles/high-fade/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'High fade with strong contrast and tight sides.', 'high', 30, 3),
  ('a0000000-0000-4000-8000-000000000001', 'french-crop', 'French crop',
   'hairstyles/french-crop/catalog.png', 'hairstyles/french-crop/ai-reference.png', 'hairstyles/french-crop/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'French crop with textured fringe and short sides.', 'medium', 15, 4),
  ('a0000000-0000-4000-8000-000000000001', 'buzz-cut', 'Buzz cut',
   'hairstyles/buzz-cut/catalog.png', 'hairstyles/buzz-cut/ai-reference.png', 'hairstyles/buzz-cut/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'Even buzz cut, short and uniform length.', 'low', 0, 5),
  ('a0000000-0000-4000-8000-000000000001', 'pompadour', 'Pompadour',
   'hairstyles/pompadour/catalog.png', 'hairstyles/pompadour/ai-reference.png', 'hairstyles/pompadour/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'Classic pompadour volume on top with tapered sides.', 'high', 30, 6),
  ('a0000000-0000-4000-8000-000000000001', 'slick-back', 'Slick back',
   'hairstyles/slick-back/catalog.png', 'hairstyles/slick-back/ai-reference.png', 'hairstyles/slick-back/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'Slick back with polished top and controlled sides.', 'medium', 15, 7),
  ('a0000000-0000-4000-8000-000000000001', 'curly-crop', 'Curly crop',
   'hairstyles/curly-crop/catalog.png', 'hairstyles/curly-crop/ai-reference.png', 'hairstyles/curly-crop/thumbnail.png',
   '1.1.0-synthetic-silhouette', 'synthetic-silhouette-mvp', 'demo-internal-only',
   null, 'synthetic-generator', 'demo-internal-only', '2026-07-31',
   'Curly crop keeping natural curl pattern with shaped fringe.', 'medium', 15, 8);

-- Tue�Fri morning + afternoon, Sat full day (ISO weekday)
insert into public.availability_rules (salon_id, staff_id, weekday, start_local, end_local)
select
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000010',
  w.weekday,
  w.start_local::time,
  w.end_local::time
from (
  values
    (2, '10:00', '14:00'),
    (2, '16:00', '20:00'),
    (3, '10:00', '14:00'),
    (3, '16:00', '20:00'),
    (4, '10:00', '14:00'),
    (4, '16:00', '20:00'),
    (5, '10:00', '14:00'),
    (5, '16:00', '20:00'),
    (6, '10:00', '18:00')
) as w(weekday, start_local, end_local);
