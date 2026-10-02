import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Zap, ArrowRight, Car, Truck, Bus, Plane, Ship, Bike, Package, CheckCircle} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vooomApi } from '../utils/api';
import toast from 'react-hot-toast';

// VEHICLE_ICONS are Lucide components — imported above
const VEHICLE_ICON_MAP = { any: Car, car: Car, truck: Truck, van: Truck, motorcycle: Bike, bus: Bus, flight: Plane, ship: Ship };

function VooomMiniCard({ task, type }) {
  const navigate = useNavigate();
  const isRequester = type === 'requester';
  // For tasker type: task = bid row, task.task = the vooom_task
  const vtask = isRequester ? task : task.task;
  const statusColor = isRequester
    ? (task.status === 'open' ? '#16a34a' : task.status === 'bidding' ? '#ca8a04' : task.status === 'ongoing' ? '#2563eb' : '#6b7280')
    : (task.status === 'accepted' ? '#16a34a' : task.status === 'pending' ? '#ca8a04' : '#6b7280');
  const statusLabel = isRequester ? task.status : `bid: ${task.status}`;

  return (
    <div onClick={() => navigate(`/vooom/${vtask?.id || ''}`)}
      style={{ background:'var(--surface)', border:'1.5px solid var(--border-light)', borderRadius:14, padding:'14px 18px', cursor: vtask?.id ? 'pointer' : 'default', display:'flex', gap:14, alignItems:'center' }}
      onMouseEnter={e => { if (vtask?.id) e.currentTarget.style.borderColor='#ff2d62'; }}
      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-light)'}
    >
      { (() => { const VI = VEHICLE_ICON_MAP[vtask?.vehicle_type] || Package; return <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#0f0720,#1a0933)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><VI size={18} style={{ color:'#ff6b8f' }} /></div>; })() }
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontWeight:700, fontSize:14, color:'var(--text)', margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {vtask ? `${vtask.from_city} → ${vtask.to_city}` : 'Vooom request'}
        </p>
        <div style={{ display:'flex', gap:10, fontSize:12, color:'var(--muted)' }}>
          <span>{vtask?.item_type || ''}</span>
          <span>·</span>
          <span style={{ textTransform:'capitalize', fontWeight:600, color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>
      {isRequester && task.bids?.length > 0 && (
        <span style={{ background:'#fff0f4', color:'var(--rose)', fontSize:12, fontWeight:700, padding:'3px 9px', borderRadius:20, flexShrink:0 }}>
          {task.bids.length} bid{task.bids.length !== 1 ? 's' : ''}
        </span>
      )}
      {!isRequester && task.amount && (
        <span style={{ color:'var(--rose)', fontSize:13, fontWeight:800, flexShrink:0 }}>
          ₦{Number(task.amount).toLocaleString()}
        </span>
      )}
      <ChevronRight size={16} style={{ color:'var(--muted)', flexShrink:0 }} />
    </div>
  );
}

export function SwitchToRequesterModal({ onClose, onSuccess }) {
  const [accepting, setAccepting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSwitch = async () => {
    if (!agreed) { toast.error('Please agree to the terms first'); return; }
    setAccepting(true);
    try {
      await vooomApi.switchToRequester(true);
      toast.success('Requester account activated! You can now switch dashboards.');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not activate requester account');
    } finally { setAccepting(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,7,32,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:20, padding:32, maxWidth:500, width:'100%', boxShadow:'0 20px 60px rgba(15,7,32,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#0f0720,#1a0933)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Zap size={26} style={{ color:'#ff6b8f' }} />
          </div>
          <h2 style={{ fontWeight:900, fontSize:22, color:'var(--text)', marginBottom:8, letterSpacing:'-0.02em' }}>Post a Vooom request</h2>
          <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.65 }}>
            To post a logistics request, you need a requester account. We will create one linked to your tasker profile — you can switch between both dashboards at any time.
          </p>
        </div>

        <div style={{ background:'var(--surface)', borderRadius:14, padding:18, marginBottom:20 }}>
          <p style={{ fontWeight:700, fontSize:14, color:'var(--text)', marginBottom:10 }}>What this means:</p>
          {[
            'A requester account is created with your existing details',
            'You can switch between tasker and requester dashboards anytime',
            'You can post Vooom logistics requests as a requester',
            'Your tasker profile and earnings are completely unaffected',
          ].map((t, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
              <CheckCircle size={14} style={{ color:'#16a34a', flexShrink:0 }} />
              <span style={{ fontSize:13.5, color:'var(--muted)', lineHeight:1.5 }}>{t}</span>
            </div>
          ))}
        </div>

        <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', marginBottom:20 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:2, accentColor:'var(--rose)', width:16, height:16, flexShrink:0 }} />
          <span style={{ fontSize:13.5, color:'var(--muted)', lineHeight:1.55 }}>
            I agree to the Taskeeu <Link to="/terms" style={{ color:'var(--rose)', fontWeight:700 }}>Terms of Service</Link> for operating a requester account and understand that my requester and tasker accounts are linked.
          </span>
        </label>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:12, background:'var(--surface)', border:'1.5px solid var(--border-light)', fontWeight:700, fontSize:14, cursor:'pointer', color:'var(--text)' }}>
            Cancel
          </button>
          <button onClick={handleSwitch} disabled={!agreed || accepting} className="btn-primary" style={{ flex:1, padding:'12px', borderRadius:12, fontSize:14 }}>
            {accepting ? 'Activating…' : 'Activate & switch'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VooomDashTab({ user, role }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSwitch, setShowSwitch] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (role === 'requester') {
          const { data } = await vooomApi.myRequester();
          setTasks(data.tasks || []);
        } else {
          // Tasker: load bids AND any requests they posted (if they switched)
          const [bidsRes, postsRes] = await Promise.allSettled([
            vooomApi.myTasker(),
            vooomApi.myRequester(), // Their own posted requests (if dual-account)
          ]);
          if (bidsRes.status === 'fulfilled') setBids(bidsRes.value.data.bids || []);
          if (postsRes.status === 'fulfilled') setTasks(postsRes.value.data.tasks || []);
        }
      } catch {} finally { setLoading(false); }
    };
    loadData();
  }, [role]);

  const handlePostClick = () => {
    if (role === 'requester') { navigate('/vooom/post'); return; }
    // Tasker wants to post — needs requester account
    if (user?.has_requester_account) {
      // Already has one — prompt to switch (handled by parent via toggle)
      toast('Use the dashboard toggle to switch to your requester account, then post from there.', { icon:'', duration:5000 });
    } else {
      setShowSwitch(true);
    }
  };

  const handleSwitchSuccess = () => {
    setShowSwitch(false);
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: 760 }}>
      {showSwitch && <SwitchToRequesterModal onClose={() => setShowSwitch(false)} onSuccess={handleSwitchSuccess} />}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <Zap size={18} style={{ color:'var(--rose)' }} />
            <h2 style={{ fontWeight:900, fontSize:20, color:'var(--text)', margin:0, letterSpacing:'-0.02em' }}>Vooom Logistics</h2>
          </div>
          <p style={{ color:'var(--muted)', fontSize:13.5, margin:0 }}>
            {role === 'requester' ? 'Your logistics requests. Verified carriers bid to carry your items.' : 'Logistics requests you have bid on. Find new requests to carry.'}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link to="/vooom/browse" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, background:'var(--surface)', border:'1.5px solid var(--border-light)', color:'var(--text)', fontWeight:700, fontSize:13, textDecoration:'none' }}>
            Browse requests
          </Link>
          <button onClick={handlePostClick} className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, fontSize:13 }}>
            <Plus size={14} /> Post request
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:72, background:'var(--surface)', borderRadius:14, animation:'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : (
        <>
          {/* Tasker bids */}
          {role === 'tasker' && (
            <div style={{ marginBottom:20 }}>
              <p style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Your bids ({bids.length})</p>
              {bids.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px', background:'var(--surface)', borderRadius:14, border:'1.5px solid var(--border-light)' }}>
                  <p style={{ color:'var(--muted)', fontSize:13, margin:'0 0 10px' }}>No bids yet. Browse open requests.</p>
                  <Link to="/vooom/browse" className="btn-primary" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:10, fontSize:13, textDecoration:'none' }}>
                    Browse requests <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {bids.map((item, i) => <VooomMiniCard key={i} task={item} type="tasker" />)}
                </div>
              )}
            </div>
          )}

          {/* Requester view OR dual-account tasker posted requests */}
          {(role === 'requester' || tasks.length > 0) && (
            <div>
              {role === 'tasker' && <p style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Your posted requests ({tasks.length})</p>}
              {tasks.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 20px', background:'var(--surface)', borderRadius:18, border:'1.5px solid var(--border-light)' }}>
                  <Package size={44} style={{ color:'#e2e8f0', display:'block', margin:'0 auto 12px' }} />
                  <p style={{ fontWeight:800, fontSize:17, color:'var(--text)', margin:'14px 0 8px' }}>No Vooom requests yet</p>
                  <p style={{ color:'var(--muted)', fontSize:14, marginBottom:20 }}>Post a logistics request and carriers will bid to carry your item.</p>
                  <button onClick={handlePostClick} className="btn-primary" style={{ padding:'11px 24px', borderRadius:12, fontSize:14, display:'inline-flex', alignItems:'center', gap:7 }}>
                    <Plus size={15} /> Post your first Vooom request
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {tasks.map((item, i) => <VooomMiniCard key={i} task={item} type="requester" />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Vooom info card */}
      <div style={{ marginTop:24, background:'linear-gradient(135deg,#0f0720,#1a0933)', borderRadius:18, padding:'22px 24px', display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <p style={{ color:'white', fontWeight:800, fontSize:15, margin:'0 0 5px' }}>What is Vooom?</p>
          <p style={{ color:'rgba(255,255,255,0.55)', fontSize:13, margin:0, lineHeight:1.55 }}>
            Nigeria's peer logistics network. Find carriers already going your way — locally or internationally. Cheaper than courier, protected by escrow.
          </p>
        </div>
        <Link to="/vooom" style={{ flexShrink:0, display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'white', fontWeight:700, fontSize:13, textDecoration:'none' }}>
          Learn more <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
