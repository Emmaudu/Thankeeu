import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, cardsAPI, paymentsAPI, authAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';
import toast from 'react-hot-toast';
import { formatNGN } from '../../utils/currency';

const OCCASION_EMOJI = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const completingPayment = useRef(false);

  // Fee-paid redirect from Flutterwave
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const feePaid = params.get('fee_paid');
    if (feePaid) {
      window.history.replaceState({}, '', '/dashboard');
      const base = import.meta.env.VITE_API_URL || '/api';
      const tok  = localStorage.getItem('thankeeu_token') || localStorage.getItem('thankeeu_member_token');
      fetch(`${base}/payments/verify/purchase/${encodeURIComponent(feePaid)}`, { headers:{ Authorization:`Bearer ${tok}` } })
        .then(r=>r.json()).then(d => {
          if ((d.status==='success'||d.verified) && d.card_slug) { toast.success('Payment confirmed!'); setTimeout(()=>window.location.replace(`/card/${d.card_slug}`),1200); }
          else if (d.status==='success'||d.verified) toast.success('Card payment confirmed!');
        }).catch(()=>toast.error('Could not verify payment. Check My Cards.'));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment')==='success') {
      if (completingPayment.current) return;
      completingPayment.current = true;
      const ref = params.get('reference') || params.get('trxref');
      (async () => {
        try {
          let v;
          for (let i=0;i<4;i++) { try { v=await paymentsAPI.verifyCardFee(ref); break; } catch(e) { if(i===3) throw e; await new Promise(r=>setTimeout(r,750*(i+1))); } }
          const pending = JSON.parse(localStorage.getItem('thankeeu_pending_card')||'null');
          let slug = v?.data?.card_slug || pending?.slug;
          if (!slug) { const r=await cardsAPI.create(pending.cardData); slug=r.data.slug; }
          if (!v?.data?.card_slug) await cardsAPI.activate(slug,{inviteEmails:pending?.inviteEmails||[]}).catch(()=>{});
          localStorage.removeItem('thankeeu_pending_card');
          toast.success('Card is live!');
          navigate(`/card/${slug}`,{replace:true});
        } catch(err) { toast.error(err.response?.data?.error||'Could not finish card. Reload to retry.'); completingPayment.current=false; fetchData(); }
      })();
    } else { fetchData(); }
  }, []);

  const fetchData = async () => {
    try { const r=await dashboardAPI.get(); setData(r.data); }
    catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const stats   = data?.stats||{};
  const cards   = data?.recent_cards||[];
  const notifs  = data?.notifications||[];
  const [dismissed, setDismissed] = useState([]);
  const [resending,  setResending]  = useState(false);
  const [resentOk,   setResentOk]   = useState(false);

  const resendVerification = async () => {
    setResending(true);
    try { await authAPI.resendVerification(); setResentOk(true); toast.success('Verification email sent!'); }
    catch(err) { toast.error(err.response?.data?.error||'Failed. Try again.'); }
    finally { setResending(false); }
  };

  const getNotifLink = n => {
    const t = n.type||'';
    if (['card_opened','card_scheduled','card_sent'].includes(t)) return n.meta?.card_slug?`/card/${n.meta.card_slug}`:'/dashboard/cards';
    if (t==='card_received') return '/dashboard/received';
    if (['reminder_due','reminder_set'].includes(t)) return '/dashboard/reminders';
    if (t==='pending_sign') return '/dashboard/pending';
    return '/dashboard';
  };

  const dismissNotif = async (id,e) => { e.preventDefault(); e.stopPropagation(); setDismissed(p=>[...p,id]); try { await dashboardAPI.markNotificationsRead(); } catch {} };
  const visibleNotifs = notifs.filter(n=>!dismissed.includes(n.id));

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout title={`Hey ${firstName} 👋`} subtitle="Here's what's happening with your cards">

      {/* Email verification banner */}
      {user?.is_verified===false && (
        <div className="mb-5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background:'rgba(245,158,11,0.07)', border:'1.5px solid rgba(245,158,11,0.25)' }}>
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon name="Mail" size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="db-section-title text-sm" style={{ color:'#92400E' }}>Please verify your email address</p>
              <p className="text-sm mt-0.5" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#B45309' }}>
                Check your inbox for a verification link. You can still use Thankeeu normally.
              </p>
            </div>
          </div>
          <button onClick={resendVerification} disabled={resending||resentOk}
            className="flex-shrink-0 text-sm font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-60"
            style={{ background:resentOk?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.12)', color:resentOk?'#059669':'#D97706', border:`1.5px solid ${resentOk?'rgba(16,185,129,0.25)':'rgba(245,158,11,0.25)'}`, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
            {resending ? 'Sending…' : resentOk ? '✓ Email sent!' : 'Resend verification email'}
          </button>
        </div>
      )}

      {/* Notifications */}
      {visibleNotifs.length>0 && (
        <div className="space-y-2 mb-6">
          {visibleNotifs.slice(0,5).map(n=>(
            <Link key={n.id} to={getNotifLink(n)} className="db-notif group block">
              <Icon name="Bell" size={16} className="text-primary-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="db-notif-title">{n.title}</p>
                <p className="db-notif-body">{n.body}</p>
              </div>
              <button onClick={e=>dismissNotif(n.id,e)}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background:'rgba(0,0,0,0.08)' }}>
                <Icon name="X" size={12} className="text-warm-400" />
              </button>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {loading
          ? [...Array(4)].map((_,i)=><div key={i} className="rounded-2xl h-24 animate-pulse" style={{background:'#EDE9FE'}}/>)
          : [
              { icon:'Heart',   label:'Active cards',     value:stats.active_cards||0,              hi:false },
              { icon:'Layers',  label:'Total cards',      value:stats.total_cards||0,               hi:false },
              { icon:'Send',    label:'Cards sent',       value:stats.sent_cards||0,                hi:false },
              { icon:'Gift',    label:'Gifts collected',  value:formatNGN(stats.total_collected||0), hi:true  },
            ].map(s=>(
              <div key={s.label} className={`db-stat-card ${s.hi?'db-stat-hi':''}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="db-stat-label">{s.label}</p>
                  <Icon name={s.icon} size={18} className={s.hi?'text-primary-400':'text-warm-300'} />
                </div>
                <p className={`db-stat-value ${s.hi?'db-stat-value-hi':''}`}>{s.value}</p>
              </div>
            ))
        }
      </div>

      {/* Recent cards */}
      <div className="flex items-center justify-between mb-4">
        <p className="db-section-title">Recent cards</p>
        <Link to="/dashboard/cards" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.875rem', fontWeight:700, color:'#7C3AED' }}>
          View all <Icon name="ArrowRight" size={14} className="inline" />
        </Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_,i)=><div key={i} className="rounded-2xl h-40 animate-pulse" style={{background:'#EDE9FE'}}/>)}
        </div>
      ) : cards.length===0 ? (
        <div className="db-empty">
          <div className="db-empty-icon"><Icon name="Heart" size={28} className="text-primary-400"/></div>
          <p className="db-empty-title">No cards yet</p>
          <p className="db-empty-body">Create your first group card in under 2 minutes.</p>
          <Link to="/card/new" className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2">
            <Icon name="Sparkles" size={14}/> Create your first card
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map(card=>(
            <div key={card.id} className="db-card-item">
              <div className="db-card-item-body">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="section-dots w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:'#F5F0FF'}}>
                    {OCCASION_EMOJI[card.occasion]||'💌'}
                  </div>
                  <span className={`db-badge db-badge-${card.status||'draft'}`}>
                    {card.status==='active'?'Active':card.status==='sent'?'Sent':'Draft'}
                  </span>
                </div>
                <p className="db-card-item-title">{card.title}</p>
                <p className="db-card-item-meta">For {card.recipient_name}</p>
                <div className="flex flex-wrap gap-3 mt-2" style={{fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'0.8rem', color:'#A898CC'}}>
                  <span><Icon name="Edit" size={12} className="inline mr-1"/>{card.signed_count||0} signed</span>
                  {(card.total_collected||0)>0 && <span style={{color:'#059669',fontWeight:700}}><Icon name="Gift" size={12} className="inline mr-1"/>{formatNGN(card.total_collected)}</span>}
                  {card.send_date && card.status === 'active' && (
                    <span style={{color:'#7C3AED'}}>📅 {(() => {
                      const d = String(card.send_date).slice(0,10);
                      const t = card.send_time ? String(card.send_time).slice(0,8) : '00:00:00';
                      const dt = new Date(`${d}T${t}Z`);
                      return isNaN(dt.getTime()) ? d : dt.toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
                    })()}</span>
                  )}
                </div>
              </div>
              <div className="db-card-item-footer">
                <Link to={`/card/${card.slug}`} className="db-card-item-action"><Icon name="Eye" size={13}/>View</Link>
                {card.status==='active' && (
                  <button className="db-card-item-action" onClick={()=>{navigator.clipboard.writeText(`${location.origin}/sign/${card.slug}`);toast.success('Copied!');}}>
                    <Icon name="Share" size={13}/>Copy link
                  </button>
                )}
              </div>
            </div>
          ))}
          <Link to="/card/new" className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 min-h-36 transition-all hover:border-primary-400 hover:bg-primary-50"
            style={{borderColor:'#DDD6FE'}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#EDE9FE'}}>
              <Icon name="Plus" size={20} className="text-primary-500"/>
            </div>
            <p style={{fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:'0.9rem', color:'#A898CC'}}>Create new card</p>
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
