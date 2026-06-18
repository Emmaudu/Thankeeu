import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { memberCardsAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';
import { useMemberAuth } from '../../context/MemberAuthContext';
import toast from 'react-hot-toast';
import { formatNGN } from '../../utils/currency';

const occasionEmoji = { birthday:'🎂',leaving:'👋',promotion:'🌟',anniversary:'💍',graduation:'🎓',wedding:'💒',other:'🎉' };

export default function MemberCardsPage() {
  const { member } = useMemberAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    memberCardsAPI.getHistory()
      .then(r => setCards(r.data || []))
      .catch(() => toast.error('Failed to load cards'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleHideAmounts = async (card) => {
    setTogglingId(card.id);
    try {
      const next = !card.hide_amounts;
      await memberCardsAPI.update(card.slug, { hide_amounts: next });
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, hide_amounts: next } : c));
      toast.success(next ? 'Gift total hidden from signers' : 'Gift total now visible to signers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update this setting');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <MemberLayout title="My Cards 💌" subtitle="Cards you've created for colleagues">
      <div className="flex justify-end mb-5">
        <Link to="/member/occasions" className="btn-primary text-sm px-5 py-2.5">+ Create card</Link>
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-40 rounded-2xl animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{background:'#fff',border:'2px dashed #EDE9FF'}}>
          <div className="text-5xl mb-3">💌</div>
          <p className="font-bold text-lg mb-2" style={{color:'#1A1730'}}>No cards yet</p>
          <p className="text-sm mb-4" style={{color:'#7A7898'}}>Create your first group card from the Occasions tab.</p>
          <Link to="/member/occasions" className="btn-primary text-sm px-6 py-2.5">🎉 Create a card</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <div key={card.id} className="rounded-2xl border-2 overflow-hidden" style={{background:'#fff',borderColor:'#EDE9FF'}}>
              <div className="h-2" style={{background:card.background_color||'linear-gradient(90deg,#7C6EFF,#EC4899)'}}/>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl">{occasionEmoji[card.occasion]||'💌'}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:card.status==='active'?'#dcfce7':card.status==='sent'?'#dbeafe':'#f3e8ff',color:card.status==='active'?'#166534':card.status==='sent'?'#1e40af':'#6b21a8'}}>{card.status}</span>
                </div>
                <p className="font-bold text-sm mb-1" style={{color:'#1A1730'}}>{card.title || `${card.recipient_name}'s card`}</p>
                <p className="text-xs" style={{color:'#7A7898'}}>For {card.recipient_name}</p>
                {card.total_collected > 0 && (
                  <p className="text-xs font-bold mt-1" style={{color:'#059669'}}>🎁 {formatNGN(card.total_collected)}</p>
                )}
              </div>
              <div className="border-t flex" style={{borderColor:'#EDE9FF'}}>
                <Link to={`/card/${card.slug}`} className="flex-1 py-2.5 text-center text-sm font-bold hover:bg-purple-50" style={{color:'#5B4BDF'}}>👁 View</Link>
                {card.status==='active' && (
                  <button className="flex-1 py-2.5 text-sm font-bold hover:bg-purple-50 border-l" style={{color:'#5B4BDF',borderColor:'#EDE9FF'}}
                    onClick={()=>{navigator.clipboard.writeText(`${location.origin}/sign/${card.slug}`);toast.success('Link copied!');}}>
                    📲 Copy link
                  </button>
                )}
                {card.is_gift_enabled && (
                  <button
                    disabled={togglingId === card.id}
                    className="flex-1 py-2.5 text-sm font-bold hover:bg-purple-50 border-l disabled:opacity-50"
                    style={{color:'#5B4BDF',borderColor:'#EDE9FF'}}
                    title={card.hide_amounts ? "Signers can't see the gift total — click to make it visible" : 'Signers can see the gift total — click to hide it'}
                    onClick={() => handleToggleHideAmounts(card)}
                  >
                    {togglingId === card.id ? '…' : card.hide_amounts ? '🙈 Hidden' : '👁️ Visible'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
