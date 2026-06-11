import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { memberAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';
import { useMemberAuth } from '../../context/MemberAuthContext';
import { formatNGN } from '../../utils/currency';

export default function MemberReceivedPage() {
  const { member } = useMemberAuth();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backend returns: [{ id, transferred_at, opened_at, note, card: { id, slug, title, ... } }]
    memberAPI.getReceived()
      .then(r => setRows(r.data || []))
      .catch(err => console.error('Received cards error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MemberLayout title="Received Cards 🎁" subtitle="Cards transferred to you by your team">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_,i) => (
            <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background:'#EDE9FF' }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background:'#fff', border:'2px dashed #EDE9FF' }}>
          <div className="text-5xl mb-3">🎁</div>
          <p className="font-bold text-lg mb-2" style={{ color:'#1A1730' }}>No received cards yet</p>
          <p className="text-sm" style={{ color:'#7A7898' }}>
            When someone transfers a card to you, it appears here.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(row => {
            // Backend wraps: { id, transferred_at, note, card: { slug, title, ... } }
            const cardData = row.card;
            if (!cardData) return null; // skip if card was deleted

            return (
              <Link
                to={`/card/${cardData.slug}`}
                key={row.id}
                className="rounded-2xl border-2 p-4 hover:shadow-md transition-all block"
                style={{ background:'rgba(124,110,255,0.04)', borderColor:'rgba(124,110,255,0.2)' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎁</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color:'#1A1730' }}>
                      {cardData.title || `${cardData.recipient_name}'s card`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:'#7A7898' }}>
                      For {cardData.recipient_name}
                    </p>
                    <p className="text-xs mt-1 capitalize" style={{ color:'#9490C8' }}>
                      {cardData.occasion?.replace(/_/g,' ')}
                    </p>
                    {row.transferred_at && (
                      <p className="text-xs mt-1" style={{ color:'#9490C8' }}>
                        Received {new Date(row.transferred_at).toLocaleDateString()}
                      </p>
                    )}
                    {row.note && (
                      <p className="text-xs mt-1 italic truncate" style={{ color:'#6B678A' }}>
                        "{row.note}"
                      </p>
                    )}
                    {(cardData.total_collected || 0) > 0 && (
                      <p className="text-xs mt-1 font-semibold" style={{ color:'#059669' }}>
                        🎁 {formatNGN(cardData.total_collected)} gift pot
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                    cardData.status === 'active' ? 'bg-green-100 text-green-700'
                    : cardData.status === 'sent'   ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cardData.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </MemberLayout>
  );
}
