import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { siteAPI } from '../utils/api';

/**
 * AnnouncementBar — the site-wide notice an admin sets in
 * Admin → Discount Codes → Announcement banner. Rendered by <Navbar>, so it
 * sits above the navbar on every public page.
 *
 * • Fetched once per page load (shared across Navbar remounts on navigation).
 * • Clickable when a link is set: "/path" stays in the app, https:// opens
 *   normally (or in a new tab when the admin chose that).
 * • Dismissing hides it for this visitor until the admin edits it again.
 */

export const ANNOUNCEMENT_THEMES = {
  purple: { bg: 'linear-gradient(90deg,#6D28D9,#9333EA 55%,#DB2777)', fg: '#FFFFFF', chip: 'rgba(255,255,255,.2)', label: 'Purple' },
  dark:   { bg: '#1A1035', fg: '#FFFFFF', chip: 'rgba(255,255,255,.16)', label: 'Midnight' },
  green:  { bg: 'linear-gradient(90deg,#047857,#10B981)', fg: '#FFFFFF', chip: 'rgba(255,255,255,.2)', label: 'Green' },
  orange: { bg: 'linear-gradient(90deg,#EA580C,#F59E0B)', fg: '#FFFFFF', chip: 'rgba(255,255,255,.22)', label: 'Orange' },
  pink:   { bg: 'linear-gradient(90deg,#DB2777,#F472B6)', fg: '#FFFFFF', chip: 'rgba(255,255,255,.22)', label: 'Pink' },
  blue:   { bg: 'linear-gradient(90deg,#1D4ED8,#0EA5E9)', fg: '#FFFFFF', chip: 'rgba(255,255,255,.2)', label: 'Blue' },
};

const DISMISS_KEY = 'thankeeu_announcement_dismissed';
let cache = null;          // { at, promise }
const TTL = 60_000;

function load() {
  if (cache && Date.now() - cache.at < TTL) return cache.promise;
  const promise = siteAPI.getAnnouncement()
    .then(r => r.data?.announcement || null)
    .catch(() => null);
  cache = { at: Date.now(), promise };
  return promise;
}

const readDismissed = () => { try { return localStorage.getItem(DISMISS_KEY); } catch { return null; } };
const writeDismissed = (v) => { try { localStorage.setItem(DISMISS_KEY, v); } catch { /* private mode */ } };

const isInternal = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');

/** Pure presentational bar — also used for the live preview in Admin. */
export function AnnouncementBarView({ a, onDismiss, preview = false }) {
  const t = ANNOUNCEMENT_THEMES[a.theme] || ANNOUNCEMENT_THEMES.purple;
  const hasLink = !!a.link_url;
  const cta = a.link_label || (hasLink ? 'Learn more' : '');

  const inner = (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
      <span>{a.text}</span>
      {hasLink && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-extrabold sm:text-xs"
          style={{ background: t.chip }}>
          {cta} <span aria-hidden="true">→</span>
        </span>
      )}
    </span>
  );

  const cls = 'block px-10 py-2 text-center text-xs font-semibold leading-snug sm:text-sm';
  let body;
  if (!hasLink || preview) body = <div className={cls}>{inner}</div>;
  else if (isInternal(a.link_url) && !a.new_tab) body = <Link to={a.link_url} className={`${cls} hover:bg-white/10`}>{inner}</Link>;
  else body = (
    <a href={a.link_url} className={`${cls} hover:bg-white/10`}
      {...(a.new_tab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inner}</a>
  );

  return (
    <div role="region" aria-label="Announcement" className="relative z-[51] w-full"
      style={{ background: t.bg, color: t.fg }}>
      {body}
      {a.dismissible !== false && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss announcement"
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-base leading-none hover:bg-white/20"
          style={{ minHeight: 0, color: t.fg }}>
          ×
        </button>
      )}
    </div>
  );
}

export default function AnnouncementBar() {
  const [a, setA] = useState(null);

  useEffect(() => {
    let alive = true;
    load().then(ann => {
      if (!alive || !ann) return;
      if (ann.ends_at && new Date(ann.ends_at) <= new Date()) return;
      if (ann.dismissible !== false && readDismissed() === String(ann.version)) return;
      setA(ann);
    });
    return () => { alive = false; };
  }, []);

  if (!a) return null;
  return (
    <AnnouncementBarView a={a} onDismiss={() => { writeDismissed(String(a.version)); setA(null); }} />
  );
}
