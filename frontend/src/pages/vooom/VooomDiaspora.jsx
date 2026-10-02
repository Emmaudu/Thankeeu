import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Shield, Clock, DollarSign , Package } from 'lucide-react';
import SEO from '../../components/seo/SEO';

export default function VooomDiaspora() {
  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <SEO
        title="Send Items from UK, US, Canada to Nigeria Without DHL | Vooom by Taskeeu"
        description="Nigerian diaspora in the UK, US, and Canada: send parcels, documents, food, and clothing to Nigeria for a fraction of DHL or FedEx costs using Vooom by Taskeeu. Verified carriers, escrow payment."
        canonical="https://taskeeu.com/vooom/nigeria-diaspora-delivery"
        keywords="send parcel nigeria diaspora, uk to nigeria cheaper than dhl, us to nigeria parcel, canada to nigeria delivery, diaspora nigeria send items, japa community send nigeria, cheaper than fedex nigeria"
      />
      <div style={{ background:'linear-gradient(135deg,#0f0720,#1a0933)', padding:'80px 20px', textAlign:'center' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:20, flexWrap:'wrap' }}>{['UK','US','CA','EU'].map(f=><span key={f} style={{ background:'rgba(255,45,98,0.1)', border:'1px solid rgba(255,45,98,0.2)', borderRadius:8, padding:'4px 12px', fontWeight:800, fontSize:14, color:'var(--rose)' }}>{f}</span>)}</div>
          <h1 style={{ color:'white', fontWeight:900, fontSize:'clamp(26px,5vw,44px)', letterSpacing:'-0.03em', margin:'0 0 18px', lineHeight:1.15 }}>
            Stop paying DHL prices.<br/>
            <span style={{ color:'#ff6b8f' }}>Someone is already flying to Nigeria.</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:16, lineHeight:1.75, maxWidth:600, margin:'0 auto 32px' }}>
            Every week, thousands of Nigerians travel between the UK, US, Canada, and Nigeria. Their suitcases are never completely full. Your package needs to get home. Vooom connects these two realities safely, affordably, and with full escrow protection.
          </p>
          <Link to="/vooom/post" className="btn-primary" style={{ padding:'14px 30px', fontSize:15, borderRadius:12, display:'inline-flex', alignItems:'center', gap:8 }}>
            Post a request now <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'64px 20px' }}>
        <h2 style={{ fontWeight:900, fontSize:28, textAlign:'center', marginBottom:14, color:'var(--text)', letterSpacing:'-0.02em' }}>What Nigerian diaspora send home</h2>
        <p style={{ textAlign:'center', color:'var(--muted)', marginBottom:44, fontSize:15 }}>Everything DHL charges a fortune for, carriers on Vooom handle person to person.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:56 }}>
          {[
            { Icon: Package, title:'Medicines', desc:'Specific prescriptions unavailable abroad, vitamins, supplements for family members who need them at home.' },
            { Icon: Package, title:'Clothing & fabrics', desc:'Ankara fabric, aso-ebi, quality clothing purchased abroad. Send through a traveller going home this week.' },
            { Icon: Package, title:'Electronics', desc:'Phones, laptops, accessories. Cheaper to buy abroad and send via Vooom than to import through official channels.' },
            { Icon: Package, title:'Food & seasoning', desc:'Jollof seasoning, crayfish, ogiri, stockfish: the things that make Nigerian cooking right regardless of where you are.' },
            { Icon: Package, title:'Documents', desc:'Legal papers, bank documents, academic certificates. Courier them home securely through a verified traveller.' },
            { Icon: Package, title:'Gifts', desc:'Birthday presents, baby items, celebration gifts, all sent home without the ceremony of clearing it through customs.' },
          ].map(i => (
            <div key={i.title} style={{ background:'white', borderRadius:16, padding:22, boxShadow:'0 4px 20px rgba(18,9,26,0.05)' }}>
              <span style={{ fontSize:32 }}>{i.icon}</span>
              <p style={{ fontWeight:800, fontSize:15, color:'var(--text)', margin:'12px 0 6px' }}>{i.title}</p>
              <p style={{ fontSize:13.5, color:'var(--muted)', margin:0, lineHeight:1.6 }}>{i.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff0f4', border:'1.5px solid #fecdd3', borderRadius:20, padding:'32px 36px', marginBottom:48 }}>
          <h3 style={{ fontWeight:900, fontSize:22, color:'#be123c', marginBottom:12, letterSpacing:'-0.02em' }}>The cost difference is real</h3>
          <p style={{ color:'#9f1239', lineHeight:1.75, fontSize:15, marginBottom:16 }}>
            Sending a 2kg package from London to Lagos with DHL costs around £120 to £180. The same package sent through a Vooom carrier travelling that week costs whatever you and the carrier agree, which is typically £20 to £50. The carrier was already buying a ticket. The luggage space was already there.
          </p>
          <p style={{ color:'#be123c', fontWeight:700, fontSize:15, margin:0 }}>
            Your money stays in escrow until you confirm the package arrived safely.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:48 }}>
          {[
            { icon:Shield, title:'Identity-verified carriers', desc:'Every carrier on Vooom is a verified Taskeeu member with a real identity on file and a public review history.' },
            { icon:DollarSign, title:'Escrow payment', desc:'You pay into escrow. The carrier gets paid only when you confirm the package arrived safely.' },
            { icon:Clock, title:'Fast turnaround', desc:'Someone is always flying or driving your route. Post today, get bids by tomorrow.' },
            { icon:Globe, title:'All routes covered', desc:'UK, US, Canada, Ireland, Germany, Netherlands, Australia, UAE | Vooom covers where Nigerians are.' },
          ].map(({ icon:Icon, title, desc }) => (
            <div key={title} style={{ background:'white', borderRadius:14, padding:20, boxShadow:'0 4px 16px rgba(18,9,26,0.05)', textAlign:'center' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#ff2d62,#ff6b8f)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Icon size={20} style={{ color:'white' }} />
              </div>
              <p style={{ fontWeight:800, fontSize:14, color:'var(--text)', marginBottom:6 }}>{title}</p>
              <p style={{ fontSize:13, color:'var(--muted)', margin:0, lineHeight:1.55 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center' }}>
          <Link to="/vooom/post" className="btn-primary" style={{ padding:'14px 32px', borderRadius:12, fontSize:15, display:'inline-flex', alignItems:'center', gap:8, marginRight:12 }}>
            Post a request <ArrowRight size={16} />
          </Link>
          <Link to="/vooom/browse" style={{ padding:'14px 32px', borderRadius:12, background:'white', border:'1.5px solid var(--border-light)', color:'var(--text)', fontWeight:700, textDecoration:'none', fontSize:15 }}>
            Browse carriers
          </Link>
        </div>
      </div>
    </div>
  );
}
