-- ============================================================
-- LUMA — Real Venue Seed Data (Miami + NYC)
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Clear existing seed venues first
DELETE FROM public.venues WHERE id < 100;

-- ═══════════════════════════════════════════════════════════
-- MIAMI — Real Venues
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.venues (metro, name, city, address, type, price_min, rating, distance, about, lat, lng, hot, tags, active, img_url) VALUES

-- 1. LIV Nightclub — Fontainebleau
('Miami', 'LIV', 'Miami Beach', '4441 Collins Ave, Miami Beach, FL 33140', 'Nightclub', 250, 4.9, '2.1 mi',
 'The crown jewel of Miami nightlife. 18,000 sq ft inside the Fontainebleau with world-class DJs, A-list celebrities, and bottle service that defines South Beach luxury.',
 25.8118, -80.1229, true, ARRAY['Celebrity', 'Bottle Service', 'EDM', 'VIP'], true,
 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=700&h=462&fit=crop'),

-- 2. E11EVEN — Downtown
('Miami', 'E11EVEN', 'Downtown', '29 NE 11th St, Miami, FL 33132', 'Nightclub', 200, 4.8, '0.8 mi',
 'The #1 club in the USA and #6 globally. 24-hour ultraclub with live performances, theatrical shows, and five-star bottle service. Open 24/7 Wed-Mon.',
 25.7847, -80.1918, true, ARRAY['24/7', 'Bottle Service', 'Live Shows', 'VIP'], true,
 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=700&h=462&fit=crop'),

-- 3. Club Space — Downtown
('Miami', 'Club Space', 'Downtown', '34 NE 11th St, Miami, FL 33132', 'Nightclub', 80, 4.7, '0.9 mi',
 'World-renowned for marathon sets and cutting-edge electronic music. The Terrace rooftop is legendary for sunrise techno sessions.',
 25.7850, -80.1912, true, ARRAY['Techno', 'House', 'Rooftop', 'After Hours'], true,
 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=700&h=462&fit=crop'),

-- 4. Komodo Lounge — Brickell
('Miami', 'Komodo Lounge', 'Brickell', '801 Brickell Ave, Miami, FL 33131', 'Lounge', 150, 4.6, '0.4 mi',
 'Dave Grutman''s intimate nightlife venue above Komodo restaurant. Bold aesthetics, avant-garde artwork, and weekend DJ programming.',
 25.7651, -80.1895, false, ARRAY['Lounge', 'Cocktails', 'Celebrity', 'Art'], true,
 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&h=462&fit=crop'),

-- 5. Mynt Lounge — South Beach
('Miami', 'Mynt Lounge', 'South Beach', '1921 Collins Ave, Miami Beach, FL 33139', 'Lounge', 120, 4.5, '1.8 mi',
 'South Beach institution known for drawing VIP and celebrity guests. Strict dress code, premium bottle service, house music and open format.',
 25.7904, -80.1303, false, ARRAY['VIP', 'Bottle Service', 'House Music', 'Strict Dress Code'], true,
 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=700&h=462&fit=crop'),

-- 6. Nikki Beach — South Beach
('Miami', 'Nikki Beach', 'South Beach', '1 Ocean Dr, Miami Beach, FL 33139', 'Pool Party', 100, 4.7, '2.5 mi',
 'The original luxury beach club. Combines dayclub energy with live DJs, ocean views, and bottle service on the sand.',
 25.7633, -80.1310, true, ARRAY['Beach Club', 'Day Party', 'Pool', 'VIP'], true,
 'https://images.unsplash.com/photo-1504858700536-882c978a3464?w=700&h=462&fit=crop'),

-- 7. Delilah — Brickell
('Miami', 'Delilah', 'Brickell', '301 Brickell Key Dr, Miami, FL 33131', 'Lounge', 180, 4.8, '0.3 mi',
 'LA import that quickly became Brickell''s hottest see-and-be-seen spot. Jazz Age live entertainment meets modern nightlife. Boat slip access.',
 25.7695, -80.1856, true, ARRAY['Clubstaurant', 'Live Music', 'VIP', 'Brickell Key'], true,
 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=700&h=462&fit=crop'),

-- 8. Floyd — Downtown
('Miami', 'Floyd', 'Downtown', '34 NE 11th St Ste B, Miami, FL 33132', 'Nightclub', 60, 4.6, '0.9 mi',
 'Club Space''s intimate sibling. Modeled after Twin Peaks'' Red Room. World-class DJs in an eclectic, sophisticated setting.',
 25.7851, -80.1910, false, ARRAY['House', 'Techno', 'Intimate', 'Underground'], true,
 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=700&h=462&fit=crop'),

-- ═══════════════════════════════════════════════════════════
-- NEW YORK — Real Venues
-- ═══════════════════════════════════════════════════════════

-- 9. Marquee — Chelsea
('New York', 'Marquee', 'Chelsea', '289 10th Ave, New York, NY 10001', 'Nightclub', 200, 4.8, '0.5 mi',
 'NYC''s premier nightclub with world-class DJs and unmatched production. Multi-room venue with main room and intimate library lounge.',
 40.7491, -74.0046, true, ARRAY['EDM', 'VIP Booths', 'Celebrity', 'Bottle Service'], true,
 'https://images.unsplash.com/photo-1519214605650-76a613ee3245?w=700&h=462&fit=crop'),

-- 10. Nebula — Midtown
('New York', 'Nebula', 'Midtown', '135 W 41st St, New York, NY 10036', 'Nightclub', 180, 4.7, '0.8 mi',
 'Immersive nightclub experience with state-of-the-art LED installations and a lineup of international DJs every weekend.',
 40.7559, -73.9878, true, ARRAY['Immersive', 'LED', 'EDM', 'VIP'], true,
 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=700&h=462&fit=crop'),

-- 11. PHD Rooftop — Chelsea
('New York', 'PHD Rooftop', 'Chelsea', '355 W 16th St, New York, NY 10011', 'Rooftop', 150, 4.6, '0.6 mi',
 'Penthouse-level rooftop lounge at Dream Downtown. Panoramic views of the Hudson River and Meatpacking District.',
 40.7420, -74.0031, true, ARRAY['Rooftop', 'Views', 'Cocktails', 'VIP'], true,
 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=700&h=462&fit=crop'),

-- 12. Tao Downtown — Chelsea
('New York', 'Tao Downtown', 'Chelsea', '92 9th Ave, New York, NY 10011', 'Nightclub', 250, 4.8, '0.4 mi',
 'Asian-inspired mega-venue combining fine dining and nightlife. Celebrity magnet with one of NYC''s most exclusive bottle service programs.',
 40.7427, -74.0045, true, ARRAY['Celebrity', 'Clubstaurant', 'Bottle Service', 'VIP'], true,
 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=700&h=462&fit=crop'),

-- 13. Fleur Room — Chelsea
('New York', 'Fleur Room', 'Chelsea', '35 W 15th St, New York, NY 10011', 'Rooftop', 120, 4.5, '0.7 mi',
 'Sophisticated rooftop lounge above Moxy Chelsea. Intimate setting with craft cocktails and curated DJ sets.',
 40.7377, -73.9944, false, ARRAY['Rooftop', 'Intimate', 'Cocktails', 'Lounge'], true,
 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=700&h=462&fit=crop'),

-- 14. Musica — Hell''s Kitchen
('New York', 'Musica', 'Hell''s Kitchen', '637 W 50th St, New York, NY 10019', 'Nightclub', 100, 4.7, '1.2 mi',
 'Three-level European-style superclub. 25,000 sq ft with concert-grade sound. Hosts world-class house and techno DJs.',
 40.7635, -73.9937, false, ARRAY['House', 'Techno', 'Superclub', 'European'], true,
 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=700&h=462&fit=crop'),

-- 15. Magic Hour — Midtown
('New York', 'Magic Hour', 'Midtown', '485 7th Ave, New York, NY 10018', 'Rooftop', 90, 4.5, '0.9 mi',
 'Whimsical rooftop bar atop Moxy Times Square. Indoor/outdoor space with carnival-inspired decor, mini golf, and skyline views.',
 40.7524, -73.9899, false, ARRAY['Rooftop', 'Views', 'Whimsical', 'Cocktails'], true,
 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&h=462&fit=crop');

-- ═══════════════════════════════════════════════════════════
-- PROMO CODES — Real launch codes
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.promo_codes (code, discount_pct, discount_type, max_uses, active) VALUES
  ('LUMA20', 20, 'percent', 500, true),
  ('WELCOME', 15, 'percent', 1000, true),
  ('MIAMI10', 10, 'percent', 200, true),
  ('NYC10', 10, 'percent', 200, true),
  ('FIRST50', 0, 'fixed', 100, true)
ON CONFLICT (code) DO NOTHING;

-- Set the FIRST50 discount value (5000 = $50 off)
UPDATE public.promo_codes SET discount_value = 5000 WHERE code = 'FIRST50';
