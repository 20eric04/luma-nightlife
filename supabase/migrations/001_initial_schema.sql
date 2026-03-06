-- ============================================================
-- LUMA — Initial Schema
-- Run: supabase db push
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── PROFILES ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'guest' check (role in ('guest','promoter','admin')),
  city        text default 'Miami',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── VENUES ───────────────────────────────────────────────────
create table if not exists public.venues (
  id          serial primary key,
  metro       text,
  name        text not null,
  city        text not null,
  address     text,
  type        text check (type in ('Rooftop','Nightclub','Lounge','Pool Party','Bar')),
  price_min   integer not null default 100,
  rating      numeric(3,1) default 4.5,
  distance    text,
  about       text,
  img_url     text,
  lat         numeric,
  lng         numeric,
  hot         boolean default false,
  tags        text[],
  active      boolean default true,
  promoter_id uuid references public.profiles(id),
  created_at  timestamptz default now()
);

alter table public.venues enable row level security;
create policy "Anyone can read active venues" on public.venues for select using (active = true);
create policy "Promoters manage own venues"   on public.venues for all using (auth.uid() = promoter_id);

-- ── PROMO CODES ──────────────────────────────────────────────
create table if not exists public.promo_codes (
  id             uuid primary key default uuid_generate_v4(),
  code           text not null unique,
  discount_pct   integer not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  discount_type  text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value integer,
  max_uses       integer,
  used_count     integer not null default 0,
  min_spend      integer,
  venue_id       integer references public.venues(id),
  valid_from     timestamptz default now(),
  valid_until    timestamptz,
  active         boolean default true,
  created_by     uuid references auth.users(id),
  created_at     timestamptz default now()
);

alter table public.promo_codes enable row level security;
create policy "Promoters manage own codes" on public.promo_codes for all
  using (auth.uid() = created_by);

-- ── BOOKINGS ─────────────────────────────────────────────────
create table if not exists public.bookings (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  venue_id          integer not null references public.venues(id),
  event_date        text not null,
  party_size        integer not null default 1,
  guests            integer not null default 1,
  subtotal          integer not null,
  discount_pct      integer not null default 0,
  discount_amount   integer not null default 0,
  platform_fee      integer not null default 0,
  total             integer not null,
  promo_code        text,
  status            text not null default 'pending'
                    check (status in ('pending','confirmed','cancelled','checked_in')),
  confirmation_code text unique default upper(substring(encode(gen_random_bytes(4),'hex'),1,8)),
  payment_intent_id text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.bookings enable row level security;
create policy "Users see own bookings"    on public.bookings for select using (auth.uid() = user_id);
create policy "Users can create bookings" on public.bookings for insert with check (auth.uid() = user_id);
create policy "Users can update bookings" on public.bookings for update using (auth.uid() = user_id);
create policy "Promoters see venue bookings" on public.bookings for select
  using (exists (select 1 from public.venues v where v.id = venue_id and v.promoter_id = auth.uid()));

-- ── PROMO REDEMPTIONS ────────────────────────────────────────
create table if not exists public.promo_redemptions (
  id          uuid primary key default uuid_generate_v4(),
  promo_id    uuid references public.promo_codes(id),
  user_id     uuid references public.profiles(id),
  booking_id  uuid references public.bookings(id),
  redeemed_at timestamptz default now()
);

alter table public.promo_redemptions enable row level security;

-- ── SERVER-SIDE PRICING (tamper-proof) ───────────────────────
create or replace function public.calculate_booking_price(
  p_venue_id integer, p_guests integer, p_promo_code text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_venue record; v_promo record;
  v_base integer; v_discount integer := 0;
  v_fee integer; v_total integer;
  v_pid uuid := null; v_dtype text := null; v_dval integer := 0;
begin
  select * into v_venue from public.venues where id = p_venue_id and active = true;
  if not found then return jsonb_build_object('error','Venue not found'); end if;
  v_base := v_venue.price_min * 100 * p_guests;
  if p_promo_code is not null and trim(p_promo_code) != '' then
    select * into v_promo from public.promo_codes
    where upper(code) = upper(trim(p_promo_code)) and active = true
      and (valid_from is null or valid_from <= now())
      and (valid_until is null or valid_until >= now())
      and (max_uses is null or used_count < max_uses)
      and (min_spend is null or min_spend <= v_base)
      and (venue_id is null or venue_id = p_venue_id);
    if not found then return jsonb_build_object('error','Invalid or expired promo code'); end if;
    v_pid := v_promo.id;
    if v_promo.discount_type = 'fixed' and v_promo.discount_value is not null then
      v_discount := least(v_promo.discount_value, v_base);
      v_dtype := 'fixed'; v_dval := v_promo.discount_value;
    else
      v_discount := (v_base * coalesce(v_promo.discount_pct,0) / 100);
      v_dtype := 'percent'; v_dval := coalesce(v_promo.discount_pct,0);
    end if;
  end if;
  v_fee := ((v_base - v_discount) * 10 / 100);
  v_total := v_base - v_discount + v_fee;
  return jsonb_build_object(
    'venue_id',p_venue_id,'venue_name',v_venue.name,'guests',p_guests,
    'base_price',v_base,'discount',v_discount,'discount_type',v_dtype,
    'discount_value',v_dval,'platform_fee',v_fee,'total',v_total,
    'promo_code_id',v_pid,'promo_code',p_promo_code,'currency','usd'
  );
end;
$$;

-- ── SECURE BOOKING CREATION ───────────────────────────────────
create or replace function public.create_booking_secure(
  p_user_id uuid, p_venue_id integer, p_guests integer,
  p_event_date text, p_promo_code text default null, p_notes text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_pricing jsonb; v_booking_id uuid; v_conf_code text;
begin
  v_pricing := public.calculate_booking_price(p_venue_id, p_guests, p_promo_code);
  if v_pricing ? 'error' then return v_pricing; end if;
  v_conf_code := upper(substring(encode(gen_random_bytes(4),'hex'),1,8));
  insert into public.bookings (
    user_id, venue_id, event_date, party_size, guests,
    subtotal, discount_pct, discount_amount, platform_fee, total,
    promo_code, status, confirmation_code, notes
  ) values (
    p_user_id, p_venue_id, p_event_date, p_guests, p_guests,
    (v_pricing->>'base_price')::integer,
    coalesce((v_pricing->>'discount_value')::integer,0),
    (v_pricing->>'discount')::integer,
    (v_pricing->>'platform_fee')::integer,
    (v_pricing->>'total')::integer,
    p_promo_code,'confirmed',v_conf_code,p_notes
  ) returning id into v_booking_id;
  if (v_pricing->>'promo_code_id') is not null then
    update public.promo_codes set used_count = used_count + 1
    where id = (v_pricing->>'promo_code_id')::uuid;
    insert into public.promo_redemptions (promo_id, user_id, booking_id)
    values ((v_pricing->>'promo_code_id')::uuid, p_user_id, v_booking_id);
  end if;
  return jsonb_build_object(
    'booking_id',v_booking_id,'confirmation_code',v_conf_code,
    'venue_name',v_pricing->>'venue_name','total',v_pricing->'total','status','confirmed'
  );
end;
$$;
