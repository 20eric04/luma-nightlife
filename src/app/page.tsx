"use client";
import { useState, useEffect } from "react";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnlyc3JkaHNrdmRtbG5wc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njc0NDcsImV4cCI6MjA4ODM0MzQ0N30.o1CPKQP1qrvonHJFm7UESuFmgTa3z-BJqePMSVn7ZkI";

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Miami");
  const [role, setRole] = useState("guest");
  const [status, setStatus] = useState("idle");
  const [refCode, setRefCode] = useState("");

  // Read ?ref= from URL for referral tracking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) setRefCode(ref);
    }
  }, []);

  const submit = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const r = await fetch(SUPA_URL + "/rest/v1/waitlist", {
        method: "POST",
        headers: { "apikey": SUPA_ANON, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || null, city, role, referral_source: refCode || null })
      });
      if (r.ok || r.status === 201) setStatus("done");
      else if (r.status === 409) setStatus("exists");
      else setStatus("error");
    } catch (e) { setStatus("error"); }
  };

  const gold = "#c9a84c";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #08080c; }
        ::selection { background: rgba(201,168,76,.3); color: white; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        input:focus { outline:none; border-color: ${gold} !important; }
        .fade { animation: fadeUp .7s cubic-bezier(.16,1,.3,1) both; }
        .d1{animation-delay:.1s} .d2{animation-delay:.2s} .d3{animation-delay:.3s}
        .d4{animation-delay:.4s} .d5{animation-delay:.5s} .d6{animation-delay:.6s}
      `}</style>
      <div style={{ minHeight:"100vh", background:"#08080c", fontFamily:"'DM Sans',sans-serif",
        color:"white", display:"flex", flexDirection:"column", alignItems:"center",
        position:"relative", overflow:"hidden" }}>
        {/* Ambient glow */}
        <div style={{ position:"fixed", top:-100, right:-80, width:400, height:400, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(201,168,76,.06), transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"fixed", bottom:-100, left:-60, width:350, height:350, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(201,168,76,.04), transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:480, padding:"60px 28px 40px" }}>
          {/* Logo */}
          <div className="fade d1" style={{ marginBottom:48 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:700,
              fontStyle:"italic", color:gold, letterSpacing:"-.02em" }}>luma</div>
            <div style={{ width:40, height:2, background:gold, marginTop:8, borderRadius:2 }}/>
          </div>
          {status==="done"||status==="exists" ? (
            <div className="fade" style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ fontSize:48, marginBottom:16, animation:"float 3s ease infinite" }}>
                {status==="done"?"✨":"👋"}
              </div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700,
                fontStyle:"italic", marginBottom:8 }}>
                {status==="done"?"You're on the list.":"You're already in."}
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,.45)", lineHeight:1.7, marginBottom:28 }}>
                {status==="done"
                  ? "We'll let you know the moment Luma opens in "+city+". Early access members get first pick."
                  : "We already have your email — you'll hear from us soon."}
              </div>
              <div style={{ padding:"16px 20px", background:"rgba(201,168,76,.06)", border:"1px solid rgba(201,168,76,.15)",
                borderRadius:16, marginBottom:24 }}>
                <div style={{ fontSize:11, color:gold, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>While you wait</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>
                  Follow @luma.rsv on Instagram & TikTok for nightlife content and behind-the-scenes.
                </div>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                {[["https://instagram.com/luma.rsv","Instagram"],["https://tiktok.com/@luma.rsv","TikTok"]].map(([url,l])=>(
                  <a key={l} href={url} target="_blank" rel="noopener"
                    style={{ padding:"10px 20px", background:"rgba(255,255,255,.06)",
                      border:"1px solid rgba(255,255,255,.1)", borderRadius:12,
                      fontSize:13, fontWeight:600, color:"white", textDecoration:"none" }}>{l}</a>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="fade d2" style={{ marginBottom:32 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:700,
                  fontStyle:"italic", lineHeight:1.15, marginBottom:12 }}>
                  VIP tables in<br/>60 seconds.
                </div>
                <div style={{ fontSize:15, color:"rgba(255,255,255,.45)", lineHeight:1.7 }}>
                  Luma is the new way to book bottle service, rooftops, and nightlife in Miami & NYC. Real pricing. Verified promoters. No DM negotiations.
                </div>
              </div>
              <div className="fade d3" style={{ display:"flex", gap:10, marginBottom:32, flexWrap:"wrap" }}>
                {["Transparent pricing","15% promoter commission","Instant confirmation","Guest check-in"].map(f=>(
                  <div key={f} style={{ padding:"6px 14px", background:"rgba(201,168,76,.06)",
                    border:"1px solid rgba(201,168,76,.12)", borderRadius:20, fontSize:11, color:gold, fontWeight:600 }}>{f}</div>
                ))}
              </div>
              {refCode&&<div className="fade d3" style={{background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.15)",borderRadius:14,padding:"12px 16px",marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#c9a84c"}}>🎁 You were referred!</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginTop:4}}>You and your friend each get $25 off your first booking</div>
              </div>}
              <div className="fade d4" style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"
                  style={{ padding:"14px 16px", background:"rgba(255,255,255,.04)",
                    border:"1.5px solid rgba(255,255,255,.08)", borderRadius:14,
                    color:"white", fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"border-color .2s" }}/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="Email address" onKeyDown={e=>e.key==="Enter"&&submit()}
                  style={{ padding:"14px 16px", background:"rgba(255,255,255,.04)",
                    border:"1.5px solid rgba(255,255,255,.08)", borderRadius:14,
                    color:"white", fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"border-color .2s" }}/>
              </div>
              <div className="fade d4" style={{ display:"flex", gap:8, marginBottom:12 }}>
                {["Miami","New York"].map(c=>(
                  <button key={c} onClick={()=>setCity(c)}
                    style={{ flex:1, padding:"10px", borderRadius:12, border:"1.5px solid",
                      fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                      background:city===c?gold:"rgba(255,255,255,.04)",
                      borderColor:city===c?gold:"rgba(255,255,255,.08)",
                      color:city===c?"#0a0a0a":"rgba(255,255,255,.4)", transition:"all .2s" }}>
                    {c==="Miami"?"🌴 ":"🗽 "}{c}
                  </button>
                ))}
              </div>
              <div className="fade d4" style={{ display:"flex", gap:8, marginBottom:20 }}>
                {[["guest","I want to book"],["promoter","I'm a promoter"]].map(([r,l])=>(
                  <button key={r} onClick={()=>setRole(r)}
                    style={{ flex:1, padding:"10px", borderRadius:12, border:"1.5px solid",
                      fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", cursor:"pointer",
                      background:role===r?"rgba(255,255,255,.1)":"rgba(255,255,255,.03)",
                      borderColor:role===r?"rgba(255,255,255,.2)":"rgba(255,255,255,.06)",
                      color:role===r?"white":"rgba(255,255,255,.3)", transition:"all .2s" }}>{l}</button>
                ))}
              </div>
              <button className="fade d5" onClick={submit} disabled={status==="loading"||!email.includes("@")}
                style={{ width:"100%", padding:"16px", borderRadius:16, border:"none",
                  fontSize:15, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
                  cursor:email.includes("@")?"pointer":"default",
                  background:email.includes("@")?gold:"rgba(255,255,255,.06)",
                  color:email.includes("@")?"#0a0a0a":"rgba(255,255,255,.2)",
                  transition:"all .25s",
                  boxShadow:email.includes("@")?"0 8px 32px rgba(201,168,76,.25)":"none" }}>
                {status==="loading"?"Joining...":"Join the waitlist"}
              </button>
              {status==="error"&&<div style={{ marginTop:10, fontSize:12, color:"#ef4444", textAlign:"center" }}>Something went wrong — try again.</div>}
              <div className="fade d6" style={{ marginTop:24, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.2)" }}>15 venues . 7 promo codes . Launching soon</div>
              </div>
            </>
          )}
          <div style={{ marginTop:60, paddingTop:20, borderTop:"1px solid rgba(255,255,255,.04)",
            display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,.15)" }}>© 2026 Luma · lumarsv.com</span>
            <div style={{ display:"flex", gap:12 }}>
              <a href="/blog" style={{ fontSize:10, color:"rgba(255,255,255,.15)", textDecoration:"none" }}>Blog</a>
              <a href="/terms" style={{ fontSize:10, color:"rgba(255,255,255,.15)", textDecoration:"none" }}>Terms</a>
              <a href="/privacy" style={{ fontSize:10, color:"rgba(255,255,255,.15)", textDecoration:"none" }}>Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
