-- ============================================================
-- LUMA — Seed Data
-- ============================================================

-- Venues: Miami
insert into public.venues (metro, name, city, address, type, price_min, rating, distance, lat, lng, hot, tags)
values
  ('Miami','Noir Rooftop',       'Miami Beach', '1901 Collins Ave',      'Rooftop',   120, 4.9, '0.8 mi', 25.7825,-80.1340, true,  ARRAY['rooftop','ocean view','cocktails']),
  ('Miami','Velvet Underground', 'Wynwood',     '318 NW 23rd St',        'Nightclub',  85, 4.7, '1.2 mi', 25.8005,-80.1995, true,  ARRAY['art district','dancing','dj']),
  ('Miami','Azure Terrace',      'Brickell',    '801 Brickell Ave',      'Lounge',     75, 4.6, '0.4 mi', 25.7590,-80.1920, false, ARRAY['skyline','craft cocktails']),
  ('Miami','Aqua Blue',          'Mid Beach',   '4441 Collins Ave',      'Pool Party', 95, 4.8, '2.1 mi', 25.8118,-80.1290, true,  ARRAY['pool','day party','bottle service']),
  ('Miami','The Rooftop at 1',   'Brickell',    '1 SE 3rd Ave',          'Rooftop',   110, 4.5, '0.2 mi', 25.7685,-80.1882, false, ARRAY['rooftop','views','vip'])
on conflict do nothing;

-- Venues: New York
insert into public.venues (metro, name, city, address, type, price_min, rating, distance, lat, lng, hot, tags)
values
  ('New York','Electric Garden',   'Chelsea',       '530 W 28th St', 'Nightclub', 140, 4.8, '0.6 mi', 40.7488,-74.0022, true,  ARRAY['nightclub','dancing','live dj']),
  ('New York','The Observatory',   'Chelsea',       '116 10th Ave',  'Rooftop',   160, 4.9, '0.9 mi', 40.7476,-74.0040, true,  ARRAY['rooftop','skyline','craft cocktails']),
  ('New York','Velvet Speakeasy',  'Gramercy',      '122 E 27th St', 'Lounge',    130, 4.6, '1.3 mi', 40.7437,-73.9835, false, ARRAY['speakeasy','intimate','vintage']),
  ('New York','Skyline 432',       'Midtown',       '432 Park Ave',  'Rooftop',   200, 4.9, '0.7 mi', 40.7614,-73.9748, true,  ARRAY['luxury','skyline','bottle service']),
  ('New York','The Grand Ballroom','Midtown',       '266 W 47th St', 'Nightclub', 150, 4.7, '0.4 mi', 40.7587,-73.9877, false, ARRAY['events','dancing','prestige'])
on conflict do nothing;

-- Promo codes
insert into public.promo_codes (code, discount_pct, discount_type, max_uses, active)
values ('LUMA20', 20, 'percent', 100, true), ('WELCOME', 15, 'percent', 500, true)
on conflict (code) do nothing;

insert into public.promo_codes (code, discount_pct, discount_type, discount_value, max_uses, active)
values ('VIP50', 0, 'fixed', 5000, 50, true)
on conflict (code) do nothing;
