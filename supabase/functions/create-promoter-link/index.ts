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

    const { label, venue_id } = await req.json();
    if (!label || typeof label !== 'string' || label.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Label required' }), { status: 400, headers: cors });
    }

    // Generate unique slug from label
    const base = label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20);
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const slug = `${base}-${rand}`;

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data, error } = await admin.from('promoter_links').insert({
      promoter_id: user.id,
      venue_id: venue_id || null,
      label: label.trim().slice(0, 100),
      slug,
    }).select('id, label, slug, clicks, conversions, created_at').single();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, link: { ...data, url: `luma.vip/p/${slug}` } }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
