import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cardsAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { formatNGN } from '../../utils/currency';

const EMOJI = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };
const FILTERS = ['all','draft','active','sent'];

export default function DashboardCards() {
  const [cards,   setCards]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [togglingId, setTogglingId] = useState(null);
  const [resending,  setResending]  = useState(null);

  useEffect(() => {
    cardsAPI.getAll().then(r=>setCards(r.data||[])).catch(()=>toast.error('Failed to load')).finally(()=>setLoading(false));
  }, []);

  const handleToggleHideAmounts = async (card) => {
    setTogglingId(card.id);
    try {
      const next = !card.hide_amounts;
      await cardsAPI.update(card.slug, { hide_amounts: next });
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, hide_amounts: next } : c));
      toast.success(next ? 'Gift total hidden from signers' : 'Gift total now visible to signers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update this setting');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = filter==='all' ? cards : cards.filter(c=>c.status===filter);

  return (
    <DashboardLayout title="My Cards" subtitle="All the cards you've created">
      <div className="db-filter-row">
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`db-filter-pill ${filter===f?'active':''}`}>
            {f==='all'?`All (${cards.length})`:`${f.charAt(0).toUpperCase()+f.slice(1)} (${cards.filter(c=>c.status===f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i)=><div key={i} className="rounded-2xl h-52 animate-pulse" style={{background:'#EDE9FE'}}/>)}
        </div>
      ) : filtered.length===0 ? (
        <div className="db-empty">
          <div className="db-empty-icon"><Icon name="Heart" size={28} className="text-primary-400"/></div>
          <p className="db-empty-title">No {filter==='all'?'':filter+' '}cards yet</p>
          <p className="db-empty-body">{filter==='all'?'Create your first group card in 2 minutes.':'Try a different filter.'}</p>
          {filter==='all' && <Link to="/create-card" className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2"><Icon name="Sparkles" size={14}/>Create a card</Link>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(card=>(
            <div key={card.id} className="db-card-item">
              <div className="h-1.5 w-full" style={{background:card.background_color||'linear-gradient(90deg,#7C3AED,#EC4899)'}}/>
              <div className="db-card-item-body">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="section-dots w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:'#F5F0FF'}}>
                    {EMOJI[card.occasion]||'💌'}
                  </div>
                  <span className={`db-badge db-badge-${card.status||'draft'}`}>
                    {card.status==='active'?'Active':card.status==='sent'?'Sent':'Draft'}
                  </span>
                </div>
                <p className="db-card-item-title">{card.title}</p>
                <p className="db-card-item-meta mb-2">For {card.recipient_name}</p>
                <div className="flex flex-wrap gap-3" style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:'0.8rem',color:'#A898CC'}}>
                  <span><Icon name="Edit" size={12} className="inline mr-1"/>{card.signed_count||0} signed</span>
                  {(card.total_collected||0)>0 && <span style={{color:'#059669',fontWeight:700}}>{formatNGN(card.total_collected)}</span>}
                  {(card.send_date||card.created_at) && <span>{format(new Date(card.send_date||card.created_at),'MMM d, yy')}{card.send_date && card.send_time ? ` ${card.send_time.slice(0,5)}` : ''}</span>}
                </div>
              </div>
              <div className="db-card-item-footer">
                {card.status==='active' && (
                  <button className="db-card-item-action" onClick={()=>{navigator.clipboard.writeText(`${location.origin}/sign/${card.slug}`);toast.success('Copied!');}}>
                    <Icon name="Share" size={13}/>Copy link
                  </button>
                )}
                <Link to={`/card/${card.slug}`} className="db-card-item-action"><Icon name="Eye" size={13}/>View</Link>
                {(card.status==='draft' || card.status==='active') && (
                  <Link to={`/create-card?edit=${card.slug}`} className="db-card-item-action"><Icon name="Edit" size={13}/>Edit</Link>
                )}
                {card.status==='sent' && card.recipient_email && (
                  <button
                    className="db-card-item-action"
                    disabled={resending===card.slug}
                    onClick={async e => {
                      e.preventDefault(); e.stopPropagation();
                      setResending(card.slug);
                      try {
                        await cardsAPI.send(card.slug);
                        toast.success('Card resent! Fresh link emailed to recipient. 📬');
                      } catch(err) {
                        toast.error(err.response?.data?.error||'Failed to resend.');
                      } finally { setResending(null); }
                    }}>
                    <Icon name="Send" size={13}/>{resending===card.slug?'Sending…':'Resend'}
                  </button>
                )}
                {card.is_gift_enabled && (
                  <button
                    className="db-card-item-action"
                    disabled={togglingId === card.id}
                    title={card.hide_amounts ? "Signers can't see the gift total — click to make it visible" : 'Signers can see the gift total — click to hide it'}
                    onClick={() => handleToggleHideAmounts(card)}
                  >
                    <Icon name={card.hide_amounts ? 'EyeOff' : 'Eye'} size={13}/>
                    {togglingId === card.id ? 'Updating…' : card.hide_amounts ? 'Total hidden' : 'Total visible'}
                  </button>
                )}
              </div>
            </div>
          ))}
          <Link to="/create-card" className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 min-h-40 transition-all hover:border-primary-400 hover:bg-primary-50" style={{borderColor:'#DDD6FE'}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#EDE9FE'}}>
              <Icon name="Plus" size={20} className="text-primary-500"/>
            </div>
            <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:700,fontSize:'0.9rem',color:'#A898CC'}}>New card</p>
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
