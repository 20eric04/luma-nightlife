import { useState, useEffect, useRef } from "react";

// -----------------------------------------------
// Supabase config - no SDK, plain fetch
// -----------------------------------------------
const SUPA_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const EDGE_URL  = SUPA_URL + "/functions/v1";

// Session store - persisted in localStorage
let _session = null;
function getSession() { return _session; }
function _setSession(s) {
  _session = s;
  try {
    if (s) localStorage.setItem("luma_sess", JSON.stringify(s));
    else   localStorage.removeItem("luma_sess");
  } catch(e) {}
}
// Restore on load
try { const r = localStorage.getItem("luma_sess"); if (r) _session = JSON.parse(r); } catch(_e) {}

// Token refresh helper — Supabase JWTs expire in ~1h
async function refreshSession() {
  const s = getSession();
  if (!s?.refresh_token) return null;
  try {
    const r = await fetch(SUPA_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "apikey": SUPA_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const d = await r.json();
    if (d.access_token) { _setSession(d); return d; }
    return null;
  } catch { return null; }
}

// Check if token is expired (with 60s buffer)
function isTokenExpired() {
  const s = getSession();
  if (!s?.expires_at) return true;
  return Date.now() / 1000 > s.expires_at - 60;
}

// Get a valid session, refreshing if needed
async function getValidSession() {
  const s = getSession();
  if (!s?.access_token) return null;
  if (!isTokenExpired()) return s;
  const refreshed = await refreshSession();
  return refreshed || null;
}

// Auth helpers
async function supaSignUp(email, password, name) {
  const r = await fetch(SUPA_URL + "/auth/v1/signup", {
    method: "POST",
    headers: { "apikey": SUPA_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, options: { data: { name } } }),
  });
  return r.json();
}
async function supaSignIn(email, password) {
  const r = await fetch(SUPA_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "apikey": SUPA_ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (d.access_token) _setSession(d);
  return d;
}
async function supaSignOut() {
  if (_session?.access_token) {
    await fetch(SUPA_URL + "/auth/v1/logout", {
      method: "POST",
      headers: { "apikey": SUPA_ANON, "Authorization": "Bearer " + _session.access_token },
    }).catch(() => {});
  }
  _setSession(null);
}

// Call an Edge Function with auth (auto-refreshes expired tokens)
async function edgeCall(fn, body) {
  const sess = await getValidSession() || getSession();
  const r = await fetch(EDGE_URL + "/" + fn, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPA_ANON,
      "Authorization": "Bearer " + (sess?.access_token || SUPA_ANON),
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`;

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f5f4f0;--white:#fff;--ink:#0a0a0a;--ink2:#3a3a3a;--sub:#7a7a7a;--dim:#c0c0c0;
  --line:rgba(0,0,0,.07);--line2:rgba(0,0,0,.13);
  --gold:#c9a84c;--goldbg:rgba(201,168,76,.12);
  --pro:#12121e;--pro2:#1a1a2e;
  --fd:'Cormorant Garamond',serif;--fb:'DM Sans',sans-serif;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{transform:scale(.92) translateY(18px);opacity:0}65%{transform:scale(1.02) translateY(-2px)}100%{transform:scale(1) translateY(0);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:translateX(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
.su{animation:slideUp .38s cubic-bezier(.16,1,.3,1) both}
.sd{animation:slideDown .3s cubic-bezier(.16,1,.3,1) both}
.sr{animation:slideRight .3s cubic-bezier(.16,1,.3,1) both}
.sc{animation:scaleIn .28s cubic-bezier(.16,1,.3,1) both}
.fu{animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both}
.fu1{animation-delay:.07s}.fu2{animation-delay:.14s}.fu3{animation-delay:.21s}
.fi{animation:fadeIn .25s ease both}
.scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;min-height:0;flex:1}
.scroll::-webkit-scrollbar{display:none}
.press{transition:transform .1s,opacity .1s;cursor:pointer;-webkit-tap-highlight-color:transparent}
.press:active{transform:scale(.97);opacity:.8}
.skel{background:linear-gradient(90deg,#e8e6e1 25%,#f0ede8 50%,#e8e6e1 75%);background-size:400px 100%;animation:shimmer 1.4s infinite linear}
.tabbar{display:flex;border-top:1px solid var(--line);padding:9px 0 12px;flex-shrink:0}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:3px 0}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.4)}50%{box-shadow:0 0 0 8px rgba(59,130,246,.0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.luma-pin{background:#0a0a0a;color:white;border:2px solid white;border-radius:9px;padding:4px 9px;font-size:10px;font-weight:700;font-family:'DM Sans',sans-serif;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,.3);cursor:pointer;transition:all .15s;line-height:1}
.luma-pin.active{background:white;color:#0a0a0a;border-color:#0a0a0a}
.luma-dot{width:5px;height:5px;background:#0a0a0a;border-radius:50%;margin:0 auto;box-shadow:0 1px 4px rgba(0,0,0,.3)}

`;

// ----------------------------------------------- Data -----------------------------------------------------
const VENUES = [
  // ----------------------------------------------- Miami --
  {id:1,metro:"Miami",name:"Noir Rooftop",type:"Rooftop",city:"South Beach",price:120,rating:4.9,reviews:312,distance:"0.4 mi",tags:["VIP","Bottle Service"],hot:true,lat:25.7825,lng:-80.1340,
   img:"https://picsum.photos/id/1039/700/462",
   about:"Perched above Miami, Noir delivers 360° ocean views and curated bottle service."},
  {id:2,metro:"Miami",name:"Velvet Underground",type:"Nightclub",city:"Wynwood",price:85,rating:4.7,reviews:528,distance:"1.2 mi",tags:["DJ Nights","Booths"],lat:25.8005,lng:-80.1995,
   img:"https://picsum.photos/id/316/700/462",
   about:"Wynwood's underground institution. Concrete walls, world-class DJs."},
  {id:3,metro:"Miami",name:"Azure Terrace",type:"Lounge",city:"Brickell",price:95,rating:4.8,reviews:189,distance:"0.9 mi",tags:["Cocktails","Views"],hot:true,lat:25.7590,lng:-80.1920,
   img:"https://picsum.photos/id/26/700/462",
   about:"Miami's most sophisticated lounge - velvet booths and views that stop conversations."},
  {id:4,metro:"Miami",name:"Obsidian Club",type:"Nightclub",city:"Downtown",price:75,rating:4.6,reviews:401,distance:"2.1 mi",tags:["Live Music","VIP"],lat:25.7751,lng:-80.1950,
   img:"https://picsum.photos/id/371/700/462",
   about:"Raw industrial energy meets luxury hospitality. Every night is different."},
  {id:5,metro:"Miami",name:"Soleil Pool Club",type:"Pool Party",city:"South Beach",price:150,rating:4.9,reviews:267,distance:"3.0 mi",tags:["Dayclub","Bottles"],hot:true,lat:25.7680,lng:-80.1300,
   img:"https://picsum.photos/id/429/700/462",
   about:"Miami's premier dayclub. Reserve early - this one sells out."},
  // ----------------------------------------------- New York --
  {id:6,metro:"New York",name:"1 OAK",type:"Nightclub",city:"Chelsea",price:110,rating:4.8,reviews:891,distance:"0.3 mi",tags:["Celebrity","Bottle Service"],hot:true,lat:40.7430,lng:-74.0045,
   img:"https://picsum.photos/id/355/700/462",
   about:"NYC's most storied nightclub. Celebrity-filled, electric energy every weekend."},
  {id:7,metro:"New York",name:"Skylark",type:"Rooftop",city:"Midtown",price:95,rating:4.7,reviews:634,distance:"0.8 mi",tags:["Views","Cocktails"],hot:true,lat:40.7549,lng:-73.9961,
   img:"https://picsum.photos/id/110/700/462",
   about:"360° Manhattan skyline views, 30 floors up. The city at your feet."},
  {id:8,metro:"New York",name:"Le Bain",type:"Rooftop",city:"Meatpacking",price:85,rating:4.6,reviews:512,distance:"1.1 mi",tags:["Rooftop Pool","DJs"],lat:40.7398,lng:-74.0089,
   img:"https://picsum.photos/id/28/700/462",
   about:"The Standard's iconic rooftop. Hot tub, DJs, Hudson River views."},
  {id:9,metro:"New York",name:"Marquee NY",type:"Nightclub",city:"Chelsea",price:120,rating:4.9,reviews:1102,distance:"0.5 mi",tags:["EDM","VIP Booths"],hot:true,lat:40.7462,lng:-74.0035,
   img:"https://picsum.photos/id/284/700/462",
   about:"NYC's premier nightclub. World-class DJs and unmatched production."},
  {id:10,metro:"New York",name:"Good Room",type:"DJ Events",city:"Bushwick",price:45,rating:4.8,reviews:423,distance:"3.2 mi",tags:["Underground","House"],lat:40.7044,lng:-73.9317,
   img:"https://picsum.photos/id/249/700/462",
   about:"Brooklyn's best underground club. Pure music, no attitude."},
];

// ── Live data hooks ────────────────────────────────────────────────────────
function useVenues(metro) {
  const [venues, setVenues] = useState(VENUES.filter(v => v.metro === (metro || "Miami")));
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(EDGE_URL + "/get-venues?metro=" + encodeURIComponent(metro || "Miami"), {
      headers: { "apikey": SUPA_ANON }
    })
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.venues?.length) {
          // Merge DB data with local fallback images/coords
          const merged = d.venues.map(v => {
            const local = VENUES.find(l => l.name === v.name) || {};
            return {
              ...local, ...v,
              id:       v.id,
              metro:    metro || "Miami",
              price:    v.price_min,
              img:      v.img_url || local.img,
              lat:      parseFloat(v.lat) || local.lat,
              lng:      parseFloat(v.lng) || local.lng,
              distance: v.distance || local.distance || "0.5 mi",
              rating:   parseFloat(v.rating) || local.rating || 4.5,
            };
          });
          setVenues(merged);
        }
      })
      .catch(() => {}) // fallback to static data on error
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [metro]);
  return { venues, loading };
}

function useUserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sess = await getValidSession();
      if (!sess?.access_token) return;
      setLoading(true);
      try {
        const r = await fetch(EDGE_URL + "/get-bookings", {
          headers: {
            "apikey": SUPA_ANON,
            "Authorization": "Bearer " + sess.access_token
          }
        });
        const d = await r.json();
        if (!cancelled && d.bookings) {
          const normalized = d.bookings.map(b => ({
            ...b,
            venue: b.venues?.name || "Venue",
            img: b.venues?.img_url || "",
            type: b.venues?.type || "Rooftop",
            date: b.event_date ? new Date(b.event_date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : "",
            table: "Reserved Table",
            code: b.confirmation_code || "------",
          }));
          setBookings(normalized);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);
  return { bookings, loading };
}


const GUESTS = [
  {id:1,name:"Sophia R.",table:"VIP Booth",party:4,status:"confirmed",paid:480,arrived:true,av:"S"},
  {id:2,name:"Marcus T.",table:"Standard Booth",party:2,status:"confirmed",paid:170,arrived:true,av:"M"},
  {id:3,name:"Jade K.",table:"VIP Booth",party:6,status:"pending",paid:0,arrived:false,av:"J"},
  {id:4,name:"Tyler W.",table:"Bottle Table",party:8,status:"confirmed",paid:900,arrived:false,av:"T"},
  {id:5,name:"Aisha M.",table:"Standard Booth",party:3,status:"confirmed",paid:285,arrived:false,av:"A"},
];

const MSGS = [
  {id:1,name:"Sophia R.",av:"S",last:"We're on our way! About 10 mins",time:"9:41 PM",unread:1,
   thread:[{m:false,t:"Is there still a VIP booth available?"},{m:true,t:"Yes! Party of how many?"},{m:false,t:"4 people - what's the min?"},{m:true,t:"$480 for the night. Sending link now 🎉"},{m:false,t:"We're on our way! About 10 mins"}]},
  {id:2,name:"Marcus T.",av:"M",last:"Can we add 2 more?",time:"9:28 PM",unread:2,
   thread:[{m:false,t:"Just booked a standard booth"},{m:true,t:"Got it Marcus, see you tonight!"},{m:false,t:"Can we add 2 more?"}]},
  {id:3,name:"Jade K.",av:"J",last:"What's the dress code?",time:"8:15 PM",unread:0,
   thread:[{m:false,t:"What's the dress code?"},{m:true,t:"Upscale. No sneakers 👌"}]},
];

const PAYOUTS = [
  {id:1,event:"Noir Rooftop . Mar 7",gross:1835,comm:275,status:"pending"},
  {id:2,event:"Azure Terrace . Feb 22",gross:1200,comm:180,status:"paid"},
  {id:3,event:"Velvet Underground . Feb 14",gross:2100,comm:315,status:"paid"},
];

const LINKS = [
  {id:1,label:"Noir Rooftop - Mar 7",url:"luma.vip/p/NOIR-MAR7",clicks:142,conv:8},
  {id:2,label:"Azure - Mar 8",url:"luma.vip/p/AZURE-MAR8",clicks:88,conv:5},
  {id:3,label:"Velvet - Mar 14",url:"luma.vip/p/VELVET-MAR14",clicks:34,conv:1},
];

// ── Promoter data hook — fetches everything from get-promoter-data edge function ──
function usePromoterData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    const sess = await getValidSession();
    if (!sess?.access_token) return;
    setLoading(true);
    try {
      const d = await edgeCall("get-promoter-data", {});
      if (d?.error) setError(d.error);
      else setData(d);
    } catch (e) { setError("Failed to load promoter data"); }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  // Provide fallback mock data if DB returns nothing
  const guests = data?.guests?.length ? data.guests : GUESTS.map(g => ({
    ...g, venue: "Noir Rooftop", event_date: "Tonight", confirmation_code: "DEMO",
    av: undefined, email: "",
  }));
  const links = data?.links?.length ? data.links : LINKS;
  const payouts = data?.payouts?.length ? data.payouts : PAYOUTS;
  const conversations = data?.conversations?.length ? data.conversations : MSGS.map(m => ({
    id: m.id, name: m.name, avatar: null, messages: m.thread.map(t => ({ mine: t.m, body: t.t, created_at: "", read: true })),
    unread: m.unread, last: m.last, time: m.time,
  }));
  const stats = data?.stats || {
    total_commission: PAYOUTS.reduce((s,p) => s+p.comm, 0),
    earned: PAYOUTS.filter(p=>p.status==="paid").reduce((s,p) => s+p.comm, 0),
    pending: PAYOUTS.filter(p=>p.status==="pending").reduce((s,p) => s+p.comm, 0),
    total_clicks: LINKS.reduce((s,l) => s+l.clicks, 0),
    total_conversions: LINKS.reduce((s,l) => s+l.conv, 0),
    confirmed_guests: GUESTS.filter(g=>g.status==="confirmed").length,
    arrived_guests: GUESTS.filter(g=>g.arrived).length,
    total_guests: GUESTS.length,
  };
  const dailyClicks = data?.daily_clicks || [42,61,38,87,95,112,142];
  const promoterName = data?.promoter_name || "Promoter";
  const venues = data?.venues || [];

  return { guests, links, payouts, conversations, stats, dailyClicks, promoterName, venues, loading, error, refresh, isLive: !!data };
}

// ----------------------------------------------- Shared helpers --------------------------------------------
const ALLOWED_IMG_HOSTS=["images.unsplash.com","picsum.photos","cdn.luma.vip","supabase.co","supabase.com"];
function isSafeImgSrc(src){
  if(!src||typeof src!=="string") return false;
  try{ const u=new URL(src); return ALLOWED_IMG_HOSTS.some(h=>u.hostname===h||u.hostname.endsWith("."+h)); }
  catch{ return false; }
}

// ----------------------------------------------- Venue gradient (replaces broken external images) ---------
const GRADIENTS={
  "Rooftop":       "linear-gradient(160deg,#0f172a 0%,#1e3a5f 55%,#1d4ed8 100%)",
  "Nightclub":     "linear-gradient(160deg,#09090b 0%,#1e0533 55%,#6d28d9 100%)",
  "Lounge":        "linear-gradient(160deg,#16100a 0%,#2d1f0a 55%,#92540c 100%)",
  "Pool Party":    "linear-gradient(160deg,#0c4a6e 0%,#0369a1 55%,#0ea5e9 100%)",
  "DJ Events":     "linear-gradient(160deg,#0d0d1a 0%,#1a0a2e 55%,#7c3aed 100%)",
  "Latin Nights":  "linear-gradient(160deg,#1a0800 0%,#7c1d11 55%,#dc2626 100%)",
  "default":       "linear-gradient(160deg,#111 0%,#1a1a2e 55%,#2d2d4e 100%)",
};
const EMOJIS={"Rooftop":"🏙","Nightclub":"🎵","Lounge":"🥂","Pool Party":"🏊","DJ Events":"🎧","Latin Nights":"🎺","default":"✨"};

function VenueGrad({type,name,style,children}){
  const bg=GRADIENTS[type]||GRADIENTS.default;
  const em=EMOJIS[type]||EMOJIS.default;
  return(
    <div style={{position:"relative",background:bg,...style,overflow:"hidden"}}>
      {/* Subtle noise texture */}
      <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"}}/>
      {/* Emoji watermark */}
      <div style={{position:"absolute",bottom:-4,right:6,fontSize:38,opacity:.18,userSelect:"none",lineHeight:1}}>{em}</div>
      {children}
    </div>
  );
}

// Img - shows gradient immediately, image overlays when loaded
function Img({src,style,alt="",type,name}){
  const [ok,setOk]=useState(false);
  const safe=isSafeImgSrc(src)&&!!src;
  return(
    <div style={{position:"relative",...style}}>
      <VenueGrad type={type||"default"} name={name} style={{position:"absolute",inset:0,borderRadius:"inherit"}}/>
      {safe&&<img src={src} alt={alt}
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",borderRadius:"inherit",opacity:ok?1:0,transition:"opacity .4s"}}
        onLoad={()=>setOk(true)}/>}
    </div>
  );
}

function Stars({r}){
  return <span style={{display:"inline-flex",gap:1,alignItems:"center"}}>{[1,2,3,4,5].map(i=><span key={i} style={{fontSize:9,color:i<=Math.floor(r)?"#c9a84c":"#ccc"}}>★</span>)}<span style={{fontSize:10,color:"var(--sub)",marginLeft:2,fontFamily:"var(--fb)"}}>{r}</span></span>;
}

function Clock(){
  const [t,setT]=useState("");
  useEffect(()=>{const f=()=>{const d=new Date(),h=d.getHours()%12||12,m=String(d.getMinutes()).padStart(2,"0"),a=d.getHours()>=12?"PM":"AM";return`${h}:${m} ${a}`;};setT(f());const i=setInterval(()=>setT(f()),15000);return()=>clearInterval(i);},[]);
  return t;
}

const getGreeting=()=>{const h=new Date().getHours();if(h<12)return"Good morning";if(h<17)return"Good afternoon";return"Good evening";};
function SB({dark}){
  const c=dark?"rgba(255,255,255,.85)":"var(--ink)";
  return(
    <div style={{height:44,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px 0 26px",flexShrink:0}}>
      <span style={{fontSize:15,fontWeight:700,color:c,letterSpacing:"-.02em"}}><Clock/></span>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        <svg width="16" height="12" viewBox="0 0 17 12"><rect x="0" y="6" width="3" height="6" rx="1" fill={c} opacity=".4"/><rect x="4.5" y="4" width="3" height="8" rx="1" fill={c} opacity=".6"/><rect x="9" y="2" width="3" height="10" rx="1" fill={c} opacity=".8"/><rect x="13.5" y="0" width="3" height="12" rx="1" fill={c}/></svg>
        <div style={{width:24,height:11,border:`1.5px solid ${dark?"rgba(255,255,255,.3)":"rgba(0,0,0,.2)"}`,borderRadius:3,padding:"1.5px 2px",display:"flex",alignItems:"center"}}><div style={{width:"78%",height:"100%",background:dark?"#4ade80":c,borderRadius:1.5}}/></div>
      </div>
    </div>
  );
}

// ----------------------------------------------- Guest screens ---------------------------------------------
function Home({go,city="Miami",userName="Guest"}){
  const metro=city==="New York"?"New York":"Miami";
  const {venues:allVenues,loading}=useVenues(metro);
  const cityVenues=allVenues.length?allVenues:VENUES.filter(v=>v.metro===metro);
  const hot=cityVenues.filter(v=>v.hot);
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--bg)"}}>
      {/* Hero */}
      <div style={{position:"relative",height:250}}>
        <Img src={hot[0].img} style={{position:"absolute",inset:0}} alt={hot[0].name} type={hot[0].type} name={hot[0].name}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.8),transparent 55%)"}}/>
        <div style={{position:"absolute",top:8,left:20,right:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:10,color:"rgba(255,255,255,.55)",fontFamily:"var(--fb)"}}>📍 {city==="New York"?"New York, NY":"Miami, FL"}</div><div style={{fontFamily:"var(--fd)",fontSize:19,fontStyle:"italic",color:"white"}}>{getGreeting()}, {userName}</div></div>
          <div onClick={()=>go("profile")} className="press" style={{width:35,height:35,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)",cursor:"pointer"}}>E</div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 18px 14px"}}>
          <span style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",color:"white",padding:"2px 8px",borderRadius:18,fontSize:9,fontWeight:700,fontFamily:"var(--fb)"}}>🔥 Featured Tonight</span>
          <div style={{fontFamily:"var(--fd)",fontSize:21,fontWeight:700,color:"white",marginTop:4}}>{hot[0].name}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:10,color:"rgba(255,255,255,.55)",fontFamily:"var(--fb)"}}>📍 {hot[0].city} . {hot[0].distance}</span>
            <button onClick={()=>go("venue",hot[0])} className="press" style={{background:"white",border:"none",borderRadius:18,color:"var(--ink)",padding:"6px 13px",fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>{"Reserve →"}</button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{padding:"12px 18px 6px"}}>
        <div className="press" onClick={()=>go("explore")} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:13,padding:"10px 14px",display:"flex",alignItems:"center",gap:9,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{color:"var(--dim)",fontSize:13,fontFamily:"var(--fb)"}}>Search venues, areas, vibes...</span>
        </div>
      </div>

      {/* Hot strip */}
      <div style={{padding:"10px 18px 4px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
          <span style={{fontFamily:"var(--fd)",fontSize:19,fontWeight:700,color:"var(--ink)"}}>Hot Right Now</span>
          <span className="press" onClick={()=>go("explore")} style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)",fontWeight:600}}>See all</span>
        </div>
        <div style={{display:"flex",gap:11,overflowX:"auto",scrollbarWidth:"none",marginLeft:-18,paddingLeft:18,marginRight:-18,paddingRight:18,paddingBottom:4}}>
          {hot.map((v,i)=>(
            <div key={v.id} className={`press fu fu${Math.min(i+1,3)}`} onClick={()=>go("venue",v)} style={{flexShrink:0,width:178,borderRadius:16,overflow:"hidden",background:"var(--white)",border:"1px solid var(--line)"}}>
              <div style={{position:"relative",height:125}}>
                <Img src={v.img} style={{position:"absolute",inset:0}} alt={v.name} type={v.type} name={v.name}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.6),transparent 50%)"}}/>
                <div style={{position:"absolute",bottom:8,left:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{v.name}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)"}}>{v.city}</div>
                </div>
              </div>
              <div style={{padding:"8px 11px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Stars r={v.rating}/>
                <span style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--ink)"}}>${v.price}+</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All list */}
      <div style={{padding:"10px 18px 90px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:19,fontWeight:700,color:"var(--ink)",marginBottom:10}}>All Venues</div>
        {cityVenues.map(v=>(
          <div key={v.id} className="press" onClick={()=>go("venue",v)} style={{display:"flex",gap:12,padding:"10px 12px",background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,marginBottom:8}}>
            <Img src={v.img} style={{width:58,height:58,borderRadius:12,flexShrink:0}} alt={v.name} type={v.type} name={v.name}/>
            <div style={{flex:1,minWidth:0,paddingTop:2}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontFamily:"var(--fb)",fontSize:13,fontWeight:700,color:"var(--ink)"}}>{v.name}</span><span style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700}}>${v.price}+</span></div>
              <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:4}}>📍 {v.city} . {v.type} . {v.distance}</div>
              <Stars r={v.rating}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Explore({go,city="Miami"}){
  const [q,setQ]=useState("");
  const [selDate,setSelDate]=useState(null);
  const [typeFilter,setTypeFilter]=useState("All");
  const metro=city==="New York"?"New York":"Miami";
  const {venues:fetched,loading}=useVenues(metro);
  const base=fetched.length?fetched:VENUES.filter(v=>v.metro===metro);

  const dates=(()=>{
    const arr=["Tonight"];
    const d=new Date();
    for(let i=1;i<=6;i++){
      const nd=new Date(d);nd.setDate(d.getDate()+i);
      arr.push(nd.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}));
    }
    return arr;
  })();
  const types=["All","Rooftop","Nightclub","Lounge","Pool Party"];

  let list=base.filter(v=>
    (!q||[v.name,v.city,v.type,...v.tags].some(x=>x.toLowerCase().includes(q.toLowerCase())))&&
    (typeFilter==="All"||v.type===typeFilter)
  );

  const SkeletonCard=({wide})=>(
    <div style={{borderRadius:14,overflow:"hidden",border:"1px solid var(--line)",gridColumn:wide?"1/3":"auto",
      background:"var(--white)"}}>
      <div style={{height:wide?150:100,background:"linear-gradient(90deg,#ece9e0 25%,#f5f4f0 50%,#ece9e0 75%)",
        backgroundSize:"200% 100%",animation:"shimmer 1.4s infinite"}}/>
      <div style={{padding:"8px 10px"}}>
        <div style={{height:10,borderRadius:5,background:"#ece9e0",marginBottom:5,width:"70%"}}/>
        <div style={{height:8,borderRadius:5,background:"#ece9e0",width:"45%"}}/>
      </div>
    </div>
  );

  return(
    <div className="scroll fi" style={{flex:1,overflowY:"auto",background:"var(--bg)",padding:"4px 18px"}}>
      <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"var(--ink)",marginBottom:10}}>Explore</div>

      {/* Search */}
      <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:13,
        padding:"10px 14px",display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={q} onChange={e=>setQ(sanitize(e.target.value,80))} maxLength={80}
          placeholder="Venue, vibe, area..." style={{flex:1,background:"transparent",border:"none",
            outline:"none",color:"var(--ink)",fontSize:13,fontFamily:"var(--fb)"}}/>
        {q&&<span className="press" onClick={()=>setQ("")} style={{fontSize:11,color:"var(--dim)"}}>✕</span>}
      </div>

      {/* Date filter */}
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:9,paddingBottom:1}}>
        {dates.map(d=>(
          <button key={d} onClick={()=>setSelDate(selDate===d?null:d)} className="press"
            style={{flexShrink:0,padding:"5px 11px",borderRadius:20,fontSize:10,fontWeight:600,
              fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",transition:"all .15s",
              background:selDate===d?"var(--ink)":"var(--white)",
              borderColor:selDate===d?"var(--ink)":"var(--line2)",
              color:selDate===d?"white":"var(--ink)"}}>
            📅 {d}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:14,paddingBottom:1}}>
        {types.map(t=>(
          <button key={t} onClick={()=>setTypeFilter(t)} className="press"
            style={{flexShrink:0,padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:600,
              fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",
              background:typeFilter===t?"var(--ink)":"transparent",
              borderColor:typeFilter===t?"var(--ink)":"var(--line2)",
              color:typeFilter===t?"white":"var(--sub)"}}>
            {t}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:90}}>
          {[0,1,2,3].map(i=><SkeletonCard key={i} wide={i===0}/>)}
        </div>
      )}

      {/* No results empty state */}
      {!loading&&list.length===0&&(
        <div style={{textAlign:"center",padding:"50px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>🔍</div>
          <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"var(--ink)",marginBottom:6}}>No venues found</div>
          <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",lineHeight:1.6,marginBottom:16}}>
            Try a different date, type, or search term
          </div>
          <button onClick={()=>{setQ("");setSelDate(null);setTypeFilter("All");}} className="press"
            style={{padding:"9px 22px",background:"var(--ink)",color:"white",border:"none",
              borderRadius:11,fontSize:12,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading&&list.length>0&&!q&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:90}}>
          {list.map((v,i)=>(
            <div key={v.id} className="press" onClick={()=>go("venue",v)}
              style={{borderRadius:14,overflow:"hidden",border:"1px solid var(--line)",gridColumn:i===0?"1/3":"auto"}}>
              <div style={{position:"relative",height:i===0?150:100}}>
                <Img src={v.img} style={{position:"absolute",inset:0}} alt={v.name} type={v.type} name={v.name}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.65),transparent 50%)"}}/>
                {selDate&&<div style={{position:"absolute",top:7,left:8,background:"rgba(255,255,255,.15)",
                  backdropFilter:"blur(8px)",borderRadius:9,padding:"2px 7px",
                  fontSize:8,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>
                  {selDate}
                </div>}
                <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"7px 10px"}}>
                  <div style={{fontSize:i===0?13:11,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{v.name}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.55)",fontFamily:"var(--fb)"}}>{v.city} . ${v.price}+</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view for search */}
      {!loading&&q&&(
        <div style={{paddingBottom:90}}>
          {list.map(v=>(
            <div key={v.id} className="press" onClick={()=>go("venue",v)}
              style={{display:"flex",gap:12,padding:"10px 12px",background:"var(--white)",
                border:"1px solid var(--line)",borderRadius:14,marginBottom:8}}>
              <Img src={v.img} style={{width:56,height:56,borderRadius:11,flexShrink:0}} alt={v.name} type={v.type} name={v.name}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"var(--fb)",fontSize:13,fontWeight:700}}>{v.name}</span>
                  <span style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700}}>${v.price}+</span>
                </div>
                <div style={{fontSize:10,color:"var(--sub)",margin:"2px 0 4px",fontFamily:"var(--fb)"}}>📍 {v.city} . {v.type}</div>
                <Stars r={v.rating}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapScreen({go,city="Miami"}){
  const metro=city==="New York"?"New York":"Miami";
  const {venues:cityVenues}=useVenues(metro);
  const filters=["All","Rooftop","Nightclub","Lounge","Pool Party"];
  const [sel,setSel]=useState(null);
  const [filter,setFilter]=useState("All");
  const [ready,setReady]=useState(false);
  const [token,setToken]=useState(null);
  const mapRef=useRef(null);
  const mapObj=useRef(null);
  const markRef=useRef([]);
  const filtered=filter==="All"?cityVenues:cityVenues.filter(v=>v.type===filter);

  const cfg=metro==="Miami"
    ?{lat:25.778,lng:-80.168,z:12}
    :{lat:40.740,lng:-73.990,z:12};

  // Fetch Mapbox token from Supabase app_config
  useEffect(()=>{
    (async()=>{
      try{
        const supaUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supaKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if(!supaUrl||!supaKey) return;
        const r=await fetch(`${supaUrl}/rest/v1/app_config?key=eq.mapbox_token&select=value`,{headers:{apikey:supaKey}});
        const d=await r.json();
        if(d?.[0]?.value) setToken(d[0].value);
      }catch(e){console.error("Failed to fetch mapbox token:",e);}
    })();
  },[]);

  // Load Mapbox GL JS
  useEffect(()=>{
    if(!token) return;
    if(!document.getElementById("mbcss")){
      const c=document.createElement("link");c.id="mbcss";c.rel="stylesheet";
      c.href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
      document.head.appendChild(c);
    }
    if(!document.getElementById("mbjs")){
      const s=document.createElement("script");s.id="mbjs";
      s.src="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
      s.onload=()=>initMap();
      document.head.appendChild(s);
    }else{
      setTimeout(()=>initMap(),100);
    }
    return()=>{
      if(mapObj.current){mapObj.current.remove();mapObj.current=null;setReady(false);}
    };
  },[token]);

  const initMap=()=>{
    if(!window.mapboxgl||!mapRef.current||mapObj.current||!token)return;
    window.mapboxgl.accessToken=token;
    const m=new window.mapboxgl.Map({
      container:mapRef.current,
      style:"mapbox://styles/mapbox/dark-v11",
      center:[cfg.lng,cfg.lat],
      zoom:cfg.z,
      attributionControl:false,
      pitchWithRotate:false,
    });
    m.addControl(new window.mapboxgl.NavigationControl({showCompass:false}),"bottom-right");
    m.on("load",()=>{setReady(true);syncMarkers();});
    mapObj.current=m;
  };

  const syncMarkers=()=>{
    markRef.current.forEach(m=>m.remove());
    markRef.current=[];
    if(!mapObj.current||!window.mapboxgl)return;
    filtered.forEach(v=>{
      const el=document.createElement("div");
      el.innerHTML=`<div style="background:#0a0a0a;color:white;border:2px solid rgba(255,255,255,.85);border-radius:9px;padding:3px 8px;font-size:10px;font-weight:700;font-family:'DM Sans',system-ui;white-space:nowrap;box-shadow:0 2px 12px rgba(0,0,0,.5);cursor:pointer;line-height:1">$${v.price_min||v.price||0}+</div><div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid #0a0a0a;margin:0 auto"></div>`;
      el.style.cursor="pointer";
      el.addEventListener("click",e=>{
        e.stopPropagation();
        setSel(v);
        mapObj.current.flyTo({center:[v.lng,v.lat],zoom:14,duration:800});
      });
      const marker=new window.mapboxgl.Marker({element:el,anchor:"bottom"})
        .setLngLat([v.lng,v.lat])
        .addTo(mapObj.current);
      markRef.current.push(marker);
    });
  };

  // Update markers when filter or venues change
  useEffect(()=>{if(ready)syncMarkers();},[filter,ready,cityVenues]);

  // Fly to city when switching
  useEffect(()=>{
    if(mapObj.current){
      mapObj.current.flyTo({center:[cfg.lng,cfg.lat],zoom:cfg.z,duration:1000});
      setTimeout(()=>syncMarkers(),1100);
    }
    setSel(null);setFilter("All");
  },[metro]);

  const price=v=>v.price_min||v.price||0;

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)"}} onClick={()=>setSel(null)}>
      {/* Header */}
      <div style={{padding:"4px 18px 8px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"var(--ink)"}}>Map</div>
          <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",fontWeight:600}}>
            📍 {metro} · {filtered.length} spots
          </div>
        </div>
        <div style={{display:"flex",gap:5,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
          {filters.map(f=>(
            <button key={f} onClick={()=>{setFilter(f);setSel(null);}}
              style={{flexShrink:0,padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:600,
                fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",
                background:filter===f?"var(--ink)":"transparent",
                borderColor:filter===f?"var(--ink)":"var(--line2)",
                color:filter===f?"white":"var(--sub)"}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div style={{flex:1,position:"relative",margin:"0 18px",borderRadius:18,overflow:"hidden",border:"1px solid var(--line)"}}>
        <div ref={mapRef} style={{position:"absolute",inset:0}}/>

        {/* Loading state */}
        {!ready&&(
          <div style={{position:"absolute",inset:0,background:"#1a1a2e",display:"flex",
            alignItems:"center",justifyContent:"center",zIndex:2}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:8}}>🗺️</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)",fontFamily:"var(--fb)"}}>
                {token?"Loading map...":"Loading token..."}
              </div>
            </div>
          </div>
        )}

        {/* Selected venue card */}
        {sel&&(
          <div onClick={e=>e.stopPropagation()}
            style={{position:"absolute",left:"50%",bottom:12,transform:"translateX(-50%)",zIndex:30,width:"90%",maxWidth:290}}>
            <div style={{background:"white",borderRadius:16,padding:"12px 14px",
              boxShadow:"0 8px 40px rgba(0,0,0,.25)",border:"1px solid rgba(0,0,0,.06)"}}>
              <div style={{display:"flex",gap:11,alignItems:"center",marginBottom:8}}>
                <div style={{width:44,height:44,borderRadius:11,flexShrink:0,
                  background:sel.img_url?`url(${sel.img_url}) center/cover`
                    :`linear-gradient(135deg,${sel.type==="Rooftop"?"#1a1a3e,#2a3a6e"
                      :sel.type==="Pool Party"?"#0c3547,#1a5276"
                      :sel.type==="Lounge"?"#2c1810,#5a3425":"#1a0a2e,#3a1a5e"})`,
                }}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,fontFamily:"var(--fb)",lineHeight:1.2}}>{sel.name}</div>
                  <div style={{fontSize:10,color:"#7a7a7a",fontFamily:"var(--fb)",marginTop:2}}>
                    📍 {sel.city} · {sel.type}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700}}>${price(sel)}+</div>
                  <div style={{fontSize:10,color:"#c9a84c"}}>★ {sel.rating}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>go("venue",sel)}
                  style={{flex:1,padding:"9px",background:"var(--ink)",color:"white",border:"none",
                    borderRadius:10,fontSize:12,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>
                  {"Reserve →"}
                </button>
                <button onClick={()=>setSel(null)}
                  style={{padding:"9px 14px",background:"transparent",border:"1.5px solid rgba(0,0,0,.12)",
                    borderRadius:10,fontSize:12,fontFamily:"var(--fb)",cursor:"pointer",color:"#7a7a7a"}}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{height:12,flexShrink:0}}/>
    </div>
  );
}


function Bookings({go}){
  const [tab,setTab]=useState("upcoming");
  const [qrBooking,setQrBooking]=useState(null);
  const {bookings:bk,loading}=useUserBookings();
  const list=tab==="upcoming"
    ?bk.filter(b=>b.status==="confirmed"||b.status==="pending")
    :bk.filter(b=>b.status==="cancelled"||b.status==="checked_in");

  // QR Code modal
  if(qrBooking) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",alignItems:"center",justifyContent:"center",padding:28}}>
      <div style={{width:"100%",textAlign:"center"}}>
        <div style={{background:"white",borderRadius:24,padding:20,marginBottom:20,boxShadow:"0 8px 40px rgba(0,0,0,.1)",display:"inline-block"}}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=luma-checkin:${qrBooking.code}&margin=0&color=0a0a0a`}
            alt="QR Code" width={200} height={200} style={{display:"block",borderRadius:4}}/>
        </div>
        <div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--ink)",marginBottom:4}}>{qrBooking.venue}</div>
        <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:12}}>📅 {qrBooking.date} · {qrBooking.table}</div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,padding:"14px 20px",marginBottom:16,display:"inline-block"}}>
          <div style={{fontSize:8,color:"var(--sub)",letterSpacing:".12em",textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:4}}>Confirmation Code</div>
          <div style={{fontFamily:"var(--fd)",fontSize:28,fontWeight:700,letterSpacing:".08em"}}>{qrBooking.code}</div>
        </div>
        <div style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:20,lineHeight:1.6}}>Show this QR code at the door for express check-in</div>
        <button onClick={()=>setQrBooking(null)} style={{width:"100%",padding:"12px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Done</button>
      </div>
    </div>
  );

  return(
    <div className="scroll su" style={{flex:1,overflowY:"auto",background:"var(--bg)",padding:"4px 18px"}}>
      <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"var(--ink)",marginBottom:13}}>Bookings</div>
      <div style={{display:"flex",background:"var(--white)",border:"1px solid var(--line)",borderRadius:13,padding:3,marginBottom:15}}>
        {["upcoming","past"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"var(--fb)",fontWeight:600,fontSize:12,transition:"all .2s",background:tab===t?"var(--ink)":"transparent",color:tab===t?"white":"var(--sub)"}}>{t==="upcoming"?"Upcoming":"Past"}</button>)}
      </div>
      {!list.length?(
        <div style={{textAlign:"center",padding:"44px 20px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"var(--white)",border:"1px solid var(--line)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,marginBottom:16,
            boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
            {tab==="upcoming"?"🍾":"📖"}
          </div>
          <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"var(--ink)",marginBottom:6}}>
            {tab==="upcoming"?"No upcoming plans":"No past bookings"}
          </div>
          <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",lineHeight:1.6,marginBottom:20,maxWidth:220}}>
            {tab==="upcoming"
              ?"Book a table at your next night out and it'll show up here."
              :"Your booking history will appear here after your first reservation."}
          </div>
          {tab==="upcoming"&&(
            <button onClick={()=>go("explore")} className="press"
              style={{background:"var(--ink)",color:"white",border:"none",borderRadius:13,
                padding:"11px 26px",fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>
              Explore Venues →
            </button>
          )}
        </div>
      )
      :<div style={{paddingBottom:90}}>
        {list.map(b=>(
          <div key={b.id} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden",marginBottom:10}}>
            <div style={{position:"relative",height:115}}><Img src={b.img} style={{position:"absolute",inset:0}} alt={b.venue} type="Rooftop" name={b.venue}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.6),transparent 55%)"}}/><div style={{position:"absolute",top:9,right:10}}><span style={{background:"var(--ink)",color:"white",fontSize:9,fontWeight:700,padding:"2px 9px",borderRadius:18,fontFamily:"var(--fb)"}}>✓ Confirmed</span></div><div style={{position:"absolute",bottom:0,left:14,paddingBottom:10}}><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white"}}>{b.venue}</div></div></div>
            <div style={{padding:"11px 14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><div style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)"}}>📅 {b.date} · {b.table}</div><div style={{background:"#f5f4f0",border:"1px solid var(--line)",borderRadius:9,padding:"5px 10px",textAlign:"center"}}><div style={{fontSize:7,color:"var(--sub)",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"var(--fb)"}}>Code</div><div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,letterSpacing:".06em"}}>{b.code}</div></div></div><button onClick={()=>setQrBooking(b)} style={{width:"100%",padding:"9px",background:"var(--ink)",color:"white",border:"none",borderRadius:11,fontSize:12,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>View QR Code</button></div>
          </div>
        ))}
      </div>}
    </div>
  );
}

function VenueDetail({venue,go}){
  const [step,    setStep]    = useState("detail");
  const [selT,    setSelT]    = useState(null);
  // Generate real dates starting from tomorrow
  const genDates = () => {
    const dates = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    for (let i = 0; i < 7; i++) {
      const nd = new Date(d);
      nd.setDate(d.getDate() + i);
      dates.push(nd.toLocaleDateString("en-US", {weekday:"short", month:"short", day:"numeric"}));
    }
    return dates;
  };
  const DATES = genDates();
  const [date,    setDate]    = useState(DATES[0]);
  const [party,   setParty]   = useState(4);
  const [promoIn, setPromoIn] = useState("");
  const [promo,   setPromo]   = useState(null);
  const [promoLoading,setPromoLoading] = useState(false);
  const [booking,     setBooking]      = useState(null);
  const [submitting,  setSubmitting]   = useState(false);
  const [submitErr,   setSubmitErr]    = useState("");

  const tables = [
    {id:1,name:"Standard Booth",cap:"2-4",  price:venue.price,                 desc:"Great view, intimate"},
    {id:2,name:"VIP Booth",     cap:"4-8",  price:Math.round(venue.price*1.8), desc:"Near stage, premium",hot:true},
    {id:3,name:"Bottle Table",  cap:"6-12", price:Math.round(venue.price*3),   desc:"Full bottle service"},
  ];

  // Pricing ALWAYS server-calculated — cannot be spoofed from frontend
  const [pricing, setPricing] = useState(null);
  useEffect(() => {
    if (!selT) { setPricing(null); setPromo(null); return; }
    (async () => {
      const d = await edgeCall("validate-promo", { venue_id: venue.id, guests: party });
      if (!d?.error) setPricing(d);
    })();
  }, [selT?.id, party]);

  const subtotal    = pricing ? Math.round(pricing.base_price / 100) : 0;
  const discountAmt = pricing ? Math.round(pricing.discount / 100)   : 0;
  const feePct      = pricing ? Math.round(pricing.platform_fee / 100) : 0;
  const total       = pricing ? Math.round(pricing.total / 100)       : 0;

  const validatePromo = async () => {
    if (!promoIn.trim()) return;
    setPromoLoading(true); setPromo(null);
    if (!getSession()) { setPromo({error:"Sign in to use promo codes"}); setPromoLoading(false); return; }
    try {
      const d = await edgeCall("validate-promo", {
        venue_id: venue.id, guests: party,
        promo_code: promoIn.trim().toUpperCase(),
      });
      if (d?.error) { setPromo({error: d.error}); }
      else { setPromo(d); setPricing(d); }
    } catch(e) { setPromo({error:"Could not reach server"}); }
    setPromoLoading(false);
  };

  const submitBooking = async () => {
    if (!selT || submitting) return;
    setSubmitting(true); setSubmitErr("");
    if (!getSession()) {
      setBooking({confirmation_code:"LM-DEMO", total, discount_pct:0, demo:true});
      setStep("confirm"); setSubmitting(false); return;
    }
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://luma.vip';
      const d = await edgeCall("create-checkout", {
        venue_id:    venue.id,
        guests:      party,
        event_date:  date,
        promo_code:  (promo && !promo.error) ? promoIn.trim().toUpperCase() : null,
        notes:       selT.name,
        success_url: currentUrl,
        cancel_url:  currentUrl,
      });
      if (d?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = d.checkout_url;
      } else if (d?.booking_id && !d?.checkout_url) {
        // Stripe not configured — fall back to direct booking (dev mode)
        const bData = {
          ...d,
          total:         Math.round((d.total || pricing?.total || 0) / 100),
          discount_pct:  pricing?.discount_value || 0,
          discount_type: pricing?.discount_type || null,
        };
        setBooking(bData);
        setStep("confirm");
        edgeCall("send-confirmation", {
          booking_id:        d.booking_id,
          confirmation_code: d.confirmation_code,
          venue_name:        d.venue_name || venue.name,
          event_date:        date,
          guests:            party,
          total:             d.total || pricing?.total || 0,
        }).catch(()=>{});
      } else {
        setSubmitErr(d?.error || "Booking failed — try again.");
      }
    } catch(e) { setSubmitErr("Network error."); }
    setSubmitting(false);
  };

  // ----------------------------------------------- CONFIRM SCREEN ----------------------------------------
  if (step==="confirm"&&booking) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:28,textAlign:"center",background:"var(--bg)"}}>
      <div style={{animation:"popIn .5s cubic-bezier(.16,1,.3,1) both",width:"100%"}}>
        <div style={{width:68,height:68,borderRadius:"50%",background:"var(--ink)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 16px"}}>🎉</div>
        <div style={{fontFamily:"var(--fd)",fontSize:28,fontWeight:700,fontStyle:"italic",marginBottom:4}}>You're in.</div>
        <div style={{fontSize:12,color:"var(--sub)",lineHeight:1.65,marginBottom:20,fontFamily:"var(--fb)"}}>
          Reserved at <strong style={{color:"var(--ink)"}}>{venue.name}</strong>
        </div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:17,
          padding:"16px 20px",marginBottom:14}}>
          <div style={{fontSize:9,color:"var(--sub)",letterSpacing:".12em",textTransform:"uppercase",
            marginBottom:6,fontFamily:"var(--fb)"}}>Confirmation Code</div>
          <div style={{fontFamily:"var(--fd)",fontSize:30,fontWeight:700,letterSpacing:".08em"}}>
            {booking.confirmation_code}
          </div>
          <div style={{fontSize:10,color:"var(--dim)",marginTop:5,fontFamily:"var(--fb)"}}>
            {date} . {selT?.name} . {party} guests
          </div>
        </div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,
          padding:"12px 16px",marginBottom:18,textAlign:"left"}}>
          {[
            ["Subtotal","$"+subtotal],
            ["Platform fee (10%)","$"+feePct],
            ...(discountAmt>0?[["Promo code","−$"+discountAmt]]:[]),
            ["Total","$"+(booking.total||total)],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,
              fontFamily:"var(--fb)",marginBottom:4,fontWeight:k==="Total"?700:400,
              color:k.startsWith("Promo")?"#16a34a":k==="Total"?"var(--ink)":"var(--sub)"}}>
              <span>{k}</span><span>{v}</span>
            </div>
          ))}
        </div>
        {booking.demo&&<div style={{fontSize:11,color:"#92400e",fontFamily:"var(--fb)",marginBottom:14,
          padding:"9px 12px",background:"#fef3c7",borderRadius:10,border:"1px solid #fde68a"}}>
          ⚠️ Demo mode - sign in to create a real booking
        </div>}
        <button onClick={()=>go("bookings")}
          style={{width:"100%",padding:"12px",background:"var(--ink)",color:"white",border:"none",
            borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",marginBottom:8}}>
          View My Bookings
        </button>
        <button onClick={()=>{setStep("detail");setSelT(null);setBooking(null);setPromo(null);setPromoIn("");}}
          style={{width:"100%",padding:"11px",background:"transparent",
            border:"1.5px solid var(--line2)",borderRadius:13,fontSize:12,
            fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",color:"var(--ink)"}}>
          Back to Venue
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------- BOOK STEP ---------------------------------------------
  if (step==="book") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)"}}>
      <div style={{padding:"8px 18px 10px",display:"flex",alignItems:"center",gap:9,
        borderBottom:"1px solid var(--line)",flexShrink:0}}>
        <button className="press" onClick={()=>setStep("detail")}
          style={{width:32,height:32,borderRadius:9,background:"transparent",
            border:"1.5px solid var(--line2)",cursor:"pointer",fontSize:16,color:"var(--ink)"}}>‹</button>
        <span style={{fontFamily:"var(--fd)",fontSize:17,fontWeight:700}}>Reserve a Table</span>
      </div>
      <div className="scroll" style={{flex:1,overflowY:"auto",padding:"13px 18px"}}>
        {/* Date */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"var(--sub)",fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7,fontFamily:"var(--fb)"}}>Date</div>
          <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
            {DATES.map(d=>(
              <button key={d} onClick={()=>setDate(d)} className="press"
                style={{flexShrink:0,padding:"7px 11px",borderRadius:10,border:"1.5px solid",
                  fontSize:10,fontWeight:600,fontFamily:"var(--fb)",cursor:"pointer",
                  background:date===d?"var(--ink)":"transparent",
                  borderColor:date===d?"var(--ink)":"var(--line2)",
                  color:date===d?"white":"var(--ink2)"}}>
                {d}
              </button>
            ))}
          </div>
        </div>
        {/* Tables */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"var(--sub)",fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7,fontFamily:"var(--fb)"}}>Table</div>
          {tables.map(t=>(
            <div key={t.id} className="press" onClick={()=>setSelT(t)}
              style={{padding:12,marginBottom:7,
                background:selT?.id===t.id?"var(--ink)":"var(--white)",
                border:"1.5px solid "+(selT?.id===t.id?"var(--ink)":"var(--line)"),
                borderRadius:13,cursor:"pointer",transition:"all .15s",position:"relative"}}>
              {t.hot&&<span style={{position:"absolute",top:9,right:9,
                background:selT?.id===t.id?"rgba(255,255,255,.15)":"var(--ink)",
                color:"white",fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:18,fontFamily:"var(--fb)"}}>Popular</span>}
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:selT?.id===t.id?"white":"var(--ink)",marginBottom:2}}>{t.name}</div>
                  <div style={{fontSize:10,fontFamily:"var(--fb)",color:selT?.id===t.id?"rgba(255,255,255,.55)":"var(--sub)"}}>{t.desc} . 👥 {t.cap}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:700,color:selT?.id===t.id?"white":"var(--ink)"}}>${t.price}</div>
                  <div style={{fontSize:9,fontFamily:"var(--fb)",color:selT?.id===t.id?"rgba(255,255,255,.4)":"var(--dim)"}}>min</div>
                </div>
              </div>
              {selT?.id===t.id&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)"}}>Party:</span>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
                    {[-1,null,1].map((d,i)=>d===null
                      ?<span key="n" style={{fontFamily:"var(--fd)",fontWeight:700,fontSize:15,color:"white",minWidth:18,textAlign:"center"}}>{party}</span>
                      :<button key={i} onClick={e=>{e.stopPropagation();setParty(p=>Math.max(1,Math.min(12,p+d)));}}
                        style={{width:26,height:26,borderRadius:7,background:"rgba(255,255,255,.15)",border:"none",color:"white",cursor:"pointer",fontSize:15}}>
                        {d>0?"+":"−"}</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Promo code */}
        {selT&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"var(--sub)",fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7,fontFamily:"var(--fb)"}}>Promo Code</div>
            <div style={{display:"flex",gap:8}}>
              <input value={promoIn}
                onChange={e=>setPromoIn(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20))}
                onKeyDown={e=>e.key==="Enter"&&validatePromo()}
                placeholder="e.g. LUMA20"
                style={{flex:1,padding:"10px 13px",borderRadius:11,fontSize:13,fontFamily:"var(--fb)",
                  outline:"none",color:"var(--ink)",letterSpacing:".06em",background:"var(--white)",
                  border:"1.5px solid "+(promo&&!promo.error?"#16a34a":promo?.error?"#dc2626":"var(--line2)")}}/>
              <button onClick={validatePromo} disabled={promoLoading||!promoIn.trim()} className="press"
                style={{padding:"10px 14px",background:"var(--ink)",color:"white",border:"none",
                  borderRadius:11,fontSize:12,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",
                  opacity:promoLoading||!promoIn.trim()?0.45:1,
                  display:"flex",alignItems:"center",gap:5}}>
                {promoLoading&&<div style={{width:11,height:11,borderRadius:"50%",
                  border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite"}}/>}
                {promoLoading?"...":"Apply"}
              </button>
            </div>
            {promo&&!promo.error&&<div style={{marginTop:6,padding:"8px 11px",background:"#f0fdf4",
              border:"1px solid #bbf7d0",borderRadius:9,fontSize:11,color:"#16a34a",fontFamily:"var(--fb)"}}>
              ✓ {promo.discount_type==="fixed"?"$"+(promo.discount_value/100).toFixed(0)+" off applied!":promo.discount_value+"% off applied!"}</div>}
            {promo?.error&&<div style={{marginTop:6,padding:"8px 11px",background:"#fef2f2",
              border:"1px solid #fecaca",borderRadius:9,fontSize:11,color:"#dc2626",fontFamily:"var(--fb)"}}>
              ✕ {promo.error}</div>}
          </div>
        )}
        {/* Summary */}
        {selT&&(
          <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:13,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontFamily:"var(--fb)",fontSize:12,fontWeight:700,marginBottom:8}}>Order Summary</div>
            {[
              ["Table min ("+party+"×$"+Math.round(subtotal/party)+")","$"+subtotal],
              ["Platform fee (10%)","$"+feePct],
              ...(discountAmt>0?[["Promo code","−$"+discountAmt]]:[]),
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,fontFamily:"var(--fb)",
                marginBottom:4,color:k.startsWith("Promo")?"#16a34a":"var(--sub)"}}>
                <span>{k}</span><span style={{color:"var(--ink)"}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,
              paddingTop:8,borderTop:"1px solid var(--line)",fontFamily:"var(--fd)"}}>
              <span>Total</span><span>${total}</span>
            </div>
          </div>
        )}
        {submitErr&&<div style={{padding:"9px 12px",background:"#fef2f2",border:"1px solid #fecaca",
          borderRadius:10,fontSize:12,color:"#dc2626",fontFamily:"var(--fb)",marginBottom:10}}>{submitErr}</div>}
      </div>
      <div style={{padding:"9px 18px 12px",borderTop:"1px solid var(--line)",flexShrink:0}}>
        <button onClick={submitBooking} disabled={!selT||submitting}
          style={{width:"100%",padding:"12px",background:"var(--ink)",color:"white",border:"none",
            borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,
            cursor:selT&&!submitting?"pointer":"not-allowed",opacity:!selT||submitting?.35:1,
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {submitting&&<div style={{width:14,height:14,borderRadius:"50%",
            border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite"}}/>}
          {submitting?"Processing...":selT?"Pay & Reserve — $"+total:"Select a table to continue"}
        </button>
        <div style={{textAlign:"center",marginTop:6,fontSize:9,color:"var(--dim)",fontFamily:"var(--fb)"}}>
          🔒 Free cancellation 48h before . Powered by Luma
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------- Promoter screens ------------------------------------------
const P={
  bg:"rgba(255,255,255,.05)",
  border:"1px solid rgba(255,255,255,.09)",
  text:"white",
  sub:"rgba(255,255,255,.38)",
  gold:"var(--gold)",
};

function ProCard({children,style={},onClick}){
  return <div onClick={onClick} className={onClick?"press":""} style={{background:P.bg,border:P.border,borderRadius:16,...style}}>{children}</div>;
}

function ProDash({setTab,pd}){
  const [showPaywall,setShowPaywall]=useState(false);
  const {stats,promoterName,venues}=pd;
  const todayVenue=venues[0]?.name||"No venue assigned";
  const today=new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
  if(showPaywall) return <ProPaywall onClose={()=>setShowPaywall(false)} onSelect={()=>setShowPaywall(false)}/>;
  return(
    <div className="scroll fi" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontFamily:"var(--fd)",fontSize:13,fontStyle:"italic",color:P.sub}}>Welcome back,</div><div style={{fontFamily:"var(--fd)",fontSize:25,fontWeight:700,color:"white"}}>{promoterName}</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.3)",borderRadius:20,padding:"4px 11px"}}><span style={{fontSize:10,color:"var(--gold)",fontWeight:700,fontFamily:"var(--fb)"}}>✦ PROMOTER</span></div>
            <button className="press" onClick={()=>setShowPaywall(true)} style={{background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.25)",borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:9,color:"var(--gold)",fontWeight:700,fontFamily:"var(--fb)"}}>⬆ Upgrade</button>
          </div>
        </div>

        {/* Tonight card */}
        <div className="press" onClick={()=>setTab("guests")} style={{background:"linear-gradient(135deg,rgba(201,168,76,.16),rgba(201,168,76,.05))",border:"1px solid rgba(201,168,76,.22)",borderRadius:18,padding:"14px 16px",marginBottom:13}}>
          <div style={{fontSize:9,color:"rgba(201,168,76,.65)",fontWeight:700,fontFamily:"var(--fb)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Tonight's Event</div>
          <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white",marginBottom:1}}>{todayVenue}</div>
          <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)",marginBottom:11}}>{today} . Doors 10PM</div>
          <div style={{display:"flex",gap:18}}>
            {[[stats.confirmed_guests,"Confirmed","var(--gold)"],[stats.arrived_guests,"Arrived","white"],["$"+stats.pending,"Pending","#fbbf24"]].map(([v,l,c])=>(
              <div key={l}><div style={{fontFamily:"var(--fd)",fontSize:21,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l}</div></div>
            ))}
          </div>
        </div>

        {/* Stats grid - clickable */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:13}}>
          {[
            ["$"+stats.earned,"Total Earned","💰","payouts"],
            ["$"+stats.pending,"Pending","⏳","payouts"],
            [stats.total_clicks+" clicks","Link Traffic","🔗","links"],
            [stats.total_conversions+" booked","Conversions","✅","analytics"]
          ].map(([v,l,ic,tab])=>(
            <ProCard key={l} onClick={()=>setTab(tab)} style={{padding:"12px 13px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-12,right:-8,fontSize:36,opacity:.07}}>{ic}</div>
              <div style={{fontSize:18,marginBottom:6}}>{ic}</div>
              <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"white",lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)",marginTop:3}}>{l}</div>
              <div style={{position:"absolute",bottom:8,right:10}}>
                <svg width="5" height="9" viewBox="0 0 5 9" fill="none"><path d="M1 1l3 3.5L1 8" stroke="rgba(255,255,255,.2)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </ProCard>
          ))}
        </div>

        {/* Quick nav */}
        <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white",marginBottom:9}}>Quick Actions</div>
        <div style={{display:"flex",flexDirection:"column",gap:7,paddingBottom:90}}>
          {[["👥","Guest List",stats.confirmed_guests+" confirmed · "+stats.arrived_guests+" arrived","guests"],["🔗","Invite Links",stats.total_clicks+" clicks · "+stats.total_conversions+" booked","links"],["📊","Analytics","Clicks & conversions","analytics"],["💰","Payouts","$"+stats.earned+" earned","payouts"],["💬","Messages",pd.conversations.filter(c=>c.unread>0).length+" unread","messages"],["⚙️","Pricing","Set table minimums","pricing"]].map(([ic,l,s,t])=>(
            <ProCard key={l} onClick={()=>setTab(t)} style={{padding:"11px 13px"}}>
              <div style={{display:"flex",alignItems:"center",gap:11}}>
                <span style={{fontSize:18,width:24,textAlign:"center"}}>{ic}</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"white",fontFamily:"var(--fb)"}}>{l}</div><div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)",marginTop:1}}>{s}</div></div>
                <svg width="5" height="10" viewBox="0 0 5 10" fill="none"><path d="M1 1l3 4L1 9" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </ProCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProGuests({pd}){
  const {guests,venues}=pd;
  const [checkedIn,setCheckedIn]=useState({});
  const sc={confirmed:"rgba(74,222,128,.13)",pending:"rgba(251,191,36,.1)",cancelled:"rgba(239,68,68,.08)",checked_in:"rgba(74,222,128,.13)"};
  const tc={confirmed:"#4ade80",pending:"#fbbf24",cancelled:"#f87171",checked_in:"#4ade80"};
  const venueName=venues[0]?.name||"Your Venue";
  const today=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
  const confirmed=guests.filter(g=>g.status==="confirmed"||g.status==="checked_in").length;
  const arrived=guests.filter(g=>g.arrived||checkedIn[g.id]).length;
  const pending=guests.filter(g=>g.status==="pending").length;

  const handleCheckIn=async(guestId)=>{
    setCheckedIn(p=>({...p,[guestId]:true}));
    try { await edgeCall("check-in-guest",{booking_id:guestId}); } catch{}
  };

  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 12px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white"}}>Guest List</div>
        <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)"}}>{venueName} · {today}</div>
      </div>
      <div style={{padding:"0 18px 6px"}}>
        <ProCard style={{padding:"11px 15px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-around"}}>
            {[[String(confirmed),"Confirmed"],[String(arrived),"Arrived"],[String(pending),"Pending"]].map(([n,l])=>(
              <div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white"}}>{n}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l}</div></div>
            ))}
          </div>
        </ProCard>
      </div>
      <div style={{padding:"0 18px 90px",display:"flex",flexDirection:"column",gap:8}}>
        {guests.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:36,marginBottom:12}}>👥</div>
            <div style={{fontSize:14,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:6}}>No guests yet</div>
            <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)"}}>Bookings for your venues will appear here</div>
          </div>
        )}
        {guests.map(g=>{
          const isIn=g.arrived||checkedIn[g.id];
          const initial=(g.name||"G")[0].toUpperCase();
          return(
          <ProCard key={g.id} style={{padding:"12px 13px"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"var(--goldbg)",border:"1.5px solid rgba(201,168,76,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--gold)",fontFamily:"var(--fd)",flexShrink:0}}>{initial}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{g.name}</span>
                  {isIn&&<span style={{fontSize:8,fontWeight:700,color:"#4ade80",background:"rgba(74,222,128,.1)",padding:"1px 6px",borderRadius:9,fontFamily:"var(--fb)"}}>✓ IN</span>}
                </div>
                <div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)"}}>{g.table} · Party of {g.party}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:g.paid>0?"var(--gold)":"rgba(255,255,255,.2)",fontFamily:"var(--fb)"}}>{g.paid>0?`$${g.paid}`:"-"}</div>
                <div style={{fontSize:9,background:sc[g.status]||sc.pending,color:tc[g.status]||tc.pending,padding:"2px 7px",borderRadius:9,marginTop:2,fontFamily:"var(--fb)",fontWeight:600}}>{isIn?"checked in":g.status}</div>
              </div>
            </div>
            {g.status==="confirmed"&&!isIn&&(
              <div style={{marginTop:9,paddingTop:9,borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",gap:7}}>
                <button className="press" onClick={()=>handleCheckIn(g.id)} style={{flex:1,padding:"7px",borderRadius:9,border:"none",fontFamily:"var(--fb)",fontSize:11,fontWeight:700,cursor:"pointer",background:"rgba(74,222,128,.18)",color:"#4ade80"}}>
                  Check In
                </button>
                <button className="press" style={{flex:1,padding:"7px",borderRadius:9,border:"1px solid rgba(255,255,255,.09)",background:"transparent",color:"rgba(255,255,255,.35)",fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Message</button>
              </div>
            )}
          </ProCard>
        );})}
      </div>
    </div>
  );
}

function ProLinks({pd}){
  const {links}=pd;
  const [copied,setCopied]=useState(null);
  const [copyErr,setCopyErr]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [newLabel,setNewLabel]=useState("");
  const [creating,setCreating]=useState(false);
  const copy=async(id,url)=>{
    const ok=await copyToClipboard(url);
    if(ok){setCopied(id);setTimeout(()=>setCopied(null),2000);}
    else{setCopyErr(id);setTimeout(()=>setCopyErr(null),2500);}
  };
  const createLink=async()=>{
    if(!newLabel.trim()||creating)return;
    setCreating(true);
    try{
      await edgeCall("create-promoter-link",{label:newLabel.trim(),venue_id:pd.venues[0]?.id||null});
      setNewLabel("");setShowNew(false);
      pd.refresh(); // reload data
    }catch{}
    setCreating(false);
  };
  const [qr,setQr]=useState(null);
  if(qr) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",animation:"scaleIn .25s cubic-bezier(.16,1,.3,1) both"}}>
      <div style={{padding:"10px 18px 12px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0}}>
        <button onClick={()=>setQr(null)} className="press"
          style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white"}}>‹</button>
        <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white"}}>QR Code</div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 28px"}}>
        <div style={{background:"white",borderRadius:20,padding:18,marginBottom:18,boxShadow:"0 8px 40px rgba(0,0,0,.4)"}}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://${qr.url}&margin=0&color=0a0a0a`}
            alt="QR Code" width={220} height={220} style={{display:"block",borderRadius:4}}/>
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:4,textAlign:"center"}}>{qr.label}</div>
        <div style={{fontSize:12,color:P.sub,fontFamily:"var(--fb)",marginBottom:6}}>{qr.url}</div>
        <div style={{background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.25)",borderRadius:10,
          padding:"5px 14px",fontSize:11,color:"var(--gold)",fontFamily:"var(--fb)",fontWeight:700}}>
          {qr.clicks} scans · {qr.conv} booked
        </div>
      </div>
    </div>
  );
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white",marginBottom:13}}>Invite Links</div>
        <button className="press" onClick={()=>setShowNew(!showNew)} style={{width:"100%",padding:"11px",background:"var(--gold)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer",marginBottom:12}}>+ Create New Link</button>
        {showNew&&(
          <ProCard style={{padding:"13px 14px",marginBottom:12}}>
            <div style={{fontSize:10,color:P.sub,fontWeight:600,fontFamily:"var(--fb)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Label</div>
            <input value={newLabel} onChange={e=>setNewLabel(sanitize(e.target.value,80))} maxLength={80} placeholder="e.g. Noir - Sat Mar 8"
              onKeyDown={e=>e.key==="Enter"&&createLink()}
              style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"8px 11px",color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none",marginBottom:10}}/>
            <button className="press" onClick={createLink} disabled={creating||!newLabel.trim()} style={{width:"100%",padding:"10px",background:"var(--gold)",color:"white",border:"none",borderRadius:11,fontSize:12,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer",marginTop:4,opacity:creating?.5:1}}>{creating?"Creating...":"Generate Link"}</button>
          </ProCard>
        )}
        <div style={{fontSize:10,fontWeight:600,color:P.sub,fontFamily:"var(--fb)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:9}}>Active Links</div>
        <div style={{display:"flex",flexDirection:"column",gap:9,paddingBottom:90}}>
          {links.length===0&&<div style={{textAlign:"center",padding:"30px 20px"}}><div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)"}}>No links yet. Create one above!</div></div>}
          {links.map(l=>{
            const cvr=l.clicks>0?Math.round((l.conv/l.clicks)*100):0;
            return(
              <ProCard key={l.id} style={{padding:"13px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                  <div><div style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:2}}>{l.label}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l.url}</div></div>
                  <div style={{width:7,height:7,borderRadius:"50%",background:"#4ade80",marginTop:4,flexShrink:0}}/>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  {[[l.clicks,"clicks"],[l.conv,"booked"],[cvr+"%","CVR"]].map(([v,lbl])=>(
                    <div key={lbl} style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:8,padding:"7px 5px",textAlign:"center"}}>
                      <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:700,color:"white"}}>{v}</div>
                      <div style={{fontSize:8,color:P.sub,fontFamily:"var(--fb)"}}>{lbl}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:7}}>
                  <button className="press" onClick={()=>setQr(l)}
                    style={{padding:"8px 12px",background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.25)",color:"var(--gold)",borderRadius:9,fontSize:11,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer"}}>QR</button>
                  <button className="press" onClick={()=>copy(l.id,l.url)} style={{flex:1,padding:"8px",background:copyErr===l.id?"#ef4444":"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:9,fontSize:11,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer"}}>{copied===l.id?"✓ Copied!":copyErr===l.id?"Failed":"📋 Copy"}</button>
                  <button className="press" style={{flex:1,padding:"8px",background:"transparent",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.5)",borderRadius:9,fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>↗ Share</button>
                </div>
              </ProCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProAnalytics({pd}){
  const {links,stats,dailyClicks}=pd;
  const bars=dailyClicks;
  const mx=Math.max(...bars,1);
  const tc=stats.total_clicks;
  const tv=stats.total_conversions;
  const cvr=tc>0?Math.round(tv/tc*100):0;
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white",marginBottom:13}}>Analytics</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
          {[[tc,"Clicks","🔗"],[tv,"Booked","✅"],[cvr+"%","CVR","📈"]].map(([v,l,ic])=>(
            <ProCard key={l} style={{padding:"11px 9px",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:3}}>{ic}</div>
              <div style={{fontFamily:"var(--fd)",fontSize:19,fontWeight:700,color:"white"}}>{v}</div>
              <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginTop:1}}>{l}</div>
            </ProCard>
          ))}
        </div>
        <ProCard style={{padding:"13px 14px",marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:P.sub,fontFamily:"var(--fb)",letterSpacing:".06em",textTransform:"uppercase",marginBottom:12}}>Daily Clicks - This Week</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:5,height:80,marginBottom:6}}>
            {bars.map((v,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:7,color:P.sub,fontFamily:"var(--fb)"}}>{v}</div>
                <div style={{width:"100%",background:i===6?"var(--gold)":"rgba(201,168,76,.22)",borderRadius:"3px 3px 0 0",height:`${(v/mx)*58}px`}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:5}}>{["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{d}</div>)}</div>
        </ProCard>
        <div style={{fontSize:10,fontWeight:600,color:P.sub,fontFamily:"var(--fb)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>Per Link</div>
        <div style={{paddingBottom:90}}>
          {links.map(l=>{
            const lcvr=l.clicks>0?Math.round((l.conv/l.clicks)*100):0;
            const pct=tc>0?Math.round((l.clicks/tc)*100):0;
            return(
              <ProCard key={l.id} style={{padding:"11px 13px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{l.label}</span>
                  <span style={{fontSize:11,color:"var(--gold)",fontFamily:"var(--fd)",fontWeight:700}}>{lcvr}% CVR</span>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,.07)",borderRadius:3,marginBottom:7,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:"var(--gold)",borderRadius:3}}/></div>
                <div style={{display:"flex",gap:13}}>{[[l.clicks,"Clicks"],[l.conv,"Booked"],[lcvr+"%","CVR"]].map(([v,lbl])=><div key={lbl}><span style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fd)"}}>{v}</span><span style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginLeft:3}}>{lbl}</span></div>)}</div>
              </ProCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProPayouts({pd}){
  const {payouts,stats}=pd;
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white",marginBottom:13}}>Payouts</div>
        <ProCard style={{padding:"17px 18px",marginBottom:12,background:"linear-gradient(135deg,rgba(201,168,76,.18),rgba(201,168,76,.05))"}}>
          <div style={{fontSize:9,color:"rgba(201,168,76,.65)",fontWeight:700,fontFamily:"var(--fb)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Total Earned</div>
          <div style={{fontFamily:"var(--fd)",fontSize:36,fontWeight:700,color:"white",lineHeight:1,marginBottom:10}}>${stats.earned}</div>
          <div style={{display:"flex",gap:16,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.08)"}}>
            <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"#fbbf24"}}>${stats.pending}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>Pending</div></div>
            <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--gold)"}}>15%</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>Commission rate</div></div>
          </div>
        </ProCard>
        {stats.pending>0&&<button className="press" style={{width:"100%",padding:"11px",background:"var(--gold)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer",marginBottom:12}}>Request Payout - ${stats.pending}</button>}
        <div style={{fontSize:10,fontWeight:600,color:P.sub,fontFamily:"var(--fb)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:9}}>History</div>
        <div style={{paddingBottom:90}}>
          {payouts.length===0&&<div style={{textAlign:"center",padding:"30px 20px"}}><div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)"}}>No payouts yet. Earnings appear after guests book.</div></div>}
          {payouts.map((p,i)=>(
            <ProCard key={i} style={{padding:"12px 13px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,paddingRight:9}}><div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:2}}>{p.event}</div><div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)"}}>Gross ${p.gross} · 15%</div></div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:p.status==="paid"?"var(--gold)":"#fbbf24"}}>${p.comm}</div><div style={{fontSize:9,color:p.status==="paid"?"#4ade80":"#fbbf24",fontFamily:"var(--fb)",fontWeight:700,marginTop:2}}>{p.status==="paid"?"✓ Paid":"⏳ Pending"}</div></div>
              </div>
            </ProCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProMessages({pd}){
  const {conversations}=pd;
  const [open,setOpen]=useState(null);
  const [msg,setMsg]=useState("");
  const [threads,setThreads]=useState(conversations);
  const ref=useRef(null);
  // Sync when pd updates
  useEffect(()=>{setThreads(conversations);},[conversations]);
  useEffect(()=>{if(ref.current) ref.current.scrollTop=ref.current.scrollHeight;},[open,threads]);
  const send=async()=>{
    const clean=sanitize(msg,500);
    if(!clean||!msgRateLimit())return;
    // Optimistic update
    setThreads(ts=>ts.map(c=>c.id===open?{...c,last:clean,unread:0,messages:[...c.messages,{mine:true,body:clean,created_at:new Date().toISOString(),read:false}]}:c));
    setMsg("");
    // Send to server
    try{ await edgeCall("send-message",{receiver_id:open,body:clean}); }catch{}
  };
  if(open){
    const conv=threads.find(c=>c.id===open);
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)"}}>
        <div style={{padding:"8px 18px 10px",display:"flex",alignItems:"center",gap:9,borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0}}>
          <button className="press" onClick={()=>setOpen(null)} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white"}}>‹</button>
          <div style={{width:33,height:33,borderRadius:"50%",background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--gold)",fontFamily:"var(--fd)"}}>{(conv.name||"G")[0].toUpperCase()}</div>
          <div><div style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{conv.name}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>Guest</div></div>
        </div>
        <div ref={ref} className="scroll" style={{flex:1,overflowY:"auto",padding:"13px 17px",display:"flex",flexDirection:"column",gap:8}}>
          {conv.messages.map((m,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.mine?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"78%",background:m.mine?"var(--gold)":"rgba(255,255,255,.08)",color:"white",padding:"8px 11px",borderRadius:m.mine?"13px 13px 3px 13px":"13px 13px 13px 3px",fontSize:12,fontFamily:"var(--fb)",lineHeight:1.5}}>{m.body}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 16px 18px",borderTop:"1px solid rgba(255,255,255,.1)",
          display:"flex",gap:8,flexShrink:0,background:"var(--pro)"}}>
          <input value={msg} onChange={e=>setMsg(sanitize(e.target.value,500))}
            onKeyDown={e=>e.key==="Enter"&&send()} maxLength={500} placeholder="Type a message..."
            style={{flex:1,background:"rgba(255,255,255,.11)",border:"1.5px solid rgba(255,255,255,.18)",
              borderRadius:22,padding:"10px 16px",color:"white",fontSize:13,fontFamily:"var(--fb)",
              outline:"none",caretColor:"var(--gold)"}}/>
          <button className="press" onClick={send}
            style={{width:42,height:42,borderRadius:"50%",background:msg.trim()?"var(--gold)":"rgba(255,255,255,.1)",
              border:"none",color:msg.trim()?"#0a0a0a":"rgba(255,255,255,.3)",fontSize:17,
              cursor:"pointer",flexShrink:0,transition:"all .2s"}}>↑</button>
        </div>
      </div>
    );
  }
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white",marginBottom:13}}>Messages</div>
        <div style={{paddingBottom:90}}>
          {threads.map(c=>(
            <div key={c.id} className="press" onClick={()=>setOpen(c.id)} style={{display:"flex",gap:11,padding:"12px 13px",borderBottom:"1px solid rgba(255,255,255,.05)",alignItems:"center"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--gold)",fontFamily:"var(--fd)"}}>{(c.name||"G")[0].toUpperCase()}</div>
                {c.unread>0&&<div style={{position:"absolute",top:-2,right:-2,width:15,height:15,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{c.unread}</div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{c.name}</span><span style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{c.time}</span></div>
                <div style={{fontSize:11,color:c.unread>0?"rgba(255,255,255,.6)":"rgba(255,255,255,.28)",fontFamily:"var(--fb)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:c.unread>0?500:400}}>{c.last}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableRow({t,onChange}){
  const [raw,setRaw]=useState(String(t.min));
  const parsed=Number(raw);
  const earn=raw&&parsed>=20?Math.round(parsed*.15):null;
  return(
    <ProCard style={{padding:"13px 14px",marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:t.on?10:0}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{t.name}</div>
          <div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)",marginTop:1}}>👥 {t.cap}</div>
        </div>
        <button onClick={()=>onChange({...t,on:!t.on})} className="press"
          style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
            background:t.on?"var(--gold)":"rgba(255,255,255,.1)",position:"relative",transition:"all .2s",flexShrink:0}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,transition:"all .2s",left:t.on?23:3}}/>
        </button>
      </div>
      {t.on&&(
        <div>
          <div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)",marginBottom:5}}>Minimum spend</div>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{fontSize:15,color:P.sub,fontFamily:"var(--fb)"}}>$</span>
            <input
              type="number" value={raw} min={20} max={5000}
              onChange={e=>{
                setRaw(e.target.value);
                const v=Number(e.target.value);
                if(v>=20&&v<=5000) onChange({...t,min:v});
              }}
              onBlur={()=>{
                const v=Math.min(5000,Math.max(20,Number(raw)||20));
                setRaw(String(v));
                onChange({...t,min:v});
              }}
              style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.15)",
                borderRadius:10,padding:"8px 11px",color:"white",fontSize:16,
                fontFamily:"var(--fd)",fontWeight:700,outline:"none"}}/>
            <div style={{textAlign:"right",minWidth:72}}>
              {earn!=null?(
                <>
                  <div style={{fontSize:13,color:"var(--gold)",fontFamily:"var(--fb)",fontWeight:700,
                    animation:"fadeIn .15s ease both"}}>+${earn}</div>
                  <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>you earn</div>
                </>
              ):<span style={{fontSize:10,color:"rgba(255,255,255,.2)",fontFamily:"var(--fb)"}}>-</span>}
            </div>
          </div>
          {raw&&parsed>=20&&(
            <div style={{marginTop:8,padding:"7px 10px",background:"rgba(201,168,76,.07)",
              border:"1px solid rgba(201,168,76,.15)",borderRadius:9,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)"}}>Guest pays</span>
              <span style={{fontSize:11,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>
                ${parsed} min → you keep ${earn} <span style={{color:"var(--gold)"}}>(15%)</span>
              </span>
            </div>
          )}
        </div>
      )}
    </ProCard>
  );
}

function ProPricing(){
  const [tables,setTables]=useState([
    {id:1,name:"Standard Booth",cap:"2-4",min:85,on:true},
    {id:2,name:"VIP Booth",cap:"4-8",min:153,on:true},
    {id:3,name:"Bottle Table",cap:"6-12",min:255,on:false},
  ]);
  const [saved,setSaved]=useState(false);
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 90px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white",marginBottom:13}}>Pricing</div>
        <ProCard style={{padding:"11px 13px",marginBottom:12}}>
          <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)",lineHeight:1.65}}>
            You earn <span style={{color:"var(--gold)",fontWeight:700}}>15%</span> on all minimums booked through your links.
            Total potential: <span style={{color:"white",fontWeight:700}}>${tables.filter(t=>t.on).reduce((s,t)=>s+Math.round(t.min*.15),0)}/booking</span>
          </div>
        </ProCard>
        {tables.map(t=>(
          <TableRow key={t.id} t={t} onChange={updated=>setTables(ts=>ts.map(x=>x.id===updated.id?updated:x))}/>
        ))}
        <button className="press" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}}
          style={{width:"100%",padding:"13px",background:saved?"rgba(201,168,76,.2)":"var(--gold)",
            color:saved?"var(--gold)":"#0a0a0a",border:saved?"1px solid var(--gold)":"none",
            borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer",
            transition:"all .3s",marginTop:4}}>
          {saved?"✓ Saved!":"Save Pricing"}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------- Promoter data ---------------------------------------------
const PROMOTERS = [
  // ----------------------------------------------- Miami -------------------------------------------------
  {id:1,name:'Jordan Voss',handle:'@jordanvoss',avatar:'J',city:'Miami . South Beach',region:'Miami',rating:4.9,reviews:214,bookings:1840,followers:'12.4k',bio:"Miami's top rooftop & pool promoter. VIP access guaranteed.",verified:true,
   specialties:['Rooftop','Pool Party','Bottle Service'],venues:['Noir Rooftop','Soleil Pool Club','Azure Terrace'],
   deals:[{id:1,label:'10% off VIP Booths',code:'JORDAN10',expiry:'Mar 14'},{id:2,label:'Free entry + priority queue',code:'VJFREE',expiry:'Mar 7'}],
   events:[{id:1,venue:'Noir Rooftop',date:'Fri Mar 7',spots:3,img:'https://picsum.photos/id/1039/400/264'},{id:2,venue:'Soleil Pool Club',date:'Sat Mar 8',spots:8,img:'https://picsum.photos/id/316/400/264'}],
   feedbacks:[{name:'Marco R.',stars:5,text:'Jordan got us the best booth - no wait, great service.'},{name:'Aisha T.',stars:5,text:'Booked through his link, seamless. Will use again.'}]},
  {id:2,name:'Mia Reyes',handle:'@miareyes',avatar:'M',city:'Miami . Wynwood',region:'Miami',rating:4.8,reviews:187,bookings:1320,followers:'8.9k',bio:'Wynwood nightlife curator. Underground, authentic, always lit.',verified:true,
   specialties:['Nightclub','DJ Nights','Afrobeats'],venues:['Velvet Underground','Obsidian Club'],
   deals:[{id:1,label:'$20 off Bottle Tables',code:'MIA20',expiry:'Mar 14'}],
   events:[{id:1,venue:'Velvet Underground',date:'Fri Mar 14',spots:12,img:'https://picsum.photos/id/26/400/264'}],
   feedbacks:[{name:'Priya S.',stars:5,text:'Mia knows every bouncer in Wynwood. Walked right in.'},{name:'Tyler W.',stars:4,text:'Great vibe curation, smaller crew which is nice.'}]},
  {id:3,name:'Dante Cruz',handle:'@dantecruz',avatar:'D',city:'Miami . Brickell',region:'Miami',rating:4.7,reviews:98,bookings:720,followers:'5.2k',bio:"Brickell's go-to for upscale lounges and cocktail experiences.",verified:false,
   specialties:['Lounge','Cocktails','Business'],venues:['Azure Terrace'],
   deals:[{id:1,label:'Complimentary welcome cocktail',code:'DANTE1ST',expiry:'Mar 31'}],
   events:[{id:1,venue:'Azure Terrace',date:'Sat Mar 8',spots:4,img:'https://picsum.photos/id/371/400/264'}],
   feedbacks:[{name:'Sofia L.',stars:5,text:'Perfect for a corporate night out. Very professional.'},{name:'Raj M.',stars:4,text:'Azure Terrace through Dante was an amazing experience.'}]},
  {id:4,name:'Zara Hunt',handle:'@zarahunt',avatar:'Z',city:'Miami . South Beach',region:'Miami',rating:4.9,reviews:305,bookings:2100,followers:'22k',bio:'Top 1% promoter on Luma. Pool parties, beach clubs, A-list energy.',verified:true,
   specialties:['Pool Party','Dayclub','Celebrity Events'],venues:['Soleil Pool Club','Noir Rooftop'],
   deals:[{id:1,label:'Cabana upgrade for 4+',code:'ZARAUP',expiry:'Mar 8'},{id:2,label:'Early bird access - save $40',code:'ZARAEARLY',expiry:'Mar 8'}],
   events:[{id:1,venue:'Soleil Pool Club',date:'Sat Mar 8',spots:2,img:'https://picsum.photos/id/429/400/264'}],
   feedbacks:[{name:'Bianca R.',stars:5,text:"Zara's connections are insane. Best pool day of my life."},{name:'Chris D.',stars:5,text:"Got upgraded to a cabana at Soleil - didn't even ask for it."}]},
  {id:5,name:'Rico Flames',handle:'@ricoflames',avatar:'R',city:'Miami . Little Havana',region:'Miami',rating:4.8,reviews:143,bookings:980,followers:'7.1k',bio:'Latin nights specialist. Salsa, reggaeton, fire lineups every weekend.',verified:true,
   specialties:['Latin Nights','Reggaeton','DJ Events'],venues:['Obsidian Club','Velvet Underground'],
   deals:[{id:1,label:'Ladies free before midnight',code:'RICOLADIES',expiry:'Mar 14'},{id:2,label:'Group of 6+ - 1 free bottle',code:'RICO6UP',expiry:'Mar 21'}],
   events:[{id:1,venue:'Obsidian Club',date:'Sat Mar 15',spots:20,img:'https://picsum.photos/id/289/400/264'}],
   feedbacks:[{name:'Isabella M.',stars:5,text:'Rico throws the best Latin nights in Miami, no debate.'},{name:'Carlos V.',stars:5,text:'Got a free bottle for our group. Insane deal.'}]},
  {id:6,name:'Serena Vale',handle:'@serenavale',avatar:'S',city:'Miami . Coconut Grove',region:'Miami',rating:4.6,reviews:89,bookings:540,followers:'4.4k',bio:'Curated luxury experiences. Intimate, high-end, exclusive.',verified:false,
   specialties:['Luxury','Lounge','Private Events'],venues:['Azure Terrace','Noir Rooftop'],
   deals:[{id:1,label:'15% off for first-time bookings',code:'SERENANEW',expiry:'Mar 31'}],
   events:[{id:1,venue:'Azure Terrace',date:'Fri Mar 14',spots:6,img:'https://picsum.photos/id/342/400/264'}],
   feedbacks:[{name:'Amanda F.',stars:5,text:"Serena's events feel like private members clubs. Love it."},{name:'James K.',stars:4,text:'Very attentive, remembered our preferences from last time.'}]},
  {id:7,name:'Marcus Gold',handle:'@marcusgold',avatar:'G',city:'Miami . Downtown',region:'Miami',rating:4.7,reviews:201,bookings:1450,followers:'9.8k',bio:'Downtown Miami most connected promoter. Hip-hop, EDM, all genres.',verified:true,
   specialties:['Hip-Hop','EDM','Bottle Service'],venues:['Obsidian Club','Velvet Underground','Noir Rooftop'],
   deals:[{id:1,label:'$50 off tables over $500 min',code:'MGOLD50',expiry:'Mar 21'}],
   events:[{id:1,venue:'Noir Rooftop',date:'Fri Mar 21',spots:7,img:'https://picsum.photos/id/43/400/264'}],
   feedbacks:[{name:'Devon R.',stars:5,text:'Marcus delivered exactly what he promised. No BS.'},{name:'Tasha M.',stars:4,text:'Good connections, tables were ready when we arrived.'}]},
  // ----------------------------------------------- New York ----------------------------------------------
  {id:8,name:'Kai Montrose',handle:'@kaimontrose',avatar:'K',city:'New York . Meatpacking',region:'New York',rating:4.9,reviews:388,bookings:2900,followers:'31k',bio:'NYC #1 Meatpacking promoter. 10 years, zero bad nights.',verified:true,
   specialties:['Nightclub','VIP Tables','Celebrity Events'],venues:['Marquee NY','1 OAK','Catch Rooftop'],
   deals:[{id:1,label:'Skip the line + free first round',code:'KAINYC',expiry:'Mar 14'},{id:2,label:'$100 off VIP tables Fri/Sat',code:'KAI100',expiry:'Mar 21'}],
   events:[{id:1,venue:'Marquee NY',date:'Sat Mar 8',spots:4,img:'https://picsum.photos/id/444/400/264'},{id:2,venue:'1 OAK',date:'Fri Mar 14',spots:8,img:'https://picsum.photos/id/392/400/264'}],
   feedbacks:[{name:'Nicole T.',stars:5,text:'Kai is the real deal in NYC. Zero wait, amazing table.'},{name:'Brandon S.',stars:5,text:'Been using Kai for 3 years. Never disappointed once.'}]},
  {id:9,name:'Anya Volkov',handle:'@anyavolkov',avatar:'A',city:'New York . Lower East Side',region:'New York',rating:4.8,reviews:267,bookings:1760,followers:'14.2k',bio:'LES underground queen. Techno, house, the real NYC nightlife.',verified:true,
   specialties:['Techno','House','Underground'],venues:['Good Room','Elsewhere','Output'],
   deals:[{id:1,label:'Guest list + 1 - Fri/Sat',code:'ANYAGL',expiry:'Mar 14'}],
   events:[{id:1,venue:'Good Room',date:'Sat Mar 8',spots:15,img:'https://picsum.photos/id/1039/400/264'}],
   feedbacks:[{name:'Felix H.',stars:5,text:'Anya literally knows every DJ in the city. Magic nights.'},{name:'Sam P.',stars:5,text:'She got us into a sold-out show.'}]},
  {id:10,name:'Tyler Banks',handle:'@tylerbanks',avatar:'T',city:'New York . Midtown',region:'New York',rating:4.7,reviews:198,bookings:1340,followers:'10.5k',bio:'Midtown & rooftop specialist. Corporate events, bachelor parties, groups.',verified:true,
   specialties:['Rooftop','Corporate','Groups'],venues:['Skylark','230 Fifth','The Press Lounge'],
   deals:[{id:1,label:'Group of 8+ - priority seating',code:'TBANKS8',expiry:'Mar 31'},{id:2,label:'Complimentary welcome bottle',code:'TBWELCOME',expiry:'Mar 14'}],
   events:[{id:1,venue:'Skylark',date:'Fri Mar 7',spots:10,img:'https://picsum.photos/id/316/400/264'}],
   feedbacks:[{name:'Rachel K.',stars:5,text:'Tyler organized our bachelorette perfectly. 10/10.'},{name:'David L.',stars:4,text:'Great rooftop access, handled everything professionally.'}]},
  {id:11,name:'Priya Sharma',handle:'@priyasharma',avatar:'P',city:'New York . Brooklyn',region:'New York',rating:4.8,reviews:156,bookings:890,followers:'6.8k',bio:'Brooklyn-based. Afrobeats, Amapiano, Dancehall. Authentic culture first.',verified:false,
   specialties:['Afrobeats','Amapiano','Dancehall'],venues:['Avant Gardner','Nowadays','Schimanski'],
   deals:[{id:1,label:'Free entry before 11PM',code:'PRIYAEARLY',expiry:'Mar 14'}],
   events:[{id:1,venue:'Avant Gardner',date:'Sat Mar 15',spots:18,img:'https://picsum.photos/id/26/400/264'}],
   feedbacks:[{name:'Zoe A.',stars:5,text:'Priya brought the whole Brooklyn scene together. Incredible.'},{name:'Mark B.',stars:4,text:'Loved the music curation, very authentic vibe.'}]},
  {id:12,name:'Dex Harlow',handle:'@dexharlow',avatar:'H',city:'New York . Chelsea',region:'New York',rating:4.9,reviews:421,bookings:3200,followers:'28k',bio:'15 years in NYC nightlife. Connected everywhere. Results guaranteed.',verified:true,
   specialties:['Hip-Hop','R&B','Celebrity Nights'],venues:['1 OAK','PhD Rooftop','Tao Downtown'],
   deals:[{id:1,label:'VIP wristband + no cover',code:'DEXVIP',expiry:'Mar 7'},{id:2,label:'Table for 4 - $200 off minimum',code:'DEX200',expiry:'Mar 14'}],
   events:[{id:1,venue:'1 OAK',date:'Fri Mar 7',spots:3,img:'https://picsum.photos/id/371/400/264'},{id:2,venue:'Tao Downtown',date:'Sat Mar 8',spots:5,img:'https://picsum.photos/id/429/400/264'}],
   feedbacks:[{name:'Jasmine W.',stars:5,text:'Dex is a legend. Been using him for 5 years straight.'},{name:'Chris M.',stars:5,text:'Got into a sold-out R&B night. VIP treatment start to finish.'}]},
  {id:13,name:'Luna Park',handle:'@lunapark',avatar:'L',city:'New York . SoHo',region:'New York',rating:4.6,reviews:112,bookings:670,followers:'5.9k',bio:'SoHo art crowd, fashion week events, editorial nightlife curation.',verified:false,
   specialties:['Fashion','Art Crowd','Editorial Events'],venues:['Electric Room','Le Bain','Boom Boom Room'],
   deals:[{id:1,label:'Fashion week special - 20% off tables',code:'LUNAFW',expiry:'Mar 14'}],
   events:[{id:1,venue:'Le Bain',date:'Sat Mar 8',spots:6,img:'https://picsum.photos/id/289/400/264'}],
   feedbacks:[{name:'Emma V.',stars:5,text:"Luna's events are the ones fashion week editors actually go to."},{name:'Tom R.',stars:4,text:'Very curated, exclusive feel. Worth every penny.'}]},
];

// ----------------------------------------------- Security helpers ------------------------------------------
// Sanitize user text input: strip tags, limit length, trim
function sanitize(str, maxLen=500){
  if(typeof str!=="string") return "";
  return str.replace(/<[^>]*>/g,"").replace(/[<>]/g,"").trim().slice(0,maxLen);
}

// Safe clipboard with text fallback
async function copyToClipboard(text){
  const safe=sanitize(text,200);
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(safe);
      return true;
    }
    // Fallback for HTTP / older browsers
    const ta=document.createElement("textarea");
    ta.value=safe; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok=document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }catch{return false;}
}

// Rate limiter - returns true if allowed, false if throttled
function makeRateLimit(minMs=800){
  let last=0;
  return ()=>{const now=Date.now();if(now-last<minMs)return false;last=now;return true;};
}
const msgRateLimit=makeRateLimit(800);

function DealCard({deal}){
  const [copied,setCopied]=useState(false);
  const [err,setErr]=useState(false);
  const handleCopy=async()=>{
    const ok=await copyToClipboard(deal.code);
    if(ok){setCopied(true);setTimeout(()=>setCopied(false),2000);}
    else{setErr(true);setTimeout(()=>setErr(false),2500);}
  };
  return(
    <div style={{background:"linear-gradient(135deg,rgba(201,168,76,.09),rgba(201,168,76,.03))",border:"1px solid rgba(201,168,76,.2)",borderRadius:16,padding:"14px 15px",marginBottom:10}}>
      <div style={{fontFamily:"var(--fb)",fontSize:13,fontWeight:700,color:"var(--ink)",marginBottom:4}}>{deal.label}</div>
      <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:10}}>Valid until {deal.expiry} . Use at checkout</div>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{flex:1,background:"var(--white)",border:"1px dashed rgba(201,168,76,.4)",borderRadius:9,padding:"8px 12px",fontFamily:"var(--fd)",fontSize:16,fontWeight:700,letterSpacing:".08em",color:"var(--ink)"}}>{deal.code}</div>
        <button className="press" onClick={handleCopy} style={{padding:"8px 14px",background:err?"#ef4444":"var(--gold)",color:"white",border:"none",borderRadius:9,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer",flexShrink:0,transition:"background .2s"}}>{copied?"✓":err?"Failed":"Copy"}</button>
      </div>
      {err&&<div style={{fontSize:9,color:"#ef4444",fontFamily:"var(--fb)",marginTop:5}}>Copy failed - please copy the code manually.</div>}
    </div>
  );
}

// ----------------------------------------------- Promoters Directory ----------------------------------------
function PromotersDir({goPromoter}){
  const [q,setQ]=useState("");
  const [sort,setSort]=useState("Top Rated");
  const [region,setRegion]=useState("All");
  const list=PROMOTERS
    .filter(p=>region==="All"||p.region===region)
    .filter(p=>!q||[p.name,p.handle,p.city,...p.specialties].some(x=>x.toLowerCase().includes(q.toLowerCase().trim())))
    .sort((a,b)=>sort==="Top Rated"?b.rating-a.rating:b.bookings-a.bookings);
  const miamiCount=PROMOTERS.filter(p=>p.region==="Miami").length;
  const nyCount=PROMOTERS.filter(p=>p.region==="New York").length;
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--bg)"}}>
      {/* Hero banner */}
      <div style={{background:"var(--ink)",padding:"18px 18px 14px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,background:"radial-gradient(circle,rgba(201,168,76,.18),transparent)",borderRadius:"50%"}}/>
        <div style={{fontSize:9,color:"rgba(255,255,255,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:4}}>Luma Promoters</div>
        <div style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:700,color:"white",marginBottom:3}}>Book through the pros.</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.45)",fontFamily:"var(--fb)",lineHeight:1.55,marginBottom:12}}>Exclusive deals, skip queues, access events before sellout.</div>
        {/* Region pills */}
        <div style={{display:"flex",gap:7}}>
          {[["All",PROMOTERS.length],["Miami",miamiCount],["New York",nyCount]].map(([r,ct])=>(
            <button key={r} onClick={()=>setRegion(r)} className="press" style={{padding:"5px 12px",borderRadius:18,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",transition:"all .15s",background:region===r?"white":"rgba(255,255,255,.1)",borderColor:region===r?"white":"rgba(255,255,255,.2)",color:region===r?"var(--ink)":"rgba(255,255,255,.65)"}}>
              {r==="All"?"🌎":r==="Miami"?"🌴":"🗽"} {r} <span style={{opacity:.6,fontSize:9}}>{ct}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"12px 18px 6px"}}>
        {/* Search */}
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:13,padding:"10px 14px",display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={q} onChange={e=>setQ(sanitize(e.target.value,80))} maxLength={80} placeholder="Search by name, venue, vibe..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:"var(--ink)",fontSize:13,fontFamily:"var(--fb)"}}/>
          {q&&<span className="press" onClick={()=>setQ("")} style={{fontSize:11,color:"var(--dim)"}}>✕</span>}
        </div>
        {/* Sort */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {["Top Rated","Most Booked"].map(s=>(
            <button key={s} onClick={()=>setSort(s)} className="press" style={{padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:600,fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",background:sort===s?"var(--ink)":"transparent",borderColor:sort===s?"var(--ink)":"var(--line2)",color:sort===s?"white":"var(--ink2)"}}>{s}</button>
          ))}
        </div>

        {/* Featured */}
        {!q&&(
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"var(--ink)",marginBottom:10}}>⭐ Featured</div>
            <div style={{display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none",marginLeft:-18,paddingLeft:18,marginRight:-18,paddingRight:18,paddingBottom:4}}>
              {PROMOTERS.filter(p=>p.verified).map(p=>(
                <div key={p.id} className="press" onClick={()=>goPromoter(p)} style={{flexShrink:0,width:155,background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,padding:"13px 12px",textAlign:"center"}}>
                  <div style={{position:"relative",display:"inline-block",marginBottom:8}}>
                    <div style={{width:52,height:52,borderRadius:"50%",background:"var(--ink)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"white",fontFamily:"var(--fd)",fontStyle:"italic"}}>{p.avatar}</div>
                    {p.verified&&<div style={{position:"absolute",bottom:0,right:0,width:16,height:16,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>✓</div>}
                  </div>
                  <div style={{fontFamily:"var(--fb)",fontSize:12,fontWeight:700,color:"var(--ink)",marginBottom:1}}>{p.name}</div>
                  <div style={{fontSize:9,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:7}}>{p.city} . {p.followers}</div>
                  <div style={{display:"flex",justifyContent:"center",gap:3,flexWrap:"wrap",marginBottom:8}}>
                    {p.specialties.slice(0,2).map(s=><span key={s} style={{fontSize:8,background:"var(--bg)",border:"1px solid var(--line)",borderRadius:9,padding:"2px 6px",fontFamily:"var(--fb)",fontWeight:600,color:"var(--ink2)"}}>{s}</span>)}
                  </div>
                  <div style={{fontSize:10,color:"var(--gold)",fontWeight:700,fontFamily:"var(--fb)"}}>⭐ {p.rating} . {p.reviews} reviews</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All list */}
        <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"var(--ink)",marginBottom:10}}>{q?"Results":"All Promoters"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:9,paddingBottom:90}}>
          {list.map(p=>(
            <div key={p.id} className="press" onClick={()=>goPromoter(p)} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,padding:"13px 14px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{position:"relative",flexShrink:0}}>
                <div style={{width:46,height:46,borderRadius:"50%",background:"var(--ink)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:700,color:"white",fontFamily:"var(--fd)",fontStyle:"italic"}}>{p.avatar}</div>
                {p.verified&&<div style={{position:"absolute",bottom:0,right:0,width:15,height:15,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>✓</div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontFamily:"var(--fb)",fontSize:13,fontWeight:700,color:"var(--ink)"}}>{p.name}</span>
                  <span style={{fontSize:9,color:"var(--sub)",fontFamily:"var(--fb)"}}>{p.handle}</span>
                </div>
                <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:5}}>📍 {p.city} . {p.followers} followers</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {p.specialties.slice(0,3).map(s=><span key={s} style={{fontSize:8,background:"var(--bg)",border:"1px solid var(--line)",borderRadius:9,padding:"2px 7px",fontFamily:"var(--fb)",fontWeight:600,color:"var(--ink2)"}}>{s}</span>)}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--ink)"}}>⭐ {p.rating}</div>
                <div style={{fontSize:9,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>{p.reviews} reviews</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------- Promoter Profile ------------------------------------------
function PromoterProfile({promoter,goBack,goVenue,goBookPromoter}){
  const [tab,setTab]=useState("events");
  const [msgOpen,setMsgOpen]=useState(false);
  const [exportOpen,setExportOpen]=useState(false);
  const [msgText,setMsgText]=useState("");
  const [msgs,setMsgs]=useState([{m:false,t:`Hey! I can get you into ${promoter.events[0]?.venue||"our next event"} this weekend. Interested? 🎉`}]);
  const [copied,setCopied]=useState(false);
  const [copyErr,setCopyErr]=useState(false);
  const msgRef=useRef(null);
  const profileRateLimit=useRef(makeRateLimit(800));
  useEffect(()=>{if(msgRef.current) msgRef.current.scrollTop=msgRef.current.scrollHeight;},[msgs,msgOpen]);

  const sendMsg=()=>{
    const clean=sanitize(msgText,500);
    if(!clean||!profileRateLimit.current())return;
    setMsgs(m=>[...m,{m:true,t:clean}]);
    setMsgText("");
    setTimeout(()=>setMsgs(m=>[...m,{m:false,t:"Perfect! I'll send you a link with early access pricing 🔥"}]),1200);
  };

  const handleShare=async()=>{
    const ok=await copyToClipboard(`luma.vip/p/${promoter.handle}`);
    if(ok){setCopied(true);setTimeout(()=>setCopied(false),2000);}
    else{setCopyErr(true);setTimeout(()=>setCopyErr(false),2500);}
  };

  // ----------------------------------------------- Social Export Modal ----------------------------------
  const profileUrl=`luma.vip/p/${promoter.handle}`;
  const caption=`🔥 Book with me on Luma for exclusive deals & VIP access.\n\n✦ ${promoter.specialties.join(' . ')}\n📍 ${promoter.city}\n⭐ ${promoter.rating} rating . ${promoter.bookings.toLocaleString()} bookings\n\n🔗 ${profileUrl}`;
  const igCaption=`🔥 VIP access, exclusive deals, no wait.\nBook through my Luma profile 🔗\n${profileUrl}\n.\n.\n#nightlife #${promoter.region==="Miami"?"miami":"nyc"}nightlife #viptable #promoter #luma`;

  const PLATFORMS=[
    {id:"instagram",label:"Instagram",color:"#E1306C",icon:"📸",
     hint:"Copy caption -> paste into IG bio/story",
     text:igCaption},
    {id:"twitter",label:"Twitter / X",color:"#000",icon:"✕",
     hint:"Ready-to-post tweet",
     text:`🔥 Book VIP tables & get exclusive deals through my @luma_vip profile\n\n${promoter.specialties.slice(0,2).join(' . ')} . ${promoter.city}\n⭐ ${promoter.rating} . ${promoter.bookings.toLocaleString()} bookings\n\n🔗 ${profileUrl}`},
    {id:"tiktok",label:"TikTok",color:"#010101",icon:"🎵",
     hint:"Copy for TikTok bio or video caption",
     text:`Book VIP tables through me 🔥 Link in bio\n${profileUrl}\n${promoter.specialties.join(' ')} #nightlife #vip`},
    {id:"whatsapp",label:"WhatsApp",color:"#25D366",icon:"💬",
     hint:"Send to your contact groups",
     text:`Hey! 👋 Book VIP tables & exclusive deals through my Luma profile:\n\n${profileUrl}\n\nI'm covering ${promoter.city} - ${promoter.specialties.join(', ')}. ⭐ ${promoter.rating} rating, ${promoter.bookings.toLocaleString()} happy guests.`},
    {id:"sms",label:"SMS / iMessage",color:"#34C759",icon:"📱",
     hint:"Text directly to your contacts",
     text:`Book VIP access through me on Luma 🎉 ${profileUrl}`},
    {id:"link",label:"Copy Profile Link",color:"var(--ink)",icon:"🔗",
     hint:"Direct link to your profile",
     text:profileUrl},
  ];

  const [platCopied,setPlatCopied]=useState(null);
  const [platErr,setPlatErr]=useState(null);
  const copyPlat=async(p)=>{
    const ok=await copyToClipboard(p.text);
    if(ok){setPlatCopied(p.id);setTimeout(()=>setPlatCopied(null),2000);}
    else{setPlatErr(p.id);setTimeout(()=>setPlatErr(null),2500);}
  };

  if(exportOpen) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--ink)",animation:"slideUp .35s cubic-bezier(.16,1,.3,1) both"}}>
      {/* Dark header */}
      <div style={{padding:"12px 18px 14px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button className="press" onClick={()=>setExportOpen(false)}
          style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.1)",
            border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",
            alignItems:"center",justifyContent:"center"}}>&#8249;</button>
        <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white"}}>Share Profile</div>
      </div>

      {/* Profile card */}
      <div style={{margin:"0 18px 18px",background:"linear-gradient(135deg,#1a1a2e,#12121e)",
        borderRadius:22,padding:"18px",border:"1px solid rgba(255,255,255,.08)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,
          background:"radial-gradient(circle,rgba(201,168,76,.2),transparent)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:14}}>
          <div style={{width:52,height:52,borderRadius:"50%",
            background:"linear-gradient(135deg,var(--gold),#8a6a20)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:20,fontWeight:700,color:"white",fontFamily:"var(--fd)",fontStyle:"italic",
            boxShadow:"0 4px 16px rgba(201,168,76,.35)",flexShrink:0}}>{promoter.avatar}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{fontSize:16,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{promoter.name}</div>
              {promoter.verified&&<span style={{fontSize:10,color:"var(--gold)"}}>&#10022;</span>}
            </div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"var(--fb)",marginTop:1}}>{promoter.handle} &middot; {promoter.city}</div>
          </div>
        </div>
        <div style={{display:"flex",borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:13}}>
          {[[promoter.rating+" ★","Rating"],[promoter.bookings.toLocaleString(),"Bookings"],[promoter.followers,"Followers"]].map(([v,l],i,a)=>(
            <div key={l} style={{flex:1,textAlign:"center",borderRight:i<a.length-1?"1px solid rgba(255,255,255,.07)":"none"}}>
              <div style={{fontSize:14,fontWeight:700,color:"white",fontFamily:"var(--fd)"}}>{v}</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,.3)",fontFamily:"var(--fb)",marginTop:1}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"0 18px 40px"}}>
        {/* Icon grid */}
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:".1em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:12}}>Share via</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:22}}>
          {[
            {icon:"📸",label:"IG Story",bg:"linear-gradient(135deg,#e1306c,#c13584)"},
            {icon:"𝕏",label:"Twitter",bg:"#000"},
            {icon:"🎵",label:"TikTok",bg:"#010101"},
            {icon:"💬",label:"WhatsApp",bg:"#25d366"},
            {icon:"📘",label:"Facebook",bg:"#1877f2"},
            {icon:"✈️",label:"Telegram",bg:"#0088cc"},
            {icon:"📋",label:"Copy Link",bg:"var(--gold)"},
            {icon:"⬆",label:"More",bg:"rgba(255,255,255,.1)"},
          ].map(s=>(
            <div key={s.label} onClick={()=>{
              const txt="Book VIP with me -> luma.vip/"+promoter.handle;
              if(navigator.clipboard) navigator.clipboard.writeText(txt).catch(()=>{});
            }} className="press"
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"}}>
              <div style={{width:56,height:56,borderRadius:18,
                background:s.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:22,boxShadow:"0 4px 16px rgba(0,0,0,.35)"}}>
                {s.icon}
              </div>
              <span style={{fontSize:9,color:"rgba(255,255,255,.4)",fontFamily:"var(--fb)",fontWeight:600,textAlign:"center",lineHeight:1.3}}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Caption presets */}
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.3)",letterSpacing:".1em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:10}}>Caption Presets</div>
        {[
          {lbl:"Short",txt:"Book through my Luma link -> luma.vip/"+promoter.handle+" 🔥"},
          {lbl:"Story",txt:"VIP access, no wait. Book through my profile 🔗 luma.vip/"+promoter.handle},
          {lbl:"Bio",txt:"📍 "+promoter.city.split(".")[0].trim()+" | Book VIP tables -> luma.vip/"+promoter.handle},
        ].map(c=>(
          <div key={c.lbl} className="press" onClick={()=>{
            if(navigator.clipboard) navigator.clipboard.writeText(c.txt).catch(()=>{});
            copyPlat({text:c.txt});
          }}
            style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",
              borderRadius:13,padding:"12px 14px",marginBottom:8,cursor:"pointer",
              display:"flex",alignItems:"flex-start",gap:11}}>
            <span style={{fontSize:9,background:"rgba(201,168,76,.15)",color:"var(--gold)",
              padding:"2px 8px",borderRadius:8,fontWeight:700,fontFamily:"var(--fb)",
              flexShrink:0,marginTop:1}}>{c.lbl}</span>
            <div style={{fontSize:11,color:"rgba(255,255,255,.5)",fontFamily:"var(--fb)",lineHeight:1.55,flex:1}}>{c.txt}</div>
            <div style={{fontSize:16,color:"rgba(255,255,255,.2)",flexShrink:0}}>&#x2398;</div>
          </div>
        ))}
      </div>
    </div>
  );

  if(msgOpen) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)"}}>
      <div style={{padding:"8px 18px 10px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--line)",flexShrink:0,background:"var(--white)"}}>
        <button className="press" onClick={()=>setMsgOpen(false)} style={{width:32,height:32,borderRadius:9,background:"transparent",border:"1.5px solid var(--line2)",cursor:"pointer",fontSize:16,color:"var(--ink)"}}>‹</button>
        <div style={{width:32,height:32,borderRadius:"50%",background:"var(--ink)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fd)",fontStyle:"italic"}}>{promoter.avatar}</div>
        <div><div style={{fontSize:13,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)"}}>{promoter.name}</div><div style={{fontSize:9,color:"var(--sub)",fontFamily:"var(--fb)"}}>Promoter . {promoter.city}</div></div>
      </div>
      <div ref={msgRef} className="scroll" style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:9}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.m?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"78%",background:m.m?"var(--ink)":"var(--white)",color:m.m?"white":"var(--ink)",border:m.m?"none":"1px solid var(--line)",padding:"9px 12px",borderRadius:m.m?"13px 13px 3px 13px":"13px 13px 13px 3px",fontSize:12,fontFamily:"var(--fb)",lineHeight:1.55,boxShadow:m.m?"none":"0 1px 4px rgba(0,0,0,.04)"}}>{m.t}</div>
          </div>
        ))}
      </div>
      <div style={{padding:"9px 16px 13px",borderTop:"1px solid var(--line)",display:"flex",gap:8,flexShrink:0,background:"var(--white)"}}>
        <input value={msgText} onChange={e=>setMsgText(sanitize(e.target.value,500))} onKeyDown={e=>e.key==="Enter"&&sendMsg()} maxLength={500} placeholder="Ask about tables, deals..." style={{flex:1,background:"var(--bg)",border:"1px solid var(--line)",borderRadius:12,padding:"9px 13px",color:"var(--ink)",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
        <button className="press" onClick={sendMsg} style={{width:38,height:38,borderRadius:11,background:"var(--ink)",border:"none",color:"white",fontSize:16,cursor:"pointer"}}>↑</button>
      </div>
    </div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",animation:"slideUp .35s cubic-bezier(.16,1,.3,1) both"}}>
      <div className="scroll" style={{flex:1,overflowY:"auto"}}>
        {/* Hero */}
        <div style={{background:"var(--ink)",padding:"14px 18px 18px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"radial-gradient(circle,rgba(201,168,76,.1),transparent)",borderRadius:"50%",pointerEvents:"none"}}/>
          <button className="press" onClick={goBack} style={{background:"rgba(255,255,255,.12)",border:"none",borderRadius:9,color:"white",padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--fb)",marginBottom:14,display:"inline-flex",alignItems:"center",gap:4}}>‹ Back</button>
          <div style={{display:"flex",alignItems:"flex-end",gap:14}}>
            <div style={{position:"relative"}}>
              <div style={{width:62,height:62,borderRadius:"50%",background:"rgba(255,255,255,.12)",border:"2px solid rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"white",fontFamily:"var(--fd)",fontStyle:"italic"}}>{promoter.avatar}</div>
              {promoter.verified&&<div style={{position:"absolute",bottom:1,right:1,width:18,height:18,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,border:"2px solid var(--ink)"}}>✓</div>}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                <span style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"white"}}>{promoter.name}</span>
                {promoter.verified&&<span style={{fontSize:9,background:"var(--goldbg)",color:"var(--gold)",padding:"2px 7px",borderRadius:18,fontWeight:700,fontFamily:"var(--fb)"}}>✦ Verified</span>}
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.45)",fontFamily:"var(--fb)"}}>{promoter.handle} . {promoter.city} . {promoter.followers} followers</div>
            </div>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.55)",fontFamily:"var(--fb)",lineHeight:1.6,marginTop:11,marginBottom:13}}>{promoter.bio}</div>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"rgba(255,255,255,.08)",borderRadius:12,overflow:"hidden",marginBottom:13}}>
            {[[`⭐ ${promoter.rating}`,`${promoter.reviews} reviews`],[promoter.bookings.toLocaleString(),"bookings"],[promoter.followers,"followers"]].map(([v,l],i)=>(
              <div key={l} style={{padding:"10px 6px",textAlign:"center",background:"rgba(255,255,255,.04)"}}>
                <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:700,color:"white"}}>{v}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,.38)",fontFamily:"var(--fb)",marginTop:1}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Action buttons */}
          <div style={{display:"flex",gap:8}}>
            <button className="press" onClick={()=>setMsgOpen(true)} style={{flex:1,padding:"10px",background:"white",color:"var(--ink)",border:"none",borderRadius:12,fontSize:12,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>💬 Message</button>
            <button className="press" onClick={()=>setExportOpen(true)} style={{flex:1,padding:"10px",background:"rgba(255,255,255,.1)",color:"white",border:"1px solid rgba(255,255,255,.18)",borderRadius:12,fontSize:12,fontWeight:600,fontFamily:"var(--fb)",cursor:"pointer"}}>{copied?"✓ Copied!":copyErr?"Failed - try again":"↗ Share Profile"}</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",background:"var(--white)",borderBottom:"1px solid var(--line)",padding:"0 6px"}}>
          {["events","deals","reviews"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"11px 4px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===t?"var(--ink)":"transparent"}`,fontFamily:"var(--fb)",fontWeight:tab===t?700:500,fontSize:12,cursor:"pointer",color:tab===t?"var(--ink)":"var(--sub)",textTransform:"capitalize",transition:"all .15s"}}>{t}</button>
          ))}
        </div>

        <div style={{padding:"13px 18px 90px"}}>
          {/* Events tab */}
          {tab==="events"&&(
            <div>
              <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:10}}>Upcoming Events</div>
              {promoter.events.map(ev=>(
                <div key={ev.id} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden",marginBottom:10}}>
                  <div style={{position:"relative",height:110}}>
                    <Img src={ev.img} style={{position:"absolute",inset:0}} alt={ev.venue} type="Nightclub" name={ev.venue}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.7),transparent 55%)"}}/>
                    <div style={{position:"absolute",bottom:0,left:14,paddingBottom:10}}>
                      <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white"}}>{ev.venue}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,.55)",fontFamily:"var(--fb)"}}>{ev.date}</div>
                    </div>
                    <div style={{position:"absolute",top:9,right:10}}>
                      <span style={{background:ev.spots<=3?"rgba(239,68,68,.85)":"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",color:"white",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:18,fontFamily:"var(--fb)"}}>{ev.spots<=3?`🔥 ${ev.spots} spots left`:`${ev.spots} spots`}</span>
                    </div>
                  </div>
                  <div style={{padding:"10px 13px",display:"flex",gap:8}}>
                    <button className="press" onClick={()=>goBookPromoter(promoter,ev)} style={{flex:1,padding:"9px",background:"var(--ink)",color:"white",border:"none",borderRadius:11,fontSize:12,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>Book with {promoter.name.split(" ")[0]} →</button>
                  </div>
                </div>
              ))}
              {/* Specialties */}
              <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:8,marginTop:4}}>Venues they work</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {promoter.venues.map(v=><span key={v} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:10,padding:"6px 11px",fontSize:11,fontWeight:600,fontFamily:"var(--fb)",color:"var(--ink2)"}}>📍 {v}</span>)}
              </div>
            </div>
          )}

          {/* Deals tab */}
          {tab==="deals"&&(
            <div>
              <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:10}}>Exclusive Deals</div>
              {promoter.deals.map(d=>(
                <DealCard key={d.id} deal={d}/>
              ))}
              <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,padding:"12px 14px",marginTop:4}}>
                <div style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)",lineHeight:1.65,textAlign:"center"}}>💡 Deals are applied automatically when booking through {promoter.name.split(" ")[0]}'s invite link.</div>
              </div>
            </div>
          )}

          {/* Reviews tab */}
          {tab==="reviews"&&(
            <div>
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:13}}>
                <div style={{fontFamily:"var(--fd)",fontSize:34,fontWeight:700,color:"var(--ink)"}}>{promoter.rating}</div>
                <div><Stars r={promoter.rating}/><div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:2}}>{promoter.reviews} reviews</div></div>
              </div>
              {promoter.feedbacks.map((f,i)=>(
                <div key={i} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,padding:"12px 14px",marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)"}}>{f.name}</span>
                    <span>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:10,color:s<=f.stars?"#c9a84c":"var(--dim)"}}>★</span>)}</span>
                  </div>
                  <div style={{fontSize:12,color:"var(--ink2)",fontFamily:"var(--fb)",lineHeight:1.6}}>"{f.text}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      {tab==="events"&&(
        <div style={{padding:"10px 18px 13px",borderTop:"1px solid var(--line)",background:"rgba(245,244,240,.97)",backdropFilter:"blur(20px)",flexShrink:0}}>
          <button className="press" onClick={()=>setMsgOpen(true)} style={{width:"100%",padding:"12px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Message {promoter.name.split(" ")[0]} for VIP access →</button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------- Invite Link Landing (when guest arrives via promoter link) -
function InviteLanding({promoter,event,go,goBack,goPromoter}){
  // mount animation handled by wrapper
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",animation:"scaleIn .28s cubic-bezier(.16,1,.3,1) both"}}>
      <div className="scroll" style={{flex:1,overflowY:"auto"}}>
        <div style={{position:"relative",height:200}}>
          <Img src={event.img} style={{position:"absolute",inset:0}} alt={event.venue} type="Nightclub" name={event.venue}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.8),rgba(0,0,0,.2))"}}/>
          {/* Back button */}
          <button className="press" onClick={()=>go("back")} style={{position:"absolute",top:12,left:14,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"white",padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--fb)",display:"flex",alignItems:"center",gap:4,zIndex:10}}>‹ Back</button>
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 18px 16px"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",fontFamily:"var(--fb)",marginBottom:3}}>You were invited by</div>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"white",fontFamily:"var(--fd)",fontStyle:"italic"}}>{promoter.avatar}</div>
              <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white"}}>{promoter.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,.45)",fontFamily:"var(--fb)"}}>{promoter.handle} . ⭐ {promoter.rating}</div></div>
            </div>
          </div>
        </div>
        <div style={{padding:"16px 18px 90px"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:700,color:"var(--ink)",marginBottom:2}}>{event.venue}</div>
          <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:14}}>{event.date} . Via {promoter.name}</div>

          {/* Perks */}
          <div style={{background:"linear-gradient(135deg,rgba(201,168,76,.1),rgba(201,168,76,.03))",border:"1px solid rgba(201,168,76,.2)",borderRadius:16,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--gold)",letterSpacing:".08em",textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:9}}>✦ Your Exclusive Perks</div>
            {[["🚪","Priority Queue Entry","Skip the line entirely"],["💰","Early Bird Pricing","Locked-in rate via this link"],["🍾","Complimentary Welcome Round","On arrival at the table"]].map(([ic,title,sub])=>(
              <div key={title} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontSize:17,marginTop:1}}>{ic}</span>
                <div><div style={{fontSize:12,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)"}}>{title}</div><div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)"}}>{sub}</div></div>
              </div>
            ))}
          </div>

          {/* Promoter mini card */}
          <div className="press" onClick={()=>goPromoter(promoter)} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:15,padding:"12px 14px",display:"flex",gap:11,alignItems:"center",marginBottom:14}}>
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:"var(--ink)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"white",fontFamily:"var(--fd)",fontStyle:"italic"}}>{promoter.avatar}</div>
              {promoter.verified&&<div style={{position:"absolute",bottom:0,right:0,width:14,height:14,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>✓</div>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)"}}>{promoter.name}</div>
              <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(promoter.bio||"").slice(0,55)}...</div>
            </div>
            <svg width="5" height="10" viewBox="0 0 5 10" fill="none"><path d="M1 1l3 4L1 9" stroke="var(--dim)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>

          <div style={{fontSize:10,color:"var(--dim)",textAlign:"center",fontFamily:"var(--fb)"}}>{event.spots<=3?`🔥 Only ${event.spots} spots left at this price`:`${event.spots} spots available`}</div>
        </div>
      </div>
      <div style={{padding:"10px 18px 13px",borderTop:"1px solid var(--line)",background:"rgba(245,244,240,.97)",backdropFilter:"blur(20px)",flexShrink:0}}>
        <button className="press" onClick={()=>{const v=VENUES.find(x=>x.name===event.venue)||VENUES[0];go("venue",v);}} style={{width:"100%",padding:"13px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",marginBottom:6}}>Claim Your Spot →</button>
        <div style={{fontSize:9,color:"var(--dim)",textAlign:"center",fontFamily:"var(--fb)"}}>🔒 Perks applied automatically . Free cancellation 48h before</div>
      </div>
    </div>
  );
}



// ----------------------------------------------- Promoter Paywall -----------------------------------------
function ProPaywall({onSelect,onClose}){
  const [sel,setSel]=useState("pro");
  const plans=[
    {id:"starter",label:"Starter",price:49,period:"mo",
      features:["Up to 3 active events","Invite links + QR codes","Basic analytics","Email support"],
      color:"rgba(255,255,255,.07)",border:"rgba(255,255,255,.1)"},
    {id:"pro",label:"Pro",price:99,period:"mo",badge:"Most Popular",
      features:["Unlimited events","Advanced analytics dashboard","Priority guest list tools","Stripe payouts same-day","Dedicated account manager"],
      color:"rgba(201,168,76,.08)",border:"var(--gold)"},
    {id:"elite",label:"Elite",price:199,period:"mo",badge:"Coming Soon",
      features:["Everything in Pro","White-label booking pages","API access","Custom domain","Revenue guarantee"],
      color:"rgba(255,255,255,.03)",border:"rgba(255,255,255,.06)"},
  ];
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",animation:"slideUp .38s cubic-bezier(.16,1,.3,1) both"}}>
      {/* Header */}
      <div style={{padding:"14px 18px 8px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button className="press" onClick={onClose}
          style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.07)",
            border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",
            alignItems:"center",justifyContent:"center"}}>&#x2715;</button>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"white"}}>Go Pro</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.35)",fontFamily:"var(--fb)"}}>Unlock the full promoter toolkit</div>
        </div>
      </div>

      {/* Hero stat */}
      <div style={{margin:"6px 18px 16px",background:"linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.04))",
        border:"1px solid rgba(201,168,76,.2)",borderRadius:16,padding:"14px 16px",
        display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:28}}>💰</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>Promoters earn avg $2,400/mo</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"var(--fb)",marginTop:1}}>on Luma in their first 60 days</div>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{flex:1,overflowY:"auto",padding:"0 18px 100px"}}>
        {plans.map(p=>(
          <div key={p.id} onClick={()=>p.id!=="elite"&&setSel(p.id)} className={p.id!=="elite"?"press":""}
            style={{background:p.color,border:"1.5px solid "+(sel===p.id?"var(--gold)":p.border),
              borderRadius:18,padding:"16px",marginBottom:10,cursor:p.id==="elite"?"default":"pointer",
              transition:"all .2s",position:"relative",opacity:p.id==="elite"?.6:1}}>
            {p.badge&&(
              <div style={{position:"absolute",top:-1,right:14,
                background:p.id==="pro"?"var(--gold)":"rgba(255,255,255,.1)",
                color:p.id==="pro"?"#0a0a0a":"rgba(255,255,255,.4)",
                fontSize:8,fontWeight:700,fontFamily:"var(--fb)",
                padding:"3px 10px",borderRadius:"0 0 9px 9px",letterSpacing:".06em"}}>{p.badge}</div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{p.label}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:3,marginTop:2}}>
                  <span style={{fontFamily:"var(--fd)",fontSize:28,fontWeight:700,
                    color:sel===p.id?"var(--gold)":"white"}}>${p.price}</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,.35)",fontFamily:"var(--fb)"}}>/{p.period}</span>
                </div>
              </div>
              <div style={{width:22,height:22,borderRadius:"50%",
                border:"2px solid "+(sel===p.id?"var(--gold)":"rgba(255,255,255,.2)"),
                background:sel===p.id?"var(--gold)":"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0,marginTop:4}}>
                {sel===p.id&&<div style={{width:8,height:8,borderRadius:"50%",background:"#0a0a0a"}}/>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {p.features.map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:15,height:15,borderRadius:"50%",
                    background:sel===p.id?"rgba(201,168,76,.2)":"rgba(255,255,255,.07)",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="7" height="6" viewBox="0 0 7 6" fill="none">
                      <path d="M1 3l2 2 3-4" stroke={sel===p.id?"var(--gold)":"rgba(255,255,255,.35)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{fontSize:11,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)"}}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{fontSize:10,color:"rgba(255,255,255,.2)",fontFamily:"var(--fb)",textAlign:"center",lineHeight:1.6,marginTop:6}}>
          Cancel anytime. No contracts. Stripe-powered billing.
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:"10px 18px 28px",borderTop:"1px solid rgba(255,255,255,.07)",
        flexShrink:0,background:"var(--pro)"}}>
        <button className="press" onClick={()=>onSelect&&onSelect(sel)}
          style={{width:"100%",padding:"15px",background:"var(--gold)",color:"#0a0a0a",
            border:"none",borderRadius:16,fontSize:14,fontWeight:700,fontFamily:"var(--fb)",
            cursor:"pointer",boxShadow:"0 8px 28px rgba(201,168,76,.35)"}}>
          Start {plans.find(p=>p.id===sel)?.label} - ${plans.find(p=>p.id===sel)?.price}/mo
        </button>
        <div style={{textAlign:"center",marginTop:8,fontSize:10,color:"rgba(255,255,255,.2)",fontFamily:"var(--fb)"}}>
          7-day free trial included
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------- Onboarding ------------------------------------------------
function Onboard({onDone}){
  const [role,setRole]=useState(null); // "guest" | "promoter"
  const [step,setStep]=useState(0);   // steps within role flow
  const [city,setCity]=useState(null);

  // Role picker shown first
  if(!role) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",overflow:"hidden",
      position:"relative",animation:"scaleIn .32s cubic-bezier(.16,1,.3,1) both"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",padding:"40px 28px 0",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:20,animation:"popIn .5s cubic-bezier(.34,1.56,.64,1) both"}}>🌃</div>
        <div style={{fontFamily:"var(--fd)",fontSize:28,fontWeight:700,color:"var(--ink)",
          lineHeight:1.22,marginBottom:10,animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .1s both"}}>Welcome to Luma</div>
        <div style={{fontSize:14,color:"var(--sub)",fontFamily:"var(--fb)",lineHeight:1.6,maxWidth:260,
          animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .18s both"}}>The smartest way to experience nightlife. Are you going out or running the night?</div>
        <div style={{display:"flex",flexDirection:"column",gap:11,marginTop:32,width:"100%",maxWidth:300,
          animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .26s both"}}>
          <button onClick={()=>setRole("guest")} className="press"
            style={{padding:"16px",borderRadius:16,fontSize:14,fontWeight:700,fontFamily:"var(--fb)",
              cursor:"pointer",border:"2px solid var(--line2)",background:"var(--white)",
              color:"var(--ink)",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:26}}>🎟</span>
            <div>
              <div style={{fontWeight:700,marginBottom:2}}>I'm a Guest</div>
              <div style={{fontSize:11,color:"var(--sub)",fontWeight:400}}>Book tables & get exclusive deals</div>
            </div>
            <span style={{marginLeft:"auto",color:"var(--dim)"}}>›</span>
          </button>
          <button onClick={()=>setRole("promoter")} className="press"
            style={{padding:"16px",borderRadius:16,fontSize:14,fontWeight:700,fontFamily:"var(--fb)",
              cursor:"pointer",border:"2px solid #8a6a20",background:"var(--gold)",
              color:"#0a0a0a",textAlign:"left",display:"flex",alignItems:"center",gap:12,
              boxShadow:"0 8px 24px rgba(201,168,76,.35)"}}>
            <span style={{fontSize:26}}>💎</span>
            <div>
              <div style={{fontWeight:700,marginBottom:2}}>I'm a Promoter</div>
              <div style={{fontSize:11,color:"rgba(0,0,0,.45)",fontWeight:400}}>Manage bookings & grow revenue</div>
            </div>
            <span style={{marginLeft:"auto",color:"rgba(0,0,0,.3)"}}>›</span>
          </button>
        </div>
      </div>
      <div style={{height:60}}/>
    </div>
  );

  const dark=role==="promoter";
  const bg=dark?"var(--ink)":"var(--bg)";
  const ink=dark?"white":"var(--ink)";
  const sub=dark?"rgba(255,255,255,.4)":"var(--sub)";
  const dot=dark?"rgba(255,255,255,.15)":"var(--line2)";
  const dotAct=dark?"var(--gold)":"var(--ink)";
  const btnBg=dark?"var(--gold)":"var(--ink)";
  const btnColor=dark?"#0a0a0a":"white";
  const btnShadow=dark?"0 8px 28px rgba(201,168,76,.3)":"0 8px 28px rgba(0,0,0,.18)";

  const guestSteps=[
    {emoji:"🌃",title:"Your city's nightlife,\ncurated.",sub:"Skip the line. Book VIP tables, get exclusive deals from local promoters."},
    {emoji:"🎟",title:"Real promoters,\nreal access.",sub:"Every promoter is verified. They bring you deals no one else can get."},
    {emoji:"💎",title:"Where do you\nwant to go out?",sub:"We'll show you the best spots in your city.",cities:["Miami","New York"]},
  ];
  const proSteps=[
    {emoji:"📊",title:"Your command\ncenter.",sub:"Guest lists, invite links, payouts, and analytics - all in one place."},
    {emoji:"🔗",title:"Invite links that\nconvert.",sub:"Share your unique link. Get credited for every booking you bring in."},
    {emoji:"💰",title:"Where are you\nworking?",sub:"We'll set up your dashboard for your market.",cities:["Miami","New York"]},
  ];
  const steps=dark?proSteps:guestSteps;
  const s=steps[step];
  const isLast=step===steps.length-1;
  const canContinue=!isLast||(isLast&&city);
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",overflow:"hidden",position:"relative",animation:"scaleIn .32s cubic-bezier(.16,1,.3,1) both"}}>
      {/* Subtle top glow accent */}
      <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",
        width:340,height:240,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 70%)",
        pointerEvents:"none"}}/>

      {/* Skip */}
      {step<2&&<button onClick={()=>onDone(city||"Miami")}
        style={{position:"absolute",top:18,right:20,background:"transparent",border:"none",
          color:"var(--dim)",fontSize:11,fontFamily:"var(--fb)",cursor:"pointer",
          fontWeight:600,letterSpacing:".04em"}}>Skip</button>}

      {/* Dot indicators */}
      <div style={{position:"absolute",top:24,left:"50%",transform:"translateX(-50%)",
        display:"flex",gap:5}}>
        {steps.map((_,i)=>(
          <div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,
            background:i===step?"var(--ink)":"var(--line2)",
            transition:"all .3s cubic-bezier(.34,1.56,.64,1)"}}/>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",padding:"60px 32px 0",textAlign:"center"}} key={step}>
        <div style={{fontSize:72,marginBottom:28,animation:"popIn .5s cubic-bezier(.34,1.56,.64,1) both"}}>{s.emoji}</div>
        <div style={{fontFamily:"var(--fd)",fontSize:32,fontWeight:700,color:"var(--ink)",
          lineHeight:1.22,marginBottom:14,whiteSpace:"pre-line",
          animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .1s both"}}>{s.title}</div>
        <div style={{fontSize:14,color:"var(--sub)",fontFamily:"var(--fb)",
          lineHeight:1.65,maxWidth:280,
          animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .18s both"}}>{s.sub}</div>

        {/* City picker */}
        {s.cities&&(
          <div style={{display:"flex",gap:12,marginTop:28,
            animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .26s both"}}>
            {s.cities.map(c=>(
              <button key={c} onClick={()=>setCity(c)} className="press"
                style={{padding:"13px 26px",borderRadius:16,fontSize:14,fontWeight:700,
                  fontFamily:"var(--fb)",cursor:"pointer",border:"2px solid",
                  transition:"all .2s",
                  background:city===c?"var(--ink)":"var(--white)",
                  borderColor:city===c?"var(--ink)":"var(--line2)",
                  color:city===c?"white":"var(--ink2)"}}>
                {c==="Miami"?"🌴":"🗽"} {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{padding:"0 28px 52px"}}>
        <button onClick={()=>isLast?canContinue&&onDone(city,role):setStep(s=>s+1)}
          className="press"
          style={{width:"100%",padding:"16px",borderRadius:18,fontSize:15,fontWeight:700,
            fontFamily:"var(--fb)",cursor:"pointer",border:"none",
            background:canContinue?"var(--ink)":"var(--line2)",
            color:canContinue?"white":"var(--dim)",
            transition:"all .25s",boxShadow:canContinue?"0 8px 28px rgba(0,0,0,.18)":"none"}}>
          {isLast?"Let's go ->":"Continue"}
        </button>
        {step>0&&<button onClick={()=>setStep(s=>s-1)}
          style={{width:"100%",marginTop:10,padding:"10px",background:"transparent",
            border:"none",color:"var(--dim)",fontSize:12,fontFamily:"var(--fb)",
            cursor:"pointer"}}>Back</button>}
      </div>
    </div>
  );
}

// ----------------------------------------------- Profile / Settings ----------------------------------------
function Profile({go,onSwitchMode,city,onSignOut,userEmail,userName="Guest"}){
  const [editing,setEditing]=useState(false);
  const [name,setName]=useState(userName);
  const [bio,setBio]=useState("");
  const [notif,setNotif]=useState(true);
  const [locShare,setLocShare]=useState(true);
  const [haptics,setHaptics]=useState(true);
  const [saved,setSaved]=useState(false);
  const [avatarUrl,setAvatarUrl]=useState(null);
  const [bookingCount,setBookingCount]=useState(0);
  const [promoCount,setPromoCount]=useState(0);
  // Social connections - null = not connected, string = connected handle
  const [igConnected,setIgConnected]=useState(null);
  const [twConnected,setTwConnected]=useState(null);
  const [igInput,setIgInput]=useState("");
  const [twInput,setTwInput]=useState("");
  const [igEditing,setIgEditing]=useState(false);
  const [twEditing,setTwEditing]=useState(false);

  // Load profile + booking stats from Supabase
  useEffect(()=>{
    const sess=getSession();
    if(!sess?.access_token) return;
    // Load profile
    fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+sess.user.id+"&select=full_name,avatar_url,city",{
      headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token}
    }).then(r=>r.json()).then(d=>{
      if(d?.[0]){
        if(d[0].full_name) setName(d[0].full_name);
        if(d[0].avatar_url) setAvatarUrl(d[0].avatar_url);
      }
    }).catch(()=>{});
    // Load booking stats
    fetch(SUPA_URL+"/rest/v1/bookings?user_id=eq."+sess.user.id+"&select=id,promo_code",{
      headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token}
    }).then(r=>r.json()).then(d=>{
      if(Array.isArray(d)){
        setBookingCount(d.length);
        setPromoCount(d.filter(b=>b.promo_code).length);
      }
    }).catch(()=>{});
  },[]);

  const prefs=[
    {label:"Push notifications",desc:"Booking updates & deals",val:notif,set:setNotif},
    {label:"Location sharing",desc:"Show venues near you",val:locShare,set:setLocShare},
    {label:"Haptic feedback",desc:"Vibrate on interactions",val:haptics,set:setHaptics},
  ];
  const saveEdits=async()=>{
    setEditing(false);setSaved(true);setTimeout(()=>setSaved(false),2000);
    const sess=getSession();
    if(!sess?.access_token) return;
    try{
      await fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+sess.user.id,{
        method:"PATCH",
        headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token,
          "Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({full_name:name.slice(0,60),updated_at:new Date().toISOString()})
      });
    }catch{}
  };
  const Toggle=({val,set})=>(
    <div onClick={()=>set(v=>!v)} className="press"
      style={{width:42,height:24,borderRadius:12,background:val?"var(--ink)":"var(--line2)",
        position:"relative",cursor:"pointer",flexShrink:0,transition:"background .2s"}}>
      <div style={{position:"absolute",top:3,left:val?21:3,width:18,height:18,
        borderRadius:"50%",background:"white",transition:"left .2s",
        boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}/>
    </div>
  );

  // Social connect card
  const SocialCard=({icon,label,color,connected,handle,inputVal,setInput,isEditing,setIsEditing,onConnect,onDisconnect})=>(
    <div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${connected?"rgba(255,255,255,.14)":"rgba(255,255,255,.07)"}`,
      borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,transition:"all .2s"}}>
      {/* Platform icon */}
      <div style={{width:38,height:38,borderRadius:11,background:color,display:"flex",
        alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0,
        boxShadow:"0 3px 10px rgba(0,0,0,.3)",border:"1.5px solid rgba(255,255,255,.12)"}}>
        {icon}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:connected||isEditing?3:0}}>{label}</div>
        {connected&&!isEditing&&(
          <div style={{fontSize:11,color:"rgba(255,255,255,.45)",fontFamily:"var(--fb)"}}>{handle}</div>
        )}
        {isEditing&&(
          <input autoFocus value={inputVal} onChange={e=>setInput(e.target.value.replace(/[^a-zA-Z0-9_.]/g,""))}
            maxLength={30} placeholder={`Enter ${label} username`}
            onKeyDown={e=>{
              if(e.key==="Enter"&&inputVal.trim()) onConnect("@"+inputVal.trim().replace(/^@/,""));
              if(e.key==="Escape"){setIsEditing(false);setInput("");}
            }}
            style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.2)",
              color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none",padding:"2px 0"}}/>
        )}
        {!connected&&!isEditing&&(
          <div style={{fontSize:10,color:"rgba(255,255,255,.28)",fontFamily:"var(--fb)"}}>Not connected</div>
        )}
      </div>
      {/* Action button */}
      {isEditing?(
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={()=>{setIsEditing(false);setInput("");}} className="press"
            style={{padding:"5px 10px",background:"rgba(255,255,255,.07)",border:"none",
              borderRadius:9,color:"rgba(255,255,255,.4)",fontSize:10,fontFamily:"var(--fb)",cursor:"pointer"}}>
            Cancel
          </button>
          <button onClick={()=>inputVal.trim()&&onConnect("@"+inputVal.trim().replace(/^@/,""))} className="press"
            style={{padding:"5px 12px",background:inputVal.trim()?color:"rgba(255,255,255,.07)",
              border:"none",borderRadius:9,color:"white",fontSize:10,fontWeight:700,
              fontFamily:"var(--fb)",cursor:"pointer",transition:"background .15s"}}>
            Connect
          </button>
        </div>
      ):connected?(
        <button onClick={onDisconnect} className="press"
          style={{padding:"5px 12px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",
            borderRadius:9,color:"rgba(255,255,255,.4)",fontSize:10,fontFamily:"var(--fb)",
            cursor:"pointer",flexShrink:0}}>
          Disconnect
        </button>
      ):(
        <button onClick={()=>setIsEditing(true)} className="press"
          style={{padding:"6px 13px",background:color,border:"none",
            borderRadius:9,color:"white",fontSize:10,fontWeight:700,
            fontFamily:"var(--fb)",cursor:"pointer",flexShrink:0,
            boxShadow:`0 3px 10px ${color}55`}}>
          Connect
        </button>
      )}
    </div>
  );

  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--bg)"}}>
      {/* Header with Edit toggle */}
      <div style={{padding:"10px 18px 12px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>go("back")} className="press"
          style={{width:32,height:32,borderRadius:9,background:"var(--white)",
            border:"1px solid var(--line2)",cursor:"pointer",fontSize:16,color:"var(--ink)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>&#8249;</button>
        <span style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"var(--ink)",flex:1}}>Profile</span>
        {editing?(
          <button onClick={saveEdits} className="press"
            style={{padding:"6px 16px",background:"var(--ink)",color:"white",border:"none",
              borderRadius:20,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>
            {saved?"✓ Saved":"Save"}
          </button>
        ):(
          <button onClick={()=>setEditing(true)} className="press"
            style={{padding:"6px 16px",background:"var(--white)",color:"var(--ink)",
              border:"1px solid var(--line2)",borderRadius:20,fontSize:11,fontWeight:600,
              fontFamily:"var(--fb)",cursor:"pointer"}}>Edit</button>
        )}
      </div>

      {/* Avatar card */}
      <div style={{margin:"4px 18px 0",background:"var(--ink)",borderRadius:22,padding:"20px",
        position:"relative",overflow:"hidden"}} className="sc">
        <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,
          borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,.15),transparent)"}}/>
        <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
          <div style={{position:"relative",flexShrink:0}}>
            {avatarUrl?(
              <img src={avatarUrl} alt="avatar"
                style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",
                  border:"2px solid rgba(255,255,255,.25)"}}/>
            ):(
              <div style={{width:64,height:64,borderRadius:"50%",
                background:"linear-gradient(135deg,rgba(201,168,76,.3),rgba(201,168,76,.05))",
                border:"2px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:26,fontWeight:700,color:"white",
                fontFamily:"var(--fd)",fontStyle:"italic"}}>
                {name[0]?.toUpperCase()||"E"}
              </div>
            )}
            {editing&&(
              <label htmlFor="avatar-upload" style={{position:"absolute",inset:0,borderRadius:"50%",
                background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",
                justifyContent:"center",cursor:"pointer",flexDirection:"column",gap:2}}>
                <span style={{fontSize:16}}>📷</span>
                <span style={{fontSize:7,color:"white",fontFamily:"var(--fb)",fontWeight:700}}>CHANGE</span>
                <input id="avatar-upload" type="file" accept="image/*" style={{display:"none"}}
                  onChange={e=>{
                    const f=e.target.files?.[0];
                    if(f&&f.size<5*1024*1024){
                      const r=new FileReader();
                      r.onload=ev=>setAvatarUrl(ev.target.result);
                      r.readAsDataURL(f);
                    }
                  }}/>
              </label>
            )}
          </div>
          <div style={{flex:1,minWidth:0}}>
            {editing?(
              <input value={name} onChange={e=>setName(e.target.value)} maxLength={30}
                style={{width:"100%",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",
                  borderRadius:9,padding:"6px 10px",color:"white",fontSize:14,fontWeight:700,
                  fontFamily:"var(--fb)",outline:"none",marginBottom:6}}/>
            ):(
              <div style={{fontSize:16,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:2}}>{name}</div>
            )}
            <div style={{fontSize:11,color:"rgba(255,255,255,.4)",fontFamily:"var(--fb)"}}>
              {city==="New York"?"🗽":"🌴"} {city||"Miami"} . Member since 2025
            </div>
            {editing?(
              <textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={80} rows={2}
                style={{width:"100%",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",
                  borderRadius:9,padding:"6px 10px",color:"rgba(255,255,255,.7)",fontSize:11,
                  fontFamily:"var(--fb)",outline:"none",resize:"none",marginTop:6,lineHeight:1.5}}/>
            ):(
              bio&&<div style={{fontSize:11,color:"rgba(255,255,255,.45)",fontFamily:"var(--fb)",marginTop:5,lineHeight:1.5}}>{bio}</div>
            )}
          </div>
          <div style={{background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.3)",
            borderRadius:20,padding:"4px 10px",fontSize:9,fontWeight:700,color:"var(--gold)",
            fontFamily:"var(--fb)",flexShrink:0}}>✦ VIP</div>
        </div>

        {/* Connected social badges - view mode */}
        {!editing&&(igConnected||twConnected)&&(
          <div style={{display:"flex",gap:8,marginTop:12}}>
            {igConnected&&<div style={{display:"flex",alignItems:"center",gap:5,
              background:"rgba(225,48,108,.15)",border:"1px solid rgba(225,48,108,.25)",
              borderRadius:20,padding:"4px 11px"}}>
              <span style={{fontSize:10}}>📸</span>
              <span style={{fontSize:10,color:"#f472b6",fontFamily:"var(--fb)",fontWeight:600}}>{igConnected}</span>
            </div>}
            {twConnected&&<div style={{display:"flex",alignItems:"center",gap:5,
              background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",
              borderRadius:20,padding:"4px 11px"}}>
              <span style={{fontSize:10}}>𝕏</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)",fontWeight:600}}>{twConnected}</span>
            </div>}
          </div>
        )}

        <div style={{display:"flex",gap:14,marginTop:16,paddingTop:16,
          borderTop:"1px solid rgba(255,255,255,.07)"}}>
          {[[String(bookingCount),"Bookings"],["0","Saved"],[String(promoCount),"Promos Used"]].map(([v,l])=>(
            <div key={l}>
              <div style={{fontSize:17,fontWeight:700,color:"white",fontFamily:"var(--fd)"}}>{v}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.35)",fontFamily:"var(--fb)"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Socials section */}
      <div style={{margin:"18px 18px 0"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--sub)",letterSpacing:".08em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:10}}>Connected Socials</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <SocialCard
            icon={<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/></svg>}
            label="Instagram" color="linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"
            connected={!!igConnected} handle={igConnected}
            inputVal={igInput} setInput={setIgInput}
            isEditing={igEditing} setIsEditing={setIgEditing}
            onConnect={h=>{setIgConnected(h);setIgEditing(false);setIgInput("");}}
            onDisconnect={()=>setIgConnected(null)}
          />
          <SocialCard
            icon={<svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M7.548 3h3.08l3.895 5.517L18.742 3H22l-5.97 7.668L22.5 21h-3.08l-4.377-6.2L9.646 21H6.3l6.318-8.12L7.548 3z"/></svg>}
            label="Twitter / X" color="#1d1d1d"
            connected={!!twConnected} handle={twConnected}
            inputVal={twInput} setInput={setTwInput}
            isEditing={twEditing} setIsEditing={setTwEditing}
            onConnect={h=>{setTwConnected(h);setTwEditing(false);setTwInput("");}}
            onDisconnect={()=>setTwConnected(null)}
          />
        </div>
      </div>
      <div style={{margin:"18px 18px 0"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--sub)",letterSpacing:".08em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:10}}>Preferences</div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden"}}>
          {prefs.map((p,i)=>(
            <div key={p.label} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",
              borderBottom:i<prefs.length-1?"1px solid var(--line)":"none"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",fontFamily:"var(--fb)"}}>{p.label}</div>
                <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>{p.desc}</div>
              </div>
              <Toggle val={p.val} set={p.set}/>
            </div>
          ))}
        </div>
      </div>

      {/* City */}
      <div style={{margin:"14px 18px 0"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--sub)",letterSpacing:".08em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:10}}>City</div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,padding:"13px 16px",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--ink)",fontFamily:"var(--fb)"}}>{city==="New York"?"🗽 New York":"🌴 Miami"}</div>
            <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>Your primary city</div>
          </div>
          <div style={{fontSize:11,color:"var(--dim)",fontFamily:"var(--fb)"}}>›</div>
        </div>
      </div>

      {/* Account actions */}
      <div style={{margin:"14px 18px 0"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--sub)",letterSpacing:".08em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:10}}>Account</div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden"}}>
          {[
            ["Become a promoter ->","Switch to promoter dashboard",()=>onSwitchMode("promoter"),false],
            ["Invite a friend","Share Luma with friends",()=>{},false],
            ["Help & support","FAQs and contact",()=>{},false],
            ["Sign out","Signed in as "+(userEmail||"guest"),()=>onSignOut&&onSignOut(),true],
          ].map(([label,sub,fn,danger],i,arr)=>(
            <div key={label} onClick={fn} className="press"
              style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer",
                borderBottom:i<arr.length-1?"1px solid var(--line)":"none"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:danger?"#ef4444":"var(--ink)",fontFamily:"var(--fb)"}}>{label}</div>
                {sub&&<div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>{sub}</div>}
              </div>
              {!danger&&<div style={{fontSize:13,color:"var(--dim)"}}>›</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{height:32}}/>
    </div>
  );
}

// ----------------------------------------------- Root -----------------------------------------------------

// AuthGate - sign in / sign up / forgot password
function AuthGate({onAuth}) {
  const [tab,     setTab]     = useState("signin");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [info,    setInfo]    = useState("");
  const [authAttempts, setAuthAttempts] = useState(0);

  const submit = async () => {
    setErr(""); setInfo(""); 
    // Rate limit: 5 attempts per minute
    if (authAttempts >= 5) { setErr("Too many attempts. Please wait a minute."); return; }
    setAuthAttempts(a => a + 1);
    setTimeout(() => setAuthAttempts(a => Math.max(0, a - 1)), 60000);
    setLoading(true);
    try {
      if (tab === "forgot") {
        if (!email.trim() || !email.includes("@")) { setErr("Enter a valid email"); setLoading(false); return; }
        try {
          await edgeCall("reset-password", { email: email.trim() });
        } catch {}
        setInfo("If an account exists, a reset link has been sent to your email.");
        setTab("signin");
        setLoading(false); return;
      }
      if (tab === "signup") {
        if (!name.trim()) { setErr("Name is required"); setLoading(false); return; }
        const d = await supaSignUp(email.trim(), pw, name.trim());
        if (d.error) { setErr(d.error.message || "Signup failed"); }
        else if (d.access_token) { onAuth(d); }
        else { setInfo("Check your email to confirm, then sign in."); setTab("signin"); }
      } else {
        const d = await supaSignIn(email.trim(), pw);
        if (!d.access_token) { setErr(d.error_description || d.error?.message || "Invalid credentials"); }
        else { onAuth(d); }
      }
    } catch(e) { setErr("Network error - check your connection"); }
    setLoading(false);
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"32px 24px",background:"var(--bg)"}}>
      <div style={{fontFamily:"var(--fd)",fontSize:52,fontWeight:700,fontStyle:"italic",
        letterSpacing:"-.02em",marginBottom:4,color:"var(--ink)"}}>Luma</div>
      <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:34,textAlign:"center"}}>
        Miami · New York · Your night starts here
      </div>
      {tab!=="forgot"&&<div style={{display:"flex",background:"var(--white)",border:"1px solid var(--line)",
        borderRadius:13,padding:3,marginBottom:22,width:"100%",maxWidth:330}}>
        {[["signin","Sign In"],["signup","Create Account"]].map(([t,label])=>(
          <button key={t} onClick={()=>{setTab(t);setErr("");setInfo("");}}
            style={{flex:1,padding:"9px 4px",borderRadius:10,border:"none",cursor:"pointer",
              fontFamily:"var(--fb)",fontWeight:600,fontSize:12,transition:"all .18s",
              background:tab===t?"var(--ink)":"transparent",color:tab===t?"white":"var(--sub)"}}>
            {label}
          </button>
        ))}
      </div>}
      {tab==="forgot"&&<div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,marginBottom:6,color:"var(--ink)"}}>Reset Password</div>}
      {tab==="forgot"&&<div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:22,textAlign:"center",maxWidth:280}}>{"Enter your email and we'll send you a link to reset your password."}</div>}
      <div style={{width:"100%",maxWidth:330,display:"flex",flexDirection:"column",gap:10}}>
        {tab==="signup"&&(
          <input value={name} onChange={e=>setName(e.target.value.slice(0,60))}
            placeholder="Your name" maxLength={60}
            style={{padding:"12px 14px",borderRadius:12,border:"1.5px solid var(--line2)",
              background:"var(--white)",fontSize:13,fontFamily:"var(--fb)",outline:"none",color:"var(--ink)"}}/>
        )}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          placeholder="Email address"
          style={{padding:"12px 14px",borderRadius:12,border:"1.5px solid var(--line2)",
            background:"var(--white)",fontSize:13,fontFamily:"var(--fb)",outline:"none",color:"var(--ink)"}}/>
        {tab!=="forgot"&&<input type="password" value={pw} onChange={e=>setPw(e.target.value)}
          placeholder="Password" onKeyDown={e=>e.key==="Enter"&&submit()}
          style={{padding:"12px 14px",borderRadius:12,border:"1.5px solid var(--line2)",
            background:"var(--white)",fontSize:13,fontFamily:"var(--fb)",outline:"none",color:"var(--ink)"}}/>}
        {err&&<div style={{padding:"9px 12px",background:"#fef2f2",border:"1px solid #fecaca",
          borderRadius:10,fontSize:12,color:"#dc2626",fontFamily:"var(--fb)"}}>{err}</div>}
        {info&&<div style={{padding:"9px 12px",background:"#f0fdf4",border:"1px solid #bbf7d0",
          borderRadius:10,fontSize:12,color:"#16a34a",fontFamily:"var(--fb)"}}>{info}</div>}
        <button onClick={submit} disabled={loading}
          style={{padding:"13px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,
            fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:loading?"not-allowed":"pointer",
            opacity:loading?.6:1,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading&&<div style={{width:14,height:14,borderRadius:"50%",
            border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite"}}/>}
          {loading?"Working...":tab==="forgot"?"Send Reset Link":tab==="signin"?"Sign In →":"Create Account →"}
        </button>
        {tab==="signin"&&<button onClick={()=>{setTab("forgot");setErr("");setInfo("");}}
          style={{padding:"8px",background:"transparent",border:"none",color:"var(--sub)",
            fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>
          Forgot password?
        </button>}
        {tab==="forgot"&&<button onClick={()=>{setTab("signin");setErr("");setInfo("");}}
          style={{padding:"8px",background:"transparent",border:"none",color:"var(--sub)",
            fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>
          ← Back to Sign In
        </button>}
        <button onClick={()=>onAuth(null)}
          style={{padding:"10px",background:"transparent",border:"1.5px solid var(--line2)",
            color:"var(--sub)",borderRadius:13,fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>
          Continue without account (demo)
        </button>
      </div>
    </div>
  );
}

export default function App(){
  const [session,_setSessionState] = useState(()=>getSession());
  const [guestMode,setGuestMode] = useState(false);
  const [mode,setMode]=useState("guest");
  const [onboarded,setOnboarded]=useState(false);
  const [city,setCity]=useState("Miami");
  const [showProfile,setShowProfile]=useState(false);
  const [gt,setGt]=useState("home");
  const [pt,setPt]=useState("dashboard");
  const [venue,setVenue]=useState(null);
  const [selPromoter,setSelPromoter]=useState(null);
  const [inviteData,setInviteData]=useState(null); // {promoter, event}
  const [stack,setStack]=useState([]);
  const pro=mode==="promoter";
  const userName=session?.user?.user_metadata?.name||session?.user?.email?.split("@")[0]||"Guest";
  const pd=usePromoterData();
  const [bookingSuccess,setBookingSuccess]=useState(null); // {code} from Stripe return

  // Handle Stripe success/cancel return URL
  useEffect(()=>{
    if(typeof window==='undefined') return;
    const params=new URLSearchParams(window.location.search);
    const status=params.get('booking');
    const code=params.get('code');
    if(status==='success'&&code){
      setBookingSuccess({code});
      setGt('bookings');
      // Clean URL
      window.history.replaceState({},'',window.location.pathname);
    } else if(status==='cancelled'){
      window.history.replaceState({},'',window.location.pathname);
    }
  },[]);

  const VALID_DESTS=new Set(["home","explore","map","promoters","bookings","venue","promoter","invite","profile","back"]);
  const go=(dest,data)=>{
    if(!VALID_DESTS.has(dest)) return; // reject unknown routes
    if(dest==="back"){
      if(showProfile){setShowProfile(false);return;}
      const ns=stack.slice(0,-1);
      setStack(ns);
      const prev=ns[ns.length-1];
      if(!prev){setVenue(null);setSelPromoter(null);setInviteData(null);return;}
      if(prev.type==="venue"){setVenue(prev.data);setSelPromoter(null);setInviteData(null);}
      else if(prev.type==="promoter"){setSelPromoter(prev.data);setVenue(null);setInviteData(null);}
      else if(prev.type==="invite"){setInviteData(prev.data);setVenue(null);setSelPromoter(null);}
      return;
    }
    if(dest==="venue"){setVenue(data);setSelPromoter(null);setInviteData(null);setStack(s=>[...s,{type:"venue",data}]);return;}
    if(dest==="promoter"){setSelPromoter(data);setVenue(null);setInviteData(null);setStack(s=>[...s,{type:"promoter",data}]);return;}
    if(dest==="invite"){setInviteData(data);setVenue(null);setSelPromoter(null);setStack(s=>[...s,{type:"invite",data}]);return;}
    if(dest==="profile"){setShowProfile(true);return;}
    setShowProfile(false);setVenue(null);setSelPromoter(null);setInviteData(null);setStack([]);setGt(dest);
  };
  const updateSession = (s) => { _setSession(s); _setSessionState(s); };

  // Periodically refresh JWT before it expires
  useEffect(()=>{
    if(!session?.refresh_token) return;
    const interval=setInterval(async()=>{
      if(isTokenExpired()){
        const refreshed=await refreshSession();
        if(refreshed) _setSessionState(refreshed);
        else { await supaSignOut(); _setSessionState(null); setGuestMode(false); }
      }
    },60000); // check every 60s
    return()=>clearInterval(interval);
  },[session?.refresh_token]);

  const handleSignOut = async () => {
    await supaSignOut();
    _setSessionState(null);
    setGuestMode(false);
    setOnboarded(false);
    setVenue(null); setSelPromoter(null); setInviteData(null); setStack([]);
  };
  const switchMode=(m)=>{setMode(m);setVenue(null);setSelPromoter(null);setInviteData(null);setStack([]);setShowProfile(false);setGt("home");setPt("dashboard");};

  const activeScreen=inviteData?"Invite Landing":selPromoter?"Promoter Profile":venue?"Venue Detail":null;
  const label=activeScreen||(pro?{dashboard:"Dashboard",guests:"Guest List",links:"Invite Links",analytics:"Analytics",payouts:"Payouts",messages:"Messages",pricing:"Pricing"}[pt]:{home:"Home",explore:"Explore",map:"Map",promoters:"Promoters",bookings:"My Bookings"}[gt]);

  const flow=pro
    ?["Dashboard","Guest List","Invite Links","Analytics","Payouts","Messages","Pricing"]
    :["Home","Explore","Map","Promoters","Promoter Profile","Invite Landing","Venue Detail","Reserve Table"];

  const renderScreen=()=>{
    if(!session && !guestMode) return <AuthGate onAuth={(s)=>{ if(s) updateSession(s); setGuestMode(true); }}/>;
    if(!onboarded) return <Onboard onDone={(c,r)=>{setCity(c);if(r==="promoter")setMode("promoter");setOnboarded(true);}}/>;
    if(showProfile) return <Profile go={go} onSwitchMode={switchMode} city={city} onSignOut={handleSignOut} userEmail={session?.user?.email||session?.email} userName={userName}/>;
    if(!pro){
      if(inviteData) return <InviteLanding promoter={inviteData.promoter} event={inviteData.event} go={go} goBack={()=>go("back")} goPromoter={p=>go("promoter",p)}/>;
      if(selPromoter) return <PromoterProfile promoter={selPromoter} goBack={()=>go("back")} goVenue={v=>go("venue",v)} goBookPromoter={(p,ev)=>go("invite",{promoter:p,event:ev})}/>;
      if(venue) return <VenueDetail venue={venue} go={go}/>;
      if(gt==="home") return <Home go={go} city={city} userName={userName}/>;
      if(gt==="explore") return <Explore go={go} city={city}/>;
      if(gt==="map") return <MapScreen go={go} city={city}/>;
      if(gt==="promoters") return <PromotersDir goPromoter={p=>go("promoter",p)}/>;
      if(gt==="bookings") return <Bookings go={go}/>;
      return <Home go={go} userName={userName}/>;
    }
    if(pt==="dashboard") return <ProDash setTab={setPt} pd={pd}/>;
    if(pt==="guests")    return <ProGuests pd={pd}/>;
    if(pt==="links")     return <ProLinks pd={pd}/>;
    if(pt==="analytics") return <ProAnalytics pd={pd}/>;
    if(pt==="payouts")   return <ProPayouts pd={pd}/>;
    if(pt==="messages")  return <ProMessages pd={pd}/>;
    if(pt==="pricing")   return <ProPricing/>;
    return <ProDash setTab={setPt} pd={pd}/>;
  };

  function GuestTabs(){
    const tabs=[
      {id:"home",label:"Home",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill={a?"var(--ink)":"none"} stroke={a?"var(--ink)":"var(--dim)"} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
      {id:"explore",label:"Explore",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--ink)":"var(--dim)"} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
      {id:"map",label:"Map",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--ink)":"var(--dim)"} strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>},
      {id:"promoters",label:"Promoters",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--ink)":"var(--dim)"} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>},
      {id:"bookings",label:"Bookings",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--ink)":"var(--dim)"} strokeWidth="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>},
      {id:"profile",label:"Profile",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--ink)":"var(--dim)"} strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>},
    ];
    const noOverlay=!venue&&!selPromoter&&!inviteData;
    return(
      <div className="tabbar" style={{background:"rgba(245,244,240,.97)"}}>
        {tabs.map(t=>{const a=gt===t.id&&noOverlay;return(
          <div key={t.id} className="tab press" onClick={()=>{setGt(t.id);setVenue(null);setSelPromoter(null);setInviteData(null);setStack([]);}}>
            {t.ic(a)}
            <span style={{fontSize:9,fontWeight:a?700:400,color:a?"var(--ink)":"var(--dim)",fontFamily:"var(--fb)"}}>{t.label}</span>
            {a&&<div style={{width:4,height:1.5,borderRadius:2,background:"var(--ink)"}}/>}
          </div>
        );})}
      </div>
    );
  }

  function ProTabs(){
    const unread=pd.conversations.reduce((s,c)=>s+c.unread,0);
    const tabs=[
      {id:"dashboard",label:"Home",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--gold)":"rgba(255,255,255,.3)"} strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>},
      {id:"guests",label:"Guests",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--gold)":"rgba(255,255,255,.3)"} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>},
      {id:"analytics",label:"Stats",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--gold)":"rgba(255,255,255,.3)"} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
      {id:"payouts",label:"Pay",ic:(a)=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--gold)":"rgba(255,255,255,.3)"} strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>},
      {id:"messages",label:"Chat",ic:(a)=><div style={{position:"relative"}}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a?"var(--gold)":"rgba(255,255,255,.3)"} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>{unread>0&&<div style={{position:"absolute",top:-3,right:-3,width:13,height:13,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#fff",fontFamily:"var(--fb)"}}>{unread}</div>}</div>},
    ];
    return(
      <div className="tabbar" style={{background:"rgba(18,18,30,.97)",borderTopColor:"rgba(255,255,255,.07)"}}>
        {tabs.map(t=>{const a=pt===t.id;return(
          <div key={t.id} className="tab press" onClick={()=>setPt(t.id)}>
            {t.ic(a)}
            <span style={{fontSize:9,fontWeight:a?700:400,color:a?"var(--gold)":"rgba(255,255,255,.28)",fontFamily:"var(--fb)"}}>{t.label}</span>
            {a&&<div style={{width:4,height:1.5,borderRadius:2,background:"var(--gold)"}}/>}
          </div>
        );})}
      </div>
    );
  }

  return(
    <>
      <style>{FONTS+CSS}</style>
      <div style={{position:"fixed",inset:0,background:pro?"#0c0c1a":"#efece6",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",fontFamily:"var(--fb)",transition:"background .4s"}}>

        {/* Ambient */}
        {pro
          ?<div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 25% 25%,rgba(201,168,76,.05),transparent 65%)",pointerEvents:"none"}}/>
          :<div style={{position:"absolute",inset:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.02'/%3E%3C/svg%3E\")",pointerEvents:"none"}}/>
        }

        <div style={{display:"flex",alignItems:"center",gap:52,width:"100%",maxWidth:940,padding:"0 28px",position:"relative",zIndex:1}}>

          {/* Left panel */}
          <div style={{flex:1,minWidth:0,animation:"fadeUp .5s cubic-bezier(.16,1,.3,1) both"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:13}}>
              <div style={{width:16,height:1,background:pro?"var(--gold)":"var(--ink)"}}/>
              <span style={{fontSize:10,fontWeight:600,letterSpacing:".14em",color:pro?"var(--gold)":"var(--ink2)",textTransform:"uppercase",fontFamily:"var(--fb)"}}>{pro?"Promoter Mode":"Nightlife App"}</span>
            </div>
            <div style={{fontFamily:"var(--fd)",fontWeight:400,fontStyle:"italic",fontSize:54,lineHeight:.9,letterSpacing:"-.03em",marginBottom:9,color:pro?"white":"var(--ink)"}}>luma</div>
            <p style={{fontFamily:"var(--fd)",fontSize:15,color:pro?"rgba(255,255,255,.45)":"var(--ink2)",lineHeight:1.5,marginBottom:6,fontWeight:500}}>
              {pro?"Build your guestlist.\nTrack every booking.":"Your Personal Concierge for\nPremium Access & Experiences."}
            </p>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {(pro?["Promote.","Earn.","Grow."]:["Book.","Access.","Flex."]).map((w,i)=>(
                <span key={w} style={{fontFamily:"var(--fd)",fontWeight:700,fontSize:14,color:pro?["var(--gold)","rgba(255,255,255,.45)","rgba(255,255,255,.2)"][i]:["var(--ink)","var(--ink2)","var(--sub)"][i]}}>{w}</span>
              ))}
            </div>

            {/* Role switcher */}
            <div style={{background:pro?"rgba(255,255,255,.04)":"rgba(0,0,0,.04)",border:`1px solid ${pro?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`,borderRadius:14,padding:"11px 13px",marginBottom:20}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",color:pro?"rgba(255,255,255,.25)":"var(--dim)",textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:8}}>Switch Role</div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>switchMode("guest")} className="press" style={{flex:1,padding:"8px",borderRadius:11,border:`1.5px solid ${!pro?"var(--ink)":"rgba(255,255,255,.08)"}`,fontFamily:"var(--fb)",fontWeight:700,fontSize:12,cursor:"pointer",background:!pro?"var(--ink)":"transparent",color:!pro?"white":pro?"rgba(255,255,255,.3)":"var(--sub)",transition:"all .2s"}}>🎟 Guest</button>
                <button onClick={()=>switchMode("promoter")} className="press" style={{flex:1,padding:"8px",borderRadius:11,border:`1.5px solid ${pro?"var(--gold)":"rgba(0,0,0,.08)"}`,fontFamily:"var(--fb)",fontWeight:700,fontSize:12,cursor:"pointer",background:pro?"var(--gold)":"transparent",color:pro?"white":"var(--sub)",transition:"all .2s"}}>⚡ Promoter</button>
              </div>
            </div>

            {/* Flow */}
            <div style={{background:pro?"rgba(255,255,255,.03)":"rgba(0,0,0,.03)",border:`1px solid ${pro?"rgba(255,255,255,.06)":"rgba(0,0,0,.07)"}`,borderRadius:13,padding:"11px 15px"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",color:pro?"rgba(255,255,255,.22)":"var(--dim)",textTransform:"uppercase",marginBottom:9,fontFamily:"var(--fb)"}}>Current Flow</div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {flow.map((f,i)=>{const on=label===f;return(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:9,color:on?(pro?"var(--gold)":"var(--ink)"):pro?"rgba(255,255,255,.18)":"var(--dim)",width:8,fontFamily:"var(--fb)",fontWeight:600}}>{i+1}</span>
                    <div style={{width:4,height:4,borderRadius:"50%",background:on?(pro?"var(--gold)":"var(--ink)"):pro?"rgba(255,255,255,.13)":"var(--dim)",flexShrink:0,transition:"all .3s"}}/>
                    <span style={{fontSize:11,color:on?(pro?"white":"var(--ink)"):(pro?"rgba(255,255,255,.28)":"var(--sub)"),fontWeight:on?600:400,fontFamily:"var(--fb)",flex:1,transition:"all .2s"}}>{f}</span>
                    {on&&<span style={{fontSize:8,fontWeight:700,color:pro?"var(--gold)":"var(--ink)",fontFamily:"var(--fb)"}}>● NOW</span>}
                  </div>
                );})}
              </div>
            </div>
          </div>

          {/* iPhone */}
          <div style={{flexShrink:0,animation:"popIn .6s cubic-bezier(.16,1,.3,1) .1s both"}}>
            <div style={{width:368,height:798,background:pro?"var(--pro)":"var(--bg)",borderRadius:50,
              boxShadow:`0 0 0 1px rgba(0,0,0,.12),0 0 0 9px #1c1c1e,0 0 0 10px #000,0 60px 160px rgba(0,0,0,.45)${pro?",0 0 70px rgba(201,168,76,.07)":""}`,
              overflow:"hidden",display:"flex",flexDirection:"column",position:"relative",transition:"background .4s"}}>
              {/* Dynamic island */}
              <div style={{position:"absolute",top:11,left:"50%",transform:"translateX(-50%)",width:112,height:33,background:"#000",borderRadius:20,zIndex:50}}/>
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRadius:50}} key={mode+(pro?pt:gt)+(venue?.id||"")+(selPromoter?.id||"")+(inviteData?.event?.id||"")}>
                <SB dark={pro}/>
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div key={pro?pt:gt+(venue?.id||"")+(selPromoter?.id||"")+(showProfile?"p":"")} style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
                    {renderScreen()}
                  </div>
                </div>
                {(!pro&&!venue&&!selPromoter&&!inviteData)||pro?<>{pro?<ProTabs/>:<GuestTabs/>}</>:null}
              </div>
              {/* Side buttons */}
              <div style={{position:"absolute",left:-3,top:108,width:3,height:26,background:"#2c2c2e",borderRadius:"3px 0 0 3px"}}/>
              <div style={{position:"absolute",left:-3,top:148,width:3,height:57,background:"#2c2c2e",borderRadius:"3px 0 0 3px"}}/>
              <div style={{position:"absolute",left:-3,top:218,width:3,height:57,background:"#2c2c2e",borderRadius:"3px 0 0 3px"}}/>
              <div style={{position:"absolute",right:-3,top:144,width:3,height:73,background:"#2c2c2e",borderRadius:"0 3px 3px 0"}}/>
            </div>
          </div>
        </div>

        <div style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",fontSize:10,color:pro?"rgba(255,255,255,.18)":"rgba(0,0,0,.22)",letterSpacing:".07em",whiteSpace:"nowrap",fontFamily:"var(--fb)"}}>
          luma.vip - {pro?"promoter portal":"your personal concierge"}
        </div>
      </div>
    </>
  );
}
