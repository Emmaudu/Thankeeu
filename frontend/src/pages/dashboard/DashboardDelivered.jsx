import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import { format } from 'date-fns';
import { formatNGN } from '../../utils/currency';

const occasionEmoji = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardDelivered() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getDeliveredCards().then(r=>setCards(r.data||[])).finally(()=>setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Delivered Cards 🚀" subtitle="Cards you've successfully sent — saved forever">
      <div className="mb-4 p-3 rounded-xl text-sm" style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',color:'#065f46'}}>
        ♾️ Delivered cards are saved for lifetime — they will never expire or be deleted.
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="rounded-2xl h-40 animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : cards.length===0 ? (
        <div className="dash-empty py-16">
          <div className="text-5xl mb-3">🚀</div>
          <p className="font-semibold mb-2" style={{color:'#1A1730'}}>No delivered cards yet</p>
          <p className="text-sm" style={{color:'#7A7898'}}>Cards you send will appear here, saved forever.</p>
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
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'#dbeafe',color:'#1e40af'}}>Sent 🚀</span>
              </div>
              <div className="flex gap-4 text-xs" style={{color:'#9490C8'}}>
                <span>✍️ {card.messages?.[0]?.count||0}</span>
                {(card.total_collected||0)>0 && <span className="font-semibold" style={{color:'#059669'}}>🎁 {formatNGN(card.total_collected)}</span>}
                {card.opened_at && <span className="font-semibold" style={{color:'#7C6EFF'}}>👀 Opened</span>}
              </div>
              {card.updated_at && <p className="text-xs mt-2" style={{color:'#9490C8'}}>{format(new Date(card.updated_at),'MMM d, yyyy')}</p>}
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
