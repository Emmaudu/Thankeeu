import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, X, Send, ChevronLeft, RefreshCw } from 'lucide-react';
import { supportApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'general',       label: 'General Question' },
  { value: 'payment',       label: 'Payment Issue' },
  { value: 'task_dispute',  label: 'Task Dispute' },
  { value: 'account',       label: 'Account Problem' },
  { value: 'kyc',           label: 'KYC / Verification' },
  { value: 'withdrawal',    label: 'Withdrawal Problem' },
  { value: 'other',         label: 'Something Else' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_STYLES = {
  open:         { bg: '#fef9c3', color: '#854d0e',  label: 'Open' },
  in_progress:  { bg: '#dbeafe', color: '#1e40af',  label: 'In Progress' },
  waiting_user: { bg: '#f3e8ff', color: '#6b21a8',  label: 'Waiting on You' },
  resolved:     { bg: '#dcfce7', color: '#166534',  label: 'Resolved' },
  closed:       { bg: '#f1f5f9', color: '#475569',  label: 'Closed' },
};

const PRIORITY_COLORS = {
  low:    '#64748b',
  normal: '#3b82f6',
  high:   '#f97316',
  urgent: '#ef4444',
};

function StatusTag({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.open;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      {s.label}
    </span>
  );
}

export default function SupportWidget() {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // list | new | thread
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  const [newForm, setNewForm] = useState({
    subject: '', category: 'general', priority: 'normal', message: '',
  });

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supportApi.getTickets();
      setTickets(data.tickets || []);
    } catch {} finally { setLoading(false); }
  };

  const openTicket = async (ticket) => {
    setActiveTicket(ticket);
    setView('thread');
    setThreadLoading(true);
    try {
      const { data } = await supportApi.getTicket(ticket.id);
      setActiveTicket(data.ticket);
      setMessages(data.messages || []);
    } catch { toast.error('Could not load ticket'); }
    finally { setThreadLoading(false); }
  };

  const submitNew = async () => {
    if (!newForm.subject.trim() || !newForm.message.trim()) {
      toast.error('Subject and message are required'); return;
    }
    setSubmitting(true);
    try {
      await supportApi.createTicket(newForm);
      toast.success('Ticket submitted! We\'ll respond within 24 hours.');
      setNewForm({ subject: '', category: 'general', priority: 'normal', message: '' });
      setView('list');
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit ticket');
    } finally { setSubmitting(false); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;
    setReplying(true);
    try {
      const { data } = await supportApi.replyTicket(activeTicket.id, { message: replyText });
      setMessages(prev => [...prev, data.message]);
      setReplyText('');
      loadTickets();
    } catch { toast.error('Could not send reply'); }
    finally { setReplying(false); }
  };

  const closeTicket = async () => {
    try {
      await supportApi.updateStatus(activeTicket.id, { status: 'closed' });
      toast.success('Ticket closed');
      setView('list');
      loadTickets();
    } catch { toast.error('Could not close ticket'); }
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────
  if (view === 'list') return (
    <div style={{ maxWidth: 680 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>Support</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Submit a ticket and we'll respond within 24 hours</p>
        </div>
        <button onClick={() => setView('new')} className="btn-primary btn-sm flex items-center gap-2">
          <Plus size={15} /> New Ticket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--muted)' }} />
        </div>
      ) : tickets.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'white', borderRadius: 20, border: '1px solid var(--border-light)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: 'var(--rose-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <MessageSquare size={28} style={{ color: 'var(--rose)' }} />
          </div>
          <p style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>No tickets yet</p>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Have an issue? Submit a support ticket and we'll help you out fast.
          </p>
          <button onClick={() => setView('new')} className="btn-primary btn-sm">
            Open a Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <button
              key={t.id}
              onClick={() => openTicket(t)}
              className="w-full text-left"
              style={{
                background: 'white', border: '1px solid var(--border-light)', borderRadius: 16,
                padding: '16px 20px', transition: 'all 0.15s', cursor: 'pointer',
                display: 'block',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,45,98,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: 'monospace' }}>
                      #{t.ticket_number}
                    </span>
                    <StatusTag status={t.status} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[t.priority],
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {t.priority}
                    </span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }} className="truncate">
                    {t.subject}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {(t.updated_at ? format(new Date(t.updated_at), 'MMM d, yyyy · h:mm a') : '')}
                  </p>
                </div>
                <ChevronLeft size={16} style={{ color: 'var(--muted)', transform: 'rotate(180deg)', flexShrink: 0, marginTop: 2 }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── NEW TICKET ─────────────────────────────────────────────────────
  if (view === 'new') return (
    <div style={{ maxWidth: 600 }}>
      <button onClick={() => setView('list')} className="flex items-center gap-2 mb-6"
        style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
        <ChevronLeft size={16} /> Back to tickets
      </button>

      <h2 style={{ fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 24 }}>Open a Support Ticket</h2>

      <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border-light)', padding: 28 }} className="space-y-5">
        <div>
          <label className="label">Subject *</label>
          <input
            type="text" className="input" placeholder="Brief description of your issue"
            value={newForm.subject} onChange={e => setNewForm({ ...newForm, subject: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={newForm.category} onChange={e => setNewForm({ ...newForm, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={newForm.priority} onChange={e => setNewForm({ ...newForm, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Describe your issue *</label>
          <textarea
            rows={5} className="input resize-none"
            placeholder="Please describe the issue in detail. Include task IDs, payment references, or any relevant information..."
            value={newForm.message} onChange={e => setNewForm({ ...newForm, message: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={submitNew} disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
          <button onClick={() => setView('list')} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  );

  // ── THREAD VIEW ────────────────────────────────────────────────────
  if (view === 'thread') return (
    <div style={{ maxWidth: 680, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <button onClick={() => setView('list')} className="flex items-center gap-2 mb-2"
            style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={15} /> All tickets
          </button>
          <h2 style={{ fontWeight: 900, fontSize: 19, color: 'var(--text)', marginBottom: 6 }}>
            {activeTicket?.subject}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: 'monospace' }}>
              #{activeTicket?.ticket_number}
            </span>
            {activeTicket && <StatusTag status={activeTicket.status} />}
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: PRIORITY_COLORS[activeTicket?.priority],
            }}>
              {activeTicket?.priority}
            </span>
          </div>
        </div>
        {activeTicket?.status !== 'closed' && activeTicket?.status !== 'resolved' && (
          <button onClick={closeTicket} className="btn-ghost btn-sm" style={{ flexShrink: 0, color: 'var(--muted)' }}>
            <X size={14} /> Close
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', background: '#fdf9ff', borderRadius: 16,
        border: '1px solid var(--border-light)', padding: 20, marginBottom: 16,
      }}>
        {threadLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--muted)' }} />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => {
              const isMine = msg.sender_id === user?.id;
              const isAdminMsg = msg.is_admin;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: 10 }}>
                  {!isMine && (
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: isAdminMsg ? 'var(--rose)' : '#e2d9f3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isAdminMsg ? 'white' : 'var(--muted)', fontWeight: 800, fontSize: 12,
                    }}>
                      {isAdminMsg ? 'A' : msg.sender?.full_name?.[0]}
                    </div>
                  )}
                  <div style={{ maxWidth: '75%' }}>
                    {!isMine && (
                      <p style={{ fontSize: 11, fontWeight: 700, color: isAdminMsg ? 'var(--rose)' : 'var(--muted)', marginBottom: 4 }}>
                        {isAdminMsg ? 'Taskeeu Support' : msg.sender?.full_name}
                      </p>
                    )}
                    <div style={{
                      background: isMine ? 'linear-gradient(135deg, var(--rose), var(--rose-dark))' : 'white',
                      color: isMine ? 'white' : 'var(--text)',
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '12px 16px',
                      border: isMine ? 'none' : '1px solid var(--border-light)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                      {(msg.created_at ? format(new Date(msg.created_at), 'MMM d · h:mm a') : '')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply box */}
      {activeTicket?.status !== 'closed' ? (
        <div style={{
          flexShrink: 0, background: 'white', borderRadius: 16, border: '1px solid var(--border-light)', padding: 16,
        }}>
          <div className="flex items-end gap-3">
            <textarea
              rows={2} value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
              style={{
                flex: 1, background: '#fdf9ff', border: '1px solid var(--border)',
                borderRadius: 12, padding: '10px 14px', fontSize: 14,
                fontFamily: 'Plus Jakarta Sans, sans-serif', resize: 'none', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--rose)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={sendReply} disabled={replying || !replyText.trim()}
              style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: replyText.trim() ? 'var(--rose)' : '#f1f5f9',
                color: replyText.trim() ? 'white' : 'var(--muted)',
                border: 'none', cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}
            >
              {replying ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 6 }}>Enter to send · Shift+Enter for new line</p>
        </div>
      ) : (
        <div style={{ flexShrink: 0, textAlign: 'center', padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>This ticket is closed</p>
          <button onClick={() => setView('new')} className="btn-ghost btn-sm mt-2">Open a new ticket</button>
        </div>
      )}
    </div>
  );
}
