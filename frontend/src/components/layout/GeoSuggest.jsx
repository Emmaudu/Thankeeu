import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { getMarket, marketFromPath, prefixOf } from '../../utils/market';
import { MARKET_CHOICE_KEY, rememberMarket } from './CountrySwitcher';

// Time zone → country site. No IP lookup and nothing leaves the browser.
const ZONES = [
  [/^Europe\/London$|^Europe\/Belfast$|^Europe\/Guernsey$|^Europe\/Jersey$|^Europe\/Isle_of_Man$/, 'GB'],
  [/^Europe\/Dublin$/, 'IE'],
  [/^Australia\//, 'AU'],
  [/^Pacific\/(Auckland|Chatham)$/, 'NZ'],
  [/^Asia\/Singapore$/, 'SG'],
  [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Dawson_Creek|Swift_Current|Rankin_Inlet|Cambridge_Bay|Inuvik|Atikokan|Creston|Fort_Nelson|Dawson)$/, 'CA'],
  [/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Sitka|Nome|Adak|Menominee|Metlakatla|Yakutat)$|^America\/(Indiana|Kentucky|North_Dakota)\/|^Pacific\/Honolulu$/, 'US'],
];

export function marketFromTimeZone(tz) {
  const hit = ZONES.find(([re]) => re.test(tz || ''));
  return hit ? hit[1] : null;
}

const isBot = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.webdriver === true || /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|embedly/i.test(navigator.userAgent || '');
};

/**
 * "Suggest, don't force": a visitor whose time zone points to another
 * country sees one quiet bar offering their country's site. Nobody is
 * redirected automatically and search engines always see the page they asked for.
 */
export default function GeoSuggest() {
  const location = useLocation();
  const navigate = useNavigate();
  const [suggest, setSuggest] = useState(null);

  useEffect(() => {
    if (isBot()) return;
    const onRoot = !marketFromPath(location.pathname).slug;
    const privatePath = /^\/(admin|requester|tasker|auth|payment|teams)(\/|$)/.test(location.pathname);
    if (!onRoot || privatePath) { setSuggest(null); return; }
    let chosen = null;
    try { chosen = localStorage.getItem(MARKET_CHOICE_KEY); } catch { /* storage blocked */ }
    if (chosen) return;
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* old browser */ }
    const code = marketFromTimeZone(tz);
    if (code) setSuggest(getMarket(code));
  }, [location.pathname]);

  if (!suggest) return null;
  const close = () => { rememberMarket('NG'); setSuggest(null); };
  const go = () => { rememberMarket(suggest.code); setSuggest(null); navigate(prefixOf(suggest.code)); };
  return (
    <div role="region" aria-label="Country suggestion" data-testid="geo-suggest"
      style={{ position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 70, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto', maxWidth: 560, width: '100%', background: 'var(--dark)', color: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 12px 40px rgba(18,9,26,0.35)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ flex: '1 1 220px', fontSize: 14, lineHeight: 1.5 }}>
          It looks like you are in <strong>{suggest.name}</strong>. Taskeeu {suggest.short} has local taskers and prices in {suggest.currency}.
        </p>
        <button type="button" onClick={go} className="btn-primary btn-sm">Go to Taskeeu {suggest.short}</button>
        <button type="button" onClick={close} aria-label="Stay on this site" style={{ color: 'rgba(255,255,255,0.7)', padding: 6 }}><X size={18} /></button>
      </div>
    </div>
  );
}
