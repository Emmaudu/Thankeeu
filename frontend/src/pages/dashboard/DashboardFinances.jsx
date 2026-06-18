import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { format } from 'date-fns';
import { formatNGN } from '../../utils/currency';

export default function DashboardFinances() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getFinancialHistory().then(r=>setItems(r.data||[])).finally(()=>setLoading(false));
  }, []);

  const total = items.reduce((s,i)=>s+(i.amount||0), 0);

  return (
    <DashboardLayout title="Financial History 💰" subtitle="All gift contributions on your cards">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl p-4 border-2" style={{background:'rgba(124,110,255,0.06)',borderColor:'rgba(124,110,255,0.2)'}}>
          <p className="text-xs font-medium mb-1" style={{color:'#7A7898'}}>Total collected</p>
          <p className="text-2xl font-bold" style={{fontFamily:'Space Grotesk,sans-serif',color:'#5B4BDF'}}>{formatNGN(total)}</p>
        </div>
        <div className="rounded-2xl p-4 border-2" style={{background:'rgba(16,185,129,0.06)',borderColor:'rgba(16,185,129,0.2)'}}>
          <p className="text-xs font-medium mb-1" style={{color:'#7A7898'}}>Transactions</p>
          <p className="text-2xl font-bold" style={{fontFamily:'Space Grotesk,sans-serif',color:'#059669'}}>{items.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="rounded-2xl h-16 animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : items.length===0 ? (
        <div className="dash-empty py-16">
          <div className="text-5xl mb-3">💰</div>
          <p className="font-semibold" style={{color:'#1A1730'}}>No transactions yet</p>
          <p className="text-sm mt-1" style={{color:'#7A7898'}}>Gift contributions on your cards will appear here.</p>
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{borderColor:'#EDE9FF',background:'#F9F8FF'}}>
            <p className="text-xs font-semibold" style={{color:'#7A7898'}}>TRANSACTION HISTORY</p>
          </div>
          <div className="divide-y" style={{borderColor:'#EDE9FF'}}>
            {items.map(item=>(
              <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg" style={{background:'rgba(16,185,129,0.1)'}}>🎁</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1" style={{color:'#1A1730'}}>{item.contributor_name}</p>
                  <p className="text-xs" style={{color:'#7A7898'}}>{item.cards?.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{color:'#059669'}}>+{formatNGN(item.amount)}</p>
                  <p className="text-xs" style={{color:'#9490C8'}}>{format(new Date(item.created_at),'MMM d, yy')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
