/**
 * gifCache.js — persistent GIF caching using the browser Cache API
 *
 * Why Cache API and not localStorage/IndexedDB?
 *   - Cache API stores full Response/Blob objects natively — no base64 encoding
 *   - Survives page refreshes and browser restarts (unlike in-memory Map)
 *   - Async, non-blocking — won't freeze the UI
 *   - Browsers manage eviction automatically under storage pressure
 *
 * The cache has two stores:
 *   1. RESULTS_CACHE — stores JSON search/trending results keyed by query+offset
 *   2. BLOBS_CACHE   — stores the actual GIF binary files keyed by URL
 */

const RESULTS_CACHE_NAME = 'thankeeu-gif-results-v1';
const BLOBS_CACHE_NAME   = 'thankeeu-gif-blobs-v1';

// Max age for search results (1 hour) — GIFs don't change that fast
const RESULTS_MAX_AGE_MS = 60 * 60 * 1000;

// ── Results cache (JSON) ─────────────────────────────────────────────────────

export async function getCachedResults(key) {
  try {
    const cache = await caches.open(RESULTS_CACHE_NAME);
    const res = await cache.match(key);
    if (!res) return null;

    // Check if cache entry is still fresh
    const cachedAt = parseInt(res.headers.get('x-cached-at') || '0', 10);
    if (Date.now() - cachedAt > RESULTS_MAX_AGE_MS) {
      await cache.delete(key);
      return null;
    }
    return await res.json();
  } catch {
    return null; // Cache API unavailable (private browsing etc.) — just fetch fresh
  }
}

export async function setCachedResults(key, data) {
  try {
    const cache = await caches.open(RESULTS_CACHE_NAME);
    const res = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'x-cached-at': String(Date.now()),
      }
    });
    await cache.put(key, res);
  } catch {
    // Non-critical — silently ignore if Cache API is unavailable
  }
}

// ── Blob cache (actual GIF files) ────────────────────────────────────────────

export async function getCachedBlob(url) {
  try {
    const cache = await caches.open(BLOBS_CACHE_NAME);
    const res = await cache.match(url);
    if (!res) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function setCachedBlob(url, blob) {
  try {
    const cache = await caches.open(BLOBS_CACHE_NAME);
    await cache.put(url, new Response(blob, {
      headers: { 'Content-Type': blob.type || 'image/gif' }
    }));
  } catch {
    // Non-critical
  }
}

export async function isBlobCached(url) {
  try {
    const cache = await caches.open(BLOBS_CACHE_NAME);
    const res = await cache.match(url);
    return !!res;
  } catch {
    return false;
  }
}
