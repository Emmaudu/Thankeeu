import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { pushApi } from '../utils/api';
import toast from 'react-hot-toast';

const DISMISS_KEY = 'taskeeu_push_dismissed';

// Is the app running as an installed PWA?
const IS_INSTALLED_PWA = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Core subscription function — works with or without a logged-in user.
// Subscriptions are stored anonymously if not authenticated, then claimed
// (linked to the user) when they log in.
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const { data } = await pushApi.vapidKey();
    if (!data.enabled || !data.key) return { ok: false, reason: 'disabled' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.key),
      });
    }
    // Store the subscription — user_id is optional on this endpoint now,
    // so this works even when the user hasn't logged in yet.
    await pushApi.subscribe(sub);
    // Cache the endpoint locally so login can claim it.
    try { localStorage.setItem('taskeeu_push_endpoint', sub.endpoint); } catch (_) {}
    return { ok: true, endpoint: sub.endpoint };
  } catch (err) {
    console.warn('Push subscribe failed:', err?.message);
    return { ok: false, reason: 'error' };
  }
}

// Show the opt-in banner:
//  - On an installed PWA: show to EVERYONE (logged in or not) — the whole
//    point is that push works on the device regardless of login state.
//  - In a regular browser: show only to logged-in users (less aggressive).
export default function PushOptIn() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return; // already decided
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch (_) {}
    if (dismissed) return;
    // Show after a short delay — let the page settle first.
    const delay = IS_INSTALLED_PWA ? 2000 : 5000;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, []);

  const enable = async () => {
    const res = await subscribeToPush();
    if (res.ok) toast.success('Notifications enabled. You\'ll be alerted for bids, messages, and updates.');
    else if (res.reason === 'denied') toast('Enable notifications in your device settings to get alerts.', { icon: '', duration: 5000 });
    else if (res.reason === 'disabled') toast('Push notifications are not configured yet.');
    else if (res.reason === 'unsupported') toast('Your browser does not support push notifications.');
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 55, maxWidth: 440, margin: '0 auto',
      background: '#fff', color: '#12091a', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.18)',
      padding: 16, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #f0e6f5',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff0f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bell size={20} style={{ color: '#ff2d62' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>Get notified</p>
        <p style={{ fontSize: 12.5, color: '#6b7280', margin: '2px 0 0', lineHeight: 1.5 }}>
          {IS_INSTALLED_PWA
            ? 'Allow notifications to get alerts for bids, messages, and updates, even when the app is closed.': 'Turn on alerts for new bids, messages, and task updates.'}
        </p>
      </div>
      <button onClick={enable}
        style={{ flexShrink: 0, background: '#ff2d62', color: 'white', border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
        Enable
      </button>
      <button onClick={dismiss} aria-label="Dismiss" style={{ flexShrink: 0, background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4 }}>
        <X size={18} />
      </button>
    </div>
  );
}
