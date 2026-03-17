import { useState, useEffect, useRef } from "react";

// -----------------------------------------------
// Supabase config - no SDK, plain fetch
// -----------------------------------------------
const SUPA_URL  = (typeof process!=="undefined"&&process.env?.NEXT_PUBLIC_SUPABASE_URL) || "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = (typeof process!=="undefined"&&process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpYnlyc3JkaHNrdmRtbG5wc3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Njc0NDcsImV4cCI6MjA4ODM0MzQ0N30.o1CPKQP1qrvonHJFm7UESuFmgTa3z-BJqePMSVn7ZkI";
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

// Token refresh — checks every 60s, refreshes if token expires within 5 min
async function refreshToken() {
  const s = getSession();
  if (!s?.refresh_token || !s?.expires_at) return;
  const expiresAt = s.expires_at * 1000; // convert to ms
  const fiveMin = 5 * 60 * 1000;
  if (Date.now() < expiresAt - fiveMin) return; // still fresh
  try {
    const r = await fetch(SUPA_URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { "apikey": SUPA_ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const d = await r.json();
    if (d.access_token) _setSession(d);
  } catch (e) {}
}
// Auto-refresh interval (started in App component)
let _refreshInterval = null;
function startTokenRefresh() {
  if (_refreshInterval) return;
  _refreshInterval = setInterval(refreshToken, 60000);
  refreshToken(); // check immediately
}
function stopTokenRefresh() {
  if (_refreshInterval) { clearInterval(_refreshInterval); _refreshInterval = null; }
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
.scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;min-height:0;flex:1;padding-bottom:16px;touch-action:pan-y;overscroll-behavior-y:contain}
.scroll::-webkit-scrollbar{display:none}
.hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;touch-action:pan-x;overscroll-behavior-x:contain}
.hscroll::-webkit-scrollbar{display:none}
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
  {id:1,metro:"Miami",name:"LIV",type:"Nightclub",city:"Miami Beach",price:250,rating:4.9,reviews:1200,distance:"0.5 mi",tags:["VIP","Bottle Service"],hot:true,lat:25.8005,lng:-80.1247,
   img:"https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=700&h=462&fit=crop",
   about:"Fontainebleau's legendary nightclub. The most sought-after tables in Miami — if you can get them."},
  {id:2,metro:"Miami",name:"E11EVEN",type:"Nightclub",city:"Downtown",price:200,rating:4.8,reviews:980,distance:"1.2 mi",tags:["24hr","Bottle Service"],hot:true,lat:25.7816,lng:-80.1960,
   img:"https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&h=462&fit=crop",
   about:"Miami's 24-hour ultraclub. Open all night, every night. Production value is unmatched."},
  {id:3,metro:"Miami",name:"Story",type:"Nightclub",city:"South Beach",price:300,rating:4.9,reviews:870,distance:"0.5 mi",tags:["VIP","DJ Events"],hot:true,lat:25.7738,lng:-80.1340,
   img:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=700&h=462&fit=crop",
   about:"South Beach's flagship mega-club. World-class DJs, massive production."},
  {id:4,metro:"Miami",name:"Club Space",type:"Nightclub",city:"Downtown",price:80,rating:4.7,reviews:650,distance:"2.1 mi",tags:["Techno","Late Night"],lat:25.7851,lng:-80.1898,
   img:"https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=700&h=462&fit=crop",
   about:"Miami's legendary after-hours. The terrace at sunrise is a rite of passage."},
  {id:5,metro:"Miami",name:"Nikki Beach",type:"Pool Party",city:"South Beach",price:100,rating:4.7,reviews:540,distance:"0.7 mi",tags:["Pool Party","Cabana"],hot:true,lat:25.7654,lng:-80.1300,
   img:"https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=700&h=462&fit=crop",
   about:"The original beach club. Sunday brunch here is a Miami institution."},
  // ----------------------------------------------- New York --
  {id:6,metro:"New York",name:"1 OAK",type:"Nightclub",city:"Chelsea",price:300,rating:4.8,reviews:891,distance:"0.7 mi",tags:["Celebrity","VIP"],hot:true,lat:40.7436,lng:-74.0055,
   img:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=700&h=462&fit=crop",
   about:"The celebrity nightclub. Exclusive, high-energy, and the people-watching is worth the bottle."},
  {id:7,metro:"New York",name:"Marquee",type:"Nightclub",city:"Chelsea",price:200,rating:4.8,reviews:1102,distance:"0.5 mi",tags:["EDM","VIP Booths"],hot:true,lat:40.7462,lng:-74.0035,
   img:"https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=700&h=462&fit=crop",
   about:"NYC's premier nightclub. World-class DJs and unmatched production."},
  {id:8,metro:"New York",name:"PHD Rooftop",type:"Rooftop",city:"Chelsea",price:150,rating:4.6,reviews:512,distance:"0.6 mi",tags:["Rooftop","Views"],lat:40.7446,lng:-73.9987,
   img:"https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&h=462&fit=crop",
   about:"Dream Hotel's rooftop lounge. Stunning skyline views and a see-and-be-seen crowd."},
  {id:9,metro:"New York",name:"Tao Downtown",type:"Nightclub",city:"Chelsea",price:250,rating:4.8,reviews:760,distance:"0.8 mi",tags:["Dining","VIP"],hot:true,lat:40.7420,lng:-74.0060,
   img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&h=462&fit=crop",
   about:"Asian-inspired mega-restaurant meets nightclub. The downstairs lounge transforms after midnight."},
  {id:10,metro:"New York",name:"Avant Gardner",type:"Nightclub",city:"Brooklyn",price:80,rating:4.9,reviews:423,distance:"3.5 mi",tags:["Electronic","Festival"],hot:true,lat:40.7048,lng:-73.9212,
   img:"https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=700&h=462&fit=crop",
   about:"Brooklyn's mega venue. The Brooklyn Mirage open-air space is world-class."},
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

// Promoter data hook — tries edge function, falls back to mock data
function usePromoterData() {
  const [data, setData] = useState({ guests: GUESTS, messages: MSGS, payouts: PAYOUTS, links: LINKS, loading: true });
  useEffect(() => {
    const sess = getSession();
    if (!sess?.access_token) { setData(d => ({ ...d, loading: false })); return; }
    edgeCall("get-promoter-data", {}).then(d => {
      if (d && !d.error) {
        setData({
          guests: d.guests?.length ? d.guests.map(g => ({
            id: g.id, name: g.name || g.guest_name || "Guest", table: g.table || g.notes || "Table",
            party: g.party_size || g.guests || 2, status: g.status || "confirmed",
            paid: Math.round((g.total || 0) / 100), arrived: g.status === "checked_in",
            av: (g.name || g.guest_name || "G")[0]
          })) : GUESTS,
          messages: d.messages?.length ? d.messages : MSGS,
          payouts: d.payouts?.length ? d.payouts : PAYOUTS,
          links: d.links?.length ? d.links.map(l => ({
            id: l.id, label: l.label || l.name || "Link",
            url: l.url || "lumarsv.com/p/" + (l.slug || l.id),
            clicks: l.clicks || l.click_count || 0, conv: l.conversions || l.booking_count || 0
          })) : LINKS,
          loading: false
        });
      } else {
        setData(d => ({ ...d, loading: false }));
      }
    }).catch(() => setData(d => ({ ...d, loading: false })));
  }, []);
  return data;
}

// Events hook — fetches upcoming events from DB
function useEvents(metro) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    fetch(SUPA_URL + "/rest/v1/events?active=eq.true&event_date=gte." + today + "&order=event_date.asc&limit=8&select=*,venues(name,metro,type)", {
      headers: { "apikey": SUPA_ANON }
    }).then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length) {
        const filtered = metro ? d.filter(e => e.venues?.metro === metro) : d;
        setEvents(filtered);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [metro]);
  return { events, loading };
}

// Favorites hook
function useFavorites() {
  const [favIds, setFavIds] = useState(new Set());
  useEffect(() => {
    const sess = getSession();
    if (!sess?.access_token) return;
    fetch(SUPA_URL + "/rest/v1/favorites?user_id=eq." + sess.user.id + "&select=venue_id", {
      headers: { "apikey": SUPA_ANON, "Authorization": "Bearer " + sess.access_token }
    }).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setFavIds(new Set(d.map(f => f.venue_id)));
    }).catch(() => {});
  }, []);
  const toggle = async (venueId) => {
    const sess = getSession();
    const isFav = favIds.has(venueId);
    setFavIds(prev => { const n = new Set(prev); isFav ? n.delete(venueId) : n.add(venueId); return n; });
    if (!sess?.access_token) return;
    if (isFav) {
      fetch(SUPA_URL + "/rest/v1/favorites?user_id=eq." + sess.user.id + "&venue_id=eq." + venueId, {
        method: "DELETE", headers: { "apikey": SUPA_ANON, "Authorization": "Bearer " + sess.access_token }
      }).catch(() => {});
    } else {
      fetch(SUPA_URL + "/rest/v1/favorites", {
        method: "POST", headers: { "apikey": SUPA_ANON, "Authorization": "Bearer " + sess.access_token, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ user_id: sess.user.id, venue_id: venueId })
      }).catch(() => {});
    }
  };
  return { favIds, toggle, isFav: (id) => favIds.has(id) };
}

// Geolocation hook
function useGeo() {
  const [loc, setLoc] = useState(null);
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);
  const distanceTo = (lat, lng) => {
    if (!loc || !lat || !lng) return null;
    const R = 3959; // miles
    const dLat = (lat - loc.lat) * Math.PI / 180;
    const dLng = (lng - loc.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(loc.lat*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLng/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };
  return { loc, distanceTo };
}

// Venue photos hook
function useVenuePhotos(venueId) {
  const [photos, setPhotos] = useState([]);
  useEffect(() => {
    if (!venueId) return;
    fetch(SUPA_URL + "/rest/v1/venue_photos?venue_id=eq." + venueId + "&order=sort_order.asc&limit=6", {
      headers: { "apikey": SUPA_ANON }
    }).then(r => r.json()).then(d => { if (Array.isArray(d)) setPhotos(d); }).catch(() => {});
  }, [venueId]);
  return photos;
}

// Recently viewed (in-memory)
const _recentlyViewed = [];
function addRecentlyViewed(venue) {
  if (!venue?.id) return;
  const idx = _recentlyViewed.findIndex(v => v.id === venue.id);
  if (idx >= 0) _recentlyViewed.splice(idx, 1);
  _recentlyViewed.unshift(venue);
  if (_recentlyViewed.length > 10) _recentlyViewed.pop();
}

// CSV export utility
function exportCSV(data, filename) {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(","), ...data.map(row => keys.map(k => {
    const v = row[k]; return typeof v === "string" && (v.includes(",") || v.includes('"')) ? '"' + v.replace(/"/g, '""') + '"' : v ?? "";
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}


// Dynamic date helpers for mock data
const _fd=(d)=>d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const _tomorrow=new Date(); _tomorrow.setDate(_tomorrow.getDate()+1);
const _lastWeek=new Date(); _lastWeek.setDate(_lastWeek.getDate()-7);
const _twoWeeks=new Date(); _twoWeeks.setDate(_twoWeeks.getDate()-14);
const _nextFri=(()=>{const d=new Date();d.setDate(d.getDate()+((5-d.getDay()+7)%7||7));return d;})();
const _nextSat=(()=>{const d=new Date();d.setDate(d.getDate()+((6-d.getDay()+7)%7||7));return d;})();

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
  {id:1,event:"Noir Rooftop . "+_fd(_tomorrow),gross:1835,comm:275,status:"pending"},
  {id:2,event:"Azure Terrace . "+_fd(_lastWeek),gross:1200,comm:180,status:"paid"},
  {id:3,event:"Velvet Underground . "+_fd(_twoWeeks),gross:2100,comm:315,status:"paid"},
];

const LINKS = [
  {id:1,label:"Noir Rooftop - "+_fd(_nextFri),url:"lumarsv.com/p/NOIR-"+_nextFri.toISOString().slice(5,10),clicks:142,conv:8},
  {id:2,label:"Azure - "+_fd(_nextSat),url:"lumarsv.com/p/AZURE-"+_nextSat.toISOString().slice(5,10),clicks:88,conv:5},
  {id:3,label:"Velvet - "+_fd(_tomorrow),url:"lumarsv.com/p/VELVET-"+_tomorrow.toISOString().slice(5,10),clicks:34,conv:1},
];

// ----------------------------------------------- Shared helpers --------------------------------------------
const ALLOWED_IMG_HOSTS=["images.unsplash.com","picsum.photos","cdn.luma.vip","lumarsv.com","supabase.co","supabase.com"];
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
      {/* Radial glow */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.08),transparent 60%)"}}/>
      {/* Venue name as large watermark */}
      {name&&<div style={{position:"absolute",bottom:-2,left:8,right:8,fontFamily:"'Cormorant Garamond',serif",fontSize:name.length>10?22:28,fontWeight:700,fontStyle:"italic",color:"rgba(255,255,255,.12)",lineHeight:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",userSelect:"none"}}>{name}</div>}
      {/* Emoji watermark */}
      <div style={{position:"absolute",top:6,right:8,fontSize:16,opacity:.2,userSelect:"none"}}>{em}</div>
      {children}
    </div>
  );
}

// Img - shows gradient immediately, image overlays when loaded
function Img({src,style,alt="",type,name}){
  const [ok,setOk]=useState(false);
  const [err,setErr]=useState(false);
  const safe=isSafeImgSrc(src)&&!!src&&!err;
  return(
    <div style={{position:"relative",...style}}>
      <VenueGrad type={type||"default"} name={name} style={{position:"absolute",inset:0,borderRadius:"inherit"}}/>
      {safe&&<img src={src} alt={alt} crossOrigin="anonymous" referrerPolicy="no-referrer"
        style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",borderRadius:"inherit",opacity:ok?1:0,transition:"opacity .4s"}}
        onLoad={()=>setOk(true)} onError={()=>setErr(true)}/>}
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
  const {events}=useEvents(metro);
  const {favIds,toggle:toggleFav,isFav}=useFavorites();
  const {distanceTo}=useGeo();
  const hot=allVenues.filter(v=>v.hot);
  const display=allVenues.length?allVenues:VENUES.filter(v=>v.metro===metro);
  const hotStrip=hot.length?hot:display.slice(0,3);
  const hero=hotStrip[0]||display[0]||VENUES[0];
  return(
    <div className="scroll" style={{flex:1,overflowY:"auto",background:"var(--bg)"}}>
      {/* Back to landing + greeting bar */}
      <div style={{padding:"6px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:1}}>📍 {city==="New York"?"New York, NY":"Miami, FL"}</div>
          <div style={{fontFamily:"var(--fd)",fontSize:22,fontStyle:"italic",color:"var(--ink)",marginTop:2}}>{getGreeting()}, {userName}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <NotificationBell/>
          <div onClick={()=>go("profile")} className="press" style={{width:35,height:35,borderRadius:"50%",background:"var(--ink)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)",cursor:"pointer"}}>{userName[0]||"G"}</div>
        </div>
      </div>

      {/* Hero venue card */}
      <div style={{padding:"12px 18px 0"}}>
        <div className="press" onClick={()=>go("venue",hero)} style={{position:"relative",height:180,borderRadius:20,overflow:"hidden"}}>
          <Img src={hero.img} style={{position:"absolute",inset:0}} alt={hero.name} type={hero.type} name={hero.name}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.85),transparent 55%)"}}/>
          <div style={{position:"absolute",top:12,left:14}}>
            <span style={{background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",color:"white",padding:"3px 10px",borderRadius:18,fontSize:9,fontWeight:700,fontFamily:"var(--fb)"}}>🔥 Featured Tonight</span>
          </div>
          <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"0 16px 14px"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:700,color:"white"}}>{hero.name}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)"}}>📍 {hero.city} · {hero.distance}</span>
              <span style={{background:"white",color:"var(--ink)",padding:"6px 14px",borderRadius:18,fontSize:11,fontWeight:700,fontFamily:"var(--fb)"}}>Reserve →</span>
            </div>
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
        <div className="hscroll" style={{display:"flex",gap:11,overflowX:"auto",scrollbarWidth:"none",marginLeft:-18,paddingLeft:18,marginRight:-18,paddingRight:18,paddingBottom:4}}>
          {hotStrip.map((v,i)=>(
            <div key={v.id} className={`press fu fu${Math.min(i+1,3)}`} onClick={()=>go("venue",v)} style={{flexShrink:0,width:155,borderRadius:16,overflow:"hidden",background:"var(--white)",border:"1px solid var(--line)"}}>
              <div style={{position:"relative",height:105}}>
                <Img src={v.img} style={{position:"absolute",inset:0}} alt={v.name} type={v.type} name={v.name}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.7),transparent 50%)"}}/>
                <div style={{position:"absolute",bottom:8,left:10,right:10}}>
                  <div style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{v.name}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.6)",fontFamily:"var(--fb)"}}>{v.city} · {v.type}</div>
                </div>
              </div>
              <div style={{padding:"7px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Stars r={v.rating}/>
                <span style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--ink)"}}>${v.price}+</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      {events.length>0&&(
        <div style={{padding:"14px 0 6px"}}>
          <div style={{padding:"0 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontFamily:"var(--fd)",fontSize:19,fontWeight:700,color:"var(--ink)"}}>Upcoming Events</span>
            <span style={{fontSize:11,color:"var(--gold)",fontFamily:"var(--fb)",fontWeight:600}}>🔥 This week</span>
          </div>
          <div className="hscroll" style={{display:"flex",gap:11,overflowX:"auto",scrollbarWidth:"none",marginLeft:-18,paddingLeft:18,marginRight:-18,paddingRight:18,paddingBottom:4}}>
            {events.map(ev=>(
              <div key={ev.id} className="press" onClick={()=>{
                const v=allVenues.find(x=>x.id===ev.venue_id)||display[0];
                if(v) go("venue",v);
              }} style={{flexShrink:0,width:220,borderRadius:16,overflow:"hidden",background:"var(--ink)",border:"1px solid rgba(255,255,255,.08)"}}>
                <div style={{position:"relative",height:110}}>
                  <Img src={ev.img_url} style={{position:"absolute",inset:0}} alt={ev.name} type="Nightclub" name={ev.name}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.8),transparent 60%)"}}/>
                  {ev.dj&&<div style={{position:"absolute",top:8,right:8,background:"rgba(201,168,76,.9)",color:"#0a0a0a",fontSize:8,fontWeight:700,fontFamily:"var(--fb)",padding:"2px 8px",borderRadius:10}}>🎧 {ev.dj}</div>}
                  <div style={{position:"absolute",bottom:8,left:10,right:10}}>
                    <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"white",lineHeight:1.2}}>{ev.name}</div>
                  </div>
                </div>
                <div style={{padding:"8px 10px 10px"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.5)",fontFamily:"var(--fb)",marginBottom:3}}>
                    📅 {new Date(ev.event_date).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} . {ev.doors_time}
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {(ev.tags||[]).slice(0,2).map(t=><span key={t} style={{fontSize:8,color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.08)",padding:"2px 6px",borderRadius:8,fontFamily:"var(--fb)"}}>{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All list */}
      <div style={{padding:"10px 18px 90px"}}>
        {/* Saved venues */}
        {favIds.size>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:8}}>❤️ Saved</div>
            <div className="hscroll" style={{display:"flex",gap:9,overflowX:"auto",scrollbarWidth:"none",marginBottom:8}}>
              {display.filter(v=>isFav(v.id)).map(v=>(
                <div key={v.id} className="press" onClick={()=>go("venue",v)} style={{flexShrink:0,width:110,textAlign:"center"}}>
                  <Img src={v.img} style={{width:56,height:56,borderRadius:14,margin:"0 auto 4px"}} alt={v.name} type={v.type} name={v.name}/>
                  <div style={{fontSize:10,fontWeight:600,color:"var(--ink)",fontFamily:"var(--fb)"}}>{v.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Recently viewed */}
        {_recentlyViewed.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:8}}>🕐 Recently Viewed</div>
            <div className="hscroll" style={{display:"flex",gap:9,overflowX:"auto",scrollbarWidth:"none",marginBottom:8}}>
              {_recentlyViewed.slice(0,5).map(v=>(
                <div key={v.id} className="press" onClick={()=>go("venue",v)} style={{flexShrink:0,width:110,textAlign:"center"}}>
                  <Img src={v.img} style={{width:56,height:56,borderRadius:14,margin:"0 auto 4px"}} alt={v.name} type={v.type} name={v.name}/>
                  <div style={{fontSize:10,fontWeight:600,color:"var(--ink)",fontFamily:"var(--fb)"}}>{v.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{fontFamily:"var(--fd)",fontSize:19,fontWeight:700,color:"var(--ink)",marginBottom:10}}>All Venues</div>
        {display.map(v=>{
          const dist=distanceTo(v.lat,v.lng);
          return(
          <div key={v.id} className="press" onClick={()=>{addRecentlyViewed(v);go("venue",v);}} style={{display:"flex",gap:12,padding:"10px 12px",background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,marginBottom:8,position:"relative"}}>
            <Img src={v.img} style={{width:62,height:62,borderRadius:12,flexShrink:0}} alt={v.name} type={v.type} name={v.name}/>
            <div style={{flex:1,minWidth:0,paddingTop:1}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <span style={{fontFamily:"var(--fb)",fontSize:14,fontWeight:700,color:"var(--ink)"}}>{v.name}</span>
                <span style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:700,color:"var(--ink)"}}>${v.price}+</span>
              </div>
              <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:3}}>
                {v.type} · {v.city} · {dist?dist+" mi":v.distance}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Stars r={v.rating}/>
                {v.tags?.slice(0,1).map(t=><span key={t} style={{fontSize:8,color:"var(--sub)",background:"rgba(0,0,0,.04)",padding:"2px 6px",borderRadius:6,fontFamily:"var(--fb)"}}>{t}</span>)}
              </div>
            </div>
            <button onClick={(e)=>{e.stopPropagation();toggleFav(v.id);}} style={{position:"absolute",top:8,right:8,background:"none",border:"none",fontSize:16,cursor:"pointer",opacity:isFav(v.id)?1:.3,transition:"all .15s"}}>{isFav(v.id)?"❤️":"🤍"}</button>
          </div>);
        })}
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
      <div className="hscroll" style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:9,paddingBottom:1}}>
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
      <div className="hscroll" style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:14,paddingBottom:1}}>
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
  const [filter,setFilter]=useState("All");
  const [sel,setSel]=useState(null);
  const mapRef=useRef(null);
  const mapInst=useRef(null);
  const markersRef=useRef([]);
  const {distanceTo}=useGeo();

  const centers={"Miami":[25.783,-80.150],"New York":[40.748,-73.990]};
  const display=cityVenues.length?cityVenues:VENUES.filter(v=>v.metro===metro);
  const filtered=filter==="All"?display:display.filter(v=>v.type===filter);

  // Load Leaflet and create map
  useEffect(()=>{
    if(!mapRef.current||typeof window==="undefined") return;
    
    // Inject Leaflet CSS if not present
    if(!document.getElementById("leaflet-css")){
      const link=document.createElement("link");
      link.id="leaflet-css";
      link.rel="stylesheet";
      link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS if not present
    const initMap=()=>{
      if(mapInst.current){mapInst.current.remove();mapInst.current=null;}
      const L=window.L;
      if(!L) return;
      
      const center=centers[metro]||centers["Miami"];
      const map=L.map(mapRef.current,{
        center,zoom:13,zoomControl:false,attributionControl:false
      });

      // Dark tile layer that matches the app aesthetic
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{
        maxZoom:19,
      }).addTo(map);

      // Zoom control bottom right
      L.control.zoom({position:"bottomright"}).addTo(map);

      mapInst.current=map;
    };

    if(window.L){
      initMap();
    }else{
      const script=document.createElement("script");
      script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload=initMap;
      document.head.appendChild(script);
    }

    return()=>{if(mapInst.current){mapInst.current.remove();mapInst.current=null;}};
  },[metro]);

  // Update markers when filtered venues change
  useEffect(()=>{
    if(!mapInst.current||!window.L) return;
    const L=window.L;
    
    // Clear old markers
    markersRef.current.forEach(m=>m.remove());
    markersRef.current=[];

    filtered.forEach(v=>{
      if(!v.lat||!v.lng) return;
      const dist=distanceTo?.(v.lat,v.lng);
      
      // Custom gold price marker
      const icon=L.divIcon({
        className:"",
        html:`<div style="background:white;border:2px solid #c9a84c;color:#0a0a0a;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:700;font-family:'DM Sans',sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15);display:flex;align-items:center;gap:4px;cursor:pointer;transform:translate(-50%,-50%)"><span style="color:#0a0a0a;font-weight:800">$${v.price_min||v.price||100}</span><span style="font-size:8px;color:rgba(0,0,0,.3)">+</span></div>`,
        iconSize:[0,0],
        iconAnchor:[0,0],
      });

      const marker=L.marker([v.lat,v.lng],{icon}).addTo(mapInst.current);
      
      // Popup with venue card
      const popupHtml=`
        <div style="background:#0a0a0a;color:white;border-radius:14px;overflow:hidden;width:220px;font-family:'DM Sans',sans-serif;border:1px solid rgba(255,255,255,.1)">
          <div style="height:100px;background:linear-gradient(160deg,#1e0533,#6d28d9);position:relative">
            <div style="position:absolute;bottom:8px;left:10px">
              <div style="font-size:14px;font-weight:700">${v.name}</div>
              <div style="font-size:10px;color:rgba(255,255,255,.5)">${v.type} · ${v.city||""}</div>
            </div>
          </div>
          <div style="padding:10px 12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;gap:2px">${"★★★★★".split("").map((_,i)=>`<span style="color:${i<Math.floor(v.rating||4.5)?"#c9a84c":"#333"};font-size:10px">★</span>`).join("")}</div>
              <span style="font-size:13px;font-weight:700;color:#c9a84c">$${v.price_min||v.price||100}+</span>
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,.35)">${dist?dist+" mi away":"📍 "+(v.city||metro)}</div>
          </div>
        </div>`;
      
      marker.bindPopup(popupHtml,{className:"luma-popup",closeButton:false,offset:[0,-5]});
      marker.on("click",()=>setSel(v));
      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if(markersRef.current.length>1){
      const group=L.featureGroup(markersRef.current);
      mapInst.current.fitBounds(group.getBounds().pad(0.1));
    }
  },[filtered,distanceTo]);

  // Inject popup styles
  useEffect(()=>{
    if(document.getElementById("luma-map-styles")) return;
    const style=document.createElement("style");
    style.id="luma-map-styles";
    style.textContent=`.luma-popup .leaflet-popup-content-wrapper{background:transparent;box-shadow:none;padding:0;border-radius:14px}.luma-popup .leaflet-popup-content{margin:0;width:auto!important}.luma-popup .leaflet-popup-tip{border-top-color:#0a0a0a}`;
    document.head.appendChild(style);
  },[]);

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",minHeight:0,overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"6px 18px 8px",flexShrink:0}}>
        <div style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Nearby</div>
        <div className="hscroll" style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:1}}>
          {filters.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className="press"
              style={{padding:"6px 14px",borderRadius:18,border:"1.5px solid",fontSize:11,fontWeight:600,
                fontFamily:"var(--fb)",cursor:"pointer",flexShrink:0,transition:"all .15s",
                background:filter===f?"var(--ink)":"var(--white)",
                borderColor:filter===f?"var(--ink)":"var(--line2)",
                color:filter===f?"white":"var(--sub)"}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        <div ref={mapRef} style={{position:"absolute",inset:0}}/>
        
        {/* Venue count badge */}
        <div style={{position:"absolute",top:10,left:10,zIndex:500,background:"rgba(10,10,12,.85)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80"}}/>
          <span style={{fontSize:11,fontWeight:600,color:"white",fontFamily:"var(--fb)"}}>{filtered.length} venues</span>
        </div>
      </div>

      {/* Selected venue card */}
      {sel&&(
        <div style={{position:"absolute",bottom:70,left:14,right:14,zIndex:500,background:"var(--white)",border:"1px solid var(--line)",borderRadius:18,padding:"12px 14px",boxShadow:"0 12px 40px rgba(0,0,0,.15)",display:"flex",gap:12,alignItems:"center",animation:"slideUp .25s cubic-bezier(.16,1,.3,1) both"}}>
          <Img src={sel.img||sel.img_url} style={{width:56,height:56,borderRadius:14,flexShrink:0}} alt={sel.name} type={sel.type} name={sel.name}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"var(--fb)",fontSize:14,fontWeight:700,color:"var(--ink)"}}>{sel.name}</div>
            <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)",marginTop:2}}>📍 {sel.city||""} · {sel.type} · ${sel.price_min||sel.price}+</div>
            <Stars r={sel.rating||4.5}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
            <button onClick={()=>go("venue",sel)} className="press" style={{padding:"8px 14px",background:"var(--ink)",color:"white",border:"none",borderRadius:10,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>Book</button>
            <button onClick={()=>setSel(null)} style={{background:"none",border:"none",fontSize:9,color:"var(--dim)",cursor:"pointer",fontFamily:"var(--fb)"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


function Bookings({go,refreshKey,localBookings=[]}){
  const [qrBooking,setQrBooking]=useState(null);
  const [tab,setTab]=useState("upcoming");
  const {bookings:dbBk,loading}=useUserBookings(refreshKey);
  const bk=[...localBookings,...dbBk];
  const list=tab==="upcoming"
    ?bk.filter(b=>b.status==="confirmed"||b.status==="pending")
    :bk.filter(b=>b.status==="cancelled"||b.status==="checked_in");
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
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
            <div style={{padding:"11px 14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><div style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)"}}>📅 {b.date} . {b.table}</div><div style={{background:"#f5f4f0",border:"1px solid var(--line)",borderRadius:9,padding:"5px 10px",textAlign:"center"}}><div style={{fontSize:7,color:"var(--sub)",letterSpacing:".1em",textTransform:"uppercase",fontFamily:"var(--fb)"}}>Code</div><div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,letterSpacing:".06em"}}>{b.code}</div></div></div><button onClick={()=>setQrBooking(b)} style={{width:"100%",padding:"9px",background:"var(--ink)",color:"white",border:"none",borderRadius:11,fontSize:12,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>View QR Code</button></div>
          </div>
        ))}
      </div>}
    </div>
      {/* QR Modal */}
      {qrBooking&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,animation:"fadeIn .2s ease"}}>
          <div style={{background:"white",borderRadius:22,padding:22,marginBottom:16,boxShadow:"0 12px 48px rgba(0,0,0,.3)"}}>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrBooking.code)}&margin=8&color=0a0a0a`} alt="QR" width={200} height={200} style={{display:"block"}}/>
          </div>
          <div style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:700,color:"white",marginBottom:4}}>{qrBooking.venue}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)",fontFamily:"var(--fb)",marginBottom:4}}>{qrBooking.date} . {qrBooking.table}</div>
          <div style={{background:"rgba(255,255,255,.1)",borderRadius:10,padding:"6px 16px",marginBottom:20}}>
            <span style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white",letterSpacing:".08em"}}>{qrBooking.code}</span>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.3)",fontFamily:"var(--fb)",marginBottom:20,textAlign:"center"}}>Show this QR code at the venue entrance</div>
          <button onClick={()=>setQrBooking(null)} className="press" style={{padding:"12px 32px",background:"white",color:"var(--ink)",border:"none",borderRadius:14,fontSize:13,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>Close</button>
        </div>
      )}
    </div>
  );
}

function VenueDetail({venue,go,onBooked}){
  const [step,    setStep]    = useState("detail");
  const [selT,    setSelT]    = useState(null);
  const [showReview, setShowReview] = useState(false);
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
      justifyContent:"center",padding:28,textAlign:"center",background:"var(--bg)",position:"relative",overflow:"hidden"}}>
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
        <button onClick={()=>setShowReview(true)}
          style={{width:"100%",padding:"10px",background:"transparent",
            border:"none",borderRadius:13,fontSize:11,
            fontFamily:"var(--fb)",fontWeight:500,cursor:"pointer",color:"var(--sub)",marginTop:4}}>
          ⭐ Rate this venue
        </button>
      </div>
      {showReview&&<ReviewModal venue={venue} onClose={()=>setShowReview(false)} onSubmit={()=>setShowReview(false)}/>}
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
          <div className="hscroll" style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
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
          {/* Photo gallery */}
          <PhotoGallery venueId={venue.id} fallbackImg={venue.img}/>
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
            <div className="hscroll" style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingRight:18}}>
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

          {/* Reviews */}
          <VenueReviews venueId={venue.id}/>
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

function ProDash({setTab,userName="Promoter",proData,onAdmin,onRevenue,onLeaderboard,onAnalytics}){
  const [showPaywall,setShowPaywall]=useState(false);
  const guests=proData?.guests||GUESTS;
  const payouts=proData?.payouts||PAYOUTS;
  const links=proData?.links||LINKS;
  const earned=payouts.filter(p=>p.status==="paid").reduce((s,p)=>s+p.comm,0);
  const pending=payouts.filter(p=>p.status==="pending").reduce((s,p)=>s+p.comm,0);
  const confirmed=guests.filter(g=>g.status==="confirmed").length;
  const arrived=guests.filter(g=>g.arrived).length;
  const tonightDate=_fd(_tomorrow);
  if(showPaywall) return <ProPaywall onClose={()=>setShowPaywall(false)} onSelect={()=>setShowPaywall(false)}/>;
  return(
    <div className="scroll fi" style={{flex:1,overflowY:"auto",background:"var(--pro)"}}>
      <div style={{padding:"4px 18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div style={{fontFamily:"var(--fd)",fontSize:13,fontStyle:"italic",color:P.sub}}>Welcome back,</div><div style={{fontFamily:"var(--fd)",fontSize:25,fontWeight:700,color:"white"}}>{userName}</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <NotificationBell dark={true}/>
            <div style={{background:"var(--goldbg)",border:"1px solid rgba(201,168,76,.3)",borderRadius:20,padding:"4px 11px"}}><span style={{fontSize:10,color:"var(--gold)",fontWeight:700,fontFamily:"var(--fb)"}}>✦ PROMOTER</span></div>
            <button className="press" onClick={()=>setShowPaywall(true)} style={{background:"rgba(201,168,76,.12)",border:"1px solid rgba(201,168,76,.25)",borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:9,color:"var(--gold)",fontWeight:700,fontFamily:"var(--fb)"}}>⬆ Upgrade</button>
          </div>
        </div>

        {/* Tonight card */}
        <div className="press" onClick={()=>setTab("guests")} style={{background:"linear-gradient(135deg,rgba(201,168,76,.16),rgba(201,168,76,.05))",border:"1px solid rgba(201,168,76,.22)",borderRadius:18,padding:"14px 16px",marginBottom:13}}>
          <div style={{fontSize:9,color:"rgba(201,168,76,.65)",fontWeight:700,fontFamily:"var(--fb)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:5}}>Tonight's Event</div>
          <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white",marginBottom:1}}>Noir Rooftop</div>
          <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)",marginBottom:11}}>{tonightDate} . Doors 10PM</div>
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
            [links.reduce((s,l)=>s+l.clicks,0)+" clicks","Link Traffic","🔗","links"],
            [links.reduce((s,l)=>s+l.conv,0)+" booked","Conversions","✅","analytics"]
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
          {[["👥","Guest List","5 confirmed . 2 arrived","guests"],["🔗","Invite Links","264 clicks . 14 booked","links"],["📊","Analytics","Clicks & conversions","analytics"],["💰","Payouts","$"+earned+" earned","payouts"],["💬","Messages","2 unread","messages"],["⚙️","Pricing","Set table minimums","pricing"],["🏢","Manage Venues","Add + edit venues & events","admin"],["📈","Revenue","Charts, breakdown, export","revenue"],["🏆","Leaderboard","Rankings, profiles, socials","leaderboard"],["📥","Export CSV","Download guest & booking data","export"],["📊","Full Analytics","Bookings, waitlist, venues","analyticsDash"]].map(([ic,l,s,t])=>(
            <ProCard key={l} onClick={()=>{
              if(t==="admin")onAdmin&&onAdmin();
              else if(t==="revenue")onRevenue&&onRevenue();
              else if(t==="leaderboard")onLeaderboard&&onLeaderboard();
              else if(t==="analyticsDash")onAnalytics&&onAnalytics();
              else if(t==="export"){exportCSV(guests.map(g=>({name:g.name,table:g.table,party:g.party,status:g.status,paid:"$"+g.paid})),"luma-guests.csv");alert("CSV downloaded!");}
              else setTab(t);
            }} style={{padding:"11px 13px"}}>
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
        <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)"}}>Noir Rooftop . {_fd(_tomorrow)}</div>
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
    const newLink={id:Date.now(),label:newLabel.trim(),url:"lumarsv.com/p/"+slug,clicks:0,conv:0};
    setLinks(l=>[newLink,...l]);
    setNewLabel("");setSelVenue(null);setShowNew(false);
  };
  const [qr,setQr]=useState(null);
  if(qr) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden",animation:"scaleIn .25s cubic-bezier(.16,1,.3,1) both"}}>
      <div style={{padding:"10px 18px 12px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0}}>
        <button onClick={()=>setQr(null)} className="press"
          style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white"}}>‹</button>
        <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white"}}>QR Code</div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 28px"}}>
        <div style={{background:"white",borderRadius:20,padding:18,marginBottom:18,boxShadow:"0 8px 40px rgba(0,0,0,.4)"}}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://lumarsv.com/p/${qr.url.split('/p/')[1]}&margin=0&color=0a0a0a`}
            alt="QR Code" width={220} height={220} style={{display:"block",borderRadius:4}}/>
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:4,textAlign:"center"}}>{qr.label}</div>
        <div style={{fontSize:12,color:P.sub,fontFamily:"var(--fb)",marginBottom:6}}>lumarsv.com/p/{qr.url.split('/p/')[1]}</div>
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
                  <button className="press" onClick={()=>copy(l.id,"https://"+l.url)} style={{flex:1,padding:"8px",background:copyErr===l.id?"#ef4444":"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:9,fontSize:11,fontFamily:"var(--fb)",fontWeight:700,cursor:"pointer",transition:"background .2s"}}>{copied===l.id?"✓ Copied!":copyErr===l.id?"Failed":"📋 Copy"}</button>
                  <button className="press" onClick={async()=>{
                    const url="https://"+l.url;
                    if(navigator.share){try{await navigator.share({title:l.label,text:"Book through my link",url});}catch(e){}}
                    else{const ok=await copyToClipboard(url);if(ok)setCopied(l.id);else setCopyErr(l.id);setTimeout(()=>{setCopied(null);setCopyErr(null);},2000);}
                  }} style={{flex:1,padding:"8px",background:"transparent",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.5)",borderRadius:9,fontSize:11,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>↗ Share</button>
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
      <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden"}}>
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
const _exp7=_fd(new Date(Date.now()+7*864e5));
const _exp14=_fd(new Date(Date.now()+14*864e5));
const _exp21=_fd(new Date(Date.now()+21*864e5));
const _exp30=_fd(new Date(Date.now()+30*864e5));
const PROMOTERS = [
  // ----------------------------------------------- Miami -------------------------------------------------
  {id:1,name:'Jordan Voss',handle:'@jordanvoss',avatar:'J',city:'Miami . South Beach',region:'Miami',rating:4.9,reviews:214,bookings:1840,followers:'12.4k',bio:"Miami's top rooftop & pool promoter. VIP access guaranteed.",verified:true,
   specialties:['Rooftop','Pool Party','Bottle Service'],venues:['Noir Rooftop','Soleil Pool Club','Azure Terrace'],
   deals:[{id:1,label:'10% off VIP Booths',code:'JORDAN10',expiry:_exp14},{id:2,label:'Free entry + priority queue',code:'VJFREE',expiry:_exp7}],
   events:[{id:1,venue:'Noir Rooftop',date:'Fri Mar 7',spots:3,img:'https://picsum.photos/id/1039/400/264'},{id:2,venue:'Soleil Pool Club',date:'Sat Mar 8',spots:8,img:'https://picsum.photos/id/316/400/264'}],
   feedbacks:[{name:'Marco R.',stars:5,text:'Jordan got us the best booth - no wait, great service.'},{name:'Aisha T.',stars:5,text:'Booked through his link, seamless. Will use again.'}]},
  {id:2,name:'Mia Reyes',handle:'@miareyes',avatar:'M',city:'Miami . Wynwood',region:'Miami',rating:4.8,reviews:187,bookings:1320,followers:'8.9k',bio:'Wynwood nightlife curator. Underground, authentic, always lit.',verified:true,
   specialties:['Nightclub','DJ Nights','Afrobeats'],venues:['Velvet Underground','Obsidian Club'],
   deals:[{id:1,label:'$20 off Bottle Tables',code:'MIA20',expiry:_exp14}],
   events:[{id:1,venue:'Velvet Underground',date:'Fri Mar 14',spots:12,img:'https://picsum.photos/id/26/400/264'}],
   feedbacks:[{name:'Priya S.',stars:5,text:'Mia knows every bouncer in Wynwood. Walked right in.'},{name:'Tyler W.',stars:4,text:'Great vibe curation, smaller crew which is nice.'}]},
  {id:3,name:'Dante Cruz',handle:'@dantecruz',avatar:'D',city:'Miami . Brickell',region:'Miami',rating:4.7,reviews:98,bookings:720,followers:'5.2k',bio:"Brickell's go-to for upscale lounges and cocktail experiences.",verified:false,
   specialties:['Lounge','Cocktails','Business'],venues:['Azure Terrace'],
   deals:[{id:1,label:'Complimentary welcome cocktail',code:'DANTE1ST',expiry:_exp30}],
   events:[{id:1,venue:'Azure Terrace',date:'Sat Mar 8',spots:4,img:'https://picsum.photos/id/371/400/264'}],
   feedbacks:[{name:'Sofia L.',stars:5,text:'Perfect for a corporate night out. Very professional.'},{name:'Raj M.',stars:4,text:'Azure Terrace through Dante was an amazing experience.'}]},
  {id:4,name:'Zara Hunt',handle:'@zarahunt',avatar:'Z',city:'Miami . South Beach',region:'Miami',rating:4.9,reviews:305,bookings:2100,followers:'22k',bio:'Top 1% promoter on Luma. Pool parties, beach clubs, A-list energy.',verified:true,
   specialties:['Pool Party','Dayclub','Celebrity Events'],venues:['Soleil Pool Club','Noir Rooftop'],
   deals:[{id:1,label:'Cabana upgrade for 4+',code:'ZARAUP',expiry:_exp7},{id:2,label:'Early bird access - save $40',code:'ZARAEARLY',expiry:_exp7}],
   events:[{id:1,venue:'Soleil Pool Club',date:'Sat Mar 8',spots:2,img:'https://picsum.photos/id/429/400/264'}],
   feedbacks:[{name:'Bianca R.',stars:5,text:"Zara's connections are insane. Best pool day of my life."},{name:'Chris D.',stars:5,text:"Got upgraded to a cabana at Soleil - didn't even ask for it."}]},
  {id:5,name:'Rico Flames',handle:'@ricoflames',avatar:'R',city:'Miami . Little Havana',region:'Miami',rating:4.8,reviews:143,bookings:980,followers:'7.1k',bio:'Latin nights specialist. Salsa, reggaeton, fire lineups every weekend.',verified:true,
   specialties:['Latin Nights','Reggaeton','DJ Events'],venues:['Obsidian Club','Velvet Underground'],
   deals:[{id:1,label:'Ladies free before midnight',code:'RICOLADIES',expiry:_exp14},{id:2,label:'Group of 6+ - 1 free bottle',code:'RICO6UP',expiry:_exp21}],
   events:[{id:1,venue:'Obsidian Club',date:'Sat Mar 15',spots:20,img:'https://picsum.photos/id/289/400/264'}],
   feedbacks:[{name:'Isabella M.',stars:5,text:'Rico throws the best Latin nights in Miami, no debate.'},{name:'Carlos V.',stars:5,text:'Got a free bottle for our group. Insane deal.'}]},
  {id:6,name:'Serena Vale',handle:'@serenavale',avatar:'S',city:'Miami . Coconut Grove',region:'Miami',rating:4.6,reviews:89,bookings:540,followers:'4.4k',bio:'Curated luxury experiences. Intimate, high-end, exclusive.',verified:false,
   specialties:['Luxury','Lounge','Private Events'],venues:['Azure Terrace','Noir Rooftop'],
   deals:[{id:1,label:'15% off for first-time bookings',code:'SERENANEW',expiry:_exp30}],
   events:[{id:1,venue:'Azure Terrace',date:'Fri Mar 14',spots:6,img:'https://picsum.photos/id/342/400/264'}],
   feedbacks:[{name:'Amanda F.',stars:5,text:"Serena's events feel like private members clubs. Love it."},{name:'James K.',stars:4,text:'Very attentive, remembered our preferences from last time.'}]},
  {id:7,name:'Marcus Gold',handle:'@marcusgold',avatar:'G',city:'Miami . Downtown',region:'Miami',rating:4.7,reviews:201,bookings:1450,followers:'9.8k',bio:'Downtown Miami most connected promoter. Hip-hop, EDM, all genres.',verified:true,
   specialties:['Hip-Hop','EDM','Bottle Service'],venues:['Obsidian Club','Velvet Underground','Noir Rooftop'],
   deals:[{id:1,label:'$50 off tables over $500 min',code:'MGOLD50',expiry:_exp21}],
   events:[{id:1,venue:'Noir Rooftop',date:'Fri Mar 21',spots:7,img:'https://picsum.photos/id/43/400/264'}],
   feedbacks:[{name:'Devon R.',stars:5,text:'Marcus delivered exactly what he promised. No BS.'},{name:'Tasha M.',stars:4,text:'Good connections, tables were ready when we arrived.'}]},
  // ----------------------------------------------- New York ----------------------------------------------
  {id:8,name:'Kai Montrose',handle:'@kaimontrose',avatar:'K',city:'New York . Meatpacking',region:'New York',rating:4.9,reviews:388,bookings:2900,followers:'31k',bio:'NYC #1 Meatpacking promoter. 10 years, zero bad nights.',verified:true,
   specialties:['Nightclub','VIP Tables','Celebrity Events'],venues:['Marquee NY','1 OAK','Catch Rooftop'],
   deals:[{id:1,label:'Skip the line + free first round',code:'KAINYC',expiry:_exp14},{id:2,label:'$100 off VIP tables Fri/Sat',code:'KAI100',expiry:_exp21}],
   events:[{id:1,venue:'Marquee NY',date:'Sat Mar 8',spots:4,img:'https://picsum.photos/id/444/400/264'},{id:2,venue:'1 OAK',date:'Fri Mar 14',spots:8,img:'https://picsum.photos/id/392/400/264'}],
   feedbacks:[{name:'Nicole T.',stars:5,text:'Kai is the real deal in NYC. Zero wait, amazing table.'},{name:'Brandon S.',stars:5,text:'Been using Kai for 3 years. Never disappointed once.'}]},
  {id:9,name:'Anya Volkov',handle:'@anyavolkov',avatar:'A',city:'New York . Lower East Side',region:'New York',rating:4.8,reviews:267,bookings:1760,followers:'14.2k',bio:'LES underground queen. Techno, house, the real NYC nightlife.',verified:true,
   specialties:['Techno','House','Underground'],venues:['Good Room','Elsewhere','Output'],
   deals:[{id:1,label:'Guest list + 1 - Fri/Sat',code:'ANYAGL',expiry:_exp14}],
   events:[{id:1,venue:'Good Room',date:'Sat Mar 8',spots:15,img:'https://picsum.photos/id/1039/400/264'}],
   feedbacks:[{name:'Felix H.',stars:5,text:'Anya literally knows every DJ in the city. Magic nights.'},{name:'Sam P.',stars:5,text:'She got us into a sold-out show.'}]},
  {id:10,name:'Tyler Banks',handle:'@tylerbanks',avatar:'T',city:'New York . Midtown',region:'New York',rating:4.7,reviews:198,bookings:1340,followers:'10.5k',bio:'Midtown & rooftop specialist. Corporate events, bachelor parties, groups.',verified:true,
   specialties:['Rooftop','Corporate','Groups'],venues:['Skylark','230 Fifth','The Press Lounge'],
   deals:[{id:1,label:'Group of 8+ - priority seating',code:'TBANKS8',expiry:_exp30},{id:2,label:'Complimentary welcome bottle',code:'TBWELCOME',expiry:_exp14}],
   events:[{id:1,venue:'Skylark',date:'Fri Mar 7',spots:10,img:'https://picsum.photos/id/316/400/264'}],
   feedbacks:[{name:'Rachel K.',stars:5,text:'Tyler organized our bachelorette perfectly. 10/10.'},{name:'David L.',stars:4,text:'Great rooftop access, handled everything professionally.'}]},
  {id:11,name:'Priya Sharma',handle:'@priyasharma',avatar:'P',city:'New York . Brooklyn',region:'New York',rating:4.8,reviews:156,bookings:890,followers:'6.8k',bio:'Brooklyn-based. Afrobeats, Amapiano, Dancehall. Authentic culture first.',verified:false,
   specialties:['Afrobeats','Amapiano','Dancehall'],venues:['Avant Gardner','Nowadays','Schimanski'],
   deals:[{id:1,label:'Free entry before 11PM',code:'PRIYAEARLY',expiry:_exp14}],
   events:[{id:1,venue:'Avant Gardner',date:'Sat Mar 15',spots:18,img:'https://picsum.photos/id/26/400/264'}],
   feedbacks:[{name:'Zoe A.',stars:5,text:'Priya brought the whole Brooklyn scene together. Incredible.'},{name:'Mark B.',stars:4,text:'Loved the music curation, very authentic vibe.'}]},
  {id:12,name:'Dex Harlow',handle:'@dexharlow',avatar:'H',city:'New York . Chelsea',region:'New York',rating:4.9,reviews:421,bookings:3200,followers:'28k',bio:'15 years in NYC nightlife. Connected everywhere. Results guaranteed.',verified:true,
   specialties:['Hip-Hop','R&B','Celebrity Nights'],venues:['1 OAK','PhD Rooftop','Tao Downtown'],
   deals:[{id:1,label:'VIP wristband + no cover',code:'DEXVIP',expiry:_exp7},{id:2,label:'Table for 4 - $200 off minimum',code:'DEX200',expiry:_exp14}],
   events:[{id:1,venue:'1 OAK',date:'Fri Mar 7',spots:3,img:'https://picsum.photos/id/371/400/264'},{id:2,venue:'Tao Downtown',date:'Sat Mar 8',spots:5,img:'https://picsum.photos/id/429/400/264'}],
   feedbacks:[{name:'Jasmine W.',stars:5,text:'Dex is a legend. Been using him for 5 years straight.'},{name:'Chris M.',stars:5,text:'Got into a sold-out R&B night. VIP treatment start to finish.'}]},
  {id:13,name:'Luna Park',handle:'@lunapark',avatar:'L',city:'New York . SoHo',region:'New York',rating:4.6,reviews:112,bookings:670,followers:'5.9k',bio:'SoHo art crowd, fashion week events, editorial nightlife curation.',verified:false,
   specialties:['Fashion','Art Crowd','Editorial Events'],venues:['Electric Room','Le Bain','Boom Boom Room'],
   deals:[{id:1,label:'Fashion week special - 20% off tables',code:'LUNAFW',expiry:_exp14}],
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
            <div className="hscroll" style={{display:"flex",gap:10,overflowX:"auto",scrollbarWidth:"none",marginLeft:-18,paddingLeft:18,marginRight:-18,paddingRight:18,paddingBottom:4}}>
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
    const ok=await copyToClipboard(`lumarsv.com/p/${promoter.handle}`);
    if(ok){setCopied(true);setTimeout(()=>setCopied(false),2000);}
    else{setCopyErr(true);setTimeout(()=>setCopyErr(false),2500);}
  };

  // ----------------------------------------------- Social Export Modal ----------------------------------
  const profileUrl=`lumarsv.com/p/${promoter.handle}`;
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
              const txt=plat?plat.text:"Book VIP with me -> lumarsv.com/"+promoter.handle;
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
          {lbl:"Short",txt:"Book through my Luma link -> lumarsv.com/"+promoter.handle+" 🔥"},
          {lbl:"Story",txt:"VIP access, no wait. Book through my profile 🔗 lumarsv.com/"+promoter.handle},
          {lbl:"Bio",txt:"📍 "+promoter.city.split(".")[0].trim()+" | Book VIP tables -> lumarsv.com/"+promoter.handle},
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
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",minHeight:0,overflow:"hidden",animation:"slideUp .35s cubic-bezier(.16,1,.3,1) both"}}>
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
  // Track link click on mount
  useEffect(()=>{
    trackLinkClick(event?.linkId||null, promoter?.id||null);
  },[]);
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg)",minHeight:0,overflow:"hidden",animation:"scaleIn .28s cubic-bezier(.16,1,.3,1) both"}}>
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
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden",animation:"slideUp .38s cubic-bezier(.16,1,.3,1) both"}}>
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
      <div className="scroll" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
        padding:"60px 32px 0",textAlign:"center",overflowY:"auto"}} key={step}>
        <div style={{flexShrink:0,fontSize:72,marginBottom:28,animation:"popIn .5s cubic-bezier(.34,1.56,.64,1) both"}}>{s.emoji}</div>
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
          {isLast?"Let's go →":"Continue"}
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
          ["How do I contact support?","Email us at support@lumarsv.com or DM @luma.rsv on Instagram. We typically respond within a few hours."],
        ].map(([q,a],i)=>(
          <div key={i} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:14,
            padding:"14px 16px",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)",marginBottom:6}}>{q}</div>
            <div style={{fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",lineHeight:1.6}}>{a}</div>
          </div>
        ))}
        <div style={{marginTop:14,textAlign:"center"}}>
          <div style={{fontSize:11,color:"var(--dim)",fontFamily:"var(--fb)",marginBottom:6}}>Need more help?</div>
          <div onClick={async()=>{await copyToClipboard("support@lumarsv.com");}}
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

      {/* Referral Rewards */}
      <div style={{margin:"14px 18px 0"}}>
        <ReferralSection userEmail={userEmail}/>
      </div>

      {/* Account actions */}
      <div style={{margin:"14px 18px 0"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--sub)",letterSpacing:".08em",
          textTransform:"uppercase",fontFamily:"var(--fb)",marginBottom:10}}>Account</div>
        <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,overflow:"hidden"}}>
          {[
            ["Become a promoter →","Switch to promoter dashboard",()=>onSwitchMode("promoter"),false],
            ["Invite a friend","Share Luma with friends",async()=>{
              const text="Book VIP tables in Miami & NYC in 60 seconds 🔥 https://lumarsv.com";
              if(navigator.share){try{await navigator.share({title:"Luma",text,url:"https://lumarsv.com"});return;}catch(e){}}
              const ok=await copyToClipboard(text);
              if(ok){alert("Link copied to clipboard!");}
              else{try{window.prompt("Copy this link:",text);}catch(e){}}
            },false],
            ["Help & support","FAQs and contact",()=>{
              setHelpOpen&&setHelpOpen(true);
            },false],
            ["Delete my account","Permanently delete all data",()=>{
              if(confirm("Are you sure? This permanently deletes your account, bookings, and all data. This cannot be undone.")){
                const sess=getSession();
                if(sess?.access_token){
                  fetch(SUPA_URL+"/rest/v1/rpc/delete_user_account",{
                    method:"POST",headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token,"Content-Type":"application/json"},
                    body:JSON.stringify({target_user_id:sess.user.id})
                  }).then(()=>{onSignOut&&onSignOut();}).catch(()=>alert("Something went wrong. Try again."));
                }
              }
            },true],
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
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",background:"var(--bg)",width:"100%",boxSizing:"border-box",overflow:"hidden",position:"relative"}}>
      {/* Subtle gold accent line at top */}
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:"40%",height:2,background:"linear-gradient(90deg, transparent, #c9a84c, transparent)",opacity:0.5}}/>
      {/* Content */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
        <div style={{width:44,height:44,background:"#c9a84c",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
          <span style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:700,fontStyle:"italic",color:"#0a0a0a"}}>L</span>
        </div>
        <div style={{fontFamily:"var(--fd)",fontSize:44,fontWeight:700,fontStyle:"italic",letterSpacing:"-.02em",marginBottom:6,color:"var(--ink)"}}>Luma</div>
        <div style={{fontSize:9,color:"#c9a84c",fontFamily:"var(--fb)",letterSpacing:3,fontWeight:600,marginBottom:6,textTransform:"uppercase"}}>Miami &middot; New York</div>
        <div style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:6,textAlign:"center"}}>Your night starts here</div>
        <div style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--fb)",marginBottom:36,textAlign:"center",opacity:0.6}}>Book VIP tables in 60 seconds</div>
        <div style={{width:"100%",maxWidth:240,display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>setView("signin")} className="press" style={{padding:"13px",background:"var(--ink)",color:"white",border:"none",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Sign In</button>
          <button onClick={()=>setView("signup")} className="press" style={{padding:"13px",background:"var(--white)",color:"var(--ink)",border:"1.5px solid var(--line2)",borderRadius:13,fontSize:13,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Create Account</button>
          <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginTop:6}}>
            <div style={{height:0.5,width:36,background:"var(--line2)"}}/>
            <span style={{fontSize:9,color:"var(--dim)"}}>or</span>
            <div style={{height:0.5,width:36,background:"var(--line2)"}}/>
          </div>
          <button onClick={()=>onAuth(null)} className="press" style={{padding:"8px",background:"transparent",border:"none",color:"#c9a84c",borderRadius:13,fontSize:10,fontFamily:"var(--fb)",fontWeight:600,cursor:"pointer"}}>Continue as guest &rarr;</button>
        </div>
      </div>
      <div style={{position:"absolute",bottom:12,fontSize:9,color:"var(--dim)",fontFamily:"var(--fb)",opacity:0.4}}>lumarsv.com</div>
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

// ----------------------------------------------- Venue Admin -----------------------------------------------
// ----------------------------------------------- Review System ---------------------------------------------
function ReviewModal({venue,onClose,onSubmit}){
  const [rating,setRating]=useState(0);
  const [text,setText]=useState("");
  const [tags,setTags]=useState([]);
  const [submitting,setSubmitting]=useState(false);
  const [done,setDone]=useState(false);
  const vibeOptions=["🔥 Electric","🍾 Upscale","🎵 Great Music","👥 Great Crowd","📸 Instagrammable","🍸 Strong Drinks","💃 Dance Floor","🪩 Vibe","😎 Chill","⚡ High Energy"];
  
  const submit=async()=>{
    if(!rating)return;
    setSubmitting(true);
    try{
      const sess=getSession();
      if(sess?.access_token){
        await fetch(SUPA_URL+"/rest/v1/reviews",{
          method:"POST",
          headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token,"Content-Type":"application/json","Prefer":"return=minimal"},
          body:JSON.stringify({user_id:sess.user.id,venue_id:venue.id,rating,text:sanitize(text,300),vibe_tags:tags})
        });
      }
    }catch(e){}
    setSubmitting(false);
    setDone(true);
    setTimeout(()=>{if(onSubmit)onSubmit();if(onClose)onClose();},1500);
  };
  
  return(
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}>
      <div style={{width:"100%",maxWidth:380,background:"var(--bg)",borderRadius:"20px 20px 0 0",padding:"20px 22px 32px",animation:"slideUp .3s cubic-bezier(.16,1,.3,1)"}}>
        {done?(
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>🎉</div>
            <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"var(--ink)"}}>Thanks for your review!</div>
          </div>
        ):(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"var(--ink)"}}>Rate {venue.name}</div>
              <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"var(--dim)",cursor:"pointer"}}>✕</button>
            </div>
            {/* Stars */}
            <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>setRating(s)} style={{background:"none",border:"none",fontSize:32,cursor:"pointer",opacity:s<=rating?1:.25,transition:"all .15s",transform:s<=rating?"scale(1.1)":"scale(1)"}}>★</button>
              ))}
            </div>
            <div style={{textAlign:"center",fontSize:12,color:"var(--sub)",fontFamily:"var(--fb)",marginBottom:16}}>{["","Not great","It was okay","Good night","Amazing","Unforgettable"][rating]}</div>
            {/* Vibe tags */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14,justifyContent:"center"}}>
              {vibeOptions.map(v=>{
                const on=tags.includes(v);
                return <button key={v} onClick={()=>setTags(t=>on?t.filter(x=>x!==v):[...t,v].slice(0,4))} className="press" style={{padding:"5px 11px",borderRadius:18,fontSize:10,fontWeight:600,fontFamily:"var(--fb)",border:"1.5px solid",cursor:"pointer",background:on?"var(--ink)":"var(--white)",borderColor:on?"var(--ink)":"var(--line2)",color:on?"white":"var(--sub)"}}>{v}</button>;
              })}
            </div>
            {/* Text */}
            <textarea value={text} onChange={e=>setText(e.target.value.slice(0,300))} placeholder="Tell us about your night (optional)" rows={3} style={{width:"100%",padding:"10px 14px",background:"var(--white)",border:"1.5px solid var(--line2)",borderRadius:12,color:"var(--ink)",fontSize:12,fontFamily:"var(--fb)",outline:"none",resize:"none",marginBottom:14}}/>
            <button onClick={submit} disabled={!rating||submitting} className="press" style={{width:"100%",padding:"14px",background:rating?"var(--ink)":"var(--line2)",color:rating?"white":"var(--dim)",border:"none",borderRadius:14,fontSize:14,fontWeight:700,fontFamily:"var(--fb)",cursor:rating?"pointer":"default"}}>{submitting?"Submitting...":"Submit Review"}</button>
          </>
        )}
      </div>
    </div>
  );
}

function VenueReviews({venueId}){
  const [reviews,setReviews]=useState([]);
  useEffect(()=>{
    fetch(SUPA_URL+"/rest/v1/reviews?venue_id=eq."+venueId+"&order=created_at.desc&limit=5&select=*,profiles(name)",{
      headers:{"apikey":SUPA_ANON}
    }).then(r=>r.json()).then(d=>{if(Array.isArray(d))setReviews(d);}).catch(()=>{});
  },[venueId]);
  if(!reviews.length) return null;
  return(
    <div style={{marginTop:16}}>
      <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--ink)",marginBottom:10}}>Recent Reviews</div>
      {reviews.map(r=>(
        <div key={r.id} style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:13,padding:"12px 14px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:"var(--ink)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>{(r.profiles?.name||"G")[0]}</div>
              <span style={{fontSize:11,fontWeight:600,color:"var(--ink)",fontFamily:"var(--fb)"}}>{r.profiles?.name||"Guest"}</span>
            </div>
            <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:11,color:s<=r.rating?"var(--gold)":"var(--line2)"}}>★</span>)}</div>
          </div>
          {r.text&&<div style={{fontSize:11,color:"var(--sub)",fontFamily:"var(--fb)",lineHeight:1.6,marginBottom:6}}>{r.text}</div>}
          {r.vibe_tags?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{r.vibe_tags.map(t=><span key={t} style={{fontSize:9,background:"rgba(201,168,76,.08)",color:"var(--gold)",padding:"2px 8px",borderRadius:10,fontFamily:"var(--fb)"}}>{t}</span>)}</div>}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------- Referral Rewards -------------------------------------------
function ReferralSection({userEmail}){
  const [code,setCode]=useState("");
  const [stats,setStats]=useState({total:0,successful:0,credits:0});
  const [copied,setCopied]=useState(false);
  const [loading,setLoading]=useState(true);
  
  useEffect(()=>{
    const sess=getSession();
    if(!sess?.access_token){setLoading(false);return;}
    // Fetch referral code from profile
    fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+sess.user.id+"&select=referral_code,referral_credits",{
      headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token}
    }).then(r=>r.json()).then(d=>{
      if(d?.[0]){
        let c=d[0].referral_code;
        if(!c){
          c=(sess.user.id.slice(0,4)+sess.user.email?.slice(0,2)).toUpperCase();
          fetch(SUPA_URL+"/rest/v1/profiles?id=eq."+sess.user.id,{
            method:"PATCH",headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token,"Content-Type":"application/json"},
            body:JSON.stringify({referral_code:c})
          }).catch(()=>{});
        }
        setCode(c);
        setStats(s=>({...s,credits:d[0].referral_credits||0}));
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);
  
  const share=async()=>{
    const url="https://lumarsv.com?ref="+code;
    const text="Book VIP tables in Miami & NYC with Luma 🔥 Use my code "+code+" for $25 off → "+url;
    if(navigator.share){try{await navigator.share({title:"Luma",text,url});}catch(e){}}
    else{const ok=await copyToClipboard(text);if(ok){setCopied(true);setTimeout(()=>setCopied(false),2000);}}
  };
  
  if(loading) return null;
  return(
    <div style={{background:"var(--white)",border:"1px solid var(--line)",borderRadius:16,padding:"16px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:22}}>🎁</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--ink)",fontFamily:"var(--fb)"}}>Invite Friends, Get $25</div>
          <div style={{fontSize:10,color:"var(--sub)",fontFamily:"var(--fb)"}}>They get $25 off their first booking too</div>
        </div>
      </div>
      {/* Code display */}
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <div style={{flex:1,padding:"10px 14px",background:"#f5f4f0",border:"1.5px dashed var(--line2)",borderRadius:11,textAlign:"center"}}>
          <div style={{fontSize:8,color:"var(--dim)",fontFamily:"var(--fb)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:2}}>Your Code</div>
          <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"var(--ink)",letterSpacing:".08em"}}>{code||"..."}</div>
        </div>
        <button onClick={share} className="press" style={{padding:"10px 18px",background:"var(--ink)",color:"white",border:"none",borderRadius:11,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
          <span style={{fontSize:16}}>{copied?"✓":"📤"}</span>
          <span>{copied?"Copied":"Share"}</span>
        </button>
      </div>
      {/* Stats */}
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1,padding:"8px",background:"rgba(201,168,76,.06)",borderRadius:10,textAlign:"center"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--ink)"}}>{stats.successful}</div>
          <div style={{fontSize:9,color:"var(--sub)",fontFamily:"var(--fb)"}}>Friends joined</div>
        </div>
        <div style={{flex:1,padding:"8px",background:"rgba(201,168,76,.06)",borderRadius:10,textAlign:"center"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"var(--gold)"}}>${(stats.credits/100).toFixed(0)}</div>
          <div style={{fontSize:9,color:"var(--sub)",fontFamily:"var(--fb)"}}>Credits earned</div>
        </div>
      </div>
      <div style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--fb)",textAlign:"center",marginTop:8}}>You get $25, they get $25 off their first booking. No limit.</div>
    </div>
  );
}

// ----------------------------------------------- Notifications -----------------------------------------------
function NotificationBell({dark}){
  const [notifs,setNotifs]=useState([]);
  const [open,setOpen]=useState(false);
  const [unread,setUnread]=useState(0);
  
  useEffect(()=>{
    const sess=getSession();
    if(!sess?.access_token) return;
    fetch(SUPA_URL+"/rest/v1/notifications?user_id=eq."+sess.user.id+"&order=sent_at.desc&limit=20",{
      headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token}
    }).then(r=>r.json()).then(d=>{
      if(Array.isArray(d)){setNotifs(d);setUnread(d.filter(n=>!n.read).length);}
    }).catch(()=>{});
  },[]);
  
  const markRead=async()=>{
    const sess=getSession();
    if(!sess?.access_token||!unread) return;
    await fetch(SUPA_URL+"/rest/v1/notifications?user_id=eq."+sess.user.id+"&read=eq.false",{
      method:"PATCH",
      headers:{"apikey":SUPA_ANON,"Authorization":"Bearer "+sess.access_token,"Content-Type":"application/json"},
      body:JSON.stringify({read:true})
    }).catch(()=>{});
    setNotifs(n=>n.map(x=>({...x,read:true})));
    setUnread(0);
  };
  
  const typeIcons={booking_confirmed:"🎟",event_tonight:"🔥",new_event:"✨",promo_code:"🏷",referral_reward:"🎁"};
  
  return(
    <div style={{position:"relative"}}>
      <button onClick={()=>{setOpen(!open);if(!open)markRead();}} className="press" style={{width:32,height:32,borderRadius:"50%",background:dark?"rgba(255,255,255,.1)":"var(--white)",border:dark?"1px solid rgba(255,255,255,.15)":"1px solid var(--line2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <span style={{fontSize:14}}>🔔</span>
        {unread>0&&<div style={{position:"absolute",top:-2,right:-2,width:16,height:16,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"white",border:dark?"2px solid var(--pro)":"2px solid var(--bg)"}}>{unread}</div>}
      </button>
      {open&&(
        <div style={{position:"absolute",top:38,right:0,width:280,maxHeight:320,background:dark?"#1a1a2e":"var(--bg)",border:dark?"1px solid rgba(255,255,255,.1)":"1px solid var(--line)",borderRadius:16,boxShadow:"0 12px 40px rgba(0,0,0,.25)",overflow:"hidden",zIndex:100,animation:"fadeUp .2s cubic-bezier(.16,1,.3,1)"}}>
          <div style={{padding:"12px 14px 8px",borderBottom:dark?"1px solid rgba(255,255,255,.06)":"1px solid var(--line)"}}>
            <div style={{fontSize:13,fontWeight:700,color:dark?"white":"var(--ink)",fontFamily:"var(--fb)"}}>Notifications</div>
          </div>
          <div style={{maxHeight:260,overflowY:"auto"}}>
            {notifs.length===0?(
              <div style={{padding:"24px 14px",textAlign:"center",fontSize:11,color:dark?"rgba(255,255,255,.3)":"var(--dim)",fontFamily:"var(--fb)"}}>No notifications yet</div>
            ):notifs.map(n=>(
              <div key={n.id} style={{padding:"10px 14px",borderBottom:dark?"1px solid rgba(255,255,255,.04)":"1px solid var(--line)",opacity:n.read?.7:1}}>
                <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:16,flexShrink:0}}>{typeIcons[n.type]||"📱"}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:dark?"white":"var(--ink)",fontFamily:"var(--fb)"}}>{n.title}</div>
                    {n.body&&<div style={{fontSize:10,color:dark?"rgba(255,255,255,.4)":"var(--sub)",fontFamily:"var(--fb)",marginTop:2,lineHeight:1.4}}>{n.body}</div>}
                    <div style={{fontSize:9,color:dark?"rgba(255,255,255,.2)":"var(--dim)",fontFamily:"var(--fb)",marginTop:3}}>{new Date(n.sent_at).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------- Photo Gallery ---------------------------------------------
function PhotoGallery({venueId,fallbackImg}){
  const photos=useVenuePhotos(venueId);
  const [sel,setSel]=useState(0);
  const list=photos.length?photos:[{url:fallbackImg,caption:"Main"}];
  if(list.length<=1) return null;
  return(
    <div style={{marginBottom:14}}>
      <div className="hscroll" style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none",marginBottom:6}}>
        {list.map((p,i)=>(
          <div key={i} onClick={()=>setSel(i)} className="press" style={{flexShrink:0,width:70,height:70,borderRadius:12,overflow:"hidden",border:sel===i?"2px solid var(--gold)":"2px solid transparent",cursor:"pointer"}}>
            <Img src={p.url} style={{width:"100%",height:"100%"}} alt={p.caption||"Photo"} type="Photo" name={p.caption||""}/>
          </div>
        ))}
      </div>
      <div style={{fontSize:9,color:"var(--dim)",fontFamily:"var(--fb)",textAlign:"center"}}>{list[sel]?.caption||""} · {sel+1}/{list.length}</div>
    </div>
  );
}

// ----------------------------------------------- Revenue Dashboard -----------------------------------------
function RevenueDashboard({goBack}){
  const months=["Jan","Feb","Mar","Apr","May","Jun"];
  const data=[0,450,1200,2800,3400,4100];
  const max=Math.max(...data,1);
  const total=data.reduce((a,b)=>a+b,0);
  const growth=data[5]>data[4]?Math.round((data[5]-data[4])/Math.max(data[4],1)*100):0;
  const avgPerBooking=Math.round(total/Math.max(data.filter(v=>v>0).length*8,1));
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden"}}>
      <div style={{padding:"10px 18px 8px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button className="press" onClick={goBack} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"white",flex:1}}>Revenue</span>
      </div>
      <div className="scroll" style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
        <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)",marginBottom:16}}>Your earnings from promoter commissions (15% per booking)</div>
        {/* Chart */}
        <ProCard style={{padding:"16px",marginBottom:14}}>
          <div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)",marginBottom:10}}>Monthly Commission Revenue</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140}}>
            {data.map((v,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:9,color:"var(--gold)",fontFamily:"var(--fd)",fontWeight:700}}>${v}</div>
                <div style={{width:"100%",background:"var(--gold)",borderRadius:6,height:Math.max(4,v/max*100),transition:"height .3s",opacity:i===data.length-1?1:.5}}/>
                <div style={{fontSize:8,color:P.sub,fontFamily:"var(--fb)"}}>{months[i]}</div>
              </div>
            ))}
          </div>
        </ProCard>
        {/* Key metrics */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[["$"+data[data.length-1],"This Month","💰","Your earnings for "+months[data.length-1]],["$"+total,"All Time","📈","Total since you started"],[""+growth+"%","Growth","🚀","vs last month"],[avgPerBooking>0?"$"+avgPerBooking:"—","Avg/Booking","🎯","Your average commission"]].map(([v,l,ic,detail])=>(
            <ProCard key={l} style={{padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:4}}>{ic}</div>
              <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white"}}>{v}</div>
              <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginTop:2}}>{l}</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,.2)",fontFamily:"var(--fb)",marginTop:3}}>{detail}</div>
            </ProCard>
          ))}
        </div>
        {/* Breakdown */}
        <ProCard style={{padding:"14px",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:10}}>How It Works</div>
          {[["Guest books through your link","Booking total: e.g. $500"],["Platform takes 10% fee","Platform fee: $50"],["You earn 15% commission","Your cut: $75"],["Payout hits your Stripe","Same-day transfer"]].map(([step,detail],i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(201,168,76,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"var(--gold)",flexShrink:0}}>{i+1}</div>
              <div><div style={{fontSize:11,color:"white",fontFamily:"var(--fb)",fontWeight:600}}>{step}</div><div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{detail}</div></div>
            </div>
          ))}
        </ProCard>
        {/* Export */}
        <button className="press" onClick={()=>{exportCSV(data.map((v,i)=>({month:months[i],revenue:v,cumulative:data.slice(0,i+1).reduce((a,b)=>a+b,0)})),"luma-revenue.csv");}} style={{width:"100%",padding:"11px",background:"rgba(255,255,255,.05)",border:"1.5px solid rgba(255,255,255,.1)",borderRadius:13,fontSize:12,fontFamily:"var(--fb)",fontWeight:600,color:"rgba(255,255,255,.4)",cursor:"pointer",marginBottom:40}}>📥 Export Revenue CSV</button>
      </div>
    </div>
  );
}

// ----------------------------------------------- Promoter Leaderboard --------------------------------------
function ProLeaderboard({goBack}){
  const [selPromo,setSelPromo]=useState(null);
  const leaders=[
    {rank:1,name:"Jordan V.",city:"Miami",bookings:47,earned:"$8,400",av:"J",handle:"@jordan.vip",ig:"jordanvip_mia",tw:"jordanvmia",bio:"South Beach VIP specialist. 3 years running Miami's best tables.",specialties:["Rooftop","Nightclub","Bottle Service"]},
    {rank:2,name:"Nate S.",city:"Miami",bookings:38,earned:"$6,200",av:"N",handle:"@nate.nights",ig:"natesamuels",tw:"natesamuels",bio:"Your connect to everything LIV, E11EVEN, Story.",specialties:["Nightclub","EDM","VIP"]},
    {rank:3,name:"Gabriella N.",city:"NYC",bookings:31,earned:"$5,100",av:"G",handle:"@gab.nyc",ig:"gabriella.nazz",tw:"gabnazz",bio:"NYC nightlife curator. Chelsea to Brooklyn.",specialties:["Lounge","Rooftop","Hip-Hop"]},
    {rank:4,name:"Alex T.",city:"Miami",bookings:24,earned:"$3,800",av:"A",handle:"@alex.tables",ig:"alextables",tw:null,bio:"Pool parties and day clubs.",specialties:["Pool Party","Day Party"]},
    {rank:5,name:"Priya D.",city:"NYC",bookings:19,earned:"$2,900",av:"P",handle:"@priya.d",ig:"priyadnyc",tw:"priyadnyc",bio:"Bringing the energy to NYC weekends.",specialties:["Nightclub","EDM"]},
    {rank:6,name:"Marcus W.",city:"Miami",bookings:15,earned:"$2,100",av:"M",handle:"@marcus.w",ig:"marcuswmia",tw:null,bio:"Wynwood and Brickell specialist.",specialties:["Lounge","Latin Nights"]},
    {rank:7,name:"Serena K.",city:"NYC",bookings:12,earned:"$1,800",av:"S",handle:"@serena.k",ig:"serenaknyc",tw:null,bio:"Exclusive access to Manhattan's best.",specialties:["Rooftop","VIP"]},
    {rank:8,name:"Dexter L.",city:"Miami",bookings:8,earned:"$1,200",av:"D",handle:"@dex.nights",ig:"dexnights",tw:null,bio:"New to the game, rising fast.",specialties:["Nightclub"]},
  ];
  const medals=["🥇","🥈","🥉"];
  
  if(selPromo) return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden"}}>
      <div style={{padding:"10px 18px 8px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button className="press" onClick={()=>setSelPromo(null)} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white"}}>{selPromo.name}</span>
      </div>
      <div className="scroll" style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:selPromo.rank<=3?"var(--gold)":"rgba(255,255,255,.1)",border:selPromo.rank<=3?"3px solid var(--gold)":"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,color:selPromo.rank<=3?"#0a0a0a":"white",margin:"0 auto 10px",fontFamily:"var(--fd)"}}>{selPromo.av}</div>
          <div style={{fontSize:18,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{selPromo.name}</div>
          <div style={{fontSize:12,color:"var(--gold)",fontFamily:"var(--fb)",marginTop:2}}>{selPromo.handle} · {selPromo.rank<=3?medals[selPromo.rank-1]:""} #{selPromo.rank}</div>
          <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)",marginTop:6,lineHeight:1.5}}>{selPromo.bio}</div>
        </div>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[[selPromo.bookings,"Bookings","🎟"],[selPromo.earned,"Earned","💰"],[selPromo.city,"City","📍"],["⭐ Top "+selPromo.rank,"Rank","🏆"]].map(([v,l,ic])=>(
            <ProCard key={l} style={{padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:14,marginBottom:3}}>{ic}</div>
              <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,color:"white"}}>{v}</div>
              <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l}</div>
            </ProCard>
          ))}
        </div>
        {/* Specialties */}
        <ProCard style={{padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:10,color:P.sub,fontWeight:600,fontFamily:"var(--fb)",marginBottom:8}}>SPECIALTIES</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {selPromo.specialties.map(s=><span key={s} style={{padding:"4px 12px",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",borderRadius:14,fontSize:10,fontWeight:600,color:"var(--gold)",fontFamily:"var(--fb)"}}>{s}</span>)}
          </div>
        </ProCard>
        {/* Socials */}
        <ProCard style={{padding:"12px 14px",marginBottom:40}}>
          <div style={{fontSize:10,color:P.sub,fontWeight:600,fontFamily:"var(--fb)",marginBottom:8}}>SOCIALS</div>
          {selPromo.ig&&<div onClick={()=>window.open("https://instagram.com/"+selPromo.ig,"_blank")} className="press" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.05)",cursor:"pointer"}}>
            <span style={{fontSize:16}}>📸</span>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"white",fontFamily:"var(--fb)"}}>Instagram</div><div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)"}}>@{selPromo.ig}</div></div>
            <span style={{fontSize:11,color:"rgba(255,255,255,.2)"}}>↗</span>
          </div>}
          {selPromo.tw&&<div onClick={()=>window.open("https://x.com/"+selPromo.tw,"_blank")} className="press" style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",cursor:"pointer"}}>
            <span style={{fontSize:16}}>𝕏</span>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"white",fontFamily:"var(--fb)"}}>X / Twitter</div><div style={{fontSize:10,color:P.sub,fontFamily:"var(--fb)"}}>@{selPromo.tw}</div></div>
            <span style={{fontSize:11,color:"rgba(255,255,255,.2)"}}>↗</span>
          </div>}
        </ProCard>
      </div>
    </div>
  );
  
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden"}}>
      <div style={{padding:"10px 18px 8px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button className="press" onClick={goBack} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"white",flex:1}}>Leaderboard</span>
      </div>
      <div className="scroll" style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
        <div style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)",marginBottom:16}}>Top promoters this month</div>
        {/* Top 3 podium */}
        <div style={{display:"flex",gap:8,marginBottom:16,justifyContent:"center",alignItems:"flex-end"}}>
          {[leaders[1],leaders[0],leaders[2]].map((l,i)=>{
            const heights=[90,120,70];
            const isCenter=i===1;
            return(
              <div key={l.rank} style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:isCenter?36:24,marginBottom:4}}>{medals[l.rank-1]}</div>
                <div style={{width:isCenter?52:42,height:isCenter?52:42,borderRadius:"50%",background:isCenter?"var(--gold)":"rgba(255,255,255,.1)",border:isCenter?"3px solid var(--gold)":"2px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:isCenter?18:14,fontWeight:700,color:isCenter?"#0a0a0a":"white",margin:"0 auto 6px",fontFamily:"var(--fd)"}}>{l.av}</div>
                <div style={{fontSize:11,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{l.name}</div>
                <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l.earned}</div>
              </div>
            );
          })}
        </div>
        {/* Full list */}
        {leaders.map(l=>(
          <ProCard key={l.rank} onClick={()=>setSelPromo(l)} style={{padding:"10px 13px",marginBottom:6,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:24,fontSize:13,fontWeight:700,color:l.rank<=3?"var(--gold)":"rgba(255,255,255,.3)",fontFamily:"var(--fd)",textAlign:"center"}}>{l.rank<=3?medals[l.rank-1]:"#"+l.rank}</div>
              <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fd)"}}>{l.av}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:"white",fontFamily:"var(--fb)"}}>{l.name}</div>
                <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{l.city} · {l.bookings} bookings</div>
              </div>
              <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--gold)"}}>{l.earned}</div>
            </div>
          </ProCard>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------- Analytics Dashboard (Real Data) ---------------------------
function AnalyticsDashboard({goBack}){

  const [data,setData]=useState({bookings:[],waitlist:[],venues:[]});
  const [loading,setLoading]=useState(true);
  const [range,setRange]=useState("30d");

  useEffect(()=>{
    const sess=getSession();
    const headers={"apikey":SUPA_ANON};
    if(sess?.access_token) headers["Authorization"]="Bearer "+sess.access_token;
    Promise.all([
      fetch(SUPA_URL+"/rest/v1/booking_analytics?order=day.desc&limit=30",{headers}).then(r=>r.json()).catch(()=>[]),
      fetch(SUPA_URL+"/rest/v1/waitlist_analytics?order=day.desc&limit=30",{headers}).then(r=>r.json()).catch(()=>[]),
      fetch(SUPA_URL+"/rest/v1/venue_performance?order=total_bookings.desc&limit=10",{headers}).then(r=>r.json()).catch(()=>[]),
    ]).then(([b,w,v])=>{
      setData({bookings:Array.isArray(b)?b:[],waitlist:Array.isArray(w)?w:[],venues:Array.isArray(v)?v:[]});
    }).finally(()=>setLoading(false));
  },[]);

  const totalBookings=data.bookings.reduce((s,d)=>s+(d.total_bookings||0),0);
  const totalRevenue=data.bookings.reduce((s,d)=>s+(d.revenue||0),0);
  const totalGuests=data.bookings.reduce((s,d)=>s+(d.unique_guests||0),0);
  const totalWaitlist=data.waitlist.reduce((s,d)=>s+(d.signups||0),0);
  const totalReferred=data.waitlist.reduce((s,d)=>s+(d.referred||0),0);
  const avgBooking=totalBookings>0?Math.round(totalRevenue/totalBookings):0;
  const platformFees=data.bookings.reduce((s,d)=>s+(d.platform_fees||0),0);

  // Waitlist chart data (last 14 days)
  const wlChart=data.waitlist.slice(0,14).reverse();
  const wlMax=Math.max(...wlChart.map(d=>d.signups||0),1);

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden"}}>
      <div style={{padding:"10px 18px 8px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button className="press" onClick={goBack} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"white",flex:1}}>Analytics</span>
        <button className="press" onClick={()=>exportCSV([
          {metric:"Total Bookings",value:totalBookings},
          {metric:"Revenue (cents)",value:totalRevenue},
          {metric:"Platform Fees (cents)",value:platformFees},
          {metric:"Unique Guests",value:totalGuests},
          {metric:"Avg Booking (cents)",value:avgBooking},
          {metric:"Waitlist Signups",value:totalWaitlist},
          {metric:"Referred Signups",value:totalReferred},
        ],"luma-analytics.csv")} style={{padding:"6px 12px",background:"rgba(255,255,255,.07)",border:"none",borderRadius:9,fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"var(--fb)",cursor:"pointer"}}>📥 Export</button>
      </div>
      <div className="scroll" style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
        {loading?<div style={{color:"rgba(255,255,255,.3)",fontFamily:"var(--fb)",fontSize:12,padding:40,textAlign:"center"}}>Loading analytics...</div>:(
          <>
            {/* Key metrics */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[
                [totalBookings,"Bookings","🎟","Total confirmed bookings"],
                ["$"+(totalRevenue/100).toFixed(0),"Revenue","💰","Gross booking revenue"],
                [totalGuests,"Guests","👥","Unique guests who booked"],
                ["$"+(avgBooking/100).toFixed(0),"Avg Booking","🎯","Average booking value"],
                [totalWaitlist,"Waitlist","📋","Total waitlist signups"],
                [totalReferred,"Referred","🎁","Signups from referrals"],
              ].map(([v,l,ic,detail])=>(
                <ProCard key={l} style={{padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:14,marginBottom:3}}>{ic}</div>
                  <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700,color:"white"}}>{v}</div>
                  <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginTop:2}}>{l}</div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,.18)",fontFamily:"var(--fb)",marginTop:2}}>{detail}</div>
                </ProCard>
              ))}
            </div>

            {/* Waitlist growth chart */}
            {wlChart.length>0&&(
              <ProCard style={{padding:"16px",marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:4}}>Waitlist Growth</div>
                <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)",marginBottom:12}}>Daily signups — last {wlChart.length} days</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80}}>
                  {wlChart.map((d,i)=>(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                      <div style={{fontSize:7,color:"var(--gold)",fontFamily:"var(--fb)"}}>{d.signups||0}</div>
                      <div style={{width:"100%",background:"var(--gold)",borderRadius:3,height:Math.max(2,(d.signups||0)/wlMax*60),opacity:i===wlChart.length-1?1:.4}}/>
                    </div>
                  ))}
                </div>
              </ProCard>
            )}

            {/* City split */}
            {totalWaitlist>0&&(
              <ProCard style={{padding:"14px",marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:10}}>City Breakdown</div>
                {[["Miami",data.waitlist.reduce((s,d)=>s+(d.miami||0),0),"🌴"],["New York",data.waitlist.reduce((s,d)=>s+(d.nyc||0),0),"🗽"]].map(([city,count,ic])=>{
                  const pct=totalWaitlist>0?Math.round(count/totalWaitlist*100):0;
                  return(
                    <div key={city} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"white",fontFamily:"var(--fb)"}}>{ic} {city}</span>
                        <span style={{fontSize:11,color:P.sub,fontFamily:"var(--fb)"}}>{count} ({pct}%)</span>
                      </div>
                      <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:pct+"%",background:"var(--gold)",borderRadius:3,transition:"width .4s"}}/>
                      </div>
                    </div>
                  );
                })}
              </ProCard>
            )}

            {/* Top venues */}
            {data.venues.length>0&&(
              <ProCard style={{padding:"14px",marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:10}}>Top Venues by Bookings</div>
                {data.venues.slice(0,5).map((v,i)=>(
                  <div key={v.venue_id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:20,fontSize:11,fontWeight:700,color:i<3?"var(--gold)":"rgba(255,255,255,.3)",fontFamily:"var(--fd)",textAlign:"center"}}>#{i+1}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:600,color:"white",fontFamily:"var(--fb)"}}>{v.name}</div>
                      <div style={{fontSize:9,color:P.sub,fontFamily:"var(--fb)"}}>{v.metro} · {v.total_bookings} bookings · ${(v.total_revenue/100).toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </ProCard>
            )}

            {/* No data state */}
            {totalBookings===0&&totalWaitlist===0&&(
              <div style={{textAlign:"center",padding:"30px 20px"}}>
                <div style={{fontSize:36,marginBottom:12}}>📊</div>
                <div style={{fontSize:14,fontWeight:700,color:"white",fontFamily:"var(--fb)",marginBottom:6}}>No data yet</div>
                <div style={{fontSize:12,color:P.sub,fontFamily:"var(--fb)",lineHeight:1.6}}>Analytics will populate as waitlist signups and bookings come in. Share lumarsv.com to start growing.</div>
              </div>
            )}
            <div style={{height:40}}/>
          </>
        )}
      </div>
    </div>
  );
}

function VenueAdmin({goBack}){
  const [tab,setAdminTab]=useState("venues"); // venues or events
  const [venues,setVenues]=useState([]);
  const [events,setEvts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",metro:"Miami",type:"Nightclub",city:"",address:"",price_min:100,rating:4.5,about:"",active:true});
  const [evtForm,setEvtForm]=useState({name:"",venue_id:"",event_date:"",doors_time:"10:00 PM",dj:"",theme:"",description:"",tags:[],featured:false});
  const [showAddEvt,setShowAddEvt]=useState(false);
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState("");

  useEffect(()=>{
    fetch(SUPA_URL+"/rest/v1/venues?order=metro,name&select=id,name,metro,type,city,price_min,rating,active",{
      headers:{"apikey":SUPA_ANON}
    }).then(r=>r.json()).then(d=>{if(Array.isArray(d))setVenues(d);}).catch(()=>{}).finally(()=>setLoading(false));
    fetch(SUPA_URL+"/rest/v1/events?order=event_date.desc&limit=20&select=*",{
      headers:{"apikey":SUPA_ANON}
    }).then(r=>r.json()).then(d=>{if(Array.isArray(d))setEvts(d);}).catch(()=>{});
  },[]);

  const saveEvent=async()=>{
    if(!evtForm.name||!evtForm.venue_id||!evtForm.event_date){setMsg("Name, venue, and date required");return;}
    setSaving(true);setMsg("");
    const sess=getSession();
    const headers={"apikey":SUPA_ANON,"Content-Type":"application/json","Prefer":"return=representation"};
    if(sess?.access_token) headers["Authorization"]="Bearer "+sess.access_token;
    try{
      const body={...evtForm,venue_id:parseInt(evtForm.venue_id),active:true};
      const r=await fetch(SUPA_URL+"/rest/v1/events",{method:"POST",headers,body:JSON.stringify(body)});
      const d=await r.json();
      if(Array.isArray(d)&&d[0]){setEvts(prev=>[d[0],...prev]);setShowAddEvt(false);setEvtForm({name:"",venue_id:"",event_date:"",doors_time:"10:00 PM",dj:"",theme:"",description:"",tags:[],featured:false});setMsg("✓ Event created");}
      else setMsg("Error creating event");
    }catch(e){setMsg("Error: "+e.message);}
    setSaving(false);
  };

  const saveVenue=async(v)=>{
    setSaving(true); setMsg("");
    const sess=getSession();
    const headers={"apikey":SUPA_ANON,"Content-Type":"application/json","Prefer":"return=representation"};
    if(sess?.access_token) headers["Authorization"]="Bearer "+sess.access_token;
    try{
      const isNew=!v.id;
      const url=SUPA_URL+"/rest/v1/venues"+(isNew?"":"?id=eq."+v.id);
      const r=await fetch(url,{method:isNew?"POST":"PATCH",headers,body:JSON.stringify(v)});
      const d=await r.json();
      if(Array.isArray(d)&&d[0]){
        if(isNew) setVenues(prev=>[...prev,d[0]]);
        else setVenues(prev=>prev.map(x=>x.id===d[0].id?d[0]:x));
        setMsg("✓ Saved"); setEditing(null); setShowAdd(false);
        setForm({name:"",metro:"Miami",type:"Nightclub",city:"",address:"",price_min:100,rating:4.5,about:"",active:true});
      } else setMsg("Error saving");
    }catch(e){setMsg("Error: "+e.message);}
    setSaving(false);
  };

  const toggleActive=async(v)=>{
    const sess=getSession();
    const headers={"apikey":SUPA_ANON,"Content-Type":"application/json","Prefer":"return=representation"};
    if(sess?.access_token) headers["Authorization"]="Bearer "+sess.access_token;
    await fetch(SUPA_URL+"/rest/v1/venues?id=eq."+v.id,{method:"PATCH",headers,body:JSON.stringify({active:!v.active})});
    setVenues(prev=>prev.map(x=>x.id===v.id?{...x,active:!x.active}:x));
  };

  const VenueForm=({data,onSave,onCancel})=>{
    const [f,setF]=useState(data);
    return(
      <div style={{padding:"14px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,marginBottom:10}}>
        <input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Venue name" style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",marginBottom:8,outline:"none"}}/>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          {["Miami","New York"].map(m=><button key={m} onClick={()=>setF({...f,metro:m})} style={{flex:1,padding:"7px",borderRadius:9,border:"1.5px solid",fontSize:11,fontWeight:600,fontFamily:"var(--fb)",cursor:"pointer",background:f.metro===m?"var(--gold)":"transparent",borderColor:f.metro===m?"var(--gold)":"rgba(255,255,255,.15)",color:f.metro===m?"#0a0a0a":"rgba(255,255,255,.5)"}}>{m}</button>)}
        </div>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          {["Nightclub","Rooftop","Lounge","Pool Party"].map(t=><button key={t} onClick={()=>setF({...f,type:t})} style={{padding:"5px 10px",borderRadius:9,border:"1.5px solid",fontSize:10,fontWeight:600,fontFamily:"var(--fb)",cursor:"pointer",background:f.type===t?"var(--gold)":"transparent",borderColor:f.type===t?"var(--gold)":"rgba(255,255,255,.15)",color:f.type===t?"#0a0a0a":"rgba(255,255,255,.5)"}}>{t}</button>)}
        </div>
        <input value={f.city} onChange={e=>setF({...f,city:e.target.value})} placeholder="Neighborhood (e.g. South Beach)" style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",marginBottom:8,outline:"none"}}/>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <input type="number" value={f.price_min} onChange={e=>setF({...f,price_min:parseInt(e.target.value)||0})} placeholder="Min price $" style={{flex:1,padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
          <input type="number" step="0.1" value={f.rating} onChange={e=>setF({...f,rating:parseFloat(e.target.value)||0})} placeholder="Rating" style={{width:80,padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
        </div>
        <textarea value={f.about||""} onChange={e=>setF({...f,about:e.target.value})} placeholder="Description" rows={2} style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",marginBottom:10,outline:"none",resize:"none"}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onSave(f)} disabled={saving||!f.name.trim()} style={{flex:1,padding:"10px",background:"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:11,fontSize:12,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer",opacity:saving?.6:1}}>{saving?"Saving...":"Save"}</button>
          <button onClick={onCancel} style={{padding:"10px 16px",background:"rgba(255,255,255,.07)",color:"rgba(255,255,255,.5)",border:"none",borderRadius:11,fontSize:12,fontFamily:"var(--fb)",cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    );
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--pro)",minHeight:0,overflow:"hidden"}}>
      <div style={{padding:"10px 18px 8px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button className="press" onClick={goBack} style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.07)",border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:700,color:"white",flex:1}}>Admin</span>
        {tab==="venues"?
          <button className="press" onClick={()=>{setShowAdd(true);setEditing(null);}} style={{padding:"6px 14px",background:"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:10,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>+ Venue</button>:
          <button className="press" onClick={()=>setShowAddEvt(true)} style={{padding:"6px 14px",background:"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:10,fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>+ Event</button>
        }
      </div>
      {/* Tabs */}
      <div style={{display:"flex",gap:6,padding:"0 18px 10px"}}>
        {[["venues","Venues"],["events","Events"]].map(([id,l])=>(
          <button key={id} onClick={()=>setAdminTab(id)} className="press" style={{flex:1,padding:"8px",borderRadius:10,border:"1.5px solid",fontSize:11,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer",background:tab===id?"var(--gold)":"transparent",borderColor:tab===id?"var(--gold)":"rgba(255,255,255,.1)",color:tab===id?"#0a0a0a":"rgba(255,255,255,.4)"}}>{l}</button>
        ))}
      </div>
      {msg&&<div style={{margin:"0 18px 8px",padding:"8px 12px",background:msg.startsWith("✓")?"rgba(74,222,128,.15)":"rgba(239,68,68,.15)",borderRadius:10,fontSize:11,color:msg.startsWith("✓")?"#4ade80":"#f87171",fontFamily:"var(--fb)"}}>{msg}</div>}
      <div className="scroll" style={{flex:1,overflowY:"auto",padding:"0 18px"}}>
        {tab==="venues"?(
          <>
            {showAdd&&<VenueForm data={form} onSave={saveVenue} onCancel={()=>setShowAdd(false)}/>}
            {loading?<div style={{color:"rgba(255,255,255,.3)",fontFamily:"var(--fb)",fontSize:12,padding:20,textAlign:"center"}}>Loading venues...</div>:
              venues.map(v=>(
                editing===v.id?
                  <VenueForm key={v.id} data={v} onSave={saveVenue} onCancel={()=>setEditing(null)}/>:
                  <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,marginBottom:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:v.active?"#4ade80":"#f87171",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{v.name}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,.35)",fontFamily:"var(--fb)"}}>{v.metro} . {v.type} . ${v.price_min}+</div>
                    </div>
                    <button className="press" onClick={()=>setEditing(v.id)} style={{padding:"4px 10px",background:"rgba(255,255,255,.07)",border:"none",borderRadius:8,fontSize:10,color:"rgba(255,255,255,.5)",fontFamily:"var(--fb)",cursor:"pointer"}}>Edit</button>
                    <button className="press" onClick={()=>toggleActive(v)} style={{padding:"4px 10px",background:v.active?"rgba(239,68,68,.12)":"rgba(74,222,128,.12)",border:"none",borderRadius:8,fontSize:10,color:v.active?"#f87171":"#4ade80",fontFamily:"var(--fb)",cursor:"pointer"}}>{v.active?"Hide":"Show"}</button>
                  </div>
              ))
            }
          </>
        ):(
          <>
            {/* Event creation form */}
            {showAddEvt&&(
              <div style={{padding:"14px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,marginBottom:10}}>
                <input value={evtForm.name} onChange={e=>setEvtForm({...evtForm,name:e.target.value})} placeholder="Event name" style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",marginBottom:8,outline:"none"}}/>
                <select value={evtForm.venue_id} onChange={e=>setEvtForm({...evtForm,venue_id:e.target.value})} style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",marginBottom:8,outline:"none"}}>
                  <option value="">Select venue</option>
                  {venues.map(v=><option key={v.id} value={v.id}>{v.name} ({v.metro})</option>)}
                </select>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  <input type="date" value={evtForm.event_date} onChange={e=>setEvtForm({...evtForm,event_date:e.target.value})} style={{flex:1,padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
                  <input value={evtForm.doors_time} onChange={e=>setEvtForm({...evtForm,doors_time:e.target.value})} placeholder="10:00 PM" style={{width:100,padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
                </div>
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  <input value={evtForm.dj} onChange={e=>setEvtForm({...evtForm,dj:e.target.value})} placeholder="DJ / Artist" style={{flex:1,padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
                  <input value={evtForm.theme} onChange={e=>setEvtForm({...evtForm,theme:e.target.value})} placeholder="Theme" style={{flex:1,padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",outline:"none"}}/>
                </div>
                <textarea value={evtForm.description} onChange={e=>setEvtForm({...evtForm,description:e.target.value})} placeholder="Description" rows={2} style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"white",fontSize:12,fontFamily:"var(--fb)",marginBottom:10,outline:"none",resize:"none"}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveEvent} disabled={saving} style={{flex:1,padding:"10px",background:"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:11,fontSize:12,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer",opacity:saving?.6:1}}>{saving?"Creating...":"Create Event"}</button>
                  <button onClick={()=>setShowAddEvt(false)} style={{padding:"10px 16px",background:"rgba(255,255,255,.07)",color:"rgba(255,255,255,.5)",border:"none",borderRadius:11,fontSize:12,fontFamily:"var(--fb)",cursor:"pointer"}}>Cancel</button>
                </div>
              </div>
            )}
            {/* Event list */}
            {events.map(ev=>(
              <div key={ev.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:ev.active?"#4ade80":"#f87171",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:"white",fontFamily:"var(--fb)"}}>{ev.name}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.35)",fontFamily:"var(--fb)"}}>{ev.event_date} . {ev.doors_time}{ev.dj?" . 🎧 "+ev.dj:""}</div>
                </div>
                <div style={{fontSize:9,color:ev.featured?"var(--gold)":"rgba(255,255,255,.2)",fontFamily:"var(--fb)"}}>{ev.featured?"⭐ Featured":"—"}</div>
              </div>
            ))}
            {events.length===0&&<div style={{color:"rgba(255,255,255,.3)",fontFamily:"var(--fb)",fontSize:12,padding:20,textAlign:"center"}}>No events yet. Create your first one.</div>}
          </>
        )}
        <div style={{height:40}}/>
      </div>
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
    // Start session auto-refresh
    startTokenRefresh();
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
  const [showAdmin,setShowAdmin]=useState(false);
  const [showRevenue,setShowRevenue]=useState(false);
  const [showLeaderboard,setShowLeaderboard]=useState(false);
  const [showAnalyticsDash,setShowAnalyticsDash]=useState(false);
  const [pwaPrompt,setPwaPrompt]=useState(null);
  const [showPwaBanner,setShowPwaBanner]=useState(false);

  // PWA install prompt
  useEffect(()=>{
    const handler=(e)=>{e.preventDefault();setPwaPrompt(e);setShowPwaBanner(true);};
    window.addEventListener("beforeinstallprompt",handler);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);
  const [bookingKey,setBookingKey]=useState(0);
  const [localBookings,setLocalBookings]=useState([]);
  const onBooked=(booking)=>{
    setLocalBookings(prev=>[booking,...prev]);
    setBookingKey(k=>k+1);
  };
  const pro=mode==="promoter";
  const userName=session?.user?.user_metadata?.name||session?.user?.email?.split("@")[0]||"Guest";
  const proData=usePromoterData();

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
    stopTokenRefresh();
    await supaSignOut();
    _setSessionState(null);
    setGuestMode(false);
    setOnboarded(false);
    setVenue(null); setSelPromoter(null); setInviteData(null); setStack([]);
  };
  const switchMode=(m)=>{setMode(m);setVenue(null);setSelPromoter(null);setInviteData(null);setStack([]);setShowProfile(false);setGt("home");setPt("dashboard");setShowAdmin(false);setShowRevenue(false);setShowLeaderboard(false);setShowAnalyticsDash(false);};

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
    if(showAdmin) return <VenueAdmin goBack={()=>setShowAdmin(false)}/>;
    if(showRevenue) return <RevenueDashboard goBack={()=>setShowRevenue(false)}/>;
    if(showLeaderboard) return <ProLeaderboard goBack={()=>setShowLeaderboard(false)}/>;
    if(showAnalyticsDash) return <AnalyticsDashboard goBack={()=>setShowAnalyticsDash(false)}/>;
    if(pt==="dashboard") return <ProDash setTab={setPt} userName={userName} proData={proData} onAdmin={()=>setShowAdmin(true)} onRevenue={()=>setShowRevenue(true)} onLeaderboard={()=>setShowLeaderboard(true)} onAnalytics={()=>setShowAnalyticsDash(true)}/>;
    if(pt==="guests")    return <ProGuests setTab={setPt} onMessage={(guestName)=>{setMsgTarget(guestName);setPt("messages");}}/>;
    if(pt==="links")     return <ProLinks/>;
    if(pt==="analytics") return <ProAnalytics/>;
    if(pt==="payouts")   return <ProPayouts/>;
    if(pt==="messages")  return <ProMessages initialOpen={msgTarget} onOpened={()=>setMsgTarget(null)}/>;
    if(pt==="pricing")   return <ProPricing/>;
    return <ProDash setTab={setPt} userName={userName} proData={proData} onAdmin={()=>setShowAdmin(true)} onRevenue={()=>setShowRevenue(true)} onLeaderboard={()=>setShowLeaderboard(true)} onAnalytics={()=>setShowAnalyticsDash(true)}/>;
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
          <div key={t.id} className="tab press" onClick={()=>{setPt(t.id);setShowAdmin(false);setShowRevenue(false);setShowLeaderboard(false);setShowAnalyticsDash(false);}}>
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

        {/* Floating back-to-landing button (visible when NOT in iframe) */}
        {typeof window!=="undefined"&&window.self===window.top&&(
        <a href="/" style={{position:"absolute",top:16,left:20,zIndex:20,display:"flex",alignItems:"center",gap:6,fontSize:12,color:pro?"rgba(255,255,255,.35)":"var(--dim)",textDecoration:"none",fontFamily:"var(--fb)",fontWeight:600,padding:"6px 12px",borderRadius:10,background:pro?"rgba(255,255,255,.05)":"rgba(0,0,0,.04)",border:`1px solid ${pro?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)"}`,transition:"all .2s"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          lumarsv.com
        </a>
        )}

        <div style={{display:"flex",alignItems:"center",gap:52,width:"100%",maxWidth:940,padding:"0 28px",position:"relative",zIndex:1}}>

          {/* Left panel - hidden in iframes */}
          {typeof window!=="undefined"&&window.self===window.top&&(
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
          )}

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
                  <div className="fade-screen" key={pro?pt:gt+(venue?.id||"")+(selPromoter?.id||"")+(showProfile?"p":"")+(inviteData?.event?.id||"")} style={{flex:1,display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden",background:pro?"var(--pro)":"var(--bg)"}}>
                    {renderScreen()}
                  </div>
                </div>
                {/* PWA Install Banner */}
                {showPwaBanner&&pwaPrompt&&(
                  <div style={{padding:"8px 14px",background:pro?"rgba(201,168,76,.12)":"rgba(201,168,76,.08)",borderTop:"1px solid rgba(201,168,76,.15)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                    <span style={{fontSize:18}}>📱</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:pro?"white":"var(--ink)",fontFamily:"var(--fb)"}}>Add Luma to Home Screen</div>
                      <div style={{fontSize:9,color:pro?"rgba(255,255,255,.4)":"var(--sub)",fontFamily:"var(--fb)"}}>Quick access, app-like experience</div>
                    </div>
                    <button className="press" onClick={async()=>{pwaPrompt.prompt();const r=await pwaPrompt.userChoice;if(r.outcome==="accepted")setShowPwaBanner(false);}} style={{padding:"6px 14px",background:"var(--gold)",color:"#0a0a0a",border:"none",borderRadius:10,fontSize:10,fontWeight:700,fontFamily:"var(--fb)",cursor:"pointer"}}>Install</button>
                    <button onClick={()=>setShowPwaBanner(false)} style={{background:"none",border:"none",color:pro?"rgba(255,255,255,.3)":"var(--dim)",fontSize:14,cursor:"pointer",padding:4}}>✕</button>
                  </div>
                )}
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
          lumarsv.com - {pro?"promoter portal":"your personal concierge"}
        </div>
      </div>
    </>
  );
}
