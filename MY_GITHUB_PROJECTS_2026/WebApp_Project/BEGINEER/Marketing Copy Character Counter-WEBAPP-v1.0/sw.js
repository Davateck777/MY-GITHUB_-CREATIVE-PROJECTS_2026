/**
 * sw.js — production service worker.
 *
 * Strategy, deliberately chosen per asset type:
 *   - navigation requests : network-first, falling back to the cached shell.
 *     A deploy therefore shows up on the next load; offline still works.
 *   - same-origin assets : stale-while-revalidate, so the app opens instantly
 *     and quietly refreshes in the background.
 *   - anything else       : untouched. This app makes no cross-origin requests.
 *
 * The cache is versioned from js/version.js. Bumping VERSION retires old caches.
 */

/*
 * This file intentionally has NO imports. A classic service worker cannot use ES
 * module syntax, and registering it as a module worker is not supported
 * everywhere yet. `CACHE_NAME` below must match `CACHE_NAME` in js/version.js —
 * asserted by tests/release.test.js so the two cannot drift.
 */
const CACHE_NAME = 'mccc-v1.0.0';
const VERSION = '1.0.0';

const SHELL = [
  './',
  './index.html',
  './editor.html',
  './saved.html',
  './guide.html',
  './css/styles.css',
  './css/themes.css',
  './js/main.js',
  './js/app.js',
  './js/version.js',
  './js/platforms.js',
  './js/counter.js',
  './js/analysis.js',
  './js/editor.js',
  './js/preview.js',
  './js/storage.js',
  './js/saved.js',
  './js/exportImport.js',
  './js/ui.js',
  './vendor/twitter-text.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // addAll is all-or-nothing; add individually so one 404 cannot break install.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'VERSION') {
    event.source?.postMessage({ type: 'VERSION', version: VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request)) ?? (await cache.match('./index.html'));
    if (cached) return cached;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title><p>This page is not available offline yet. Reconnect and reload.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Refresh in the background; never block the response on the network.
    network.catch(() => null);
    return cached;
  }

  const fresh = await network;
  if (fresh) return fresh;

  return new Response('', { status: 504, statusText: 'Offline' });
}
