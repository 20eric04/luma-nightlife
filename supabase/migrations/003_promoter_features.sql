-- ============================================================
-- LUMA — Promoter Links + Messages
-- ============================================================

-- ── PROMOTER LINKS ───────────────────────────────────────────
create table if not exists public.promoter_links (
  id          uuid primary key default uuid_generate_v4(),
  promoter_id uuid not null references public.profiles(id) on delete cascade,
  venue_id    integer references public.venues(id),
  label       text not null,
  slug        text not null unique, -- e.g. "NOIR-MAR7"
  clicks      integer not null default 0,
  conversions integer not null default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table public.promoter_links enable row level security;
create policy "Promoters see own links"   on public.promoter_links for select using (auth.uid() = promoter_id);
create policy "Promoters create links"    on public.promoter_links for insert with check (auth.uid() = promoter_id);
create policy "Promoters update own links" on public.promoter_links for update using (auth.uid() = promoter_id);
create policy "Promoters delete own links" on public.promoter_links for delete using (auth.uid() = promoter_id);

-- ── MESSAGES ─────────────────────────────────────────────────
create table if not exists public.messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  read        boolean default false,
  created_at  timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Users see own messages" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users send messages"    on public.messages for insert
  with check (auth.uid() = sender_id);
create policy "Receiver can mark read" on public.messages for update
  using (auth.uid() = receiver_id);

-- Index for fast lookups
create index if not exists idx_messages_participants on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists idx_promoter_links_promoter on public.promoter_links (promoter_id);

-- ── DAILY LINK CLICKS (for analytics chart) ──────────────────
create table if not exists public.link_clicks (
  id        uuid primary key default uuid_generate_v4(),
  link_id   uuid not null references public.promoter_links(id) on delete cascade,
  clicked_at timestamptz default now()
);

alter table public.link_clicks enable row level security;
create policy "Promoters see own link clicks" on public.link_clicks for select
  using (exists (select 1 from public.promoter_links l where l.id = link_id and l.promoter_id = auth.uid()));

create index if not exists idx_link_clicks_link on public.link_clicks (link_id, clicked_at desc);
