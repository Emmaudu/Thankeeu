import { useSEO } from '../../hooks/useSEO';
import { useState, useEffect, useRef } from 'react';
import { useCompanyAuth } from '../../context/CompanyAuthContext';
import { companyAPI, hrisAPI } from '../../utils/api';
import CompanyLayout from '../../components/company/CompanyLayout';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  useSEO({ title: 'Settings — Thankeeu for Teams', noIndex: true });

  const { company, updateCompany } = useCompanyAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchForm, setBranchForm] = useState({ name: '', city: '', state: '', is_default: false });
  const [savingBranch, setSavingBranch] = useState(false);

  const fileRef = useRef();

  useEffect(() => {
    hrisAPI.getBranches().then(r => setBranches(r.data || [])).catch(() => {});
  }, []);

  const [profile, setProfile] = useState({
    name: company?.name || '',
    contact_person: company?.contact_person || '',
    phone: company?.phone || '',
    industry: company?.industry || '',
    logo_url: company?.logo_url || '',
    theme: company?.theme || 'light',
  });

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await companyAPI.updateProfile(profile);
      updateCompany(res.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password)
      return toast.error('New passwords do not match');
    if (passwords.new_password.length < 8)
      return toast.error('Password must be at least 8 characters');
    setSaving(true);
    try {
      await companyAPI.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      toast.success('Password changed!');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const TABS = [
    { id: 'profile',  label: '🏢 Profile', },
    { id: 'branches', label: '📍 Branches', },
    { id: 'password', label: '🔒 Password', },
    { id: 'theme',    label: '🎨 Theme', },
  ];

  return (
    <CompanyLayout title="Settings" subtitle="Manage your company account preferences">
      <div className="max-w-2xl">

        {/* Tabs */}
        <div className="flex gap-1 bg-purple-50 p-1 rounded-xl mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 ${
                tab === t.id ? 'bg-white text-primary-700 shadow-sm font-bold border border-purple-100' : 'text-warm-500 hover:text-warm-800'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 space-y-5">
            {/* Company code for sharing */}
            <div className="bg-primary-50 border border-primary-100 rounded-3xl p-4">
              <p className="text-sm font-semibold text-primary-800 mb-1">🔑 Your company code</p>
              <p className="text-xs text-primary-600 mb-3">Share this with employees so they can join at <strong>/member/signup</strong></p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white text-primary-700 border border-primary-200 px-3 py-2 rounded-xl text-xs font-mono break-all select-all">{company?.id}</code>
                <button onClick={() => { navigator.clipboard.writeText(company?.id || ''); toast.success('Code copied!'); }}
                  className="bg-primary-400 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-primary-600 transition-colors whitespace-nowrap flex-shrink-0">
                  Copy
                </button>
              </div>
            </div>


            {/* Logo upload */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.logo_url
                  ? <img src={profile.logo_url} alt="logo" className="w-full h-full object-cover" />
                  : <span className="text-primary-600 font-bold text-xl">{company?.name?.[0]}</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-warm-900">Company logo</p>
                <p className="text-xs text-warm-400 mb-2">Recommended: 200×200px, PNG or JPG</p>
                <button onClick={() => fileRef.current.click()}
                  className="text-xs bg-purple-50 text-warm-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  Upload logo
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={async e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    // Show local preview immediately
                    const localUrl = URL.createObjectURL(file);
                    setProfile(p => ({ ...p, logo_url: localUrl }));
                    // Upload to Cloudinary via backend
                    try {
                      const fd = new FormData();
                      fd.append('logo', file);
                      const base = import.meta.env.VITE_API_URL || '/api';
                      const tok  = localStorage.getItem('thankeeu_company_token');
                      const r = await fetch(`${base}/company/upload-logo`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${tok}` },
                        body: fd,
                      });
                      const d = await r.json();
                      if (!r.ok) throw new Error(d.error || 'Upload failed');
                      setProfile(p => ({ ...p, logo_url: d.logo_url }));
                      // Update context immediately so sidebar reflects new logo without needing Save
                      updateCompany({ logo_url: d.logo_url });
                      toast.success('Logo updated! ✓');
                    } catch (err) {
                      toast.error(err.message || 'Logo upload failed. Check Cloudinary settings.');
                      setProfile(p => ({ ...p, logo_url: '' }));
                    }
                  }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Company name</label>
              <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Contact person (HR manager)</label>
              <input className="input" value={profile.contact_person} onChange={e => setProfile(p => ({ ...p, contact_person: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Phone number</label>
                <input className="input" placeholder="+234 800 000 0000" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Industry</label>
                <input className="input" placeholder="e.g. Technology" value={profile.industry} onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Company email</label>
              <input className="input bg-warm-100" value={company?.email || ''} disabled />
              <p className="text-xs text-warm-400 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Current password</label>
              <input type="password" className="input" placeholder="Your current password"
                value={passwords.current_password} onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">New password</label>
              <input type="password" className="input" placeholder="At least 8 characters"
                value={passwords.new_password} onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Confirm new password</label>
              <input type="password" className="input" placeholder="Repeat new password"
                value={passwords.confirm_password} onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))} />
            </div>
            {passwords.new_password && passwords.confirm_password && passwords.new_password !== passwords.confirm_password && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            <button onClick={savePassword} disabled={saving || !passwords.current_password || !passwords.new_password}
              className="btn-primary w-full py-3 disabled:opacity-50">
              {saving ? 'Changing...' : 'Change password'}
            </button>
          </div>
        )}

        {/* Branches tab */}
        {tab === 'branches' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6">
            <p className="text-sm text-warm-500 mb-5 leading-relaxed">
              Add your company's office locations and branches. Employees can be assigned to a branch during signup or HRIS sync.
            </p>
            {/* Existing branches */}
            {branches.length > 0 && (
              <div className="space-y-2 mb-5">
                {branches.map(b => (
                  <div key={b.id} className="flex items-center justify-between bg-warm-100 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-warm-900">{b.name}</p>
                      {(b.city || b.state) && <p className="text-xs text-warm-400 mt-0.5">{[b.city, b.state].filter(Boolean).join(', ')}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {b.is_default && <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Default</span>}
                      <button onClick={async () => {
                        try {
                          await hrisAPI.deleteBranch(b.id);
                          setBranches(prev => prev.filter(br => br.id !== b.id));
                          toast.success('Branch removed');
                        } catch { toast.error('Failed to remove branch'); }
                      }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Add new branch */}
            <div className="border-t border-purple-100 pt-5">
              <p className="text-sm font-medium text-warm-700 mb-3">Add a new branch</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-warm-700 mb-1">Branch name *</label>
                  <input className="input" placeholder="e.g. Ikeja Branch, Lekki Office, HQ Abuja"
                    value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-warm-700 mb-1">City</label>
                    <input className="input" placeholder="e.g. Lagos"
                      value={branchForm.city} onChange={e => setBranchForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-700 mb-1">State</label>
                    <input className="input" placeholder="e.g. Lagos State"
                      value={branchForm.state} onChange={e => setBranchForm(p => ({ ...p, state: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isDefault" checked={branchForm.is_default} onChange={e => setBranchForm(p => ({ ...p, is_default: e.target.checked }))} className="w-4 h-4 accent-primary-400" />
                  <label htmlFor="isDefault" className="text-sm text-warm-700">Set as default branch</label>
                </div>
                <button disabled={savingBranch || !branchForm.name.trim()} onClick={async () => {
                  setSavingBranch(true);
                  try {
                    const r = await hrisAPI.saveBranch(branchForm);
                    setBranches(prev => [...prev, r.data]);
                    setBranchForm({ name: '', city: '', state: '', is_default: false });
                    toast.success('Branch added!');
                  } catch (err) { toast.error(err.response?.data?.error || 'Failed to add branch'); }
                  finally { setSavingBranch(false); }
                }} className="btn-primary w-full py-2.5 disabled:opacity-50">
                  {savingBranch ? 'Adding...' : '+ Add branch'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Theme tab */}
        {tab === 'theme' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6">
            <p className="text-sm font-medium text-warm-700 mb-4">Dashboard theme</p>
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { id: 'light', label: 'Light', icon: '☀️', desc: 'Clean white background', preview: 'bg-white border-2' },
                { id: 'dark', label: 'Dark', icon: '🌙', desc: 'Dark mode (coming soon)', preview: 'bg-gray-900', disabled: true },
              ].map(t => (
                <button key={t.id} onClick={() => !t.disabled && setProfile(p => ({ ...p, theme: t.id }))}
                  disabled={t.disabled}
                  className={`rounded-3xl p-4 text-left border-2 transition-all ${
                    profile.theme === t.id ? 'border-primary-400 bg-primary-50' : 'border-purple-100 hover:border-purple-200'
                  } ${t.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`w-full h-16 rounded-xl mb-3 ${t.preview} ${profile.theme === t.id && !t.disabled ? 'border-primary-200' : 'border-purple-100'}`} />
                  <div className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-warm-900">{t.label}</p>
                      <p className="text-xs text-warm-400">{t.desc}</p>
                    </div>
                    {profile.theme === t.id && !t.disabled && <span className="ml-auto text-primary-400 font-bold">✓</span>}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary w-full py-3">
              {saving ? 'Saving...' : 'Save theme preference'}
            </button>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default SettingsPage;
