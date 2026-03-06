import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { booking_id, confirmation_code, venue_name, event_date, guests, total } = await req.json();
    const { data: profile } = await admin.from('profiles').select('email,full_name').eq('id', user.id).single();
    const email = profile?.email || user.email;
    const name = profile?.full_name || 'Guest';
    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;
    if (resendKey && email) {
      const body = `Hi ${name},\n\nYour booking is confirmed!\n\nCONFIRMATION: ${confirmation_code}\nVenue: ${venue_name}\nDate: ${event_date}\nGuests: ${guests}\nTotal: $${((total||0)/100).toFixed(2)}\n\nShow this code at the door.\n\n— Luma Team\nluma.vip`;
      const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Luma <noreply@luma.vip>', to: [email], subject: `Confirmed: ${venue_name} · ${confirmation_code}`, text: body }) });
      emailSent = res.ok;
    }
    await admin.from('bookings').update({ updated_at: new Date().toISOString() }).eq('id', booking_id);
    return new Response(JSON.stringify({ success: true, email_sent: emailSent }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) { return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }); }
});
