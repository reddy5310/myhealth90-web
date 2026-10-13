// MyHealth 90 offline service worker.
// tool/finalize_web.py fills in BUILD_ID and PRECACHE after `flutter build web`.
const BUILD_ID = '10-da48074';
const PRECACHE = [
  './',
  'assets/AssetManifest.bin',
  'assets/AssetManifest.bin.json',
  'assets/FontManifest.json',
  'assets/assets/fonts/Roboto-bold.ttf',
  'assets/assets/fonts/Roboto-medium.ttf',
  'assets/assets/fonts/Roboto-regular.ttf',
  'assets/assets/icon/app_icon.png',
  'assets/fonts/MaterialIcons-Regular.otf',
  'assets/packages/cupertino_icons/assets/CupertinoIcons.ttf',
  'assets/packages/flutter_local_notifications_web/web/notifications_service_worker.js',
  'assets/packages/flutter_map/lib/assets/flutter_map_logo.png',
  'assets/packages/material_ui/shaders/ink_sparkle.frag',
  'assets/shaders/ink_sparkle.frag',
  'assets/shaders/stretch_effect.frag',
  'canvaskit/canvaskit.js',
  'canvaskit/canvaskit.wasm',
  'canvaskit/chromium/canvaskit.js',
  'canvaskit/chromium/canvaskit.wasm',
  'drift_worker.js',
  'favicon.png',
  'flutter.js',
  'flutter_bootstrap.js',
  'icons/Icon-192.png',
  'icons/Icon-512.png',
  'icons/Icon-maskable-192.png',
  'icons/Icon-maskable-512.png',
  'index.html',
  'main.dart.js',
  'manifest.json',
  'sqlite3.wasm'
];
const CACHE = `mh90-${BUILD_ID}`;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache files one by one so a single failure doesn't abort the install.
    await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('mh90-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Pages: network first so updates arrive, cached copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        (await caches.open(CACHE)).put('./', fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match('./')) || (await caches.match('index.html')) || Response.error();
      }
    })());
    return;
  }

  // Everything else: cache first, then network (and remember it).
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  })());
});
