export default function TermsPage() {
  const gold = "#c9a84c";
  return (
    <div style={{minHeight:"100vh",background:"#08080c",fontFamily:"'DM Sans',sans-serif",color:"white"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&display=swap');a{color:${gold};text-decoration:none}a:hover{text-decoration:underline}`}</style>
      <div style={{maxWidth:720,margin:"0 auto",padding:"40px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:40}}>
          <a href="/" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:700,fontStyle:"italic",color:gold}}>luma</a>
          <a href="/app" style={{padding:"8px 18px",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",borderRadius:10,fontSize:12,fontWeight:700,color:gold}}>Open App</a>
        </div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:42,fontWeight:700,marginBottom:8}}>Terms of Service</h1>
        <p style={{fontSize:12,color:"rgba(255,255,255,.3)",marginBottom:40}}>Last updated: March 10, 2026</p>
        {[
          ["1. Acceptance of Terms","By accessing or using Luma (lumarsv.com), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service."],
          ["2. Description of Service","Luma is a nightlife booking platform that connects guests with venues and promoters for VIP table reservations, bottle service, and nightlife experiences in Miami and New York City."],
          ["3. User Accounts","You must be at least 21 years old to use Luma. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration."],
          ["4. Booking & Payments","All bookings are subject to venue availability and confirmation. Prices displayed include the table minimum; gratuity and tax may be additional. A 10% platform fee is applied to all bookings. Payments are processed securely through Stripe."],
          ["5. Cancellation Policy","Free cancellation is available up to 48 hours before your event date. Cancellations within 48 hours may be subject to venue-specific cancellation policies. Refunds are processed within 5-7 business days."],
          ["6. Promoter Terms","Promoters earn a 15% commission on bookings made through their invite links. Commissions are paid via Stripe Connect. Promoters must provide accurate information and may not engage in misleading or fraudulent practices."],
          ["7. Prohibited Conduct","You may not: use the Service for any unlawful purpose, impersonate another person, interfere with the Service's operation, scrape or harvest data, or resell access to the Service."],
          ["8. Intellectual Property","All content, features, and functionality of Luma are owned by Luma and are protected by copyright, trademark, and other intellectual property laws."],
          ["9. Limitation of Liability","Luma is provided 'as is' without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid to us in the past 12 months."],
          ["10. Changes to Terms","We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms."],
          ["11. Contact","For questions about these Terms, contact us at support@lumarsv.com."],
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
