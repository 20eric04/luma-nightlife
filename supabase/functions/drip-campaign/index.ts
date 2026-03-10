import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://lumarsv.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 5-email drip sequence for waitlist signups
const DRIP_SEQUENCE = [
  {
    step: 1,
    delay_hours: 0, // Immediate
    subject: "You're on the Luma waitlist ✨",
    template: (name: string, city: string) => `
<div style="max-width:520px;margin:0 auto;padding:40px 28px;background:#08080c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;font-style:italic;color:#c9a84c;margin-bottom:32px;">luma</div>
  <div style="font-size:24px;font-weight:700;color:white;margin-bottom:12px;">You're in${name ? ', ' + name : ''}.</div>
  <div style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:28px;">Welcome to the Luma waitlist. We're building the smartest way to book VIP tables in ${city || 'Miami & NYC'}. Early access members get first pick of venues, exclusive promo codes, and priority reservations.</div>
  <div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.15);border-radius:14px;padding:18px 20px;margin-bottom:28px;">
    <div style="font-size:11px;color:#c9a84c;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">What's coming</div>
    <div style="font-size:13px;color:rgba(255,255,255,.55);line-height:1.7;">✓ 29 real venues across Miami & NYC<br/>✓ Transparent pricing — no DM negotiations<br/>✓ Verified promoters with real commissions<br/>✓ Instant confirmation with QR codes</div>
  </div>
  <a href="https://lumarsv.com" style="display:inline-block;padding:12px 28px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:12px;font-size:13px;font-weight:700;">Preview the App →</a>
  <div style="margin-top:40px;border-top:1px solid rgba(255,255,255,.06);padding-top:16px;font-size:10px;color:rgba(255,255,255,.15);">© 2026 Luma · lumarsv.com</div>
</div>`
  },
  {
    step: 2,
    delay_hours: 48, // Day 3
    subject: "The venues you'll love 🏙",
    template: (name: string, city: string) => `
<div style="max-width:520px;margin:0 auto;padding:40px 28px;background:#08080c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;font-style:italic;color:#c9a84c;margin-bottom:32px;">luma</div>
  <div style="font-size:22px;font-weight:700;color:white;margin-bottom:12px;">Here's what's waiting for you${name ? ', ' + name : ''}.</div>
  <div style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:24px;">We've curated the best nightlife in ${city || 'your city'}. Real venues, real pricing, no games.</div>
  ${city === 'Miami' ? `
  <div style="font-size:13px;color:rgba(255,255,255,.6);line-height:2;margin-bottom:24px;">
    🔥 <strong style="color:white;">LIV</strong> — Fontainebleau's legendary club. From $250<br/>
    ⚡ <strong style="color:white;">E11EVEN</strong> — 24-hour ultraclub. From $200<br/>
    🌊 <strong style="color:white;">Nikki Beach</strong> — Sunday brunch institution. From $100<br/>
    🎵 <strong style="color:white;">Club Space</strong> — After-hours legend. From $80<br/>
    🍾 <strong style="color:white;">Story</strong> — South Beach flagship. From $300
  </div>` : `
  <div style="font-size:13px;color:rgba(255,255,255,.6);line-height:2;margin-bottom:24px;">
    🔥 <strong style="color:white;">1 OAK</strong> — Celebrity nightclub. From $300<br/>
    ⚡ <strong style="color:white;">Marquee</strong> — NYC's premier club. From $200<br/>
    🏙 <strong style="color:white;">PHD Rooftop</strong> — Skyline views. From $150<br/>
    🎵 <strong style="color:white;">Avant Gardner</strong> — Brooklyn Mirage. From $80<br/>
    🍾 <strong style="color:white;">Tao Downtown</strong> — Restaurant meets club. From $250
  </div>`}
  <a href="https://lumarsv.com/app" style="display:inline-block;padding:12px 28px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:12px;font-size:13px;font-weight:700;">Browse Venues →</a>
  <div style="margin-top:40px;border-top:1px solid rgba(255,255,255,.06);padding-top:16px;font-size:10px;color:rgba(255,255,255,.15);">© 2026 Luma · lumarsv.com</div>
</div>`
  },
  {
    step: 3,
    delay_hours: 120, // Day 5
    subject: "How promoters earn $2,400/mo on Luma 💰",
    template: (name: string, _city: string) => `
<div style="max-width:520px;margin:0 auto;padding:40px 28px;background:#08080c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;font-style:italic;color:#c9a84c;margin-bottom:32px;">luma</div>
  <div style="font-size:22px;font-weight:700;color:white;margin-bottom:12px;">The promoter side of Luma.</div>
  <div style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:24px;">Whether you're a guest or know someone in the game — here's how Luma works for promoters.</div>
  <div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.15);border-radius:14px;padding:18px 20px;margin-bottom:24px;">
    <div style="font-size:20px;font-weight:700;color:white;margin-bottom:8px;">15% commission on every booking</div>
    <div style="font-size:13px;color:rgba(255,255,255,.45);line-height:1.7;">Guest books a $500 table through your link → you earn $75. No caps, no catches. Same-day Stripe payouts.</div>
  </div>
  <div style="font-size:13px;color:rgba(255,255,255,.5);line-height:1.8;margin-bottom:24px;">
    📊 Real-time analytics dashboard<br/>
    🔗 Custom invite links with QR codes<br/>
    💬 Direct messaging with guests<br/>
    🏆 Leaderboard & ranking system<br/>
    📱 Everything from your phone
  </div>
  <div style="font-size:12px;color:rgba(255,255,255,.3);margin-bottom:24px;">Know a promoter? Forward this email. They'll thank you later.</div>
  <a href="https://lumarsv.com/app" style="display:inline-block;padding:12px 28px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:12px;font-size:13px;font-weight:700;">Try the Promoter Dashboard →</a>
  <div style="margin-top:40px;border-top:1px solid rgba(255,255,255,.06);padding-top:16px;font-size:10px;color:rgba(255,255,255,.15);">© 2026 Luma · lumarsv.com</div>
</div>`
  },
  {
    step: 4,
    delay_hours: 168, // Day 7
    subject: "Your $25 welcome credit is ready 🎁",
    template: (name: string, _city: string) => `
<div style="max-width:520px;margin:0 auto;padding:40px 28px;background:#08080c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;font-style:italic;color:#c9a84c;margin-bottom:32px;">luma</div>
  <div style="font-size:22px;font-weight:700;color:white;margin-bottom:12px;">A little something for being early${name ? ', ' + name : ''}.</div>
  <div style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:24px;">As a thank you for joining the waitlist, here's $25 off your first booking when we launch.</div>
  <div style="background:rgba(201,168,76,.12);border:2px dashed rgba(201,168,76,.3);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
    <div style="font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.15em;text-transform:uppercase;margin-bottom:8px;">Your Promo Code</div>
    <div style="font-family:monospace;font-size:32px;font-weight:700;color:#c9a84c;letter-spacing:.1em;">EARLY25</div>
    <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:8px;">$25 off any booking. Valid for 30 days after launch.</div>
  </div>
  <div style="font-size:13px;color:rgba(255,255,255,.4);line-height:1.7;margin-bottom:24px;">Plus — invite friends and earn $25 for each one who joins. No limit.</div>
  <a href="https://lumarsv.com" style="display:inline-block;padding:12px 28px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:12px;font-size:13px;font-weight:700;">Share Luma →</a>
  <div style="margin-top:40px;border-top:1px solid rgba(255,255,255,.06);padding-top:16px;font-size:10px;color:rgba(255,255,255,.15);">© 2026 Luma · lumarsv.com</div>
</div>`
  },
  {
    step: 5,
    delay_hours: 336, // Day 14
    subject: "We're almost ready to launch 🚀",
    template: (name: string, city: string) => `
<div style="max-width:520px;margin:0 auto;padding:40px 28px;background:#08080c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;font-style:italic;color:#c9a84c;margin-bottom:32px;">luma</div>
  <div style="font-size:22px;font-weight:700;color:white;margin-bottom:12px;">Launch is coming${name ? ', ' + name : ''}.</div>
  <div style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:24px;">We're putting the final touches on Luma. Here's what we've built for ${city || 'your city'}:</div>
  <div style="font-size:13px;color:rgba(255,255,255,.5);line-height:2;margin-bottom:24px;">
    ✅ 29 venues across Miami & NYC<br/>
    ✅ Real-time pricing & availability<br/>
    ✅ Verified promoter network<br/>
    ✅ Instant booking with confirmation codes<br/>
    ✅ Review system with vibe tags<br/>
    ✅ Referral rewards ($25 each)
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
    <div style="font-size:13px;color:white;font-weight:600;">You'll be among the first to know when we go live.</div>
    <div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:6px;">Keep an eye on your inbox and follow @luma.rsv on Instagram + TikTok.</div>
  </div>
  <a href="https://instagram.com/luma.rsv" style="display:inline-block;padding:10px 22px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:10px;font-size:12px;font-weight:700;margin-right:8px;">Instagram</a>
  <a href="https://tiktok.com/@luma.rsv" style="display:inline-block;padding:10px 22px;background:rgba(255,255,255,.08);color:white;text-decoration:none;border-radius:10px;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,.1);">TikTok</a>
  <div style="margin-top:40px;border-top:1px solid rgba(255,255,255,.06);padding-top:16px;font-size:10px;color:rgba(255,255,255,.15);">© 2026 Luma · lumarsv.com</div>
</div>`
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
  const SUPA_URL = Deno.env.get('SUPABASE_URL') || '';
  const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!RESEND_KEY) return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set', hint: 'Add to Supabase Edge Function secrets' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  
  try {
    // Get all waitlist members who need their next drip email
    const res = await fetch(`${SUPA_URL}/rest/v1/waitlist?drip_step=lt.5&order=created_at.asc&limit=50`, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
    });
    const waitlist = await res.json();
    
    let sent = 0;
    const now = new Date();
    
    for (const person of waitlist) {
      const nextStep = (person.drip_step || 0) + 1;
      const template = DRIP_SEQUENCE.find(s => s.step === nextStep);
      if (!template) continue;
      
      // Check if enough time has passed
      const signupDate = new Date(person.created_at);
      const hoursElapsed = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed < template.delay_hours) continue;
      
      // Check last drip wasn't too recent (min 12 hours between emails)
      if (person.last_drip_at) {
        const lastDrip = new Date(person.last_drip_at);
        const hoursSinceLast = (now.getTime() - lastDrip.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < 12) continue;
      }
      
      // Send email
      const html = template.template(person.name || '', person.city || 'Miami');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Luma <noreply@lumarsv.com>',
          to: [person.email],
          subject: template.subject,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#08080c;">${html}</body></html>`,
        }),
      });
      
      // Log it
      await fetch(`${SUPA_URL}/rest/v1/drip_emails`, {
        method: 'POST',
        headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: person.email, sequence_step: nextStep, template: template.subject }),
      });
      
      // Update waitlist record
      await fetch(`${SUPA_URL}/rest/v1/waitlist?id=eq.${person.id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ drip_step: nextStep, last_drip_at: now.toISOString() }),
      });
      
      sent++;
    }
    
    return new Response(JSON.stringify({ success: true, sent, checked: waitlist.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
