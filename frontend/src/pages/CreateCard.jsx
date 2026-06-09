import { useSEO } from '../hooks/useSEO';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMemberAuth } from '../context/MemberAuthContext';
import { useCompanyAuth } from '../context/CompanyAuthContext';
import { cardsAPI, paymentsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import CompanyLayout from '../components/company/CompanyLayout';
import MemberLayout from '../components/member/MemberLayout';
import toast from 'react-hot-toast';
import { formatNGN } from '../utils/currency';
import { CARD_DESIGNS, FONT_STYLES, cardArtClass, getFontStyle } from '../utils/cardDesigns';

const OCCASIONS = [
  { id: 'birthday', icon: '🎂', label: 'Birthday' },
  { id: 'valentine', icon: '💝', label: "Valentine's" },
  { id: 'leaving', icon: '💼', label: 'Leaving job' },
  { id: 'anniversary', icon: '💍', label: 'Anniversary' },
  { id: 'wedding', icon: '💒', label: 'Wedding' },
  { id: 'baby_shower', icon: '👶', label: 'Baby shower' },
  { id: 'retirement', icon: '🏖️', label: 'Retirement' },
  { id: 'congratulations', icon: '🎉', label: 'Congrats' },
  { id: 'graduation', icon: '🎓', label: 'Graduation' },
  { id: 'promotion', icon: '🌟', label: 'Promotion' },
  { id: 'christmas', icon: '🎄', label: 'Christmas' },
  { id: 'get_well', icon: '🌷', label: 'Get well' },
  { id: 'new_year', icon: '✨', label: 'New Year' },
  { id: 'other', icon: '💌', label: 'Other' },
];

const DESIGNS = [
  { id: 'rose_love', name: 'Rose Love', bg: '#FBEAF0', accent: '#D4537E', emoji: '🌹' },
  { id: 'starry_night', name: 'Starry Night', bg: '#EEEDFE', accent: '#7F77DD', emoji: '🌟' },
  { id: 'garden_bloom', name: 'Garden Bloom', bg: '#E1F5EE', accent: '#1D9E75', emoji: '🌸' },
  { id: 'golden_glow', name: 'Golden Glow', bg: '#FAEEDA', accent: '#BA7517', emoji: '✨' },
  { id: 'warm_ember', name: 'Warm Ember', bg: '#FAECE7', accent: '#D85A30', emoji: '🔥' },
  { id: 'midnight_blue', name: 'Midnight Blue', bg: '#E6F1FB', accent: '#378ADD', emoji: '🌙' },
  { id: 'fresh_garden', name: 'Fresh Garden', bg: '#EAF3DE', accent: '#3B6D11', emoji: '🌿' },
  { id: 'minimal_chic', name: 'Minimal Chic', bg: '#F5F5F0', accent: '#4A4A4A', emoji: '🤍' },
];

const STEPS = ['Occasion', 'Design', 'Details', 'Gift & Send'];

const StepIndicator = ({ current }) => (
  <div className="flex items-center mb-10">
    {STEPS.map((s, i) => (
      <div key={s} className="flex items-center flex-1 last:flex-none">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
            i < current ? 'bg-primary-400 text-white' :
            i === current ? 'bg-primary-400 text-white ring-4 ring-primary-100' :
            'bg-purple-50 text-warm-400'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-sm font-medium hidden sm:block ${i <= current ? 'text-warm-900' : 'text-warm-400'}`}>{s}</span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`flex-1 h-0.5 mx-3 transition-all ${i < current ? 'bg-primary-400' : 'bg-gray-200'}`} />
        )}
      </div>
    ))}
  </div>
);

const CreateCard = () => {
  useSEO({ title: 'Create a Card', description: 'Create a new group card.', noIndex: true });

  const { user } = useAuth();
  const { member } = useMemberAuth();
  const { company } = useCompanyAuth();
  const navigate = useNavigate();
  // Derive a display name for whoever is creating the card
  const creatorName = user?.full_name || company?.contact_person || company?.name || member?.first_name || 'Someone';
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentStage, setPaymentStage] = useState('opening');
  const [inviteEmails, setInviteEmails] = useState('');
  const [form, setForm] = useState({
    occasion: 'birthday', design_theme: 'rose_love', background_color: '#FBEAF0', font_style: 'elegant',
    title: `${creatorName.split(' ')[0]}'s Birthday Card`,
    recipient_name: '', recipient_email: '', send_date: '',
    send_time: '09:00', deadline: '', deadline_time: '23:59', is_gift_enabled: true, gift_type: 'pot', suggested_amount: 2500,
    allow_private_messages: true, send_reminders: true, hide_amounts: false
  });

  useEffect(() => {
    const resetCheckoutState = () => {
      setLoading(false);
      setPaymentStage('opening');
    };
    window.addEventListener('pageshow', resetCheckoutState);
    return () => window.removeEventListener('pageshow', resetCheckoutState);
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleOccasionSelect = (occ) => {
    set('occasion', occ.id);
    if (!form.title) set('title', `${creatorName.split(' ')[0]}'s ${occ.label} Card`);
  };

  const handleDesignSelect = (d) => {
    set('design_theme', d.id);
    set('background_color', d.background || d.bg);
  };

  const handleSubmit = async () => {
    if (!form.recipient_name) return toast.error('Add recipient name');
    setLoading(true);
    setPaymentStage('creating');
    try {
      const occasionLabel = OCCASIONS.find(o => o.id === form.occasion)?.label || 'Celebration';
      const cardData = {
        ...form,
        title: form.title.trim() || `${form.recipient_name}'s ${occasionLabel} Card`,
      };

      const pendingCard = {
        cardData,
        inviteEmails: inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
      };
      let savedPending = null;
      try {
        savedPending = JSON.parse(localStorage.getItem('thankeeu_pending_card') || 'null');
      } catch {
        localStorage.removeItem('thankeeu_pending_card');
      }
      const canReuseDraft = savedPending?.slug
        && JSON.stringify(savedPending.cardData) === JSON.stringify(cardData);

      let slug;
      if (canReuseDraft) {
        slug = savedPending.slug;
      } else if (company) {
        slug = (await cardsAPI.createAsCompany(cardData)).data.slug;
      } else if (member) {
        const { memberCardsAPI } = await import('../utils/api');
        slug = (await memberCardsAPI.create(cardData)).data.slug;
      } else {
        slug = (await cardsAPI.create(cardData)).data.slug;
      }

      localStorage.setItem('thankeeu_pending_card', JSON.stringify({ ...pendingCard, slug }));
      setPaymentStage('opening');
      const payRes = await paymentsAPI.initPurchase('single', slug);
      if (payRes.data.already_active) {
        localStorage.removeItem('thankeeu_pending_card');
        toast.success('Your payment was already confirmed.');
        navigate(`/card/${payRes.data.card_slug || slug}`, { replace: true });
        return;
      }
      const { payment_link, tx_ref } = payRes.data;

      const finishPurchase = async (paymentReference) => {
        setPaymentStage('verifying');
        let verifyRes;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          try {
            verifyRes = await paymentsAPI.verifyPurchase(paymentReference);
            break;
          } catch (verifyError) {
            if (attempt === 3) throw verifyError;
            await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
          }
        }
        const activatedSlug = verifyRes.data.card_slug || slug;

        if (pendingCard.inviteEmails.length) {
          cardsAPI.activate(activatedSlug, { inviteEmails: pendingCard.inviteEmails }).catch(err => {
            console.error('Could not send card invitations:', err);
          });
        }

        localStorage.removeItem('thankeeu_pending_card');
        toast.success('Payment confirmed! Your card is ready.');
        navigate(`/card/${activatedSlug}`, { replace: true });
      };

      // Use FlutterwaveCheckout inline popup if available (same pattern as SignCard)
      if (window.FlutterwaveCheckout && payment_link && tx_ref) {
        const creatorEmail =
          user?.email || member?.email || company?.email || '';
        const creatorDisplayName =
          user?.full_name ||
          (member ? `${member.first_name} ${member.last_name}`.trim() : null) ||
          company?.contact_person || company?.name ||
          creatorEmail;

        window.FlutterwaveCheckout({
          public_key:      import.meta.env.VITE_FLW_PUBLIC_KEY,
          tx_ref,
          amount:          5000,
          currency:        'NGN',
          payment_options: 'card,ussd,bank_transfer',
          customer:        { email: creatorEmail, name: creatorDisplayName },
          customizations:  { title: 'Thankeeu Card Creation', logo: '/logo.png' },
          callback: async (transaction) => {
            // FLW closes the modal itself after callback resolves — do NOT call close() here
            try {
              await finishPurchase(transaction.tx_ref || tx_ref);
            } catch (verifyError) {
              toast.error(verifyError.response?.data?.error || 'Payment made but verification failed. Please retry.');
              setLoading(false);
              setPaymentStage('opening');
            }
          },
          onclose: () => {
            setLoading(false);
            setPaymentStage('opening');
          },
        });
        return;
      }

      // Fallback: redirect to Flutterwave hosted checkout page
      if (payment_link) {
        window.location.assign(payment_link);
      } else {
        throw new Error('No payment link returned. Please try again.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not open payment. Please try again.');
      setLoading(false);
      setPaymentStage('opening');
    }
  };

  const selectedDesign = CARD_DESIGNS.find(d => d.id === form.design_theme);

  const inner = (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {!company && !member && (
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-warm-900 mb-1">Create a Thankeeu card</h1>
          <p className="text-warm-500 text-sm">Takes less than 3 minutes to set up</p>
        </div>
      )}

      <StepIndicator current={step} />

        {/* Step 0: Occasion */}
        {step === 0 && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-warm-900 mb-1">What's the occasion?</h2>
            <p className="text-warm-500 text-sm mb-6">Pick the type of card you're creating</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
              {OCCASIONS.map(o => (
                <button key={o.id} onClick={() => handleOccasionSelect(o)}
                  className={`rounded-3xl p-4 text-center transition-all border-2 ${
                    form.occasion === o.id
                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-transparent bg-warm-100 hover:bg-purple-50'
                  }`}>
                  <div className="text-2xl mb-1">{o.icon}</div>
                  <div className="text-xs font-medium text-warm-700">{o.label}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(1)} className="btn-primary">Choose design →</button>
            </div>
          </div>
        )}

        {/* Step 1: Design */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-warm-900 mb-1">Pick a design</h2>
            <p className="text-warm-500 text-sm mb-6">Choose from our beautiful templates</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {CARD_DESIGNS.map(d => (
                <button key={d.id} onClick={() => handleDesignSelect(d)}
                  className={`rounded-3xl overflow-hidden border-2 transition-all bg-white ${
                    form.design_theme === d.id ? 'border-primary-400 shadow-md' : 'border-transparent'
                  }`}>
                  <div className={`card-art ${cardArtClass(d)} h-24 flex items-center justify-center text-4xl`} style={{ background: d.background }}>{d.icon}</div>
                  <div className="py-2 px-1 text-center">
                    <span className="text-xs font-medium text-warm-700">{d.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold text-warm-700 mb-3">Choose the card lettering</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
              {FONT_STYLES.map(font => (
                <button key={font.id} type="button" onClick={() => set('font_style', font.id)}
                  className={`rounded-2xl border-2 px-2 py-3 transition-all ${
                    form.font_style === font.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-purple-100 text-warm-600'
                  }`}
                  style={{ fontFamily: font.family }}>
                  {font.id === 'calligraphy' ? 'With love' : font.name}
                </button>
              ))}
            </div>
            {selectedDesign && (
              <div className={`card-art ${cardArtClass(selectedDesign)} celebration-shell rounded-3xl p-7 mb-6 text-center min-h-[210px] flex flex-col justify-center`} style={{ background: selectedDesign.background, color: selectedDesign.ink }}>
                <span className="text-4xl mb-3">{selectedDesign.icon}</span>
                <p className="text-xs font-bold uppercase tracking-[.2em] mb-2" style={{ color: selectedDesign.accent }}>{selectedDesign.name}</p>
                <h3 className="text-2xl" style={{ color: selectedDesign.ink, fontFamily: getFontStyle(form.font_style).family }}>
                  {form.title || `A beautiful card for ${form.recipient_name || 'someone special'}`}
                </h3>
                <p className="text-xs opacity-70 mt-2" style={{ color: selectedDesign.ink }}>This artwork and lettering follows the card everywhere.</p>
              </div>
            )}
            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
              <button onClick={() => setStep(2)} className="btn-primary">Add details →</button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-warm-900 mb-1">Card details</h2>
            <p className="text-warm-500 text-sm mb-6">Tell us who this is for</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Card title</label>
                <input className="input" placeholder="e.g. Amaka's Birthday Card 🎂" value={form.title}
                  onChange={e => set('title', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">Recipient's name <span className="text-red-400">*</span></label>
                  <input className="input" placeholder="e.g. Amaka" value={form.recipient_name}
                    onChange={e => set('recipient_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">Recipient's email <span className="text-warm-400 font-normal text-xs">(to deliver card)</span></label>
                  <input type="email" className="input" placeholder="amaka@email.com" value={form.recipient_email}
                    onChange={e => set('recipient_email', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">Delivery date</label>
                  <input type="date" className="input" value={form.send_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('send_date', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">Delivery time</label>
                  <input type="time" className="input" value={form.send_time || '09:00'}
                    onChange={e => set('send_time', e.target.value)} />
                  <p className="text-xs text-warm-400 mt-1">Time card is delivered to recipient</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">Signing deadline</label>
                  <input type="date" className="input" value={form.deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('deadline', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">Deadline time</label>
                  <input type="time" className="input" value={form.deadline_time || '23:59'}
                    onChange={e => set('deadline_time', e.target.value)} />
                  <p className="text-xs text-warm-400 mt-1">Time reminder is sent to unsigned invitees</p>
                </div>
              </div>
              {/* Toggles */}
              <div className="rounded-3xl border border-purple-100 divide-y divide-gray-100">
                {[
                  { key: 'allow_private_messages', label: 'Allow private messages', desc: 'Contributors can mark messages visible only to recipient' },
                  { key: 'send_reminders', label: 'Auto-send reminders', desc: "Nudge people who haven't signed 2 days before deadline" },
                  { key: 'hide_amounts', label: 'Hide gift amounts', desc: "Contributors won't see how much others gave" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-warm-800">{label}</p>
                      <p className="text-xs text-warm-500 mt-0.5">{desc}</p>
                    </div>
                    <button onClick={() => set(key, !form[key])}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${form[key] ? 'bg-primary-400' : 'bg-gray-200'}`}>
                      <span className={`absolute w-5 h-5 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
              <button onClick={() => { if (!form.recipient_name) return toast.error('Recipient name is required'); setStep(3); }} className="btn-primary">Gift options →</button>
            </div>
          </div>
        )}

        {/* Step 3: Gift & Send */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="text-xl font-semibold text-warm-900 mb-1">Gift & send</h2>
            <p className="text-warm-500 text-sm mb-6">Add a gift collection and invite people to sign</p>

            {/* Gift options */}
            <p className="text-sm font-semibold text-warm-700 mb-3">Gift collection</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { id: true, icon: '🐷', title: 'Enable gift pot', desc: 'Everyone chips in, recipient redeems' },
                { id: false, icon: '✉️', title: 'Card only', desc: 'Messages only, no gift collection' },
              ].map(o => (
                <button key={String(o.id)} onClick={() => set('is_gift_enabled', o.id)}
                  className={`rounded-3xl p-4 text-left border-2 transition-all ${
                    form.is_gift_enabled === o.id ? 'border-primary-400 bg-primary-50' : 'border-purple-100 hover:border-purple-200'
                  }`}>
                  <div className="text-2xl mb-2">{o.icon}</div>
                  <div className="text-sm font-semibold text-warm-800">{o.title}</div>
                  <div className="text-xs text-warm-500 mt-0.5">{o.desc}</div>
                </button>
              ))}
            </div>

            {form.is_gift_enabled && (
              <div className="mb-5">
                <p className="text-sm font-medium text-warm-700 mb-3">Suggested contribution</p>
                <div className="flex flex-wrap gap-2">
                  {[2500, 5000, 10000, 25000, 50000].map(amt => (
                    <button key={amt} onClick={() => set('suggested_amount', amt)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.suggested_amount === amt
                          ? 'bg-primary-400 text-white border-primary-400'
                          : 'border-purple-100 text-warm-700 hover:border-primary-300'
                      }`}>
                      {formatNGN(amt)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invite emails */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-warm-700 mb-1.5">Invite people to sign</label>
              <p className="text-xs text-warm-500 mb-2">Enter email addresses separated by commas or new lines</p>
              <textarea className="input h-24 resize-none" placeholder="kemi@email.com, emeka@email.com&#10;tunde@email.com"
                value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} />
              <p className="text-xs text-warm-400 mt-1">You can also share a link after creating the card</p>
            </div>

            {/* Summary */}
            <div className="rounded-3xl bg-warm-100 border border-purple-100 divide-y divide-gray-100 mb-6">
              {[
                ['Occasion', OCCASIONS.find(o => o.id === form.occasion)?.label || form.occasion],
                ['Design', CARD_DESIGNS.find(d => d.id === form.design_theme)?.name || form.design_theme],
                ['Recipient', form.recipient_name],
                ['Gift enabled', form.is_gift_enabled ? `Yes — ${formatNGN(form.suggested_amount)} suggested` : 'No'],
                ['Card fee', '₦5,000 one-time'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-warm-500">{k}</span>
                  <span className="text-sm font-medium text-warm-900">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary px-4">← Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{paymentStage === 'creating' ? 'Preparing your card...' : paymentStage === 'verifying' ? 'Confirming payment...' : 'Opening secure payment...'}</span>
                  : '🔒 Pay ₦5,000 & Create Card'}
              </button>
            </div>
            <p className="text-xs text-center text-warm-400 mt-3">Secured by Flutterwave · Card link will be ready immediately</p>
          </div>
        )}
      </div>
  );

  if (company) return <CompanyLayout title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</CompanyLayout>;
  if (member)  return <MemberLayout  title="Create a Card" subtitle="Takes less than 3 minutes">{inner}</MemberLayout>;
  return (
    <div className="min-h-screen">
      <Navbar />
      {inner}
    </div>
  );
};

export default CreateCard;
