-- Seed Peluquería Nowi (demo)
-- Staff auth_user_id left null; link after creating admin in Supabase Auth.

insert into public.salons (id, name, slug, timezone, address_json, phone, instagram)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Peluquería Nowi',
  'nowi',
  'Europe/Madrid',
  '{"line1":"Calle de Velázquez, 118","postalCode":"28006","city":"Madrid","country":"ES"}'::jsonb,
  '+34 910 245 782',
  '@peluquerianowi'
);

insert into public.staff (id, salon_id, display_name, active)
values (
  'a0000000-0000-4000-8000-000000000010',
  'a0000000-0000-4000-8000-000000000001',
  'Álex Nowi',
  true
);

insert into public.services (salon_id, slug, name, price_cents, base_minutes, requires_tryon, sort_order) values
  ('a0000000-0000-4000-8000-000000000001', 'corte-nowi', 'Corte Nowi', 2400, 45, true, 1),
  ('a0000000-0000-4000-8000-000000000001', 'corte-barba', 'Corte + barba', 3400, 60, true, 2),
  ('a0000000-0000-4000-8000-000000000001', 'fade-premium', 'Fade premium', 2900, 60, true, 3),
  ('a0000000-0000-4000-8000-000000000001', 'cambio-look', 'Cambio de look', 3900, 75, true, 4),
  ('a0000000-0000-4000-8000-000000000001', 'arreglo-barba', 'Arreglo de barba', 1600, 30, false, 5);

insert into public.hairstyles (
  salon_id, slug, name, catalog_image_path, ai_reference_image_path,
  source_url, source_author, source_license, license_checked_at,
  prompt_modifier, complexity, extra_minutes, sort_order
) values
  ('a0000000-0000-4000-8000-000000000001', 'low-fade', 'Low fade',
   'hairstyles/catalog/low-fade.jpg', 'hairstyles/references/low-fade.jpg',
   null, 'TBD', 'TBD', null,
   'Clean low fade with gradual blend near the ears.', 'high', 30, 1),
  ('a0000000-0000-4000-8000-000000000001', 'mid-fade', 'Mid fade',
   'hairstyles/catalog/mid-fade.jpg', 'hairstyles/references/mid-fade.jpg',
   null, 'TBD', 'TBD', null,
   'Mid fade with balanced contrast and clean sides.', 'high', 30, 2),
  ('a0000000-0000-4000-8000-000000000001', 'high-fade', 'High fade',
   'hairstyles/catalog/high-fade.jpg', 'hairstyles/references/high-fade.jpg',
   null, 'TBD', 'TBD', null,
   'High fade with strong contrast and tight sides.', 'high', 30, 3),
  ('a0000000-0000-4000-8000-000000000001', 'french-crop', 'French crop',
   'hairstyles/catalog/french-crop.jpg', 'hairstyles/references/french-crop.jpg',
   null, 'TBD', 'TBD', null,
   'French crop with textured fringe and short sides.', 'medium', 15, 4),
  ('a0000000-0000-4000-8000-000000000001', 'buzz-cut', 'Buzz cut',
   'hairstyles/catalog/buzz-cut.jpg', 'hairstyles/references/buzz-cut.jpg',
   null, 'TBD', 'TBD', null,
   'Even buzz cut, short and uniform length.', 'low', 0, 5),
  ('a0000000-0000-4000-8000-000000000001', 'pompadour', 'Pompadour',
   'hairstyles/catalog/pompadour.jpg', 'hairstyles/references/pompadour.jpg',
   null, 'TBD', 'TBD', null,
   'Classic pompadour volume on top with tapered sides.', 'high', 30, 6),
  ('a0000000-0000-4000-8000-000000000001', 'slick-back', 'Slick back',
   'hairstyles/catalog/slick-back.jpg', 'hairstyles/references/slick-back.jpg',
   null, 'TBD', 'TBD', null,
   'Slick back with polished top and controlled sides.', 'medium', 15, 7),
  ('a0000000-0000-4000-8000-000000000001', 'curly-crop', 'Curly crop',
   'hairstyles/catalog/curly-crop.jpg', 'hairstyles/references/curly-crop.jpg',
   null, 'TBD', 'TBD', null,
   'Curly crop keeping natural curl pattern with shaped fringe.', 'medium', 15, 8);

-- Tue–Fri morning + afternoon, Sat full day (ISO weekday)
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
