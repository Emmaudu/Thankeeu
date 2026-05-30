import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { supportAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SUBJECTS = [
  'Subscription & billing',
  'Birthday automation not triggering',
  'Team data import issue',
  'Email delivery problem',
  'Account access issue',
  'Feature request',
  'Technical bug report',
  'Other',
];

const statusColors = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const SupportPage = () => {
  useSEO({ title: 'Support — Thankeeu for Teams', noIndex: true });

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openTicket, setOpenTicket] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '' });

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await supportAPI.getMine();
      setTickets(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error('Please select a subject');
    if (!form.message.trim()) return toast.error('Please write your message');
    setSubmitting(true);
    try {
      await supportAPI.create(form);
      setSubmitted(true);
      setForm({ subject: '', message: '' });
      fetchTickets();
      setTimeout(() => setSubmitted(false), 5000);
      toast.success('Message sent! We will reply within 24 hours.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <CompanyLayout title="Support" subtitle="Get help from the Thankeeu team">
      <div className="max-w-2xl">

        {/* Success confirmation */}
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">✅</div>
            <div>
              <p className="font-semibold text-green-800">Message sent successfully!</p>
              <p className="text-sm text-green-600 mt-0.5">Our team will reply to your company email within 24 hours.</p>
            </div>
          </div>
        )}

        {/* New ticket form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-1">Send a message to Thankeeu Support</h3>
          <p className="text-sm text-gray-500 mb-5">Describe your issue and we'll get back to you as soon as possible.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject <span className="text-red-400">*</span></label>
              <select className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                <option value="">Select a subject...</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message <span className="text-red-400">*</span></label>
              <textarea
                className="input h-36 resize-none"
                placeholder="Describe your issue in detail. Include any error messages, what you expected to happen, and what actually happened..."
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Be as specific as possible to help us resolve this faster</p>
                <span className="text-xs text-gray-400">{form.message.length}/2000</span>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span>
                : '💬 Send to Thankeeu Support'}
            </button>
          </form>
        </div>

        {/* Contact alternatives */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <a href="mailto:support@thankeeu.ng" className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-primary-300 transition-colors text-center">
            <div className="text-2xl mb-2">📧</div>
            <p className="text-sm font-medium text-gray-900">Email directly</p>
            <p className="text-xs text-gray-400 mt-0.5">support@thankeeu.ng</p>
          </a>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">⏱️</div>
            <p className="text-sm font-medium text-gray-900">Response time</p>
            <p className="text-xs text-gray-400 mt-0.5">Within 24 hours</p>
          </div>
        </div>

        {/* Ticket history */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Your support tickets</h3>
            <span className="text-xs text-gray-400">{tickets.length} tickets</span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-4xl mb-3">🎫</div>
              <p className="text-sm text-gray-400">No support tickets yet</p>
              <p className="text-xs text-gray-400 mt-1">Use the form above to reach out</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map(t => (
                <div key={t.id}>
                  <button
                    onClick={() => setOpenTicket(openTicket === t.id ? null : t.id)}
                    className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[t.status]}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{format(new Date(t.created_at), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                    <span className="text-gray-400 flex-shrink-0 mt-0.5">{openTicket === t.id ? '▲' : '▼'}</span>
                  </button>

                  {openTicket === t.id && (
                    <div className="px-5 pb-5 space-y-3">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Your message</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{t.message}</p>
                      </div>
                      {t.admin_reply && (
                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                          <p className="text-xs font-semibold text-primary-600 mb-2">
                            Thankeeu Support replied · {t.admin_replied_at ? format(new Date(t.admin_replied_at), 'MMM d, yyyy') : ''}
                          </p>
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{t.admin_reply}</p>
                        </div>
                      )}
                      {!t.admin_reply && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                          <span>⏳</span> Awaiting reply from our team. Usually within 24 hours.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CompanyLayout>
  );
};

export default SupportPage;
