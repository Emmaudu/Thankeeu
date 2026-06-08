import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cardsAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../../utils/currency';

const occasionEmoji = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };
const FILTERS = ['all','draft','active','sent'];

export default function DashboardCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    cardsAPI.getAll().then(r => setCards(r.data||[])).catch(()=>toast.error('Failed to load')).finally(()=>setLoading(false));
  }, []);

  const filtered = filter==='all' ? cards : cards.filter(c=>c.status===filter);

  return (
    <DashboardLayout title="My Cards 💌" subtitle="All the cards you've created">
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-bold capitalize border-2 transition-all"
            style={{ background: filter===f?'#5B4BDF':'#fff', color: filter===f?'#fff':'#5B4BDF', borderColor: filter===f?'#5B4BDF':'#DDD8FF' }}>
            {f==='all'?`All (${cards.length})`:`${f.charAt(0).toUpperCase()+f.slice(1)} (${cards.filter(c=>c.status===f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i)=><div key={i} className="rounded-2xl h-52 animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16 rounded-2xl" style={{background:'#fff',border:'2px dashed #EDE9FF'}}>
          <div className="text-5xl mb-3">💌</div>
          <p className="font-semibold mb-4" style={{color:'#1A1730'}}>No {filter==='all'?'':''+filter+' '}cards yet</p>
          <Link to="/create-card" className="btn-primary text-sm px-6 py-2.5">✨ Create a card</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(card=>(
            <div key={card.id} className="rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all" style={{background:'#fff',borderColor:'#EDE9FF'}}>
              {/* Theme preview strip */}
              <div className="h-2 w-full" style={{background: card.background_color||'linear-gradient(90deg,#7C6EFF,#EC4899)'}} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:'#F5F3FF'}}>
                    {occasionEmoji[card.occasion]||'💌'}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{background:card.status==='active'?'#dcfce7':card.status==='sent'?'#dbeafe':'#f3e8ff',color:card.status==='active'?'#166534':card.status==='sent'?'#1e40af':'#6b21a8'}}>
                    {card.status==='active'?'Active ✓':card.status==='sent'?'Sent 🚀':card.status==='draft'?'Draft':'Expired'}
                  </span>
                </div>
                <p className="text-sm font-semibold line-clamp-1 mb-1" style={{color:'#1A1730'}}>{card.title}</p>
                <p className="text-xs mb-2" style={{color:'#7A7898'}}>For {card.recipient_name}</p>
                <div className="flex flex-wrap gap-3 text-xs" style={{color:'#9490C8'}}>
                  <span>✍️ {card.signed_count||0} signed</span>
                  {(card.total_collected||0)>0 && <span className="font-semibold" style={{color:'#059669'}}>🎁 {formatNGN(card.total_collected)}</span>}
                  {card.created_at && <span>{format(new Date(card.created_at),'MMM d, yy')}</span>}
                </div>
              </div>
              <div className="flex border-t" style={{borderColor:'#EDE9FF'}}>
                {card.status==='active' && (
                  <button className="flex-1 py-2.5 text-xs font-bold hover:bg-purple-50" style={{color:'#5B4BDF'}}
                    onClick={()=>{navigator.clipboard.writeText(`${location.origin}/sign/${card.slug}`);toast.success('Copied!');}}>
                    📲 Copy link
                  </button>
                )}
                <Link to={`/card/${card.slug}`} className="flex-1 py-2.5 text-center text-xs font-bold hover:bg-purple-50 border-l" style={{color:'#5B4BDF',borderColor:'#EDE9FF'}}>
                  👁️ View
                </Link>
                {card.status==='draft' && (
                  <Link to={`/create-card?edit=${card.slug}`} className="flex-1 py-2.5 text-center text-xs font-bold hover:bg-purple-50 border-l" style={{color:'#5B4BDF',borderColor:'#EDE9FF'}}>
                    ✏️ Edit
                  </Link>
                )}
              </div>
            </div>
          ))}
          <Link to="/create-card" className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 min-h-36 hover:border-primary-400 hover:bg-purple-50 transition-all" style={{borderColor:'#DDD8FF'}}>
            <span className="text-3xl">✨</span>
            <p className="text-sm font-semibold" style={{color:'#7A7898'}}>New card</p>
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
