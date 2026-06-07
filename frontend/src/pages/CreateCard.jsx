import { useSEO } from '../hooks/useSEO';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cardsAPI, paymentsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { usdToNgn } from '../utils/currency';

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
            'bg-gray-100 text-gray-400'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-sm font-medium hidden sm:block ${i <= current ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
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
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [form, setForm] = useState({
    occasion: 'birthday', design_theme: 'rose_love', background_color: '#FBEAF0',
    title: '', recipient_name: '', recipient_email: '', send_date: '',
    deadline: '', is_gift_enabled: true, gift_type: 'pot', suggested_amount: 25,
    allow_private_messages: true, send_reminders: true, hide_amounts: false
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleOccasionSelect = (occ) => {
    set('occasion', occ.id);
    if (!form.title) set('title', `${user.full_name?.split(' ')[0]}'s ${occ.label} Card`);
  };

  const handleDesignSelect = (d) => {
    set('design_theme', d.id);
    set('background_color', d.bg);
  };

  const handleSubmit = async () => {
    if (!form.recipient_name) return toast.error('Add recipient name');
    setLoading(true);
    try {
      // Convert suggested_amount from USD to NGN before saving
      const cardData = { ...form, suggested_amount: usdToNgn(form.suggested_amount) };
      const res = await cardsAPI.create(cardData);
      const slug = res.data.slug;

      // Step 2: Initiate payment — on success Paystack redirects back
      const payRes = await paymentsAPI.initPurchase('single');
      // Store pending card info so we can activate after payment
      localStorage.setItem('thankeeu_pending_card', JSON.stringify({
        slug,
        inviteEmails: inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
      }));
      window.location.href = `https://checkout.paystack.com/${payRes.data.access_code}`;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create card');
      setLoading(false);
    }
  };

  const handlePayAndCreate = async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.initPurchase('single');
      window.location.href = `https://checkout.paystack.com/${res.data.access_code}`;
    } catch { toast.error('Payment init failed'); setLoading(false); }
  };

  const selectedDesign = DESIGNS.find(d => d.id === form.design_theme);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Create a Thankeeu card</h1>
          <p className="text-gray-500 text-sm">Takes less than 3 minutes to set up</p>
        </div>

        <StepIndicator current={step} />

        {/* Step 0: Occasion */}
        {step === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-gray-900 mb-1">What's the occasion?</h2>
            <p className="text-gray-500 text-sm mb-6">Pick the type of card you're creating</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
              {OCCASIONS.map(o => (
                <button key={o.id} onClick={() => handleOccasionSelect(o)}
                  className={`rounded-2xl p-4 text-center transition-all border-2 ${
                    form.occasion === o.id
                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}>
                  <div className="text-2xl mb-1">{o.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{o.label}</div>
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
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-gray-900 mb-1">Pick a design</h2>
            <p className="text-gray-500 text-sm mb-6">Choose from our beautiful templates</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {DESIGNS.map(d => (
                <button key={d.id} onClick={() => handleDesignSelect(d)}
                  className={`rounded-2xl overflow-hidden border-2 transition-all ${
                    form.design_theme === d.id ? 'border-primary-400 shadow-md' : 'border-transparent'
                  }`}>
                  <div className="h-20 flex items-center justify-center text-4xl" style={{ background: d.bg }}>{d.emoji}</div>
                  <div className="py-2 px-1 text-center">
                    <span className="text-xs font-medium text-gray-700">{d.name}</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedDesign && (
              <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: selectedDesign.bg }}>
                <span className="text-2xl">{selectedDesign.emoji}</span>
                <div>
                  <p className="font-medium text-sm" style={{ color: selectedDesign.accent }}>Preview: {selectedDesign.name}</p>
                  <p className="text-xs opacity-70" style={{ color: selectedDesign.accent }}>This will be your card's background</p>
                </div>
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
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-gray-900 mb-1">Card details</h2>
            <p className="text-gray-500 text-sm mb-6">Tell us who this is for</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Card title</label>
                <input className="input" placeholder="e.g. Amaka's Birthday Card 🎂" value={form.title}
                  onChange={e => set('title', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient's name <span className="text-red-400">*</span></label>
                  <input className="input" placeholder="e.g. Amaka" value={form.recipient_name}
                    onChange={e => set('recipient_name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient's email <span className="text-gray-400 font-normal text-xs">(to deliver card)</span></label>
                  <input type="email" className="input" placeholder="amaka@email.com" value={form.recipient_email}
                    onChange={e => set('recipient_email', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery date</label>
                  <input type="date" className="input" value={form.send_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('send_date', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Signing deadline</label>
                  <input type="date" className="input" value={form.deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('deadline', e.target.value)} />
                </div>
              </div>
              {/* Toggles */}
              <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
                {[
                  { key: 'allow_private_messages', label: 'Allow private messages', desc: 'Contributors can mark messages visible only to recipient' },
                  { key: 'send_reminders', label: 'Auto-send reminders', desc: "Nudge people who haven't signed 2 days before deadline" },
                  { key: 'hide_amounts', label: 'Hide gift amounts', desc: "Contributors won't see how much others gave" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
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
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 animate-fade-in">
            <h2 className="font-display text-xl font-semibold text-gray-900 mb-1">Gift & send</h2>
            <p className="text-gray-500 text-sm mb-6">Add a gift collection and invite people to sign</p>

            {/* Gift options */}
            <p className="text-sm font-semibold text-gray-700 mb-3">Gift collection</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { id: true, icon: '🐷', title: 'Enable gift pot', desc: 'Everyone chips in, recipient redeems' },
                { id: false, icon: '✉️', title: 'Card only', desc: 'Messages only, no gift collection' },
              ].map(o => (
                <button key={String(o.id)} onClick={() => set('is_gift_enabled', o.id)}
                  className={`rounded-2xl p-4 text-left border-2 transition-all ${
                    form.is_gift_enabled === o.id ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="text-2xl mb-2">{o.icon}</div>
                  <div className="text-sm font-semibold text-gray-800">{o.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{o.desc}</div>
                </button>
              ))}
            </div>

            {form.is_gift_enabled && (
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-3">Suggested contribution</p>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 25, 50, 100].map(amt => (
                    <button key={amt} onClick={() => set('suggested_amount', amt)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.suggested_amount === amt
                          ? 'bg-primary-400 text-white border-primary-400'
                          : 'border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}>
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invite emails */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invite people to sign</label>
              <p className="text-xs text-gray-500 mb-2">Enter email addresses separated by commas or new lines</p>
              <textarea className="input h-24 resize-none" placeholder="kemi@email.com, emeka@email.com&#10;tunde@email.com"
                value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">You can also share a link after creating the card</p>
            </div>

            {/* Summary */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 divide-y divide-gray-100 mb-6">
              {[
                ['Occasion', OCCASIONS.find(o => o.id === form.occasion)?.label || form.occasion],
                ['Design', DESIGNS.find(d => d.id === form.design_theme)?.name || form.design_theme],
                ['Recipient', form.recipient_name],
                ['Gift enabled', form.is_gift_enabled ? `Yes — $${form.suggested_amount} suggested` : 'No'],
                ['Card fee', '$5 one-time'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="text-sm font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary px-4">← Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</span>
                  : '🔒 Pay $5 & Create Card'}
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-3">Secured by Paystack · Card link will be ready immediately</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCard;
