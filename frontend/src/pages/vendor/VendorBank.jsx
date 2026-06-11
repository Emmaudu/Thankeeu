import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios } from '../../utils/api';
import toast from 'react-hot-toast';

export default function VendorBank() {
  const [bank, setBank] = useState({ bank_name:'', account_number:'', account_name:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    vendorAxios.get('/vendor/me').then(r => {
      if (r.data.bank_details) setBank(r.data.bank_details);
    }).catch(()=>{});
  }, []);

  const save = async () => {
    if (!bank.bank_name||!bank.account_number||!bank.account_name) return toast.error('All fields required');
    setSaving(true);
    try {
      await vendorAxios.put('/vendor/me', { bank_details: bank });
      toast.success('Bank account saved!');
    } catch { toast.error('Failed to save bank details'); }
    finally { setSaving(false); }
  };

  return (
    <VendorLayout title="Bank Account" subtitle="Where Thankeeu sends your payouts">
      <div className="max-w-md">
        <div className="bg-white rounded-2xl border border-purple-100 p-6 mb-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 mb-5">
            <Icon name="AlertCircle" size={18} className="text-amber-500 flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-amber-700">Thankeeu keeps ₦5,000 per order as a platform fee. The remaining amount is paid to this bank account after delivery confirmation.</p>
          </div>
          <div className="space-y-4">
            {[
              { k:'bank_name', l:'Bank name', placeholder:'e.g. First Bank Nigeria' },
              { k:'account_number', l:'Account number', placeholder:'10-digit NUBAN' },
              { k:'account_name', l:'Account name', placeholder:'Name on the account' },
            ].map(f=>(
              <div key={f.k}>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">{f.l}</label>
                <input value={bank[f.k]} onChange={e=>setBank(p=>({...p,[f.k]:e.target.value}))}
                  placeholder={f.placeholder} className="input w-full"/>
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving}
            className="mt-5 w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : 'Save bank details'}
          </button>
        </div>
      </div>
    </VendorLayout>
  );
}
