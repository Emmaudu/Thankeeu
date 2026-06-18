import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const EMOJI = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardReceived() {
  const { user }  = useAuth();
  const [cards,   setCards]   = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dashboardAPI.getReceivedCards().then(r=>setCards(r.data||[])).finally(()=>setLoading(false)); }, []);

  return (
    <DashboardLayout title="Received Cards" subtitle="Card boxes transferred to you by others">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><div key={i} className="rounded-2xl h-40 animate-pulse" style={{background:'#EDE9FE'}}/>)}</div>
      ) : cards.length===0 ? (
        <div className="db-empty">
          <div className="db-empty-icon"><Icon name="Gift" size={28} className="text-primary-400"/></div>
          <p className="db-empty-title">No received cards yet</p>
          <p className="db-empty-body">When someone transfers a card to @{user?.username||'you'}, it appears here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card=>(
            <Link to={`/card/${card.slug}`} key={card.id} className="db-card-item" style={{textDecoration:'none'}}>
              <div className="db-card-item-body">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{EMOJI[card.occasion]||'💌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="db-card-item-title">{card.title}</p>
                    <p className="db-card-item-meta">For {card.recipient_name}</p>
                  </div>
                  <span className="db-badge" style={{background:'rgba(124,58,237,0.1)',color:'#6D28D9'}}>Received</span>
                </div>
                {card.received_at && <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:'0.8rem',color:'#A898CC'}}>Received {format(new Date(card.received_at),'MMM d, yyyy')}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
