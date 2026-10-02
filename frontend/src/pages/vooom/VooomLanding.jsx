import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsApi } from '../../utils/api';
import { Zap, Package, MapPin, Globe, Clock, Shield, ArrowRight, Truck, Users, Car, Plane } from 'lucide-react';
import SEO, { makeFAQSchema } from '../../components/seo/SEO';

const faqs = [
  { q: 'What is Vooom?', a: 'Vooom is Taskeeu\'s peer logistics network. Instead of paying a courier company, you find someone already travelling your route, locally or internationally, and they carry your item along. You agree a price, they deliver it, you release payment. Simple, fast, cheaper than traditional courier.' },
  { q: 'How is Vooom different from Uber or Bolt?', a: 'Uber and Bolt move people. Vooom moves things, leveraging the journeys people are already making. A traveller going from Lagos to London? They can earn by carrying a parcel. A truck going from Kano to Lagos? They can carry your goods at a fraction of a full courier cost. Vooom turns every journey into a potential delivery.' },
  { q: 'Is it safe to use Vooom for sending items?', a: 'Yes. Every carrier on Vooom is a verified Taskeeu tasker with an identity-checked profile, public reviews, and escrow-protected payment. You see who is carrying your item before you hand it over. Your money only releases when you confirm delivery.' },
  { q: 'Can I use Vooom to send items from the UK or US to Nigeria?', a: 'Absolutely. This is one of Vooom\'s strongest use cases. Post a request for someone travelling from the UK, US, Canada, or any country to Nigeria, or vice versa, and Nigerian taskers or travellers who are making that journey will bid to carry your item.' },
  { q: 'How much does Vooom cost?', a: 'You set a proposed price when you post your request, and carriers bid. The market determines the final price. International routes typically cost far less than DHL or FedEx for person-to-person items. Local Nigerian routes cost a fraction of traditional courier.' },
  { q: 'What items can I send through Vooom?', a: 'Documents, clothing, electronics, food items, medicines, personal parcels, anything legal that fits in a bag or manageable package. You describe the item clearly when posting. Carriers choose what they are comfortable carrying.' },
];



const HOW = [
  { icon: Package, title: 'Post your request', desc: 'Describe where you need to send from, where to, the travel date, vehicle type, and item. Set a proposed price.' },
  { icon: Users, title: 'Carriers bid', desc: 'Verified taskers already travelling your route see your request and bid. You review their profile, reviews, and price.' },
  { icon: Shield, title: 'Agree and hand over', desc: 'Accept the best bid, coordinate via in-app chat, hand over the item. Your payment stays in escrow.' },
  { icon: Zap, title: 'Delivered, payment released', desc: 'When you confirm delivery, the carrier gets paid. Done. Cheaper and faster than any traditional courier.' },
];

const USE_CASES = [
  { from: 'Lagos', to: 'Abuja', Icon: Car, desc: 'Send documents same day with someone already driving up.' },
  { from: 'UK', to: 'Nigeria', Icon: Plane, desc: 'Send jollof seasoning, clothes, or medications home.' },
  { from: 'Nigeria', to: 'UK', Icon: Package, desc: 'Send foodstuffs, fabrics, or gifts to family abroad.' },
  { from: 'US', to: 'Nigeria', Icon: Globe, desc: 'Japa community: send items without paying DHL prices.' },
  { from: 'Port Harcourt', to: 'Lagos', Icon: Truck, desc: 'Truck already making the run? Carry goods along.' },
  { from: 'Canada', to: 'Nigeria', Icon: Package, desc: 'Toronto Nigerians: send parcels home for a fraction of courier costs.' },
];

export default function VooomLanding() {
  const [heroText, setHeroText] = useState({
    vooom_hero_heading: 'Send anything across Nigeria or worldwide with someone already going.',
    vooom_hero_subheading: 'Verified carriers already travelling your route bid to carry your item. Pay a fraction of courier prices.',
  });
  useEffect(() => {
    settingsApi.getPublic().then(({ data }) => {
      if (data?.settings) {
        setHeroText(prev => ({
          ...prev,
          ...(data.settings.vooom_hero_heading ? { vooom_hero_heading: data.settings.vooom_hero_heading } : {}),
          ...(data.settings.vooom_hero_subheading ? { vooom_hero_subheading: data.settings.vooom_hero_subheading } : {}),
        }));
      }
    }).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <SEO
        title="Vooom by Taskeeu | Nigeria's Peer Logistics Network | Send Anything, Anywhere" description="Vooom connects people who need to send items with verified carriers already travelling their route. Lagos to Abuja. UK to Nigeria. US to Nigeria. Cheaper than DHL, faster than courier. Escrow-protected." canonical="https://taskeeu.com/vooom" keywords="peer logistics nigeria, send parcel nigeria, uk to nigeria delivery, us to nigeria delivery, cheaper than dhl nigeria, courier nigeria, vooom, taskeeu logistics, send item lagos abuja, logistics platform nigeria, uber for delivery nigeria" structuredData={makeFAQSchema(faqs)}
      />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(160deg,#0f0720 0%,#1a0933 50%,#0f0720 100%)', padding: '164px 20px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,45,98,0.2),transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.15),transparent 70%)', pointerEvents:'none' }} />
        <div className="container-xl" style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:22 }}>
            <Zap size={14} style={{ color:'#ff6b8f' }} />
            <span style={{ color:'#ff6b8f', fontSize:12, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase' }}>Vooom by Taskeeu</span>
          </div>
          <h1 style={{ fontSize:'clamp(34px,7vw,58px)', fontWeight:900, color:'white', lineHeight:1.1, letterSpacing:'-0.03em', margin:'0 0 22px' }}>{heroText.vooom_hero_heading}</h1>
          <p style={{ fontSize:18, color:'rgba(255,255,255,0.65)', lineHeight:1.75, marginBottom:36, maxWidth:640, marginLeft:'auto', marginRight:'auto' }}>
            {heroText.vooom_hero_subheading}
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/vooom/browse" className="btn-primary" style={{ padding:'15px 34px', fontSize:16, borderRadius:12, display:'inline-flex', alignItems:'center', gap:8 }}>
              Find a carrier <ArrowRight size={17} />
            </Link>
            <Link to="/vooom/post" style={{ padding:'15px 34px', fontSize:16, borderRadius:12, background:'rgba(255,255,255,0.08)', color:'white', fontWeight:700, textDecoration:'none', border:'1px solid rgba(255,255,255,0.15)' }}>
              Post a request
            </Link>
          </div>

        </div>
      </section>

      {/* PROBLEM STATEMENT */}
      <section style={{ padding:'72px 20px', background:'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth:800, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, color:'var(--text)', marginBottom:18, letterSpacing:'-0.02em' }}>
            Why pay DHL when someone is already going?
          </h2>
          <p style={{ color:'var(--muted)', lineHeight:1.8, fontSize:16, marginBottom:20 }}>
            Every day, thousands of people travel between Nigerian cities and internationally: Lagos to Abuja, UK to Nigeria, US to Nigeria, Canada to Nigeria. Their luggage is never completely full. Their vehicle has empty space. And you need to send something.
          </p>
          <p style={{ color:'var(--muted)', lineHeight:1.8, fontSize:16 }}>
            Vooom connects these two realities. You post what you need sent and where. Verified carriers already making that journey see your request and bid. You pay a fraction of what a courier company would charge, and the carrier earns for space they were not using anyway.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:'72px 20px' }}>
        <div className="container-xl" style={{ maxWidth:960, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:30, fontWeight:900, color:'var(--text)', marginBottom:12, letterSpacing:'-0.02em' }}>How Vooom works</h2>
          <p style={{ textAlign:'center', color:'var(--muted)', marginBottom:48, fontSize:16 }}>Four steps. No couriers needed.</p>
          <div style={{ display:'grid', gap:20 }}>
            {HOW.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:20, background:'white', borderRadius:18, padding:'22px 26px', boxShadow:'0 4px 20px rgba(18,9,26,0.05)', alignItems:'flex-start' }}>
                <div style={{ flexShrink:0, width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#ff2d62,#ff6b8f)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', position:'relative' }}>
                  <s.icon size={22} />
                  <span style={{ position:'absolute', top:-8, left:-8, width:24, height:24, borderRadius:'50%', background:'#0f0720', color:'white', fontSize:12, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</span>
                </div>
                <div>
                  <h3 style={{ fontWeight:800, fontSize:17, color:'var(--text)', marginBottom:5 }}>{s.title}</h3>
                  <p style={{ color:'var(--muted)', lineHeight:1.65, fontSize:14.5, margin:0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ padding:'72px 20px', background:'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth:960, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:30, fontWeight:900, color:'var(--text)', marginBottom:12, letterSpacing:'-0.02em' }}>Popular routes on Vooom</h2>
          <p style={{ textAlign:'center', color:'var(--muted)', marginBottom:44, fontSize:16 }}>Local. Interstate. International. Vooom covers them all.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18 }}>
            {USE_CASES.map((u, i) => (
              <div key={i} style={{ background:'white', borderRadius:18, padding:24, boxShadow:'0 4px 20px rgba(18,9,26,0.05)' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#ff2d62,#ff6b8f)', display:'flex', alignItems:'center', justifyContent:'center' }}><u.Icon size={22} style={{ color:'white' }} /></div>
                <div style={{ display:'flex', alignItems:'center', gap:8, margin:'12px 0 8px' }}>
                  <span style={{ fontWeight:800, fontSize:15, color:'var(--text)' }}>{u.from}</span>
                  <ArrowRight size={14} style={{ color:'var(--rose)' }} />
                  <span style={{ fontWeight:800, fontSize:15, color:'var(--text)' }}>{u.to}</span>
                </div>
                <p style={{ color:'var(--muted)', fontSize:13.5, margin:0, lineHeight:1.6 }}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VS TRADITIONAL COURIER */}
      <section style={{ padding:'72px 20px' }}>
        <div className="container-xl" style={{ maxWidth:760, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:30, fontWeight:900, color:'var(--text)', marginBottom:44, letterSpacing:'-0.02em' }}>Vooom vs traditional courier</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {[
              { label:'Cost', vooom:'Set your own price. Carriers bid. Typically 40-70% cheaper.', courier:'Fixed high rates. Nigeria-UK DHL: ₦80,000+' },
              { label:'Speed', vooom:'Carriers already travelling. Same-day local, next-week international.', courier:'Processing delays, customs backlogs, tracking gaps.' },
              { label:'Trust', vooom:'Identity-verified carriers, public reviews, escrow payment.', courier:'Anonymous handlers, no accountability if it breaks.' },
              { label:'Flexibility', vooom:'Any item type. Any route. Any vehicle type.', courier:'Standard dimensions only. Restricted item lists.' },
            ].map(row => (
              <div key={row.label} className="card" style={{ padding:22 }}>
                <p style={{ fontWeight:800, fontSize:13, color:'var(--rose)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>{row.label}</p>
                <div style={{ marginBottom:14, padding:12, background:'#f0fdf4', borderRadius:10 }}>
                  <p style={{ fontWeight:700, fontSize:12, color:'#16a34a', marginBottom:4 }}>Vooom</p>
                  <p style={{ fontSize:13.5, color:'#166534', margin:0, lineHeight:1.5 }}>{row.vooom}</p>
                </div>
                <div style={{ padding:12, background:'#fef2f2', borderRadius:10 }}>
                  <p style={{ fontWeight:700, fontSize:12, color:'#dc2626', marginBottom:4 }}>Traditional courier</p>
                  <p style={{ fontSize:13.5, color:'#991b1b', margin:0, lineHeight:1.5 }}>{row.courier}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIASPORA SECTION */}
      <section style={{ padding:'72px 20px', background:'linear-gradient(160deg,#0f0720,#1a0933)' }}>
        <div className="container-xl" style={{ maxWidth:860, margin:'0 auto', textAlign:'center' }}>
          <Globe size={44} style={{ color:'#ff6b8f', marginBottom:18 }} />
          <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, color:'white', marginBottom:18, letterSpacing:'-0.02em' }}>
            Built for Nigerians everywhere
          </h2>
          <p style={{ color:'rgba(255,255,255,0.65)', lineHeight:1.8, fontSize:16, marginBottom:32, maxWidth:640, marginLeft:'auto', marginRight:'auto' }}>
            Whether you are in London, Houston, Toronto, or Dubai, someone in your network is travelling to Nigeria. And someone in Nigeria needs to send something to you. Vooom is the bridge. No DHL. No FedEx. Just people helping people, the Nigerian way.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:40 }}>
            {[
              { flag:'UK', route:'UK ↔ Nigeria', desc:'Jollof seasoning, documents, electronics, fabrics' },
              { flag:'US', route:'US ↔ Nigeria', desc:'Japa community parcels, university documents, medicines' },
              { flag:'CA', route:'Canada ↔ Nigeria', desc:'Toronto-Lagos, Calgary-Abuja, Ottawa-Enugu' },
              { flag:'EU', route:'Europe ↔ Nigeria', desc:'Germany, Netherlands, Italy and more' },
            ].map(c => (
              <div key={c.route} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:20, textAlign:'left' }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.15)', borderRadius:8, padding:'4px 10px', fontWeight:800, fontSize:13, color:'white', letterSpacing:'0.04em', marginBottom:4 }}>{c.flag}</div>
                <p style={{ color:'white', fontWeight:800, fontSize:15, margin:'10px 0 5px' }}>{c.route}</p>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, margin:0, lineHeight:1.5 }}>{c.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/vooom/browse" className="btn-primary" style={{ padding:'15px 36px', fontSize:16, borderRadius:12, display:'inline-flex', alignItems:'center', gap:8 }}>
            Find a carrier now <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:'72px 20px' }}>
        <div className="container-xl" style={{ maxWidth:760, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:30, fontWeight:900, color:'var(--text)', marginBottom:40, letterSpacing:'-0.02em' }}>Frequently asked questions</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {faqs.map((f, i) => (
              <div key={i} className="card" style={{ padding:22 }}>
                <p style={{ fontWeight:700, fontSize:15.5, color:'var(--text)', marginBottom:8 }}>{f.q}</p>
                <p style={{ fontSize:14.5, color:'var(--muted)', lineHeight:1.7, margin:0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding:'80px 20px', textAlign:'center', background:'var(--surface)' }}>
        <div className="container-xl" style={{ maxWidth:620, margin:'0 auto' }}>
          <div style={{ width:64, height:64, borderRadius:16, background:'linear-gradient(135deg,#ff2d62,#ff6b8f)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Zap size={30} style={{ color:'white' }} />
          </div>
          <h2 style={{ fontSize:30, fontWeight:900, color:'var(--text)', marginBottom:14, letterSpacing:'-0.02em' }}>Ready to Vooom?</h2>
          <p style={{ color:'var(--muted)', marginBottom:30, fontSize:16, lineHeight:1.6 }}>
            Post your logistics request in two minutes. Get bids from verified carriers already on your route. Pay only when delivered.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/vooom/browse" className="btn-primary" style={{ padding:'14px 30px', fontSize:15, borderRadius:12, display:'inline-flex', alignItems:'center', gap:8 }}>
              Browse carriers <ArrowRight size={16} />
            </Link>
            <Link to="/vooom/post" style={{ padding:'14px 30px', fontSize:15, borderRadius:12, background:'white', border:'1.5px solid var(--border-light)', color:'var(--text)', fontWeight:700, textDecoration:'none' }}>
              Post a request
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
