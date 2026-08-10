import { useState } from 'react';
import toast from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { useSEO } from '../../hooks/useSEO';
import { mentorshipAPI } from '../../utils/api';

export default function MentorshipContact() {
  useSEO({
    title: 'Contact — Thankeeu Mentorship',
    description: 'Have a question about Thankeeu Mentorship? Send us a message and our team will get back to you.',
    canonical: 'https://mentorship.thankeeu.com/contact',
  });

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email and message'); return;
    }
    setSaving(true);
    try {
      await mentorshipAPI.contact(form);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-primary-50 to-white py-16 px-4 text-center">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-warm-900 mb-4">Get in touch</h1>
        <p className="text-lg text-warm-600 max-w-xl mx-auto">Questions about mentorship, matching, or pricing? We're here to help.</p>
      </section>

      <section className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        {sent ? (
          <div className="bg-white rounded-3xl shadow-card p-8 text-center">
            <span className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-5">
              <Icon name="Check" size={32} />
            </span>
            <h2 className="font-display font-extrabold text-2xl text-warm-900 mb-2">Message sent!</h2>
            <p className="text-warm-500">Thank you for reaching out. Our team will get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-3xl shadow-card p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-warm-700 mb-1.5">Your name</label>
              <input value={form.name} onChange={set('name')} required
                className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-bold text-warm-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required
                className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-sm font-bold text-warm-700 mb-1.5">Phone (optional)</label>
              <input value={form.phone} onChange={set('phone')}
                className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" placeholder="080..." />
            </div>
            <div>
              <label className="block text-sm font-bold text-warm-700 mb-1.5">Message</label>
              <textarea value={form.message} onChange={set('message')} required rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-primary-100 focus:border-primary-400 focus:outline-none text-warm-900" placeholder="How can we help?" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3.5 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {saving ? <Icon name="Loader" size={18} className="animate-spin" /> : <Icon name="Mail" size={18} />}
              {saving ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
