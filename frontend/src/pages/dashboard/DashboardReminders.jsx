import { useState, useEffect } from 'react';
import { remindersAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OCCASIONS = ['birthday','anniversary','wedding','graduation','promotion','holiday','other'];
const FREQS = [
  { id:'once', label:'Once only' },
  { id:'yearly', label:'Every year' },
  { id:'quarterly', label:'Every 3 months' },
  { id:'monthly', label:'Every month' },
  { id:'bi-weekly', label:'Every 2 weeks' },
  { id:'weekly', label:'Every week' },
  { id:'daily', label:'Every day' },
];
const freqLabel = id => FREQS.find(f=>f.id===id)?.label||id;

const EMPTY = { recipient_name:'', recipient_email:'', occasion:'birthday', occasion_date:'', frequency:'yearly', notes:'' };

export default function DashboardReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    remindersAPI.getAll().then(r=>setReminders(r.data||[])).finally(()=>setLoading(false));
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = r => { setForm({ recipient_name:r.recipient_name, recipient_email:r.recipient_email||'', occasion:r.occasion, occasion_date:r.occasion_date, frequency:r.frequency, notes:r.notes||'' }); setEditing(r.id); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.recipient_name || !form.occasion_date) return toast.error('Name and date are required');
    setSaving(true);
    try {
      if (editing) {
        const r = await remindersAPI.update(editing, form); setReminders(prev=>prev.map(x=>x.id===editing?r.data:x));
        toast.success('Reminder updated!');
      } else {
        const r = await remindersAPI.create(form); setReminders(prev=>[r.data,...prev]);
        toast.success('Reminder set! 🔔 We\'ll email you 7 days before.');
      }
      setShowForm(false);
    } catch(err) { toast.error(err.response?.data?.error||'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Delete this reminder?')) return;
    try { await remindersAPI.delete(id); setReminders(prev=>prev.filter(r=>r.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async r => {
    try {
      const updated = await remindersAPI.update(r.id, { ...r, is_active: !r.is_active });
      setReminders(prev=>prev.map(x=>x.id===r.id?updated.data:x));
    } catch { toast.error('Failed to update'); }
  };

  return (
    <DashboardLayout title="Reminders ⏰" subtitle="Never forget an important occasion">

      {/* CTA */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{color:'#7A7898'}}>We'll email you <strong>7 days before</strong> each occasion.</p>
        <button onClick={openNew} className="btn-primary text-sm px-5 py-2.5">+ New reminder</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{background:'#fff',border:'2px solid #EDE9FF'}}>
            <h3 className="font-bold text-lg mb-4" style={{fontFamily:'Space Grotesk,sans-serif',color:'#1A1730'}}>{editing?'Edit':'New'} Reminder ⏰</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{color:'#7A7898'}}>Person's name *</label>
                <input className="input-light" placeholder="e.g. Mum" value={form.recipient_name} onChange={e=>setForm(p=>({...p,recipient_name:e.target.value}))} required />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{color:'#7A7898'}}>Their email (optional — we'll also remind via dashboard)</label>
                <input type="email" className="input-light" placeholder="mum@example.com" value={form.recipient_email} onChange={e=>setForm(p=>({...p,recipient_email:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{color:'#7A7898'}}>Occasion *</label>
                  <select className="input-light" value={form.occasion} onChange={e=>setForm(p=>({...p,occasion:e.target.value}))}>
                    {OCCASIONS.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{color:'#7A7898'}}>Date *</label>
                  <input type="date" className="input-light" value={form.occasion_date} onChange={e=>setForm(p=>({...p,occasion_date:e.target.value}))} required />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{color:'#7A7898'}}>Reminder frequency</label>
                <select className="input-light" value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                  {FREQS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{color:'#7A7898'}}>Notes (optional)</label>
                <textarea className="input-light resize-none" rows={2} placeholder="e.g. Likes chocolate cake, usually home by 6pm" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold" style={{borderColor:'#DDD8FF',color:'#5B4BDF'}}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 text-sm">{saving?'Saving...':'Save reminder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="rounded-2xl h-20 animate-pulse" style={{background:'#EDE9FF'}}/>)}</div>
      ) : reminders.length===0 ? (
        <div className="text-center py-16 rounded-2xl" style={{background:'#fff',border:'2px dashed #EDE9FF'}}>
          <div className="text-5xl mb-3">⏰</div>
          <p className="font-semibold mb-2" style={{color:'#1A1730'}}>No reminders yet</p>
          <p className="text-sm mb-4" style={{color:'#7A7898'}}>Add important people and we'll remind you 7 days before.</p>
          <button onClick={openNew} className="btn-primary text-sm px-6 py-2.5">+ Add first reminder</button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(r=>(
            <div key={r.id} className="rounded-2xl border-2 p-4 flex items-center gap-4 transition-all"
              style={{background:'#fff',borderColor: r.is_active?'#EDE9FF':'#f3f4f6',opacity:r.is_active?1:0.6}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{background:r.is_active?'rgba(124,110,255,0.1)':'#f3f4f6'}}>
                {r.occasion==='birthday'?'🎂':r.occasion==='anniversary'?'💍':r.occasion==='wedding'?'💒':r.occasion==='graduation'?'🎓':'⏰'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{color:'#1A1730'}}>{r.recipient_name}</p>
                <p className="text-xs mt-0.5" style={{color:'#7A7898'}}>
                  {r.occasion.charAt(0).toUpperCase()+r.occasion.slice(1)} · {format(new Date(r.occasion_date),'MMMM d')} · {freqLabel(r.frequency)}
                </p>
                {r.next_remind_at && (
                  <p className="text-xs mt-0.5" style={{color:'#7C6EFF'}}>
                    Next reminder: {format(new Date(r.next_remind_at),'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={()=>handleToggle(r)} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{background:r.is_active?'#dcfce7':'#f3f4f6',color:r.is_active?'#166534':'#6b7280'}}>
                  {r.is_active?'Active':'Paused'}
                </button>
                <button onClick={()=>openEdit(r)} className="text-xs px-2.5 py-1 rounded-xl hover:bg-purple-50" style={{color:'#5B4BDF'}}>Edit</button>
                <button onClick={()=>handleDelete(r.id)} className="text-xs px-2 py-1 rounded-xl hover:bg-red-50" style={{color:'#ef4444'}}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
