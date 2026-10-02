import { Link } from 'react-router-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import SEO from '../../components/seo/SEO';

const rows = [
  { label:'What it moves', vooom:'Your parcels, documents, goods', uber:'People only' },
  { label:'How pricing works', vooom:'You set the price. Carriers bid competitively', uber:'Surge pricing: you pay what the algorithm says' },
  { label:'Who carries', vooom:'Verified identity-checked carriers already on that route', uber:'Drivers assigned automatically, no vetting for cargo' },
  { label:'Payment protection', vooom:'Full escrow: money only released on delivery', uber:'Card charged upfront, no protection if goods are damaged' },
  { label:'International routes', vooom:'UK, US, Canada, Europe to Nigeria and back', uber:'City-level only, no cross-border logistics' },
  { label:'Item types', vooom:'Documents, electronics, food, clothing, medicine', uber:'Not applicable' },
  { label:'Review system', vooom:'Public verified reviews on every carrier', uber:'Driver reviews only, not relevant for cargo' },
];

export default function VooomVsUber() {
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <SEO
        title="Vooom vs Uber / Bolt for Deliveries in Nigeria | Taskeeu"
        description="Uber and Bolt move people. Vooom moves things. See why Vooom by Taskeeu is the better choice for sending parcels, documents, and goods across Nigeria and internationally."
        canonical="https://taskeeu.com/vooom/vs-uber-bolt"
        keywords="vooom vs uber nigeria, vooom vs bolt nigeria, uber delivery nigeria, bolt delivery nigeria, peer logistics nigeria, better than uber delivery nigeria"
      />
      <div style={{ background:'linear-gradient(135deg,#0f0720,#1a0933)', padding:'80px 20px', textAlign:'center' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <p style={{ color:'#ff8fab', fontWeight:700, fontSize:13, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14 }}>Vooom vs Uber / Bolt</p>
          <h1 style={{ color:'white', fontWeight:900, fontSize:'clamp(26px,5vw,44px)', letterSpacing:'-0.03em', margin:'0 0 18px', lineHeight:1.15 }}>
            Uber and Bolt move people.<br/>
            <span style={{ color:'#ff6b8f' }}>Vooom moves your stuff.</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:16, lineHeight:1.75, maxWidth:560, margin:'0 auto 32px' }}>
            If you have tried using Uber or Bolt to send a parcel in Lagos or Abuja, you already know the limitations. They are built for passengers, not cargo. Vooom was built specifically for logistics, with carrier vetting, escrow payment, and international routes that Uber and Bolt do not touch.
          </p>
          <Link to="/vooom/browse" className="btn-primary" style={{ padding:'14px 30px', fontSize:15, borderRadius:12, display:'inline-flex', alignItems:'center', gap:8 }}>
            Browse Vooom carriers <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'60px 20px' }}>
        <h2 style={{ fontWeight:900, fontSize:26, textAlign:'center', marginBottom:32, color:'var(--text)', letterSpacing:'-0.02em' }}>Side by side comparison</h2>
        <div style={{ borderRadius:18, overflow:'hidden', border:'1.5px solid var(--border-light)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background:'#0f0720', padding:'14px 20px' }}>
            <p style={{ color:'rgba(255,255,255,0.5)', fontWeight:700, fontSize:12, margin:0, textTransform:'uppercase', letterSpacing:'0.06em' }}></p>
            <p style={{ color:'#ff8fab', fontWeight:800, fontSize:14, margin:0, textAlign:'center' }}>Vooom</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontWeight:700, fontSize:14, margin:0, textAlign:'center' }}>Uber / Bolt</p>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'16px 20px', background: i % 2 === 0 ? 'white' : '#fafafa', borderTop:'1px solid var(--border-light)' }}>
              <p style={{ fontWeight:700, fontSize:13.5, color:'var(--text)', margin:0 }}>{r.label}</p>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, paddingRight:12 }}>
                <Check size={16} style={{ color:'#16a34a', flexShrink:0, marginTop:1 }} />
                <p style={{ fontSize:13, color:'#166534', margin:0, lineHeight:1.5 }}>{r.vooom}</p>
              </div>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                <X size={16} style={{ color:'#dc2626', flexShrink:0, marginTop:1 }} />
                <p style={{ fontSize:13, color:'#991b1b', margin:0, lineHeight:1.5 }}>{r.uber}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:40 }}>
          <p style={{ color:'var(--muted)', marginBottom:20, fontSize:15 }}>Ready to send something the smarter way?</p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/vooom/post" className="btn-primary" style={{ padding:'13px 28px', borderRadius:12, fontSize:14 }}>Post a request</Link>
            <Link to="/vooom/browse" style={{ padding:'13px 28px', borderRadius:12, background:'white', border:'1.5px solid var(--border-light)', color:'var(--text)', fontWeight:700, textDecoration:'none', fontSize:14 }}>Browse carriers</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
