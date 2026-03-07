import { getCorsHeaders, rateLimit } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400, headers: cors });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit('reset:' + ip, 5, 300000)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Try again in 5 minutes.' }), { status: 429, headers: cors });
    }
    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const supaKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const redirectTo = (Deno.env.get('APP_URL') || 'https://luma.vip') + '?reset=true';
    const r = await fetch(`${supaUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: { 'apikey': supaKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), redirect_to: redirectTo }),
    });
    // Always return success to prevent email enumeration
    return new Response(JSON.stringify({ success: true, message: 'If an account exists, a reset link has been sent.' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
