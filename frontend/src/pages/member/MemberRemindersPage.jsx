import { useState, useEffect } from 'react';
import { memberAPI } from '../../utils/api';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';
import Icon from '../../components/ui/Icon';
import { asArray } from '../../utils/asArray';

const FREQS = [
  { id:'once',label:'Once only'},{id:'yearly',label:'Every year'},{id:'quarterly',label:'Every 3 months'},
  { id:'monthly',label:'Monthly'},{id:'bi-weekly',label:'Every 2 weeks'},{id:'weekly',label:'Weekly'},{id:'daily',label:'Daily'},
];
const OCCASIONS = ['birthday','anniversary','promotion','wedding','graduation','holiday','other'];
const EMPTY = { recipient_name:'',recipient_email:'',occasion:'birthday',occasion_date:'',frequency:'yearly',notes:'' };

export default function MemberRemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Use member-aware reminders API
    memberAPI.getReminders()
      .then(r => setReminders(asArray(r.data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async e => {
    e.preventDefault();
    if (!form.recipient_name || !form.occasion_date) return toast.error('Name and date required');
    setSaving(true);
    try {
      const r = await memberAPI.createReminder(form);
      setReminders(p => [r.data, ...p]);
      setShowForm(false);
      setForm(EMPTY);
      toast.success('Reminder set! 🔔 We\'ll email you 7 days before.');
    } catch(err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this reminder?')) return;
    await memberAPI.deleteReminder(id).catch(() => {});
    setReminders(p => p.filter(r => r.id !== id));
    toast.success('Deleted');
  };

  return (
    <MemberLayout title="Reminders ⏰" subtitle="Never forget an important occasion">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{color:'#7A7898'}}>We'll email you <strong>7 days before</strong> each occasion.</p>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-5 py-2.5">+ New reminder</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{background:'#fff',border:'2px solid #EDE9FF'}}>
            <h3 className="font-bold text-lg mb-4" style={{fontFamily:'Space Grotesk,sans-serif',color:'#1A1730'}}>New Reminder ⏰</h3>
            <form onSubmit={save} className="space-y-3">
              <div><label className="text-xs font-bold block mb-1" style={{color:'#7A7898'}}>Person's name *</label>
                <input className="input" value={form.recipient_name} onChange={e=>setForm(p=>({...p,recipient_name:e.target.value}))} required /></div>
              <div><label className="text-xs font-bold block mb-1" style={{color:'#7A7898'}}>Their email (optional)</label>
                <input type="email" className="input" value={form.recipient_email} onChange={e=>setForm(p=>({...p,recipient_email:e.target.value}))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold block mb-1" style={{color:'#7A7898'}}>Occasion *</label>
                  <select className="input" value={form.occasion} onChange={e=>setForm(p=>({...p,occasion:e.target.value}))}>
                    {OCCASIONS.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}</select></div>
                <div><label className="text-xs font-bold block mb-1" style={{color:'#7A7898'}}>Date *</label>
                  <input type="date" className="input" value={form.occasion_date} onChange={e=>setForm(p=>({...p,occasion_date:e.target.value}))} required /></div>
              </div>
              <div><label className="text-xs font-bold block mb-1" style={{color:'#7A7898'}}>Frequency</label>
                <select className="input" value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                  {FREQS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 text-sm font-bold" style={{borderColor:'#DDD8FF',color:'#5B4BDF'}}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 text-sm">{saving?'Saving...':'Save reminder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-20 rounded-2xl animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      : reminders.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{background:'#fff',border:'2px dashed #EDE9FF'}}>
          <div className="text-5xl mb-3">⏰</div>
          <p className="font-bold text-lg mb-2" style={{color:'#1A1730'}}>No reminders yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-6 py-2.5">+ Add first reminder</button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(r => (
            <div key={r.id} className="rounded-2xl border-2 p-4 flex items-center gap-4" style={{background:'#fff',borderColor:'#EDE9FF'}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0" style={{background:'rgba(124,110,255,0.1)'}}>
                <Icon name={r.occasion === 'birthday' ? 'Cake' : r.occasion === 'anniversary' ? 'Heart' : 'Clock'} size={21} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm" style={{color:'#1A1730'}}>{r.recipient_name}</p>
                <p className="text-xs mt-0.5" style={{color:'#7A7898'}}>
                  {r.occasion} · {new Date(r.occasion_date).toLocaleDateString('en-GB',{day:'numeric',month:'long'})} · {FREQS.find(f=>f.id===r.frequency)?.label}
                </p>
              </div>
              <button type="button" onClick={() => del(r.id)} aria-label={`Delete reminder for ${r.recipient_name}`} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-red-50" style={{color:'#ef4444'}}><Icon name="Trash2" size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
