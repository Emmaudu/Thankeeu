import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';
import { mentorshipAPI } from '../../utils/api';

const PLANS = [
  {
    id: 'monthly', name: 'Monthly', price: 50000, cadence: '/month', highlight: true,
    tagline: 'Best value — a full month of mentorship',
    features: ['8 live coaching sessions', '2 sessions every week', '30–45 mins each on Google Meet', 'Dedicated career-matched mentor', 'Learning pathway & progress guidance'],
  },
  {
    id: 'weekly', name: 'Weekly', price: 12500, cadence: '/week', highlight: false,
    tagline: 'Start light, pay as you go',
    features: ['2 live coaching sessions', '30–45 mins each on Google Meet', 'Career-matched mentor', 'Flexible weekly commitment'],
  },
];

const fmt = (n) => '₦' + n.toLocaleString('en-NG');

export default function MentorshipPricing() {
  useSEO({
    title: 'Pricing — Thankeeu Mentorship',
    description: 'Simple pricing for weekly career mentorship. ₦50,000/month or ₦12,500/week for live coaching with a real professional.',
    canonical: 'https://mentorship.thankeeu.com/pricing',
  });

  const [loading, setLoading] = useState(null);
  const [modal, setModal] = useState(null); // plan id awaiting email
  const [email, setEmail] = useState('');
  const [pname, setPname] = useState('');

  const startPay = async () => {
    const plan = modal;
    if (!email.trim()) { toast.error('Enter your email'); return; }
    setLoading(plan);
    try {
      const res = await mentorshipAPI.subscribe({ plan, parent_email: email.trim(), parent_name: pname.trim() });
      window.location.href = res.data.payment_link;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start payment. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 text-center px-4">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-warm-900 mb-4">Simple, honest pricing</h1>
        <p className="text-lg text-warm-600 max-w-xl mx-auto">
          One mentor. Real sessions. A clearer future for your child. Choose the rhythm that works for your family.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 -mt-6">
        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`relative rounded-3xl p-7 ${plan.highlight ? 'bg-white border-2 border-primary-500 shadow-lg' : 'bg-white border border-primary-100 shadow-card'}`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-bold">
                  Most popular
                </span>
              )}
              <h2 className="font-display font-extrabold text-xl text-warm-900 mb-1">{plan.name}</h2>
              <p className="text-warm-500 text-sm mb-4">{plan.tagline}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="font-display font-extrabold text-4xl text-primary-600">{fmt(plan.price)}</span>
                <span className="text-warm-400 text-sm pb-1.5">{plan.cadence}</span>
              </div>
              <ul className="space-y-3 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-warm-600">
                    <Icon name="Check" size={18} className="text-teal-500 flex-shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => { setModal(plan.id); setEmail(''); setPname(''); }}
                className={`w-full py-3.5 rounded-xl font-bold transition-all ${plan.highlight ? 'bg-primary-500 text-white hover:bg-primary-600' : 'border-2 border-primary-200 text-primary-700 hover:bg-primary-50'}`}>
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-warm-400 text-sm mt-8">
          Not sure yet? <Link to="/apply" className="text-primary-600 font-bold hover:underline">Enroll first</Link> — payment can come after we match your mentor.
        </p>
      </section>

      {/* Payment modal */}
      {modal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-warm-900/50 backdrop-blur-sm px-4" onClick={() => !loading && setModal(null)}>
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-extrabold text-xl text-warm-900 mb-1">Almost there</h3>
            <p className="text-warm-500 text-sm mb-5">
              {modal === 'monthly' ? `${fmt(50000)} / month` : `${fmt(12500)} / week`} — secure checkout via Flutterwave.
            </p>
            <div className="space-y-3 mb-5">
              <input value={pname} onChange={e => setPname(e.target.value)} placeholder="Your name (optional)"
                className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" required
                className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" />
            </div>
            <button onClick={startPay} disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="ArrowRight" size={18} />}
              {loading ? 'Redirecting…' : 'Continue to payment'}
            </button>
            <button onClick={() => !loading && setModal(null)} className="w-full mt-2 py-2 text-warm-400 text-sm font-semibold hover:text-warm-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
