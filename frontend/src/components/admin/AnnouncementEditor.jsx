import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { AnnouncementBarView, ANNOUNCEMENT_THEMES } from '../AnnouncementBar';

/**
 * Admin → Discount Codes → Announcement banner.
 * One site-wide notice shown above the navbar on every public page.
 */

const EMPTY = { enabled: false, text: '', link_url: '', link_label: '', new_tab: false, theme: 'purple', dismissible: true, starts_at: '', ends_at: '' };

// <input type="datetime-local"> works in the admin's local time; the API stores UTC.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

const linkProblem = (url) => {
  const s = (url || '').trim();
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return '';
  if (/^https?:\/\/[^\s/]+\.[^\s]+/i.test(s)) return '';
  return 'Use a full https:// link or a page path like /pricing';
};

export default function AnnouncementEditor() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const apply = (a, isLive) => {
    const f = {
      ...EMPTY, ...a,
      starts_at: toLocalInput(a?.starts_at), ends_at: toLocalInput(a?.ends_at),
    };
    setForm(f); setSaved(f); setLive(!!isLive);
  };

  useEffect(() => {
    adminAPI.getAnnouncement()
      .then(r => apply(r.data?.announcement || EMPTY, r.data?.live))
      .catch(e => setLoadError(e.response?.data?.error || 'Could not load the announcement'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm(f => ({ ...f, [k]: v }));
  };

  const dirty = saved && JSON.stringify(form) !== JSON.stringify(saved);
  const badLink = linkProblem(form.link_url);

  const save = async (overrides = {}) => {
    const next = { ...form, ...overrides };
    if (next.enabled && !next.text.trim()) return toast.error('Write the announcement text first');
    if (linkProblem(next.link_url)) return toast.error(linkProblem(next.link_url));
    setSaving(true);
    try {
      const r = await adminAPI.saveAnnouncement({
        ...next,
        text: next.text.trim(),
        link_url: next.link_url.trim(),
        link_label: next.link_label.trim(),
        starts_at: fromLocalInput(next.starts_at),
        ends_at: fromLocalInput(next.ends_at),
      });
      apply(r.data.announcement, r.data.live);
      toast.success(r.data.live ? '📣 Announcement is live on the site' : (next.enabled ? 'Saved — scheduled, not showing yet' : 'Announcement saved (hidden)'));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not save the announcement');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="rounded-2xl border border-purple-100 bg-white p-5 text-sm text-warm-400">Loading announcement…</div>;

  const status = live
    ? { text: 'Live on all public pages', cls: 'bg-green-100 text-green-700' }
    : saved?.enabled
      ? { text: 'On — outside its schedule', cls: 'bg-amber-100 text-amber-700' }
      : { text: 'Off', cls: 'bg-warm-100 text-warm-500' };

  return (
    <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-purple-50 px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-warm-900">📣 Announcement banner</h3>
          <p className="mt-0.5 text-xs text-warm-500">A bar above the navbar on every public page — announce a feature, an event, anything. Add a link to make it clickable.</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.cls}`}>{status.text}</span>
      </div>

      {loadError && <p className="mx-5 mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{loadError}</p>}

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-warm-400">Preview</p>
          <div className="overflow-hidden rounded-xl border border-warm-100">
            {form.text.trim()
              ? <AnnouncementBarView a={{ ...form, text: form.text.trim() }} preview onDismiss={() => {}} />
              : <div className="px-4 py-2.5 text-center text-xs text-warm-400">Your announcement will appear here</div>}
            <div className="flex h-9 items-center gap-2 bg-[#F5F0FF] px-4 text-[11px] font-bold text-warm-500">
              <span className="font-black text-warm-900">thank<span className="text-primary-600">eeu</span></span>
              <span className="ml-auto opacity-60">navbar</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-warm-500">Announcement text</label>
          <input value={form.text} onChange={set('text')} maxLength={200} className="input w-full"
            placeholder="🎉 New: add voice notes to your group cards!" />
          <p className="mt-1 text-right text-[10px] text-warm-400">{form.text.length}/200</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <div>
            <label className="mb-1 block text-xs font-semibold text-warm-500">Link (optional)</label>
            <input value={form.link_url} onChange={set('link_url')} maxLength={500} className="input w-full"
              placeholder="/pricing  or  https://thankeeu.com/blog/…" />
            {badLink && <p className="mt-1 text-[11px] text-red-500">{badLink}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-warm-500">Button text</label>
            <input value={form.link_label} onChange={set('link_label')} maxLength={40} className="input w-full"
              placeholder="Learn more" disabled={!form.link_url.trim()} />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-warm-500">Colour</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ANNOUNCEMENT_THEMES).map(([key, t]) => (
              <button key={key} type="button" onClick={() => set('theme')(key)} title={t.label} aria-label={t.label}
                aria-pressed={form.theme === key}
                className={`h-8 w-14 rounded-lg border-2 transition ${form.theme === key ? 'border-warm-900 scale-105' : 'border-transparent'}`}
                style={{ background: t.bg, minHeight: 0 }} />
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-warm-500">Start showing (optional)</label>
            <input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-warm-500">Stop showing (optional)</label>
            <input type="datetime-local" value={form.ends_at} onChange={set('ends_at')} className="input w-full" />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-warm-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.new_tab} onChange={set('new_tab')} disabled={!form.link_url.trim()} />
            Open link in a new tab
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.dismissible} onChange={set('dismissible')} />
            Visitors can close it
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-purple-50 pt-4">
          {saved?.enabled ? (
            <>
              <button type="button" disabled={saving || !dirty || !!badLink} onClick={() => save()}
                className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50">
                {saving ? 'Saving…' : 'Update live banner'}
              </button>
              <button type="button" disabled={saving} onClick={() => save({ enabled: false })}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">
                Turn off
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={saving || !form.text.trim() || !!badLink} onClick={() => save({ enabled: true })}
                className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50">
                {saving ? 'Publishing…' : 'Publish banner'}
              </button>
              <button type="button" disabled={saving || !dirty || !!badLink} onClick={() => save({ enabled: false })}
                className="rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-bold text-warm-700 hover:bg-purple-50 disabled:opacity-50">
                Save as draft
              </button>
            </>
          )}
          {dirty && <span className="text-[11px] font-semibold text-amber-600">Unsaved changes</span>}
          <span className="ml-auto text-[11px] text-warm-400">Editing it shows it again to visitors who closed it · updates within a minute</span>
        </div>
      </div>
    </section>
  );
}
