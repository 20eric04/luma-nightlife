export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://lumarsv.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
