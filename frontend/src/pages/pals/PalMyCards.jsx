import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PalLayout from './PalLayout';
import Icon from '../../components/ui/Icon';
import { palAPI } from '../../utils/api';
import toast from 'react-hot-toast';


import QRButton from '../../components/QRButton';
const OCCASION_ICON = { birthday: '🎂', farewell: '👋', graduation: '🎓', milestone: '🎉', promotion: '🎊' };
const STATUS_COLOR = s => ({ active:'bg-green-100 text-green-700', sent:'bg-blue-100 text-blue-700', draft:'bg-gray-100 text-gray-600' }[s]||'bg-gray-100 text-gray-600');

export default function PalMyCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    palAPI.getMyCards().then(r => setCards(r.data||[])).catch(()=>toast.error('Failed to load cards')).finally(()=>setLoading(false));
  }, []);

  const handleToggleHideAmounts = async (card) => {
    setTogglingId(card.id);
    try {
      const next = !card.hide_amounts;
      await palAPI.updateCard(card.slug, { hide_amounts: next });
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, hide_amounts: next } : c));
      toast.success(next ? 'Gift total hidden from signers' : 'Gift total now visible to signers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update this setting');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <PalLayout title="My Cards" subtitle="Automatically created for your group's celebrations">
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Icon name="Info" size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-primary-700">
          Pals members can't create cards manually — Thankeeu automatically creates a card whenever a member's birthday, resignation, graduation, milestone, or promotion date comes up, and emails everyone in the group to sign it.
        </p>
      </div>

      {loading
        ? <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-20 bg-purple-50 rounded-2xl animate-pulse"/>)}</div>
        : cards.length === 0
          ? <div className="text-center py-20 text-warm-400">
              <Icon name="Cake" size={48} className="mx-auto mb-4 text-purple-200" />
              <p className="font-semibold">No cards yet</p>
              <p className="text-sm mt-1">Set members' birthdays and event dates to get started</p>
              <Link to="/pals/dashboard/members" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold">Go to members</Link>
            </div>
          : <div className="space-y-3">
              {cards.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-purple-100 flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                  <Link to={`/sign/${c.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {OCCASION_ICON[c.occasion] || '🎁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-warm-900 text-sm">{c.recipient_name}'s {c.occasion}</p>
                      <p className="text-xs text-warm-400">
                        {c.send_date ? new Date(c.send_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—'}
                        {c.send_date && c.send_time && ` at ${c.send_time.slice(0,5)}`}
                        {c.total_collected > 0 && <span className="ml-2 font-semibold text-emerald-600">🎁 ₦{c.total_collected.toLocaleString()}</span>}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLOR(c.status)}`}>{c.status}</span>
                    <Icon name="ExternalLink" size={14} className="text-warm-300 flex-shrink-0" />
                  </Link>
                  {c.is_gift_enabled && (
                    <button
                      disabled={togglingId === c.id}
                      onClick={() => handleToggleHideAmounts(c)}
                      title={c.hide_amounts ? "Signers can't see the gift total — click to make it visible" : 'Signers can see the gift total — click to hide it'}
                      className="text-xs border border-purple-200 text-warm-600 hover:bg-warm-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {togglingId === c.id ? '…' : c.hide_amounts ? '👁️ Show total' : '🙈 Hide total'}
                    </button>
                  )}
                </div>
              ))}
            </div>
      }
    </PalLayout>
  );
}
