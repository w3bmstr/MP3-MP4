/* ═══════════════════════════════════════════════════
   GROOVE — Service Worker
   Strategy: Cache-first for static assets & audio
             Network-first for HTML navigation
   No external libraries — manual Workbox-style logic
═══════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════
   CACHE CONFIGURATION
   ─────────────────────────────────────────────────
   Bump CACHE_VERSION whenever you deploy a new
   build. Old caches are automatically cleaned up
   in the activate handler.
════════════════════════════════════════════════ */
const CACHE_VERSION   = 'v1.3.2';
const SHELL_CACHE     = `groove-shell-${CACHE_VERSION}`;
const MUSIC_CACHE     = `groove-music-${CACHE_VERSION}`;
const RUNTIME_CACHE   = `groove-runtime-${CACHE_VERSION}`;
const PRECACHE_MEDIA_ON_INSTALL = false;

/* ─── App Shell (precached on install) ─────────── */
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/favicon.svg',
  '/cover.svg',
];

/* ─── Media files (precached on install) ───────── */
/*
  ► ADD YOUR MP3/MP4 PATHS HERE so they work offline.
  ► Paths must match exactly what you put in PLAYLIST
    inside app.js.
  ► Large files: if your tracks are huge and you don't
    want them precached, remove them from this array —
    they will still be cached at runtime the first
    time they are played.
*/
const MUSIC_ASSETS = [
  '/mathgrant_-_02_-_Arctic_Snow.mp3',
];

/* ─── Cover art (precached on install) ─────────── */
const COVER_ASSETS = [
  '/cover.svg',
];

/* ─── Google Fonts (runtime-cached) ─────────────── */
const FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

/* ════════════════════════════════════════════════
   INSTALL EVENT
   Pre-caches the app shell + audio + covers.
   skipWaiting() activates the new SW immediately.
════════════════════════════════════════════════ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Cache app shell (must succeed)
        const shellCache = await caches.open(SHELL_CACHE);
        await shellCache.addAll(SHELL_ASSETS);
        console.log('[SW] Shell assets cached.');

        // Cache cover/media files (best-effort — don't fail install)
        const musicCache = await caches.open(MUSIC_CACHE);
        const mediaToPrecache = PRECACHE_MEDIA_ON_INSTALL
          ? [...MUSIC_ASSETS, ...COVER_ASSETS]
          : [...COVER_ASSETS];

        await Promise.allSettled(
          mediaToPrecache.map((url) =>
            musicCache.add(url).catch((err) => {
              console.warn(`[SW] Could not precache ${url}:`, err.message);
            })
          )
        );

        if (PRECACHE_MEDIA_ON_INSTALL) {
          console.log('[SW] Music/cover assets cached (best-effort).');
        } else {
          console.log('[SW] Cover assets cached. Music files will cache on first playback.');
        }
      } catch (err) {
        console.error('[SW] Install failed:', err);
      }

      await self.skipWaiting();
    })()
  );
});

/* ════════════════════════════════════════════════
   ACTIVATE EVENT
   Deletes any caches from previous versions.
   claim() takes control of all open clients.
════════════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const known = [SHELL_CACHE, MUSIC_CACHE, RUNTIME_CACHE];
      const keys  = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => !known.includes(key))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );

      await self.clients.claim();
      console.log('[SW] Activated, controlling all clients.');
    })()
  );
});

/* ════════════════════════════════════════════════
   FETCH EVENT
   Routes requests to the correct strategy.
════════════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // ── Strategy: Network-first for HTML navigation ──
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, '/index.html'));
    return;
  }

  // ── Strategy: Cache-first for app shell assets ───
  if (isShellAsset(url)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // ── Strategy: Cache-first for audio / covers ─────
  // Avoids background re-downloads of large media.
  if (isAudioOrCover(url)) {
    event.respondWith(cacheFirst(request, MUSIC_CACHE));
    return;
  }

  // ── Strategy: Cache-first for Google Fonts ───────
  if (isFontRequest(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // ── Strategy: Network-only for everything else ───
  // (analytics, external APIs, etc.)
});

/* ════════════════════════════════════════════════
   HELPER: Determine request type
════════════════════════════════════════════════ */
function isShellAsset(url) {
  // Same-origin static assets (html, css, js, icons, manifest)
  if (url.origin !== self.location.origin) return false;
  const ext = url.pathname.split('.').pop().toLowerCase();
  return ['html','css','js','json','png','ico','svg','webp'].includes(ext)
    || url.pathname === '/';
}

function isAudioOrCover(url) {
  if (url.origin !== self.location.origin) return false;
  const ext = url.pathname.split('.').pop().toLowerCase();
  return ['mp3','m4a','ogg','wav','flac','aac','mp4','m4v','webm','ogv','mov','jpg','jpeg'].includes(ext);
}

function isFontRequest(url) {
  return FONT_ORIGINS.some((origin) => url.href.startsWith(origin));
}

/* ════════════════════════════════════════════════
   STRATEGY: Network-first
   Tries network → on failure, serves from cache.
   Ideal for HTML pages (always fresh if online).
════════════════════════════════════════════════ */
async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Final fallback: serve the app shell
    const fallback = await caches.match(fallbackUrl);
    return fallback || new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/* ════════════════════════════════════════════════
   STRATEGY: Cache-first
   Serves from cache immediately, falls back to
   network. Great for static assets (CSS, JS, icons)
   that change only when CACHE_VERSION bumps.
════════════════════════════════════════════════ */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Asset unavailable offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/* ════════════════════════════════════════════════
   MESSAGE HANDLING
   Allows the app to send control messages to the SW.
════════════════════════════════════════════════ */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    // Force the new SW to activate immediately
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    // Returns list of cached URLs (for debugging)
    case 'GET_CACHE_LIST':
      (async () => {
        const all = {};
        for (const name of [SHELL_CACHE, MUSIC_CACHE, RUNTIME_CACHE]) {
          const cache = await caches.open(name);
          const keys  = await cache.keys();
          all[name]   = keys.map((r) => r.url);
        }
        event.source.postMessage({ type: 'CACHE_LIST', payload: all });
      })();
      break;

    // Cache a specific URL on demand (e.g. future dynamic track)
    case 'CACHE_TRACK':
      if (event.data.url) {
        (async () => {
          try {
            const cache = await caches.open(MUSIC_CACHE);
            await cache.add(event.data.url);
            event.source.postMessage({ type: 'TRACK_CACHED', url: event.data.url });
          } catch (err) {
            event.source.postMessage({ type: 'CACHE_ERROR', url: event.data.url, error: err.message });
          }
        })();
      }
      break;
  }
});
