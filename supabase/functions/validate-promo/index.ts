import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, rateLimit } from '../_shared/cors.ts';
Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    // Rate limit by IP to prevent promo code enumeration
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit('validate-promo:' + ip, 20, 60000)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const { venue_id, guests, promo_code } = await req.json();
    if (!venue_id || !guests || guests < 1 || guests > 20) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data, error } = await supabase.rpc('calculate_booking_price', { p_venue_id: venue_id, p_guests: guests, p_promo_code: promo_code || null });
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) { return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }); }
});
