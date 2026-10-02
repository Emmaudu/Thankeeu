import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { pwaApi } from '../utils/api';

const DISMISS_KEY = 'taskeeu_install_dismissed';
const INSTALL_LOGGED_KEY = 'taskeeu_install_logged';

// Detect iOS Safari (where install is manual — Apple blocks auto prompts).
function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
// Already running as an installed PWA?
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// Best-effort platform + device classification from the user agent.
function detectPlatform() {
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return { platform: 'ios', device_type: 'mobile' };
  if (/android/.test(ua)) return { platform: 'android', device_type: 'mobile' };
  if (/windows/.test(ua)) return { platform: 'windows', device_type: 'desktop' };
  if (/macintosh|mac os x/.test(ua)) return { platform: 'mac', device_type: 'desktop' };
  return { platform: 'other', device_type: /mobi/.test(ua) ? 'mobile' : 'desktop' };
}

// Records an install exactly once per browser (guards against double logging).
function logInstall() {
  try {
    if (localStorage.getItem(INSTALL_LOGGED_KEY) === '1') return;
    localStorage.setItem(INSTALL_LOGGED_KEY, '1');
  } catch (_) {}
  const info = detectPlatform();
  pwaApi.logInstall({ ...info, user_agent: window.navigator.userAgent.slice(0, 300) }).catch(() => {});
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null); // Android
  const [showIosTip, setShowIosTip] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If the app is already running installed, log it once (covers iOS,
    // which does not fire 'appinstalled', and any install we missed).
    if (isStandalone()) { logInstall(); return; }

    // Fires on Android/desktop when the app is actually installed.
    const onInstalled = () => logInstall();
    window.addEventListener('appinstalled', onInstalled);

    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch (_) {}
    if (dismissed) return () => window.removeEventListener('appinstalled', onInstalled);

    // Android / Chromium: capture the install event and show our own button.
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS: no event exists, so show a manual tip after a short delay.
    if (isIos()) {
      const t = setTimeout(() => { setShowIosTip(true); setVisible(true); }, 2500);
      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.removeEventListener('appinstalled', onInstalled);
        clearTimeout(t);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (_) {}
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) {}
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 60,
      maxWidth: 440, margin: '0 auto',
      background: '#12091a', color: 'white', borderRadius: 16,
      boxShadow: '0 10px 40px rgba(0,0,0,0.35)', padding: 16,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <img src="/pwa-192x192.png" alt="" width={44} height={44} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {showIosTip ? (
          <>
            <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>Install Taskeeu</p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', margin: '3px 0 0', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              Tap <Share size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> then &ldquo;Add to Home Screen&rdquo;.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>Install the Taskeeu app</p>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', margin: '3px 0 0', lineHeight: 1.5 }}>
              Add it to your home screen for quick, full-screen access.
            </p>
          </>
        )}
      </div>
      {!showIosTip && (
        <button onClick={install}
          style={{ flexShrink: 0, background: '#ff2d62', color: 'white', border: 'none', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Download size={15} /> Install
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss"
        style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
        <X size={18} />
      </button>
    </div>
  );
}
