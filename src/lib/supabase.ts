import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const EDGE_URL = `${supabaseUrl}/functions/v1`;

/** Call a Supabase Edge Function with the current session */
export async function edgeCall<T = unknown>(
  fn: string,
  body: Record<string, unknown>
): Promise<T> {
  const session = (await supabase.auth.getSession()).data.session;

  const res = await fetch(`${EDGE_URL}/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Edge function error');
  }

  return res.json();
}
