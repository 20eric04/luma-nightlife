import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://lumarsv.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const url = new URL(req.url);
    const metro = url.searchParams.get('metro');
    const type = url.searchParams.get('type');
    let query = supabase.from('venues').select('*').eq('active', true).order('rating', { ascending: false });
    if (metro) query = query.eq('metro', metro);
    if (type && type !== 'All') query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify({ venues: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
