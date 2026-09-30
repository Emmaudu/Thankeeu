import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';
import { mentorshipAPI } from '../../utils/api';
import { CAREER_PATHS, INITIAL_COUNT, CHILD_CLASSES } from './careerPaths';

export default function MentorshipApply() {
  useSEO({
    title: 'Enroll your child — Thankeeu Mentorship',
    description: 'Tell us about your child and the careers they aspire to. We\'ll match them with the right professional mentor.',
    canonical: 'https://mentorship.thankeeu.com/apply',
  });

  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({
    parent_name: '', parent_email: '', parent_phone: '', child_class: '',
  });
  const [paths, setPaths] = useState([]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const togglePath = (p) => setPaths(cur => cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p]);

  const goToStep2 = (e) => {
    e.preventDefault();
    if (!form.parent_name.trim() || !form.parent_email.trim() || !form.parent_phone.trim() || !form.child_class) {
      toast.error('Please fill in all the details'); return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (paths.length === 0) { toast.error('Select at least one career path'); return; }
    setSaving(true);
    try {
      const res = await mentorshipAPI.apply({ ...form, career_paths: paths });
      toast.success('Application received!');
      navigate('/apply/success', { state: { applicationId: res.data.application_id, name: form.parent_name, email: form.parent_email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit. Please try again.');
    } finally { setSaving(false); }
  };

  const visiblePaths = showAll ? CAREER_PATHS : CAREER_PATHS.slice(0, INITIAL_COUNT);

  return (
    <div className="bg-warm-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map(n => (
            <div key={n} className="flex-1">
              <div className={`h-1.5 rounded-full ${step >= n ? 'bg-primary-500' : 'bg-primary-100'}`} />
              <p className={`text-xs font-bold mt-1.5 ${step >= n ? 'text-primary-600' : 'text-warm-400'}`}>
                {n === 1 ? 'Your details' : 'Career paths'}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-card p-6 sm:p-8">
          {step === 1 && (
            <form onSubmit={goToStep2} className="space-y-5">
              <div className="text-center mb-2">
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-3">
                  <Icon name="Users" size={24} />
                </span>
                <h1 className="font-display font-extrabold text-2xl text-warm-900">Let's get started</h1>
                <p className="text-warm-500 text-sm mt-1">Tell us about you and your child.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Parent's full name</label>
                <input value={form.parent_name} onChange={set('parent_name')} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" placeholder="e.g. Mrs. Adaeze Okoro" />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Parent's email</label>
                <input type="email" value={form.parent_email} onChange={set('parent_email')} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Parent's phone number</label>
                <input value={form.parent_phone} onChange={set('parent_phone')} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" placeholder="080..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-warm-700 mb-1.5">Child's class</label>
                <select value={form.child_class} onChange={set('child_class')} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900 bg-white">
                  <option value="">Select class</option>
                  {CHILD_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 inline-flex items-center justify-center gap-2">
                Continue <Icon name="ArrowRight" size={18} />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-2">
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary-50 text-primary-600 mb-3">
                  <Icon name="Target" size={24} />
                </span>
                <h1 className="font-display font-extrabold text-2xl text-warm-900">What does your child aspire to?</h1>
                <p className="text-warm-500 text-sm mt-1">Select as many career paths as apply. We'll match the best mentor.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {visiblePaths.map(p => {
                  const active = paths.includes(p);
                  return (
                    <button key={p} type="button" onClick={() => togglePath(p)}
                      className={`text-left px-3.5 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-primary-100 text-warm-600 hover:border-primary-300'}`}>
                      <span className="flex items-start gap-1.5">
                        {active && <Icon name="Check" size={15} className="text-primary-500 flex-shrink-0 mt-0.5" />}
                        {p}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!showAll && CAREER_PATHS.length > INITIAL_COUNT && (
                <button type="button" onClick={() => setShowAll(true)}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-primary-200 text-primary-600 text-sm font-bold hover:bg-primary-50 inline-flex items-center justify-center gap-1.5">
                  Load more paths <Icon name="ChevronDown" size={16} />
                </button>
              )}

              <div className="flex items-center justify-between pt-2 text-sm">
                <span className="text-warm-500">{paths.length} selected</span>
                <button type="button" onClick={() => setStep(1)} className="text-warm-400 hover:text-warm-700 font-semibold">← Back</button>
              </div>

              <button type="button" onClick={submit} disabled={saving || paths.length === 0}
                className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {saving ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="Check" size={18} />}
                {saving ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
