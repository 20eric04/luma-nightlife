export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 32 }}>Last updated: March 2025</p>

      <p>Luma ("we," "us," "our") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use luma.vip (the "Platform").</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>1. Information We Collect</h2>
      <p><strong>Account Information:</strong> Name, email address, phone number (optional), and city preference when you create an account.</p>
      <p><strong>Booking Information:</strong> Venue selections, dates, party sizes, table preferences, promo codes used, and payment information (processed by Stripe — we do not store credit card numbers).</p>
      <p><strong>Promoter Information:</strong> If you register as a promoter, we collect your Stripe Connect account details for commission payouts.</p>
      <p><strong>Usage Data:</strong> Pages visited, features used, booking history, and interaction patterns to improve the Platform.</p>
      <p><strong>Device Information:</strong> Browser type, device type, and IP address for security and analytics.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>2. How We Use Your Information</h2>
      <p>We use your information to: process bookings and payments; send booking confirmations via email and SMS; enable promoter commission tracking and payouts; improve the Platform and user experience; communicate service updates; prevent fraud and enforce our Terms of Service.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>3. Information Sharing</h2>
      <p>We share information with: <strong>Venues</strong> — your name and party size for reservation fulfillment; <strong>Promoters</strong> — limited booking data for guests who booked through their links; <strong>Stripe</strong> — payment processing; <strong>Resend</strong> — email delivery; <strong>Twilio</strong> — SMS delivery.</p>
      <p>We do not sell your personal information to third parties. We do not share your email or phone number with venues or promoters without your consent.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>4. Data Security</h2>
      <p>We implement industry-standard security measures including: server-side pricing calculations that cannot be tampered with; encrypted data transmission (HTTPS/TLS); JWT-based authentication with automatic token refresh; rate limiting on sensitive endpoints; row-level security on all database tables.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>5. Data Retention</h2>
      <p>Account data is retained for as long as your account is active. Booking records are retained for 3 years for tax and legal compliance. You may request deletion of your account and associated data at any time by emailing privacy@luma.vip.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>6. Your Rights</h2>
      <p>You have the right to: access your personal data; correct inaccurate data; request deletion of your data; export your booking history; opt out of marketing communications. To exercise these rights, email privacy@luma.vip.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>7. Cookies</h2>
      <p>We use essential cookies for authentication (session tokens stored in localStorage). We do not use third-party tracking cookies or advertising cookies.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>8. Children</h2>
      <p>Luma is not intended for users under 21. We do not knowingly collect information from minors. If we discover we have collected data from a minor, we will delete it immediately.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>9. Changes</h2>
      <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or a prominent notice on the Platform.</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 28, marginBottom: 8 }}>10. Contact</h2>
      <p>Privacy questions? Email privacy@luma.vip.</p>
      <p>Luma is operated from Puerto Rico, USA.</p>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #eee', fontSize: 12, color: '#999' }}>
        © 2025 Luma. All rights reserved. luma.vip
      </div>
    </div>
  );
}
