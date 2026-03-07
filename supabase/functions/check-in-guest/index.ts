import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });

    const { booking_id } = await req.json();
    if (!booking_id) return new Response(JSON.stringify({ error: 'booking_id required' }), { status: 400, headers: cors });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

    // Verify booking belongs to a venue this promoter manages
    const { data: booking } = await admin.from('bookings')
      .select('id, venue_id, status, venues(promoter_id)')
      .eq('id', booking_id)
      .single();

    if (!booking) return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers: cors });
    if (booking.venues?.promoter_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not your venue' }), { status: 403, headers: cors });
    }

    const { error } = await admin.from('bookings')
      .update({ status: 'checked_in', updated_at: new Date().toISOString() })
      .eq('id', booking_id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
