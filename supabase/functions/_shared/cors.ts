// Shared CORS helper — set ALLOWED_ORIGINS env var in production (comma-separated)
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '*').split(',').map(s => s.trim());

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin || '*' : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

// Backwards compat — functions that just import corsHeaders
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (per instance, resets on cold start)
const hits = new Map<string, number[]>();
export function rateLimit(key: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  hits.set(key, timestamps);
  return true;
}
