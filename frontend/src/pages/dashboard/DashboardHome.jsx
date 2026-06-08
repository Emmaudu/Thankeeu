import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, cardsAPI, paymentsAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { formatNGN } from '../../utils/currency';

const occasionEmoji = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const completingPayment = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      if (completingPayment.current) return;
      completingPayment.current = true;
      const ref = params.get('reference') || params.get('trxref');
      (async () => {
        try {
          let verification;
          for (let i = 0; i < 4; i++) {
            try { verification = await paymentsAPI.verifyPurchase(ref); break; }
            catch (e) { if (i === 3) throw e; await new Promise(r => setTimeout(r, 750*(i+1))); }
          }
          const pending = JSON.parse(localStorage.getItem('thankeeu_pending_card') || 'null');
          let slug = verification?.data?.card_slug || pending?.slug;
          if (!slug) { const r = await cardsAPI.create(pending.cardData); slug = r.data.slug; }
          if (!verification?.data?.card_activated) await cardsAPI.activate(slug, { inviteEmails: pending?.inviteEmails || [] });
          localStorage.removeItem('thankeeu_pending_card');
          toast.success('🎉 Card is live!');
          navigate(`/card/${slug}`, { replace: true });
        } catch (err) {
          toast.error(err.response?.data?.error || 'Could not finish card. Reload to retry.');
          completingPayment.current = false;
          fetchData();
        }
      })();
    } else { fetchData(); }
  }, []);

  const fetchData = async () => {
    try { const r = await dashboardAPI.get(); setData(r.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const stats = data?.stats || {};
  const cards = data?.recent_cards || [];
  const notifications = data?.notifications || [];

  return (
    <DashboardLayout title={`Hey ${user?.full_name?.split(' ')[0] || 'there'} 👋`} subtitle="Here's what's happening with your cards">

      {/* Notification strip */}
      {notifications.length > 0 && (
        <div className="space-y-2 mb-5">
          {notifications.slice(0,3).map(n => (
            <div key={n.id} className="flex items-start gap-3 p-3 rounded-2xl" style={{ background:'rgba(124,110,255,0.06)', border:'1px solid rgba(124,110,255,0.15)' }}>
              <span className="text-lg">🔔</span>
              <div>
                <p className="text-sm font-semibold" style={{ color:'#1A1730' }}>{n.title}</p>
                <p className="text-xs mt-0.5" style={{ color:'#7A7898' }}>{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {loading
          ? [...Array(4)].map((_,i) => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background:'#EDE9FF' }} />)
          : [
              { icon:'💌', label:'Active cards', value: stats.active_cards||0 },
              { icon:'📋', label:'Total cards', value: stats.total_cards||0 },
              { icon:'🚀', label:'Sent', value: stats.sent_cards||0 },
              { icon:'🎁', label:'Gifts collected', value: formatNGN(stats.total_collected||0), hi:true },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 border-2" style={{ background: s.hi?'rgba(124,110,255,0.06)':'#fff', borderColor: s.hi?'rgba(124,110,255,0.25)':'#EDE9FF' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color:'#7A7898' }}>{s.label}</p>
                    <p className="font-bold text-xl" style={{ fontFamily:'Space Grotesk,sans-serif', color: s.hi?'#5B4BDF':'#1A1730' }}>{s.value}</p>
                  </div>
                  <span className="text-2xl">{s.icon}</span>
                </div>
              </div>
            ))
        }
      </div>

      {/* Recent cards */}
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:600, fontSize:'1rem', color:'#1A1730' }}>Recent cards</h2>
        <Link to="/dashboard/cards" className="text-xs font-medium" style={{ color:'#7C6EFF' }}>View all →</Link>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(3)].map((_,i) => <div key={i} className="rounded-2xl h-40 animate-pulse" style={{ background:'#EDE9FF' }} />)}</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-14 rounded-2xl" style={{ background:'#fff', border:'2px dashed #EDE9FF' }}>
          <div className="text-5xl mb-3">💌</div>
          <p className="font-semibold mb-4" style={{ color:'#1A1730' }}>No cards yet</p>
          <Link to="/create-card" className="btn-primary text-sm px-6 py-2.5">✨ Create your first card</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map(card => (
            <div key={card.id} className="rounded-2xl border-2 overflow-hidden hover:shadow-md transition-all" style={{ background:'#fff', borderColor:'#EDE9FF' }}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl">{occasionEmoji[card.occasion]||'💌'}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: card.status==='active'?'#dcfce7':card.status==='sent'?'#dbeafe':'#f3e8ff', color: card.status==='active'?'#166534':card.status==='sent'?'#1e40af':'#6b21a8' }}>
                    {card.status}
                  </span>
                </div>
                <p className="text-sm font-semibold line-clamp-1" style={{ color:'#1A1730' }}>{card.title}</p>
                <p className="text-xs mt-0.5" style={{ color:'#7A7898' }}>For {card.recipient_name}</p>
                <div className="flex gap-3 mt-2 text-xs" style={{ color:'#9490C8' }}>
                  <span>✍️ {card.signed_count||0}</span>
                  {(card.total_collected||0)>0 && <span className="font-semibold" style={{ color:'#059669' }}>🎁 {formatNGN(card.total_collected)}</span>}
                </div>
              </div>
              <div className="flex border-t" style={{ borderColor:'#EDE9FF' }}>
                <Link to={`/card/${card.slug}`} className="flex-1 py-2.5 text-center text-xs font-semibold hover:bg-purple-50" style={{ color:'#5B4BDF' }}>👁️ View</Link>
                {card.status==='active' && (
                  <button className="flex-1 py-2.5 text-xs font-semibold hover:bg-purple-50 border-l" style={{ color:'#5B4BDF', borderColor:'#EDE9FF' }}
                    onClick={() => { navigator.clipboard.writeText(`${location.origin}/sign/${card.slug}`); toast.success('Copied!'); }}>
                    📲 Copy link
                  </button>
                )}
              </div>
            </div>
          ))}
          <Link to="/create-card" className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 min-h-36 transition-all hover:border-primary-400 hover:bg-purple-50" style={{ borderColor:'#DDD8FF' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:'#EDE9FF' }}>✨</div>
            <p className="text-sm font-semibold" style={{ color:'#7A7898' }}>Create new card</p>
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
