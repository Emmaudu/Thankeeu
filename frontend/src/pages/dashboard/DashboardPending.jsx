import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';

const EMOJI = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardPending() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dashboardAPI.getPendingToSign().then(r=>setItems(r.data||[])).finally(()=>setLoading(false)); }, []);

  return (
    <DashboardLayout title="Pending to Sign" subtitle="Cards you've been invited to sign">
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="rounded-2xl h-20 animate-pulse" style={{background:'#EDE9FE'}}/>)}</div>
      ) : items.length===0 ? (
        <div className="db-empty">
          <div className="db-empty-icon"><Icon name="Edit" size={28} className="text-primary-400"/></div>
          <p className="db-empty-title">Nothing to sign right now</p>
          <p className="db-empty-body">When you're invited to sign a card, it appears here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item=>(
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:shadow-sm" style={{background:'#fff',borderColor:'#EDE9FE'}}>
              <div className="section-dots w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:'#F5F0FF'}}>
                {EMOJI[item.cards?.occasion]||'💌'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="db-card-item-title">{item.cards?.title}</p>
                <p className="db-card-item-meta">For {item.cards?.recipient_name}</p>
                {item.cards?.deadline && (
                  <p className="text-xs font-semibold mt-0.5" style={{color:'#DC2626',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                    <Icon name="Clock" size={11} className="inline mr-1"/>Deadline: {new Date(item.cards.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Link to={`/sign/${item.cards?.slug}`} className="btn-primary text-sm px-5 py-2.5 flex-shrink-0 inline-flex items-center gap-1.5">
                <Icon name="Edit" size={13}/>Sign now
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
