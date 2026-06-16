import { useSEO } from '../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, cardsAPI, paymentsAPI, creditsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../utils/currency';

const statusConfig = {
  draft:    { label:'Draft',    style:'bg-warm-100 text-warm-500 border border-warm-300' },
  active:   { label:'Active ✓', style:'bg-green-50 text-green-700 border border-green-200' },
  sent:     { label:'Sent 🚀',  style:'bg-blue-50 text-blue-700 border border-blue-200' },
  expired:  { label:'Expired',  style:'bg-rose-50 text-rose-600 border border-rose-200' },
};

const occasionEmoji = {
  birthday:'🎂', valentine:'💝', leaving:'💼', anniversary:'💍', wedding:'💒',
  baby_shower:'👶', retirement:'🏖️', congratulations:'🎉', graduation:'🎓',
  promotion:'🌟', christmas:'🎄', get_well:'🌷', new_year:'✨', other:'💌',
};

const StatCard = ({ icon, label, value, sub, highlight }) => (
  <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 ${highlight ? 'border-primary-200 bg-primary-50' : 'bg-white border-purple-100'}`}>
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-xs font-semibold text-warm-500 mb-1">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold ${highlight ? 'text-primary-600' : 'text-warm-900'}`}>{value}</p>
        {sub && <p className="text-xs text-warm-400 mt-1">{sub}</p>}
      </div>
      <span className="text-2xl flex-shrink-0">{icon}</span>
    </div>
  </div>
);

const FILTERS = ['all','draft','active','sent'];

const Dashboard = () => {
  useSEO({ title:'My Dashboard — Thankeeu', noIndex:true });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [credits,  setCredits]  = useState(null);
  const [filter, setFilter] = useState('all');
  const completingPayment = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      if (completingPayment.current) return;
      completingPayment.current = true;
      const ref = params.get('reference') || params.get('trxref');
      const activatePending = async () => {
        try {
          if (!ref) throw new Error('Payment reference is missing');
          let verification;
          for (let attempt = 0; attempt < 4; attempt += 1) {
            try {
              verification = await paymentsAPI.verifyCardFee(ref);
              break;
            } catch (verifyError) {
              if (attempt === 3) throw verifyError;
              await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)));
            }
          }

          if (!verification?.data?.card_slug && verification?.data?.type === 'card_purchase') {
            localStorage.removeItem('thankeeu_pending_card');
            toast.success('Payment confirmed! Your card credits are ready.');
            navigate('/dashboard', { replace: true });
            await fetchDashboard();
            return;
          }

          const pendingRaw = localStorage.getItem('thankeeu_pending_card');
          let pending = null;
          try {
            pending = pendingRaw ? JSON.parse(pendingRaw) : null;
          } catch {
            localStorage.removeItem('thankeeu_pending_card');
          }
          let slug = verification?.data?.card_slug || pending?.slug;
          const activatedByVerification = verification?.data?.card_activated === true;

          // Backward compatibility for payments initialized before this fix.
          if (!slug) {
            if (!pending?.cardData) throw new Error('Card details were not found on this device');
            const createRes = await cardsAPI.create(pending.cardData);
            slug = createRes.data.slug;
            localStorage.setItem('thankeeu_pending_card', JSON.stringify({ ...pending, slug }));
          }

          if (!activatedByVerification) {
            await cardsAPI.activate(slug, { inviteEmails: pending?.inviteEmails || [] });
          } else if (pending?.inviteEmails?.length) {
            // The card is already live; invitation delivery should not hold up the redirect.
            cardsAPI.activate(slug, { inviteEmails: pending.inviteEmails }).catch(err => {
              console.error('Could not send saved invitations:', err);
            });
          }
          localStorage.removeItem('thankeeu_pending_card');
          toast.success('Payment confirmed! Your card is live.');
          navigate(`/card/${slug}`, { replace: true });
        } catch (err) {
          console.error('Payment completion failed:', err);
          toast.error(err.response?.data?.error || err.message || 'Could not finish creating your card. Reload to retry.');
          completingPayment.current = false;
          setLoading(false);
        }
      };
      activatePending();
    } else {
      fetchDashboard();
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const [dashRes, cardsRes, credRes] = await Promise.all([
        dashboardAPI.get(),
        cardsAPI.getAll(),
        creditsAPI.getBalance().catch(() => ({ data: { credits: 0 } })),
      ]);
      setDashData(dashRes.data);
      setCards(cardsRes.data || []);
      setCredits(credRes.data?.credits ?? 0);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? cards : cards.filter(c => c.status === filter);
  const stats = dashData || {};

  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#FDFCFF' }}>
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 sm:py-8">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-warm-900">
              Hey {user?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-warm-500 text-sm mt-1">Here's what's happening with your cards</p>
          </div>
          <Link to="/create-card" className="btn-primary py-3 px-6 text-sm w-full sm:w-auto">
            ✨ Create new card
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[...Array(4)].map((_,i) => <div key={i} className="bg-purple-50 rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard icon="🎴" label="Active cards"    value={stats.active_cards || 0}  sub="collecting now" />
              <StatCard icon="📋" label="Total cards"     value={stats.total_cards  || 0}  sub="all time" />
              <StatCard icon="🚀" label="Cards sent"      value={stats.sent_cards   || 0}  sub="delivered" />
              <StatCard icon="🎁" label="Gifts collected" value={formatNGN(stats.total_collected||0)} sub="total" highlight />
            </div>

            {/* Credit balance banner */}
            <div className={`rounded-2xl border-2 px-4 py-3 mb-6 flex items-center gap-3 ${
              credits === 0 ? 'border-amber-200 bg-amber-50' : 'border-primary-200 bg-primary-50'
            }`}>
              <span className="text-2xl flex-shrink-0">💳</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${credits === 0 ? 'text-amber-800' : 'text-primary-700'}`}>
                  {credits === 0
                    ? '⚠️ No credits — top up to create cards instantly'
                    : `${credits} card credit${credits !== 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-warm-400">
                  {credits === 0
                    ? 'Each card creation uses 1 credit. Or pay directly when creating.'
                    : `You can create ${credits} more card${credits !== 1 ? 's' : ''} with your credit balance.`}
                </p>
              </div>
              <Link to="/dashboard/credits"
                className={`text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 transition-all ${
                  credits === 0
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                }`}>
                {credits === 0 ? '+ Top up' : 'Buy more'}
              </Link>
            </div>
          </>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap flex-shrink-0 border-2 transition-all ${
                filter===f ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-warm-600 border-purple-200 hover:border-primary-300'
              }`}>
              {f==='all' ? `All (${cards.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${cards.filter(c=>c.status===f).length})`}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_,i) => <div key={i} className="bg-white rounded-3xl h-52 animate-pulse border-2 border-purple-100"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-6xl mb-4">💌</div>
            <h3 className="text-xl font-bold text-warm-900 mb-3">
              {filter==='all' ? 'No cards yet' : `No ${filter} cards`}
            </h3>
            <p className="text-warm-500 mb-7 text-sm">
              {filter==='all' ? 'Create your first group card to get started!' : `You don't have any ${filter} cards.`}
            </p>
            <Link to="/create-card" className="btn-primary px-8 py-3">✨ Create your first card</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(card => {
              const sc = statusConfig[card.status] || statusConfig.draft;
              return (
                <div key={card.id} className="bg-white rounded-3xl border-2 border-purple-100 hover:border-primary-300 hover:shadow-md transition-all overflow-hidden group">
                  {/* Card header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center text-2xl flex-shrink-0 border border-purple-100">
                        {occasionEmoji[card.occasion] || '💌'}
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${sc.style}`}>{sc.label}</span>
                    </div>
                    <h3 className="font-bold text-warm-900 mb-1 line-clamp-1 text-sm">{card.title || `${card.recipient_name}'s Card`}</h3>
                    <p className="text-xs text-warm-500">For <strong>{card.recipient_name}</strong></p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-warm-500">
                      <span>✍️ {card.signed_count || 0} signed</span>
                      {(card.total_collected||0) > 0 && (
                        <span className="text-green-700 font-semibold">🎁 {formatNGN(card.total_collected)}</span>
                      )}
                      {card.created_at && <span>{format(new Date(card.created_at), 'MMM d, yy')}</span>}
                    </div>
                  </div>

                  {/* Card actions */}
                  <div className="flex border-t-2 border-purple-50">
                    {card.status==='active' && (
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${card.slug}`); toast.success('Invite link copied! 📲'); }}
                        className="flex-1 py-3 text-xs font-bold text-primary-600 hover:bg-primary-50 transition-colors">
                        📲 Copy invite link
                      </button>
                    )}
                    <Link to={`/card/${card.slug}`}
                      className="flex-1 py-3 text-xs font-bold text-warm-600 hover:bg-purple-50 transition-colors text-center border-l-2 border-purple-50 first:border-l-0">
                      👁️ View
                    </Link>
                    {card.status==='draft' && (
                      <Link to={`/create-card?edit=${card.slug}`}
                        className="flex-1 py-3 text-xs font-bold text-warm-600 hover:bg-purple-50 transition-colors text-center border-l-2 border-purple-50">
                        ✏️ Edit
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Create new card tile */}
            <Link to="/create-card"
              className="border-2 border-dashed border-purple-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary-400 hover:bg-primary-50 transition-all group min-h-[180px]">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center text-2xl group-hover:bg-primary-100 transition-colors">✨</div>
              <p className="text-sm font-bold text-warm-700 group-hover:text-primary-600 text-center">Create new card</p>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
