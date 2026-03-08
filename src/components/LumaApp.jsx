import { useState, useEffect, useRef } from "react";

// -----------------------------------------------
// Supabase config - no SDK, plain fetch
// -----------------------------------------------
const SUPA_URL  = "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnlyc3JkaHNrdmRtbG5wc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njc0NDcsImV4cCI6MjA4ODM0MzQ0N30.o1CPKQP1qrvonHJFm7UESuFmgTa3z-BJqePMSVn7ZkI";
const EDGE_URL  = SUPA_URL + "/functions/v1";

// Session store - in-memory (artifact-safe)
let _session = null;
const _memStore = {};
function getSession() { return _session; }
function _setSession(s) {
  _session = s;
  try {
    if (s) _memStore["luma_sess"] = JSON.stringify(s);
    else   delete _memStore["luma_sess"];
  } catch(e) {}
}
// Restore on load
try { const r = _memStore["luma_sess"]; if (r) _session = JSON.parse(r); } catch(_e) {}

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

// Call an Edge Function with auth
async function edgeCall(fn, body) {
  const sess = getSession();
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
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeScreen{from{opacity:0}to{opacity:1}}
.fade-screen{animation:fadeScreen .7s cubic-bezier(.16,1,.3,1) both}
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
.tabbar{display:flex;border-top:1px solid var(--line);padding:9px 0 16px;flex-shrink:0}
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

// Track promoter invite link clicks (public, no auth needed)
async function trackLinkClick(linkId, promoterId) {
  try {
    fetch(SUPA_URL + "/rest/v1/link_clicks", {
      method: "POST",
      headers: { "apikey": SUPA_ANON, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ link_id: linkId, promoter_id: promoterId, clicked_at: new Date().toISOString() })
    }).catch(() => {});
  } catch (e) {}
}

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

function useUserBookings(refreshKey) {
  const [bookings, setBookings] = useState([]);
  const [localBookings, setLocalBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const sess = getSession();
    if (!sess?.access_token) return;
    setLoading(true);
    fetch(EDGE_URL + "/get-bookings", {
      headers: {
        "apikey": SUPA_ANON,
        "Authorization": "Bearer " + sess.access_token
      }
    })
      .then(r => r.json())
      .then(d => {
        if (d.bookings) {
          const normalized = d.bookings.map(b => ({
            ...b,
            venue: b.venues?.name || "Venue",
            img: b.venues?.img_url || "",
            type: b.venues?.type || "Rooftop",
            date: b.event_date ? new Date(b.event_date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}) : "",
            table: b.notes || "Reserved Table",
            code: b.confirmation_code || "------",
          }));
          setBookings(normalized);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const addLocal = (b) => setLocalBookings(prev => [b, ...prev]);
  const all = [...localBookings, ...bookings];
  return { bookings: all, loading, addLocal };
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
  const {venues:allVenues}=useVenues(metro);
  const hot=allVenues.filter(v=>v.hot);
  const display=allVenues.length?allVenues:VENUES.filter(v=>v.metro===metro);
  const hotStrip=hot.length?hot:display.slice(0,3);
  const hero=hotStrip[0]||display[0]||VENUES[0];
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--bg)"}}>
      {/* Hero */}
      <div style={{position:"relative",height:250}}>
        <Img src={hero.img} style={{position:"absolute",inset:0}} alt={hero.name} type={hero.type} name={hero.name}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.8),transparent 55%)"}}/>
        <div style={{position:"absolute",top:8,left:20,right:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:10,color:"rgba(255,255,255,.55)",fontFamily:"var(--fb)"}}>📍 {city==="New York"?"New York, NY":"Miami, FL"}</div><div style={{fontFamily:"var(--fd)",fontSize:19,fontStyle:"italic",color:"white"}}>{getGreeting()}, {userName}</div></div>
          <div onClick={()=>go("profile")} className="press" style={{width:35,height:35,borderRadius:"50%",background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)",cursor:"pointer"}}>{userName[0]||"G"}</div>
        </div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 18px 14px"}}>
          <span style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",color:"white",padding:"2px 8px",borderRadius:18,fontSize:9,fontWeight:700,fontFamily:"var(--fb)"}}>🔥 Featured Tonight</span>
          <div style={{fontFamily:"var(--fd)",fontSize:21,fontWeight:700,color:"white",marginTop:4}}>{hero.name}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:10,color:"rgba(255,255,255,.55)",fontFamily:"var(--fb)"}}>📍 {hero.city} . {hero.distance}</span>
            <button onClick={()=>go("venue",hero)} className="press" style={{background:"white",border:"none",borderRadius:18,color:"var(--ink)",padding:"6px 13px",fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>Reserve -></button>
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
          {hotStrip.map((v,i)=>(
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
        {display.map(v=>(
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
  const {venues:dbVenues,loading}=useVenues(metro);

  // Search server-side when query changes (debounced)
  const [searchResults,setSearchResults]=useState(null);
  const [searching,setSearching]=useState(false);
  useEffect(()=>{
    if(!q||q.length<2){setSearchResults(null);return;}
    setSearching(true);
    const t=setTimeout(()=>{
      fetch(EDGE_URL+"/get-venues?metro="+encodeURIComponent(metro)+"&search="+encodeURIComponent(q),{
        headers:{"apikey":SUPA_ANON}
      }).then(r=>r.json()).then(d=>{
        if(d.venues?.length){
          const merged=d.venues.map(v=>{
            const local=VENUES.find(l=>l.name===v.name)||{};
            return{...local,...v,id:v.id,metro,price:v.price_min,img:v.img_url||local.img,
              lat:parseFloat(v.lat)||local.lat,lng:parseFloat(v.lng)||local.lng,
              distance:v.distance||local.distance||"0.5 mi",rating:parseFloat(v.rating)||local.rating||4.5};
          });
          setSearchResults(merged);
        } else setSearchResults([]);
      }).catch(()=>setSearchResults(null)).finally(()=>setSearching(false));
    },400);
    return()=>clearTimeout(t);
  },[q,metro]);

  const base=searchResults!==null?searchResults:dbVenues;

  let list=base.filter(v=>
    (!q||q.length<2||searchResults!==null||[v.name,v.city,v.type,...(v.tags||[])].some(x=>(x||"").toLowerCase().includes(q.toLowerCase())))&&
    (typeFilter==="All"||v.type===typeFilter)
  );

  const dates=(()=>{
    const arr=["Tonight"];
    const d=new Date();
    for(let i=1;i<=4;i++){const nd=new Date(d);nd.setDate(d.getDate()+i);arr.push(nd.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}));}
    return arr;
  })();
  const types=["All","Rooftop","Nightclub","Lounge","Pool Party"];

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
  const W=390,H=430;
  const metro=city==="New York"?"New York":"Miami";
  const {venues:cityVenues}=useVenues(metro);
  const filters=["All","Rooftop","Nightclub","Lounge","Pool Party"];

  // Map center per city
  const DEF={
    "Miami":    {lat:25.774, lng:-80.190, s:3400},
    "New York": {lat:40.748, lng:-73.990, s:3400},
  };
  const {lat:CY,lng:CX,s:S0}=DEF[metro];

  const [scale,setScale]=useState(S0);
  const [pan,setPan]=useState({x:0,y:0});
  const [sel,setSel]=useState(null);
  const [filter,setFilter]=useState("All");
  const sR=useRef(S0),pR=useRef({x:0,y:0}),dragR=useRef(null),pinchR=useRef(null),svgEl=useRef(null);

  useEffect(()=>{
    sR.current=S0;pR.current={x:0,y:0};
    setScale(S0);setPan({x:0,y:0});setSel(null);setFilter("All");
  },[city]);

  // Project lat/lng -> SVG xy
  const pr=(lat,lng,s,p)=>{
    const sc=s??scale,pp=p??pan;
    return{x:W/2+(lng-CX)*sc+pp.x, y:H/2-(lat-CY)*sc+pp.y};
  };
  const pts2d=(arr,s,p)=>arr.map(([la,ln],i)=>{const{x,y}=pr(la,ln,s,p);return(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}).join('');
  const pts2p=(arr,s,p)=>pts2d(arr,s,p)+'Z';

  // Zoom
  const doZoom=(dz,sx=0,sy=0)=>{
    const s0=sR.current,s1=Math.max(1200,Math.min(14000,s0*Math.pow(1.35,dz)));
    const r=s1/s0,p=pR.current;
    const np={x:(p.x-sx)*r+sx,y:(p.y-sy)*r+sy};
    sR.current=s1;pR.current=np;setScale(s1);setPan({...np});
  };

  // Events
  useEffect(()=>{
    const el=svgEl.current;if(!el)return;
    const ts=e=>{
      if(e.touches.length===1){
        const t=e.touches[0];dragR.current={cx:t.clientX,cy:t.clientY,px:pR.current.x,py:pR.current.y};pinchR.current=null;
      }else if(e.touches.length===2){
        dragR.current=null;
        const[a,b]=[e.touches[0],e.touches[1]];
        const d=Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);
        const r=el.getBoundingClientRect();
        pinchR.current={d,mx:(a.clientX+b.clientX)/2-r.left-W/2,my:(a.clientY+b.clientY)/2-r.top-H/2,s:sR.current,p:{...pR.current}};
      }
      e.preventDefault();
    };
    const tm=e=>{
      if(e.touches.length===1&&dragR.current){
        const t=e.touches[0];
        const np={x:dragR.current.px+(t.clientX-dragR.current.cx),y:dragR.current.py+(t.clientY-dragR.current.cy)};
        pR.current=np;setPan({...np});
      }else if(e.touches.length===2&&pinchR.current){
        const[a,b]=[e.touches[0],e.touches[1]];
        const d=Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);
        const r=d/pinchR.current.d;
        const s1=Math.max(1200,Math.min(14000,pinchR.current.s*r));
        const rv=s1/pinchR.current.s,{mx,my,p}=pinchR.current;
        const np={x:(p.x-mx)*rv+mx,y:(p.y-my)*rv+my};
        sR.current=s1;pR.current=np;setScale(s1);setPan({...np});
      }
      e.preventDefault();
    };
    const te=()=>{dragR.current=null;pinchR.current=null;};
    const md=e=>{dragR.current={cx:e.clientX,cy:e.clientY,px:pR.current.x,py:pR.current.y};};
    const wh=e=>{
      const r=el.getBoundingClientRect();
      doZoom(e.deltaY<0?1:-1,e.clientX-r.left-W/2,e.clientY-r.top-H/2);
      e.preventDefault();
    };
    el.addEventListener("mousedown",md);
    el.addEventListener("touchstart",ts,{passive:false});
    el.addEventListener("touchmove",tm,{passive:false});
    el.addEventListener("touchend",te);
    el.addEventListener("wheel",wh,{passive:false});
    return()=>{
      el.removeEventListener("mousedown",md);
      el.removeEventListener("touchstart",ts);
      el.removeEventListener("touchmove",tm);
      el.removeEventListener("touchend",te);
      el.removeEventListener("wheel",wh);
    };
  },[]);

  useEffect(()=>{
    const mm=e=>{
      if(!dragR.current)return;
      const np={x:dragR.current.px+(e.clientX-dragR.current.cx),y:dragR.current.py+(e.clientY-dragR.current.cy)};
      pR.current=np;setPan({...np});
    };
    const mu=()=>{dragR.current=null;};
    window.addEventListener("mousemove",mm);
    window.addEventListener("mouseup",mu);
    return()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);};
  },[]);

  const flyTo=(lat,lng)=>{
    const goal={x:-(lng-CX)*sR.current,y:(lat-CY)*sR.current};
    const from={...pR.current};
    let t0=null;
    const step=ts=>{
      if(!t0)t0=ts;
      const t=Math.min(1,(ts-t0)/480);
      const e=1-(1-t)**3;
      const np={x:from.x+(goal.x-from.x)*e,y:from.y+(goal.y-from.y)*e};
      pR.current=np;setPan({...np});
      if(t<1)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ----------------------------------------------- MAP DATA -------------------------------------------------
  // All coordinates are [lat, lng]
  const MIAMI={
    // Water bodies - carefully traced outlines
    water:[
      // Biscayne Bay (between mainland and Miami Beach)
      {id:"bay",pts:[
        [25.706,-80.168],[25.706,-80.133],[25.720,-80.126],[25.736,-80.122],
        [25.752,-80.120],[25.769,-80.120],[25.786,-80.122],[25.803,-80.125],
        [25.820,-80.128],[25.838,-80.133],[25.855,-80.140],[25.855,-80.155],
        [25.840,-80.152],[25.820,-80.148],[25.800,-80.145],[25.780,-80.143],
        [25.760,-80.142],[25.742,-80.143],[25.726,-80.148],[25.712,-80.158],
      ],label:{la:25.780,ln:-80.150,t:"Biscayne Bay"}},
      // Atlantic Ocean (east of Miami Beach)
      {id:"ocean",pts:[
        [25.706,-80.122],[25.706,-80.065],[25.855,-80.065],[25.855,-80.100],
        [25.840,-80.096],[25.820,-80.093],[25.800,-80.091],[25.780,-80.091],
        [25.760,-80.092],[25.742,-80.094],[25.726,-80.100],[25.712,-80.112],
      ],label:{la:25.780,ln:-80.082,t:"Atlantic Ocean"}},
      // Government Cut / Port Miami
      {id:"cut",pts:[
        [25.758,-80.157],[25.758,-80.128],[25.762,-80.128],[25.762,-80.157],
      ]},
    ],
    // Parks & green areas
    parks:[
      {id:"bayfront",pts:[[25.774,-80.189],[25.774,-80.183],[25.779,-80.183],[25.779,-80.189]]},
      {id:"southpointe",pts:[[25.757,-80.138],[25.757,-80.130],[25.762,-80.130],[25.762,-80.138]]},
      {id:"lummus",pts:[[25.778,-80.132],[25.778,-80.128],[25.800,-80.128],[25.800,-80.132]]},
      {id:"key",pts:[[25.740,-80.260],[25.740,-80.245],[25.751,-80.245],[25.751,-80.260]]},
    ],
    // Highways (thick, yellow)
    hwys:[
      {id:"i95",pts:[[25.706,-80.210],[25.740,-80.209],[25.760,-80.208],[25.790,-80.207],[25.820,-80.207],[25.850,-80.207]]},
      {id:"836",pts:[[25.772,-80.240],[25.772,-80.210],[25.773,-80.192],[25.774,-80.180],[25.776,-80.165],[25.779,-80.152]]},
      {id:"mac",pts:[[25.774,-80.195],[25.775,-80.180],[25.776,-80.162],[25.775,-80.148],[25.773,-80.135],[25.770,-80.128]]},
      {id:"julia",pts:[[25.806,-80.195],[25.807,-80.180],[25.808,-80.163],[25.807,-80.148],[25.805,-80.136],[25.803,-80.128]]},
      {id:"395",pts:[[25.774,-80.195],[25.770,-80.175],[25.763,-80.160],[25.757,-80.148]]},
    ],
    // Major roads (white, thick)
    roads:[
      {id:"biscblvd",pts:[[25.706,-80.187],[25.730,-80.187],[25.752,-80.187],[25.775,-80.186],[25.800,-80.186],[25.825,-80.186],[25.850,-80.186]]},
      {id:"miami2ave",pts:[[25.706,-80.199],[25.750,-80.199],[25.775,-80.199],[25.800,-80.199],[25.825,-80.199],[25.850,-80.200]]},
      {id:"collinsa",pts:[[25.757,-80.131],[25.770,-80.129],[25.785,-80.127],[25.800,-80.126],[25.820,-80.124],[25.840,-80.122]]},
      {id:"oceandrive",pts:[[25.757,-80.134],[25.770,-80.132],[25.783,-80.131],[25.793,-80.130]]},
      {id:"flagler",pts:[[25.774,-80.245],[25.774,-80.225],[25.774,-80.205],[25.774,-80.187],[25.774,-80.175]]},
      {id:"sw8",pts:[[25.765,-80.245],[25.765,-80.225],[25.765,-80.205],[25.765,-80.190]]},
      {id:"nw36",pts:[[25.815,-80.240],[25.815,-80.215],[25.815,-80.200],[25.815,-80.188]]},
      {id:"41st",pts:[[25.796,-80.145],[25.797,-80.132],[25.797,-80.125]]},
      {id:"5th",pts:[[25.823,-80.215],[25.823,-80.200],[25.823,-80.188]]},
    ],
    // Minor streets (light, thin) - denser grid feel
    minor:[
      // N-S streets downtown/brickell area
      ...[[-80.195],[-80.193],[-80.191],[-80.189]].map(([ln],i)=>({id:"ns"+i,pts:[[25.706,ln],[25.775,ln]]})),
      // Brickell cross streets
      ...[25.742,25.748,25.754,25.760,25.766].map((la,i)=>({id:"bk"+i,pts:[[la,-80.210],[la,-80.186]]})),
      // Wynwood area
      ...[25.795,25.799,25.803,25.808].map((la,i)=>({id:"wy"+i,pts:[[la,-80.218],[la,-80.192]]})),
      // Miami Beach cross streets
      ...[25.768,25.775,25.783,25.793,25.800,25.810].map((la,i)=>({id:"mb"+i,pts:[[la,-80.145],[la,-80.125]]})),
    ],
    // Neighborhood labels
    labels:[
      {la:25.758,ln:-80.195,t:"Brickell"},
      {la:25.775,ln:-80.215,t:"Downtown"},
      {la:25.803,ln:-80.212,t:"Wynwood"},
      {la:25.770,ln:-80.131,t:"South Beach"},
      {la:25.797,ln:-80.128,t:"Mid Beach"},
      {la:25.745,ln:-80.265,t:"Coral Gables"},
      {la:25.820,ln:-80.193,t:"Little Haiti"},
      {la:25.748,ln:-80.232,t:"Coconut Grove"},
    ],
  };

  const NYC={
    water:[
      // Hudson River
      {id:"hudson",pts:[
        [40.694,-74.033],[40.720,-74.033],[40.748,-74.032],[40.770,-74.031],[40.781,-74.030],
        [40.781,-74.020],[40.770,-74.020],[40.748,-74.020],[40.720,-74.020],[40.694,-74.020],
      ],label:{la:40.745,ln:-74.026,t:"Hudson River"}},
      // East River
      {id:"east",pts:[
        [40.694,-73.982],[40.720,-73.978],[40.748,-73.975],[40.770,-73.972],[40.781,-73.970],
        [40.781,-73.958],[40.770,-73.960],[40.748,-73.963],[40.720,-73.967],[40.694,-73.972],
      ],label:{la:40.745,ln:-73.966,t:"East River"}},
      // Upper New York Bay
      {id:"bay",pts:[
        [40.677,-74.033],[40.694,-74.033],[40.694,-74.002],[40.688,-73.998],[40.677,-73.995],
      ]},
    ],
    parks:[
      // Central Park - accurate rectangle
      {id:"cp",pts:[[40.7644,-73.9818],[40.7994,-73.9818],[40.7994,-73.9583],[40.7644,-73.9583]]},
      {id:"battery",pts:[[40.700,-74.020],[40.706,-74.020],[40.706,-74.013],[40.700,-74.013]]},
      {id:"union",pts:[[40.734,-73.992],[40.737,-73.992],[40.737,-73.988],[40.734,-73.988]]},
      {id:"riverside",pts:[[40.780,-73.989],[40.795,-73.989],[40.795,-73.987],[40.780,-73.987]]},
    ],
    hwys:[
      {id:"westsidehwy",pts:[[40.694,-74.018],[40.720,-74.017],[40.748,-74.015],[40.770,-74.013],[40.781,-74.012]]},
      {id:"fdr",pts:[[40.700,-73.975],[40.720,-73.972],[40.748,-73.967],[40.770,-73.963],[40.781,-73.960]]},
      {id:"bklyn",pts:[[40.706,-73.999],[40.703,-73.987]]},
      {id:"manhattan",pts:[[40.713,-73.999],[40.710,-73.982]]},
    ],
    roads:[
      // Avenues (N-S)
      {id:"8th",pts:[[40.700,-74.000],[40.730,-74.000],[40.755,-74.000],[40.770,-74.001]]},
      {id:"7th",pts:[[40.700,-73.997],[40.730,-73.997],[40.755,-73.996],[40.768,-73.997]]},
      {id:"bway",pts:[[40.706,-74.010],[40.720,-74.003],[40.740,-73.995],[40.755,-73.988],[40.770,-73.982],[40.781,-73.977]]},
      {id:"5th",pts:[[40.700,-73.990],[40.730,-73.990],[40.756,-73.990],[40.770,-73.990]]},
      {id:"madison",pts:[[40.700,-73.988],[40.730,-73.987],[40.756,-73.987],[40.770,-73.987]]},
      {id:"park",pts:[[40.700,-73.984],[40.730,-73.984],[40.756,-73.983],[40.770,-73.984]]},
      {id:"lex",pts:[[40.700,-73.981],[40.730,-73.981],[40.756,-73.981],[40.770,-73.981]]},
      {id:"3rd",pts:[[40.700,-73.978],[40.730,-73.977],[40.756,-73.978],[40.770,-73.978]]},
      // Streets (E-W)
      {id:"14th",pts:[[40.738,-74.010],[40.737,-73.990],[40.736,-73.972]]},
      {id:"23rd",pts:[[40.745,-74.003],[40.744,-73.990],[40.743,-73.972]]},
      {id:"34th",pts:[[40.750,-74.003],[40.750,-73.985],[40.749,-73.970]]},
      {id:"42nd",pts:[[40.756,-74.003],[40.756,-73.982],[40.756,-73.960]]},
      {id:"57th",pts:[[40.764,-74.003],[40.764,-73.980],[40.763,-73.960]]},
      {id:"72nd",pts:[[40.773,-73.995],[40.773,-73.980],[40.773,-73.963]]},
      {id:"86th",pts:[[40.783,-73.990],[40.782,-73.974],[40.782,-73.957]]},
      {id:"96th",pts:[[40.791,-73.990],[40.790,-73.975],[40.789,-73.961]]},
    ],
    minor:[
      ...[40.716,40.721,40.727,40.732,40.740,40.747,40.760,40.768,40.776].map((la,i)=>({id:"st"+i,pts:[[la,-74.005],[la,-73.974]]})),
    ],
    labels:[
      {la:40.782,ln:-73.972,t:"Upper West Side"},
      {la:40.782,ln:-73.947,t:"Upper East Side"},
      {la:40.758,ln:-73.985,t:"Midtown"},
      {la:40.742,ln:-73.999,t:"Chelsea"},
      {la:40.742,ln:-73.983,t:"Gramercy"},
      {la:40.730,ln:-73.998,t:"Village"},
      {la:40.723,ln:-73.997,t:"SoHo"},
      {la:40.706,ln:-74.009,t:"Tribeca"},
      {la:40.706,ln:-73.993,t:"Lower Manhattan"},
    ],
  };

  const feat=metro==="New York"?NYC:MIAMI;
  const filteredVenues=filter==="All"?cityVenues:cityVenues.filter(v=>v.type===filter);
  const uLat=metro==="New York"?40.7505:25.776,uLng=metro==="New York"?-73.9934:-80.192;
  const uPos=pr(uLat,uLng);
  const rw=Math.max(1,scale/2600); // road width scales with zoom

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--bg)"}}>
      <div style={{padding:"4px 18px 10px",flexShrink:0}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"var(--ink)",marginBottom:9}}>Nearby</div>
        <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:1}}>
          {filters.map(f=>(
            <button key={f} onClick={()=>{setFilter(f);setSel(null);}} className="press"
              style={{flexShrink:0,padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,
                fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",transition:"all .15s",
                background:filter===f?"var(--ink)":"transparent",
                borderColor:filter===f?"var(--ink)":"var(--line2)",
                color:filter===f?"white":"var(--ink2)"}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <svg ref={svgEl} width="100%" height="100%" viewBox={"0 0 "+W+" "+H}
          style={{display:"block",cursor:"grab",touchAction:"none",userSelect:"none",background:"#f5f1e8"}}>
          <defs>
            <clipPath id="mapclip"><rect width={W} height={H}/></clipPath>
          </defs>
          <g clipPath="url(#mapclip)">

          {/* Land base */}
          <rect width={W} height={H} fill="#f5f1e8"/>

          {/* Block fill - subtle checker for urban feel */}
          <rect width={W} height={H} fill="url(#blockfill)" opacity={0.3}/>

          {/* Parks */}
          {feat.parks.map(pk=>(
            <path key={pk.id} d={pts2p(pk.pts)} fill="#c8e6a0" stroke="#aad580" strokeWidth={0.5}/>
          ))}

          {/* Water */}
          {feat.water.map(w=>(
            <path key={w.id} d={pts2p(w.pts)} fill="#aacfe8" stroke="#90bfd8" strokeWidth={0.8}/>
          ))}

          {/* Minor streets - very subtle */}
          {feat.minor.map(r=>{
            const d=pts2d(r.pts);
            if(!d)return null;
            return(<path key={r.id} d={d} fill="none" stroke="#e8e4dc" strokeWidth={Math.max(0.6,rw*0.8)} strokeLinecap="round"/>);
          })}

          {/* Major road casings (border effect) */}
          {feat.roads.map(r=>(
            <path key={"c"+r.id} d={pts2d(r.pts)} fill="none"
              stroke="#ddd8cc" strokeWidth={Math.max(2,rw*2.8)} strokeLinecap="round"/>
          ))}
          {/* Major roads */}
          {feat.roads.map(r=>(
            <path key={r.id} d={pts2d(r.pts)} fill="none"
              stroke="white" strokeWidth={Math.max(1.2,rw*2)} strokeLinecap="round"/>
          ))}

          {/* Highway casings */}
          {feat.hwys.map(h=>(
            <path key={"hc"+h.id} d={pts2d(h.pts)} fill="none"
              stroke="#e8c84a" strokeWidth={Math.max(3.5,rw*4.5)} strokeLinecap="round" opacity={0.5}/>
          ))}
          {/* Highways */}
          {feat.hwys.map(h=>(
            <path key={h.id} d={pts2d(h.pts)} fill="none"
              stroke="#f7d94c" strokeWidth={Math.max(2.5,rw*3.2)} strokeLinecap="round"/>
          ))}

          {/* Water labels */}
          {feat.water.filter(w=>w.label).map(w=>{
            const{x,y}=pr(w.label.la,w.label.ln);
            if(x<0||x>W||y<0||y>H)return null;
            return(
              <text key={"wl"+w.id} x={x} y={y} textAnchor="middle"
                fill="#5a8fa8" fontSize={Math.max(7,9*scale/S0)} fontStyle="italic"
                fontFamily="'DM Sans',sans-serif" fontWeight="500" opacity={0.85}>
                {w.label.t}
              </text>
            );
          })}

          {/* Neighborhood labels */}
          {feat.labels.map((l,i)=>{
            const{x,y}=pr(l.la,l.ln);
            if(x<-20||x>W+20||y<-20||y>H+20)return null;
            return(
              <text key={"nl"+i} x={x} y={y} textAnchor="middle"
                fill="#9a9488" fontSize={Math.max(6,8*scale/S0)}
                fontFamily="'DM Sans',sans-serif" fontWeight="600"
                letterSpacing="0.04em" textTransform="uppercase">
                {l.t.toUpperCase()}
              </text>
            );
          })}

          {/* Venue markers */}
          {filteredVenues.map(v=>{
            const{x,y}=pr(v.lat,v.lng);
            if(x<-60||x>W+60||y<-60||y>H+60)return null;
            const active=sel?.id===v.id;
            const pw=38,ph=22,pr2=11;
            return(
              <g key={v.id} style={{cursor:"pointer"}}
                onMouseDown={e=>e.stopPropagation()}
                onClick={e=>{e.stopPropagation();const a=!active;setSel(a?v:null);if(a)flyTo(v.lat,v.lng);}}>
                {/* Shadow */}
                <rect x={x-pw/2+1} y={y-ph-9+3} width={pw} height={ph} rx={pr2}
                  fill="rgba(0,0,0,.14)" filter="blur(2px)"/>
                {/* Bubble */}
                <rect x={x-pw/2} y={y-ph-9} width={pw} height={ph} rx={pr2}
                  fill={active?"#0a0a0a":"white"}
                  stroke={active?"none":"rgba(0,0,0,.12)"} strokeWidth={1}/>
                {/* Caret */}
                <polygon points={`${x-5},${y-10} ${x+5},${y-10} ${x},${y-3}`}
                  fill={active?"#0a0a0a":"white"}/>
                {/* Price text */}
                <text x={x} y={y-ph/2-9+8} textAnchor="middle"
                  fill={active?"white":"#0a0a0a"}
                  fontSize={active?11:10.5} fontWeight="700"
                  fontFamily="'DM Sans',sans-serif">
                  {"$"+v.price+"+"}
                </text>
                {/* Hot badge */}
                {v.hot&&!active&&(
                  <circle cx={x+pw/2-4} cy={y-ph-9+4} r={4.5} fill="#ef4444"/>
                )}
              </g>
            );
          })}

          {/* User location */}
          <circle cx={uPos.x} cy={uPos.y} r={11} fill="rgba(59,130,246,.18)"/>
          <circle cx={uPos.x} cy={uPos.y} r={6} fill="#3b82f6" stroke="white" strokeWidth={2.5}/>

          </g>
        </svg>

        {/* Zoom controls */}
        <div style={{position:"absolute",right:12,top:12,zIndex:20,
          display:"flex",flexDirection:"column",
          boxShadow:"0 2px 12px rgba(0,0,0,.15)",borderRadius:11,overflow:"hidden"}}>
          {[["＋",1],["－",-1]].map(([lbl,dz])=>(
            <button key={lbl}
              onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();doZoom(dz);}}
              style={{width:36,height:36,background:"rgba(255,255,255,.96)",border:"none",
                borderBottom:lbl==="＋"?"1px solid rgba(0,0,0,.08)":"none",
                fontSize:16,fontWeight:400,color:"#0a0a0a",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Recenter button */}
        <button
          onMouseDown={e=>e.stopPropagation()}
          onClick={e=>{e.stopPropagation();sR.current=S0;pR.current={x:0,y:0};setScale(S0);setPan({x:0,y:0});setSel(null);}}
          style={{position:"absolute",left:12,top:12,zIndex:20,
            width:36,height:36,borderRadius:"50%",
            background:"rgba(255,255,255,.96)",border:"none",
            boxShadow:"0 2px 12px rgba(0,0,0,.15)",
            cursor:"pointer",fontSize:16,backdropFilter:"blur(8px)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
          🎯
        </button>

        {/* Selected venue popup */}
        {sel&&(
          <div style={{position:"absolute",bottom:14,left:12,right:12,zIndex:30,
            background:"white",borderRadius:20,padding:"13px 14px",
            boxShadow:"0 12px 40px rgba(0,0,0,.2)",
            animation:"slideUp .22s cubic-bezier(.16,1,.3,1) both",
            display:"flex",gap:12,alignItems:"center"}}
            onMouseDown={e=>e.stopPropagation()}>
            <div style={{width:58,height:58,borderRadius:14,overflow:"hidden",flexShrink:0}}>
              <Img src={sel.img} style={{width:"100%",height:"100%"}} alt={sel.name} type={sel.type} name={sel.name}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)",marginBottom:2}}>{sel.name}</div>
              <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:5}}>{"📍 "+sel.city+" . "+sel.type+" . "+sel.distance}</div>
              <Stars r={sel.rating}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end",flexShrink:0}}>
              <div style={{fontFamily:"var(--fd)",fontSize:17,fontWeight:700}}>{"$"+sel.price+"+"}</div>
              <button onClick={()=>go("venue",sel)} className="press"
                style={{padding:"7px 14px",background:"var(--ink)",color:"white",border:"none",
                  borderRadius:20,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>
                Reserve ->
              </button>
            </div>
            <button onClick={()=>setSel(null)}
              style={{position:"absolute",top:10,right:10,width:22,height:22,
                borderRadius:"50%",background:"#f0ede8",border:"none",cursor:"pointer",
                fontSize:10,color:"#666",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Venue strip */}
      <div style={{flexShrink:0,borderTop:"1px solid var(--line)",background:"white",padding:"10px 0 8px"}}>
        <div style={{display:"flex",gap:9,overflowX:"auto",scrollbarWidth:"none",paddingLeft:16,paddingRight:16}}>
          {filteredVenues.map(v=>(
            <div key={v.id} className="press"
              onClick={()=>{setSel(v);flyTo(v.lat,v.lng);}}
              style={{flexShrink:0,width:118,borderRadius:14,overflow:"hidden",cursor:"pointer",
                border:"1.5px solid "+(sel?.id===v.id?"var(--ink)":"var(--line)"),
                background:"white",transition:"border-color .15s"}}>
              <div style={{position:"relative",height:70}}>
                <Img src={v.img} style={{position:"absolute",inset:0}} alt={v.name} type={v.type} name={v.name}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.6),transparent 55%)"}}/>
                <div style={{position:"absolute",bottom:5,left:7,fontSize:9,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>
                  {"$"+v.price+"+"}
                </div>
                {v.hot&&<div style={{position:"absolute",top:5,right:6,
                  fontSize:8,background:"rgba(239,68,68,.85)",color:"white",
                  borderRadius:9,padding:"1px 6px",fontWeight:700,fontFamily:"var(--fb)"}}>🔥</div>}
              </div>
              <div style={{padding:"6px 8px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.name}</div>
                <div style={{fontSize:8,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>{v.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bookings({go,refreshKey,localBookings=[]}){
  const [tab,setTab]=useState("upcoming");
  const {bookings:dbBk,loading}=useUserBookings(refreshKey);
  const bk=[...localBookings,...dbBk];
  const list=tab==="upcoming"
    ?bk.filter(b=>b.status==="confirmed"||b.status==="pending")
    :bk.filter(b=>b.status==="cancelled"||b.status==="checked_in");
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
              Explore Venues ->
            </button>
          )}
        </div>
      )
      :<div style={{paddingBottom:90}}>
        {list.map(b=>(
          <div key={b.id} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden",marginBottom:10}}>
            <div style={{position:"relative",height:115}}><Img src={b.img} style={{position:"absolute",inset:0}} alt={b.venue} type="Rooftop" name={b.venue}/><div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.6),transparent 55%)"}}/><div style={{position:"absolute",top:9,right:10}}><span style={{background:"var(--ink)",color:"white",fontSize:9,fontWeight:700,padding:"2px 9px",borderRadius:18,fontFamily:"var(--fb)"}}>✓ Confirmed</span></div><div style={{position:"absolute",bottom:0,left:14,paddingBottom:10}}><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white"}}>{b.venue}</div></div></div>
            <div style={{padding:"11px 14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><div style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)"}}>📅 {b.date} . {b.table}</div><div style={{background:"#f5f4f0",border:"1px solid var(--line)",borderRadius:9,padding:"5px 10px",textAlign:"center"}}><div style={{fontSize:7,color:"var(--sub)",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"var(--fb)"}}>Code</div><div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,letterSpacing:".06em"}}>{b.code}</div></div></div><button style={{width:"100%",padding:"9px",background:"var(--ink)",color:"white",border:"none",borderRadius:11,fontSize:12,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>View QR Code</button></div>
          </div>
        ))}
      </div>}
    </div>
  );
}

function VenueDetail({venue,go,onBooked}){
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
    {id:1,name:"Standard Booth",cap:"2-4",  min:2,max:4, price:venue.price,                 desc:"Great view, intimate"},
    {id:2,name:"VIP Booth",     cap:"4-8",  min:4,max:8, price:Math.round(venue.price*1.8), desc:"Near stage, premium",hot:true},
    {id:3,name:"Bottle Table",  cap:"6-12", min:6,max:12,price:Math.round(venue.price*3),   desc:"Full bottle service"},
  ];

  // Clamp party size when table changes
  useEffect(() => {
    if (selT) setParty(p => Math.max(selT.min, Math.min(selT.max, p)));
  }, [selT?.id]);

  // Pricing - server-calculated with client-side fallback
  const [pricing, setPricing] = useState(null);
  useEffect(() => {
    if (!selT) { setPricing(null); setPromo(null); return; }
    // Client-side fallback pricing (used when edge function unreachable)
    const base = selT.price * 100; // cents
    const fee = Math.round(base * 0.1);
    const fallback = { base_price: base, discount: 0, platform_fee: fee, total: base + fee, discount_value: 0, discount_type: null };
    setPricing(fallback);
    // Try server pricing
    (async () => {
      try {
        const d = await edgeCall("validate-promo", { venue_id: venue.id, guests: party });
        if (d && !d.error && d.base_price) setPricing(d);
      } catch(e) { /* keep fallback */ }
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
    const bookingRecord = (code, tot) => ({
      id: "bk_"+Date.now(),
      venue: venue.name,
      img: venue.img,
      type: venue.type,
      date: date,
      table: selT.name,
      code: code,
      status: "confirmed",
      total: tot,
    });
    if (!getSession()) {
      const bk = {confirmation_code:"LM-DEMO", total, discount_pct:0, demo:true};
      setBooking(bk);
      setStep("confirm");
      if(onBooked) onBooked(bookingRecord("LM-DEMO", total));
      setSubmitting(false); return;
    }
    try {
      // Only send intent — server recalculates price independently
      const d = await edgeCall("create-booking", {
        venue_id:   venue.id,
        guests:     party,
        event_date: date,
        promo_code: (promo && !promo.error) ? promoIn.trim().toUpperCase() : null,
        notes:      selT.name,
      });
      if (d?.booking_id) {
        const bData = {
          ...d,
          total:         Math.round((d.total || pricing?.total || 0) / 100),
          discount_pct:  pricing?.discount_value || 0,
          discount_type: pricing?.discount_type || null,
        };
        setBooking(bData);
        setStep("confirm");
        if(onBooked) onBooked(bookingRecord(d.confirmation_code || "LM-"+Date.now().toString(36).toUpperCase().slice(-6), bData.total));
        // Fire confirmation email (non-blocking)
        edgeCall("send-confirmation", {
          booking_id:        d.booking_id,
          confirmation_code: d.confirmation_code,
          venue_name:        d.venue_name,
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
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",minHeight:0,overflow:"hidden"}}>
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
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.15)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)"}}>Party:</span>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
                      {[-1,null,1].map((d,i)=>d===null
                        ?<span key="n" style={{fontFamily:"var(--fd)",fontWeight:700,fontSize:15,color:"white",minWidth:18,textAlign:"center"}}>{party}</span>
                        :<button key={i} onClick={e=>{e.stopPropagation();setParty(p=>Math.max(t.min,Math.min(t.max,p+d)));}}
                          style={{width:26,height:26,borderRadius:7,background:((d<0&&party<=t.min)||(d>0&&party>=t.max))?"rgba(255,255,255,.05)":"rgba(255,255,255,.15)",border:"none",color:((d<0&&party<=t.min)||(d>0&&party>=t.max))?"rgba(255,255,255,.2)":"white",cursor:((d<0&&party<=t.min)||(d>0&&party>=t.max))?"default":"pointer",fontSize:15}}>
                          {d>0?"+":"−"}</button>
                      )}
                    </div>
                  </div>
                  {party>=t.max&&t.id<3&&(
                    <div onClick={e=>{e.stopPropagation();const next=tables.find(x=>x.id===t.id+1);if(next){setSelT(next);setParty(next.min);}}}
                      className="press" style={{marginTop:7,padding:"6px 10px",background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.25)",borderRadius:9,fontSize:10,color:"#c9a84c",fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",textAlign:"center"}}>
                      Need more seats? Upgrade to {tables.find(x=>x.id===t.id+1)?.name} ({tables.find(x=>x.id===t.id+1)?.cap})
                    </div>
                  )}
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
              [selT.name+" ("+party+" guests)","$"+subtotal],
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
            cursor:selT&&!submitting?"pointer":"not-allowed",opacity:(!selT||submitting)?0.35:1,
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {submitting&&<div style={{width:14,height:14,borderRadius:"50%",
            border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",animation:"spin .7s linear infinite"}}/>}
          {submitting?"Processing...":selT?"Confirm - $"+total:"Select a table to continue"}
        </button>
        <div style={{textAlign:"center",marginTop:6,fontSize:9,color:"var(--dim)",fontFamily:"var(--fb)"}}>
          🔒 Free cancellation 48h before . Powered by Luma
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------- DETAIL VIEW (default) ----------------------------------
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",minHeight:0,overflow:"hidden"}}>
      <div className="scroll" style={{flex:1,overflowY:"auto"}}>
        {/* Hero image */}
        <div style={{position:"relative",height:220}}>
          <Img src={venue.img} style={{position:"absolute",inset:0}} alt={venue.name} type={venue.type} name={venue.name}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.7),transparent 55%)"}}/>
          <button className="press" onClick={()=>go("back")}
            style={{position:"absolute",top:12,left:14,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",
              border:"1px solid rgba(255,255,255,.2)",borderRadius:10,color:"white",padding:"6px 12px",
              fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--fb)",zIndex:10}}>
            {"<"} Back
          </button>
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 18px 16px"}}>
            <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {venue.tags&&venue.tags.map(t=>(
                <span key={t} style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",color:"white",
                  padding:"2px 8px",borderRadius:18,fontSize:9,fontWeight:700,fontFamily:"var(--fb)"}}>{t}</span>
              ))}
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:24,fontWeight:700,color:"white"}}>{venue.name}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)",marginTop:3}}>
              {venue.type} . {venue.city} . {venue.distance}
            </div>
          </div>
        </div>

        <div style={{padding:"16px 18px 90px"}}>
          {/* Rating & price */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Stars r={venue.rating}/>
              {venue.reviews&&<span style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)"}}>({venue.reviews})</span>}
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"var(--ink)"}}>${venue.price}+</div>
          </div>

          {/* About */}
          {venue.about&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"var(--sub)",fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6,fontFamily:"var(--fb)"}}>About</div>
              <div style={{fontSize:13,color:"var(--ink2)",fontFamily:"var(--fb)",lineHeight:1.65}}>{venue.about}</div>
            </div>
          )}

          {/* Address */}
          {venue.address&&(
            <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>📍</span>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"var(--ink)",fontFamily:"var(--fb)"}}>{venue.address}</div>
                <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>{venue.city}</div>
              </div>
            </div>
          )}

          {/* Quick info cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[
              ["💰","From","$"+venue.price],
              ["👥","Capacity","2-12"],
              ["🕐","Opens","10 PM"],
            ].map(([ic,label,val])=>(
              <div key={label} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:16,marginBottom:4}}>{ic}</div>
                <div style={{fontSize:12,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fd)"}}>{val}</div>
                <div style={{fontSize:9,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Available dates preview */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:10,color:"var(--sub)",fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8,fontFamily:"var(--fb)"}}>Available Dates</div>
            <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingRight:18}}>
              {DATES.map(d=>(
                <div key={d} style={{flexShrink:0,background:"var(--white)",border:"1px solid var(--line)",borderRadius:10,padding:"8px 12px",textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--ink)",fontFamily:"var(--fb)"}}>{d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Table options preview */}
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,color:"var(--sub)",fontWeight:600,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8,fontFamily:"var(--fb)"}}>Table Options</div>
            {tables.map(t=>(
              <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px 13px",background:"var(--white)",border:"1px solid var(--line)",borderRadius:12,marginBottom:6}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)"}}>{t.name}</div>
                  <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>{t.desc} . {t.cap} guests</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--ink)"}}>${t.price}</div>
                  <div style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--fb)"}}>min</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky reserve button */}
      <div style={{padding:"10px 18px 14px",borderTop:"1px solid var(--line)",background:"rgba(245,244,240,.97)",backdropFilter:"blur(20px)",flexShrink:0}}>
        <button className="press" onClick={()=>setStep("book")}
          style={{width:"100%",padding:"14px",background:"var(--ink)",color:"white",border:"none",
            borderRadius:13,fontSize:14,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer"}}>
          Reserve a Table
        </button>
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

function ProDash({setTab,userName="Promoter"}){
  const [showPaywall,setShowPaywall]=useState(false);
  const earned=PAYOUTS.filter(p=>p.status==="paid").reduce((s,p)=>s+p.comm,0);
  const pending=PAYOUTS.filter(p=>p.status==="pending").reduce((s,p)=>s+p.comm,0);
  const confirmed=GUESTS.filter(g=>g.status==="confirmed").length;
  const arrived=GUESTS.filter(g=>g.arrived).length;
  if(showPaywall) return <ProPaywall onClose={()=>setShowPaywall(false)} onSelect={()=>setShowPaywall(false)}/>;
  return(
    <div className="scroll fi" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontFamily:"var(--fd)",fontSize:13,fontStyle:"italic",color:P.sub}}>Welcome back,</div><div style={{fontFamily:"var(--fd)",fontSize:25,fontWeight:700,color:"white"}}>{userName}</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.3)",borderRadius:20,padding:"4px 11px"}}><span style={{fontSize:10,color:"var(--gold)",fontWeight:700,fontFamily:"var(--fb)"}}>✦ PROMOTER</span></div>
            <button className="press" onClick={()=>setShowPaywall(true)} style={{background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.25)",borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:9,color:"var(--gold)",fontWeight:700,fontFamily:"var(--fb)"}}>⬆ Upgrade</button>
          </div>
        </div>

        {/* Tonight card */}
        <div className="press" onClick={()=>setTab("guests")} style={{background:"linear-gradient(135deg,rgba(201,168,76,.16),rgba(201,168,76,.05))",border:"1px solid rgba(201,168,76,.22)",borderRadius:18,padding:"14px 16px",marginBottom:13}}>
          <div style={{fontSize:9,color:"rgba(201,168,76,.65)",fontWeight:700,fontFamily:"var(--fb)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Tonight's Event</div>
          <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white",marginBottom:1}}>Noir Rooftop</div>
          <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)",marginBottom:11}}>Friday Mar 7 . Doors 10PM</div>
          <div style={{display:"flex",gap:18}}>
            {[[confirmed,"Confirmed","var(--gold)"],[arrived,"Arrived","white"],["$"+pending,"Pending","#fbbf24"]].map(([v,l,c])=>(
              <div key={l}><div style={{fontFamily:"var(--fd)",fontSize:21,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l}</div></div>
            ))}
          </div>
        </div>

        {/* Stats grid - clickable */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:13}}>
          {[
            ["$"+earned,"Total Earned","💰","payouts"],
            ["$"+pending,"Pending","⏳","payouts"],
            [LINKS.reduce((s,l)=>s+l.clicks,0)+" clicks","Link Traffic","🔗","links"],
            [LINKS.reduce((s,l)=>s+l.conv,0)+" booked","Conversions","✅","analytics"]
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
          {[["👥","Guest List","5 confirmed . 2 arrived","guests"],["🔗","Invite Links","264 clicks . 14 booked","links"],["📊","Analytics","Clicks & conversions","analytics"],["💰","Payouts","$"+earned+" earned","payouts"],["💬","Messages","2 unread","messages"],["⚙️","Pricing","Set table minimums","pricing"]].map(([ic,l,s,t])=>(
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

function ProGuests({setTab,onMessage}){
  const [checked,setChecked]=useState({1:true,2:true});
  const sc={confirmed:"rgba(74,222,128,.13)",pending:"rgba(251,191,36,.1)",cancelled:"rgba(239,68,68,.08)"};
  const tc={confirmed:"#4ade80",pending:"#fbbf24",cancelled:"#f87171"};
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 12px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white"}}>Guest List</div>
        <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)"}}>Noir Rooftop . Fri Mar 7</div>
      </div>
      <div style={{padding:"0 18px 6px"}}>
        <ProCard style={{padding:"11px 15px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-around"}}>
            {[["5","Confirmed"],["2","Arrived"],["1","Pending"]].map(([n,l])=>(
              <div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white"}}>{n}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l}</div></div>
            ))}
          </div>
        </ProCard>
      </div>
      <div style={{padding:"0 18px 90px",display:"flex",flexDirection:"column",gap:8}}>
        {GUESTS.map(g=>(
          <ProCard key={g.id} style={{padding:"12px 13px"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"var(--goldbg)",border:"1.5px solid rgba(201,168,76,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--gold)",fontFamily:"var(--fd)",flexShrink:0}}>{g.av}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{g.name}</span>
                  {g.arrived&&<span style={{fontSize:8,fontWeight:700,color:"#4ade80",background:"rgba(74,222,128,.1)",padding:"1px 6px",borderRadius:9,fontFamily:"var(--fb)"}}>✓ IN</span>}
                </div>
                <div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)"}}>{g.table} . Party of {g.party}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:g.paid>0?"var(--gold)":"rgba(255,255,255,.2)",fontFamily:"var(--fb)"}}>{g.paid>0?`$${g.paid}`:"-"}</div>
                <div style={{fontSize:9,background:sc[g.status],color:tc[g.status],padding:"2px 7px",borderRadius:9,marginTop:2,fontFamily:"var(--fb)",fontWeight:600}}>{g.status}</div>
              </div>
            </div>
            {g.status==="confirmed"&&!g.arrived&&(
              <div style={{marginTop:9,paddingTop:9,borderTop:"1px solid rgba(255,255,255,.07)",display:"flex",gap:7}}>
                <button className="press" onClick={()=>setChecked(p=>({...p,[g.id]:!p[g.id]}))} style={{flex:1,padding:"7px",borderRadius:9,border:"none",fontFamily:"var(--fb)",fontSize:11,fontWeight:700,cursor:"pointer",background:checked[g.id]?"rgba(74,222,128,.18)":"rgba(255,255,255,.07)",color:checked[g.id]?"#4ade80":"rgba(255,255,255,.4)"}}>
                  {checked[g.id]?"✓ Checked In":"Check In"}
                </button>
                <button className="press" onClick={()=>onMessage&&onMessage(g.name)} style={{flex:1,padding:"7px",borderRadius:9,border:"1px solid rgba(255,255,255,.09)",background:"transparent",color:"rgba(255,255,255,.35)",fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Message</button>
              </div>
            )}
          </ProCard>
        ))}
      </div>
    </div>
  );
}

function ProLinks(){
  const [copied,setCopied]=useState(null);
  const [copyErr,setCopyErr]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [newLabel,setNewLabel]=useState("");
  const [links,setLinks]=useState(LINKS);
  const [selVenue,setSelVenue]=useState(null);
  const copy=async(id,url)=>{
    const ok=await copyToClipboard(url);
    if(ok){setCopied(id);setTimeout(()=>setCopied(null),2000);}
    else{setCopyErr(id);setTimeout(()=>setCopyErr(null),2500);}
  };
  const createLink=()=>{
    if(!newLabel.trim())return;
    const slug=newLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g,"-").slice(0,20);
    const newLink={id:Date.now(),label:newLabel.trim(),url:"luma.vip/p/"+slug,clicks:0,conv:0};
    setLinks(l=>[newLink,...l]);
    setNewLabel("");setSelVenue(null);setShowNew(false);
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
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://luma.vip/p/${qr.url.split('/p/')[1]}&margin=0&color=0a0a0a`}
            alt="QR Code" width={220} height={220} style={{display:"block",borderRadius:4}}/>
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:4,textAlign:"center"}}>{qr.label}</div>
        <div style={{fontSize:12,color:P.sub,fontFamily:"var(--fb)",marginBottom:6}}>luma.vip/p/{qr.url.split('/p/')[1]}</div>
        <div style={{background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.25)",borderRadius:10,
          padding:"5px 14px",fontSize:11,color:"var(--gold)",fontFamily:"var(--fb)",fontWeight:700}}>
          {qr.clicks} scans . {qr.conv} booked
        </div>
        <div style={{marginTop:24,fontSize:11,color:"rgba(255,255,255,.25)",fontFamily:"var(--fb)",textAlign:"center",lineHeight:1.6}}>
          Show this code at the venue or share a screenshot. Guests scan to book through your link.
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
            <div style={{fontSize:10,color:P.sub,fontWeight:600,fontFamily:"var(--fb)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Event / Venue</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {["Noir Rooftop","Azure Terrace","Velvet Underground","Soleil Pool Club"].map(v=>(
                <button key={v} onClick={()=>{setSelVenue(v);if(!newLabel)setNewLabel(v);}} className="press"
                  style={{padding:"6px 10px",borderRadius:9,fontSize:10,fontWeight:600,fontFamily:"var(--fb)",
                    border:"1.5px solid",cursor:"pointer",
                    background:selVenue===v?"var(--gold)":"rgba(255,255,255,.04)",
                    borderColor:selVenue===v?"var(--gold)":"rgba(255,255,255,.1)",
                    color:selVenue===v?"#0a0a0a":"rgba(255,255,255,.5)"}}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{fontSize:10,color:P.sub,fontWeight:600,fontFamily:"var(--fb)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Label</div>
            <input value={newLabel} onChange={e=>setNewLabel(sanitize(e.target.value,80))} maxLength={80} placeholder="e.g. Noir Rooftop - Friday" style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"8px 11px",color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none",marginBottom:10}}/>
            <button className="press" onClick={createLink}
              style={{width:"100%",padding:"10px",background:newLabel.trim()?"var(--gold)":"rgba(255,255,255,.07)",
                color:newLabel.trim()?"#0a0a0a":"rgba(255,255,255,.3)",border:"none",borderRadius:11,fontSize:12,
                fontFamily:"var(--fb)",fontWeight:700,cursor:newLabel.trim()?"pointer":"default",marginTop:4}}>
              Generate Link
            </button>
          </ProCard>
        )}
        <div style={{fontSize:10,fontWeight:600,color:P.sub,fontFamily:"var(--fb)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:9}}>Active Links</div>
        <div style={{display:"flex",flexDirection:"column",gap:9,paddingBottom:90}}>
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
                    style={{padding:"8px 12px",background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.25)",
                      color:"var(--gold)",borderRadius:9,fontSize:11,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer"}}>
                    QR
                  </button>
                  <button className="press" onClick={()=>copy(l.id,l.url)} style={{flex:1,padding:"8px",background:copyErr===l.id?"#ef4444":"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:9,fontSize:11,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer",transition:"background .2s"}}>{copied===l.id?"✓ Copied!":copyErr===l.id?"Failed":"📋 Copy"}</button>
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

function ProAnalytics(){
  const bars=[42,61,38,87,95,112,142];
  const mx=Math.max(...bars);
  const tc=LINKS.reduce((s,l)=>s+l.clicks,0);
  const tv=LINKS.reduce((s,l)=>s+l.conv,0);
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white",marginBottom:13}}>Analytics</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
          {[[tc,"Clicks","🔗"],[tv,"Booked","✅"],[Math.round(tv/tc*100)+"%","CVR","📈"]].map(([v,l,ic])=>(
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
          {LINKS.map(l=>{
            const cvr=Math.round((l.conv/l.clicks)*100);
            const pct=Math.round((l.clicks/tc)*100);
            return(
              <ProCard key={l.id} style={{padding:"11px 13px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{l.label}</span>
                  <span style={{fontSize:11,color:"var(--gold)",fontFamily:"var(--fd)",fontWeight:700}}>{cvr}% CVR</span>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,.07)",borderRadius:3,marginBottom:7,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:"var(--gold)",borderRadius:3}}/></div>
                <div style={{display:"flex",gap:13}}>{[[l.clicks,"Clicks"],[l.conv,"Booked"],[cvr+"%","CVR"]].map(([v,lbl])=><div key={lbl}><span style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fd)"}}>{v}</span><span style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginLeft:3}}>{lbl}</span></div>)}</div>
              </ProCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProPayouts(){
  const earned=PAYOUTS.filter(p=>p.status==="paid").reduce((s,p)=>s+p.comm,0);
  const pending=PAYOUTS.filter(p=>p.status==="pending").reduce((s,p)=>s+p.comm,0);
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"white",marginBottom:13}}>Payouts</div>
        <ProCard style={{padding:"17px 18px",marginBottom:12,background:"linear-gradient(135deg,rgba(201,168,76,.18),rgba(201,168,76,.05))"}}>
          <div style={{fontSize:9,color:"rgba(201,168,76,.65)",fontWeight:700,fontFamily:"var(--fb)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Total Earned</div>
          <div style={{fontFamily:"var(--fd)",fontSize:36,fontWeight:700,color:"white",lineHeight:1,marginBottom:10}}>${earned}</div>
          <div style={{display:"flex",gap:16,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.08)"}}>
            <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"#fbbf24"}}>${pending}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>Pending</div></div>
            <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--gold)"}}>15%</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>Commission rate</div></div>
          </div>
        </ProCard>
        {pending>0&&<button className="press" style={{width:"100%",padding:"11px",background:"var(--gold)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer",marginBottom:12}}>Request Payout - ${pending}</button>}
        <div style={{fontSize:10,fontWeight:600,color:P.sub,fontFamily:"var(--fb)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:9}}>History</div>
        <div style={{paddingBottom:90}}>
          {PAYOUTS.map(p=>(
            <ProCard key={p.id} style={{padding:"12px 13px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,paddingRight:9}}><div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:2}}>{p.event}</div><div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)"}}>Gross ${p.gross} . 15%</div></div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:p.status==="paid"?"var(--gold)":"#fbbf24"}}>${p.comm}</div><div style={{fontSize:9,color:p.status==="paid"?"#4ade80":"#fbbf24",fontFamily:"var(--fb)",fontWeight:700,marginTop:2}}>{p.status==="paid"?"✓ Paid":"⏳ Pending"}</div></div>
              </div>
            </ProCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProMessages({initialOpen,onOpened}){
  const [threads,setThreads]=useState(MSGS);
  const [open,setOpen]=useState(null);
  const [msg,setMsg]=useState("");
  const ref=useRef(null);
  const didInit=useRef(false);

  // On mount or when initialOpen changes, find or create thread
  useEffect(()=>{
    if(!initialOpen||didInit.current)return;
    didInit.current=true;
    const existing=threads.find(c=>c.name===initialOpen);
    if(existing){
      setOpen(existing.id);
    }else{
      const newId=Date.now();
      const newThread={id:newId,name:initialOpen,av:initialOpen[0],last:"No messages yet",time:"Now",unread:0,
        thread:[{m:true,t:"Hey "+initialOpen.split(" ")[0]+"! How can I help you tonight?"}]};
      setThreads(t=>[newThread,...t]);
      setOpen(newId);
    }
    if(onOpened)onOpened();
  },[initialOpen]);
  useEffect(()=>{if(ref.current) ref.current.scrollTop=ref.current.scrollHeight;},[open,threads]);

  // Poll for new messages every 10 seconds when a thread is open
  useEffect(()=>{
    if(!open) return;
    const sess=getSession();
    if(!sess?.access_token) return;
    const poll=setInterval(()=>{
      edgeCall("send-message",{action:"fetch",thread_id:open}).then(d=>{
        if(d?.messages?.length){
          setThreads(ts=>ts.map(c=>c.id===open?{...c,thread:d.messages.map(m=>({m:m.sender==="promoter",t:m.text})),last:d.messages[d.messages.length-1]?.text||c.last}:c));
        }
      }).catch(()=>{});
    },10000);
    return()=>clearInterval(poll);
  },[open]);
  const send=()=>{
    const clean=sanitize(msg,500);
    if(!clean||!msgRateLimit())return;
    setThreads(ts=>ts.map(c=>c.id===open?{...c,last:clean,unread:0,thread:[...c.thread,{m:true,t:clean}]}:c));
    setMsg("");
  };
  if(open){
    const conv=threads.find(c=>c.id===open);
    if(!conv) return null;
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)"}}>
        <div style={{padding:"8px 18px 10px",display:"flex",alignItems:"center",gap:9,borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0}}>
          <button className="press" onClick={()=>setOpen(null)} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white"}}>‹</button>
          <div style={{width:33,height:33,borderRadius:"50%",background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--gold)",fontFamily:"var(--fd)"}}>{conv.av}</div>
          <div><div style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{conv.name}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>Guest</div></div>
        </div>
        <div ref={ref} className="scroll" style={{flex:1,overflowY:"auto",padding:"13px 17px",display:"flex",flexDirection:"column",gap:8}}>
          {conv.thread.map((m,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.m?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"78%",background:m.m?"var(--gold)":"rgba(255,255,255,.08)",color:"white",padding:"8px 11px",borderRadius:m.m?"13px 13px 3px 13px":"13px 13px 13px 3px",fontSize:12,fontFamily:"var(--fb)",lineHeight:1.5}}>{m.t}</div>
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
                <div style={{width:40,height:40,borderRadius:"50%",background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--gold)",fontFamily:"var(--fd)"}}>{c.av}</div>
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
                ${parsed} min -> you keep ${earn} <span style={{color:"var(--gold)"}}>(15%)</span>
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
  const [showAdd,setShowAdd]=useState(false);
  const [newName,setNewName]=useState("");
  const [newCap,setNewCap]=useState("");
  const [newMin,setNewMin]=useState("");
  const addTable=()=>{
    if(!newName.trim()||!newMin)return;
    setTables(t=>[...t,{id:Date.now(),name:newName.trim(),cap:newCap||"2-8",min:Number(newMin)||100,on:true}]);
    setNewName("");setNewCap("");setNewMin("");setShowAdd(false);
  };
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
        {/* Add custom table */}
        {!showAdd?(
          <button className="press" onClick={()=>setShowAdd(true)}
            style={{width:"100%",padding:"11px",background:"rgba(255,255,255,.05)",
              border:"1.5px dashed rgba(255,255,255,.12)",borderRadius:13,fontSize:12,
              fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",color:"rgba(255,255,255,.35)",
              marginBottom:8}}>
            + Add Custom Table Type
          </button>
        ):(
          <ProCard style={{padding:"13px 14px",marginBottom:8}}>
            <div style={{fontSize:10,color:P.sub,fontWeight:600,fontFamily:"var(--fb)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>New Table Type</div>
            <input value={newName} onChange={e=>setNewName(e.target.value.slice(0,30))} maxLength={30}
              placeholder="e.g. Cabana, Skybox, Daybed"
              style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                borderRadius:10,padding:"8px 11px",color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none",marginBottom:8}}/>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginBottom:4}}>Capacity</div>
                <input value={newCap} onChange={e=>setNewCap(e.target.value.slice(0,10))} maxLength={10}
                  placeholder="e.g. 4-10"
                  style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                    borderRadius:10,padding:"8px 11px",color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginBottom:4}}>Min spend ($)</div>
                <input type="number" value={newMin} onChange={e=>setNewMin(e.target.value)}
                  placeholder="200"
                  style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
                    borderRadius:10,padding:"8px 11px",color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:7}}>
              <button className="press" onClick={()=>setShowAdd(false)}
                style={{flex:1,padding:"9px",background:"rgba(255,255,255,.07)",border:"none",borderRadius:10,
                  color:"rgba(255,255,255,.4)",fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button className="press" onClick={addTable}
                style={{flex:1,padding:"9px",background:newName.trim()&&newMin?"var(--gold)":"rgba(255,255,255,.07)",
                  border:"none",borderRadius:10,color:newName.trim()&&newMin?"#0a0a0a":"rgba(255,255,255,.3)",
                  fontSize:11,fontFamily:"var(--fb)",fontWeight:700,cursor:newName.trim()&&newMin?"pointer":"default"}}>Add Table</button>
            </div>
          </ProCard>
        )}
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
            {label:"IG Story",bg:"linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
             svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none"/></svg>},
            {label:"Twitter",bg:"#000",
             svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>},
            {label:"TikTok",bg:"#010101",
             svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13a8.16 8.16 0 005.58 2.17V11.7a4.83 4.83 0 01-3.77-1.24V6.69z"/></svg>},
            {label:"WhatsApp",bg:"#25d366",
             svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>},
            {label:"Facebook",bg:"#1877f2",
             svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>},
            {label:"Telegram",bg:"#0088cc",
             svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>},
            {label:"Copy Link",bg:"var(--gold)",
             svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>},
            {label:"More",bg:"rgba(255,255,255,.12)",
             svg:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12h16M12 4v16"/></svg>},
          ].map(s=>(
            <div key={s.label} onClick={async()=>{
              const plat=PLATFORMS.find(p=>p.label.toLowerCase().includes(s.label.toLowerCase().split(" ")[0]));
              const txt=plat?plat.text:"Book VIP with me -> luma.vip/"+promoter.handle;
              const ok=await copyToClipboard(txt);
              if(ok){setPlatCopied(s.label);setTimeout(()=>setPlatCopied(null),2000);}
              else{setPlatErr(s.label);setTimeout(()=>setPlatErr(null),2500);}
            }} className="press"
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer"}}>
              <div style={{width:56,height:56,borderRadius:18,
                background:platCopied===s.label?"#16a34a":s.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 4px 16px rgba(0,0,0,.35)",transition:"background .2s"}}>
                {platCopied===s.label?<span style={{color:"white",fontSize:20}}>✓</span>:s.svg}
              </div>
              <span style={{fontSize:9,color:platCopied===s.label?"#4ade80":"rgba(255,255,255,.4)",fontFamily:"var(--fb)",fontWeight:600,textAlign:"center",lineHeight:1.3,transition:"color .2s"}}>{platCopied===s.label?"Copied!":s.label}</span>
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
          <div key={c.lbl} className="press" onClick={async()=>{
            const ok=await copyToClipboard(c.txt);
            if(ok){setPlatCopied(c.lbl);setTimeout(()=>setPlatCopied(null),2000);}
            else{setPlatErr(c.lbl);setTimeout(()=>setPlatErr(null),2500);}
          }}
            style={{background:platCopied===c.lbl?"rgba(74,222,128,.08)":"rgba(255,255,255,.05)",
              border:"1px solid "+(platCopied===c.lbl?"rgba(74,222,128,.2)":"rgba(255,255,255,.08)"),
              borderRadius:13,padding:"12px 14px",marginBottom:8,cursor:"pointer",
              display:"flex",alignItems:"flex-start",gap:11,transition:"all .2s"}}>
            <span style={{fontSize:9,background:"rgba(201,168,76,.15)",color:"var(--gold)",
              padding:"2px 8px",borderRadius:8,fontWeight:700,fontFamily:"var(--fb)",
              flexShrink:0,marginTop:1}}>{c.lbl}</span>
            <div style={{fontSize:11,color:"rgba(255,255,255,.5)",fontFamily:"var(--fb)",lineHeight:1.55,flex:1}}>{c.txt}</div>
            <div style={{fontSize:platCopied===c.lbl?10:16,color:platCopied===c.lbl?"#4ade80":"rgba(255,255,255,.2)",
              flexShrink:0,fontFamily:"var(--fb)",fontWeight:700,transition:"all .2s"}}>
              {platCopied===c.lbl?"✓ Copied":platErr===c.lbl?"Failed":"⎘"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if(msgOpen) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",minHeight:0,overflow:"hidden"}}>
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
                    <button className="press" onClick={()=>goBookPromoter(promoter,ev)} style={{flex:1,padding:"9px",background:"var(--ink)",color:"white",border:"none",borderRadius:11,fontSize:12,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>Book with {promoter.name.split(" ")[0]} -></button>
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
          <button className="press" onClick={()=>setMsgOpen(true)} style={{width:"100%",padding:"12px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Message {promoter.name.split(" ")[0]} for VIP access -></button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------- Invite Link Landing (when guest arrives via promoter link) -
function InviteLanding({promoter,event,go,goBack,goPromoter}){
  // Track link click on mount
  useEffect(()=>{
    trackLinkClick(event?.linkId||null, promoter?.id||null);
  },[]);
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
        <button className="press" onClick={()=>{const v=VENUES.find(x=>x.name===event.venue)||VENUES[0];go("venue",v);}} style={{width:"100%",padding:"13px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",marginBottom:6}}>Claim Your Spot -></button>
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
              transition:"all .2s",position:"relative",opacity:p.id==="elite"?0.6:1}}>
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
  // Promoter profile fields - must be before any returns (rules of hooks)
  const [proHandle,setProHandle]=useState("");
  const [proBio,setProBio]=useState("");
  const [proSpecialties,setProSpecialties]=useState([]);

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

  // Promoter profile fields already declared above
  const specOptions=["Rooftop","Nightclub","Lounge","Pool Party","DJ Events","Latin Nights","Hip-Hop","EDM","Bottle Service"];

  const guestSteps=[
    {emoji:"🌃",title:"Your city's nightlife,\ncurated.",sub:"Skip the line. Book VIP tables, get exclusive deals from local promoters."},
    {emoji:"🎟",title:"Real promoters,\nreal access.",sub:"Every promoter is verified. They bring you deals no one else can get."},
    {emoji:"💎",title:"Where do you\nwant to go out?",sub:"We'll show you the best spots in your city.",cities:["Miami","New York"]},
  ];
  const proSteps=[
    {emoji:"📊",title:"Your command\ncenter.",sub:"Guest lists, invite links, payouts, and analytics - all in one place."},
    {emoji:"🔗",title:"Set up your\npromoter profile.",sub:"Guests will find you by your handle and specialties.",profileSetup:true},
    {emoji:"💰",title:"Where are you\nworking?",sub:"We'll set up your dashboard for your market.",cities:["Miami","New York"]},
  ];
  const steps=dark?proSteps:guestSteps;
  const s=steps[step];
  const isLast=step===steps.length-1;
  const canContinue=!isLast||(isLast&&city);
  const canContinueProfile=!s.profileSetup||proHandle.trim().length>=2;
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:bg,overflow:"hidden",position:"relative",animation:"scaleIn .32s cubic-bezier(.16,1,.3,1) both"}}>
      {/* Subtle top glow accent */}
      <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",
        width:340,height:240,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 70%)",
        pointerEvents:"none"}}/>

      {/* Skip */}
      {step<2&&<button onClick={()=>onDone(city||"Miami")}
        style={{position:"absolute",top:18,right:20,background:"transparent",border:"none",
          color:dark?"rgba(255,255,255,.3)":"var(--dim)",fontSize:11,fontFamily:"var(--fb)",cursor:"pointer",
          fontWeight:600,letterSpacing:".04em",zIndex:10}}>Skip</button>}

      {/* Dot indicators */}
      <div style={{position:"absolute",top:24,left:"50%",transform:"translateX(-50%)",
        display:"flex",gap:5}}>
        {steps.map((_,i)=>(
          <div key={i} style={{width:i===step?18:6,height:6,borderRadius:3,
            background:i===step?dotAct:dot,
            transition:"all .3s cubic-bezier(.34,1.56,.64,1)"}}/>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
        justifyContent:"center",padding:"60px 32px 0",textAlign:"center"}} key={step}>
        <div style={{fontSize:72,marginBottom:28,animation:"popIn .5s cubic-bezier(.34,1.56,.64,1) both"}}>{s.emoji}</div>
        <div style={{fontFamily:"var(--fd)",fontSize:32,fontWeight:700,color:ink,
          lineHeight:1.22,marginBottom:14,whiteSpace:"pre-line",
          animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .1s both"}}>{s.title}</div>
        <div style={{fontSize:14,color:sub,fontFamily:"var(--fb)",
          lineHeight:1.65,maxWidth:280,
          animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .18s both"}}>{s.sub}</div>

        {/* Promoter profile setup */}
        {s.profileSetup&&(
          <div style={{width:"100%",maxWidth:300,marginTop:24,textAlign:"left",
            animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .26s both"}}>
            <div style={{fontSize:10,color:sub,fontWeight:600,fontFamily:"var(--fb)",
              textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Your Handle</div>
            <div style={{display:"flex",alignItems:"center",background:dark?"rgba(255,255,255,.07)":"var(--white)",
              border:`1.5px solid ${dark?"rgba(255,255,255,.12)":"var(--line2)"}`,
              borderRadius:12,padding:"10px 14px",marginBottom:14}}>
              <span style={{color:sub,fontSize:13,fontFamily:"var(--fb)",marginRight:2}}>@</span>
              <input value={proHandle} onChange={e=>setProHandle(e.target.value.replace(/[^a-zA-Z0-9_.]/g,"").slice(0,20))}
                maxLength={20} placeholder="yourhandle"
                style={{flex:1,background:"transparent",border:"none",outline:"none",
                  color:ink,fontSize:13,fontFamily:"var(--fb)"}}/>
            </div>
            <div style={{fontSize:10,color:sub,fontWeight:600,fontFamily:"var(--fb)",
              textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Short Bio</div>
            <input value={proBio} onChange={e=>setProBio(e.target.value.slice(0,80))}
              maxLength={80} placeholder="e.g. Miami's top rooftop promoter"
              style={{width:"100%",background:dark?"rgba(255,255,255,.07)":"var(--white)",
                border:`1.5px solid ${dark?"rgba(255,255,255,.12)":"var(--line2)"}`,
                borderRadius:12,padding:"10px 14px",color:ink,fontSize:13,
                fontFamily:"var(--fb)",outline:"none",marginBottom:14}}/>
            <div style={{fontSize:10,color:sub,fontWeight:600,fontFamily:"var(--fb)",
              textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Specialties</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {specOptions.map(sp=>{
                const on=proSpecialties.includes(sp);
                return(
                  <button key={sp} onClick={()=>setProSpecialties(p=>on?p.filter(x=>x!==sp):[...p,sp].slice(0,4))}
                    className="press"
                    style={{padding:"6px 12px",borderRadius:18,fontSize:11,fontWeight:600,
                      fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",
                      transition:"all .15s",
                      background:on?(dark?"var(--gold)":"var(--ink)"):"transparent",
                      borderColor:on?(dark?"var(--gold)":"var(--ink)"):(dark?"rgba(255,255,255,.12)":"var(--line2)"),
                      color:on?(dark?"#0a0a0a":"white"):(dark?"rgba(255,255,255,.5)":"var(--sub)")}}>
                    {sp}
                  </button>
                );
              })}
            </div>
            <div style={{fontSize:9,color:sub,fontFamily:"var(--fb)",marginTop:8,textAlign:"center"}}>Pick up to 4</div>
          </div>
        )}

        {/* City picker */}
        {s.cities&&(
          <div style={{display:"flex",gap:12,marginTop:28,
            animation:"fadeUp .4s cubic-bezier(.16,1,.3,1) .26s both"}}>
            {s.cities.map(c=>(
              <button key={c} onClick={()=>setCity(c)} className="press"
                style={{padding:"13px 26px",borderRadius:16,fontSize:14,fontWeight:700,
                  fontFamily:"var(--fb)",cursor:"pointer",border:"2px solid",
                  transition:"all .2s",
                  background:city===c?(dark?"var(--gold)":"var(--ink)"):(dark?"rgba(255,255,255,.07)":"var(--white)"),
                  borderColor:city===c?(dark?"var(--gold)":"var(--ink)"):(dark?"rgba(255,255,255,.12)":"var(--line2)"),
                  color:city===c?(dark?"#0a0a0a":"white"):(dark?"rgba(255,255,255,.5)":"var(--ink2)")}}>
                {c==="Miami"?"🌴":"🗽"} {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{padding:"0 28px 52px"}}>
        <button onClick={()=>isLast?canContinue&&onDone(city,role):canContinueProfile&&setStep(s2=>s2+1)}
          className="press"
          style={{width:"100%",padding:"16px",borderRadius:18,fontSize:15,fontWeight:700,
            fontFamily:"var(--fb)",cursor:"pointer",border:"none",
            background:(isLast?canContinue:canContinueProfile)?btnBg:(dark?"rgba(255,255,255,.1)":"var(--line2)"),
            color:(isLast?canContinue:canContinueProfile)?btnColor:(dark?"rgba(255,255,255,.3)":"var(--dim)"),
            transition:"all .25s",boxShadow:(isLast?canContinue:canContinueProfile)?btnShadow:"none"}}>
          {isLast?"Let's go ->":"Continue"}
        </button>
        {step>0&&<button onClick={()=>setStep(s2=>s2-1)}
          style={{width:"100%",marginTop:10,padding:"10px",background:"transparent",
            border:"none",color:dark?"rgba(255,255,255,.3)":"var(--dim)",fontSize:12,fontFamily:"var(--fb)",
            cursor:"pointer"}}>Back</button>}
      </div>
    </div>
  );
}

// ----------------------------------------------- Profile / Settings ----------------------------------------
function Profile({go,onSwitchMode,city,onSignOut,userEmail,userName,onCityChange}){
  const [editing,setEditing]=useState(false);
  const [name,setName]=useState(userName||"Guest");
  const [bio,setBio]=useState("Living for rooftops and late nights 🌃");
  const [notif,setNotif]=useState(true);
  const [locShare,setLocShare]=useState(true);
  const [haptics,setHaptics]=useState(true);
  const [saved,setSaved]=useState(false);
  const [avatarUrl,setAvatarUrl]=useState(null);

  // Load avatar from profile
  useEffect(()=>{
    const sess=getSession();
    if(sess?.access_token){
      fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+sess.user.id+"&select=avatar_url",{
        headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token}
      }).then(r=>r.json()).then(d=>{
        if(d?.[0]?.avatar_url) setAvatarUrl(d[0].avatar_url);
      }).catch(()=>{});
    }
  },[]);
  // Social connections - null = not connected, string = connected handle
  const [igConnected,setIgConnected]=useState(null);
  const [twConnected,setTwConnected]=useState(null);
  const [igInput,setIgInput]=useState("");
  const [twInput,setTwInput]=useState("");
  const [igEditing,setIgEditing]=useState(false);
  const [twEditing,setTwEditing]=useState(false);
  const [helpOpen,setHelpOpen]=useState(false);

  const prefs=[
    {label:"Push notifications",desc:"Booking updates & deals",val:notif,set:setNotif},
    {label:"Location sharing",desc:"Show venues near you",val:locShare,set:setLocShare},
    {label:"Haptic feedback",desc:"Vibrate on interactions",val:haptics,set:setHaptics},
  ];
  const saveEdits=()=>{setSaved(true);setEditing(false);setTimeout(()=>setSaved(false),2000);};
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

  if(helpOpen) return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--bg)"}}>
      <div style={{padding:"10px 18px 12px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setHelpOpen(false)} className="press"
          style={{width:32,height:32,borderRadius:9,background:"var(--white)",
            border:"1px solid var(--line2)",cursor:"pointer",fontSize:16,color:"var(--ink)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"var(--ink)"}}>Help & Support</span>
      </div>
      <div style={{padding:"8px 18px 60px"}}>
        {[
          ["How do I book a table?","Browse venues, pick a table type, select your date and party size, then tap Reserve. You'll get a confirmation code instantly."],
          ["How do promo codes work?","Enter a code on the booking screen before confirming. The discount is calculated server-side and shown in your order summary."],
          ["Can I cancel a booking?","Free cancellation up to 48 hours before your event date. After that, cancellation policies vary by venue."],
          ["How do promoter invite links work?","Promoters share their personal link. When you book through it, they get credit and you may get exclusive perks like priority entry."],
          ["I'm a promoter — how do I join?","Switch to promoter mode in your profile settings. You'll set up your profile, get your invite links, and start earning 15% commission on bookings."],
          ["How do I contact support?","Email us at support@luma.vip or DM @luma.rsv on Instagram. We typically respond within a few hours."],
        ].map(([q,a],i)=>(
          <div key={i} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,
            padding:"14px 16px",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)",marginBottom:6}}>{q}</div>
            <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",lineHeight:1.6}}>{a}</div>
          </div>
        ))}
        <div style={{marginTop:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--dim)",fontFamily:"var(--fb)",marginBottom:6}}>Need more help?</div>
          <div onClick={async()=>{await copyToClipboard("support@luma.vip");}}
            className="press" style={{display:"inline-block",padding:"8px 20px",background:"var(--ink)",
              color:"white",borderRadius:12,fontSize:12,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>
            Copy support email
          </div>
        </div>
      </div>
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
                  onChange={async e=>{
                    const f=e.target.files?.[0];
                    if(!f||f.size>5*1024*1024) return;
                    // Show preview immediately
                    const r=new FileReader();
                    r.onload=ev=>setAvatarUrl(ev.target.result);
                    r.readAsDataURL(f);
                    // Upload to Supabase Storage
                    const sess=getSession();
                    if(sess?.access_token){
                      const ext=f.name.split(".").pop()||"jpg";
                      const path="avatars/"+sess.user.id+"."+ext;
                      try{
                        await fetch(SUPA_URL+"/storage/v1/object/venue-images/"+path,{
                          method:"POST",
                          headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token,
                            "Content-Type":f.type,"x-upsert":"true"},
                          body:f
                        });
                        const pubUrl=SUPA_URL+"/storage/v1/object/public/venue-images/"+path+"?t="+Date.now();
                        setAvatarUrl(pubUrl);
                        // Update profile
                        fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+sess.user.id,{
                          method:"PATCH",headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token,
                            "Content-Type":"application/json","Prefer":"return=minimal"},
                          body:JSON.stringify({avatar_url:pubUrl})
                        }).catch(()=>{});
                      }catch(err){}
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
          {[["3","Bookings"],["2","Saved"],["12","Deals Used"]].map(([v,l])=>(
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
        <div style={{display:"flex",gap:8}}>
          {["Miami","New York"].map(c=>(
            <div key={c} onClick={()=>onCityChange&&onCityChange(c)} className="press"
              style={{flex:1,background:city===c?"var(--ink)":"var(--white)",
                border:"1px solid "+(city===c?"var(--ink)":"var(--line)"),borderRadius:16,padding:"13px 16px",
                cursor:"pointer",transition:"all .2s",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{c==="Miami"?"🌴":"🗽"}</div>
              <div style={{fontSize:13,fontWeight:600,color:city===c?"white":"var(--ink)",fontFamily:"var(--fb)"}}>{c}</div>
              {city===c&&<div style={{fontSize:9,color:"rgba(255,255,255,.5)",fontFamily:"var(--fb)",marginTop:2}}>Current city</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Account actions */}
      <div style={{margin:"14px 18px 0"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--sub)",letterSpacing:".08em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:10}}>Account</div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden"}}>
          {[
            ["Become a promoter ->","Switch to promoter dashboard",()=>onSwitchMode("promoter"),false],
            ["Invite a friend","Share Luma with friends",async()=>{
              const shareData={title:"Luma — VIP Table Booking",text:"Book VIP tables in Miami & NYC in 60 seconds 🔥",url:"https://luma.vip"};
              if(navigator.share){try{await navigator.share(shareData);}catch(e){}}
              else{const ok=await copyToClipboard("Book VIP tables with Luma 🔥 https://luma.vip");if(ok)alert("Link copied!");}
            },false],
            ["Help & support","FAQs and contact",()=>{
              setHelpOpen&&setHelpOpen(true);
            },false],
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

// AuthGate - landing > sign in / sign up
function AuthGate({onAuth}) {
  const [view, setView] = useState("landing");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [uname, setUname] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const submit = async () => {
    setErr(""); setInfo(""); setLoading(true);
    try {
      if (view === "signup") {
        if (!uname.trim()) { setErr("Name is required"); setLoading(false); return; }
        if (!email.trim()) { setErr("Email is required"); setLoading(false); return; }
        const d = await supaSignUp(email.trim(), pw, uname.trim());
        if (d.error) setErr(d.error.message || "Signup failed");
        else if (d.access_token) onAuth(d);
        else { setInfo("Check your email to confirm, then sign in."); setView("signin"); }
      } else {
        if (!email.trim()) { setErr("Email is required"); setLoading(false); return; }
        const d = await supaSignIn(email.trim(), pw);
        if (!d.access_token) setErr(d.error_description || d.error?.message || "Invalid credentials");
        else onAuth(d);
      }
    } catch(e) { setErr("Network error"); }
    setLoading(false);
  };

  if (view === "landing") return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",background:"var(--bg)"}}>
      <div style={{fontFamily:"var(--fd)",fontSize:48,fontWeight:700,fontStyle:"italic",letterSpacing:"-.02em",marginBottom:4,color:"var(--ink)"}}>Luma</div>
      <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:8,textAlign:"center"}}>Miami . New York . Your night starts here</div>
      <div style={{fontSize:10,color:"var(--dim)",fontFamily:"var(--fb)",marginBottom:40,textAlign:"center"}}>Book VIP tables at the best venues</div>
      <div style={{width:"100%",maxWidth:300,display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={()=>setView("signin")} className="press" style={{padding:"14px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:14,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Sign In</button>
        <button onClick={()=>setView("signup")} className="press" style={{padding:"14px",background:"var(--white)",color:"var(--ink)",border:"1.5px solid var(--line2)",borderRadius:13,fontSize:14,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Create Account</button>
        <button onClick={()=>onAuth(null)} className="press" style={{padding:"11px",background:"transparent",border:"none",color:"var(--sub)",borderRadius:13,fontSize:11,fontFamily:"var(--fb)",fontWeight:500,cursor:"pointer",marginTop:4}}>Continue without account</button>
      </div>
    </div>
  );

  // Sign in / sign up form
  return (
    <div className="scroll" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",overflowY:"auto",padding:"32px 24px",background:"var(--bg)"}}>
      <div onClick={()=>{setView("landing");setErr("");setInfo("");}} className="press" style={{alignSelf:"flex-start",fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,marginBottom:20,flexShrink:0}}>
        {"<"} Back
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",maxWidth:300}}>
        <div style={{fontFamily:"var(--fd)",fontSize:36,fontWeight:700,fontStyle:"italic",letterSpacing:"-.02em",marginBottom:4,color:"var(--ink)"}}>{view==="signin"?"Welcome back":"Join Luma"}</div>
        <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:24,textAlign:"center"}}>{view==="signin"?"Sign in to your account":"Create your account"}</div>

        <button className="press" onClick={()=>onAuth(null)} style={{width:"100%",padding:"12px 14px",background:"var(--white)",color:"var(--ink)",border:"1.5px solid var(--line2)",borderRadius:12,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:9}}>
          Continue with Apple
        </button>
        <button className="press" onClick={()=>onAuth(null)} style={{width:"100%",padding:"12px 14px",background:"var(--white)",color:"var(--ink)",border:"1.5px solid var(--line2)",borderRadius:12,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:4}}>
          Continue with Google
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,margin:"12px 0",width:"100%"}}>
          <div style={{flex:1,height:1,background:"var(--line2)"}}/>
          <span style={{fontSize:10,color:"var(--dim)",fontFamily:"var(--fb)",fontWeight:500}}>or</span>
          <div style={{flex:1,height:1,background:"var(--line2)"}}/>
        </div>

        <div style={{width:"100%",display:"flex",flexDirection:"column",gap:9}}>
          {view==="signup"&&<input value={uname} onChange={e=>setUname(e.target.value.slice(0,60))} placeholder="Your name" maxLength={60} style={{padding:"12px 14px",borderRadius:12,border:"1.5px solid var(--line2)",background:"var(--white)",fontSize:13,fontFamily:"var(--fb)",outline:"none",color:"var(--ink)"}}/>}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" style={{padding:"12px 14px",borderRadius:12,border:"1.5px solid var(--line2)",background:"var(--white)",fontSize:13,fontFamily:"var(--fb)",outline:"none",color:"var(--ink)"}}/>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" onKeyDown={e=>e.key==="Enter"&&submit()} style={{padding:"12px 14px",borderRadius:12,border:"1.5px solid var(--line2)",background:"var(--white)",fontSize:13,fontFamily:"var(--fb)",outline:"none",color:"var(--ink)"}}/>
          {err&&<div style={{padding:"9px 12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,fontSize:12,color:"#dc2626",fontFamily:"var(--fb)"}}>{err}</div>}
          {info&&<div style={{padding:"9px 12px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,fontSize:12,color:"#16a34a",fontFamily:"var(--fb)"}}>{info}</div>}
          <button onClick={submit} disabled={loading} style={{padding:"13px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?"Working...":(view==="signin"?"Sign In":"Create Account")}
          </button>
          <div style={{textAlign:"center",marginTop:6}}>
            <span style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)"}}>{view==="signin"?"No account? ":"Have an account? "}</span>
            <span onClick={()=>{setView(view==="signin"?"signup":"signin");setErr("");setInfo("");}} className="press" style={{fontSize:11,color:"var(--ink)",fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer"}}>{view==="signin"?"Sign Up":"Sign In"}</span>
          </div>
        </div>
      </div>
      <div style={{height:20,flexShrink:0}}/>
    </div>
  );
}

export default function App(){
  const [session,_setSessionState] = useState(()=>getSession());
  const [guestMode,setGuestMode] = useState(false);
  const [mode,setMode]=useState("guest");
  const [onboarded,setOnboarded]=useState(false);
  const [city,_setCity]=useState("Miami");
  const [showProfile,setShowProfile]=useState(false);

  // Persist city to Supabase profile
  const setCity=(c)=>{
    _setCity(c);
    const s=getSession();
    if(s?.access_token){
      fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+s.user.id,{
        method:"PATCH",headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+s.access_token,
          "Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({city:c})
      }).catch(()=>{});
    }
  };

  // Load city from profile on session init
  useEffect(()=>{
    // Fix page title
    if(typeof document!=="undefined") document.title="Luma — VIP Table Booking";
    const s=getSession();
    if(s?.access_token){
      fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+s.user.id+"&select=city",{
        headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+s.access_token}
      }).then(r=>r.json()).then(d=>{
        if(d?.[0]?.city) _setCity(d[0].city);
      }).catch(()=>{});
    }
  },[session?.access_token]);
  const [gt,setGt]=useState("home");
  const [pt,setPt]=useState("dashboard");
  const [venue,setVenue]=useState(null);
  const [selPromoter,setSelPromoter]=useState(null);
  const [inviteData,setInviteData]=useState(null); // {promoter, event}
  const [stack,setStack]=useState([]);
  const [msgTarget,setMsgTarget]=useState(null);
  const [bookingKey,setBookingKey]=useState(0);
  const [localBookings,setLocalBookings]=useState([]);
  const onBooked=(booking)=>{
    setLocalBookings(prev=>[booking,...prev]);
    setBookingKey(k=>k+1);
  };
  const pro=mode==="promoter";
  const userName=session?.user?.user_metadata?.name||session?.user?.email?.split("@")[0]||"Guest";

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
    if(showProfile) return <Profile go={go} onSwitchMode={switchMode} city={city} onSignOut={handleSignOut} userEmail={session?.user?.email||session?.email} userName={userName} onCityChange={setCity}/>;
    if(!pro){
      if(inviteData) return <InviteLanding promoter={inviteData.promoter} event={inviteData.event} go={go} goBack={()=>go("back")} goPromoter={p=>go("promoter",p)}/>;
      if(selPromoter) return <PromoterProfile promoter={selPromoter} goBack={()=>go("back")} goVenue={v=>go("venue",v)} goBookPromoter={(p,ev)=>go("invite",{promoter:p,event:ev})}/>;
      if(venue) return <VenueDetail venue={venue} go={go} onBooked={onBooked}/>;
      if(gt==="home") return <Home go={go} city={city} userName={userName}/>;
      if(gt==="explore") return <Explore go={go} city={city}/>;
      if(gt==="map") return <MapScreen go={go} city={city}/>;
      if(gt==="promoters") return <PromotersDir goPromoter={p=>go("promoter",p)}/>;
      if(gt==="bookings") return <Bookings go={go} refreshKey={bookingKey} localBookings={localBookings}/>;
      return <Home go={go} userName={userName}/>;
    }
    if(pt==="dashboard") return <ProDash setTab={setPt} userName={userName}/>;
    if(pt==="guests")    return <ProGuests setTab={setPt} onMessage={(guestName)=>{setMsgTarget(guestName);setPt("messages");}}/>;
    if(pt==="links")     return <ProLinks/>;
    if(pt==="analytics") return <ProAnalytics/>;
    if(pt==="payouts")   return <ProPayouts/>;
    if(pt==="messages")  return <ProMessages initialOpen={msgTarget} onOpened={()=>setMsgTarget(null)}/>;
    if(pt==="pricing")   return <ProPricing/>;
    return <ProDash setTab={setPt} userName={userName}/>;
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
        {tabs.map(t=>{const a=t.id==="profile"?showProfile:(gt===t.id&&noOverlay&&!showProfile);return(
          <div key={t.id} className="tab press" onClick={()=>{if(t.id==="profile"){go("profile");}else{setGt(t.id);setVenue(null);setSelPromoter(null);setInviteData(null);setStack([]);setShowProfile(false);}}}>
            {t.ic(a)}
            <span style={{fontSize:9,fontWeight:a?700:400,color:a?"var(--ink)":"var(--dim)",fontFamily:"var(--fb)"}}>{t.label}</span>
            {a&&<div style={{width:4,height:1.5,borderRadius:2,background:"var(--ink)"}}/>}
          </div>
        );})}
      </div>
    );
  }

  function ProTabs(){
    const unread=MSGS.reduce((s,c)=>s+c.unread,0);
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
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <SB dark={pro}/>
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
                  <div className="fade-screen" key={pro?pt:gt+(venue?.id||"")+(selPromoter?.id||"")+(showProfile?"p":"")+(inviteData?.event?.id||"")} style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden"}}>
                    {renderScreen()}
                  </div>
                </div>
                {((!pro&&!venue&&!selPromoter&&!inviteData)||pro)?<>{pro?<ProTabs/>:<GuestTabs/>}</>:null}
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
