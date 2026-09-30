/**
 * BankAccountTab — reusable bank account management for any dashboard
 * Works for individual users (uses `api`) and team members (uses memberAxios).
 */
import { useState, useEffect } from 'react';
import { banksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import Icon from './ui/Icon';
import { asArray } from '../utils/asArray';

const BankAccountTab = ({ compact = false, onSaved = () => {} }) => {
  const [banks,    setBanks]    = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [form, setForm] = useState({
    bank_code: '', bank_name: '', account_number: '', account_name: '',
  });
  const [verified, setVerified] = useState(false);
  const [showAdd, setShowAdd] = useState(compact);

  useEffect(() => {
    banksAPI.getList().then(r => setBanks((asArray(r.data)).slice().sort((a, b) => a.name.localeCompare(b.name)))).catch(() => {});
    banksAPI.getMy().then(r => setAccounts(asArray(r.data))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleBankChange = (e) => {
    const code = e.target.value;
    const bank = banks.find(b => b.code === code);
    setForm(p => ({ ...p, bank_code: code, bank_name: bank?.name || '', account_name: '' }));
    setVerified(false);
  };

  const handleVerify = async () => {
    if (!form.bank_code) return toast.error('Select a bank first');
    if (form.account_number.length < 10) return toast.error('Enter a valid 10-digit account number');
    setVerifying(true);
    try {
      const res = await banksAPI.verify({ account_number: form.account_number, bank_code: form.bank_code });
      setForm(p => ({ ...p, account_name: res.data.account_name }));
      setVerified(true);
      toast.success(`Account verified: ${res.data.account_name} ✓`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed. Check the account number.');
      setVerified(false);
    } finally { setVerifying(false); }
  };

  const handleSave = async () => {
    if (!verified) return toast.error('Please verify the account first');
    setSaving(true);
    try {
      await banksAPI.save(form);
      toast.success('Bank account saved! ✓');
      setForm({ bank_code:'', bank_name:'', account_number:'', account_name:'' });
      setVerified(false);
      setShowAdd(false);
      const res = await banksAPI.getMy();
      setAccounts(asArray(res.data));
      onSaved(asArray(res.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save bank account');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await banksAPI.delete(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
      toast.success('Account removed');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="max-w-xl space-y-4">
      {!compact && (
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-warm-900"><Icon name="Building2" size={16} />Bank accounts</h3>
          <p className="text-xs text-warm-500 mb-4">
            Save your bank account to receive gift pot withdrawals and approved deduction funds directly.
          </p>
        </div>
      )}

      {/* Saved accounts */}
      {loading ? <div className="h-16 rounded-2xl animate-pulse bg-purple-50" /> : (
        accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.id} className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${acc.is_default ? 'border-primary-300 bg-primary-50' : 'border-purple-100 bg-white'}`}>
                <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-primary-600 flex-shrink-0"><Icon name="Building2" size={19} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-900 text-sm">{acc.account_name}</p>
                  <p className="text-xs text-warm-500">{acc.bank_name} · {acc.account_number}</p>
                  {acc.is_default && <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-semibold"><Icon name="Check" size={11} />Default account</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {acc.verified && <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold"><Icon name="CheckCircle" size={12} />Verified</span>}
                  <button type="button" onClick={() => handleDelete(acc.id)} aria-label={`Remove ${acc.bank_name} account`} className="flex h-8 w-8 items-center justify-center rounded-full text-warm-300 transition-colors hover:bg-rose-50 hover:text-rose-500"><Icon name="X" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add account form */}
      {showAdd ? (
        <div className="bg-white rounded-2xl border-2 border-primary-200 p-5 space-y-4">
          <h4 className="font-semibold text-warm-900 text-sm">Add bank account</h4>

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1.5">Bank *</label>
            <select className="input text-sm" value={form.bank_code} onChange={handleBankChange} required>
              <option value="">Select your bank…</option>
              {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1.5">Account number *</label>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="10-digit NUBAN number"
                value={form.account_number} maxLength={10}
                onChange={e => { setForm(p => ({...p, account_number: e.target.value, account_name: ''})); setVerified(false); }} />
              <button type="button" onClick={handleVerify} disabled={verifying || form.account_number.length < 10 || !form.bank_code}
                className="btn-secondary text-xs px-4 py-2 flex-shrink-0 disabled:opacity-50">
                <span className="inline-flex items-center gap-1.5">{verifying ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}{verifying ? 'Verifying' : 'Verify'}</span>
              </button>
            </div>
          </div>

          {form.account_name && (
            <div className={`rounded-xl p-3 flex items-center gap-2 ${verified ? 'bg-green-50 border border-green-200' : 'bg-warm-100'}`}>
              <Icon name={verified ? 'CheckCircle' : 'User'} size={18} className={verified ? 'text-green-600' : 'text-warm-500'} />
              <div>
                <p className="text-sm font-semibold text-warm-900">{form.account_name}</p>
                <p className="text-xs text-warm-500">{verified ? 'Account verified' : 'Unverified'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !verified} className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-5 disabled:opacity-50">
              {saving ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="CheckCircle" size={15} />}{saving ? 'Saving…' : 'Save account'}
            </button>
            {!compact && (
              <button onClick={() => { setShowAdd(false); setVerified(false); }} className="btn-secondary text-sm py-2.5 px-4">Cancel</button>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="btn-secondary inline-flex w-full items-center justify-center gap-2 text-sm py-3">
          <Icon name="Plus" size={15} />Add bank account
        </button>
      )}

      {!compact && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="flex items-start gap-2 text-xs text-amber-700 leading-relaxed">
            <Icon name="Lock" size={14} className="mt-0.5 flex-shrink-0" />
            <span>Bank account verification is powered by Flutterwave. Your details are securely stored and never shared. Withdrawals are processed within 1–2 business days.</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default BankAccountTab;
