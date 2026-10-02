// Taskeeu service worker v4 — mobile-data-first
//
// Core strategy:
//  - NEVER intercept navigate requests. Page loads go directly to network.
//    This is the fix for blank screens on mobile data (3G/4G Nigeria).
//    The browser handles timeouts and retries natively — far better than SW.
//  - Cache /assets/* files only (hashed bundles). Safe because new deploy
//    means new filenames. Big win for repeat visits on mobile data.
//  - Everything else: pass through to network, no caching, no interception.
//  - Push notifications handled separately below.

const CACHE = 'taskeeu-v4';

self.addEventListener('install', (e) => {
  // Pre-cache only the PWA icon — nothing else to avoid blocking installs.
  e.waitUntil(
    caches.open(CACHE).then(c => c.add('/pwa-192x192.png').catch(() => {}))
  );
  // Do NOT skipWaiting here — let the page control when updates activate.
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Only handle GET requests.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never touch: cross-origin, API calls, navigate requests.
  // Especially never touch navigate — this is what caused mobile data issues.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') return;

  // Hashed build assets (/assets/...): cache-first.
  // These are content-hashed so caching is 100% safe.
  // First visit fetches from network; all subsequent visits are instant from cache.
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || new Response('', { status: 504 });
        }
      })
    );
    return;
  }

  // Static icons/manifest: serve from cache if available, else network.
  if (url.pathname.match(/\.(png|ico|webmanifest|svg)$/)) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).catch(() => new Response('', { status: 504 })))
    );
  }

  // Everything else (html files, etc.): do nothing — let network handle it natively.
});

// ── Push notifications ────────────────────────────────────────────
function track(event, data) {
  fetch('/api/track/push-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign_id: data.campaign_id, event, title: data.title }),
    keepalive: true,
  }).catch(() => {});
}

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  const title = d.title || 'Taskeeu';
  e.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body: d.body || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: d.url || '/', campaign_id: d.campaign_id, title },
      tag: d.tag,
    }),
    track('shown', d),
  ]));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {};
  track('opened', d);
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(d.url || '/') && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(d.url || '/');
    })
  );
});
