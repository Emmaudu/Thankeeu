import { useState, useEffect } from 'react';
import VendorLayout from './VendorLayout';
import Icon from '../../components/ui/Icon';
import { vendorAxios, banksAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { asArray } from '../../utils/asArray';

export default function VendorBank() {
  const [banks, setBanks] = useState([]);
  const [bank, setBank] = useState({ bank_code: '', bank_name: '', account_number: '', account_name: '' });
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    banksAPI.getList().then(r => setBanks((asArray(r.data)).slice().sort((a, b) => a.name.localeCompare(b.name)))).catch(() => {});
    vendorAxios.get('/vendor/me').then(r => {
      const bd = r.data.bank_details;
      if (bd) {
        // Defensive: normalise every field to a string in case this is a
        // legacy record saved before bank_code existed, or has a null/
        // non-string value for any field — avoids a crash on .length below.
        setBank({
          bank_code:      bd.bank_code      ? String(bd.bank_code)      : '',
          bank_name:      bd.bank_name      ? String(bd.bank_name)      : '',
          account_number: bd.account_number ? String(bd.account_number) : '',
          account_name:   bd.account_name   ? String(bd.account_name)   : '',
        });
        // A previously-saved account (even one saved before auto-verify existed)
        // is treated as verified so the save button isn't blocked retroactively.
        if (bd.account_number && bd.account_name) setVerified(true);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleBankChange = (e) => {
    const code = e.target.value;
    const selected = banks.find(b => b.code === code);
    setBank(p => ({ ...p, bank_code: code, bank_name: selected?.name || '', account_name: '' }));
    setVerified(false);
  };

  const handleAccountNumberChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
    setBank(p => ({ ...p, account_number: v, account_name: '' }));
    setVerified(false);
  };

  const handleVerify = async () => {
    if (!bank.bank_code) return toast.error('Select your bank first');
    if (bank.account_number.length < 10) return toast.error('Enter a valid 10-digit account number');
    setVerifying(true);
    try {
      // Use vendorAxios (not banksAPI.verify/smartAxios) — smartAxios only
      // attaches user/member tokens and doesn't send credentials, so it can't
      // authenticate a vendor session. vendorAxios sends the tk_vendor cookie
      // and Authorization header that the /banks/verify route now accepts.
      const res = await vendorAxios.post('/banks/verify', { account_number: bank.account_number, bank_code: bank.bank_code });
      setBank(p => ({ ...p, account_name: res.data.account_name }));
      setVerified(true);
      toast.success(`Account verified: ${res.data.account_name} ✓`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not verify account. Check the number and bank.');
      setVerified(false);
    } finally { setVerifying(false); }
  };

  const save = async () => {
    if (!verified) return toast.error('Please verify the account first');
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

          {loading ? (
            <div className="h-40 rounded-xl animate-pulse bg-purple-50" />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Bank *</label>
                <select className="input w-full" value={bank.bank_code} onChange={handleBankChange}>
                  <option value="">Select your bank…</option>
                  {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">Account number *</label>
                <div className="flex gap-2">
                  <input value={bank.account_number} onChange={handleAccountNumberChange}
                    placeholder="10-digit NUBAN" maxLength={10} className="input flex-1"/>
                  <button type="button" onClick={handleVerify}
                    disabled={verifying || bank.account_number.length < 10 || !bank.bank_code}
                    className="px-4 rounded-xl bg-purple-100 text-primary-700 text-sm font-semibold disabled:opacity-50 flex-shrink-0">
                    {verifying ? '⏳' : '✓ Verify'}
                  </button>
                </div>
              </div>

              {bank.account_name && (
                <div className={`rounded-xl p-3 flex items-center gap-2 ${verified ? 'bg-green-50 border border-green-200' : 'bg-warm-100'}`}>
                  <span>{verified ? '✅' : '👤'}</span>
                  <div>
                    <p className="text-sm font-semibold text-warm-900">{bank.account_name}</p>
                    <p className="text-xs text-warm-500">{verified ? 'Account verified ✓' : 'Unverified'}</p>
                  </div>
                </div>
              )}

              <button onClick={save} disabled={saving || !verified}
                className="mt-1 w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
                {saving ? 'Saving...' : 'Save bank details'}
              </button>
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
