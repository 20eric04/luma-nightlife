import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: profile } = await admin.from('profiles').select('stripe_account_id, full_name, email').eq('id', user.id).single();
    const baseUrl = Deno.env.get('APP_URL') || 'https://luma.vip';
    const { action } = await req.json();

    if (action === 'status') {
      if (!profile?.stripe_account_id) return new Response(JSON.stringify({ onboarded: false, has_account: false }), { headers: { ...cors, 'Content-Type': 'application/json' } });
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      const onboarded = account.charges_enabled && account.payouts_enabled;
      if (onboarded && !profile.stripe_onboarded) {
        await admin.from('profiles').update({ stripe_onboarded: true }).eq('id', user.id);
      }
      return new Response(JSON.stringify({ onboarded, has_account: true, charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Create or get Stripe Connect account
    let accountId = profile?.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile?.email || user.email,
        metadata: { user_id: user.id, platform: 'luma' },
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      });
      accountId = account.id;
      await admin.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}?stripe=refresh`,
      return_url: `${baseUrl}?stripe=complete`,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url, account_id: accountId }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
