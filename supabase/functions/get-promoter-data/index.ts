import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });

    // Verify user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: cors });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const uid = user.id;

    // 1. Get promoter's venues
    const { data: venues } = await admin
      .from('venues')
      .select('id, name, city, type, price_min, rating, img_url')
      .eq('promoter_id', uid)
      .eq('active', true);

    const venueIds = (venues || []).map(v => v.id);

    // 2. Get bookings for promoter's venues (guests + revenue)
    let bookings: any[] = [];
    if (venueIds.length > 0) {
      const { data } = await admin
        .from('bookings')
        .select('id, user_id, venue_id, event_date, party_size, status, confirmation_code, total, subtotal, platform_fee, promo_code, created_at, notes, profiles(full_name, email, avatar_url), venues(name, type, city)')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false })
        .limit(200);
      bookings = data || [];
    }

    // 3. Get promoter links
    const { data: links } = await admin
      .from('promoter_links')
      .select('id, venue_id, label, slug, clicks, conversions, active, created_at, venues(name)')
      .eq('promoter_id', uid)
      .order('created_at', { ascending: false });

    // 4. Get messages (conversations where promoter is sender or receiver)
    const { data: messages } = await admin
      .from('messages')
      .select('id, sender_id, receiver_id, body, read, created_at')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: true })
      .limit(500);

    // 5. Get unique conversation partners' profiles
    const partnerIds = new Set<string>();
    (messages || []).forEach((m: any) => {
      if (m.sender_id !== uid) partnerIds.add(m.sender_id);
      if (m.receiver_id !== uid) partnerIds.add(m.receiver_id);
    });
    let partners: any[] = [];
    if (partnerIds.size > 0) {
      const { data } = await admin
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', Array.from(partnerIds));
      partners = data || [];
    }

    // 6. Get daily click data for analytics (last 7 days)
    const linkIds = (links || []).map(l => l.id);
    let dailyClicks: any[] = [];
    if (linkIds.length > 0) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data } = await admin
        .from('link_clicks')
        .select('link_id, clicked_at')
        .in('link_id', linkIds)
        .gte('clicked_at', weekAgo.toISOString());
      dailyClicks = data || [];
    }

    // 7. Compute aggregates
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in');
    const commissionRate = 0.15;
    const totalRevenue = confirmedBookings.reduce((s, b) => s + (b.total || 0), 0);
    const totalCommission = Math.round(totalRevenue * commissionRate);
    const paidBookings = confirmedBookings.filter(b => b.status === 'checked_in');
    const pendingBookings = confirmedBookings.filter(b => b.status === 'confirmed');
    const earnedCommission = Math.round(paidBookings.reduce((s, b) => s + (b.total || 0), 0) * commissionRate);
    const pendingCommission = Math.round(pendingBookings.reduce((s, b) => s + (b.total || 0), 0) * commissionRate);

    // 8. Build payout history from bookings grouped by venue+date
    const payoutMap = new Map();
    confirmedBookings.forEach(b => {
      const key = `${b.venue_id}-${b.event_date}`;
      if (!payoutMap.has(key)) {
        payoutMap.set(key, {
          event: `${b.venues?.name || 'Venue'} · ${b.event_date}`,
          gross: 0,
          comm: 0,
          status: b.status === 'checked_in' ? 'paid' : 'pending',
        });
      }
      const p = payoutMap.get(key);
      p.gross += Math.round((b.total || 0) / 100);
      p.comm += Math.round((b.total || 0) * commissionRate / 100);
      if (b.status === 'confirmed') p.status = 'pending'; // any pending = pending
    });

    // 9. Build guest list from bookings
    const guests = bookings.map(b => ({
      id: b.id,
      name: b.profiles?.full_name || b.profiles?.email?.split('@')[0] || 'Guest',
      email: b.profiles?.email || '',
      avatar: b.profiles?.avatar_url || null,
      table: b.notes || 'Table',
      party: b.party_size,
      status: b.status,
      paid: Math.round((b.total || 0) / 100),
      arrived: b.status === 'checked_in',
      event_date: b.event_date,
      venue: b.venues?.name || 'Venue',
      venue_id: b.venue_id,
      confirmation_code: b.confirmation_code,
      created_at: b.created_at,
    }));

    // 10. Build conversation threads
    const partnerMap = new Map(partners.map(p => [p.id, p]));
    const convMap = new Map();
    (messages || []).forEach((m: any) => {
      const partnerId = m.sender_id === uid ? m.receiver_id : m.sender_id;
      if (!convMap.has(partnerId)) {
        const partner = partnerMap.get(partnerId);
        convMap.set(partnerId, {
          id: partnerId,
          name: partner?.full_name || partner?.email?.split('@')[0] || 'Guest',
          avatar: partner?.avatar_url || null,
          messages: [],
          unread: 0,
          last: '',
          time: '',
        });
      }
      const conv = convMap.get(partnerId);
      conv.messages.push({
        mine: m.sender_id === uid,
        body: m.body,
        created_at: m.created_at,
        read: m.read,
      });
      conv.last = m.body;
      conv.time = new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      if (m.receiver_id === uid && !m.read) conv.unread++;
    });

    // 11. Aggregate daily clicks into array of 7 days
    const clicksByDay = Array(7).fill(0);
    const now = new Date();
    dailyClicks.forEach((c: any) => {
      const clickDate = new Date(c.clicked_at);
      const daysAgo = Math.floor((now.getTime() - clickDate.getTime()) / 86400000);
      if (daysAgo >= 0 && daysAgo < 7) clicksByDay[6 - daysAgo] += 1;
    });

    // Get user's profile for name
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', uid)
      .single();

    return new Response(JSON.stringify({
      promoter_name: profile?.full_name || user.email?.split('@')[0] || 'Promoter',
      venues: venues || [],
      guests,
      links: (links || []).map(l => ({
        id: l.id,
        label: l.label,
        slug: l.slug,
        url: `luma.vip/p/${l.slug}`,
        clicks: l.clicks,
        conv: l.conversions,
        active: l.active,
        venue: l.venues?.name || '',
      })),
      conversations: Array.from(convMap.values()),
      payouts: Array.from(payoutMap.values()),
      stats: {
        total_commission: Math.round(totalCommission / 100),
        earned: Math.round(earnedCommission / 100),
        pending: Math.round(pendingCommission / 100),
        total_clicks: (links || []).reduce((s, l) => s + l.clicks, 0),
        total_conversions: (links || []).reduce((s, l) => s + l.conversions, 0),
        confirmed_guests: guests.filter(g => g.status === 'confirmed').length,
        arrived_guests: guests.filter(g => g.arrived).length,
        total_guests: guests.length,
      },
      daily_clicks: clicksByDay,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
