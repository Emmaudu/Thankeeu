import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect } from 'react';
import { memberSupportAPI } from '../../utils/api';
import { useMemberAuth } from '../../context/MemberAuthContext';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SUBJECTS = [
  'Card notification not received',
  'Cannot sign a card',
  'Account access issue',
  'Profile update issue',
  'Occasion not showing',
  'Department approval issue',
  'Feature request',
  'Technical bug report',
  'Other',
];

const statusColors = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-purple-50 text-warm-500',
};

const MemberSupportPage = () => {
  useSEO({ title: 'Support — Thankeeu for Teams', noIndex: true });

  const { member } = useMemberAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openTicket, setOpenTicket] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '' });

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await memberSupportAPI.getMine();
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
      await memberSupportAPI.create(form);
      toast.success('Ticket submitted! We\'ll respond within 24 hours.');
      setForm({ subject: '', message: '' });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit ticket');
    } finally { setSubmitting(false); }
  };

  return (
    <MemberLayout title="Support" subtitle="Get help from our team">

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl">

        {/* Submit form */}
        <div>
          <div className="bg-white rounded-3xl border border-purple-100 p-6">
            <h3 className="font-semibold text-warm-900 mb-1">Submit a support ticket</h3>
            <p className="text-sm text-warm-500 mb-5">Describe your issue and our team will get back to you.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Subject</label>
                <select className="input"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}>
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Message</label>
                <textarea
                  className="input resize-none"
                  rows={5}
                  placeholder="Describe your issue in detail..."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                {submitting ? 'Submitting...' : 'Submit ticket'}
              </button>
            </form>
          </div>

          {/* Quick contact */}
          <div className="mt-4 bg-primary-50 rounded-3xl p-5">
            <p className="text-sm font-semibold text-primary-800 mb-3">💬 Other ways to reach us</p>
            <a href="mailto:support@thankeeu.com"
              className="flex items-center gap-3 bg-white rounded-xl p-3 hover:border-primary-200 border border-purple-100 transition-colors">
              <span className="text-xl">📧</span>
              <div>
                <p className="text-sm font-medium text-warm-900">Email support</p>
                <p className="text-xs text-warm-400">support@thankeeu.com</p>
              </div>
            </a>
          </div>
        </div>

        {/* Ticket history */}
        <div>
          <h3 className="font-semibold text-warm-900 mb-4">My tickets</h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-purple-100" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-purple-100 p-8 text-center">
              <div className="text-4xl mb-3">🎫</div>
              <p className="text-sm text-warm-400">No support tickets yet</p>
              <p className="text-xs text-warm-400 mt-1">Submit a ticket and it will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-white rounded-3xl border border-purple-100 p-4 cursor-pointer hover:border-primary-200 transition-colors"
                  onClick={() => setOpenTicket(openTicket?.id === ticket.id ? null : ticket)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-900 truncate">{ticket.subject}</p>
                      <p className="text-xs text-warm-400 mt-0.5">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${statusColors[ticket.status] || statusColors.open}`}>
                      {ticket.status?.replace('_', ' ') || 'open'}
                    </span>
                  </div>

                  {openTicket?.id === ticket.id && (
                    <div className="mt-4 pt-4 border-t border-purple-100 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-warm-500 mb-1">Your message</p>
                        <p className="text-sm text-warm-700 leading-relaxed">{ticket.message}</p>
                      </div>
                      {ticket.admin_reply && (
                        <div className="bg-primary-50 rounded-xl p-3">
                          <p className="text-xs font-medium text-primary-700 mb-1">💬 Support reply</p>
                          <p className="text-sm text-warm-700 leading-relaxed">{ticket.admin_reply}</p>
                          {ticket.admin_replied_at && (
                            <p className="text-xs text-primary-400 mt-1">
                              {format(new Date(ticket.admin_replied_at), 'MMM d, yyyy · HH:mm')}
                            </p>
                          )}
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
    </MemberLayout>
  );
};

export default MemberSupportPage;
