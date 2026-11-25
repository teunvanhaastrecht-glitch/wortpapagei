/* Offline-cache voor WortPapagei.
   Pagina, scripts en manifest: eerst het netwerk (zo komt een nieuwe versie meteen binnen), offline uit de cache.
   Plaatjes en lettertype: eerst uit de cache. VERSION wordt door tools/stamp_sw.py uit de inhoud van de bestanden berekend. */
const VERSION = 'wortpapagei-c08f45c11e';
const CORE = ['./', 'index.html', 'app.js', 'verbs.js', 'words.js', 'sound.js', 'manifest.webmanifest'];
const ASSETS = ['assets/fonts/nunito.woff2', 'assets/parrot.webp', 'assets/raven.webp', 'assets/canary.webp', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
const NETWORK_TIMEOUT = 3000;

self.addEventListener('install', e => {
  // cache: 'reload' haalt verse bestanden op, niet een oude kopie uit de browsercache.
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(CORE.concat(ASSETS).map(url => fetch(new Request(url, { cache: 'reload' })).then(res => {
      if (!res.ok) throw new Error(url + ' ' + res.status);
      return c.put(url, res);
    }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function isCore(url) {
  return /\.(html|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
}
// Alleen geslaagde antwoorden bewaren, nooit een 404 of 500.
function keep(req, res) {
  if (res && res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
}
// Netwerk eerst, maar niet eindeloos wachten op een slechte verbinding.
function networkFirst(req) {
  const fromCache = () => caches.match(req, { ignoreSearch: true })
    .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
  return new Promise(resolve => {
    let done = false;
    const finish = res => { if (!done && res) { done = true; resolve(res); } };
    const timer = setTimeout(() => fromCache().then(finish), NETWORK_TIMEOUT);
    fetch(req)
      .then(res => (!res.ok && req.mode === 'navigate') ? fromCache().then(hit => hit || res) : keep(req, res))
      .catch(() => fromCache().then(hit => hit || Response.error()))
      .then(res => { clearTimeout(timer); finish(res); done = true; });
  });
}
function cacheFirst(req) {
  return caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => keep(req, res)));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(e.request.mode === 'navigate' || isCore(url) ? networkFirst(e.request) : cacheFirst(e.request));
});
