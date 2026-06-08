import { useSEO } from '../../hooks/useSEO';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberAPI } from '../../utils/api';
import { useMemberAuth } from '../../context/MemberAuthContext';
import MemberLayout from '../../components/member/MemberLayout';
import toast from 'react-hot-toast';

const MemberSettingsPage = () => {
  useSEO({ title: 'Settings — Thankeeu for Teams', noIndex: true });

  const { member, logout } = useMemberAuth();
  const fileRef = useRef();
  const [avatarPreview, setAvatarPreview] = useState(member?.profile_picture_url || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    phone: member?.phone || '',
  });

  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5*1024*1024) return toast.error('Image must be under 5MB');
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const TABS = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'password', label: '🔒 Password' },
    { id: 'account', label: '⚠️ Account' },
  ];

  const saveProfile = async () => {
    setSaving(true);
    try {
      let profile_picture_url = member?.profile_picture_url;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const r = await fetch(`${import.meta.env.VITE_API_URL||'/api'}/members/upload-avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('thankeeu_member_token')}` },
          body: fd,
        });
        const d = await r.json();
        if (d.url) profile_picture_url = d.url;
      }
      await memberAPI.updateProfile({ ...profile, profile_picture_url });
      toast.success('Profile updated! ✨');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password)
      return toast.error('New passwords do not match');
    if (passwords.new_password.length < 8)
      return toast.error('Password must be at least 8 characters');
    setSaving(true);
    try {
      await memberAPI.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      toast.success('Password changed!');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSaving(false); }
  };

  return (
    <MemberLayout title="Settings" subtitle="Manage your team member account">
      <div className="max-w-2xl">

        {/* Tabs */}
        <div className="flex gap-1 bg-purple-50 p-1 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 ${
                tab === t.id ? 'bg-white text-warm-900 shadow-sm' : 'text-warm-500 hover:text-warm-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 space-y-5">

            {/* Avatar upload */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-primary-100 flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
                  : <span className="text-2xl font-bold text-primary-600">{member?.first_name?.[0]||'?'}</span>
                }
              </div>
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="text-sm font-semibold px-4 py-2 rounded-xl border-2 transition-all"
                  style={{ borderColor:'#DDD8FF', color:'#5B4BDF' }}>
                  📷 Change photo
                </button>
                <p className="text-xs mt-1 text-gray-400">JPG, PNG · max 5MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
            </div>

            {/* Account info */}
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary-800 mb-1">👤 Your account</p>
              <p className="text-xs text-primary-600">
                <strong>Company:</strong> {member?.company?.name} &nbsp;·&nbsp;
                <strong>Department:</strong> {member?.department} &nbsp;·&nbsp;
                <strong>Role:</strong> {member?.role === 'team_leader' ? '👑 Team Leader' : '👤 Team Member'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">First name</label>
                <input className="input" value={profile.first_name}
                  onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Last name</label>
                <input className="input" value={profile.last_name}
                  onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Email address</label>
              <input className="input bg-warm-100 cursor-not-allowed" value={member?.email || ''} disabled />
              <p className="text-xs text-warm-400 mt-1">Email cannot be changed. Contact your HR admin if needed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Phone number</label>
              <input className="input" placeholder="+234 800 000 0000" value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
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
                value={passwords.current_password}
                onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">New password</label>
              <input type="password" className="input" placeholder="At least 8 characters"
                value={passwords.new_password}
                onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Confirm new password</label>
              <input type="password" className="input" placeholder="Repeat new password"
                value={passwords.confirm_password}
                onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))} />
            </div>
            {passwords.new_password && passwords.confirm_password &&
              passwords.new_password !== passwords.confirm_password && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            <button
              onClick={savePassword}
              disabled={saving || !passwords.current_password || !passwords.new_password}
              className="btn-primary w-full py-3 disabled:opacity-50">
              {saving ? 'Changing...' : 'Change password'}
            </button>
          </div>
        )}

        {/* Account tab */}
        {tab === 'account' && (
          <div className="bg-white rounded-3xl border border-purple-100 p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">ℹ️ Account information</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Your account is managed by your company HR admin. To leave the company team or request account changes, contact your HR department.
              </p>
            </div>

            <div className="space-y-3 text-sm text-warm-600">
              <div className="flex items-center justify-between py-3 border-b border-purple-100">
                <span className="text-warm-500">Account status</span>
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">✓ Approved</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-purple-100">
                <span className="text-warm-500">Department</span>
                <span className="font-medium text-warm-800">{member?.department}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-purple-100">
                <span className="text-warm-500">Role</span>
                <span className="font-medium text-warm-800">
                  {member?.role === 'team_leader' ? '👑 Team Leader' : '👤 Team Member'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-warm-500">Company</span>
                <span className="font-medium text-warm-800">{member?.company?.name}</span>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate('/member/login'); }}
              className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors">
              🚪 Sign out of all devices
            </button>
          </div>
        )}
      </div>
    </MemberLayout>
  );
};

export default MemberSettingsPage;
