import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const occasionEmoji = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardReceived() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getReceivedCards().then(r=>setCards(r.data||[])).finally(()=>setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Received Cards 🎁" subtitle="Card boxes transferred to you by others">
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><div key={i} className="rounded-2xl h-40 animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : cards.length===0 ? (
        <div className="dash-empty py-16">
          <div className="text-5xl mb-3">🎁</div>
          <p className="font-semibold mb-2" style={{color:'#1A1730'}}>No received cards yet</p>
          <p className="text-sm" style={{color:'#7A7898'}}>When someone transfers a card to @{user?.username || 'you'}, it appears here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card=>(
            <Link to={`/card/${card.slug}`} key={card.id} className="dash-card dash-card-hover p-4 block">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{occasionEmoji[card.occasion]||'💌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1" style={{color:'#1A1730'}}>{card.title}</p>
                  <p className="text-xs mt-0.5" style={{color:'#7A7898'}}>For {card.recipient_name}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(124,110,255,0.12)',color:'#5B4BDF'}}>🎁 Received</span>
              </div>
              {card.received_at && <p className="text-xs" style={{color:'#9490C8'}}>Received {format(new Date(card.received_at),'MMM d, yyyy')}</p>}
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
