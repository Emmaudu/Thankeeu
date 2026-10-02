import { useState, useEffect } from 'react';
import { referralsApi } from '../utils/api';
import { Link2, Copy, Check, Wallet, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferWalletPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slugInput, setSlugInput] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await referralsApi.me();
      setData(res.data);
      setSlugInput(res.data.slug || '');
    } catch { toast.error('Could not load referral data'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const saveSlug = async () => {
    setSavingSlug(true);
    try {
      const res = await referralsApi.setSlug(slugInput);
      toast.success(res.data.message || 'Saved');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save link'); }
    finally { setSavingSlug(false); }
  };

  const link = data?.slug ? `${window.location.origin}/refer/${data.slug}` : '';

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const withdraw = async () => {
    if (!window.confirm('Withdraw your available referral commission to your bank?')) return;
    setWithdrawing(true);
    try {
      const res = await referralsApi.withdraw();
      toast.success(res.data.message || 'Withdrawal initiated');
      await load();
    } catch (err) { toast.error(err.response?.data?.message || 'Withdrawal failed'); }
    finally { setWithdrawing(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );

  const w = data?.wallet || { available: 0, pending: 0, withdrawn: 0 };
  const fmt = (n) => `\u20a6${Number(n || 0).toLocaleString()}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 style={{ fontWeight: 900, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Refer &amp; Earn</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Share your link inviting people to post tasks and get them done. You earn 10% each time a task from someone you referred is completed.
        </p>
      </div>

      {/* Custom link */}
      <div className="card p-5">
        <p style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 12 }}>Your referral link</p>
        {data?.slug ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 12, padding: '12px 14px' }}>
              <Link2 size={16} style={{ color: 'var(--rose)', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, wordBreak: 'break-all' }}>{link}</span>
            </div>
            <button onClick={copyLink} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 18px' }}>
              {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
            </button>
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>Create your custom link below — pick a name people will recognise.</p>
        )}

        {/* Create / edit slug */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{data?.slug ? 'Change your link name' : 'Choose your link name'}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 240, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <span style={{ padding: '11px 6px 11px 14px', color: 'var(--muted)', fontSize: 14, whiteSpace: 'nowrap' }}>taskeeu.com/refer/</span>
              <input
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))}
                placeholder="yourname"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 12px 11px 0', fontSize: 14, fontWeight: 700, color: 'var(--rose)', minWidth: 80 }}
              />
            </div>
            <button onClick={saveSlug} disabled={savingSlug || slugInput.length < 3} className="btn-outline" style={{ padding: '11px 20px' }}>
              {savingSlug ? 'Saving…' : (data?.slug ? 'Update' : 'Create link')}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>3–30 characters: lowercase letters, numbers and hyphens.</p>
        </div>
      </div>

      {/* Wallet balances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
        <div className="card p-5">
          <Wallet size={20} style={{ color: '#00c37e', marginBottom: 8 }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Available</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#00c37e' }}>{fmt(w.available)}</p>
        </div>
        <div className="card p-5">
          <TrendingUp size={20} style={{ color: '#f59e0b', marginBottom: 8 }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{fmt(w.pending)}</p>
        </div>
        <div className="card p-5">
          <Users size={20} style={{ color: 'var(--muted)', marginBottom: 8 }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Withdrawn</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{fmt(w.withdrawn)}</p>
        </div>
      </div>

      <div>
        <button onClick={withdraw} disabled={withdrawing || w.available < 100} className="btn-primary" style={{ padding: '12px 24px' }}>
          {withdrawing ? 'Processing…' : `Withdraw ${fmt(w.available)}`}
        </button>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          Commission becomes available once a referred person&rsquo;s task is completed. Add your bank details in KYC/Profile to withdraw. Minimum &#8358;100.
        </p>
      </div>

      {/* Referred users */}
      <div className="card p-5">
        <p style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 14 }}>
          People you referred ({data?.referred?.length || 0})
        </p>
        {(!data?.referred || data.referred.length === 0) ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No signups yet. Share your link to get started — every person who joins through it shows up here.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {['Name', 'Role', 'Tasks posted', 'Completed', 'Joined'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.referred.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>{r.full_name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--muted)', textTransform: 'capitalize' }}>{r.role}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{r.tasks_posted}</td>
                    <td style={{ padding: '10px 12px', color: r.tasks_completed > 0 ? '#00c37e' : 'var(--muted)', fontWeight: r.tasks_completed > 0 ? 700 : 400 }}>{r.tasks_completed}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{r.joined_at ? new Date(r.joined_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
