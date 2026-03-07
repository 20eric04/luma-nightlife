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

    const { booking_id, confirmation_code, venue_name, event_date, guests, total, phone } = await req.json();
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioSid || !twilioAuth || !twilioFrom) {
      return new Response(JSON.stringify({ success: false, reason: 'Twilio not configured' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Get phone from profile if not provided
    let toPhone = phone;
    if (!toPhone) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
      const { data: profile } = await admin.from('profiles').select('phone').eq('id', user.id).single();
      toPhone = profile?.phone;
    }
    if (!toPhone) {
      return new Response(JSON.stringify({ success: false, reason: 'No phone number' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const body = `✨ Luma Booking Confirmed!\n\n📍 ${venue_name}\n📅 ${event_date}\n👥 ${guests} guests\n💰 $${((total || 0) / 100).toFixed(2)}\n\n🔑 Code: ${confirmation_code}\n\nShow this at the door.\n\nluma.vip`;

    const params = new URLSearchParams({ To: toPhone, From: twilioFrom, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuth}`), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ success: res.ok, sid: data.sid }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
