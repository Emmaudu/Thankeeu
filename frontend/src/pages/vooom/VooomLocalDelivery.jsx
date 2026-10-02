import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function VooomLocalDelivery() {
  const isUK = 'VooomLocalDelivery' === 'VooomUKNigeria';
  const isUS = 'VooomLocalDelivery' === 'VooomUSNigeria';
  const isLocal = 'VooomLocalDelivery' === 'VooomLocalDelivery';

  const meta = isUK
    ? { title:'UK to Nigeria Parcel Delivery: Cheaper Than DHL | Vooom Taskeeu', desc:'Send parcels from the UK to Nigeria without DHL. Find verified carriers flying London to Lagos, Manchester to Abuja, Birmingham to Port Harcourt. Escrow-protected. Vooom by Taskeeu.', path:'uk-nigeria-delivery', kw:'uk to nigeria parcel, uk nigeria delivery cheaper dhl, send parcel nigeria from uk, london to lagos parcel, uk nigeria courier alternative' }
    : isUS
    ? { title:'US to Nigeria Parcel Delivery: Cheaper Than FedEx | Vooom Taskeeu', desc:'Send parcels from the US to Nigeria without FedEx or DHL. Houston to Lagos, New York to Abuja, Atlanta to Enugu. Verified carriers, escrow payment. Vooom by Taskeeu.', path:'us-nigeria-delivery', kw:'us to nigeria parcel, send package nigeria from usa, houston to lagos carrier, japa community send nigeria, us nigeria parcel cheaper fedex' }
    : { title:'Local Delivery Across Nigeria: Cheaper Than Courier | Vooom Taskeeu', desc:'Local logistics across Nigerian cities. Lagos to Abuja, Port Harcourt to Lagos, Kano to Lagos. Find verified carriers already making the journey. Vooom by Taskeeu.', path:'local-delivery-nigeria', kw:'local delivery nigeria, lagos abuja delivery, port harcourt lagos delivery, peer logistics nigeria, send item across nigeria cheaper courier' };

  const flag = isUK ? 'UK' : isUS ? 'US' : 'NG';
  const from = isUK ? 'United Kingdom' : isUS ? 'United States' : 'Nigerian cities';
  const to = isLocal ? 'across Nigeria' : 'Nigeria';
  const routes = isUK
    ? [['London','Lagos'],['Manchester','Abuja'],['Birmingham','Port Harcourt'],['Leeds','Enugu']]
    : isUS
    ? [['Houston','Lagos'],['New York','Abuja'],['Atlanta','Port Harcourt'],['Dallas','Enugu']]
    : [['Lagos','Abuja'],['Port Harcourt','Lagos'],['Kano','Lagos'],['Ibadan','Lagos']];

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <SEO title={meta.title} description={meta.desc} canonical={`https://taskeeu.com/vooom/${meta.path}`} keywords={meta.kw} />

      <div style={{ background:'linear-gradient(135deg,#0f0720,#1a0933)', padding:'80px 20px', textAlign:'center' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:18 }}><span style={{ background:'rgba(255,45,98,0.1)', border:'1px solid rgba(255,45,98,0.2)', borderRadius:8, padding:'4px 12px', fontWeight:800, fontSize:15, color:'var(--rose)' }}>{flag}</span><span style={{ color:'var(--muted)', fontWeight:700 }}>→</span><span style={{ background:'rgba(255,45,98,0.1)', border:'1px solid rgba(255,45,98,0.2)', borderRadius:8, padding:'4px 12px', fontWeight:800, fontSize:15, color:'var(--rose)' }}>NG</span></div>
          <h1 style={{ color:'white', fontWeight:900, fontSize:'clamp(26px,5vw,44px)', letterSpacing:'-0.03em', margin:'0 0 18px', lineHeight:1.15 }}>
            {isLocal ? 'Local logistics across Nigeria' : `Send anything from ${from} to ${to}`}<br/>
            <span style={{ color:'#ff6b8f' }}>without the courier markup.</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:16, lineHeight:1.75, maxWidth:580, margin:'0 auto 32px' }}>
            {isLocal
              ? 'A truck is driving from Lagos to Abuja today. A car is heading from Port Harcourt to Lagos this weekend. Their space is not full. Your goods need to get there. Vooom is the bridge: peer logistics that turns every Nigerian journey into a delivery.'
              : `Thousands of Nigerians travel from ${from} to Nigeria every month. Their luggage is not always full. Your parcel needs to get home. Vooom connects you with verified carriers already making that journey for a fraction of what DHL or FedEx would charge.`}
          </p>
          <Link to="/vooom/post" className="btn-primary" style={{ padding:'14px 30px', fontSize:15, borderRadius:12, display:'inline-flex', alignItems:'center', gap:8 }}>
            Post a request <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'60px 20px' }}>
        <h2 style={{ fontWeight:900, fontSize:26, textAlign:'center', marginBottom:40, color:'var(--text)', letterSpacing:'-0.02em' }}>Popular routes on Vooom</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginBottom:48 }}>
          {routes.map(([f, t]) => (
            <div key={f+t} style={{ background:'white', borderRadius:14, padding:'18px 20px', textAlign:'center', boxShadow:'0 4px 16px rgba(18,9,26,0.05)' }}>
              <p style={{ fontWeight:800, fontSize:15, color:'var(--text)', margin:'0 0 4px' }}>{f}</p>
              <p style={{ color:'var(--rose)', fontWeight:700, fontSize:18, margin:'0 0 4px' }}>↓</p>
              <p style={{ fontWeight:800, fontSize:15, color:'var(--text)', margin:0 }}>{t}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--surface)', borderRadius:18, padding:'28px 32px', marginBottom:40 }}>
          <h3 style={{ fontWeight:800, fontSize:20, color:'var(--text)', marginBottom:14, letterSpacing:'-0.02em' }}>How it works in 3 steps</h3>
          {[
            { n:'1', t:'Post your request', d:'Describe your item, route, and proposed price. Takes two minutes.' },
            { n:'2', t:'Carriers bid', d:'Verified carriers already travelling your route see your request and bid. Review their profile and reviews.' },
            { n:'3', t:'Confirm delivery, release payment', d:'Hand over the item, track via chat, and release the escrow payment when it arrives safely.' },
          ].map(s => (
            <div key={s.n} style={{ display:'flex', gap:16, marginBottom:18 }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--rose)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, flexShrink:0 }}>{s.n}</div>
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:'var(--text)', margin:'0 0 3px' }}>{s.t}</p>
                <p style={{ fontSize:13.5, color:'var(--muted)', margin:0, lineHeight:1.55 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center' }}>
          <Link to="/vooom/post" className="btn-primary" style={{ padding:'13px 28px', borderRadius:12, fontSize:14, display:'inline-flex', alignItems:'center', gap:8, marginRight:12 }}>
            Post a request <ArrowRight size={16} />
          </Link>
          <Link to="/vooom/browse" style={{ padding:'13px 28px', borderRadius:12, background:'white', border:'1.5px solid var(--border-light)', color:'var(--text)', fontWeight:700, textDecoration:'none', fontSize:14 }}>
            Browse carriers
          </Link>
        </div>
      </div>
    </div>
  );
}
