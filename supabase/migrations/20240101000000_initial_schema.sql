-- Luma Nightlife - Initial Schema
-- Run this migration to set up the full database

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('guest', 'promoter', 'admin')),
  city text DEFAULT 'Miami',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  metro text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  city text,
  price_min integer NOT NULL DEFAULT 0,
  rating numeric(3,2) DEFAULT 4.5,
  distance text,
  about text,
  img_url text,
  lat numeric(10,7),
  lng numeric(10,7),
  hot boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id integer REFERENCES public.venues(id) NOT NULL,
  table_option_id integer,
  event_date date NOT NULL,
  party_size integer NOT NULL DEFAULT 2,
  guests jsonb DEFAULT '[]',
  subtotal integer NOT NULL DEFAULT 0,
  discount_pct integer DEFAULT 0,
  discount_amount integer DEFAULT 0,
  platform_fee integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  promo_code text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','checked_in')),
  payment_intent_id text,
  confirmation_code text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_pct integer CHECK (discount_pct BETWEEN 0 AND 100),
  discount_value integer DEFAULT 0,
  max_uses integer DEFAULT 100,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  venue_id integer REFERENCES public.venues(id),
  min_spend integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Promo redemptions audit log
CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid REFERENCES public.promo_codes(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  booking_id uuid REFERENCES public.bookings(id),
  redeemed_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Anyone can read active venues" ON public.venues FOR SELECT USING (active = true);
CREATE POLICY "Users can read own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Promoters can manage promo codes" ON public.promo_codes FOR ALL USING (auth.uid() = created_by);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Server-side pricing function (tamper-proof)
CREATE OR REPLACE FUNCTION public.calculate_booking_price(
  p_venue_id integer,
  p_guests integer,
  p_promo_code text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_venue record;
  v_promo record;
  v_base integer;
  v_discount integer := 0;
  v_discount_type text := 'none';
  v_discount_value integer := 0;
  v_platform_fee integer;
  v_total integer;
BEGIN
  SELECT * INTO v_venue FROM public.venues WHERE id = p_venue_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venue not found'; END IF;
  v_base := v_venue.price_min * 100 * p_guests;
  IF p_promo_code IS NOT NULL AND p_promo_code != '' THEN
    SELECT * INTO v_promo FROM public.promo_codes
    WHERE code = upper(p_promo_code) AND active = true
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now())
      AND (max_uses IS NULL OR used_count < max_uses)
      AND (venue_id IS NULL OR venue_id = p_venue_id);
    IF FOUND THEN
      IF v_base >= v_promo.min_spend THEN
        IF v_promo.discount_type = 'percent' THEN
          v_discount := (v_base * v_promo.discount_pct / 100)::integer;
          v_discount_type := 'percent';
          v_discount_value := v_promo.discount_pct;
        ELSE
          v_discount := LEAST(v_promo.discount_value, v_base);
          v_discount_type := 'fixed';
          v_discount_value := v_promo.discount_value;
        END IF;
      END IF;
    END IF;
  END IF;
  v_platform_fee := ((v_base - v_discount) * 0.10)::integer;
  v_total := v_base - v_discount + v_platform_fee;
  RETURN jsonb_build_object(
    'venue_id', p_venue_id, 'venue_name', v_venue.name,
    'guests', p_guests, 'base_price', v_base,
    'discount', v_discount, 'discount_type', v_discount_type, 'discount_value', v_discount_value,
    'platform_fee', v_platform_fee, 'total', v_total,
    'promo_code_id', CASE WHEN v_promo IS NOT NULL THEN v_promo.id END,
    'promo_code', p_promo_code, 'currency', 'usd'
  );
END;
$$;
