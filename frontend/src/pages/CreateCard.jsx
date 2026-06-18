import { useSEO } from '../hooks/useSEO';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardsAPI, paymentsAPI, creditsAPI, messagesAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import CompanyLayout from '../components/company/CompanyLayout';
import MemberLayout from '../components/member/MemberLayout';
import VoiceRecorder from '../components/VoiceRecorder';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import Icon from '../components/ui/Icon';
import toast from 'react-hot-toast';
import { formatNGN, CURRENCIES, formatCurrency } from '../utils/currency';
import { CARD_DESIGNS, FONT_STYLES, cardArtClass, getFontStyle } from '../utils/cardDesigns';

const OCCASIONS = [
  { id: 'birthday',      icon: '🎂', label: 'Birthday' },
  { id: 'valentine',     icon: '💝', label: "Valentine's" },
  { id: 'leaving',       icon: '💼', label: 'Leaving job' },
  { id: 'anniversary',   icon: '💍', label: 'Anniversary' },
  { id: 'wedding',       icon: '💒', label: 'Wedding' },
  { id: 'baby_shower',   icon: '👶', label: 'Baby shower' },
  { id: 'retirement',    icon: '🏖️', label: 'Retirement' },
  { id: 'congratulations',icon: '🎉', label: 'Congrats' },
  { id: 'graduation',    icon: '🎓', label: 'Graduation' },
  { id: 'promotion',     icon: '🌟', label: 'Promotion' },
  { id: 'christmas',     icon: '🎄', label: 'Christmas' },
  { id: 'get_well',      icon: '🌷', label: 'Get well' },
  { id: 'new_year',      icon: '✨', label: 'New Year' },
  { id: 'other',         icon: '💌', label: 'Other' },
];

const AMOUNTS_NGN = [2500, 5000, 10000, 20000, 50000];
const STEPS = ['Occasion', 'Design', 'Details', 'Your Message', 'Gift & Pay'];

const StepIndicator = ({ current }) => (
  <div className="flex items-center mb-8">
    {STEPS.map((s, i) => (
      <div key={s} className="flex items-center flex-1 last:flex-none">
        <div className="flex items-center gap-1.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i < current  ? 'bg-primary-500 text-white' :
            i === current? 'bg-primary-500 text-white ring-4 ring-primary-100' :
            'bg-purple-50 text-warm-400'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i <= current ? 'text-warm-900' : 'text-warm-400'}`}>{s}</span>
        </div>
        {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-all ${i < current ? 'bg-primary-400' : 'bg-gray-200'}`}/>}
      </div>
    ))}
  </div>
);

const CreateCard = () => {
  useSEO({ title: 'Create a Card', description: 'Create a new group card.', noIndex: true });

  const { user }    = useAuth();
  const { member }  = useMemberAuth();
  const { company } = useCompanyAuth();
  const isCompanyUser = !!(member || company);
  const isTeamLeader  = member?.role === 'team_leader';
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorName   = user?.full_name || company?.contact_person || company?.name || member?.first_name || 'Someone';

  const [step,            setStep]           = useState(0);
  const [loading,         setLoading]        = useState(false);
  const [paymentStage,    setPaymentStage]   = useState('idle');
  const [selectedCurrency,setSelectedCurrency] = useState('NGN');
  const [creditBalance,   setCreditBalance]  = useState(null);
  const [payMode,         setPayMode]        = useState('direct');
  const [inviteEmails,    setInviteEmails]   = useState('');
  const [liveSlug,        setLiveSlug]       = useState(null); // set when card is live
  const [draftSlug,       setDraftSlug]      = useState(null); // slug of the draft currently being created/edited
  const [loadingDraft,    setLoadingDraft]   = useState(false);
  const [signingDeadline, setSigningDeadline]= useState('');
  const [deliveryDate,    setDeliveryDate]   = useState('');

  // Card form
  const [form, setForm] = useState({
    occasion: 'birthday', design_theme: 'rose_love', background_color: '#FBEAF0',
    font_style: 'elegant', card_layout: 'form',
    title: `${creatorName.split(' ')[0]}'s Birthday Card`,
    recipient_name: '', recipient_email: '', send_date: '',
    send_time: '09:00', deadline: '', deadline_time: '23:59',
    is_gift_enabled: true, gift_type: 'pot', suggested_amount: 2500,
    allow_private_messages: true, send_reminders: true, hide_amounts: false,
    notification_scope: 'department',
  });

  // Creator's own first message (Step 3)
  const [msgForm, setMsgForm]     = useState({ content: '', font_style: 'handwritten', is_private: false });
  const [mediaFiles,  setMediaFiles]  = useState([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showGif,     setShowGif]     = useState(false);
  const [giftAmount,  setGiftAmount]  = useState(null);
  const [customGift,  setCustomGift]  = useState('');
  const fileRef    = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    const reset = () => { setLoading(false); setPaymentStage('idle'); };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  useEffect(() => {
    if (!isCompanyUser && user)
      creditsAPI.getBalance().then(r => setCreditBalance(r.data?.credits ?? 0)).catch(() => {});
  }, [user]);

  // ── Resume pending card after login redirect ──────────────────────
  // When a guest clicks "Sign in to continue", we save their form state
  // and slug (if draft already created) to localStorage, then redirect
  // to /login?returnTo=/card/new?resumed=1. On return, this effect
  // restores everything and jumps to the right step.
  useEffect(() => {
    const isResumed = searchParams.get('resumed') === '1';
    if (!isResumed) return;
    try {
      const raw = localStorage.getItem('thankeeu_pending_card');
      if (!raw) return;
      const saved = JSON.parse(raw);
      // Restore form state if it was saved
      if (saved.formSnapshot) setForm(saved.formSnapshot);
      if (saved.msgSnapshot)  setMsgForm(saved.msgSnapshot);
      if (saved.slug) {
        // Draft already created before login — go straight to message step
        setDraftSlug(saved.slug);
        toast.success('Welcome back! Continuing your card…');
        setStep(3);
      } else if (saved.formSnapshot) {
        // Form filled but draft not created yet — go to details step
        toast.success('Welcome back! Pick up where you left off.');
        setStep(2);
      }
    } catch {}
    // Clean the ?resumed=1 param from the URL without a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('resumed');
    window.history.replaceState({}, '', url.toString());
  }, [searchParams]);

  // ── Resume editing an existing draft ──────────────────────────────
  // "Edit" links from the dashboards point here with ?edit=<slug>.
  // Fetch the draft's saved data and repopulate the wizard instead of
  // starting blank, then track its slug in real state (draftSlug) so
  // every later step updates this same card instead of creating a new one.
  useEffect(() => {
    const editSlug = searchParams.get('edit');
    if (!editSlug) return;

    (async () => {
      setLoadingDraft(true);
      try {
        let res;
        if (company)      res = await cardsAPI.getOneAsCompany(editSlug);
        else if (member)  { const { memberCardsAPI } = await import('../utils/api'); res = await memberCardsAPI.getOne(editSlug); }
        else              res = await cardsAPI.getOne(editSlug);

        const card = res.data;
        if (!card || card.error) throw new Error('Draft not found');
        if (card.status !== 'draft') {
          toast.error('This card is no longer a draft and can\'t be edited here.');
          return;
        }

        setDraftSlug(editSlug);
        setForm(prev => ({
          ...prev,
          occasion:               card.occasion || prev.occasion,
          design_theme:           card.design_theme || prev.design_theme,
          background_color:       card.background_color || prev.background_color,
          font_style:             card.font_style || prev.font_style,
          card_layout:            card.card_layout || prev.card_layout,
          title:                  card.title || prev.title,
          recipient_name:         card.recipient_name || '',
          recipient_email:        card.recipient_email || '',
          send_date:              card.send_date ? String(card.send_date).slice(0, 10) : '',
          send_time:              card.send_time ? String(card.send_time).slice(0, 5) : prev.send_time,
          deadline:               card.deadline ? String(card.deadline).slice(0, 10) : '',
          deadline_time:          card.deadline_time ? String(card.deadline_time).slice(0, 5) : prev.deadline_time,
          is_gift_enabled:        card.is_gift_enabled ?? prev.is_gift_enabled,
          gift_type:              card.gift_type || prev.gift_type,
          suggested_amount:       card.suggested_amount ?? prev.suggested_amount,
          allow_private_messages: card.allow_private_messages ?? prev.allow_private_messages,
          send_reminders:         card.send_reminders ?? prev.send_reminders,
          hide_amounts:           card.hide_amounts ?? prev.hide_amounts,
          notification_scope:     card.notification_scope || prev.notification_scope,
        }));

        // If the creator already wrote their own message on a previous visit, prefill it too
        const myEmail = (user?.email || member?.email || company?.email || '').toLowerCase();
        const myMsg = (card.messages || []).find(m => myEmail && m.author_email?.toLowerCase() === myEmail);
        if (myMsg) {
          setMsgForm({ content: myMsg.content || '', font_style: myMsg.font_style || 'handwritten', is_private: !!myMsg.is_private });
        }

        toast.success('Continuing your draft — your progress is right where you left it.');
        setStep(myMsg ? 3 : 2);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Could not load this draft. Starting fresh instead.');
      } finally {
        setLoadingDraft(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setMsg = (k, v) => setMsgForm(p => ({ ...p, [k]: v }));

  const selectedDesign = CARD_DESIGNS.find(d => d.id === form.design_theme);

  const handleOccasionSelect = (occ) => {
    set('occasion', occ.id);
    if (!form.title || form.title.endsWith('Card')) set('title', `${creatorName.split(' ')[0]}'s ${occ.label} Card`);
  };
  const handleDesignSelect = (d) => { set('design_theme', d.id); set('background_color', d.background || d.bg || '#F5F0FF'); };

  // Media helpers
  const addMedia = useCallback((files) => {
    const items = [];
    for (const f of Array.from(files)) {
      if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name} too large (max 50MB)`); continue; }
      const mime = f.type;
      const type = mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'voice' : mime === 'image/gif' ? 'gif' : 'image';
      items.push({ file: f, preview: URL.createObjectURL(f), type, name: f.name });
    }
    setMediaFiles(prev => [...prev, ...items].slice(0, 5));
  }, []);
  const removeMedia = useCallback((idx) => {
    setMediaFiles(prev => { const n = [...prev]; URL.revokeObjectURL(n[idx].preview); n.splice(idx, 1); setCarouselIdx(i => Math.min(i, Math.max(0, n.length - 1))); return n; });
  }, []);
  const insertEmoji = useCallback((emoji) => {
    const el = textareaRef.current;
    if (el && typeof el.selectionStart === 'number') {
      const s = el.selectionStart, e = el.selectionEnd;
      setMsg('content', msgForm.content.slice(0, s) + emoji + msgForm.content.slice(e));
      requestAnimationFrame(() => { el.focus(); const p = s + emoji.length; el.setSelectionRange(p, p); });
    } else setMsg('content', msgForm.content + emoji);
    setShowEmoji(false);
  }, [msgForm.content]);

  // Step 3: create card draft (no payment yet) then allow creator to add first message
  const handleCreateDraft = async () => {
    if (!form.recipient_name) return toast.error('Recipient name is required');
    setLoading(true);
    setPaymentStage('creating');
    try {
      const cardData = { ...form, title: form.title.trim() || `${form.recipient_name}'s Card` };
      let slug;
      if (draftSlug) {
        // Already editing an existing draft — update it in place instead of
        // creating a duplicate card row.
        if (company)      await cardsAPI.updateAsCompany(draftSlug, cardData);
        else if (member)  { const { memberCardsAPI } = await import('../utils/api'); await memberCardsAPI.update(draftSlug, cardData); }
        else              await cardsAPI.update(draftSlug, cardData);
        slug = draftSlug;
      } else if (company)      slug = (await cardsAPI.createAsCompany(cardData)).data.slug;
      else if (member)  { const { memberCardsAPI } = await import('../utils/api'); slug = (await memberCardsAPI.create(cardData)).data.slug; }
      else              slug = (await cardsAPI.create(cardData)).data.slug;
      setDraftSlug(slug);
      localStorage.setItem('thankeeu_pending_card', JSON.stringify({
        cardData, slug, timestamp: Date.now(),
        formSnapshot: form,
        msgSnapshot: msgForm,
      }));
      setPaymentStage('idle');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save your card. Please try again.');
    } finally { setLoading(false); }
  };

  // Step 4: post creator's message then pay / activate
  const handlePayAndLaunch = async () => {
    setLoading(true);
    setPaymentStage('sending');
    try {
      const pending = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
      const slug = draftSlug || pending?.slug;
      if (!slug) { toast.error('Card draft not found. Please go back and try again.'); setLoading(false); setPaymentStage('idle'); return; }

      // Post creator's first message if they wrote one
      if (msgForm.content.trim() && user) {
        const fd = new FormData();
        fd.append('author_name', user.full_name || creatorName);
        fd.append('author_email', user.email || '');
        fd.append('content', msgForm.content);
        fd.append('font_style', msgForm.font_style);
        fd.append('is_private', msgForm.is_private);
        mediaFiles.forEach((m, i) => fd.append(i === 0 ? 'media' : `media_gallery_${i}`, m.file));
        await messagesAPI.add(slug, fd).catch(() => {}); // non-blocking
      }

      // Company/member: activate free
      if (isCompanyUser) {
        await cardsAPI.activate(slug, { inviteEmails: inviteEmails.split(/[,\n]/).map(e=>e.trim()).filter(Boolean), signing_deadline: signingDeadline || null, delivery_scheduled: deliveryDate || null });
        localStorage.removeItem('thankeeu_pending_card');
        toast.success('Card is live! 🎉');
        setLiveSlug(slug);
        setLoading(false); setPaymentStage('idle');
        return;
      }

      // Credit payment
      if (payMode === 'credit') {
        setPaymentStage('verifying');
        const res = await creditsAPI.spend(slug);
        if (res.data?.ok) {
          localStorage.removeItem('thankeeu_pending_card');
          setCreditBalance(res.data.credits_remaining);
          toast.success('Card is live! 🎉');
          setLiveSlug(slug);
          setLoading(false); setPaymentStage('idle');
          return;
        }
      }

      // Flutterwave direct
      setPaymentStage('redirecting');
      const payRes = await paymentsAPI.initCardFee(slug, selectedCurrency);
      const { payment_link } = payRes.data;
      if (!payment_link) throw new Error('No payment link returned');
      window.location.assign(payment_link);

    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not activate card. Please try again.');
      setLoading(false); setPaymentStage('idle');
    }
  };

  const handleReset = () => {
    localStorage.removeItem('thankeeu_pending_card');
    setStep(0); setLiveSlug(null); setDraftSlug(null); setLoading(false); setPaymentStage('idle');
    setMsgForm({ content: '', font_style: 'handwritten', is_private: false });
    setMediaFiles([]); setGiftAmount(null); setCustomGift(''); setInviteEmails('');
    setForm({ occasion:'birthday', design_theme:'rose_love', background_color:'#FBEAF0', font_style:'elegant', card_layout:'form',
      title:`${creatorName.split(' ')[0]}'s Birthday Card`, recipient_name:'', recipient_email:'', send_date:'',
      send_time:'09:00', deadline:'', deadline_time:'23:59', is_gift_enabled:true, gift_type:'pot', suggested_amount:2500,
      allow_private_messages:true, send_reminders:true, hide_amounts:false, notification_scope:'department' });
  };

  // ── LIVE screen ──────────────────────────────────────────────────────────
  if (liveSlug) return (
    <div className="min-h-screen section-dots" style={{ background:'linear-gradient(160deg,#F5F0FF,#FFF0F5)' }}>
      <Navbar/>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 animate-pop" style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)' }}>🎉</div>
        <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'clamp(1.75rem,5vw,2.75rem)', color:'#1A1035', marginBottom:12 }}>
          Your card is live!
        </h1>
        <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', color:'#7A6CA8', fontSize:18, marginBottom:32 }}>
          Share the link below so people can sign it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-lg">
          <input readOnly value={`${window.location.origin}/sign/${liveSlug}`}
            className="input flex-1 text-sm" style={{ background:'#fff' }}/>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${liveSlug}`); toast.success('Link copied!'); }}
            className="btn-primary px-6 whitespace-nowrap">
            📋 Copy link
          </button>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to={`/card/${liveSlug}`} className="btn-primary px-8 py-3 inline-flex items-center gap-2">
            <Icon name="Eye" size={16}/> View card
          </Link>
          <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`Sign this card: ${window.location.origin}/sign/${liveSlug}`)}`, '_blank')}
            className="px-8 py-3 rounded-2xl font-bold text-white inline-flex items-center gap-2" style={{ background:'#25D366' }}>
            📣 Share on WhatsApp
          </button>
          <button onClick={handleReset}
            className="btn-secondary px-8 py-3 inline-flex items-center gap-2">
            🔄 Create another card
          </button>
        </div>
      </div>
    </div>
  );

  if (loadingDraft) {
    const loadingScreen = (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mb-4"/>
        <p className="text-warm-500 text-sm">Loading your draft…</p>
      </div>
    );
    if (company) return <CompanyLayout title="Create a Card" subtitle="Takes less than 3 minutes">{loadingScreen}</CompanyLayout>;
    if (member)  return <MemberLayout  title="Create a Card" subtitle="Takes less than 3 minutes">{loadingScreen}</MemberLayout>;
    return <div className="min-h-screen"><Navbar/>{loadingScreen}</div>;
  }

  const inner = (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {!company && !member && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-warm-900 mb-1">Create a Thankeeu card</h1>
          <p className="text-warm-500 text-sm">Takes less than 3 minutes to set up</p>
        </div>
      )}

      <StepIndicator current={step} />

      {/* ── Step 0: Occasion ── */}
      {step === 0 && (
        <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-warm-900 mb-1">What's the occasion?</h2>
          <p className="text-warm-500 text-sm mb-6">Pick the type of card you're creating</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
            {OCCASIONS.map(o => (
              <button key={o.id} onClick={() => handleOccasionSelect(o)}
                className={`rounded-2xl p-4 text-center transition-all border-2 ${form.occasion === o.id ? 'border-primary-400 bg-primary-50 shadow-sm' : 'border-transparent bg-warm-100 hover:bg-purple-50'}`}>
                <div className="text-2xl mb-1">{o.icon}</div>
                <div className="text-xs font-semibold text-warm-700">{o.label}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(1)} className="btn-primary">Choose design →</button>
          </div>
        </div>
      )}

      {/* ── Step 1: Design ── */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-warm-900 mb-1">Pick a design</h2>
          <p className="text-warm-500 text-sm mb-5">Choose from our templates</p>

          <style>{`
            .ccg { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:20px; }
            @media(max-width:640px){.ccg{grid-template-columns:repeat(3,1fr);}}
            @media(max-width:380px){.ccg{grid-template-columns:repeat(2,1fr);}}
            .ccg-item{position:relative;border-radius:14px;overflow:hidden;cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;aspect-ratio:3/4;}
            .ccg-item:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.14);}
            .ccg-item.sel{outline:3px solid #7C3AED;outline-offset:2px;}
            .ccg-badge{position:absolute;top:7px;left:7px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;z-index:2;}
            .ccg-new{background:#FCD34D;color:#92400E;}
            .ccg-more{background:#F43F5E;color:#fff;}
            .ccg-upload{background:#60A5FA;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;}
            .ccg-upload p{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:14px;color:#fff;margin:0;text-align:center;line-height:1.2;}
          `}</style>

          <div className="ccg">
            <button type="button" className="ccg-item ccg-upload" onClick={() => document.getElementById('cc-bg-upload')?.click()}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p>Upload<br/>your own</p>
              <input id="cc-bg-upload" type="file" accept="image/*" className="hidden"
                onChange={e => { const f=e.target.files?.[0]; if(!f) return; set('background_color',URL.createObjectURL(f)); set('design_theme','custom_upload'); }}/>
            </button>
            {CARD_DESIGNS.map((d, idx) => (
              <button key={d.id} type="button" className={`ccg-item ${form.design_theme===d.id?'sel':''}`} onClick={() => handleDesignSelect(d)}>
                <div className={`card-art ${cardArtClass(d)} w-full h-full flex flex-col items-center justify-center`} style={{ background:d.background }}>
                  <span style={{ fontSize:30 }}>{d.icon}</span>
                  <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:10, color:d.ink, marginTop:4, textAlign:'center', padding:'0 4px', textShadow:d.dark?'0 1px 4px rgba(0,0,0,0.5)':'none' }}>{d.name}</p>
                </div>
                {idx < 3  && <span className="ccg-badge ccg-new">★ New</span>}
                {idx >= 3 && idx < 7 && <span className="ccg-badge ccg-more">More</span>}
              </button>
            ))}
          </div>

          <p className="text-sm font-bold text-warm-700 mb-2">Card lettering</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
            {FONT_STYLES.map(font => (
              <button key={font.id} type="button" onClick={() => set('font_style', font.id)}
                className={`rounded-xl border-2 px-2 py-2.5 text-sm transition-all ${form.font_style===font.id?'border-primary-500 bg-primary-50 text-primary-700':'border-purple-100 text-warm-600'}`}
                style={{ fontFamily:font.family }}>
                {font.id === 'calligraphy' ? 'With love' : font.name}
              </button>
            ))}
          </div>

          {selectedDesign && (
            <div className={`card-art ${cardArtClass(selectedDesign)} celebration-shell rounded-2xl p-5 mb-5 text-center min-h-[160px] flex flex-col justify-center`}
              style={{ background:selectedDesign.background, color:selectedDesign.ink }}>
              <span className="text-3xl mb-2">{selectedDesign.icon}</span>
              <h3 className="text-xl" style={{ color:selectedDesign.ink, fontFamily:getFontStyle(form.font_style).family }}>
                {form.title || `A beautiful card for ${form.recipient_name || 'someone special'}`}
              </h3>
            </div>
          )}

          <div className="mb-5">
            <p className="text-sm font-bold text-warm-700 mb-2">How should people sign?</p>
            <div className="grid grid-cols-2 gap-3">
              {[{id:'form',icon:'📝',title:'Classic form',desc:'Messages in a tidy list'},{id:'album',icon:'📖',title:'Photo album',desc:'Flipbook pages with free placement'}].map(opt => (
                <button key={opt.id} type="button" onClick={() => set('card_layout', opt.id)}
                  className={`rounded-2xl border-2 p-3 text-left transition-all ${form.card_layout===opt.id?'border-primary-500 bg-primary-50':'border-purple-100 bg-white hover:border-primary-200'}`}>
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <p className="font-bold text-sm text-warm-900">{opt.title}</p>
                  <p className="text-xs text-warm-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
            <button onClick={() => {
              // Save form snapshot so login-redirect can restore it
              const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
              localStorage.setItem('thankeeu_pending_card', JSON.stringify({ ...existing, formSnapshot: form, timestamp: Date.now() }));
              setStep(2);
            }} className="btn-primary">Add details →</button>
          </div>
        </div>
      )}

      {/* ── Step 2: Details ── */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-warm-900 mb-1">Card details</h2>
          <p className="text-warm-500 text-sm mb-5">Tell us who this is for</p>

          {/* ── Sign-in banner — shown to guests who may already have an account ── */}
          {!user && !isCompanyUser && (
            <div style={{
              background: 'linear-gradient(135deg,#EDE9FE,#F5F0FF)',
              border: '1.5px solid #C4B5FD',
              borderRadius: 16,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:22 }}>👋</span>
                <div>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#1A1035', margin:0, lineHeight:1.3 }}>
                    Already have an account?
                  </p>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#7A6CA8', margin:0 }}>
                    Sign in to save this card to your dashboard — your progress won't be lost.
                  </p>
                </div>
              </div>
              <Link
                to={`/login?returnTo=${encodeURIComponent('/card/new?resumed=1')}`}
                onClick={() => {
                  const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
                  localStorage.setItem('thankeeu_pending_card', JSON.stringify({
                    ...existing,
                    formSnapshot: form,
                    msgSnapshot: msgForm,
                    timestamp: Date.now(),
                  }));
                }}
                style={{
                  background: '#7C3AED',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '8px 18px',
                  fontFamily: 'Plus Jakarta Sans,sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                <Icon name="LogIn" size={14}/> Sign in
              </Link>
            </div>
          )}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Card title</label>
              <input className="input" placeholder="e.g. Amaka's Birthday Card 🎂" value={form.title} onChange={e => set('title', e.target.value)}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Recipient's name *</label>
                <input className="input" placeholder="e.g. Amaka" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} required/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Recipient's email</label>
                <input type="email" className="input" placeholder="amaka@email.com" value={form.recipient_email} onChange={e => set('recipient_email', e.target.value)}/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Delivery date</label>
                <input type="date" className="input" value={form.send_date} min={new Date().toISOString().split('T')[0]} onChange={e => set('send_date', e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Delivery time</label>
                <input type="time" className="input" value={form.send_time||'09:00'} onChange={e => set('send_time', e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Signing deadline</label>
                <input type="date" className="input" value={form.deadline} min={new Date().toISOString().split('T')[0]} onChange={e => set('deadline', e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1.5">Deadline time</label>
                <input type="time" className="input" value={form.deadline_time||'23:59'} onChange={e => set('deadline_time', e.target.value)}/>
              </div>
            </div>
            {(company || member) && (
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">Who should sign?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{value:'department',label:'My Department'},{value:'company_wide',label:'Entire Company'}].map(opt => (
                    <button key={opt.value} type="button" onClick={() => set('notification_scope', opt.value)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.notification_scope===opt.value?'border-primary-500 bg-primary-50 text-primary-700':'border-purple-100 text-warm-600'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-purple-100 divide-y divide-gray-100">
              {[
                { key:'allow_private_messages', label:'Allow private messages', desc:'Contributors can mark messages visible only to recipient' },
                { key:'send_reminders', label:'Auto-send reminders', desc:"Nudge people who haven't signed 2 days before deadline" },
                { key:'hide_amounts', label:'Hide gift amounts', desc:"Contributors won't see how much others gave" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4">
                  <div><p className="text-sm font-semibold text-warm-800">{label}</p><p className="text-xs text-warm-500 mt-0.5">{desc}</p></div>
                  <button onClick={() => set(key, !form[key])}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${form[key]?'bg-primary-400':'bg-gray-200'}`}>
                    <span className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform ${form[key]?'translate-x-5':'translate-x-0.5'}`}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
            <button onClick={handleCreateDraft} disabled={loading}
              className="btn-primary inline-flex items-center gap-2">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating…</span>
                : 'Add your message →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Creator's First Message ── */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-warm-900 mb-1">Add your message 💜</h2>
          <p className="text-warm-500 text-sm mb-4">
            You're the card creator — add your own message first. Others will sign too once you share the link.
          </p>

          {/* ── Sign-in banner — shown to guests who may already have an account ── */}
          {!user && !isCompanyUser && (
            <div style={{
              background: 'linear-gradient(135deg,#EDE9FE,#F5F0FF)',
              border: '1.5px solid #C4B5FD',
              borderRadius: 16,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:22 }}>👋</span>
                <div>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#1A1035', margin:0, lineHeight:1.3 }}>
                    Already have an account?
                  </p>
                  <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, color:'#7A6CA8', margin:0 }}>
                    Sign in to save this card to your dashboard — your progress won't be lost.
                  </p>
                </div>
              </div>
              <Link
                to={`/login?returnTo=${encodeURIComponent('/card/new?resumed=1')}`}
                onClick={() => {
                  const existing = JSON.parse(localStorage.getItem('thankeeu_pending_card') || '{}');
                  localStorage.setItem('thankeeu_pending_card', JSON.stringify({
                    ...existing,
                    formSnapshot: form,
                    msgSnapshot: msgForm,
                    timestamp: Date.now(),
                  }));
                }}
                style={{
                  background: '#7C3AED',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '8px 18px',
                  fontFamily: 'Plus Jakarta Sans,sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                <Icon name="LogIn" size={14}/> Sign in
              </Link>
            </div>
          )}


          {/* Writing style */}
          <label className="block text-sm font-bold text-warm-700 mb-2">Writing style</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            {FONT_STYLES.map(font => (
              <button key={font.id} type="button" onClick={() => setMsg('font_style', font.id)}
                className={`rounded-xl border-2 px-2 py-2.5 text-sm transition-all ${msgForm.font_style===font.id?'border-primary-500 bg-primary-50 text-primary-700':'border-purple-100 text-warm-600'}`}
                style={{ fontFamily:font.family }}>
                {font.id==='calligraphy'?'With love':font.name}
              </button>
            ))}
          </div>

          {/* Message textarea */}
          <label className="block text-sm font-bold text-warm-700 mb-2">Your message to {form.recipient_name||'them'}</label>
          <div className="relative mb-1">
            <textarea ref={textareaRef} className="input h-36 resize-none"
              style={{ fontFamily:getFontStyle(msgForm.font_style).family, fontSize: msgForm.font_style==='calligraphy'?'1.5rem':'1rem' }}
              placeholder={`Write something heartfelt for ${form.recipient_name||'them'}…`}
              maxLength={1200} value={msgForm.content} onChange={e => setMsg('content', e.target.value)}/>
            <button type="button" onClick={() => { setShowEmoji(s=>!s); setShowGif(false); }}
              className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white border border-purple-100 shadow-sm flex items-center justify-center text-lg hover:bg-purple-50 transition-colors">
              😊
            </button>
            {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)}/>}
          </div>
          <div className="flex justify-end mb-4">
            <span className="text-xs text-warm-400">{msgForm.content.length}/1200</span>
          </div>

          {/* Media buttons */}
          <div className="relative flex flex-wrap gap-2 mb-4">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="voice-record-button"><span>📷</span><span>Photos/video {mediaFiles.length>0?`(${mediaFiles.length}/5)`:''}</span></button>
            <button type="button" onClick={() => { setShowGif(s=>!s); setShowEmoji(false); }} disabled={mediaFiles.length>=5}
              className="voice-record-button disabled:opacity-50"><span>🎞️</span><span>Add GIF</span></button>
            <VoiceRecorder onRecorded={f => addMedia([f])} disabled={loading}/>
            <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.m4a,.ogg,.webm" multiple className="hidden"
              onChange={e => addMedia(e.target.files)}/>
            {showGif && <GifPicker onSelect={f => { addMedia([f]); setShowGif(false); }} onClose={() => setShowGif(false)}/>}
          </div>

          {/* Media carousel */}
          {mediaFiles.length > 0 && (
            <div className="mb-4 rounded-2xl overflow-hidden border-2 border-purple-100 bg-white">
              <div className="relative" style={{ aspectRatio:'16/9', background:'#1A1035' }}>
                {mediaFiles[carouselIdx].type==='video' ? (
                  <video src={mediaFiles[carouselIdx].preview} className="w-full h-full object-contain" controls/>
                ) : mediaFiles[carouselIdx].type==='voice' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <span className="text-5xl">🎙️</span>
                    <audio src={mediaFiles[carouselIdx].preview} controls className="w-4/5"/>
                  </div>
                ) : (
                  <img src={mediaFiles[carouselIdx].preview} alt="" className="w-full h-full object-contain"/>
                )}
                <button type="button" onClick={() => removeMedia(carouselIdx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors">✕</button>
                {mediaFiles.length > 1 && (
                  <>
                    <button type="button" onClick={() => setCarouselIdx(i=>(i-1+mediaFiles.length)%mediaFiles.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg">‹</button>
                    <button type="button" onClick={() => setCarouselIdx(i=>(i+1)%mediaFiles.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg">›</button>
                  </>
                )}
              </div>
              <p className="text-center text-xs text-warm-400 py-2">{carouselIdx+1} of {mediaFiles.length} — Add up to {5-mediaFiles.length} more</p>
            </div>
          )}

          {/* Private toggle */}
          {form.allow_private_messages && (
            <label className="flex items-center justify-between gap-4 border-t border-purple-100 pt-4 mb-4 cursor-pointer">
              <span>
                <span className="block text-sm font-bold text-warm-800">Private message</span>
                <span className="block text-xs text-warm-400">Only the recipient and card creator can read it</span>
              </span>
              <input type="checkbox" checked={msgForm.is_private} onChange={e => setMsg('is_private', e.target.checked)} className="w-5 h-5 accent-violet-600"/>
            </label>
          )}

          {/* Invite emails */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-warm-700 mb-1.5">Invite people to sign <span className="text-warm-400 font-normal text-xs">(optional)</span></label>
            <textarea className="input h-20 resize-none" placeholder="kemi@email.com, emeka@email.com"
              value={inviteEmails} onChange={e => setInviteEmails(e.target.value)}/>
            <p className="text-xs text-warm-400 mt-1">You can also share a link after creating the card</p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
            <button onClick={() => setStep(4)} className="btn-primary">
              {msgForm.content.trim() ? 'Save message & pay →' : 'Skip & continue →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Gift & Pay ── */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-warm-900 mb-1">Gift & activate</h2>
          <p className="text-warm-500 text-sm mb-5">Enable a gift collection and launch your card</p>

          {/* Gift toggle */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[{id:true,icon:'🐷',title:'Enable gift pot',desc:'Everyone chips in, recipient redeems'},{id:false,icon:'✉️',title:'Card only',desc:'Messages only, no gift'}].map(o => (
              <button key={String(o.id)} onClick={() => set('is_gift_enabled', o.id)}
                className={`rounded-2xl p-4 text-left border-2 transition-all ${form.is_gift_enabled===o.id?'border-primary-400 bg-primary-50':'border-purple-100 hover:border-purple-200'}`}>
                <div className="text-2xl mb-1">{o.icon}</div>
                <div className="text-sm font-bold text-warm-800">{o.title}</div>
                <div className="text-xs text-warm-500 mt-0.5">{o.desc}</div>
              </button>
            ))}
          </div>

          {form.is_gift_enabled && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-warm-700 mb-2">Suggested contribution</p>
              <div className="flex flex-wrap gap-2">
                {[2500,5000,10000,25000,50000].map(amt => (
                  <button key={amt} onClick={() => set('suggested_amount', amt)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.suggested_amount===amt?'bg-primary-400 text-white border-primary-400':'border-purple-100 text-warm-700 hover:border-primary-300'}`}>
                    {formatNGN(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-2xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-5">
            {[
              ['Occasion', OCCASIONS.find(o=>o.id===form.occasion)?.label||form.occasion],
              ['Recipient', form.recipient_name],
              ['Gift', form.is_gift_enabled?`Yes — ${formatNGN(form.suggested_amount)} suggested`:'No'],
              ...(isCompanyUser?[['Card fee','🆓 Free (company)']]:
                payMode==='credit'&&creditBalance>0?[['Card fee',`1 credit (${creditBalance} remaining)`]]:
                [['Card fee',`${formatCurrency(5000,selectedCurrency)} one-time`]]),
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-warm-500">{k}</span>
                <span className="text-sm font-semibold text-warm-900">{v}</span>
              </div>
            ))}
          </div>

          {/* Payment mode for individuals */}
          {!isCompanyUser && (
            <div className="mb-4">
              {creditBalance > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button type="button" onClick={() => setPayMode('credit')}
                    className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${payMode==='credit'?'border-primary-400 bg-primary-50':'border-purple-100'}`}>
                    <p className="font-bold text-warm-900">💳 Use credit</p>
                    <p className="text-primary-600 font-semibold">{creditBalance} left</p>
                    <p className="text-green-600 font-bold">Instant</p>
                  </button>
                  <button type="button" onClick={() => setPayMode('direct')}
                    className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${payMode==='direct'?'border-primary-400 bg-primary-50':'border-purple-100'}`}>
                    <p className="font-bold text-warm-900">🏦 Pay now</p>
                    <p className="text-warm-500">via Flutterwave</p>
                  </button>
                </div>
              )}
              {payMode==='direct' && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-warm-500 mb-1.5">Pay in:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CURRENCIES.map(c => (
                      <button key={c.code} type="button" onClick={() => setSelectedCurrency(c.code)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${selectedCurrency===c.code?'bg-primary-500 text-white':'bg-primary-50 text-primary-600 border border-primary-200'}`}>
                        {c.flag} {c.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="btn-secondary px-4">← Back</button>
            <button onClick={handlePayAndLaunch} disabled={loading} className="btn-primary flex-1">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    {paymentStage==='sending'?'Saving message…':paymentStage==='verifying'?'Using credit…':paymentStage==='redirecting'?'Opening payment…':'Creating card…'}
                  </span>
                : isCompanyUser ? '✨ Create Card (Free)'
                : payMode==='credit' ? '💳 Use 1 Credit & Launch'
                : `🔒 Pay ${formatCurrency(5000, selectedCurrency)} & Launch Card`}
            </button>
          </div>
          <p className="text-xs text-center text-warm-400 mt-3">
            {isCompanyUser ? 'Company account · Card creation is free' : 'Secured by Flutterwave · Card link will be ready immediately'}
          </p>
        </div>
      )}
    </div>
  );

  if (company) return <CompanyLayout title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</CompanyLayout>;
  if (member)  return <MemberLayout  title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</MemberLayout>;
  return <div className="min-h-screen"><Navbar/>{inner}</div>;
};

export default CreateCard;
