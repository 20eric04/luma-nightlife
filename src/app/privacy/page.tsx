export default function PrivacyPage() {
  const gold = "#c9a84c";
  return (
    <div style={{minHeight:"100vh",background:"#08080c",fontFamily:"'DM Sans',sans-serif",color:"white"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');a{color:${gold};text-decoration:none}a:hover{text-decoration:underline}`}</style>
      <div style={{maxWidth:720,margin:"0 auto",padding:"40px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:40}}>
          <a href="/" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,fontStyle:"italic",color:gold}}>luma</a>
          <a href="/app" style={{padding:"8px 18px",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",borderRadius:10,fontSize:12,fontWeight:700,color:gold}}>Open App</a>
        </div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:700,marginBottom:8}}>Privacy Policy</h1>
        <p style={{fontSize:12,color:"rgba(255,255,255,.3)",marginBottom:40}}>Last updated: March 10, 2026</p>
        {[
          ["1. Information We Collect","We collect information you provide directly: name, email address, city preference, and role (guest or promoter). When you make a booking, we collect payment information processed securely by Stripe — we do not store your credit card details. We also collect usage data including pages visited, features used, and device information."],
          ["2. How We Use Your Information","We use your information to: provide and improve the Service, process bookings and payments, send booking confirmations and important updates, personalize your experience (venues in your city), communicate promotional offers (you can opt out), and prevent fraud."],
          ["3. Information Sharing","We share your information with: venues (to fulfill your reservation), promoters (if you book through their link, limited to booking details), payment processors (Stripe, for transaction processing), and service providers (Resend for email, Twilio for SMS). We do not sell your personal information to third parties."],
          ["4. Data Security","We use industry-standard security measures including: server-side pricing calculations (no client-side manipulation), Row Level Security (RLS) on all database tables, encrypted data transmission (HTTPS), secure authentication with token refresh, and rate limiting on all API endpoints."],
          ["5. Your Rights","You can: access your personal data through your profile, update your information at any time, delete your account and all associated data, opt out of promotional communications, and request a copy of your data by emailing support@lumarsv.com."],
          ["6. Cookies & Local Storage","We use local storage to maintain your session (luma_sess). We do not use tracking cookies. We do not use third-party analytics or advertising trackers."],
          ["7. Data Retention","We retain your data for as long as your account is active. Booking records are kept for 2 years for legal and tax purposes. When you delete your account, personal data is removed within 30 days."],
          ["8. Children's Privacy","Luma is intended for users 21 years of age and older. We do not knowingly collect information from anyone under 21."],
          ["9. Changes to This Policy","We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification."],
          ["10. Contact Us","For privacy-related questions or requests, contact us at support@lumarsv.com."],
        ].map(([title,content])=>(
          <div key={title} style={{marginBottom:28}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,marginBottom:8}}>{title}</h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,.5)",lineHeight:1.8}}>{content}</p>
          </div>
        ))}
        <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid rgba(255,255,255,.06)",fontSize:10,color:"rgba(255,255,255,.15)"}}>© 2026 Luma · lumarsv.com</div>
      </div>
    </div>
  );
}
