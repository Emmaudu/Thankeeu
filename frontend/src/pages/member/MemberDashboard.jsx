import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { memberAPI } from '../../utils/api';
import { useMemberAuth } from '../../context/MemberAuthContext';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';
import { formatNGN } from '../../utils/currency';
import { format, parseISO } from 'date-fns';

const occasionEmoji = {
  birthday:'🎂', leaving:'👋', work_anniversary:'🏆', promotion:'🌟',
  anniversary:'💍', graduation:'🎓', wedding:'💒', other:'🎉',
  valentines_day:'💝', womens_day:'👩', mens_day:'👨', workers_day:'✊',
  new_baby:'👶', retirement:'🏖️', christmas:'🎄', get_well:'🌷',
};

const StatusBadge = ({ status }) => {
  const cfg = {
    active: 'bg-green-50 text-green-700 border-green-200',
    sent:   'bg-blue-50 text-blue-700 border-blue-200',
    draft:  'bg-gray-50 text-gray-500 border-gray-200',
    expired:'bg-red-50 text-red-500 border-red-200',
  }[status] || 'bg-purple-50 text-purple-500 border-purple-200';
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${cfg}`}>
      {status}
    </span>
  );
};

const EmptyState = ({ icon, title, desc, action }) => (
  <div className="py-12 text-center">
    <div className="text-5xl mb-3">{icon}</div>
    <p className="font-semibold text-warm-900 mb-1">{title}</p>
    <p className="text-sm text-warm-500 mb-5">{desc}</p>
    {action}
  </div>
);

const CardRow = ({ card, action }) => (
  <div className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors rounded-xl">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-purple-50">
      {occasionEmoji[card.occasion] || '💌'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-warm-900 truncate">{card.title || `${card.recipient_name}'s Card`}</p>
      <p className="text-xs text-warm-500">For {card.recipient_name}{card.signed_count ? ` · ${card.signed_count} signed` : ''}{card.total_collected > 0 ? ` · ${formatNGN(card.total_collected)}` : ''}</p>
    </div>
    {action}
  </div>
);

// ── TAB: Home ───────────────────────────────────────────────────
const TabHome = ({ data, loading }) => {
  const stats = data?.stats || {};
  const upcoming = data?.upcoming_occasions || [];
  const pendingSign = data?.pending_to_sign || [];
  const myCards = data?.my_created_cards || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? [...Array(4)].map((_,i) => <div key={i} className="rounded-2xl h-24 animate-pulse bg-purple-50" />) : [
          { icon:'👥', label:'Dept members',    value: stats.dept_size || 0 },
          { icon:'🎉', label:'Upcoming',         value: stats.upcoming_occasions || 0, sub:'next 30 days' },
          { icon:'💌', label:'Active cards',     value: stats.active_cards || 0 },
          { icon:'⏳', label:'Pending to sign',  value: stats.pending_approvals || 0, accent: (stats.pending_approvals||0)>0 },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 border-2 ${s.accent ? 'bg-primary-50 border-primary-200' : 'bg-white border-purple-100'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-warm-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold font-display ${s.accent ? 'text-primary-600' : 'text-warm-900'}`}>{s.value}</p>
                {s.sub && <p className="text-xs mt-0.5 text-warm-400">{s.sub}</p>}
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming occasions */}
        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50">
            <h3 className="font-semibold text-warm-900 text-sm">🎉 Department occasions</h3>
            <Link to="/member/occasions" className="text-xs font-semibold text-primary-500">View all →</Link>
          </div>
          {loading ? <div className="p-4 space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-12 rounded-xl animate-pulse bg-purple-50"/>)}</div>
          : upcoming.length === 0 ? <EmptyState icon="📅" title="All clear!" desc="No occasions in the next 30 days" />
          : <div className="divide-y divide-purple-50">
              {upcoming.slice(0,5).map((occ,i) => {
                const urgent = (occ.days_until ?? 99) <= 3;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${urgent ? 'bg-red-50' : 'bg-purple-50'}`}>
                      {occasionEmoji[occ.occasion] || '🎉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-warm-900 truncate">{occ.first_name} {occ.last_name}</p>
                      <p className="text-xs text-warm-500 capitalize">{occ.occasion?.replace('_',' ')}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${urgent ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                      {occ.days_until === 0 ? 'Today! 🎉' : `${occ.days_until}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          }
        </div>

        {/* Pending to sign */}
        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-50">
            <h3 className="font-semibold text-warm-900 text-sm">✍️ Cards awaiting your signature</h3>
            {pendingSign.length > 0 && <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{pendingSign.length}</span>}
          </div>
          {loading ? <div className="p-4 space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-14 rounded-xl animate-pulse bg-purple-50"/>)}</div>
          : pendingSign.length === 0 ? <EmptyState icon="💌" title="All signed!" desc="No cards waiting for your signature" />
          : <div className="divide-y divide-purple-50">
              {pendingSign.slice(0,5).map(card => (
                <CardRow key={card.id} card={card} action={
                  <a href={`/sign/${card.slug}`} className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0 text-white" style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
                    Sign ✍️
                  </a>
                } />
              ))}
            </div>
          }
        </div>
      </div>

      {myCards.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-50">
            <h3 className="font-semibold text-warm-900 text-sm">🎉 Cards you created</h3>
          </div>
          <div className="divide-y divide-purple-50">
            {myCards.slice(0,5).map(card => (
              <CardRow key={card.id} card={card} action={
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={card.status} />
                  <Link to={`/card/${card.slug}`} className="text-xs text-primary-500 font-semibold hover:underline">View</Link>
                </div>
              } />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── TAB: My Cards ───────────────────────────────────────────────
const TabMyCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  useSEO({ title:'My Dashboard — Thankeeu for Teams', noIndex:true });


  // Handle redirect from Flutterwave after card-creation fee payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const feePaid = params.get('fee_paid');
    if (feePaid) {
      window.history.replaceState({}, '', window.location.pathname);
      const base = import.meta.env.VITE_API_URL || '/api';
      const tok  = localStorage.getItem('thankeeu_token')
                || localStorage.getItem('thankeeu_member_token')
                || localStorage.getItem('thankeeu_company_token');
      fetch(`${base}/payments/verify/purchase/${encodeURIComponent(feePaid)}`, {
        headers: { Authorization: `Bearer ${tok}` }
      }).then(r => r.json()).then(data => {
        if ((data.status === 'success' || data.verified) && data.card_slug) {
          toast.success('✅ Payment confirmed! Taking you to your card...');
          setTimeout(() => window.location.replace(`/card/${data.card_slug}`), 1200);
        } else if (data.status === 'success' || data.verified) {
          toast.success('✅ Card payment confirmed! Your card is active.');
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    memberAPI.getMyCards().then(r => setCards(r.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-warm-900">Cards I created</h2>
        <Link to="/member/occasions" className="btn-primary text-sm py-2 px-4">✨ Create card</Link>
      </div>
      {loading ? <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded-2xl animate-pulse bg-purple-50"/>)}</div>
      : cards.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-purple-100">
          <EmptyState icon="✨" title="No cards yet" desc="Go to Occasions to create your first group card" action={
            <Link to="/member/occasions" className="btn-primary text-sm py-2 px-5 inline-flex">Create card</Link>
          } />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-purple-100 divide-y divide-purple-50 overflow-hidden">
          {cards.map(card => (
            <CardRow key={card.id} card={card} action={
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={card.status} />
                {card.status === 'active' && (
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${card.slug}`); toast.success('Invite link copied! 📲'); }}
                    className="text-xs font-semibold text-primary-500 hover:text-primary-700">
                    📲 Copy link
                  </button>
                )}
                <Link to={`/card/${card.slug}`} className="text-xs text-primary-500 font-semibold hover:underline">View</Link>
              </div>
            } />
          ))}
        </div>
      )}
    </div>
  );
};

// ── TAB: Pending to Sign ────────────────────────────────────────
const TabPending = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    memberAPI.getPendingToSign().then(r => setCards(r.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <h2 className="font-semibold text-warm-900 mb-4">Cards waiting for your signature ✍️</h2>
      {loading ? <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded-2xl animate-pulse bg-purple-50"/>)}</div>
      : cards.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-purple-100">
          <EmptyState icon="🎉" title="You're all caught up!" desc="No cards are waiting for your signature right now" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-purple-100 divide-y divide-purple-50 overflow-hidden">
          {cards.map(card => (
            <CardRow key={card.id} card={card} action={
              <div className="flex items-center gap-3 flex-shrink-0">
                {card.deadline && (
                  <span className="text-xs text-warm-400 hidden sm:block">
                    Closes {format(parseISO(card.deadline), 'MMM d')}
                  </span>
                )}
                <a href={`/sign/${card.slug}`} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white flex-shrink-0"
                  style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
                  Sign ✍️
                </a>
              </div>
            } />
          ))}
        </div>
      )}
    </div>
  );
};

// ── TAB: Received ───────────────────────────────────────────────
const TabReceived = ({ member }) => {
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferSlug, setTransferSlug] = useState('');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    memberAPI.getReceived().then(r => setReceived(r.data || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferSlug || !recipientUsername) return toast.error('Card link and recipient username are required');
    setTransferring(true);
    try {
      const slug = transferSlug.split('/sign/').pop().split('/card/').pop().trim();
      const res = await memberAPI.transferCard({ card_slug: slug, recipient_username: recipientUsername, note: transferNote });
      toast.success(res.data.message || 'Card transferred! ✓');
      setTransferSlug(''); setRecipientUsername(''); setTransferNote('');
      setShowTransfer(false);
      memberAPI.getReceived().then(r => setReceived(r.data || []));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    } finally { setTransferring(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-warm-900">Received cards 📬</h2>
        <button onClick={() => setShowTransfer(!showTransfer)} className="btn-secondary text-sm py-2 px-4">
          📤 Transfer a card
        </button>
      </div>

      {/* Transfer form */}
      {showTransfer && (
        <div className="bg-white rounded-2xl border-2 border-primary-200 p-5 mb-5">
          <h3 className="font-semibold text-warm-900 mb-1">Transfer a card to a team member</h3>
          <p className="text-xs text-warm-500 mb-4">Share a card with a colleague using their @username. They'll see it in their Received tab.</p>
          <form onSubmit={handleTransfer} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1">Card link or slug *</label>
              <input className="input text-sm" placeholder="e.g. https://thankeeu.com/card/abc123 or just abc123"
                value={transferSlug} onChange={e => setTransferSlug(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1">Recipient @username *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 text-sm">@</span>
                <input className="input pl-7 text-sm" placeholder="colleague_username"
                  value={recipientUsername} onChange={e => setRecipientUsername(e.target.value.replace(/\s/g,'').toLowerCase())} required />
              </div>
              <p className="text-xs text-warm-400 mt-1">They must set a username in their Settings first</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1">Note (optional)</label>
              <input className="input text-sm" placeholder="e.g. Thought you'd want to see this!"
                value={transferNote} onChange={e => setTransferNote(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={transferring} className="btn-primary text-sm py-2 px-5">
                {transferring ? 'Transferring…' : '📤 Transfer'}
              </button>
              <button type="button" onClick={() => setShowTransfer(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-20 rounded-2xl animate-pulse bg-purple-50"/>)}</div>
      : received.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-purple-100">
          <EmptyState icon="📬" title="Nothing here yet" desc="Cards transferred to you by teammates will appear here"
            action={<p className="text-xs text-warm-400">Make sure you have a username set in your Settings so teammates can find you.</p>} />
        </div>
      ) : (
        <div className="space-y-3">
          {received.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border-2 border-purple-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">
                    {occasionEmoji[item.card?.occasion] || '💌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-warm-900 text-sm truncate">{item.card?.title || `${item.card?.recipient_name}'s Card`}</p>
                    <p className="text-xs text-warm-500">For {item.card?.recipient_name}</p>
                    {item.note && <p className="text-xs text-primary-500 italic mt-0.5">"{item.note}"</p>}
                    <p className="text-xs text-warm-400 mt-0.5">{item.transferred_at ? format(parseISO(item.transferred_at), 'MMM d, yyyy') : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.card && <StatusBadge status={item.card.status} />}
                  <Link to={`/card/${item.card?.slug}`} className="text-xs font-bold text-primary-500 hover:underline">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── TAB: Financial History ──────────────────────────────────────
const TabFinances = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    memberAPI.getFinances().then(r => setData(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-16 rounded-2xl animate-pulse bg-purple-50"/>)}</div>;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-4">
          <p className="text-xs text-warm-500 mb-1">💸 Total contributed</p>
          <p className="font-display text-2xl font-bold text-primary-600">{formatNGN(data?.total_contributed || 0)}</p>
          <p className="text-xs text-warm-400 mt-0.5">Gifts you gave to others</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-4">
          <p className="text-xs text-warm-500 mb-1">🎁 Total collected</p>
          <p className="font-display text-2xl font-bold text-green-600">{formatNGN(data?.total_collected || 0)}</p>
          <p className="text-xs text-warm-400 mt-0.5">On cards you created</p>
        </div>
      </div>

      {/* Contributions made */}
      {(data?.contributions || []).length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-50">
            <h3 className="font-semibold text-warm-900 text-sm">💸 Gifts you contributed</h3>
          </div>
          <div className="divide-y divide-purple-50">
            {data.contributions.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0">{occasionEmoji[c.card?.occasion] || '💌'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-900 truncate">{c.card?.title || `${c.card?.recipient_name}'s Card`}</p>
                    <p className="text-xs text-warm-400">{c.created_at ? format(parseISO(c.created_at), 'MMM d, yyyy') : ''}</p>
                  </div>
                </div>
                <span className="font-bold text-primary-600 text-sm flex-shrink-0">{formatNGN(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards where gift was collected */}
      {(data?.my_card_wallets || []).length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-purple-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-50">
            <h3 className="font-semibold text-warm-900 text-sm">🎁 Gift pots on your cards</h3>
          </div>
          <div className="divide-y divide-purple-50">
            {data.my_card_wallets.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0">{occasionEmoji[c.occasion] || '💌'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-warm-900 truncate">{c.title || `${c.recipient_name}'s Card`}</p>
                    <p className="text-xs text-warm-400 capitalize">{c.status} · {(c.send_date || c.created_at) ? format(parseISO(c.send_date || c.created_at), 'MMM d, yyyy') : ''}{c.send_time ? ` at ${c.send_time.slice(0,5)}` : ''}</p>
                  </div>
                </div>
                <span className="font-bold text-green-600 text-sm flex-shrink-0">{formatNGN(c.total_collected)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data?.contributions?.length && !data?.my_card_wallets?.length && (
        <div className="bg-white rounded-2xl border-2 border-purple-100">
          <EmptyState icon="💳" title="No transactions yet" desc="Naira gift contributions you make or receive will appear here" />
        </div>
      )}
    </div>
  );
};

// ── TAB: Reminders ──────────────────────────────────────────────
const OCCASIONS_LIST = ['birthday','anniversary','graduation','promotion','wedding','baby_shower','retirement','other'];
const TabReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ recipient_name:'', recipient_email:'', occasion:'birthday', occasion_date:'', frequency:'yearly', notes:'' });

  const fetch = () => memberAPI.getReminders().then(r => setReminders(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.recipient_name || !form.occasion_date) return toast.error('Name and date are required');
    setSaving(true);
    try {
      await memberAPI.createReminder(form);
      toast.success('Reminder set! 🎂');
      setForm({ recipient_name:'', recipient_email:'', occasion:'birthday', occasion_date:'', frequency:'yearly', notes:'' });
      setShowAdd(false);
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create reminder'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await memberAPI.deleteReminder(id); toast.success('Reminder removed'); setReminders(prev => prev.filter(r => r.id !== id)); }
    catch { toast.error('Failed to delete'); }
  };

  const today = new Date();
  const withDays = reminders.map(r => {
    const d = new Date(r.occasion_date);
    const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return { ...r, days_until: Math.ceil((next - today) / 86400000) };
  }).sort((a,b) => a.days_until - b.days_until);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-warm-900">Personal reminders 🔔</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm py-2 px-4">+ Add reminder</button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border-2 border-primary-200 p-5 mb-5">
          <h3 className="font-semibold text-warm-900 mb-4">New reminder</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">Name *</label>
                <input className="input text-sm" placeholder="Tolu, Mum, etc." value={form.recipient_name} onChange={e => setForm(p => ({...p, recipient_name: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">Email (optional)</label>
                <input type="email" className="input text-sm" placeholder="their@email.com" value={form.recipient_email} onChange={e => setForm(p => ({...p, recipient_email: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">Occasion *</label>
                <select className="input text-sm" value={form.occasion} onChange={e => setForm(p => ({...p, occasion: e.target.value}))}>
                  {OCCASIONS_LIST.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">Date *</label>
                <input type="date" className="input text-sm" value={form.occasion_date} onChange={e => setForm(p => ({...p, occasion_date: e.target.value}))} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-700 mb-1">Frequency</label>
              <select className="input text-sm" value={form.frequency} onChange={e => setForm(p => ({...p, frequency: e.target.value}))}>
                <option value="yearly">Yearly (repeating)</option>
                <option value="once">Once only</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-5">{saving ? 'Saving…' : '✓ Save reminder'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded-2xl animate-pulse bg-purple-50"/>)}</div>
      : withDays.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-purple-100">
          <EmptyState icon="🔔" title="No reminders set" desc="Add birthday and occasion reminders so you never forget" />
        </div>
      ) : (
        <div className="space-y-2">
          {withDays.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border-2 border-purple-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${r.days_until <= 7 ? 'bg-amber-50' : 'bg-purple-50'}`}>
                {occasionEmoji[r.occasion] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-warm-900 text-sm truncate">{r.recipient_name}</p>
                <p className="text-xs text-warm-500 capitalize">{r.occasion?.replace('_',' ')} · {format(parseISO(r.occasion_date), 'MMM d')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.days_until <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-600'}`}>
                  {r.days_until === 0 ? 'Today! 🎉' : `${r.days_until}d`}
                </span>
                <button onClick={() => handleDelete(r.id)} className="text-warm-300 hover:text-rose-500 text-lg transition-colors">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── MAIN DASHBOARD ──────────────────────────────────────────────
const TABS = [
  { id:'home',     icon:'🏠', label:'Home' },
  { id:'mycards',  icon:'🎴', label:'My Cards' },
  { id:'pending',  icon:'✍️', label:'Pending' },
  { id:'received', icon:'📬', label:'Received' },
  { id:'finances', icon:'💳', label:'Finances' },
  { id:'reminders',icon:'🔔', label:'Reminders' },
];

const MemberDashboard = () => {

  const { member } = useMemberAuth();
  const [homeData, setHomeData] = useState(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [tab, setTab] = useState('home');

  useEffect(() => {
    memberAPI.getDashboard()
      .then(r => {
        const data = r.data;
        // Merge dept member birthdays into upcoming occasions
        const deptMembers = data?.dept_members || [];
        const existing = data?.upcoming_occasions || [];
        const existingKeys = new Set(existing.map(o => `${o.first_name}${o.last_name}`));
        const today = new Date();
        const bdays = deptMembers
          .filter(m => m.date_of_birth && !existingKeys.has(`${m.first_name}${m.last_name}`))
          .map(m => {
            const bd = new Date(m.date_of_birth);
            const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
            if (next < today) next.setFullYear(today.getFullYear() + 1);
            return { ...m, occasion:'birthday', days_until: Math.ceil((next - today) / 86400000) };
          })
          .filter(m => m.days_until <= 60)
          .sort((a,b) => a.days_until - b.days_until);
        setHomeData({ ...data, upcoming_occasions: [...existing, ...bdays].sort((a,b)=>a.days_until-b.days_until) });
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setHomeLoading(false));
  }, []);

  const isLeader = member?.role === 'team_leader';

  return (
    <MemberLayout
      title={`Hey ${member?.first_name || 'there'} 👋`}
      subtitle={`${member?.department || ''} · ${isLeader ? '👑 Team Leader' : '👤 Member'}`}>

      {/* Tab bar */}
      <div className="flex gap-1 bg-purple-50 p-1 rounded-xl mb-5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              tab === t.id ? 'bg-white text-primary-700 shadow-sm' : 'text-warm-500 hover:text-warm-800'
            }`}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'home'     && <TabHome data={homeData} loading={homeLoading} />}
      {tab === 'mycards'  && <TabMyCards />}
      {tab === 'pending'  && <TabPending />}
      {tab === 'received' && <TabReceived member={member} />}
      {tab === 'finances' && <TabFinances />}
      {tab === 'reminders'&& <TabReminders />}
    </MemberLayout>
  );
};

export default MemberDashboard;
