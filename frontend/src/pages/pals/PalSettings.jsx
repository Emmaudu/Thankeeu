import { useState, useEffect } from 'react';
import PalLayout from './PalLayout';
import Icon from '../../components/ui/Icon';
import { palAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function PalSettings() {
  const [form, setForm] = useState({ group_name:'', description:'', logo_url:'' });
  const [groupUsername, setGroupUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    palAPI.getSettings().then(r => {
      setForm({ group_name: r.data.group_name||'', description: r.data.description||'', logo_url: r.data.logo_url||'' });
      setGroupUsername(r.data.group_username);
    }).catch(()=>{});
  }, []);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const save = async () => {
    setSaving(true);
    try {
      const res = await palAPI.updateSettings(form);
      const stored = JSON.parse(localStorage.getItem('thankeeu_pal')||'{}');
      localStorage.setItem('thankeeu_pal', JSON.stringify({...stored, group: {...stored.group, ...res.data}}));
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await palAPI.uploadLogo(file);
      set('logo_url', res.data.url);
      toast.success('Logo uploaded — click Save to apply');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <PalLayout title="Settings" subtitle="Manage your group's profile">
      <div className="bg-white rounded-2xl border border-purple-100 p-6 max-w-2xl space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {form.logo_url
              ? <img src={form.logo_url} className="w-full h-full object-cover"/>
              : <Icon name="Users" size={28} className="text-purple-300"/>}
          </div>
          <label className="px-4 py-2 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600 cursor-pointer hover:bg-purple-50">
            {uploading ? 'Uploading...' : 'Change group photo'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={e => uploadLogo(e.target.files?.[0])} />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1.5">Group username</label>
          <input className="input w-full bg-gray-50" value={`@${groupUsername}`} disabled />
          <p className="text-xs text-warm-400 mt-1">Used to log in — cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1.5">Group name</label>
          <input className="input w-full" value={form.group_name} onChange={e=>set('group_name',e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1.5">Description</label>
          <textarea rows={3} className="input w-full" value={form.description} onChange={e=>set('description',e.target.value)} />
        </div>

        <button onClick={save} disabled={saving} className="px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </PalLayout>
  );
}
