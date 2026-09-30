import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import DashboardLayout from '../../components/DashboardLayout';
import BankAccountTab from '../../components/BankAccountTab';
import Icon from '../../components/ui/Icon';
import toast from 'react-hot-toast';

const TABS = [{id:'profile',icon:'User',label:'Profile'},{id:'bank',icon:'CreditCard',label:'Bank Account'},{id:'password',icon:'Lock',label:'Password'}];

export default function DashboardSettings() {
  const { user, updateUser } = useAuth();
  const [tab,    setTab]    = useState('profile');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const [profile,       setProfile]       = useState({ full_name:user?.full_name||'', username:user?.username||'', bio:user?.bio||'' });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url||null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [passwords,     setPasswords]     = useState({ current:'', new_password:'', confirm:'' });

  const handleAvatarChange = e => {
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>5*1024*1024) return toast.error('Image must be under 5MB');
    setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      let avatar_url = user?.avatar_url;
      if (avatarFile) {
        const fd=new FormData(); fd.append('file',avatarFile);
        const r=await fetch(`${import.meta.env.VITE_API_URL||'/api'}/auth/upload-avatar`,{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('thankeeu_token')}`},body:fd});
        const d=await r.json(); if(d.url) avatar_url=d.url;
      }
      const res=await authAPI.updateProfile({...profile,avatar_url}); updateUser(res.data); toast.success('Profile updated!');
    } catch(err) { toast.error(err.response?.data?.error||'Failed to save'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if(passwords.new_password!==passwords.confirm) return toast.error('Passwords do not match');
    if(passwords.new_password.length<8) return toast.error('Password must be at least 8 characters');
    setSaving(true);
    try { await authAPI.changePassword({current_password:passwords.current,new_password:passwords.new_password}); toast.success('Password changed!'); setPasswords({current:'',new_password:'',confirm:''}); }
    catch(err) { toast.error(err.response?.data?.error||'Failed to change password'); }
    finally { setSaving(false); }
  };

  const initials = user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'?';

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account">
      <div className="db-tab-bar">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`db-tab ${tab===t.id?'active':''}`}>
            <Icon name={t.icon} size={14} className="inline mr-1.5"/>{t.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg">

        {/* ── Profile ── */}
        {tab==='profile' && (
          <div className="rounded-2xl p-6 border-2" style={{background:'#fff',borderColor:'#EDE9FE'}}>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0" style={{background:'linear-gradient(135deg,#7C3AED,#EC4899)'}}>
                {avatarPreview
                  ? <img src={avatarPreview} className="w-full h-full object-cover" alt=""/>
                  : <div className="w-full h-full flex items-center justify-center text-3xl text-white font-bold">{initials}</div>}
              </div>
              <div>
                <button onClick={()=>fileRef.current?.click()} className="text-sm font-bold px-4 py-2 rounded-xl border-2 transition-all" style={{borderColor:'#DDD6FE',color:'#6D28D9',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                  <Icon name="Camera" size={14} className="inline mr-1.5"/>Change photo
                </button>
                <p className="text-xs mt-1" style={{color:'#A898CC',fontFamily:'Plus Jakarta Sans,sans-serif'}}>JPG, PNG · max 5MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="auth-label">Full name</label>
                <input className="input-light" value={profile.full_name} onChange={e=>setProfile(p=>({...p,full_name:e.target.value}))}/>
              </div>
              <div>
                <label className="auth-label">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{color:'#A898CC'}}>@</span>
                  <input className="input-light pl-7" placeholder="yourname" value={profile.username}
                    onChange={e=>setProfile(p=>({...p,username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')}))}/>
                </div>
                <p className="text-xs mt-1" style={{color:'#A898CC',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Only letters, numbers, underscores.</p>
              </div>
              <div>
                <label className="auth-label">Email</label>
                <input className="input-light" value={user?.email||''} disabled style={{opacity:0.55}}/>
                <p className="text-xs mt-1" style={{color:'#A898CC',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Email cannot be changed.</p>
              </div>
              <div>
                <label className="auth-label">Bio (optional)</label>
                <textarea className="input-light resize-none" rows={2} placeholder="A little about you…" value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}/>
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary w-full py-3.5 mt-5 text-sm">
              {saving?'Saving…':'Save profile'}
            </button>
          </div>
        )}

        {tab==='bank' && <BankAccountTab/>}

        {/* ── Password ── */}
        {tab==='password' && (
          <div className="rounded-2xl p-6 border-2" style={{background:'#fff',borderColor:'#EDE9FE'}}>
            <div className="space-y-4">
              {[{k:'current',label:'Current password',ph:''},{k:'new_password',label:'New password',ph:'At least 8 characters'},{k:'confirm',label:'Confirm new password',ph:''}].map(f=>(
                <div key={f.k}>
                  <label className="auth-label">{f.label}</label>
                  <input type="password" className="input-light" placeholder={f.ph} value={passwords[f.k]} onChange={e=>setPasswords(p=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
              {passwords.new_password&&passwords.confirm&&passwords.new_password!==passwords.confirm && (
                <p className="text-xs font-semibold" style={{color:'#DC2626',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Passwords do not match</p>
              )}
            </div>
            <button onClick={savePassword} disabled={saving||!passwords.current||!passwords.new_password} className="btn-primary w-full py-3.5 mt-5 text-sm disabled:opacity-50">
              {saving?'Changing…':'Change password'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
