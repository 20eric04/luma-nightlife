"use client";
import { useState, useEffect } from "react";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnlyc3JkaHNrdmRtbG5wc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njc0NDcsImV4cCI6MjA4ODM0MzQ0N30.o1CPKQP1qrvonHJFm7UESuFmgTa3z-BJqePMSVn7ZkI";

const gold = "#c9a84c";

interface Invite {
  name: string;
  instagram: string;
  city: string;
  invite_code: string;
  venues: string;
  followers: string;
  status: string;
}

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { code } = await params;
      try {
        const r = await fetch(
          `${SUPA_URL}/rest/v1/promoter_invites?invite_code=eq.${encodeURIComponent(code)}&select=*`,
          { headers: { apikey: SUPA_ANON } }
        );
        const data = await r.json();
        if (data && data.length > 0) {
          setInvite(data[0]);
          // Mark as opened
          fetch(`${SUPA_URL}/rest/v1/promoter_invites?invite_code=eq.${encodeURIComponent(code)}`, {
            method: "PATCH",
            headers: { apikey: SUPA_ANON, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ status: "opened", opened_at: new Date().toISOString() }),
          }).catch(() => {});
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [params]);

  const submit = async () => {
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    try {
      // Add to waitlist with promoter role
      await fetch(`${SUPA_URL}/rest/v1/waitlist`, {
        method: "POST",
        headers: { apikey: SUPA_ANON, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || invite?.name || null,
          city: invite?.city || "Miami",
          role: "promoter",
          referral_source: `invite:${invite?.invite_code}`,
        }),
      });
      // Update invite status
      if (invite) {
        await fetch(`${SUPA_URL}/rest/v1/promoter_invites?invite_code=eq.${invite.invite_code}`, {
          method: "PATCH",
          headers: { apikey: SUPA_ANON, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ status: "signed_up", signed_up_at: new Date().toISOString() }),
        }).catch(() => {});
      }
      setSubmitted(true);
    } catch {
      // Still show success — the invite tracking is best-effort
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <>
        <style>{baseStyles}</style>
        <div style={page}>
          <div style={{ textAlign: "center", padding: "100px 24px" }}>
            <div style={{ fontSize: 32, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "white" }}>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <style>{baseStyles}</style>
        <div style={page}>
          <div style={{ textAlign: "center", padding: "100px 24px", maxWidth: 440, margin: "0 auto" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "white", marginBottom: 12 }}>
              Invite not found
            </div>
            <p style={{ color: "#888", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              This invite link may have expired or doesn't exist. If you're interested in promoting with Luma, reach out to us on Instagram.
            </p>
            <a href="/" style={{ color: gold, fontSize: 14, textDecoration: "none" }}>← Back to Luma</a>
          </div>
        </div>
      </>
    );
  }

  const firstName = invite?.name?.split(" ")[0] || invite?.name || "there";

  return (
    <>
      <style>{baseStyles}</style>
      <div style={page}>
        {/* Ambient glow */}
        <div style={{ position: "fixed", top: -120, right: -100, width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,.08), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px", position: "relative" }}>
          {/* Logo */}
          <div className="fade" style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: gold, letterSpacing: 4, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>
              Promoter Invite
            </div>
            <div style={{ fontSize: 36, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontStyle: "italic", color: "white" }}>
              Luma
            </div>
          </div>

          {!submitted ? (
            <>
              {/* Headline */}
              <div className="fade d1" style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "white", lineHeight: 1.2, marginBottom: 12 }}>
                  Hey {firstName}, you've been invited to join Luma.
                </h1>
                <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.7 }}>
                  Luma is a booking platform for VIP tables in {invite?.city || "Miami"} and NYC.
                  As a promoter, you get your own booking link — every table booked through it earns you
                  <span style={{ color: gold, fontWeight: 600 }}> 15% commission</span>, tracked automatically.
                </p>
              </div>

              {/* Benefits */}
              <div className="fade d2" style={{ marginBottom: 32 }}>
                {[
                  { icon: "🔗", title: "Personal booking link", desc: "Share it anywhere — IG bio, stories, DMs. Every click is tracked." },
                  { icon: "💰", title: "15% on every booking", desc: "Commission auto-calculated. No more chasing payments or screenshots." },
                  { icon: "📊", title: "Real-time dashboard", desc: "See clicks, conversions, guest list, and earnings in one place." },
                  { icon: "⚡", title: "60-second bookings", desc: "Guests see real pricing, pick a table, pay instantly. You get a notification." },
                ].map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>{b.icon}</div>
                    <div>
                      <div style={{ color: "white", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{b.title}</div>
                      <div style={{ color: "#888", fontSize: 12.5, lineHeight: 1.5 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Venues badge */}
              {invite?.venues && (
                <div className="fade d3" style={{ marginBottom: 32, padding: "14px 18px", background: "rgba(201,168,76,.06)",
                  borderRadius: 10, border: "1px solid rgba(201,168,76,.12)" }}>
                  <div style={{ fontSize: 10, color: gold, letterSpacing: 2, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                    Your Venues
                  </div>
                  <div style={{ color: "#ccc", fontSize: 13 }}>{invite.venues}</div>
                </div>
              )}

              {/* Form */}
              <div className="fade d4" style={{ marginBottom: 24 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
                <button
                  onClick={submit}
                  disabled={submitting || !email.includes("@")}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
                    background: email.includes("@") ? gold : "#333",
                    color: email.includes("@") ? "#0a0a0a" : "#666",
                    fontSize: 14, fontWeight: 700, cursor: email.includes("@") ? "pointer" : "default",
                    fontFamily: "'DM Sans',sans-serif", transition: "all .2s",
                  }}
                >
                  {submitting ? "Setting up..." : "Claim My Promoter Spot"}
                </button>
              </div>

              <div className="fade d5" style={{ textAlign: "center", fontSize: 11, color: "#555" }}>
                First 10 promoters get featured placement on the platform
              </div>
            </>
          ) : (
            /* Success state */
            <div className="fade" style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 28, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: "white", marginBottom: 12 }}>
                You're in, {firstName}.
              </h2>
              <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                We're setting up your promoter dashboard now.
                You'll get an email with your personal booking link and login details within 24 hours.
              </p>
              <div style={{ padding: "14px 18px", background: "rgba(201,168,76,.06)",
                borderRadius: 10, border: "1px solid rgba(201,168,76,.12)", marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: gold, letterSpacing: 2, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                  Your Invite Code
                </div>
                <div style={{ color: "white", fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
                  {invite?.invite_code}
                </div>
              </div>
              <p style={{ color: "#666", fontSize: 12 }}>
                Questions? DM <a href="https://instagram.com/20eric04" target="_blank" rel="noopener noreferrer" style={{ color: gold, textDecoration: "none" }}>@20eric04</a> on Instagram
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 60, paddingBottom: 24 }}>
            <span style={{ color: "#333", fontSize: 11 }}>lumarsv.com — your personal concierge</span>
          </div>
        </div>
      </div>
    </>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#08080c",
  fontFamily: "'DM Sans',sans-serif",
  color: "white",
  position: "relative",
  overflow: "hidden",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid #222",
  background: "#111",
  color: "white",
  fontSize: 14,
  fontFamily: "'DM Sans',sans-serif",
  marginBottom: 10,
  outline: "none",
  transition: "border-color .2s",
};

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #08080c; }
  ::selection { background: rgba(201,168,76,.3); color: white; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  .fade { animation: fadeUp .7s cubic-bezier(.16,1,.3,1) both; }
  .d1{animation-delay:.1s} .d2{animation-delay:.2s} .d3{animation-delay:.25s}
  .d4{animation-delay:.35s} .d5{animation-delay:.45s}
  input:focus { border-color: #c9a84c !important; }
  input::placeholder { color: #555; }
`;
