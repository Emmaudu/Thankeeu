import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import BankAccountTab from '../../components/BankAccountTab';
import toast from 'react-hot-toast';

export default function DashboardSettings() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const [profile, setProfile] = useState({
    full_name: user?.full_name||'', username: user?.username||'', bio: user?.bio||'',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url||null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [passwords, setPasswords] = useState({ current:'', new_password:'', confirm:'' });

  const handleAvatarChange = e => {
    const f = e.target.files?.[0]; if(!f) return;
    if(f.size > 5*1024*1024) return toast.error('Image must be under 5MB');
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      let avatar_url = user?.avatar_url;
      if (avatarFile) {
        // Upload to Cloudinary via backend
        const fd = new FormData(); fd.append('file', avatarFile);
        const r = await fetch(`${import.meta.env.VITE_API_URL||'/api'}/auth/upload-avatar`, {
          method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('thankeeu_token')}` }, body: fd
        });
        const d = await r.json();
        if (d.url) avatar_url = d.url;
      }
      const res = await authAPI.updateProfile({ ...profile, avatar_url });
      updateUser(res.data);
      toast.success('Profile updated! ✨');
    } catch(err) { toast.error(err.response?.data?.error||'Failed to save'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (passwords.new_password !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.new_password.length < 8) return toast.error('Password must be at least 8 characters');
    setSaving(true);
    try {
      await authAPI.changePassword({ current_password: passwords.current, new_password: passwords.new_password });
      toast.success('Password changed! 🔒');
      setPasswords({ current:'', new_password:'', confirm:'' });
    } catch(err) { toast.error(err.response?.data?.error||'Failed to change password'); }
    finally { setSaving(false); }
  };

  const TABS = [
    { id:'profile', label:'👤 Profile' },
    { id:'bank',    label:'🏦 Bank Account' },
    { id:'password', label:'🔒 Password' },
  ];

  return (
    <DashboardLayout title="Settings ⚙️" subtitle="Manage your account">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{background:'#EDE9FF'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{background:tab===t.id?'#fff':'transparent',color:tab===t.id?'#1A1730':'#7A7898',boxShadow:tab===t.id?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg">
        {tab==='profile' && (
          <div className="dash-card p-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0" style={{background:'linear-gradient(135deg,#7C6EFF,#EC4899)'}}>
                {avatarPreview
                  ? <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl text-white font-bold">{user?.full_name?.[0]||'?'}</div>
                }
              </div>
              <div>
                <button onClick={()=>fileRef.current?.click()} className="text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-all" style={{borderColor:'#DDD8FF',color:'#5B4BDF'}}>
                  📷 Change photo
                </button>
                <p className="text-xs mt-1" style={{color:'#9490C8'}}>JPG, PNG · max 5MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color:'#7A7898'}}>Full name</label>
                <input className="input-light" value={profile.full_name} onChange={e=>setProfile(p=>({...p,full_name:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color:'#7A7898'}}>Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color:'#9490C8'}}>@</span>
                  <input className="input-light pl-7" placeholder="yourname" value={profile.username}
                    onChange={e=>setProfile(p=>({...p,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')}))} />
                </div>
                <p className="text-xs mt-1" style={{color:'#9490C8'}}>Used for card transfers. Only letters, numbers, underscores.</p>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color:'#7A7898'}}>Email</label>
                <input className="input-light" value={user?.email||''} disabled style={{opacity:0.6}} />
                <p className="text-xs mt-1" style={{color:'#9490C8'}}>Email cannot be changed.</p>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color:'#7A7898'}}>Bio (optional)</label>
                <textarea className="input-light resize-none" rows={2} placeholder="A little about you..." value={profile.bio}
                  onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} />
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} className="dash-btn-primary w-full py-3 mt-5">{saving?'Saving...':'Save profile ✨'}</button>
          </div>
        )}

        {tab==='bank'     && <BankAccountTab />}
        {tab==='password' && (
          <div className="dash-card p-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color:'#7A7898'}}>Current password</label>
                <input type="password" className="input-light" value={passwords.current} onChange={e=>setPasswords(p=>({...p,current:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color:'#7A7898'}}>New password</label>
                <input type="password" className="input-light" placeholder="At least 8 characters" value={passwords.new_password} onChange={e=>setPasswords(p=>({...p,new_password:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{color:'#7A7898'}}>Confirm new password</label>
                <input type="password" className="input-light" value={passwords.confirm} onChange={e=>setPasswords(p=>({...p,confirm:e.target.value}))} />
              </div>
              {passwords.new_password && passwords.confirm && passwords.new_password!==passwords.confirm && (
                <p className="text-xs" style={{color:'#ef4444'}}>Passwords do not match</p>
              )}
            </div>
            <button onClick={savePassword} disabled={saving||!passwords.current||!passwords.new_password} className="dash-btn-primary w-full py-3 mt-5 disabled:opacity-50">
              {saving?'Changing...':'Change password 🔒'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
