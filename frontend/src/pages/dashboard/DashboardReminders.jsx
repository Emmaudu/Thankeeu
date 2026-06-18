import { useState, useEffect } from 'react';
import { remindersAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import Icon from '../../components/ui/Icon';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const OCCASIONS = ['birthday','anniversary','wedding','graduation','promotion','holiday','other'];
const FREQS = [
  {id:'once',label:'Once only'},{id:'yearly',label:'Every year'},{id:'quarterly',label:'Every 3 months'},
  {id:'monthly',label:'Every month'},{id:'bi-weekly',label:'Every 2 weeks'},{id:'weekly',label:'Every week'},{id:'daily',label:'Every day'},
];
const freqLabel = id => FREQS.find(f=>f.id===id)?.label||id;
const OCC_EMOJI = {birthday:'🎂',anniversary:'💍',wedding:'💒',graduation:'🎓',promotion:'🌟',holiday:'🎄',other:'⏰'};
const EMPTY = {recipient_name:'',recipient_email:'',occasion:'birthday',occasion_date:'',frequency:'yearly',notes:''};

export default function DashboardReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { remindersAPI.getAll().then(r=>setReminders(r.data||[])).finally(()=>setLoading(false)); }, []);

  const openNew  = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = r  => { setForm({recipient_name:r.recipient_name,recipient_email:r.recipient_email||'',occasion:r.occasion,occasion_date:r.occasion_date,frequency:r.frequency,notes:r.notes||''}); setEditing(r.id); setShowForm(true); };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.recipient_name||!form.occasion_date) return toast.error('Name and date are required');
    setSaving(true);
    try {
      if (editing) { const r=await remindersAPI.update(editing,form); setReminders(p=>p.map(x=>x.id===editing?r.data:x)); toast.success('Reminder updated!'); }
      else { const r=await remindersAPI.create(form); setReminders(p=>[r.data,...p]); toast.success("Reminder set! We'll email you 7 days before."); }
      setShowForm(false);
    } catch(err) { toast.error(err.response?.data?.error||'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Delete this reminder?')) return;
    try { await remindersAPI.delete(id); setReminders(p=>p.filter(r=>r.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async r => {
    try { const u=await remindersAPI.update(r.id,{...r,is_active:!r.is_active}); setReminders(p=>p.map(x=>x.id===r.id?u.data:x)); }
    catch { toast.error('Failed'); }
  };

  return (
    <DashboardLayout title="Reminders" subtitle="Never forget an important occasion">
      <div className="flex items-center justify-between mb-5">
        <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:'0.9375rem',color:'#7A6CA8'}}>
          We'll email you <strong style={{color:'#1A1035'}}>7 days before</strong> each occasion.
        </p>
        <button onClick={openNew} className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-1.5">
          <Icon name="Plus" size={14}/>New reminder
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{background:'rgba(26,16,53,0.6)',backdropFilter:'blur(6px)'}}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{background:'#fff',border:'1.5px solid #EDE9FE'}}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:'1.25rem',color:'#1A1035',margin:0}}>{editing?'Edit':'New'} reminder</h3>
              <button onClick={()=>setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-purple-50"><Icon name="X" size={16} className="text-warm-400"/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="auth-label">Person's name *</label>
                <input className="input-light" placeholder="e.g. Mum" value={form.recipient_name} onChange={e=>setForm(p=>({...p,recipient_name:e.target.value}))} required/>
              </div>
              <div>
                <label className="auth-label">Their email (optional)</label>
                <input type="email" className="input-light" placeholder="mum@example.com" value={form.recipient_email} onChange={e=>setForm(p=>({...p,recipient_email:e.target.value}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="auth-label">Occasion *</label>
                  <select className="input-light" value={form.occasion} onChange={e=>setForm(p=>({...p,occasion:e.target.value}))}>
                    {OCCASIONS.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="auth-label">Date *</label>
                  <input type="date" className="input-light" value={form.occasion_date} onChange={e=>setForm(p=>({...p,occasion_date:e.target.value}))} required/>
                </div>
              </div>
              <div>
                <label className="auth-label">Frequency</label>
                <select className="input-light" value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                  {FREQS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="auth-label">Notes (optional)</label>
                <textarea className="input-light resize-none" rows={2} placeholder="e.g. Likes chocolate cake" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all" style={{borderColor:'#DDD6FE',color:'#6D28D9',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 text-sm">{saving?'Saving…':'Save reminder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="rounded-2xl h-20 animate-pulse" style={{background:'#EDE9FE'}}/>)}</div>
      ) : reminders.length===0 ? (
        <div className="db-empty">
          <div className="db-empty-icon"><Icon name="Bell" size={28} className="text-primary-400"/></div>
          <p className="db-empty-title">No reminders yet</p>
          <p className="db-empty-body">Add important people and we'll remind you 7 days before their special day.</p>
          <button onClick={openNew} className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-1.5"><Icon name="Plus" size={14}/>Add first reminder</button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map(r=>(
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all" style={{background:'#fff',borderColor:r.is_active?'#EDE9FE':'#F3F4F6',opacity:r.is_active?1:0.65}}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:r.is_active?'#F5F0FF':'#F3F4F6'}}>
                {OCC_EMOJI[r.occasion]||'⏰'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="db-card-item-title">{r.recipient_name}</p>
                <p className="db-card-item-meta">{r.occasion.charAt(0).toUpperCase()+r.occasion.slice(1)} · {format(new Date(r.occasion_date),'MMMM d')} · {freqLabel(r.frequency)}</p>
                {r.next_remind_at && <p style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:'0.8rem',color:'#7C3AED',fontWeight:600}}>Next: {format(new Date(r.next_remind_at),'MMM d, yyyy')}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={()=>handleToggle(r)} className="text-xs px-2.5 py-1 rounded-full font-bold" style={{background:r.is_active?'#DCFCE7':'#F3F4F6',color:r.is_active?'#166534':'#6B7280',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                  {r.is_active?'Active':'Paused'}
                </button>
                <button onClick={()=>openEdit(r)} className="text-xs px-2.5 py-1 rounded-xl font-bold hover:bg-purple-50 transition-colors" style={{color:'#6D28D9',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Edit</button>
                <button onClick={()=>handleDelete(r.id)} className="text-xs px-2 py-1 rounded-xl hover:bg-red-50 transition-colors" style={{color:'#DC2626'}}>
                  <Icon name="Trash" size={13}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
