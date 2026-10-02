import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Truck, Package, MapPin, Calendar, ChevronLeft, ChevronRight, Plus, Zap , Car, Bus, Plane, Ship, Bike , Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vooomApi } from '../../utils/api';
import SEO from '../../components/seo/SEO';
import toast from 'react-hot-toast';

const VEHICLE_LABELS = { any:'Any Vehicle', car:'Car', truck:'Truck', van:'Van', motorcycle:'Motorcycle', bus:'Bus', flight:'Flight', ship:'Ship' };
const VEHICLE_ICONS = { any: Car, car: Car, truck: Truck, van: Truck, motorcycle: Bike, bus: Bus, flight: Plane, ship: Ship };
const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
const COUNTRIES = ['Nigeria','United Kingdom','United States','Canada','Germany','Italy','Netherlands','Ireland','France','Australia','UAE','South Africa','Ghana','Kenya'];

function VooomCard({ task }) {
  const navigate = useNavigate();
  const bidCount = task.bids?.[0]?.count || 0;
  const isIntl = task.is_international;

  return (
    <div
      onClick={() => navigate(`/vooom/${task.id}`)}
      style={{
        background:'white', borderRadius:16, border:'1.5px solid #f0e6f5',
        padding:'20px 24px', cursor:'pointer', transition:'all 0.18s',
        display:'flex', alignItems:'center', gap:20,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#ff2d62'; e.currentTarget.style.boxShadow='0 4px 20px rgba(255,45,98,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='#f0e6f5'; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Vehicle icon */}
      <div style={{ width:54, height:54, borderRadius:14, background: isIntl ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'linear-gradient(135deg,#ff2d62,#c41445)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
        { (() => { const VIcon = VEHICLE_ICONS[task.vehicle_type] || Package; return <VIcon size={15} />; })() }
      </div>

      {/* Main content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
          <span style={{ fontWeight:900, fontSize:16, color:'var(--text)' }}>
            {task.from_city}{task.from_country !== 'Nigeria' ? `, ${task.from_country}` : ''} → {task.to_city}{task.to_country !== 'Nigeria' ? `, ${task.to_country}` : ''}
          </span>
          {isIntl && (
            <span style={{ background:'#ede9fe', color:'#6d28d9', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>International</span>
          )}
          <span style={{ background: task.status === 'open' ? '#f0fdf4' : '#eff6ff', color: task.status === 'open' ? '#16a34a' : '#2563eb', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>
            {task.status === 'open' ? 'Open' : 'Bidding'}
          </span>
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:13, color:'var(--muted)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Package size={13} /> {task.item_type}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Truck size={13} /> {VEHICLE_LABELS[task.vehicle_type]}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={13} /> {format(new Date(task.travel_date), 'MMM d, yyyy')}</span>
          {bidCount > 0 && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Users size={13} /> {bidCount} bid{bidCount !== 1 ? 's' : ''}</span>}
        </div>
        <p style={{ fontSize:13, color:'var(--muted)', margin:'6px 0 0', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:500 }}>
          {task.item_description}
        </p>
      </div>

      {/* Price + requester */}
      <div style={{ flexShrink:0, textAlign:'right' }}>
        {task.proposed_price && (
          <p style={{ fontWeight:900, fontSize:18, color:'var(--rose)', margin:'0 0 4px' }}>
            ₦{Number(task.proposed_price).toLocaleString()}
          </p>
        )}
        <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>
          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', marginTop:6 }}>
          {task.requester?.avatar_url
            ? <img src={task.requester.avatar_url} alt="" style={{ width:24, height:24, borderRadius:'50%', objectFit:'cover' }} />
            : <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#ff2d62,#c41445)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'white', fontWeight:800 }}>{(task.requester?.full_name || 'U')[0]}</div>
          }
          <span style={{ fontSize:12, color:'var(--muted)', fontWeight:600 }}>{task.requester?.full_name?.split(' ')[0] || 'Requester'}</span>
        </div>
      </div>
      <ChevronRight size={18} style={{ color:'var(--muted)', flexShrink:0 }} />
    </div>
  );
}

export default function VooomBrowse() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [fromState, setFromState] = useState('');
  const [toState, setToState] = useState('');
  const [fromCountry, setFromCountry] = useState('');
  const [toCountry, setToCountry] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [intlOnly, setIntlOnly] = useState(false);
  const debounce = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await vooomApi.list({
        page, limit: 12,
        search: search || undefined,
        from_state: fromState || undefined,
        to_state: toState || undefined,
        from_country: fromCountry || undefined,
        to_country: toCountry || undefined,
        vehicle_type: vehicleType || undefined,
        is_international: intlOnly ? 'true' : undefined,
      });
      setTasks(data.tasks || []);
      setPagination(data.pagination || {});
    } catch { setTasks([]); } finally { setLoading(false); }
  }, [page, search, fromState, toState, fromCountry, toCountry, vehicleType, intlOnly]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

  const activeFilters = [fromState, toState, fromCountry, toCountry, vehicleType, intlOnly].filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SEO
        title="Browse Vooom Logistics Requests: Find Carriers Going Your Way | Taskeeu"
        description="Browse live Vooom logistics requests across Nigeria and internationally. Find someone going Lagos to Abuja, UK to Nigeria, US to Nigeria. Bid and earn or find a carrier for your parcel."
        canonical="https://taskeeu.com/vooom/browse"
        keywords="vooom logistics browse, find carrier nigeria, logistics requests nigeria, peer delivery nigeria, uk nigeria parcel carrier"
      />

      {/* Header */}
      <div className="vooom-browse-hero" style={{ background: 'linear-gradient(135deg,#0f0720,#1a0933)', padding: '124px 20px 52px', position:'relative', overflow:'hidden' }}>
        <div className="container-xl" style={{ maxWidth: 900 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <Zap size={20} style={{ color:'#ff6b8f' }} />
            <span style={{ color:'#ff6b8f', fontWeight:700, fontSize:13, letterSpacing:'0.06em', textTransform:'uppercase' }}>Vooom by Taskeeu</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap', paddingBottom:34 }}>
            <div style={{ maxWidth:560 }}>
              <h1 style={{ color:'white', fontWeight:900, fontSize:'clamp(26px,5vw,40px)', margin:0, letterSpacing:'-0.03em', lineHeight:1.15 }}>Logistics requests</h1>
              <p style={{ color:'rgba(255,255,255,0.62)', fontSize:15.5, margin:'12px 0 0', lineHeight:1.7 }}>
                Find someone already travelling your route. Filter by state, country, or vehicle to match a carrier heading exactly where your item needs to go.
              </p>
              <p style={{ color:'rgba(255,255,255,0.42)', fontSize:13, margin:'10px 0 0', fontWeight:600 }}>
                {pagination.total ? `${pagination.total.toLocaleString()} active requests` : 'Browse active requests'}
              </p>
            </div>
            <Link to="/vooom/post" className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'11px 22px', borderRadius:12, fontSize:14 }}>
              <Plus size={15} /> Post request
            </Link>
          </div>

          {/* Filter bar — always visible on desktop, toggle on mobile */}
          <div style={{ background:'white', borderRadius:'12px 12px 0 0', overflow:'hidden' }}>
            {/* Search row */}
            <div style={{ padding:'14px 16px', display:'flex', gap:12, alignItems:'center', borderBottom:'1px solid #f1f5f9' }}>
              <Search size={18} style={{ color:'var(--muted)', flexShrink:0 }} />
              <input
                value={searchInput}
                onChange={e => {
                  setSearchInput(e.target.value);
                  clearTimeout(debounce.current);
                  debounce.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 380);
                }}
                placeholder="Search route, item type, or description…"
                style={{ flex:1, border:'none', outline:'none', fontSize:15, background:'transparent', color:'var(--text)' }}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:2 }}>
                  <X size={16} />
                </button>
              )}
              {/* Mobile: filter toggle */}
              <button onClick={() => setMobileFilterOpen(v => !v)}
                className="vooom-filter-mobile-btn"
                style={{ display:'none', alignItems:'center', gap:6, background: mobileFilterOpen ? '#fff0f4' : 'var(--surface)', border:`1.5px solid ${mobileFilterOpen ? '#ff2d62' : 'var(--border-light)'}`, borderRadius:10, padding:'8px 14px', cursor:'pointer', fontWeight:700, fontSize:13, color: mobileFilterOpen ? '#ff2d62' : 'var(--text)', flexShrink:0 }}>
                <SlidersHorizontal size={14} /> Filters {activeFilters > 0 && <span style={{ background:'#ff2d62', color:'white', borderRadius:'50%', width:18, height:18, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>{activeFilters}</span>}
              </button>
            </div>

            {/* Filters grid — always visible on desktop, collapsible on mobile */}
            <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:12, alignItems:'end', borderBottom: activeFilters > 0 ? '1px solid #f1f5f9' : 'none' }} className={mobileFilterOpen ? '' : 'vooom-filter-grid'}>
              {[
                { label:'From state', value:fromState, set:setFromState, opts:NIGERIAN_STATES, placeholder:'All states' },
                { label:'To state', value:toState, set:setToState, opts:NIGERIAN_STATES, placeholder:'All states' },
                { label:'From country', value:fromCountry, set:setFromCountry, opts:['Nigeria','United Kingdom','United States','Canada','Germany','Ireland','Netherlands','Australia','UAE','Ghana','South Africa'], placeholder:'All countries' },
                { label:'To country', value:toCountry, set:setToCountry, opts:['Nigeria','United Kingdom','United States','Canada','Germany','Ireland','Netherlands','Australia','UAE','Ghana','South Africa'], placeholder:'All countries' },
                { label:'Vehicle type', value:vehicleType, set:setVehicleType, opts:Object.entries(VEHICLE_LABELS).map(([v,l])=>({v,l})), placeholder:'All vehicles', isVehicle:true },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }}>{f.label}</label>
                  <select value={f.value} onChange={e => { f.set(e.target.value); setPage(1); }} className="input" style={{ fontSize:13 }}>
                    <option value="">{f.placeholder}</option>
                    {f.isVehicle ? f.opts.map(({v,l}) => <option key={v} value={v}>{l}</option>) : f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display:'flex', flexDirection:'column', gap:8, justifyContent:'flex-end' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'9px 0' }}>
                  <input type="checkbox" checked={intlOnly} onChange={e => { setIntlOnly(e.target.checked); setPage(1); }} style={{ accentColor:'var(--rose)', width:16, height:16 }} />
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>International only</span>
                </label>
              </div>
            </div>
            {activeFilters > 0 && (
              <div style={{ padding:'8px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>{activeFilters} filter{activeFilters > 1 ? 's' : ''} active</p>
                <button onClick={() => { setFromState(''); setToState(''); setFromCountry(''); setToCountry(''); setVehicleType(''); setIntlOnly(false); setPage(1); }}
                  style={{ background:'none', border:'none', color:'var(--rose)', fontWeight:700, fontSize:13, cursor:'pointer', padding:0 }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
          <style>{`
            @media (max-width: 640px) {
              .vooom-filter-mobile-btn { display: flex !important; }
              .vooom-filter-grid { display: none !important; }
              .vooom-browse-hero { padding: 96px 20px 36px !important; }
            }
          `}</style>
        </div>
      </div>

      {/* Listing */}
      <div className="container-xl" style={{ maxWidth:900, padding:'24px 20px' }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background:'white', borderRadius:16, padding:'20px 24px', height:90, animation:'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <Package size={48} style={{ color:"#e2e8f0" }} />
            <p style={{ fontWeight:800, fontSize:18, color:'var(--text)', marginTop:16 }}>No requests found</p>
            <p style={{ color:'var(--muted)', marginBottom:24 }}>Be the first to post a logistics request for this route.</p>
            <Link to="/vooom/post" className="btn-primary" style={{ padding:'12px 24px', borderRadius:12, fontSize:14, display:'inline-flex', gap:7, alignItems:'center' }}>
              <Plus size={15} /> Post a request
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
              {tasks.map(task => <VooomCard key={task.id} task={task} />)}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, paddingTop:12, flexWrap:'wrap' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width:36, height:36, borderRadius:10, border:'1.5px solid var(--border-light)', background:'white', cursor: page === 1 ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: page === 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={16} />
                </button>
                {(() => {
                  const total = pagination.pages;
                  const window = 5;
                  let start = Math.max(1, page - Math.floor(window / 2));
                  let end = Math.min(total, start + window - 1);
                  if (end - start < window - 1) start = Math.max(1, end - window + 1);
                  const pages = [];
                  if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
                  for (let p = start; p <= end; p++) pages.push(p);
                  if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
                  return pages.map((p, i) => p === '...' ? (
                    <span key={`e${i}`} style={{ padding:'0 4px', color:'var(--muted)', fontSize:14 }}>…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ minWidth:36, height:36, borderRadius:10, border:`1.5px solid ${page === p ? '#ff2d62' : 'var(--border-light)'}`, background: page === p ? '#ff2d62' : 'white', color: page === p ? 'white' : 'var(--text)', cursor:'pointer', fontWeight:700, fontSize:14 }}>
                      {p}
                    </button>
                  ));
                })()}
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  style={{ width:36, height:36, borderRadius:10, border:'1.5px solid var(--border-light)', background:'white', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: page === pagination.pages ? 0.4 : 1 }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
