export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 32 }}>Last updated: March 2025</p>

      <p>Welcome to Luma ("we," "us," "our"). By accessing or using luma.vip (the "Platform"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Platform.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>1. Service Description</h2>
      <p>Luma is a nightlife booking platform that connects guests with venues and promoters in Miami and New York. We facilitate table reservations, event bookings, and related services. Luma acts as an intermediary — we do not own, operate, or manage any venue.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>2. Eligibility</h2>
      <p>You must be at least 21 years old to use Luma. By creating an account, you represent that you meet this age requirement and that all information you provide is accurate and current.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>3. Accounts</h2>
      <p>You are responsible for maintaining the security of your account credentials. You agree to notify us immediately of any unauthorized access. We reserve the right to suspend or terminate accounts that violate these Terms.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>4. Bookings & Payments</h2>
      <p>All prices are displayed in USD and include a 10% platform fee. Pricing is calculated server-side and cannot be modified by users. Payments are processed securely through Stripe. By completing a booking, you authorize us to charge the displayed amount.</p>
      <p>Confirmation codes are issued upon successful payment and serve as proof of reservation. Present your confirmation code at the venue door for entry.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>5. Cancellation & Refunds</h2>
      <p>Free cancellation is available up to 48 hours before the event date. Cancellations within 48 hours are non-refundable. No-shows are non-refundable. Refunds are processed to the original payment method within 5-10 business days.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>6. Promoter Terms</h2>
      <p>Promoters earn a 15% commission on bookings made through their invite links. Commissions are paid via Stripe Connect. Promoters are independent contractors, not employees of Luma. Promoters must not misrepresent venue availability, pricing, or services.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>7. Promo Codes</h2>
      <p>Promo codes are subject to availability, expiration dates, minimum spend requirements, and usage limits. Promo codes cannot be combined, resold, or transferred. We reserve the right to void promo codes used fraudulently.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>8. Prohibited Conduct</h2>
      <p>You agree not to: create fake accounts or bookings; manipulate pricing or promo codes; harass other users, promoters, or venue staff; use the Platform for any illegal purpose; attempt to circumvent security measures; scrape or harvest data from the Platform.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>9. Disclaimer</h2>
      <p>Luma provides the Platform "as is" without warranties of any kind. We do not guarantee venue availability, service quality, or the conduct of venue staff, promoters, or other guests. Venue policies (dress code, entry requirements, etc.) are set by the venue, not by Luma.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>10. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, Luma's total liability for any claims arising from your use of the Platform shall not exceed the amount you paid to Luma in the 12 months preceding the claim.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>11. Governing Law</h2>
      <p>These Terms are governed by the laws of the Commonwealth of Puerto Rico, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Puerto Rico.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>12. Changes</h2>
      <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>13. Contact</h2>
      <p>Questions about these Terms? Email us at legal@luma.vip.</p>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #eee', fontSize: 12, color: '#999' }}>
        © 2025 Luma. All rights reserved. luma.vip
      </div>
    </div>
  );
}
