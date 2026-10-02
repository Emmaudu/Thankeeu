import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Auto-reload once when a dynamic import chunk fails to load (stale Vercel deploy).
// Prevents users seeing the blank "Failed to fetch dynamically imported module" error.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  // Only reload once — guard against infinite reload loops
  const key = 'taskeeu_chunk_reload';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }
});

// Also catch unhandled dynamic import errors
window.addEventListener('error', (event) => {
  if (event?.message?.includes('dynamically imported module') || event?.message?.includes('Failed to fetch')) {
    const key = 'taskeeu_chunk_reload';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide PWA splash screen now that React has mounted.
if (typeof window.__hideSplash === 'function') window.__hideSplash();

// Register the service worker (enables PWA install + push). Registered after
// load so it never blocks first paint. Detects a new deployed version and
// prompts the user to refresh, so users never stay on a stale copy.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // If an update is found, wait for it to install, then prompt refresh.
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          // A new SW is installed AND there's an existing controller = update.
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Lightweight, non-blocking prompt. Keeps users off stale builds.
            const bar = document.createElement('div');
            bar.setAttribute('role', 'status');
            bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:440px;margin:0 auto;background:#12091a;color:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.35);display:flex;align-items:center;gap:12px;font-family:sans-serif;font-size:14px';
            bar.innerHTML = '<span style="flex:1">A new version of Taskeeu is available.</span>';
            const btn = document.createElement('button');
            btn.textContent = 'Refresh';
            btn.style.cssText = 'background:#ff2d62;color:#fff;border:none;border-radius:9px;padding:8px 16px;font-weight:700;font-size:13px;cursor:pointer;flex-shrink:0';
            btn.onclick = () => { newWorker.postMessage('SKIP_WAITING'); };
            bar.appendChild(btn);
            document.body.appendChild(bar);
          }
        });
      });
    }).catch((err) => {
      console.warn('Service worker registration failed:', err?.message);
    });

    // When the new SW takes control, reload once to get the fresh app.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
