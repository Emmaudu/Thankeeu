import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { memberAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';

const occasionEmoji = { birthday:'🎂',leaving:'👋',promotion:'🌟',anniversary:'💍',graduation:'🎓',wedding:'💒',other:'🎉' };

export default function MemberPendingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    memberAPI.getPendingToSign?.()
      .then(r => setItems(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <MemberLayout title="Pending to Sign ✍️" subtitle="Cards awaiting your message">
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-20 rounded-2xl animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{background:'#fff',border:'2px dashed #EDE9FF'}}>
          <div className="text-5xl mb-3">✍️</div>
          <p className="font-bold text-lg mb-2" style={{color:'#1A1730'}}>Nothing to sign right now</p>
          <p className="text-sm" style={{color:'#7A7898'}}>Cards you're invited to sign will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-2xl border-2 p-4 flex items-center gap-4" style={{background:'#fff',borderColor:'#EDE9FF'}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'#F5F3FF'}}>
                {occasionEmoji[item.occasion]||'💌'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{color:'#1A1730'}}>{item.title||`${item.recipient_name}'s card`}</p>
                <p className="text-xs mt-0.5" style={{color:'#7A7898'}}>For {item.recipient_name}</p>
                {item.deadline && <p className="text-xs mt-0.5" style={{color:'#dc2626'}}>⏰ Deadline: {new Date(item.deadline).toLocaleDateString()}</p>}
              </div>
              <Link to={`/sign/${item.slug}`} className="btn-primary text-sm px-4 py-2 flex-shrink-0">Sign ✍️</Link>
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
