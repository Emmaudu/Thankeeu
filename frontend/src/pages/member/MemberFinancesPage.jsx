import { useState, useEffect } from 'react';
import { memberAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';
import { formatNGN } from '../../utils/currency';

export default function MemberFinancesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    memberAPI.getFinancialHistory?.()
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <MemberLayout title="Financial History 💰" subtitle="Gift contributions on your cards">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl p-5 border-2" style={{background:'rgba(124,110,255,0.06)',borderColor:'rgba(124,110,255,0.2)'}}>
          <p className="text-sm font-medium mb-1" style={{color:'#7A7898'}}>Total collected</p>
          <p className="text-2xl font-bold" style={{fontFamily:'Space Grotesk,sans-serif',color:'#5B4BDF'}}>{formatNGN(total)}</p>
        </div>
        <div className="rounded-2xl p-5 border-2" style={{background:'rgba(16,185,129,0.06)',borderColor:'rgba(16,185,129,0.2)'}}>
          <p className="text-sm font-medium mb-1" style={{color:'#7A7898'}}>Transactions</p>
          <p className="text-2xl font-bold" style={{fontFamily:'Space Grotesk,sans-serif',color:'#059669'}}>{items.length}</p>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="h-16 rounded-2xl animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{background:'#fff',border:'2px dashed #EDE9FF'}}>
          <div className="text-5xl mb-3">💰</div>
          <p className="font-bold text-lg" style={{color:'#1A1730'}}>No transactions yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 overflow-hidden" style={{background:'#fff',borderColor:'#EDE9FF'}}>
          <div className="divide-y" style={{borderColor:'#EDE9FF'}}>
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{background:'rgba(16,185,129,0.1)'}}>🎁</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{color:'#1A1730'}}>{item.contributor_name || 'Anonymous'}</p>
                  <p className="text-xs" style={{color:'#7A7898'}}>{item.card_title || 'Card contribution'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{color:'#059669'}}>+{formatNGN(item.amount)}</p>
                  {item.created_at && <p className="text-xs" style={{color:'#9490C8'}}>{new Date(item.created_at).toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
