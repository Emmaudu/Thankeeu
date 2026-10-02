import { useState } from 'react';
import SEO from '../components/seo/SEO';
import { Link } from 'react-router-dom';
import { CheckCircle, Phone, Mail, Building2, Users, ArrowRight } from 'lucide-react';
import { demoApi } from '../utils/api';
import toast from 'react-hot-toast';

const INDUSTRIES = [
  'Banking & Finance','Telecoms','Insurance','FMCG & Retail','Real Estate',
  'Energy & Utilities','Logistics','NGO / Non-profit','Government','Technology',
  'Healthcare','Education','Manufacturing','Agriculture','Other',
];

const COMPANY_SIZES = ['1 to 10','11 to 50','51 to 200','201 to 500','500+'];

export default function Demo() {
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    company_size: '', industry: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_name || !form.email || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await demoApi.submitRequest(form);
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit request. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <SEO
        title="Book a Demo | Taskeeu for Teams" description="See how Taskeeu for Teams works for your enterprise. Book a live demo with our team."/>
      <div style={{ background: 'var(--surface)', minHeight: '100vh', paddingTop: 80 }}>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(135deg, var(--dark) 0%, #1e0a30 100%)', padding: '64px 0' }}>
          <div className="container-xl text-center">
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rose)', marginBottom: 16 }}>
              Taskeeu for Teams
            </p>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: 40, letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.15 }}>
              Book a Live Demo
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              See how Taskeeu helps enterprise teams deploy verified taskers at scale across Africa.
            </p>
          </div>
        </section>

        <section style={{ padding: '64px 0' }}>
          <div className="container-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Left — what to expect */}
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 26, color: 'var(--text)', marginBottom: 8 }}>
                  What you'll see in the demo
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
                  A 30-minute live walkthrough tailored to your industry and use case.
                </p>
                <div className="space-y-5">
                  {[
                    { icon: Building2, title: 'Company dashboard', desc: 'Manage multiple branches, departments, and budgets from one place.' },
                    { icon: Users, title: 'Team task deployment', desc: 'Post tasks to hundreds of verified taskers simultaneously across states.' },
                    { icon: CheckCircle, title: 'GPS proof & reporting', desc: 'Photo timestamps, location stamps, and exportable compliance reports.' },
                    { icon: Phone, title: 'Live Q&A', desc: 'Ask questions specific to your operations, SLAs, and pricing.' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} style={{ color: 'var(--rose)' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{title}</p>
                        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 36, padding: '20px 24px', background: 'white', borderRadius: 16, border: '1px solid var(--border-light)' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Prefer to reach us directly?</p>
                  <a href="/contact" className="flex items-center gap-2" style={{ color: 'var(--rose)', fontWeight: 600, fontSize: 15 }}>
                    <Mail size={16} /> Send us a message
                  </a>
                </div>
              </div>

              {/* Right — form */}
              <div>
                {success ? (
                  <div className="card p-10 text-center">
                    <div style={{ fontSize: 56, marginBottom: 16 }}></div>
                    <h3 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 10 }}>
                      Request received!
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
                      Our enterprise team will reach out to <strong>{form.email}</strong> within 24 hours to schedule your demo.
                    </p>
                    <Link to="/teams" className="btn-primary inline-flex items-center gap-2">
                      Explore Taskeeu for Teams <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="card p-8">
                    <h3 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>
                      Request a Demo
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
                      Fill in the form and we'll be in touch within 24 hours.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Company Name *</label>
                          <input required value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Acme Corp" className="input" />
                        </div>
                        <div>
                          <label className="label">Your Name *</label>
                          <input required value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Full name" className="input" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Work Email *</label>
                          <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" className="input" />
                        </div>
                        <div>
                          <label className="label">Phone Number *</label>
                          <input type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08012345678" className="input" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Industry</label>
                          <select value={form.industry} onChange={e => set('industry', e.target.value)} className="input">
                            <option value="">Select industry...</option>
                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Company Size</label>
                          <select value={form.company_size} onChange={e => set('company_size', e.target.value)} className="input">
                            <option value="">Select size...</option>
                            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="label">What do you want to use Taskeeu for? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
                        <textarea
                          rows={3} value={form.message} onChange={e => set('message', e.target.value)}
                          placeholder="Describe your use case briefly..." className="input resize-none"/>
                      </div>
                      <button type="submit" disabled={submitting} className="btn-primary w-full">
                        {submitting ? 'Submitting…' : 'Request Demo →'}
                      </button>
                      <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                        We'll get back to you within 24 hours. No spam, ever.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
