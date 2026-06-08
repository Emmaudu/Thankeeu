import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';
import { useMemberAuth } from '../../context/MemberAuthContext';

export default function MemberReceivedPage() {
  const { member } = useMemberAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use member token for received cards
    import('../../utils/api').then(({ memberAPI }) => {
      memberAPI.getReceivedCards?.()
        .then(r => setCards(r.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <MemberLayout title="Received Cards 🎁" subtitle="Card boxes transferred to you">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><div key={i} className="h-36 rounded-2xl animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{background:'#fff',border:'2px dashed #EDE9FF'}}>
          <div className="text-5xl mb-3">🎁</div>
          <p className="font-bold text-lg mb-2" style={{color:'#1A1730'}}>No received cards yet</p>
          <p className="text-sm" style={{color:'#7A7898'}}>When someone transfers a card to @{member?.username||'you'}, it appears here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => (
            <Link to={`/card/${card.slug}`} key={card.received_id||card.id}
              className="rounded-2xl border-2 p-4 hover:shadow-md transition-all block"
              style={{background:'rgba(124,110,255,0.04)',borderColor:'rgba(124,110,255,0.2)'}}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="font-bold text-sm" style={{color:'#1A1730'}}>{card.title||`${card.recipient_name}'s card`}</p>
                  <p className="text-xs mt-0.5" style={{color:'#7A7898'}}>For {card.recipient_name}</p>
                  {card.received_at && <p className="text-xs mt-1" style={{color:'#9490C8'}}>Received {new Date(card.received_at).toLocaleDateString()}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
