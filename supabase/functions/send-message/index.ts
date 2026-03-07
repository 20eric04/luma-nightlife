import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, rateLimit } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });

    if (!rateLimit('msg:' + user.id, 30, 60000)) {
      return new Response(JSON.stringify({ error: 'Too many messages' }), { status: 429, headers: cors });
    }

    const { receiver_id, body } = await req.json();
    if (!receiver_id || !body || typeof body !== 'string' || body.trim().length === 0 || body.length > 1000) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), { status: 400, headers: cors });
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data, error } = await admin.from('messages').insert({
      sender_id: user.id,
      receiver_id,
      body: body.trim().slice(0, 1000),
    }).select('id, created_at').single();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, message_id: data.id, created_at: data.created_at }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
