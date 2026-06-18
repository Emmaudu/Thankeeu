import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Icon from '../components/ui/Icon';
import { cardsAPI } from '../utils/api';
import { CARD_DESIGNS } from '../utils/cardDesigns';
import toast from 'react-hot-toast';

const OCCASIONS = [
  { id: 'birthday', icon: '🎂', label: 'Birthday' },
  { id: 'leaving', icon: '👋', label: 'Leaving' },
  { id: 'congratulations', icon: '🎉', label: 'Congrats' },
  { id: 'wedding', icon: '💍', label: 'Wedding' },
  { id: 'baby_shower', icon: '👶', label: 'Baby shower' },
  { id: 'retirement', icon: '🏖️', label: 'Retirement' },
  { id: 'get_well', icon: '🌷', label: 'Get well' },
  { id: 'graduation', icon: '🎓', label: 'Graduation' },
  { id: 'promotion', icon: '🌟', label: 'Promotion' },
  { id: 'anniversary', icon: '💝', label: 'Anniversary' },
  { id: 'christmas', icon: '🎄', label: 'Christmas' },
  { id: 'other', icon: '💌', label: 'Other' },
];

const ANON_DRAFT_KEY = 'thankeeu_anon_draft';

const saveAnonDraft = (data) => {
  try { localStorage.setItem(ANON_DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
};
const loadAnonDraft = () => {
  try {
    const raw = localStorage.getItem(ANON_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.savedAt || Date.now() - parsed.savedAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(ANON_DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
};

const DesignCard = ({ design, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`gc-card gc-card-hover text-left p-0 overflow-hidden w-full ${selected ? 'ring-2 ring-primary-500' : ''}`}
  >
    <div className="h-32 flex items-center justify-center text-4xl relative" style={{ background: design.background }}>
      <span>{design.icon}</span>
      {selected && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center">
          <Icon name="Check" size={16} />
        </div>
      )}
    </div>
    <div className="p-3">
      <p className="gc-font font-semibold text-sm" style={{ color: '#3B0D7A' }}>{design.name}</p>
    </div>
  </button>
);

const CardStart = () => {
  useSEO({
    title: 'Create a Free Group Card — No Signup Needed | Thankeeu',
    description: "Pick a design and start your group card instantly. Invite others to sign — no account needed until you're ready to send.",
  });

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [occasion, setOccasion] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [card, setCard] = useState(null);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    const existing = loadAnonDraft();
    if (existing?.slug && existing?.draft_edit_token) {
      setResuming(true);
      setCard({ slug: existing.slug, draft_edit_token: existing.draft_edit_token });
      setStep(3);
    }
  }, []);

  const handleCreate = async () => {
    if (!recipientName.trim()) return toast.error('Add who this card is for');
    if (!occasion) return toast.error('Pick an occasion');
    if (!selectedDesign) return toast.error('Pick a design');
    setCreating(true);
    try {
      const occasionLabel = OCCASIONS.find(o => o.id === occasion)?.label || 'Celebration';
      const res = await cardsAPI.createDraft({
        recipient_name: recipientName.trim(),
        recipient_email: recipientEmail.trim() || null,
        occasion,
        title: `${recipientName.trim()}'s ${occasionLabel} Card`,
        design_theme: selectedDesign.id,
        background_color: selectedDesign.background,
        is_gift_enabled: true,
        gift_type: 'pot',
        allow_private_messages: true,
        send_reminders: true,
      });
      const { slug, draft_edit_token } = res.data;
      saveAnonDraft({ slug, draft_edit_token, recipientName: recipientName.trim(), occasion });
      await cardsAPI.activateDraft(slug, {}, draft_edit_token);
      setCard({ slug, draft_edit_token });
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create your card. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const shareUrl = card ? `${window.location.origin}/sign/${card.slug}` : '';
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); };

  return (
    <div className="min-h-screen gc-font section-dots" style={{ background: '#FAF8FF' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        {step !== 3 && (
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" style={{ color: '#3B0D7A' }}>
              {step === 1 ? 'Pick a design to get started' : 'Who is this card for?'}
            </h1>
            <p className="text-lg" style={{ color: '#6D28D9' }}>No account needed — start filling it in right now.</p>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {CARD_DESIGNS.map(d => (
              <DesignCard key={d.id} design={d} selected={selectedDesign?.id === d.id} onClick={() => { setSelectedDesign(d); setStep(2); }} />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="max-w-lg mx-auto">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm font-semibold mb-6" style={{ color: '#6D28D9' }}>
              <Icon name="ChevronLeft" size={16} /> Change design
            </button>
            <div className="gc-card p-6 mb-6">
              <div className="h-24 rounded-2xl flex items-center justify-center text-3xl mb-4" style={{ background: selectedDesign?.background }}>
                {selectedDesign?.icon}
              </div>
              <p className="text-center font-semibold" style={{ color: '#3B0D7A' }}>{selectedDesign?.name}</p>
            </div>
            <div className="gc-card p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#3B0D7A' }}>What's the occasion?</label>
                <div className="grid grid-cols-3 gap-2">
                  {OCCASIONS.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setOccasion(o.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-xs font-semibold transition-colors ${occasion === o.id ? 'border-primary-500' : 'border-transparent hover:border-primary-100'}`}
                      style={{ background: occasion === o.id ? '#F5F0FF' : '#FAFAFA', color: occasion === o.id ? '#5B21B6' : '#52525B' }}
                    >
                      <span className="text-xl">{o.icon}</span>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#3B0D7A' }}>Their name *</label>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. Adaeze"
                  className="w-full px-4 py-3 rounded-2xl border-2 text-base" style={{ borderColor: '#EDE5FF' }} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#3B0D7A' }}>
                  Their email <span className="font-normal" style={{ color: '#A1A1AA' }}>(optional — for delivery later)</span>
                </label>
                <input value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="adaeze@example.com" type="email"
                  className="w-full px-4 py-3 rounded-2xl border-2 text-base" style={{ borderColor: '#EDE5FF' }} />
              </div>
              <button onClick={handleCreate} disabled={creating} className="gc-btn-primary w-full text-center disabled:opacity-60">
                {creating ? 'Creating your card…' : 'Create card & get share link'}
              </button>
              <p className="text-center text-sm" style={{ color: '#A1A1AA' }}>Free to create and share. You'll only pay when you're ready to send.</p>
            </div>
          </div>
        )}

        {step === 3 && card && (
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center text-4xl" style={{ background: '#F5F0FF' }}>🎉</div>
            <h1 className="text-3xl font-extrabold mb-3" style={{ color: '#3B0D7A' }}>
              {resuming ? 'Welcome back to your card' : 'Your card is ready to share!'}
            </h1>
            <p className="text-lg mb-8" style={{ color: '#6D28D9' }}>
              Share this link so people can add their messages. No account needed for them either.
            </p>
            <div className="gc-card p-5 mb-6 flex items-center gap-3">
              <input readOnly value={shareUrl} className="flex-1 bg-transparent text-sm font-medium truncate" style={{ color: '#3B0D7A' }} />
              <button onClick={copyLink} className="gc-btn-secondary px-4 py-2 text-sm flex-shrink-0">Copy link</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link to={`/sign/${card.slug}`} className="gc-btn-primary inline-flex items-center justify-center gap-2">
                <Icon name="Eye" size={18} /> View your card
              </Link>
              <Link
                to={`/login?claim_slug=${card.slug}&claim_token=${card.draft_edit_token}`}
                className="gc-btn-secondary inline-flex items-center justify-center gap-2">
                <Icon name="LogIn" size={16} /> Sign in to save it
              </Link>
            </div>

            {/* Create account option */}
            <div style={{ marginBottom: 24, padding: '14px 20px', borderRadius: 18, background: 'rgba(124,58,237,0.05)', border: '1.5px solid rgba(124,58,237,0.12)' }}>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize: 14, color: '#7A6CA8', margin: '0 0 10px', textAlign: 'center' }}>
                Don't have an account yet?
              </p>
              <button
                onClick={() => navigate(`/signup?claim_slug=${card.slug}&claim_token=${card.draft_edit_token}`)}
                style={{ width:'100%', padding:'11px', borderRadius:14, border:'1.5px solid #DDD6FE', background:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#7C3AED', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon name="UserPlus" size={16}/> Create account &amp; save card
              </button>
            </div>

            <p className="text-sm" style={{ color: '#A1A1AA' }}>
              You don't need an account yet — your card stays exactly as it is.
              When you're ready to deliver it, sign in or sign up and it'll already be there as a draft.
            </p>

            {/* ── Edit & Reset ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 pt-6" style={{ borderTop: '1.5px solid rgba(124,58,237,0.10)' }}>
              <button
                onClick={() => { setStep(2); setResuming(false); }}
                style={{ flex:1, padding:'11px 20px', borderRadius:14, border:'1.5px solid #DDD6FE', background:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#7C3AED', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon name="Edit" size={16}/> Edit card details
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('thankeeu_anon_draft');
                  setCard(null);
                  setStep(1);
                  setSelectedDesign(null);
                  setOccasion(null);
                  setRecipientName('');
                  setRecipientEmail('');
                  setResuming(false);
                }}
                style={{ flex:1, padding:'11px 20px', borderRadius:14, border:'1.5px solid #FEE2E2', background:'#FFF5F5', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#DC2626', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Icon name="RotateCcw" size={16}/> Start over
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CardStart;
