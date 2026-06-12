import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PalLayout from './PalLayout';
import Icon from '../../components/ui/Icon';
import { palAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const EVENTS = [
  { key: 'resignation', label: 'Resignation', dateField: 'resignation_date', noteField: 'resignation_note' },
  { key: 'graduation',  label: 'Graduation',  dateField: 'graduation_date',  noteField: 'graduation_note' },
  { key: 'milestone',   label: 'Milestone',   dateField: 'milestone_date',   noteField: 'milestone_note' },
  { key: 'promotion',   label: 'Promotion',   dateField: 'promotion_date',   noteField: 'promotion_note' },
];

export default function PalMemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => palAPI.getMemberProfile(id).then(r => setMember(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const set = (k, v) => setMember(p => ({ ...p, [k]: v }));
  const setBank = (k, v) => setMember(p => ({ ...p, bank_details: { ...(p.bank_details||{}), [k]: v } }));

  const saveProfile = async () => {
    setSaving(true);
    try {
      await palAPI.updateMemberProfile(id, {
        name: member.name, bio: member.bio, department: member.department, role: member.role,
        profile_pic_url: member.profile_pic_url, bank_details: member.bank_details,
      });
      toast.success('Profile saved!');
      load();
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await palAPI.uploadAvatar(id, file);
      set('profile_pic_url', res.data.url);
      toast.success('Photo uploaded — click Save to apply');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const saveEvent = async (event, date, note) => {
    try {
      await palAPI.updateMemberEvent(id, { event, date, note });
      toast.success('Event date updated — the group will be reminded automatically');
      load();
    } catch { toast.error('Failed to update event'); }
  };

  if (loading) return <PalLayout title="Member profile"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"/></div></PalLayout>;
  if (!member) return <PalLayout title="Member profile"><p className="text-warm-400">Member not found</p></PalLayout>;

  const profileComplete = !!(member.bio && member.bank_details?.account_number && member.profile_pic_url);

  return (
    <PalLayout title={member.name} subtitle="Edit profile, bank details, and life events">
      <Link to="/pals/dashboard/members" className="inline-flex items-center gap-1 text-sm text-primary-600 mb-4">
        <Icon name="ChevronLeft" size={14} /> Back to members
      </Link>

      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Icon name="AlertCircle" size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            It's important to complete this profile — bio, photo, and bank details — so the group can credit {member.name.split(' ')[0]} on their celebration day.
            {member.profile_reminder_count >= 2 ? ' (Reminder emails have been sent twice.)' : member.profile_reminder_count === 1 ? ' (1 reminder email sent so far.)' : ''}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-purple-100 p-6 space-y-4">
          <h3 className="font-semibold text-warm-900">Profile</h3>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {member.profile_pic_url
                ? <img src={member.profile_pic_url} className="w-full h-full object-cover"/>
                : <span className="text-2xl font-bold text-primary-400">{member.name.charAt(0).toUpperCase()}</span>}
            </div>
            <label className="px-4 py-2 rounded-xl border border-purple-200 text-sm font-semibold text-warm-600 cursor-pointer hover:bg-purple-50">
              {uploading ? 'Uploading...' : 'Change photo'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => uploadAvatar(e.target.files?.[0])} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Name</label>
              <input className="input w-full" value={member.name} onChange={e=>set('name',e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Email</label>
              <input className="input w-full bg-gray-50" value={member.email} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Department</label>
              <input className="input w-full" value={member.department||''} onChange={e=>set('department',e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">Role</label>
              <input className="input w-full" value={member.role||''} onChange={e=>set('role',e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">Bio</label>
            <textarea rows={3} className="input w-full" placeholder="A little about you..."
              value={member.bio||''} onChange={e=>set('bio',e.target.value)} />
          </div>

          <div className="border-t border-purple-50 pt-4">
            <p className="text-sm font-semibold text-warm-700 mb-3">Bank account (for celebration day gift)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className="input" placeholder="Bank name" value={member.bank_details?.bank_name||''} onChange={e=>setBank('bank_name',e.target.value)} />
              <input className="input" placeholder="Account number" value={member.bank_details?.account_number||''} onChange={e=>setBank('account_number',e.target.value)} />
              <input className="input" placeholder="Account name" value={member.bank_details?.account_name||''} onChange={e=>setBank('account_name',e.target.value)} />
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving}
            className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>

        {/* Life events */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6">
          <h3 className="font-semibold text-warm-900 mb-1">Life events</h3>
          <p className="text-xs text-warm-400 mb-4">Birthday is set at invite time. Other events can be added or updated here — the group gets reminded 14/7/4/1 day(s) before.</p>

          <div className="mb-4 pb-4 border-b border-purple-50">
            <p className="text-xs font-semibold text-warm-600 mb-1">🎂 Birthday</p>
            <p className="text-sm text-warm-900">{member.birth_date ? new Date(member.birth_date).toLocaleDateString('en-GB',{day:'numeric',month:'long'}) : 'Not set'}</p>
          </div>

          {EVENTS.map(evt => (
            <EventEditor key={evt.key} evt={evt} member={member} onSave={saveEvent} />
          ))}
        </div>
      </div>
    </PalLayout>
  );
}

function EventEditor({ evt, member, onSave }) {
  const [date, setDate] = useState(member[evt.dateField] || '');
  const [note, setNote] = useState(member[evt.noteField] || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(evt.key, date || null, note);
    setSaving(false);
  };

  return (
    <div className="mb-4 pb-4 border-b border-purple-50 last:border-0 last:mb-0 last:pb-0">
      <p className="text-xs font-semibold text-warm-600 mb-2">{evt.label}</p>
      <input type="date" className="input w-full text-sm mb-2" value={date||''} onChange={e=>setDate(e.target.value)} />
      <input type="text" className="input w-full text-sm mb-2" placeholder="Optional note for the card..." value={note||''} onChange={e=>setNote(e.target.value)} />
      <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-primary-600 font-semibold hover:bg-purple-100 disabled:opacity-50">
        {saving ? 'Saving...' : 'Update'}
      </button>
    </div>
  );
}
