import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';
import { format } from 'date-fns';
import { formatNGN } from '../../utils/currency';

export default function DashboardFinances() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dashboardAPI.getFinancialHistory().then(r=>setItems(r.data||[])).finally(()=>setLoading(false)); }, []);
  const total = items.reduce((s,i)=>s+(i.amount||0),0);

  return (
    <DashboardLayout title="Financial History" subtitle="All gift contributions collected on your cards">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="db-stat-card db-stat-hi">
          <p className="db-stat-label">Total collected</p>
          <p className="db-stat-value db-stat-value-hi">{formatNGN(total)}</p>
        </div>
        <div className="db-stat-card">
          <p className="db-stat-label">Transactions</p>
          <p className="db-stat-value">{items.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="rounded-2xl h-16 animate-pulse" style={{background:'#EDE9FE'}}/>)}</div>
      ) : items.length===0 ? (
        <div className="db-empty">
          <div className="db-empty-icon"><Icon name="Wallet" size={28} className="text-primary-400"/></div>
          <p className="db-empty-title">No transactions yet</p>
          <p className="db-empty-body">Gift contributions on your cards will appear here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 overflow-hidden" style={{background:'#fff',borderColor:'#EDE9FE'}}>
          <div className="px-5 py-3 border-b" style={{borderColor:'#EDE9FE',background:'#F7F5FF'}}>
            <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:'0.75rem',color:'#A898CC',letterSpacing:'0.06em'}}>TRANSACTION HISTORY</p>
          </div>
          <div className="divide-y" style={{borderColor:'#EDE9FE'}}>
            {items.map(item=>(
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'rgba(16,185,129,0.1)'}}>
                  <Icon name="Gift" size={16} className="text-green-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="db-card-item-title">{item.contributor_name}</p>
                  <p className="db-card-item-meta">{item.cards?.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:'0.9rem',color:'#059669'}}>+{formatNGN(item.amount)}</p>
                  <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:'0.75rem',color:'#A898CC'}}>{format(new Date(item.created_at),'MMM d, yy')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
