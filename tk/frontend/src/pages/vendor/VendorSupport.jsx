import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import toast from 'react-hot-toast';
import { asArray } from '../../utils/asArray';

export default function VendorSupport() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject:'', message:'' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => vendorAxios.get('/vendor/support').then(r=>setTickets(asArray(r.data))).finally(()=>setLoading(false));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) return toast.error('Subject and message are required');
    setSubmitting(true);
    try {
      await vendorAxios.post('/vendor/support', form);
      toast.success('Message sent! We will respond within 24 hours.');
      setForm({ subject:'', message:'' });
      load();
    } catch { toast.error('Failed to send message'); }
    finally { setSubmitting(false); }
  };

  const STATUS_COLOR = s => ({
    open:'bg-amber-100 text-amber-700', answered:'bg-green-100 text-green-700', closed:'bg-gray-100 text-gray-600'
  }[s]||'bg-gray-100 text-gray-600');

  return (
    <VendorLayout title="Support" subtitle="Ask us anything — we typically reply within 24 hours">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New ticket */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6">
          <h3 className="font-semibold text-warm-900 mb-4 flex items-center gap-2">
            <Icon name="Message" size={18} className="text-primary-500"/> New message
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Subject</label>
              <input value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))}
                placeholder="What's your question?" className="input w-full"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Message</label>
              <textarea rows={5} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}
                placeholder="Describe your issue or question in detail..." className="input w-full"/>
            </div>
          </div>
          <button onClick={submit} disabled={submitting}
            className="mt-4 w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
            {submitting ? 'Sending...' : 'Send message'}
          </button>
          <div className="mt-4 p-4 bg-purple-50 rounded-xl text-xs text-warm-500">
            <p className="font-semibold text-warm-700 mb-1">Need faster help?</p>
            <p>Email: <a href="mailto:support@thankeeu.com" className="text-primary-600">support@thankeeu.com</a></p>
          </div>
        </div>

        {/* Ticket history */}
        <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-50">
            <h3 className="font-semibold text-warm-900">Your messages</h3>
          </div>
          {loading
            ? <div className="p-5 space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-16 bg-purple-50 rounded-xl animate-pulse"/>)}</div>
            : tickets.length === 0
              ? <div className="py-12 text-center text-warm-400">
                  <Icon name="Message" size={32} className="mx-auto mb-2 text-purple-200"/>
                  <p className="text-sm">No messages yet</p>
                </div>
              : <div className="divide-y divide-purple-50 max-h-[500px] overflow-y-auto">
                  {tickets.map(t => (
                    <div key={t.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-medium text-warm-900 text-sm">{t.subject}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 capitalize ${STATUS_COLOR(t.status)}`}>{t.status}</span>
                      </div>
                      <p className="text-xs text-warm-500 line-clamp-2">{t.message}</p>
                      {t.admin_reply && (
                        <div className="mt-2 p-2.5 bg-green-50 rounded-lg border-l-2 border-green-400">
                          <p className="text-xs font-semibold text-green-700 mb-1">Admin reply:</p>
                          <p className="text-xs text-green-800">{t.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
          }
        </div>
      </div>
    </VendorLayout>
  );
}
