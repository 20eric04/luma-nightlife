'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const gold = "#c9a84c";

export default function PromoterPage() {
  const params = useParams();
  const handle = params?.handle as string;
  const [promoter, setPromoter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!handle) return;
    // Try to find promoter by referral_code or name slug
    fetch(SUPA_URL + "/rest/v1/profiles?or=(referral_code.ilike." + handle + ",name.ilike.*" + handle + "*)&role=eq.promoter&limit=1", {
      headers: { "apikey": SUPA_ANON }
    }).then(r => r.json()).then((d: any[]) => {
      if (d?.length) setPromoter(d[0]);
      else setNotFound(true);
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
    
    // Track click
    fetch(SUPA_URL + "/rest/v1/link_clicks", {
      method: "POST",
      headers: { "apikey": SUPA_ANON, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ slug: handle, referrer: typeof document !== 'undefined' ? document.referrer : null })
    }).catch(() => {});
  }, [handle]);

  return (
    <div style={{minHeight:"100vh",background:"#08080c",fontFamily:"'DM Sans',sans-serif",color:"white",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');`}</style>
      
      <div style={{width:"100%",maxWidth:480,padding:"40px 24px"}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <a href="/" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,fontStyle:"italic",color:gold,textDecoration:"none"}}>luma</a>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"60px 0",color:"rgba(255,255,255,.3)",fontSize:13}}>Loading...</div>
        ) : notFound ? (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>🔍</div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",marginBottom:8}}>Promoter not found</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:24}}>This link may be expired or incorrect.</div>
            <a href="/app" style={{display:"inline-block",padding:"12px 28px",background:gold,color:"#0a0a0a",textDecoration:"none",borderRadius:12,fontSize:13,fontWeight:700}}>Browse Venues →</a>
          </div>
        ) : (
          <>
            {/* Promoter card */}
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:"28px 24px",textAlign:"center",marginBottom:24}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(201,168,76,.15)",border:"3px solid "+gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,color:gold,margin:"0 auto 14px",fontFamily:"'Cormorant Garamond',serif"}}>{(promoter.name||"P")[0]}</div>
              <div style={{fontSize:22,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",marginBottom:4}}>{promoter.name || "Promoter"}</div>
              <div style={{fontSize:12,color:gold}}>@{handle}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.35)",marginTop:8,lineHeight:1.6}}>{promoter.city || "Miami"} · Verified Promoter</div>
              
              {/* Trust badges */}
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>
                {["✓ Verified","⭐ Top Rated","🔒 Secure Booking"].map(b=>
                  <span key={b} style={{padding:"4px 12px",background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.12)",borderRadius:14,fontSize:10,color:gold,fontWeight:600}}>{b}</span>
                )}
              </div>
            </div>

            {/* Value prop */}
            <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.12)",borderRadius:16,padding:"18px 20px",marginBottom:24}}>
              <div style={{fontSize:14,fontWeight:700,color:"white",marginBottom:8}}>Book through {(promoter.name||"this promoter").split(" ")[0]} and get:</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.5)",lineHeight:2}}>
                🎟 Priority entry — skip the line<br/>
                💰 Exclusive pricing — better than walk-up<br/>
                📱 Instant confirmation with QR code<br/>
                🍾 Direct concierge service all night
              </div>
            </div>

            {/* CTA buttons */}
            <a href="/app" style={{display:"block",width:"100%",padding:"16px",background:gold,color:"#0a0a0a",textDecoration:"none",borderRadius:16,fontSize:15,fontWeight:700,textAlign:"center",marginBottom:10,boxShadow:"0 8px 28px rgba(201,168,76,.35)"}}>
              Browse Venues & Book →
            </a>
            <a href={"/?ref="+handle} style={{display:"block",width:"100%",padding:"14px",background:"rgba(255,255,255,.04)",color:"white",textDecoration:"none",borderRadius:14,fontSize:13,fontWeight:600,textAlign:"center",border:"1px solid rgba(255,255,255,.08)"}}>
              Join the Waitlist — Get $25 Off
            </a>

            {/* How it works */}
            <div style={{marginTop:32}}>
              <div style={{fontSize:16,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",marginBottom:16,textAlign:"center"}}>How Luma works</div>
              {[["1","Browse venues in Miami & NYC","Real prices, no DM negotiations"],["2","Pick your table, date & party size","Instant availability"],["3","Get your confirmation code","QR code for the door"],["4","Show up and enjoy the night","Your promoter handles everything"]].map(([num,title,sub])=>(
                <div key={num} style={{display:"flex",gap:14,marginBottom:14,alignItems:"flex-start"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(201,168,76,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:gold,flexShrink:0}}>{num}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"white"}}>{title}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:2}}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid rgba(255,255,255,.06)",textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>© 2026 Luma · lumarsv.com</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
