import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CompanyLayout from '../../components/company/CompanyLayout';
import { companyAxios } from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../../utils/currency';

// Convert stored UTC date + time to local timezone for display.
const fmtScheduled = (card) => {
  if (!card.send_date) return null;
  const d = String(card.send_date).slice(0, 10);
  const t = card.send_time ? String(card.send_time).slice(0, 8) : '00:00:00';
  const utcDt = new Date(`${d}T${t}Z`);
  if (isNaN(utcDt.getTime())) return format(new Date(card.send_date), 'MMM d, yyyy');
  const dateStr = utcDt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = card.send_time
    ? utcDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : null;
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
};

const TABS = [
  { id: 'my',        label: '📂 My Cards',       desc: 'Cards you created' },
  { id: 'received',  label: '📥 Received',        desc: 'Cards sent to your company' },
  { id: 'delivered', label: '✅ Delivered',        desc: 'Cards sent to recipients' },
];

const statusColor = {
  draft: 'bg-warm-100 text-warm-500',
  active: 'bg-blue-50 text-blue-600',
  sent: 'bg-green-50 text-green-700',
};

const CardRow = ({ card, onCopySigningLink, onCopyViewLink, onTransfer, onNotify, onToggleHideAmounts, toggling, onResend, onSendNow }) => (
  <div className="bg-white rounded-2xl border border-purple-100 p-4 hover:shadow-sm transition-shadow">
    <div className="flex flex-col gap-3">
      {/* Card info */}
      <div className="flex items-start gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-warm-900 text-sm truncate">{card.title || `For ${card.recipient_name}`}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColor[card.status] || statusColor.draft}`}>
              {card.status}
            </span>
            {card.is_gift_enabled && onToggleHideAmounts && (
              <button
                disabled={toggling}
                onClick={() => onToggleHideAmounts(card)}
                title={card.hide_amounts ? "Signers can't see the gift total — click to make it visible to them" : 'Signers can see the gift total — click to hide it from them'}
                className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 transition-colors disabled:opacity-50 ${
                  card.hide_amounts ? 'bg-warm-100 text-warm-600 hover:bg-warm-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {toggling ? '…' : card.hide_amounts ? '🙈 Total hidden' : '👁️ Total visible'}
              </button>
            )}
          </div>
          <p className="text-xs text-warm-400">
            Recipient: <strong className="text-warm-600">{card.recipient_name}</strong>
            {card.recipient_email && ` · ${card.recipient_email}`}
          </p>
          <p className="text-xs text-warm-400 mt-0.5">
            {card.occasion?.replace(/_/g,' ')} · {fmtScheduled(card) || (card.created_at ? format(new Date(card.created_at), 'MMM d, yyyy') : '')}
            {card.total_collected > 0 && ` · 🎁 ${formatNGN(card.total_collected)}`}
          </p>
        </div>
      </div>
      {/* Action buttons — wrap on small screens */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/card/${card.slug}`}
          className="text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-2 rounded-xl font-semibold transition-colors">
          View
        </Link>
        {card.status === 'active' && (
          <QRButton url={`${window.location.origin}/sign/${card.slug}`} label="Scan to sign this group card" variant="ghost" className="text-xs px-3 py-2 rounded-xl">QR</QRButton>
        )}
        {(card.status === 'draft' || card.status === 'active') && (
          <Link to={`/create-card?edit=${card.slug}`}
            className="text-xs bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 px-3 py-2 rounded-xl transition-colors font-semibold">
            {card.status === 'active' ? '✏️ Edit card' : '✏️ Edit draft'}
          </Link>
        )}
        {card.status === 'active' && (
          <Link to={`/sign/${card.slug}`}
            className="text-xs border border-purple-200 text-warm-600 hover:bg-warm-100 px-3 py-2 rounded-xl transition-colors">
            ✍️ Sign
          </Link>
        )}
        {card.status === 'active' && onCopySigningLink && (
          <button onClick={() => onCopySigningLink(card)}
            className="text-xs bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 px-3 py-2 rounded-xl transition-colors font-semibold">
            ✍️ Copy signing link
          </button>
        )}
        <button onClick={() => onCopyViewLink(card)}
          className="text-xs border border-purple-200 text-warm-600 hover:bg-warm-100 px-3 py-2 rounded-xl transition-colors">
          👁 Copy view link
        </button>
        {card.status === 'active' && onNotify && (
          <button onClick={() => onNotify(card)}
            className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-xl font-semibold transition-colors">
            📣 Notify
          </button>
        )}
        {onTransfer && card.status !== 'draft' && (
          <button onClick={() => onTransfer(card)}
            className="text-xs border border-green-200 text-green-700 hover:bg-green-50 px-3 py-2 rounded-xl transition-colors">
            ➡️ Transfer
          </button>
        )}
        {card.status === 'active' && card.recipient_email && onSendNow && (
          <button onClick={() => onSendNow(card)}
            className="text-xs bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded-xl transition-colors font-semibold">
            📬 Send now
          </button>
        )}
        {card.status === 'sent' && card.recipient_email && onResend && (
          <button onClick={() => onResend(card)}
            className="text-xs bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors font-semibold">
            📬 Resend
          </button>
        )}
      </div>
    </div>
  </div>
);

export default function CompanyMyCardsPage() {
  const [tab, setTab]             = useState('my');
  const [cards, setCards]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [members, setMembers]     = useState([]);
  const [transferCard, setTransferCard] = useState(null);
  const [transferMember, setTransferMember] = useState('');
  const [transferring, setTransferring]     = useState(false);
  const [notifyCard, setNotifyCard]         = useState(null);
  const [notifyScope, setNotifyScope]       = useState('all');
  const [notifyDept, setNotifyDept]         = useState('');
  const [notifying, setNotifying]           = useState(false);
  const [resyncing, setResyncing]           = useState(false);
  const [resending, setResending]           = useState(null);
  const [departments, setDepartments]       = useState([]);
  const [togglingId, setTogglingId]         = useState(null);

  useEffect(() => { fetchCards(); }, [tab]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'my' ? '/cards/company/mine'
        : tab === 'received' ? '/cards/company/received'
        : '/cards/company/delivered';
      const r = await companyAxios.get(endpoint);
      setCards(r.data || []);
    } catch { toast.error('Failed to load cards'); setCards([]); }
    finally { setLoading(false); }
  };

  const copySigningLink = (card) => {
    const link = `${window.location.origin}/sign/${card.slug}`;
    navigator.clipboard.writeText(link);
    toast.success('✓ Signing link copied — share this with colleagues to sign!');
  };

  const copyViewLink = (card) => {
    const link = `${window.location.origin}/card/${card.slug}`;
    navigator.clipboard.writeText(link);
    toast.success('✓ Private link copied — send this to the recipient only!');
  };

  const handleResend = async (card) => {
    setResending(card.slug);
    try {
      await companyAxios.post(`/cards/${card.slug}/send`);
      toast.success('Card resent! A fresh link has been emailed to the recipient. 📬');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend. Please try again.');
    } finally { setResending(null); }
  };

  const handleSendNow = async (card) => {
    if (!window.confirm(`Send card to ${card.recipient_email} now?`)) return;
    setResending(card.slug);
    try {
      await companyAxios.post(`/cards/${card.slug}/send`);
      setCards(prev => prev.map(c => c.slug === card.slug ? { ...c, status: 'sent', recipient_notified: true } : c));
      toast.success('Card delivered! A link has been emailed to the recipient. 📬');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send. Please try again.');
    } finally { setResending(null); }
  };

  const handleToggleHideAmounts = async (card) => {
    setTogglingId(card.id);
    try {
      const next = !card.hide_amounts;
      await companyAxios.put(`/cards/${card.slug}`, { hide_amounts: next });
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, hide_amounts: next } : c));
      toast.success(next ? 'Gift total hidden from signers' : 'Gift total now visible to signers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update this setting');
    } finally {
      setTogglingId(null);
    }
  };

  const loadDepts = async () => {
    try {
      const r = await companyAxios.get('/teams/all-members?limit=500');
      const ms = Array.isArray(r.data) ? r.data : r.data?.members || [];
      setDepartments([...new Set(ms.map(m => m.department).filter(Boolean))].sort());
    } catch {}
  };

  const loadMembers = async () => {
    if (members.length) return;
    try {
      const r = await companyAxios.get('/teams/all-members?limit=500');
      setMembers(Array.isArray(r.data) ? r.data : r.data?.members || []);
    } catch {}
  };

  const handleNotify = async () => {
    if (!notifyCard) return;
    setNotifying(true);
    try {
      const { cardsAPI } = await import('../../utils/api');
      const res = await cardsAPI.notifySigners(notifyCard.slug, {
        scope:      notifyScope,
        department: notifyScope === 'department' ? notifyDept : undefined,
      });
      toast.success(res.data.message);
      setNotifyCard(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Notification failed');
    } finally { setNotifying(false); }
  };

  const handleTransfer = async () => {
    if (!transferCard || !transferMember) return toast.error('Select a team member');
    setTransferring(true);
    try {
      await companyAxios.post(`/cards/${transferCard.slug}/transfer`, { member_id: transferMember });
      toast.success('Card transferred! Team member can now see it in their dashboard.');
      setTransferCard(null);
      setTransferMember('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    } finally { setTransferring(false); }
  };

  const handleResync = async () => {
    setResyncing(true);
    try {
      const res = await companyAxios.post('/occasions/resync');
      toast.success(res.data?.message || 'Resync started! Cards will appear shortly.');
      // Refresh cards after a short delay to pick up newly created ones
      setTimeout(() => fetchCards(), 4000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Resync failed. Please try again.');
    } finally {
      setResyncing(false);
    }
  };

  return (
    <CompanyLayout title="My Cards 🃏" subtitle="Create, manage and share group cards">
      {/* Tabs + Create button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 border-b border-purple-100 overflow-x-auto flex-1" style={{scrollbarWidth:'none'}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                tab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-warm-400 hover:text-warm-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
          <button
            onClick={handleResync}
            disabled={resyncing}
            title="Re-check all members for upcoming birthdays and occasions, creating cards and sending notifications immediately"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-purple-200 text-primary-600 bg-white hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span className={resyncing ? 'animate-spin inline-block' : ''}>🔄</span>
            {resyncing ? 'Checking...' : 'Sync Occasions'}
          </button>
          <Link to="/create-card" className="btn-primary text-sm py-2 px-4 whitespace-nowrap">+ Create Card</Link>
        </div>
      </div>

      {/* Cards list */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-20 rounded-2xl animate-pulse bg-purple-50"/>)}</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white border-2 border-dashed border-purple-100">
          <div className="text-5xl mb-4">{tab==='my'?'💌':tab==='received'?'📥':'✅'}</div>
          <p className="font-semibold text-warm-900 mb-2">No {TABS.find(t=>t.id===tab)?.desc?.toLowerCase()} yet</p>
          {tab === 'my' && <Link to="/create-card" className="btn-primary text-sm px-5 py-2.5">Create your first card</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => (
            <CardRow key={card.id} card={card} onCopySigningLink={copySigningLink} onCopyViewLink={copyViewLink}
              onTransfer={tab === 'my' ? (c) => { setTransferCard(c); loadMembers(); } : null}
              onNotify={tab === 'my' ? (c) => { setNotifyCard(c); loadDepts(); } : null}
              onResend={handleResend}
              onSendNow={tab === 'my' ? handleSendNow : null}
              onToggleHideAmounts={(tab === 'my' || tab === 'delivered') ? handleToggleHideAmounts : null}
              toggling={togglingId === card.id} />
          ))}
        </div>
      )}

      {/* Notify Signers modal */}
      {notifyCard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-warm-900 mb-1">📣 Notify team to sign</h3>
            <p className="text-sm text-warm-500 mb-4">
              <strong>{notifyCard.title || `For ${notifyCard.recipient_name}`}</strong> — choose who to notify by email and dashboard notification.
            </p>
            <div className="space-y-3 mb-5">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all" style={{borderColor: notifyScope==='all'?'#7C3AED':'#EDE9FF', background: notifyScope==='all'?'#F5F3FF':'white'}} onClick={()=>setNotifyScope('all')}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${notifyScope==='all'?'border-primary-600 bg-primary-600':'border-warm-300'}`} />
                <div><p className="text-sm font-semibold text-warm-900">All Departments</p><p className="text-xs text-warm-400">Everyone in the company will receive the notification</p></div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all" style={{borderColor: notifyScope==='department'?'#7C3AED':'#EDE9FF', background: notifyScope==='department'?'#F5F3FF':'white'}} onClick={()=>setNotifyScope('department')}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${notifyScope==='department'?'border-primary-600 bg-primary-600':'border-warm-300'}`} />
                <div><p className="text-sm font-semibold text-warm-900">Specific Department</p><p className="text-xs text-warm-400">Only the selected department gets notified</p></div>
              </label>
            </div>
            {notifyScope === 'department' && (
              <select className="input mb-4 text-sm" value={notifyDept} onChange={e=>setNotifyDept(e.target.value)}>
                <option value="">— Select department —</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={()=>{setNotifyCard(null); setNotifyScope('all'); setNotifyDept('');}} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={handleNotify} disabled={notifying || (notifyScope==='department' && !notifyDept)} className="btn-primary text-sm px-5 py-2">
                {notifying ? 'Sending…' : '📣 Send notifications'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {transferCard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-warm-900 mb-2">Transfer card to team member</h3>
            <p className="text-sm text-warm-500 mb-4">
              <strong>{transferCard.title || `For ${transferCard.recipient_name}`}</strong> will appear in the team member's dashboard.
            </p>
            <select className="input mb-4 text-sm"
              value={transferMember} onChange={e => setTransferMember(e.target.value)}>
              <option value="">— Select team member —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.first_name} {m.last_name} · {m.department}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setTransferCard(null); setTransferMember(''); }}
                className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={handleTransfer} disabled={transferring || !transferMember}
                className="btn-primary text-sm px-5 py-2">
                {transferring ? 'Transferring…' : 'Transfer card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CompanyLayout>
  );
}
