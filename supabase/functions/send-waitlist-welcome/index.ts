import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://lumarsv.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email templates
const waitlistWelcome = (name: string, city: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#08080c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 28px;">
    <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;font-style:italic;color:#c9a84c;margin-bottom:4px;">luma</div>
    <div style="width:36px;height:2px;background:#c9a84c;margin-bottom:32px;border-radius:2px;"></div>
    
    <div style="font-size:24px;font-weight:700;color:white;margin-bottom:12px;">You're on the list${name ? ', ' + name : ''}.</div>
    <div style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:28px;">
      We'll let you know the moment Luma opens in ${city || 'your city'}. Early access members get first pick of venues, exclusive promo codes, and priority table reservations.
    </div>
    
    <div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.15);border-radius:14px;padding:18px 20px;margin-bottom:28px;">
      <div style="font-size:11px;color:#c9a84c;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">While you wait</div>
      <div style="font-size:13px;color:rgba(255,255,255,.55);line-height:1.7;">
        Follow <strong style="color:white;">@luma.rsv</strong> on Instagram and TikTok for nightlife content, venue reviews, and behind-the-scenes looks at Miami and NYC's best spots.
      </div>
    </div>
    
    <div style="display:flex;gap:10px;margin-bottom:32px;">
      <a href="https://instagram.com/luma.rsv" style="padding:10px 22px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:10px;font-size:12px;font-weight:700;">Instagram</a>
      <a href="https://tiktok.com/@luma.rsv" style="padding:10px 22px;background:rgba(255,255,255,.08);color:white;text-decoration:none;border-radius:10px;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,.1);">TikTok</a>
    </div>
    
    <div style="border-top:1px solid rgba(255,255,255,.06);padding-top:20px;">
      <div style="font-size:10px;color:rgba(255,255,255,.2);">© 2026 Luma · lumarsv.com</div>
    </div>
  </div>
</body>
</html>`;

const bookingConfirmation = (name: string, venue: string, date: string, code: string, total: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#08080c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 28px;">
    <div style="font-family:Georgia,serif;font-size:36px;font-weight:700;font-style:italic;color:#c9a84c;margin-bottom:4px;">luma</div>
    <div style="width:36px;height:2px;background:#c9a84c;margin-bottom:32px;border-radius:2px;"></div>
    
    <div style="font-size:24px;font-weight:700;color:white;margin-bottom:12px;">You're confirmed, ${name}.</div>
    <div style="font-size:14px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:28px;">
      Your table at <strong style="color:white;">${venue}</strong> is reserved. Show your confirmation code at the door.
    </div>
    
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:22px;margin-bottom:28px;text-align:center;">
      <div style="font-size:10px;color:rgba(255,255,255,.35);letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px;">Confirmation Code</div>
      <div style="font-family:monospace;font-size:32px;font-weight:700;color:#c9a84c;letter-spacing:.12em;margin-bottom:16px;">${code}</div>
      <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.06);padding-top:14px;">
        <div><div style="font-size:9px;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:3px;">Venue</div><div style="font-size:13px;color:white;font-weight:600;">${venue}</div></div>
        <div><div style="font-size:9px;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:3px;">Date</div><div style="font-size:13px;color:white;font-weight:600;">${date}</div></div>
        <div><div style="font-size:9px;color:rgba(255,255,255,.3);text-transform:uppercase;margin-bottom:3px;">Total</div><div style="font-size:13px;color:#c9a84c;font-weight:700;">${total}</div></div>
      </div>
    </div>
    
    <div style="font-size:12px;color:rgba(255,255,255,.35);line-height:1.7;margin-bottom:28px;">
      📱 Open <a href="https://lumarsv.com/app" style="color:#c9a84c;text-decoration:none;">lumarsv.com/app</a> to view your booking details and QR code.<br/>
      🔄 Free cancellation up to 48 hours before your event.
    </div>
    
    <div style="border-top:1px solid rgba(255,255,255,.06);padding-top:20px;">
      <div style="font-size:10px;color:rgba(255,255,255,.2);">© 2026 Luma · lumarsv.com</div>
    </div>
  </div>
</body>
</html>`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_KEY) return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const { type, to, name, city, venue, date, code, total } = await req.json();
    
    let subject = '';
    let html = '';
    
    if (type === 'waitlist') {
      subject = `You're on the Luma waitlist ✨`;
      html = waitlistWelcome(name, city);
    } else if (type === 'booking') {
      subject = `Confirmed: ${venue} — ${date}`;
      html = bookingConfirmation(name, venue, date, code, total);
    } else {
      return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Luma <noreply@lumarsv.com>',
        to: [to],
        subject,
        html,
      }),
    });
    
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
