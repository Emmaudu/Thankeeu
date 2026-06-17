import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';

const occasionEmoji = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardPending() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getPendingToSign().then(r=>setItems(r.data||[])).finally(()=>setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Pending to Sign ✍️" subtitle="Cards you've been invited to sign">
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="rounded-2xl h-20 animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : items.length===0 ? (
        <div className="dash-empty py-16">
          <div className="text-5xl mb-3">✍️</div>
          <p className="font-semibold mb-2" style={{color:'#1A1730'}}>Nothing to sign right now</p>
          <p className="text-sm" style={{color:'#7A7898'}}>When you're invited to sign a card, it appears here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item=>(
            <div key={item.id} className="dash-card dash-card-hover p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'#F5F3FF'}}>
                {occasionEmoji[item.cards?.occasion]||'💌'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{color:'#1A1730'}}>{item.cards?.title}</p>
                <p className="text-xs mt-0.5" style={{color:'#7A7898'}}>For {item.cards?.recipient_name}</p>
                {item.cards?.deadline && <p className="text-xs mt-0.5" style={{color:'#e64a19'}}>⏰ Deadline: {new Date(item.cards.deadline).toLocaleDateString()}</p>}
              </div>
              <Link to={`/sign/${item.cards?.slug}`} className="dash-btn-primary flex-shrink-0 px-4 py-2 text-sm">
                Sign now ✍️
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
