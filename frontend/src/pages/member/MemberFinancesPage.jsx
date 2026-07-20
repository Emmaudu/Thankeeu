import { useState, useEffect } from 'react';
import { memberAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';
import { formatNGN } from '../../utils/currency';

export default function MemberFinancesPage() {
  const [data, setData]     = useState({ contributions: [], my_card_wallets: [], total_contributed: 0, total_collected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    // getFinances returns { contributions, my_card_wallets, total_contributed, total_collected }
    memberAPI.getFinances()
      .then(r => {
        const d = r.data || {};
        setData({
          contributions:     d.contributions     || [],
          my_card_wallets:   d.my_card_wallets   || [],
          total_contributed: d.total_contributed || 0,
          total_collected:   d.total_collected   || 0,
        });
      })
      .catch(err => {
        console.error('Finances error:', err);
        setError('Failed to load financial history');
      })
      .finally(() => setLoading(false));
  }, []);

  const { contributions, my_card_wallets, total_contributed, total_collected } = data;

  return (
    <MemberLayout title="Financials 💰" subtitle="Gift pot contributions and collections">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="min-w-0 rounded-2xl p-5 border-2" style={{ background:'rgba(124,110,255,0.06)', borderColor:'rgba(124,110,255,0.2)' }}>
          <p className="text-base font-medium mb-1" style={{ color:'#7A7898' }}>I contributed</p>
          <p className="text-2xl font-bold" style={{ fontFamily:'Space Grotesk,sans-serif', color:'#5B4BDF', overflowWrap:'break-word' }}>
            {formatNGN(total_contributed)}
          </p>
          <p className="text-sm mt-1" style={{ color:'#9490C8' }}>Gifts given to others</p>
        </div>
        <div className="min-w-0 rounded-2xl p-5 border-2" style={{ background:'rgba(16,185,129,0.06)', borderColor:'rgba(16,185,129,0.2)' }}>
          <p className="text-base font-medium mb-1" style={{ color:'#7A7898' }}>Collected for me</p>
          <p className="text-2xl font-bold" style={{ fontFamily:'Space Grotesk,sans-serif', color:'#059669', overflowWrap:'break-word' }}>
            {formatNGN(total_collected)}
          </p>
          <p className="text-sm mt-1" style={{ color:'#6EE7B7' }}>On cards you created</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background:'#EDE9FF' }} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 rounded-2xl" style={{ background:'#fff', border:'2px dashed #EDE9FF' }}>
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-semibold text-lg" style={{ color:'#1A1730' }}>{error}</p>
        </div>
      ) : contributions.length === 0 && my_card_wallets.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background:'#fff', border:'2px dashed #EDE9FF' }}>
          <div className="text-5xl mb-3">💰</div>
          <p className="font-bold text-lg" style={{ color:'#1A1730' }}>No financial activity yet</p>
          <p className="text-base mt-2" style={{ color:'#7A7898' }}>
            Gift pot contributions and collections will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Contributions made */}
          {contributions.length > 0 && (
            <div className="rounded-2xl border-2 overflow-hidden" style={{ background:'#fff', borderColor:'#EDE9FF' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor:'#EDE9FF', background:'#F9F8FF' }}>
                <p className="font-semibold text-base" style={{ color:'#1A1730' }}>💸 Gifts I contributed</p>
              </div>
              <div className="divide-y" style={{ borderColor:'#EDE9FF' }}>
                {contributions.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background:'rgba(124,110,255,0.1)' }}>💸</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold" style={{ color:'#1A1730' }}>
                        {item.card?.title || item.card?.recipient_name ? `${item.card.recipient_name}'s card` : 'Card contribution'}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color:'#7A7898' }}>
                        {item.card?.occasion ? item.card.occasion.replace('_',' ') : 'Occasion'} · {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold" style={{ color:'#5B4BDF' }}>-{formatNGN(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gift wallets on my cards */}
          {my_card_wallets.length > 0 && (
            <div className="rounded-2xl border-2 overflow-hidden" style={{ background:'#fff', borderColor:'#EDE9FF' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor:'#EDE9FF', background:'#F9F8FF' }}>
                <p className="font-semibold text-base" style={{ color:'#1A1730' }}>🎁 Gift pots on cards I created</p>
              </div>
              <div className="divide-y" style={{ borderColor:'#EDE9FF' }}>
                {my_card_wallets.map((card, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background:'rgba(16,185,129,0.1)' }}>🎁</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold" style={{ color:'#1A1730' }}>
                        {card.title || `${card.recipient_name}'s card`}
                      </p>
                      <p className="text-sm mt-0.5 capitalize" style={{ color:'#7A7898' }}>
                        {card.occasion?.replace('_',' ')} · {card.status}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold" style={{ color:'#059669' }}>+{formatNGN(card.total_collected)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </MemberLayout>
  );
}
