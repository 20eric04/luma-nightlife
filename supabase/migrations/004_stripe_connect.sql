-- ============================================================
-- LUMA — Stripe Connect support
-- ============================================================

-- Add Stripe account ID to profiles (for promoter payouts via Connect)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded boolean DEFAULT false;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON public.profiles (stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- Add index on payment_intent_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_bookings_payment ON public.bookings (payment_intent_id) WHERE payment_intent_id IS NOT NULL;
