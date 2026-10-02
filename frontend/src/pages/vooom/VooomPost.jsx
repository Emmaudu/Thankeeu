import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Truck, Calendar, DollarSign, FileText, Zap } from 'lucide-react';
import { vooomApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/seo/SEO';
import toast from 'react-hot-toast';

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
const COUNTRIES = ['Nigeria','United Kingdom','United States','Canada','Germany','Italy','Netherlands','Ireland','France','Australia','UAE','South Africa','Ghana','Kenya','Other'];
const VEHICLE_TYPES = ['any','car','truck','van','motorcycle','bus','flight','ship'];
const VEHICLE_LABELS = { any:'Any (flexible)', car:'Car', truck:'Truck / Lorry', van:'Van', motorcycle:'Motorcycle', bus:'Bus', flight:'Flight', ship:'Ship / Ferry' };

const DRAFT_KEY = 'vooom_post_draft';

export default function VooomPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [form, setForm] = useState({
    from_city: '', from_state: '', from_country: 'Nigeria',
    to_city: '', to_state: '', to_country: 'Nigeria',
    travel_date: '', vehicle_type: 'any',
    item_type: '', item_description: '', proposed_price: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const required = ['from_city','from_state','from_country','to_city','to_state','to_country','travel_date','vehicle_type','item_type','item_description'];
    for (const k of required) {
      if (!form[k]?.trim()) {
        toast.error(`Please fill in: ${k.replace(/_/g,' ')}`);
        return;
      }
    }
    if (new Date(form.travel_date) < new Date()) {
      toast.error('Travel date must be in the future');
      return;
    }
    // Gate on auth — show sign-in panel, save draft, don't block form earlier
    if (!user) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setShowAuth(true);
      return;
    }
    // Tasker without requester account — prompt to activate
    if (user.role === 'tasker' && !user.has_requester_account) {
      toast.error('Activate a requester account first from your Vooom dashboard tab.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await vooomApi.create({
        ...form,
        proposed_price: form.proposed_price ? Number(form.proposed_price) : null,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      toast.success('Request posted! Carriers will bid shortly.');
      navigate(`/vooom/${data.task.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post request');
    } finally { setSubmitting(false); }
  };

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0,16);

  // Auth gate — shown after user fills the form and clicks Post
  if (showAuth) return (
    <div className="min-h-screen" style={{ background:'var(--surface)', paddingTop:80 }}>
      <div className="container-xl py-12">
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <div className="card p-8 text-center">
            <div style={{ width:72, height:72, borderRadius:20, margin:'0 auto 20px', background:'rgba(255,45,98,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={32} style={{ color:'var(--rose)' }} />
            </div>
            <h2 style={{ fontWeight:900, fontSize:22, color:'var(--text)', marginBottom:8, letterSpacing:'-0.03em' }}>Almost there. Sign in to post</h2>
            <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.7, marginBottom:28 }}>
              Your request details are saved. Create a free account or sign in to publish and start receiving carrier bids.
            </p>
            <div style={{ background:'var(--surface)', borderRadius:14, padding:'14px 18px', marginBottom:24, textAlign:'left' }}>
              <p style={{ fontSize:11, fontWeight:800, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Your request</p>
              <p style={{ fontWeight:700, color:'var(--text)', fontSize:15, marginBottom:2 }}>{form.item_type || 'Logistics request'}</p>
              <p style={{ color:'var(--muted)', fontSize:13 }}>{form.from_city}{form.from_country !== 'Nigeria' ? `, ${form.from_country}` : ''} to {form.to_city}{form.to_country !== 'Nigeria' ? `, ${form.to_country}` : ''}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <Link to="/requester/signup?next=/vooom/post"
                onClick={() => sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))}
                className="btn-primary w-full"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, textDecoration:'none' }}>
                Create Free Account and Post
              </Link>
              <Link to="/requester/login?next=/vooom/post"
                onClick={() => sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form))}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px 24px', borderRadius:16, border:'2px solid var(--border)', color:'var(--text)', fontWeight:700, fontSize:14, textDecoration:'none' }}>
                Sign In to Existing Account
              </Link>
              <button onClick={() => setShowAuth(false)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, cursor:'pointer', marginTop:4 }}>
                Go back and edit request
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)' }}>
      <SEO title="Post a Vooom Logistics Request | Taskeeu" description="Post your logistics request on Vooom by Taskeeu. Find verified carriers already travelling your route. Local or international." canonical="https://taskeeu.com/vooom/post" />

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f0720,#1a0933)', padding:'88px 20px 28px' }}>
        <div className="container-xl" style={{ maxWidth:700 }}>
          <button onClick={() => navigate('/vooom/browse')} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, padding:'7px 14px', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:13, fontWeight:600, marginBottom:18 }}>
            <ArrowLeft size={14} /> Back to browse
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <Zap size={18} style={{ color:'#ff6b8f' }} />
            <span style={{ color:'#ff6b8f', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>Vooom by Taskeeu</span>
          </div>
          <h1 style={{ color:'white', fontWeight:900, fontSize:'clamp(22px,4vw,30px)', margin:0, letterSpacing:'-0.02em' }}>Post a logistics request</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:'6px 0 0' }}>Verified carriers already travelling your route will bid to carry your item.</p>
        </div>
      </div>

      <div className="container-xl" style={{ maxWidth:700, padding:'88px 20px 28px' }}>
        <div className="card" style={{ padding:'28px 28px' }}>

          {/* Route section */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <MapPin size={16} style={{ color:'var(--rose)' }} />
              <h2 style={{ fontWeight:800, fontSize:15, color:'var(--text)', margin:0 }}>Route</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>From country *</label>
                <select value={form.from_country} onChange={e => set('from_country', e.target.value)} className="input" style={{ fontSize:14 }}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>To country *</label>
                <select value={form.to_country} onChange={e => set('to_country', e.target.value)} className="input" style={{ fontSize:14 }}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>From city *</label>
                <input value={form.from_city} onChange={e => set('from_city', e.target.value)} placeholder="e.g. Ikeja, London, Houston" className="input" style={{ fontSize:14 }} />
              </div>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>To city *</label>
                <input value={form.to_city} onChange={e => set('to_city', e.target.value)} placeholder="e.g. Victoria Island, Lagos" className="input" style={{ fontSize:14 }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>From state / region *</label>
                {form.from_country === 'Nigeria' ? (
                  <select value={form.from_state} onChange={e => set('from_state', e.target.value)} className="input" style={{ fontSize:14 }}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form.from_state} onChange={e => set('from_state', e.target.value)} placeholder="e.g. Greater London" className="input" style={{ fontSize:14 }} />
                )}
              </div>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>To state / region *</label>
                {form.to_country === 'Nigeria' ? (
                  <select value={form.to_state} onChange={e => set('to_state', e.target.value)} className="input" style={{ fontSize:14 }}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form.to_state} onChange={e => set('to_state', e.target.value)} placeholder="e.g. Texas" className="input" style={{ fontSize:14 }} />
                )}
              </div>
            </div>
          </div>

          {/* Journey details */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Truck size={16} style={{ color:'var(--rose)' }} />
              <h2 style={{ fontWeight:800, fontSize:15, color:'var(--text)', margin:0 }}>Journey details</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Travel date & time *</label>
                <input type="datetime-local" value={form.travel_date} min={minDate} onChange={e => set('travel_date', e.target.value)} className="input" style={{ fontSize:14 }} />
              </div>
              <div>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Preferred vehicle *</label>
                <select value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)} className="input" style={{ fontSize:14 }}>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{VEHICLE_LABELS[v]}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Item section */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Package size={16} style={{ color:'var(--rose)' }} />
              <h2 style={{ fontWeight:800, fontSize:15, color:'var(--text)', margin:0 }}>What needs to be carried</h2>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Item type *</label>
              <input value={form.item_type} onChange={e => set('item_type', e.target.value)} placeholder="e.g. Documents, Clothing, Electronics, Foodstuffs, Medicines" className="input" style={{ fontSize:14 }} />
            </div>
            <div>
              <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>Description *</label>
              <textarea value={form.item_description} onChange={e => set('item_description', e.target.value)} rows={4} className="input" style={{ resize:'vertical', fontSize:14 }} placeholder="Describe the item clearly. Size, weight, any fragile/sensitive notes. The more detail, the better bids you get." />
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <DollarSign size={16} style={{ color:'var(--rose)' }} />
              <h2 style={{ fontWeight:800, fontSize:15, color:'var(--text)', margin:0 }}>Proposed price</h2>
            </div>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontWeight:800, fontSize:14, color:'var(--muted)' }}>₦</span>
              <input type="number" value={form.proposed_price} onChange={e => set('proposed_price', e.target.value)} placeholder="Leave blank to let carriers bid freely" className="input" style={{ fontSize:14, paddingLeft:32 }} />
            </div>
            <p style={{ fontSize:12, color:'var(--muted)', marginTop:6 }}>A proposed price attracts more bids. You can always negotiate via chat before accepting.</p>
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ width:'100%', padding:'14px', fontSize:15, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {submitting ? 'Posting your request…' : 'Post Vooom request'}
          </button>
          <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginTop:12 }}>Free to post. Verified carriers will bid within hours. Escrow payment protects you.</p>
        </div>
      </div>
    </div>
  );
}
