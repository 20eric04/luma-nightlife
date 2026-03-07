import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });

    const { venue_id, guests, event_date, promo_code, notes, success_url, cancel_url } = await req.json();

    // Validate inputs
    if (!venue_id || !guests || guests < 1 || guests > 20 || !event_date) {
      return new Response(JSON.stringify({ error: 'Invalid booking parameters' }), { status: 400, headers: cors });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // 1. Calculate price server-side (tamper-proof)
    const { data: pricing, error: priceErr } = await admin.rpc('calculate_booking_price', {
      p_venue_id: venue_id,
      p_guests: guests,
      p_promo_code: promo_code || null,
    });
    if (priceErr) throw priceErr;
    if (pricing?.error) return new Response(JSON.stringify({ error: pricing.error }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

    const totalCents = pricing.total; // already in cents
    const venueName = pricing.venue_name;

    // 2. Create pending booking
    const confCode = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 8);

    const { data: booking, error: bookErr } = await admin.from('bookings').insert({
      user_id: user.id,
      venue_id,
      event_date,
      party_size: guests,
      guests,
      subtotal: pricing.base_price,
      discount_pct: pricing.discount_value || 0,
      discount_amount: pricing.discount || 0,
      platform_fee: pricing.platform_fee,
      total: totalCents,
      promo_code: promo_code || null,
      status: 'pending',
      confirmation_code: confCode,
      notes: notes || null,
    }).select('id, confirmation_code').single();

    if (bookErr) throw bookErr;

    // 3. Track promo usage
    if (pricing.promo_code_id) {
      await admin.from('promo_codes').update({ used_count: admin.rpc('increment', { x: 1 }) }).eq('id', pricing.promo_code_id);
      await admin.from('promo_redemptions').insert({
        promo_id: pricing.promo_code_id,
        user_id: user.id,
        booking_id: booking.id,
      });
    }

    // 4. Create Stripe Checkout Session
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

    // Check if venue has a connected Stripe account (for Connect payouts)
    const { data: venue } = await admin.from('venues').select('promoter_id').eq('id', venue_id).single();
    let stripeAccountId: string | undefined;
    if (venue?.promoter_id) {
      const { data: profile } = await admin.from('profiles').select('stripe_account_id').eq('id', venue.promoter_id).single();
      stripeAccountId = profile?.stripe_account_id || undefined;
    }

    // Platform fee = 10% of (total - platform_fee) — we keep the platform_fee portion
    const applicationFeeAmount = pricing.platform_fee;

    const baseUrl = success_url?.split('?')[0]?.replace(/\/+$/, '') || Deno.env.get('APP_URL') || 'https://luma.vip';

    const sessionParams: any = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: totalCents,
          product_data: {
            name: `${venueName} — ${notes || 'Table Reservation'}`,
            description: `${event_date} · ${guests} guests · Code: ${confCode}`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        booking_id: booking.id,
        confirmation_code: confCode,
        venue_name: venueName,
        event_date,
        guests: String(guests),
        user_id: user.id,
      },
      customer_email: user.email,
      success_url: `${baseUrl}?booking=success&code=${confCode}`,
      cancel_url: `${baseUrl}?booking=cancelled&id=${booking.id}`,
      expires_after_completion: { enabled: true, seconds: 300 },
    };

    // If venue has connected Stripe account, use Connect with application fee
    if (stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: { destination: stripeAccountId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // 5. Store payment session ID on booking
    await admin.from('bookings').update({
      payment_intent_id: session.id,
      updated_at: new Date().toISOString(),
    }).eq('id', booking.id);

    return new Response(JSON.stringify({
      checkout_url: session.url,
      booking_id: booking.id,
      confirmation_code: confCode,
      session_id: session.id,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('create-checkout error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
