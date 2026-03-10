"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnlyc3JkaHNrdmRtbG5wc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njc0NDcsImV4cCI6MjA4ODM0MzQ0N30.o1CPKQP1qrvonHJFm7UESuFmgTa3z-BJqePMSVn7ZkI";
const gold = "#c9a84c";

// Scroll-reveal hook (inspired by 21st.dev scroll-animation components)
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: `opacity .7s cubic-bezier(.16,1,.3,1) ${delay}s, transform .7s cubic-bezier(.16,1,.3,1) ${delay}s` }}>
      {children}
    </div>
  );
}

// Animated number ticker (inspired by 21st.dev reuno-ui/animated-number)
function NumberTicker({ value, suffix = "", prefix = "", duration = 1.5 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * value);
      setDisplay(String(current));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, value, duration]);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// Typewriter component
function Typewriter({ words, speed = 80, deleteSpeed = 40, waitTime = 2000 }: { words: string[], speed?: number, deleteSpeed?: number, waitTime?: number }) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = words[wordIdx];
    const t = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) { setText(current.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
        else { setTimeout(() => setDeleting(true), waitTime); }
      } else {
        if (charIdx > 0) { setText(current.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
        else { setDeleting(false); setWordIdx(w => (w + 1) % words.length); }
      }
    }, deleting ? deleteSpeed : speed);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, deleteSpeed, waitTime]);
  return <>{text}<span style={{borderRight:"2px solid "+gold,marginLeft:2,animation:"blink 1s step-end infinite"}}>&nbsp;</span></>;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Miami");
  const [role, setRole] = useState("guest");
  const [status, setStatus] = useState("idle");
  const [refCode, setRefCode] = useState("");
  const [count, setCount] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) setRefCode(ref);
    }
    fetch(SUPA_URL + "/rest/v1/waitlist?select=id", { headers: { "apikey": SUPA_ANON } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setCount(d.length); }).catch(() => {});
  }, []);

  const submit = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const r = await fetch(SUPA_URL + "/rest/v1/waitlist", {
        method: "POST",
        headers: { "apikey": SUPA_ANON, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || null, city, role, referral_source: refCode || null }),
      });
      setStatus(r.ok ? "done" : "error");
    } catch { setStatus("error"); }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{background:#08080c;color:white;font-family:'DM Sans',sans-serif}
        ::selection{background:rgba(201,168,76,.3);color:white}
        input:focus{outline:none;border-color:${gold}!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes glow{0%,100%{opacity:.4}50%{opacity:.7}}
        @keyframes blink{from,to{border-color:${gold}}50%{border-color:transparent}}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmerBg{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .fade{opacity:0;animation:fadeUp .7s cubic-bezier(.16,1,.3,1) forwards}
        .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.3s}.d4{animation-delay:.4s}.d5{animation-delay:.5s}.d6{animation-delay:.6s}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
        .hover-lift{transition:transform .3s,box-shadow .3s}
        .hover-lift:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,.4)}
        @media(max-width:768px){.hero-grid{flex-direction:column!important;text-align:center}.features-grid{grid-template-columns:1fr!important}.venue-row{flex-direction:column!important}.mockup-wrap{display:none!important}.compare-grid{grid-template-columns:1.5fr 1fr 1fr 1fr!important;font-size:11px!important}}
      `}</style>

      <div className="grain"/>

      {/* Nav */}
      <nav className="fade" style={{position:"fixed",top:0,left:0,right:0,zIndex:90,padding:"16px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",backdropFilter:"blur(20px)",background:"rgba(8,8,12,.7)",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,fontStyle:"italic",color:gold}}>luma</div>
        <div style={{display:"flex",gap:24,alignItems:"center"}}>
          <a href="/blog" style={{fontSize:13,color:"rgba(255,255,255,.4)",textDecoration:"none",fontWeight:500}}>Blog</a>
          <a href="/app" style={{fontSize:13,color:"rgba(255,255,255,.4)",textDecoration:"none",fontWeight:500}}>App</a>
          <button onClick={scrollToForm} style={{padding:"8px 20px",background:gold,color:"#0a0a0a",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>Join Waitlist</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"120px 28px 80px",position:"relative",overflow:"hidden"}}>
        {/* Animated gradient orbs */}
        <div style={{position:"absolute",top:"10%",left:"20%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 70%)",pointerEvents:"none",animation:"glow 4s ease infinite",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",bottom:"10%",right:"15%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(109,40,217,.05) 0%,transparent 70%)",pointerEvents:"none",animation:"glow 5s ease infinite 1s",filter:"blur(50px)"}}/>
        <div style={{position:"absolute",top:"50%",left:"60%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,.04) 0%,transparent 70%)",pointerEvents:"none",animation:"glow 6s ease infinite 2s",filter:"blur(30px)"}}/>
        {/* Grid lines for depth */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)",backgroundSize:"60px 60px",pointerEvents:"none",maskImage:"radial-gradient(ellipse at center,black 30%,transparent 70%)"}}/>
        <div className="hero-grid" style={{maxWidth:1100,width:"100%",display:"flex",gap:60,alignItems:"center"}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="fade d1" style={{fontSize:12,color:gold,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",marginBottom:16}}>Miami & New York</div>
            <h1 className="fade d2" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(42px,6vw,72px)",fontWeight:700,lineHeight:1.1,marginBottom:20}}>
              Book <span style={{fontStyle:"italic",color:gold}}><Typewriter words={["VIP tables","bottle service","rooftops","pool parties","the best night out"]} speed={70} deleteSpeed={35} waitTime={1800}/></span><br/>in 60 seconds.
            </h1>
            <p className="fade d3" style={{fontSize:17,color:"rgba(255,255,255,.45)",lineHeight:1.75,marginBottom:32,maxWidth:440}}>
              Book bottle service, rooftops, and nightlife with real pricing. No DM negotiations. No surprises at the door.
            </p>
            <div className="fade d4" style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button onClick={scrollToForm} style={{padding:"14px 32px",background:`linear-gradient(90deg,${gold},#e8d48b,${gold})`,backgroundSize:"200% auto",animation:"shimmerBg 3s linear infinite",color:"#0a0a0a",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 8px 32px rgba(201,168,76,.3)",position:"relative",overflow:"hidden"}}>Join the Waitlist</button>
              <a href="/app" style={{padding:"14px 28px",background:"rgba(255,255,255,.05)",color:"white",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,fontSize:15,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6}}>Preview App</a>
            </div>
            {count>0&&<div className="fade d5" style={{marginTop:20,fontSize:12,color:"rgba(255,255,255,.25)"}}>{count} people on the waitlist</div>}
          </div>
          <div className="fade d4 mockup-wrap" style={{flexShrink:0,position:"relative"}}>
            <div style={{width:280,height:560,background:"#f5f4f0",borderRadius:36,boxShadow:"0 0 0 8px #1c1c1e,0 0 0 9px rgba(255,255,255,.06),0 40px 120px rgba(0,0,0,.6)",overflow:"hidden",position:"relative",animation:"float 6s ease infinite"}}>
              <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",width:90,height:26,background:"#000",borderRadius:16,zIndex:10}}/>
              {/* Static app preview */}
              <div style={{padding:"52px 18px 0",height:"100%",display:"flex",flexDirection:"column"}}>
                <div style={{fontSize:9,color:"rgba(0,0,0,.4)",fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>📍 Miami, FL</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontStyle:"italic",color:"#0a0a0a",marginBottom:12}}>Good evening, Eric</div>
                <div style={{height:130,borderRadius:14,background:"linear-gradient(135deg,#1e0533,#6d28d9)",position:"relative",marginBottom:14,overflow:"hidden"}}>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"10px 12px",background:"linear-gradient(to top,rgba(0,0,0,.7),transparent)"}}>
                    <div style={{fontSize:8,color:"rgba(255,255,255,.5)"}}>🔥 Featured Tonight</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,color:"white"}}>LIV</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2}}>
                      <span style={{fontSize:8,color:"rgba(255,255,255,.5)"}}>Miami Beach · 0.5 mi</span>
                      <span style={{background:"white",color:"#0a0a0a",padding:"3px 10px",borderRadius:12,fontSize:8,fontWeight:700}}>Reserve →</span>
                    </div>
                  </div>
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:700,color:"#0a0a0a",marginBottom:8}}>Hot Right Now</div>
                <div style={{display:"flex",gap:8}}>
                  {[{n:"LIV",c:"#6d28d9",p:"$250+"},{n:"E11EVEN",c:"#1d4ed8",p:"$200+"},{n:"Story",c:"#92400e",p:"$300+"}].map(v=>(
                    <div key={v.n} style={{width:80,borderRadius:10,overflow:"hidden",background:"white",border:"1px solid rgba(0,0,0,.06)",flexShrink:0}}>
                      <div style={{height:55,background:`linear-gradient(135deg,${v.c},${v.c}88)`,position:"relative"}}>
                        <div style={{position:"absolute",bottom:4,left:6}}><div style={{fontSize:8,fontWeight:700,color:"white"}}>{v.n}</div></div>
                      </div>
                      <div style={{padding:"4px 6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:7,color:"#999"}}>★★★★★</span>
                        <span style={{fontSize:8,fontWeight:700}}>{v.p}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,fontWeight:700,color:"#0a0a0a",marginTop:12,marginBottom:6}}>All Venues</div>
                {[{n:"Nikki Beach",t:"Pool Party",p:"$100+"},{n:"Club Space",t:"Nightclub",p:"$80+"}].map(v=>(
                  <div key={v.n} style={{display:"flex",gap:8,padding:"6px 8px",background:"white",border:"1px solid rgba(0,0,0,.06)",borderRadius:10,marginBottom:5}}>
                    <div style={{width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#1e3a5f,#0ea5e9)",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:700}}>{v.n}</div>
                      <div style={{fontSize:7,color:"#999"}}>{v.t} · {v.p}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Tab bar */}
              <div style={{position:"absolute",bottom:0,left:0,right:0,display:"flex",justifyContent:"space-around",padding:"8px 0 18px",background:"rgba(245,244,240,.97)",borderTop:"1px solid rgba(0,0,0,.06)"}}>
                {["🏠","🔍","🗺","👥","🎟","👤"].map((ic,i)=><span key={i} style={{fontSize:14,opacity:i===0?1:.35}}>{ic}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{padding:"80px 28px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <Reveal style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:12,color:gold,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>Why Luma</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700}}>Nightlife booking,<br/><span style={{fontStyle:"italic",color:gold}}>done right.</span></h2>
          </Reveal>
          <div className="features-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>
            {[
              ["💰","Transparent Pricing","See real prices upfront. No hidden fees, no surprise minimums, no DM negotiations."],
              ["✓","Verified Promoters","Every promoter is vetted. Real reviews, real track records, real commissions."],
              ["⚡","Instant Confirmation","Book in 60 seconds. Get a QR code confirmation immediately."],
              ["📱","One App, Everything","Browse venues, compare prices, book tables, manage reservations."],
              ["🎁","Rewards & Credits","$25 for every friend you refer. Promo codes. Loyalty credits."],
              ["🔒","Secure & Private","Server-side pricing. Tamper-proof bookings. Your data stays yours."],
            ].map(([ic,title,desc],i)=>(
              <div key={title as string} className={`hover-lift`} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:20,padding:"28px 24px"}}>
                <div style={{fontSize:28,marginBottom:14}}>{ic}</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>{title}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.4)",lineHeight:1.7}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infinite Venue Marquee */}
      <div style={{overflow:"hidden",borderTop:"1px solid rgba(255,255,255,.04)",borderBottom:"1px solid rgba(255,255,255,.04)",padding:"20px 0",position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:80,background:"linear-gradient(to right,#08080c,transparent)",zIndex:2}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,background:"linear-gradient(to left,#08080c,transparent)",zIndex:2}}/>
        <div style={{display:"flex",animation:"marquee 25s linear infinite",width:"max-content"}}>
          {[...Array(2)].map((_,rep)=>(
            <div key={rep} style={{display:"flex",gap:32,paddingRight:32}}>
              {["LIV","E11EVEN","Story","Club Space","Marquee","Tao Downtown","Nikki Beach","Delilah","PHD Rooftop","Avant Gardner","1 OAK","Fleur Room","Hyde Beach","Bâoli","Swan","Komodo"].map(n=>(
                <span key={n+rep} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,fontStyle:"italic",color:"rgba(255,255,255,.12)",whiteSpace:"nowrap",letterSpacing:".02em"}}>{n}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar — Animated Number Tickers (inspired by 21st.dev animated-number) */}
      <section style={{padding:"48px 28px",borderTop:"1px solid rgba(255,255,255,.04)",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:24}}>
          {[
            {v:29,s:"",p:"",label:"Venues",sub:"Miami & NYC"},
            {v:60,s:"s",p:"",label:"Booking Time",sub:"Average"},
            {v:15,s:"%",p:"",label:"Commission",sub:"For promoters"},
            {v:25,s:"",p:"$",label:"Referral Credit",sub:"Per friend"},
          ].map(({v,s,p,label,sub})=>(
            <div key={label} style={{textAlign:"center",minWidth:100}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,color:gold}}>
                <NumberTicker value={v} prefix={p} suffix={s} duration={1.8}/>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:"white",marginTop:2}}>{label}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.25)",marginTop:2}}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Venues */}
      <section style={{padding:"80px 28px",background:"rgba(255,255,255,.02)"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <Reveal style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:12,color:gold,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>29 Venues & Counting</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700}}>The best spots in<br/><span style={{fontStyle:"italic",color:gold}}>Miami & NYC.</span></h2>
          </Reveal>
          <div className="venue-row" style={{display:"flex",gap:16,marginBottom:16}}>
            {[
              {n:"LIV",c:"Miami Beach",p:"$250+",img:"https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=300&fit=crop"},
              {n:"E11EVEN",c:"Downtown Miami",p:"$200+",img:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop"},
              {n:"Marquee",c:"Chelsea NYC",p:"$200+",img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop"},
              {n:"Tao Downtown",c:"Chelsea NYC",p:"$250+",img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop"},
            ].map(v=>(
              <div key={v.n} className="hover-lift" style={{flex:1,borderRadius:18,overflow:"hidden",background:"#111",border:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{height:160,backgroundImage:`url(${v.img})`,backgroundSize:"cover",backgroundPosition:"center",position:"relative"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.8),transparent 50%)"}}/>
                  <div style={{position:"absolute",bottom:12,left:14}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700}}>{v.n}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>{v.c} · {v.p}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center"}}><a href="/app" style={{fontSize:13,color:gold,textDecoration:"none",fontWeight:600}}>Browse all 29 venues →</a></div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{padding:"80px 28px"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <Reveal style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700}}>Book in <span style={{fontStyle:"italic",color:gold}}>three steps.</span></h2>
          </Reveal>
          {[["01","Browse","Explore venues by city, type, and price. See reviews and availability."],["02","Book","Pick your table, date, and party size. Apply a promo code. Pay securely."],["03","Show up","Get your QR confirmation. Show it at the door. Enjoy your night."]].map(([num,title,desc])=>(
            <div key={num} style={{display:"flex",gap:24,marginBottom:32,alignItems:"flex-start"}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:700,color:gold,lineHeight:1,flexShrink:0,width:60}}>{num}</div>
              <div><div style={{fontSize:18,fontWeight:700,marginBottom:6}}>{title}</div><div style={{fontSize:14,color:"rgba(255,255,255,.4)",lineHeight:1.7}}>{desc}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* Promoters */}
      <section style={{padding:"60px 28px 80px",background:"rgba(201,168,76,.03)",borderTop:"1px solid rgba(201,168,76,.08)",borderBottom:"1px solid rgba(201,168,76,.08)"}}>
        <div style={{maxWidth:700,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:12}}>💎</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,marginBottom:12}}>Are you a <span style={{fontStyle:"italic",color:gold}}>promoter?</span></h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,.4)",lineHeight:1.7,maxWidth:500,margin:"0 auto 24px"}}>Earn 15% commission on every booking. Dashboard, invite links, QR codes, analytics, same-day Stripe payouts.</p>
          <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",marginBottom:24}}>
            {[["$2,400/mo","Avg earnings"],["15%","Commission"],["Same-day","Payouts"]].map(([v,l])=>(
              <div key={l} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,padding:"16px 24px"}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:gold}}>{v}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Marquee (inspired by 21st.dev serafimcloud/testimonials-with-marquee) */}
      <section style={{padding:"80px 0",overflow:"hidden",position:"relative"}}>
        <Reveal style={{textAlign:"center",marginBottom:48,padding:"0 28px"}}>
          <div style={{fontSize:12,color:gold,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>What People Say</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700}}>Built for the <span style={{fontStyle:"italic",color:gold}}>culture.</span></h2>
        </Reveal>
        {/* Row 1 — scrolls left */}
        <div style={{overflow:"hidden",position:"relative",marginBottom:16}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:100,background:"linear-gradient(to right,#08080c,transparent)",zIndex:2}}/>
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:100,background:"linear-gradient(to left,#08080c,transparent)",zIndex:2}}/>
          <div style={{display:"flex",animation:"marquee 35s linear infinite",width:"max-content"}}>
            {[...Array(2)].map((_,rep)=>(
              <div key={rep} style={{display:"flex",gap:16,paddingRight:16}}>
                {[
                  {q:"Finally an app that shows real prices. No more DMing 5 different promoters for quotes.",n:"Sophia R.",c:"Miami Beach",r:"Guest"},
                  {q:"Booked a table at Marquee in 60 seconds. Got my QR code instantly. This is how it should work.",n:"Tyler W.",c:"New York",r:"Guest"},
                  {q:"I made $3,200 last month just from my invite links. The dashboard makes it easy to track everything.",n:"Nate S.",c:"Miami",r:"Promoter"},
                  {q:"My group used to waste hours figuring out bottle service. Luma cut that to literally one minute.",n:"Jade L.",c:"Miami",r:"Guest"},
                  {q:"The promo codes actually work and the prices match what you see. No hidden anything.",n:"Marcus D.",c:"New York",r:"Guest"},
                  {q:"Being able to compare venues side by side changed how I plan nights out.",n:"Priya K.",c:"Chelsea",r:"Guest"},
                ].map(t=>(
                  <div key={t.n+rep} style={{width:340,flexShrink:0,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,padding:"24px 22px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    <div style={{fontSize:14,color:"rgba(255,255,255,.55)",lineHeight:1.7,fontStyle:"italic",marginBottom:16}}>&ldquo;{t.q}&rdquo;</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${gold}33,${gold}11)`,border:`1px solid ${gold}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:gold}}>{t.n[0]}</div>
                      <div><div style={{fontSize:13,fontWeight:600}}>{t.n}</div><div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{t.c} · {t.r}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Row 2 — scrolls right (reverse) */}
        <div style={{overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:100,background:"linear-gradient(to right,#08080c,transparent)",zIndex:2}}/>
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:100,background:"linear-gradient(to left,#08080c,transparent)",zIndex:2}}/>
          <div style={{display:"flex",animation:"marquee 40s linear infinite reverse",width:"max-content"}}>
            {[...Array(2)].map((_,rep)=>(
              <div key={rep} style={{display:"flex",gap:16,paddingRight:16}}>
                {[
                  {q:"I switched from calling venues directly. Luma saves me at least an hour every weekend.",n:"Alex M.",c:"Brickell",r:"Guest"},
                  {q:"My clients love getting their QR code right away. Makes me look professional.",n:"Gabriella N.",c:"South Beach",r:"Promoter"},
                  {q:"The referral credits are real. Got $75 back just from telling three friends.",n:"Chris T.",c:"Lower East Side",r:"Guest"},
                  {q:"Pool parties, rooftops, nightclubs — everything in one app instead of 6 different group chats.",n:"Alana V.",c:"Miami",r:"Guest"},
                  {q:"Transparent pricing is a game-changer. I know exactly what I'm paying before I commit.",n:"Devon R.",c:"Meatpacking",r:"Guest"},
                  {q:"The analytics dashboard helped me double my bookings in two weeks.",n:"Jordan P.",c:"Miami",r:"Promoter"},
                ].map(t=>(
                  <div key={t.n+rep} style={{width:340,flexShrink:0,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:20,padding:"24px 22px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    <div style={{fontSize:14,color:"rgba(255,255,255,.55)",lineHeight:1.7,fontStyle:"italic",marginBottom:16}}>&ldquo;{t.q}&rdquo;</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${gold}33,${gold}11)`,border:`1px solid ${gold}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:gold}}>{t.n[0]}</div>
                      <div><div style={{fontSize:13,fontWeight:600}}>{t.n}</div><div style={{fontSize:10,color:"rgba(255,255,255,.3)"}}>{t.c} · {t.r}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{padding:"80px 28px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <Reveal style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:12,color:gold,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>Why Switch</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700}}>Luma vs the <span style={{fontStyle:"italic",color:gold}}>old way.</span></h2>
          </Reveal>
          <div style={{borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,.08)"}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",background:"rgba(255,255,255,.04)"}}>
              <div style={{padding:"14px 20px",fontSize:11,fontWeight:700,color:"rgba(255,255,255,.3)"}}></div>
              <div style={{padding:"14px 16px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,.06)"}}><div style={{fontSize:13,fontWeight:700,color:gold}}>Luma</div></div>
              <div style={{padding:"14px 16px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,.06)"}}><div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.4)"}}>DM a Promoter</div></div>
              <div style={{padding:"14px 16px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,.06)"}}><div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.4)"}}>Walk Up</div></div>
            </div>
            {[
              ["See real prices upfront","✓","✗","✗"],
              ["Book in under 60 seconds","✓","✗","✗"],
              ["Instant QR confirmation","✓","✗","✗"],
              ["Verified promoters","✓","?","—"],
              ["No surprise fees at door","✓","✗","✗"],
              ["Cancel up to 48hrs free","✓","Depends","✗"],
              ["Compare venues & prices","✓","✗","✗"],
              ["Earn referral credits","✓","✗","✗"],
            ].map(([feat,luma,dm,walk],i)=>(
              <div key={feat} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",borderTop:"1px solid rgba(255,255,255,.06)",background:i%2===0?"transparent":"rgba(255,255,255,.015)"}}>
                <div style={{padding:"12px 20px",fontSize:13,color:"rgba(255,255,255,.6)"}}>{feat}</div>
                <div style={{padding:"12px 16px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,.06)",fontSize:14,color:luma==="✓"?"#4ade80":"rgba(255,255,255,.3)"}}>{luma}</div>
                <div style={{padding:"12px 16px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,.06)",fontSize:14,color:dm==="✗"?"#f87171":dm==="?"?"#fbbf24":"rgba(255,255,255,.3)"}}>{dm}</div>
                <div style={{padding:"12px 16px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,.06)",fontSize:14,color:walk==="✗"?"#f87171":"rgba(255,255,255,.3)"}}>{walk}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:"60px 28px 80px",background:"rgba(255,255,255,.02)"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <Reveal style={{textAlign:"center",marginBottom:48}}>
            <div style={{fontSize:12,color:gold,fontWeight:700,letterSpacing:".15em",textTransform:"uppercase",marginBottom:12}}>FAQ</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700}}>Questions? <span style={{fontStyle:"italic",color:gold}}>Answered.</span></h2>
          </Reveal>
          {[
            ["How does Luma work?","Browse venues in Miami & NYC, pick a table, select your date and party size, and book instantly. You get a QR confirmation code to show at the door. No DMs, no callbacks, no surprises."],
            ["How much does it cost?","Luma is free to use for guests. Prices shown are the venue's table minimum. We charge a 10% platform fee included in the total. No hidden charges."],
            ["What if I need to cancel?","Free cancellation up to 48 hours before your event. After that, cancellation policies vary by venue. Refunds process within 5-7 business days."],
            ["How do promoters earn money?","Promoters earn 15% commission on every booking made through their invite link. Same-day Stripe payouts. No caps, no catches."],
            ["Which cities are available?","We're launching in Miami and New York City with 29 venues across both cities. More cities coming soon."],
            ["Is my payment secure?","Yes. Payments are processed through Stripe. We never see or store your credit card details. All pricing is calculated server-side to prevent tampering."],
          ].map(([q,a])=>(
            <details key={q} style={{marginBottom:12,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:16,overflow:"hidden"}}>
              <summary style={{padding:"18px 22px",fontSize:15,fontWeight:600,color:"white",cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {q}<span style={{color:gold,fontSize:18,flexShrink:0,marginLeft:12}}>+</span>
              </summary>
              <div style={{padding:"0 22px 18px",fontSize:13,color:"rgba(255,255,255,.45)",lineHeight:1.8}}>{a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Waitlist Form */}
      <section ref={formRef} id="waitlist" style={{padding:"80px 28px",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:440,margin:"0 auto",textAlign:"center",position:"relative"}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700,marginBottom:8}}>Get <span style={{fontStyle:"italic",color:gold}}>early access.</span></h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,.4)",lineHeight:1.7,marginBottom:32}}>Priority access, exclusive promos, and $25 off your first booking.</p>
          {refCode&&<div style={{background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.15)",borderRadius:14,padding:"12px 16px",marginBottom:20}}><div style={{fontSize:12,fontWeight:700,color:gold}}>🎁 You were referred! $25 off for both of you</div></div>}
          {status==="done"?(
            <div style={{background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.2)",borderRadius:20,padding:"32px 24px"}}>
              <div style={{fontSize:36,marginBottom:12}}>✨</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:8}}>You&apos;re on the list.</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.4)",lineHeight:1.7}}>We&apos;ll email you when Luma launches in {city}.</div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:20}}>
                <a href="/app" style={{padding:"10px 22px",background:gold,color:"#0a0a0a",textDecoration:"none",borderRadius:12,fontSize:12,fontWeight:700}}>Preview App</a>
                <a href="https://instagram.com/luma.rsv" style={{padding:"10px 22px",background:"rgba(255,255,255,.06)",color:"white",textDecoration:"none",borderRadius:12,fontSize:12,fontWeight:600,border:"1px solid rgba(255,255,255,.08)"}}>Instagram</a>
              </div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{padding:"14px 18px",background:"rgba(255,255,255,.04)",border:"1.5px solid rgba(255,255,255,.08)",borderRadius:14,color:"white",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" onKeyDown={e=>e.key==="Enter"&&submit()} style={{padding:"14px 18px",background:"rgba(255,255,255,.04)",border:"1.5px solid rgba(255,255,255,.08)",borderRadius:14,color:"white",fontSize:14,fontFamily:"'DM Sans',sans-serif"}}/>
              <div style={{display:"flex",gap:8}}>
                {["Miami","New York"].map(c=><button key={c} onClick={()=>setCity(c)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",background:city===c?gold:"rgba(255,255,255,.04)",borderColor:city===c?gold:"rgba(255,255,255,.08)",color:city===c?"#0a0a0a":"rgba(255,255,255,.4)"}}>{c==="Miami"?"🌴 ":"🗽 "}{c}</button>)}
              </div>
              <div style={{display:"flex",gap:8}}>
                {[["guest","I want to book"],["promoter","I'm a promoter"]].map(([r,l])=><button key={r} onClick={()=>setRole(r as string)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid",fontSize:12,fontWeight:600,cursor:"pointer",background:role===r?"rgba(255,255,255,.1)":"rgba(255,255,255,.03)",borderColor:role===r?"rgba(255,255,255,.2)":"rgba(255,255,255,.06)",color:role===r?"white":"rgba(255,255,255,.35)"}}>{l}</button>)}
              </div>
              <button onClick={submit} disabled={status==="loading"} style={{padding:"16px",background:gold,color:"#0a0a0a",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:status==="loading"?"not-allowed":"pointer",opacity:status==="loading"?.6:1,boxShadow:"0 8px 32px rgba(201,168,76,.25)"}}>{status==="loading"?"Joining...":"Join the Waitlist"}</button>
              {status==="error"&&<div style={{fontSize:12,color:"#ef4444"}}>Something went wrong. Try again.</div>}
            </div>
          )}
        </div>
      </section>

      <footer style={{padding:"32px 28px",borderTop:"1px solid rgba(255,255,255,.04)"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,fontStyle:"italic",color:gold,marginBottom:4}}>luma</div><div style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>© 2026 Luma · lumarsv.com</div></div>
          <div style={{display:"flex",gap:20}}>{[["Blog","/blog"],["App","/app"],["Terms","/terms"],["Privacy","/privacy"]].map(([l,h])=><a key={l} href={h as string} style={{fontSize:12,color:"rgba(255,255,255,.2)",textDecoration:"none"}}>{l}</a>)}</div>
          <div style={{display:"flex",gap:12}}><a href="https://instagram.com/luma.rsv" style={{fontSize:12,color:"rgba(255,255,255,.2)",textDecoration:"none"}}>Instagram</a><a href="https://tiktok.com/@luma.rsv" style={{fontSize:12,color:"rgba(255,255,255,.2)",textDecoration:"none"}}>TikTok</a></div>
        </div>
      </footer>
    </>
  );
}
