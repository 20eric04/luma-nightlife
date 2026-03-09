'use client';
import { useState, useEffect } from 'react';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ribyrsrdhskvdmlnpsxk.supabase.co";
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(SUPA_URL + "/rest/v1/blog_posts?published=eq.true&order=published_at.desc", {
      headers: { "apikey": SUPA_ANON }
    }).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setPosts(d);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const post = selected ? posts.find(p => p.slug === selected) : null;

  return (
    <div style={{minHeight:"100vh",background:"#08080c",fontFamily:"'DM Sans',sans-serif",color:"white"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');
        a{color:#c9a84c;text-decoration:none}a:hover{text-decoration:underline}
      `}</style>
      <div style={{maxWidth:720,margin:"0 auto",padding:"40px 24px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:40}}>
          <a href="/" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,fontStyle:"italic",color:"#c9a84c",textDecoration:"none"}}>luma</a>
          <a href="/app" style={{padding:"8px 18px",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",borderRadius:10,fontSize:12,fontWeight:700,color:"#c9a84c",textDecoration:"none"}}>Open App</a>
        </div>

        {post ? (
          <>
            <button onClick={() => setSelected(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",gap:6}}>‹ Back to all posts</button>
            {post.cover_image && <div style={{width:"100%",height:300,borderRadius:18,overflow:"hidden",marginBottom:28,background:"#1a1a2e"}}><img src={post.cover_image} alt={post.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>{(post.tags||[]).map((t: any)=><span key={t} style={{fontSize:10,background:"rgba(201,168,76,.1)",color:"#c9a84c",padding:"3px 10px",borderRadius:12,fontWeight:600}}>{t}</span>)}</div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,lineHeight:1.2,marginBottom:12}}>{post.title}</h1>
            <div style={{fontSize:12,color:"rgba(255,255,255,.3)",marginBottom:32}}>{post.author} · {new Date(post.published_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
            <div style={{fontSize:15,color:"rgba(255,255,255,.7)",lineHeight:1.9,whiteSpace:"pre-line"}}>{post.content?.replace(/## /g,'\n## ').split('\n').map((line: string, i: number) => 
              line.startsWith('## ') ? <h2 key={i} style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:"white",margin:"28px 0 12px"}}>{line.replace('## ','')}</h2> : <span key={i}>{line}<br/></span>
            )}</div>
            <div style={{marginTop:40,padding:"24px",background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.12)",borderRadius:16,textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:"white",marginBottom:6}}>Ready to book your next night out?</div>
              <a href="/app" style={{display:"inline-block",marginTop:8,padding:"10px 24px",background:"#c9a84c",color:"#0a0a0a",borderRadius:12,fontSize:13,fontWeight:700,textDecoration:"none"}}>Open Luma</a>
            </div>
          </>
        ) : (
          <>
            <div style={{marginBottom:32}}>
              <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:700,fontStyle:"italic",marginBottom:8}}>The Luma Blog</h1>
              <p style={{fontSize:14,color:"rgba(255,255,255,.4)",lineHeight:1.7}}>Nightlife guides, booking tips, and behind-the-scenes from Miami and NYC.</p>
            </div>
            {loading ? <div style={{color:"rgba(255,255,255,.3)",fontSize:13}}>Loading...</div> : posts.length === 0 ? <div style={{color:"rgba(255,255,255,.3)",fontSize:13}}>No posts yet. Check back soon.</div> : (
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                {posts.map((p: any) => (
                  <div key={p.id} onClick={() => setSelected(p.slug)} style={{cursor:"pointer",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:18,overflow:"hidden",transition:"all .2s"}}>
                    {p.cover_image && <div style={{height:200,overflow:"hidden"}}><img src={p.cover_image} alt={p.title} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .3s"}}/></div>}
                    <div style={{padding:"20px 22px"}}>
                      <div style={{display:"flex",gap:6,marginBottom:8}}>{(p.tags||[]).map((t: any)=><span key={t} style={{fontSize:9,background:"rgba(201,168,76,.1)",color:"#c9a84c",padding:"2px 8px",borderRadius:10,fontWeight:600}}>{t}</span>)}</div>
                      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,marginBottom:6,lineHeight:1.3}}>{p.title}</h2>
                      <p style={{fontSize:13,color:"rgba(255,255,255,.4)",lineHeight:1.6,marginBottom:8}}>{p.excerpt}</p>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.2)"}}>{new Date(p.published_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{marginTop:60,paddingTop:20,borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>© 2026 Luma · lumarsv.com</span>
          <div style={{display:"flex",gap:12}}>
            <a href="/" style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>Home</a>
            <a href="/app" style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>App</a>
            <a href="/terms" style={{fontSize:10,color:"rgba(255,255,255,.15)"}}>Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
