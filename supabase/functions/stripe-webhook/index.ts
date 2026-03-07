import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

// No CORS needed — Stripe calls this directly
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Verify webhook signature
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event: Stripe.Event;
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
      }
    } else {
      // In development, parse without verification (NOT for production)
      event = JSON.parse(body);
      console.warn('⚠️ Webhook signature not verified — set STRIPE_WEBHOOK_SECRET in production');
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const bookingId = session.metadata?.booking_id;
        const confCode = session.metadata?.confirmation_code;
        const venueName = session.metadata?.venue_name;
        const eventDate = session.metadata?.event_date;
        const guests = session.metadata?.guests;
        const userId = session.metadata?.user_id;

        if (!bookingId) {
          console.error('No booking_id in session metadata');
          break;
        }

        // Update booking to confirmed with payment intent
        const { error: updateErr } = await admin.from('bookings').update({
          status: 'confirmed',
          payment_intent_id: session.payment_intent || session.id,
          updated_at: new Date().toISOString(),
        }).eq('id', bookingId);

        if (updateErr) {
          console.error('Failed to update booking:', updateErr);
          break;
        }

        console.log(`✅ Booking ${confCode} confirmed (${bookingId})`);

        // Send confirmation email (non-blocking)
        try {
          const resendKey = Deno.env.get('RESEND_API_KEY');
          if (resendKey && session.customer_email) {
            // Get user profile for name
            let name = 'Guest';
            if (userId) {
              const { data: profile } = await admin.from('profiles').select('full_name').eq('id', userId).single();
              name = profile?.full_name || 'Guest';
            }

            const total = session.amount_total || 0;
            const emailBody = `Hi ${name},\n\nYour booking is confirmed!\n\nCONFIRMATION: ${confCode}\nVenue: ${venueName}\nDate: ${eventDate}\nGuests: ${guests}\nTotal: $${(total / 100).toFixed(2)}\n\nShow this code at the door.\n\nPayment received ✓\n\n— Luma Team\nluma.vip`;

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'Luma <noreply@luma.vip>',
                to: [session.customer_email],
                subject: `Confirmed: ${venueName} · ${confCode}`,
                text: emailBody,
              }),
            });
            console.log(`📧 Confirmation email sent to ${session.customer_email}`);
          }

          // Send SMS (non-blocking)
          try {
            const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
            const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
            const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');
            if (twilioSid && twilioAuth && twilioFrom && userId) {
              const { data: smsProfile } = await admin.from('profiles').select('phone').eq('id', userId).single();
              if (smsProfile?.phone) {
                const smsBody = `✨ Luma Confirmed!\n📍 ${venueName}\n📅 ${eventDate}\n🔑 ${confCode}\n\nShow this at the door.\nluma.vip`;
                const params = new URLSearchParams({ To: smsProfile.phone, From: twilioFrom, Body: smsBody });
                await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
                  method: 'POST',
                  headers: { 'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuth}`), 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: params.toString(),
                });
                console.log(`📱 SMS sent to ${smsProfile.phone}`);
              }
            }
          } catch (smsErr) {
            console.error('SMS send failed (non-fatal):', smsErr);
          }
        } catch (emailErr) {
          console.error('Email send failed (non-fatal):', emailErr);
        }
        break;
      }

      case 'checkout.session.expired': {
        // Clean up expired pending bookings
        const session = event.data.object as any;
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
          await admin.from('bookings').update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId).eq('status', 'pending');
          console.log(`🗑 Expired booking cancelled: ${bookingId}`);
        }
        break;
      }

      case 'charge.refunded': {
        // Handle refunds
        const charge = event.data.object as any;
        const paymentIntent = charge.payment_intent;
        if (paymentIntent) {
          await admin.from('bookings').update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('payment_intent_id', paymentIntent);
          console.log(`💸 Refund processed for ${paymentIntent}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
