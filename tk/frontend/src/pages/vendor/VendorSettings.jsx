import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios, vendorAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['cakes','flowers','chocolates','jewellery','hampers','balloons','gift_wrapping','general'];
const COUNTRIES   = ['Nigeria','Ghana','Kenya','South Africa','UK','USA','Canada','Uganda','Tanzania','Rwanda'];

export default function VendorSettings() {
  const [form, setForm] = useState({
    business_name:'', description:'', phone:'', address:'', country:'', state:'',
    logo_url:'', banner_url:'', delivery_info:'', return_policy:'', category:'',
  });
  const [pwd, setPwd] = useState({ current:'', newPwd:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [tab, setTab] = useState('profile');
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  useEffect(() => {
    vendorAxios.get('/vendor/me').then(r => {
      const d = r.data;
      setForm({ business_name:d.business_name||'', description:d.description||'', phone:d.phone||'',
        address:d.address||'', country:d.country||'', state:d.state||'', logo_url:d.logo_url||'',
        banner_url:d.banner_url||'', delivery_info:d.delivery_info||'', return_policy:d.return_policy||'',
        category:d.category||'' });
    }).catch(()=>{});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await vendorAxios.put('/vendor/me', form);
      const stored = JSON.parse(localStorage.getItem('thankeeu_vendor')||'{}');
      localStorage.setItem('thankeeu_vendor', JSON.stringify({...stored, ...form}));
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await vendorAPI.uploadProductImage(file);
      set('logo_url', res.data.url);
      toast.success('Logo uploaded — click Save profile to apply');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingLogo(false); }
  };

  const uploadBanner = async (file) => {
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await vendorAPI.uploadProductImage(file);
      set('banner_url', res.data.url);
      toast.success('Cover photo uploaded — click Save profile to apply');
    } catch { toast.error('Upload failed'); }
    finally { setUploadingBanner(false); }
  };

  const savePassword = async () => {
    if (pwd.newPwd !== pwd.confirm) return toast.error('Passwords do not match');
    if (pwd.newPwd.length < 8) return toast.error('Password must be at least 8 characters');
    setSavingPwd(true);
    try {
      await vendorAxios.put('/vendor/me/password', { current_password: pwd.current, new_password: pwd.newPwd });
      toast.success('Password changed!');
      setPwd({ current:'', newPwd:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setSavingPwd(false); }
  };

  return (
    <VendorLayout title="Settings" subtitle="Manage your store profile and account">
      <div className="flex gap-2 mb-6">
        {[['profile','Store Profile'],['password','Change Password']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab===k ? 'bg-primary-600 text-white' : 'bg-white border border-purple-100 text-warm-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 max-w-2xl">

          {/* Cover banner */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-warm-700 mb-1.5">Storefront cover photo</label>
            <p className="text-xs text-warm-400 mb-2">Shown at the top of your public storefront page</p>
            <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden border border-purple-100"
              style={{ background: form.banner_url ? 'transparent' : 'linear-gradient(135deg,#7C3AED,#EC4899)' }}>
              {form.banner_url && <img src={form.banner_url} className="w-full h-full object-cover" alt="Cover"/>}
              <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-pointer group">
                <span className="hidden group-hover:flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-warm-700 text-sm font-semibold shadow">
                  {uploadingBanner ? 'Uploading...' : <><Icon name="Camera" size={16}/> {form.banner_url ? 'Change cover' : 'Upload cover photo'}</>}
                </span>
                {!form.banner_url && (
                  <span className="flex group-hover:hidden items-center gap-2 px-4 py-2 rounded-xl bg-white/90 text-warm-700 text-sm font-semibold shadow">
                    <Icon name="Camera" size={16}/> Upload cover photo
                  </span>
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingBanner}
                  onChange={e => uploadBanner(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-warm-700 mb-1.5">Store logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-purple-100 overflow-hidden flex items-center justify-center bg-purple-50 flex-shrink-0">
                {form.logo_url
                  ? <img src={form.logo_url} className="w-full h-full object-cover" alt="Logo"/>
                  : <Icon name="Image" size={24} className="text-purple-300"/>}
              </div>
              <label className="px-4 py-2.5 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600 cursor-pointer hover:bg-purple-50 transition-colors">
                {uploadingLogo ? 'Uploading...' : (form.logo_url ? 'Change logo' : 'Upload logo')}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo}
                  onChange={e => uploadLogo(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {k:'business_name', l:'Business name *'},
              {k:'phone', l:'Phone number'},
              {k:'address', l:'Address'},
              {k:'state', l:'State / City'},
            ].map(f=>(
              <div key={f.k}>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">{f.l}</label>
                <input value={form[f.k]} onChange={e=>set(f.k,e.target.value)} className="input w-full"/>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Country</label>
              <select value={form.country} onChange={e=>set('country',e.target.value)} className="input w-full">
                <option value="">Select country</option>
                {COUNTRIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Category</label>
              <select value={form.category} onChange={e=>set('category',e.target.value)} className="input w-full capitalize">
                {CATEGORIES.map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            {[
              {k:'description', l:'Store description'},
              {k:'delivery_info', l:'Delivery info'},
              {k:'return_policy', l:'Return policy'},
            ].map(f=>(
              <div key={f.k} className="sm:col-span-2">
                <label className="block text-sm font-medium text-warm-700 mb-1.5">{f.l}</label>
                <textarea rows={3} value={form[f.k]} onChange={e=>set(f.k,e.target.value)} className="input w-full"/>
              </div>
            ))}
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 max-w-md">
          <div className="space-y-4">
            {[['current','Current password'],['newPwd','New password'],['confirm','Confirm new password']].map(([k,l])=>(
              <div key={k}>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">{l}</label>
                <input type="password" value={pwd[k]} onChange={e=>setPwd(p=>({...p,[k]:e.target.value}))} className="input w-full"/>
              </div>
            ))}
          </div>
          <button onClick={savePassword} disabled={savingPwd}
            className="mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
            {savingPwd ? 'Changing...' : 'Change password'}
          </button>
        </div>
      )}
    </VendorLayout>
  );
}
