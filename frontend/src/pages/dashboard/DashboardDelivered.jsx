import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, cardsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';
import { format } from 'date-fns';
import { formatNGN } from '../../utils/currency';
import { asArray } from '../../utils/asArray';

const EMOJI = { birthday:'🎂',valentine:'💝',leaving:'💼',anniversary:'💍',wedding:'💒',baby_shower:'👶',retirement:'🏖️',congratulations:'🎉',graduation:'🎓',promotion:'🌟',christmas:'🎄',get_well:'🌷',new_year:'✨',other:'💌' };

export default function DashboardDelivered() {
  const [cards,     setCards]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [resending, setResending] = useState(null); // slug of card being resent
  useEffect(() => { dashboardAPI.getDeliveredCards().then(r=>setCards(asArray(r.data))).finally(()=>setLoading(false)); }, []);

  const handleResend = async (e, slug) => {
    e.preventDefault(); e.stopPropagation();
    setResending(slug);
    try {
      await cardsAPI.send(slug);
      toast.success('Card resent! A fresh link has been emailed to the recipient. 📬');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend. Please try again.');
    } finally { setResending(null); }
  };

  return (
    <DashboardLayout title="Delivered Cards" subtitle="Cards you've successfully sent — saved forever">
      <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
        style={{background:'rgba(16,185,129,0.07)',border:'1.5px solid rgba(16,185,129,0.2)',color:'#065F46',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
        <Icon name="Check" size={15} className="text-green-500"/>
        Delivered cards are saved for lifetime — they will never expire or be deleted.
      </div>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="rounded-2xl h-40 animate-pulse" style={{background:'#EDE9FE'}}/>)}</div>
      ) : cards.length===0 ? (
        <div className="db-empty">
          <div className="db-empty-icon"><Icon name="Send" size={28} className="text-primary-400"/></div>
          <p className="db-empty-title">No delivered cards yet</p>
          <p className="db-empty-body">Cards you send will appear here, saved forever.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card=>(
            <div key={card.id} className="db-card-item" style={{textDecoration:'none'}}>
              <Link to={`/card/${card.slug}${card.access_token ? `?token=${card.access_token}` : ''}`} className="db-card-item-body block" style={{textDecoration:'none'}}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{EMOJI[card.occasion]||'💌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="db-card-item-title">{card.title}</p>
                    <p className="db-card-item-meta">For {card.recipient_name}</p>
                  </div>
                  <span className="db-badge db-badge-sent">Sent</span>
                </div>
                <div className="flex gap-3 text-xs" style={{fontFamily:'Plus Jakarta Sans,sans-serif',color:'#A898CC'}}>
                  {card.opened_at && <span style={{color:'#7C3AED',fontWeight:700}}><Icon name="Eye" size={11} className="inline mr-1"/>Opened</span>}
                  {(card.total_collected||0)>0 && <span style={{color:'#059669',fontWeight:700}}>{formatNGN(card.total_collected)}</span>}
                  {card.updated_at && <span>{format(new Date(card.updated_at),'MMM d, yyyy')}</span>}
                </div>
              </Link>
              <div className="db-card-item-actions">
                <Link to={`/card/${card.slug}${card.access_token ? `?token=${card.access_token}` : ''}`} className="db-card-item-action"><Icon name="Eye" size={13}/>View</Link>
                {card.access_token && (
                  <button
                    type="button"
                    className="db-card-item-action"
                    onClick={e => {
                      e.preventDefault(); e.stopPropagation();
                      const link = `${window.location.origin}/card/${card.slug}?token=${card.access_token}`;
                      navigator.clipboard.writeText(link).then(
                        () => toast.success('Private link copied — this is the link the recipient received by email.'),
                        () => toast.error('Could not copy — long-press the link to copy manually.')
                      );
                    }}>
                    <Icon name="Link" size={13}/>Copy private link
                  </button>
                )}
                {card.recipient_email && (
                  <button
                    className="db-card-item-action"
                    disabled={resending === card.slug}
                    onClick={e => handleResend(e, card.slug)}>
                    <Icon name="Send" size={13}/>
                    {resending === card.slug ? 'Sending…' : 'Resend'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
