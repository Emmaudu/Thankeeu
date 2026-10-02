import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, Calendar, MapPin, Clock, Shield, Zap, MessageSquare, CheckCircle, XCircle , Car, Bus, Plane, Ship, Bike } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vooomApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/seo/SEO';
import toast from 'react-hot-toast';

const VEHICLE_LABELS = { any:'Any Vehicle', car:'Car', truck:'Truck', van:'Van', motorcycle:'Motorcycle', bus:'Bus', flight:'Flight', ship:'Ship' };
const VEHICLE_ICONS = { any: Car, car: Car, truck: Truck, van: Truck, motorcycle: Bike, bus: Bus, flight: Plane, ship: Ship };

export default function VooomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidding, setBidding] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [isFunded, setIsFunded] = useState(false);

  const fundDelivery = async () => {
    const amt = Number(fundAmount);
    if (!amt || amt < 100) { toast.error('Enter a valid amount (minimum ₦100)'); return; }
    setFunding(true);
    try {
      const { data } = await vooomApi.fundTask(id, amt);
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast.success('Payment initiated!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
    } finally { setFunding(false); }
  };

  const load = async () => {
    try {
      const { data } = await vooomApi.get(id);
      setTask(data.task);
      setIsFunded(!!data.task?.funded);
    } catch { toast.error('Could not load request'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const placeBid = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!bidMessage.trim()) { toast.error('Please add a message explaining why you are the right carrier'); return; }
    setBidding(true);
    try {
      await vooomApi.bid(id, { amount: bidAmount ? Number(bidAmount) : null, message: bidMessage });
      toast.success('Bid placed! The requester will review your profile.');
      setBidAmount(''); setBidMessage('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place bid');
    } finally { setBidding(false); }
  };

  const acceptBid = async (bidId) => {
    if (!window.confirm('Accept this carrier? All other bids will be closed.')) return;
    setAccepting(bidId);
    try {
      await vooomApi.acceptBid(id, bidId);
      toast.success('Carrier accepted! Use the Chat tab in your dashboard to coordinate the handover.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept bid');
    } finally { setAccepting(null); }
  };

  const confirmDelivery = async () => {
    if (!window.confirm('Confirm delivery? This releases payment to the carrier and cannot be undone.')) return;
    setCompleting(true);
    try {
      await vooomApi.complete(id);
      toast.success('Delivery confirmed! Payment released to carrier.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm delivery');
    } finally { setCompleting(false); }
  };

  const cancelTask = async () => {
    if (!window.confirm('Cancel this Vooom request? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await vooomApi.cancel(id);
      toast.success('Request cancelled.');
      navigate('/vooom/browse');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    } finally { setCancelling(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'var(--muted)' }}>Loading…</p>
    </div>
  );

  if (!task) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <Package size={48} style={{ color:"#e2e8f0" }} />
      <p style={{ fontWeight:700, fontSize:18 }}>Request not found</p>
      <Link to="/vooom/browse" className="btn-primary" style={{ padding:'10px 22px', borderRadius:10, fontSize:14 }}>Back to browse</Link>
    </div>
  );

  const isRequester = user?.id === task.requester_id;
  const isTasker = user && !isRequester;
  const myBid = task.bids?.find(b => b.tasker_id === user?.id);
  const canBid = isTasker && ['open','bidding'].includes(task.status) && !myBid;
  const isIntl = task.is_international;
  const isOngoing = task.status === 'ongoing';
  const isCompleted = task.status === 'completed';

  // Only requester can see all bid amounts; tasker only sees their own
  const visibleBids = task.bids || [];

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)' }}>
      <SEO
        title={`Vooom: ${task.from_city} → ${task.to_city} | ${task.item_type} | Taskeeu`}
        description={`${task.item_description}. ${task.vehicle_type} needed. Travel date: ${format(new Date(task.travel_date), 'MMM d, yyyy')}. Bid on Vooom by Taskeeu.`}
        canonical={`https://taskeeu.com/vooom/${task.id}`}
      />

      {/* Top bar */}
      <div style={{ background:'linear-gradient(135deg,#0f0720,#1a0933)', padding:'88px 20px 22px' }}>
        <div className="container-xl" style={{ maxWidth:900 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <button onClick={() => navigate('/vooom/browse')} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, padding:'7px 14px', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <Zap size={13} style={{ color:'#ff6b8f' }} />
            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>Vooom by Taskeeu</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ width:56, height:56, borderRadius:14, background: isIntl ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'linear-gradient(135deg,#ff2d62,#c41445)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>
              { (() => { const VIcon = VEHICLE_ICONS[task.vehicle_type] || Package; return <VIcon size={20} style={{ color:'rgba(255,255,255,0.9)' }} />; })() }
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{ color:'white', fontWeight:900, fontSize:'clamp(18px,4vw,28px)', margin:0, letterSpacing:'-0.02em' }}>
                {task.from_city}{task.from_country !== 'Nigeria' ? `, ${task.from_country}` : ''} → {task.to_city}{task.to_country !== 'Nigeria' ? `, ${task.to_country}` : ''}
              </h1>
              <div style={{ display:'flex', gap:10, marginTop:7, flexWrap:'wrap' }}>
                {isIntl && <span style={{ background:'rgba(124,58,237,0.25)', color:'#c4b5fd', fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20 }}>International</span>}
                <span style={{
                  fontSize:11, fontWeight:700,
                  background: task.status === 'open' ? 'rgba(34,197,94,0.2)' : task.status === 'bidding' ? 'rgba(234,179,8,0.2)' : task.status === 'ongoing' ? 'rgba(59,130,246,0.2)' : 'rgba(156,163,175,0.2)',
                  color: task.status === 'open' ? '#4ade80' : task.status === 'bidding' ? '#fde047' : task.status === 'ongoing' ? '#93c5fd' : '#d1d5db',
                }}>
                  {task.status === 'open' ? 'Open for bids' : task.status === 'bidding' ? 'Receiving bids' : task.status === 'ongoing' ? 'Ongoing' : task.status === 'completed' ? 'Completed' : 'Cancelled'}
                </span>
              </div>
            </div>
          {/* Confirm delivery */}
            {isRequester && isOngoing && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={() => navigate('/requester?tab=chat')}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  <MessageSquare size={14} /> Chat carrier
                </button>
                <button onClick={confirmDelivery} disabled={completing}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, background:'#16a34a', border:'none', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                  <CheckCircle size={14} /> {completing ? '…' : 'Confirm delivery'}
                </button>
              </div>
            )}
            {isRequester && ['open','bidding'].includes(task.status) && (
              <button onClick={cancelTask} disabled={cancelling}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.3)', color:'#fca5a5', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                <XCircle size={14} /> {cancelling ? '…' : 'Cancel'}
              </button>
            )}
            {/* Tasker: chat button when bid accepted */}
            {isTasker && isOngoing && myBid?.status === 'accepted' && (
              <button onClick={() => navigate('/tasker?tab=chat')}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, background:'#2563eb', border:'none', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                <MessageSquare size={14} /> Chat requester
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container-xl" style={{ maxWidth:900, padding:'28px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr)', gap:24, alignItems:'start' }}
          className="vooom-detail-grid">

        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {/* Key details */}
          <div className="card" style={{ padding:24 }}>
            <h2 style={{ fontWeight:800, fontSize:16, color:'var(--text)', marginBottom:18 }}>Request details</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14 }}>
              {[
                { icon:Package, label:'Item type', val:task.item_type },
                { icon:Truck, label:'Vehicle', val:VEHICLE_LABELS[task.vehicle_type] },
                { icon:Calendar, label:'Travel date', val:format(new Date(task.travel_date), 'EEEE, MMM d, yyyy') },
                { icon:Clock, label:'Posted', val:formatDistanceToNow(new Date(task.created_at), { addSuffix:true }) },
                { icon:MapPin, label:'From', val:`${task.from_city}, ${task.from_state}${task.from_country !== 'Nigeria' ? ', ' + task.from_country : ''}` },
                { icon:MapPin, label:'To', val:`${task.to_city}, ${task.to_state}${task.to_country !== 'Nigeria' ? ', ' + task.to_country : ''}` },
              ].map(({ icon:Icon, label, val }) => (
                <div key={label}>
                  <p style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 4px', display:'flex', alignItems:'center', gap:4 }}>
                    <Icon size={11} /> {label}
                  </p>
                  <p style={{ fontWeight:700, fontSize:14, color:'var(--text)', margin:0 }}>{val}</p>
                </div>
              ))}
            </div>
            {task.proposed_price && (
              <div style={{ marginTop:18, padding:'14px 18px', background:'linear-gradient(135deg,#fff0f4,#fce7f3)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:14, color:'#be123c' }}>Proposed price</span>
                <span style={{ fontWeight:900, fontSize:22, color:'var(--rose)' }}>₦{Number(task.proposed_price).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card" style={{ padding:24 }}>
            <h2 style={{ fontWeight:800, fontSize:16, color:'var(--text)', marginBottom:12 }}>What needs to be carried</h2>
            <p style={{ color:'var(--muted)', lineHeight:1.75, fontSize:14.5, margin:0, whiteSpace:'pre-wrap' }}>{task.item_description}</p>
          </div>

          {/* Bids */}
          {(isRequester || myBid) && visibleBids.length > 0 && (
            <div className="card" style={{ padding:24 }}>
              <h2 style={{ fontWeight:800, fontSize:16, color:'var(--text)', marginBottom:16 }}>
                Carrier bids ({visibleBids.length})
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {visibleBids.map(bid => {
                  const isMine = bid.tasker_id === user?.id;
                  const showDetails = isRequester || isMine;
                  return (
                    <div key={bid.id} style={{
                      padding:'14px 18px', borderRadius:12,
                      background: bid.status === 'accepted' ? '#f0fdf4' : bid.status === 'rejected' ? '#fef2f2' : 'var(--surface)',
                      border:`1.5px solid ${bid.status === 'accepted' ? '#86efac' : bid.status === 'rejected' ? '#fca5a5' : 'var(--border-light)'}`,
                      display:'flex', gap:12, alignItems:'flex-start',
                    }}>
                      <div style={{ flexShrink:0 }}>
                        {bid.tasker?.avatar_url
                          ? <img src={bid.tasker.avatar_url} alt="" style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover' }} />
                          : <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#ff2d62,#c41445)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'white', fontWeight:800 }}>{(bid.tasker?.full_name || 'U')[0]}</div>
                        }
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{bid.tasker?.full_name || 'Carrier'}</span>
                            {bid.status === 'accepted' && <span style={{ background:'#16a34a', color:'white', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>Accepted</span>}
                            {bid.status === 'rejected' && <span style={{ background:'#dc2626', color:'white', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>Closed</span>}
                          </div>
                          {showDetails && bid.amount && (
                            <span style={{ fontWeight:900, fontSize:16, color:'var(--rose)' }}>₦{Number(bid.amount).toLocaleString()}</span>
                          )}
                        </div>
                        {showDetails && bid.message && (
                          <p style={{ fontSize:13.5, color:'var(--muted)', margin:'6px 0 0', lineHeight:1.6 }}>{bid.message}</p>
                        )}
                        <p style={{ fontSize:11, color:'var(--muted)', margin:'5px 0 0' }}>{formatDistanceToNow(new Date(bid.created_at), { addSuffix:true })}</p>
                      </div>
                      {isRequester && ['open','bidding'].includes(task.status) && bid.status === 'pending' && (
                        <button onClick={() => acceptBid(bid.id)} disabled={accepting === bid.id} className="btn-primary" style={{ flexShrink:0, padding:'8px 16px', fontSize:13, borderRadius:10 }}>
                          {accepting === bid.id ? '…' : 'Accept'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Public bid count for non-participants */}
          {!isRequester && !myBid && visibleBids.length > 0 && (
            <div className="card" style={{ padding:20, textAlign:'center' }}>
              <p style={{ color:'var(--muted)', fontSize:14, margin:0 }}>
                {visibleBids.length} carrier{visibleBids.length !== 1 ? 's have' : ' has'} bid on this request.
                {canBid ? ' Be the next to bid.' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Right — bid form */}
        <div style={{ display:'flex', flexDirection:'column', gap:16, position:'sticky', top:80 }}>
          {canBid && (
            <div className="card" style={{ padding:22 }}>
              <h3 style={{ fontWeight:800, fontSize:16, color:'var(--text)', marginBottom:16 }}>Place a bid</h3>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Your price (₦)</label>
                <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                  placeholder="Leave blank to negotiate" className="input" style={{ fontSize:14 }} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontWeight:700, fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Message to requester *</label>
                <textarea value={bidMessage} onChange={e => setBidMessage(e.target.value)}
                  rows={3} className="input" placeholder="Are you travelling this route? When? What vehicle? Reassure the requester." style={{ resize:'vertical', fontSize:14 }} />
              </div>
              <button onClick={placeBid} disabled={bidding} className="btn-primary" style={{ width:'100%', padding:'12px', fontSize:14, borderRadius:12 }}>
                {bidding ? 'Placing bid…' : 'Place bid'}
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, justifyContent:'center' }}>
                <Shield size={12} style={{ color:'#16a34a' }} />
                <span style={{ fontSize:12, color:'var(--muted)' }}>Escrow-protected payment</span>
              </div>
            </div>
          )}

          {myBid && (
            <div style={{ background: myBid.status === 'accepted' ? '#f0fdf4' : '#eff6ff', border:`1.5px solid ${myBid.status === 'accepted' ? '#86efac' : '#bfdbfe'}`, borderRadius:14, padding:18 }}>
              <p style={{ fontWeight:800, fontSize:14, color: myBid.status === 'accepted' ? '#16a34a' : '#2563eb', margin:'0 0 4px' }}>
                {myBid.status === 'accepted' ? 'Your bid was accepted!' : 'Your bid is pending'}
              </p>
              <p style={{ fontSize:13, color:'var(--muted)', margin:0 }}>
                {myBid.amount ? `₦${Number(myBid.amount).toLocaleString()}` : 'Negotiable'}{myBid.status === 'accepted' ? '. Chat with the requester to coordinate handover.' : '. Waiting for the requester to review.'}
              </p>
            </div>
          )}

          {!user && (
            <div className="card" style={{ padding:22, textAlign:'center' }}>
              <p style={{ fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:10 }}>Sign in to bid on this request</p>
              <Link to="/auth" className="btn-primary" style={{ display:'block', padding:'11px', borderRadius:12, fontSize:14 }}>Sign in / Register</Link>
            </div>
          )}

          {/* Fund delivery — escrow payment card (requester, ongoing) */}
          {isRequester && isOngoing && (
            isFunded ? (
              <div style={{ background:'#f0fdf4', border:'2px solid #86efac', borderRadius:16, padding:18, textAlign:'center' }}>
                <p style={{ fontWeight:800, fontSize:14, color:'#16a34a', margin:'0 0 4px', display:'flex', alignItems:'center', gap:5 }}><CheckCircle size={15} />Escrow payment received</p>
                <p style={{ fontSize:13, color:'#166534', margin:0 }}>The delivery is funded. Confirm delivery when the carrier hands over the item.</p>
              </div>
            ) : (
              <div style={{ background:'#fffbeb', border:'2px solid #fde68a', borderRadius:16, padding:20 }}>
                <p style={{ fontWeight:800, fontSize:15, color:'#92400e', margin:'0 0 6px' }}>Pay carrier via escrow</p>
                <p style={{ fontSize:13, color:'#b45309', lineHeight:1.6, margin:'0 0 12px' }}>
                  Fund the delivery into escrow now. Payment only releases to the carrier after you confirm delivery.
                </p>
                <div style={{ position:'relative', marginBottom:10 }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontWeight:800, color:'#92400e', fontSize:14 }}>₦</span>
                  <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                    placeholder={task.proposed_price ? String(task.proposed_price) : 'Enter agreed amount'}
                    className="input" style={{ paddingLeft:30, fontSize:14 }} />
                </div>
                <button onClick={fundDelivery} disabled={funding || !fundAmount}
                  style={{ width:'100%', padding:'11px', borderRadius:12, background:'#d97706', border:'none', color:'white', fontWeight:800, fontSize:14, cursor: funding || !fundAmount ? 'not-allowed' : 'pointer', opacity: !fundAmount ? 0.6 : 1 }}>
                  {funding ? 'Redirecting to payment…' : 'Pay into escrow'}
                </button>
                <p style={{ fontSize:11, color:'#92400e', margin:'8px 0 0', textAlign:'center' }}>Secured by Flutterwave · Released on delivery confirmation</p>
              </div>
            )
          )}

          {/* Requester card */}
          <div className="card" style={{ padding:22 }}>
            <p style={{ fontWeight:800, fontSize:13, color:'var(--text)', marginBottom:14, textTransform:'uppercase', letterSpacing:'0.05em' }}>Posted by</p>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              {task.requester?.avatar_url
                ? <img src={task.requester.avatar_url} alt="" style={{ width:46, height:46, borderRadius:'50%', objectFit:'cover' }} />
                : <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#ff2d62,#c41445)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'white', fontWeight:800 }}>{(task.requester?.full_name || 'U')[0]}</div>
              }
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:'var(--text)', margin:0 }}>{task.requester?.full_name || 'Requester'}</p>
                {task.requester?.created_at && (
                  <p style={{ fontSize:12, color:'var(--muted)', margin:'2px 0 0' }}>Member since {format(new Date(task.requester.created_at), 'MMM yyyy')}</p>
                )}
              </div>
            </div>
            <div style={{ padding:'10px 14px', background:'var(--surface)', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
              <Shield size={14} style={{ color:'#16a34a' }} />
              <span style={{ fontSize:12.5, color:'var(--muted)', lineHeight:1.5 }}>Payment protected by Taskeeu escrow. Released only on confirmed delivery.</span>
            </div>
          </div>

          {isCompleted && (
            <div style={{ background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:14, padding:18, textAlign:'center' }}>
              <p style={{ fontWeight:800, fontSize:15, color:'#16a34a', margin:'0 0 4px', display:'flex', alignItems:'center', gap:5 }}><CheckCircle size={16} />Delivery confirmed</p>
              <p style={{ fontSize:13, color:'#166534', margin:0 }}>This Vooom request has been completed.</p>
            </div>
          )}
        </div>
      </div>
      </div>
      <style>{`
        @media (min-width: 700px) {
          .vooom-detail-grid { grid-template-columns: minmax(0,1fr) 320px !important; }
        }
      `}</style>
    </div>
  );
}

