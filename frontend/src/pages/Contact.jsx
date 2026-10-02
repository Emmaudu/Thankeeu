import { useState } from 'react';
import SEO from '../components/seo/SEO';
import { MessageSquare, Building2, Users, Star, CheckCircle } from 'lucide-react';
import { contactApi } from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'general',     label: 'General Question',    Icon: MessageSquare },
  { value: 'support',     label: 'Account / Platform',  Icon: CheckCircle },
  { value: 'enterprise',  label: 'Enterprise & Teams',  Icon: Building2 },
  { value: 'partnership', label: 'Partnership',         Icon: Users },
  { value: 'feedback',    label: 'Feedback',            Icon: Star },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', category: 'general', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await contactApi.submit(form);
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your message. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <SEO title="Contact Us | Taskeeu" description="Get in touch with the Taskeeu team. We respond within 24 to 48 hours." />
      <div style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 80 }}>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(135deg, var(--dark) 0%, #1e0a30 100%)', padding: '64px 0' }}>
          <div className="container-xl text-center">
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 16 }}>
              Get in touch
            </p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 38, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Contact Us
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Fill in the form below and our team will get back to you within 24 to 48 hours during business hours (Monday to Friday, 8am to 6pm WAT).
            </p>
          </div>
        </section>

        <section style={{ padding: '64px 0' }}>
          <div className="container-xl" style={{ maxWidth: 720 }}>

            {success ? (
              <div className="card p-12 text-center">
                <div style={{ fontSize: 60, marginBottom: 20 }}></div>
                <h2 style={{ fontWeight: 900, fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>
                  Message sent!
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.75, marginBottom: 24 }}>
                  We've received your message and sent a confirmation to <strong>{form.email}</strong>.
                  Our team will respond within 24 to 48 hours.
                </p>
                <button
                  onClick={() => { setSuccess(false); setForm({ name: '', email: '', subject: '', category: 'general', message: '' }); }}
                  className="btn-primary inline-flex">
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

                {/* Left — category selector */}
                <div className="md:col-span-2 space-y-3">
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                    What's this about?
                  </p>
                  {CATEGORIES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button" onClick={() => set('category', value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                        padding: '12px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: form.category === value ? 'var(--rose)' : 'white',
                        color: form.category === value ? 'white' : 'var(--text)',
                        fontWeight: 700, fontSize: 14,
                        boxShadow: form.category === value ? '0 4px 16px rgba(255,45,98,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                        transition: 'all 0.15s',
                        textAlign: 'left',
                      }}
                    >
                      <Icon size={16} style={{ flexShrink: 0, opacity: form.category === value ? 1 : 0.5 }} />
                      {label}
                    </button>
                  ))}

                  <div className="card p-5 mt-4">
                    <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: 14, marginBottom: 6 }}>
                      Taskeeu Technologies Ltd.
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
                      Lagos, Nigeria<br />
                      Monday to Friday, 8:00am to 6:00pm WAT
                    </p>
                  </div>
                </div>

                {/* Right — form */}
                <form onSubmit={handleSubmit} className="md:col-span-3 card p-8 space-y-4">
                  <h3 style={{ fontWeight: 900, fontSize: 18, color: 'var(--text)', margin: '0 0 4px' }}>
                    Send us a message
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 8px' }}>
                    We read every message and respond personally.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Your Name *</label>
                      <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Chidi Okafor" className="input" />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className="input" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Subject *</label>
                    <input required value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Briefly describe your inquiry" className="input" />
                  </div>

                  <div>
                    <label className="label">Message *</label>
                    <textarea
                      required rows={5} value={form.message} onChange={e => set('message', e.target.value)}
                      placeholder="Tell us more about what you need help with..." className="input resize-none"/>
                  </div>

                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Sending…' : 'Send Message →'}
                  </button>

                  <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', margin: '4px 0 0' }}>
                    We typically respond within 24 to 48 hours. No spam, ever.
                  </p>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
