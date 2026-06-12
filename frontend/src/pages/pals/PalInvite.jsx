import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PalLayout from './PalLayout';
import Icon from '../../components/ui/Icon';
import { palAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const BLANK = { name:'', email:'', department:'', role:'', birth_date:'', resignation_date:'', graduation_date:'', milestone_date:'', promotion_date:'' };

export default function PalInvite() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('manual'); // manual | csv
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submitManual = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email are required');
    setSubmitting(true);
    try {
      const res = await palAPI.inviteMember(form);
      toast.success(res.data.message);
      setForm(BLANK);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to invite');
    } finally { setSubmitting(false); }
  };

  const submitCSV = async () => {
    if (!csvFile) return toast.error('Please select a CSV or Excel file');
    setCsvUploading(true);
    try {
      const res = await palAPI.inviteCSV(csvFile);
      setCsvResult(res.data);
      toast.success(res.data.message);
      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.error || 'CSV import failed');
    } finally { setCsvUploading(false); }
  };

  return (
    <PalLayout title="Invite Friends" subtitle="Add up to your group's member cap">
      <div className="flex gap-2 mb-6">
        {[['manual','✍️ Add manually'],['csv','📄 CSV upload']].map(([k,l]) => (
          <button key={k} onClick={() => setMode(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode===k ? 'bg-primary-600 text-white' : 'bg-white border border-purple-100 text-warm-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {mode === 'manual' && (
        <form onSubmit={submitManual} className="bg-white rounded-2xl border border-purple-100 p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Full name *</label>
              <input className="input w-full" value={form.name} onChange={e=>set('name',e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Email *</label>
              <input type="email" className="input w-full" value={form.email} onChange={e=>set('email',e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Department</label>
              <input className="input w-full" placeholder="optional" value={form.department} onChange={e=>set('department',e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Role</label>
              <input className="input w-full" placeholder="optional" value={form.role} onChange={e=>set('role',e.target.value)} />
            </div>
          </div>

          <div className="border-t border-purple-50 pt-4">
            <p className="text-sm font-semibold text-warm-700 mb-1">Birthday</p>
            <p className="text-xs text-warm-400 mb-2">Used to auto-create their birthday card every year</p>
            <input type="date" className="input w-full sm:w-1/2" value={form.birth_date} onChange={e=>set('birth_date',e.target.value)} />
          </div>

          <div className="border-t border-purple-50 pt-4">
            <p className="text-sm font-semibold text-warm-700 mb-1">Other events (optional — can be added later)</p>
            <p className="text-xs text-warm-400 mb-3">Resignation, graduation, milestone, and promotion dates can be left empty and updated anytime from the member's profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {k:'resignation_date', l:'Resignation date'},
                {k:'graduation_date', l:'Graduation date'},
                {k:'milestone_date', l:'Milestone date'},
                {k:'promotion_date', l:'Promotion date'},
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-warm-600 mb-1.5">{f.l}</label>
                  <input type="date" className="input w-full" value={form[f.k]} onChange={e=>set(f.k,e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
            {submitting ? 'Sending invite...' : 'Send invite'}
          </button>
        </form>
      )}

      {mode === 'csv' && (
        <div className="bg-white rounded-2xl border border-purple-100 p-6 max-w-2xl">
          <p className="text-sm text-warm-600 mb-4">
            Upload a CSV or Excel file with columns: <strong>name, email, department, role, birth_date, resignation_date, graduation_date, milestone_date, promotion_date</strong>.
            Only <strong>name</strong> and <strong>email</strong> are required — leave other columns blank if not applicable.
          </p>
          <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center mb-4">
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" id="csvfile"
              onChange={e => setCsvFile(e.target.files?.[0] || null)} />
            <label htmlFor="csvfile" className="cursor-pointer">
              <Icon name="Upload" size={32} className="mx-auto mb-2 text-purple-300" />
              <p className="text-sm font-semibold text-warm-700">{csvFile ? csvFile.name : 'Click to choose a file'}</p>
              <p className="text-xs text-warm-400 mt-1">.csv, .xlsx, or .xls</p>
            </label>
          </div>
          <button onClick={submitCSV} disabled={csvUploading || !csvFile}
            className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
            {csvUploading ? 'Uploading...' : 'Upload & invite'}
          </button>

          {csvResult && (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-semibold text-warm-900">{csvResult.message}</p>
              {csvResult.invited?.length > 0 && (
                <div className="text-xs text-green-700 bg-green-50 rounded-xl p-3">
                  Invited: {csvResult.invited.map(m => m.name).join(', ')}
                </div>
              )}
              {csvResult.errors?.length > 0 && (
                <div className="text-xs text-red-600 bg-red-50 rounded-xl p-3">
                  {csvResult.errors.map((e,i) => <p key={i}>{e.email}: {e.error}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PalLayout>
  );
}
