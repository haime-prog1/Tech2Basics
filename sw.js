/* =========================================================
   Service worker = a small helper that runs in the background.
   Job: on first visit, save a copy of every file in "Cache Storage".
   After that, files come from the cache, so the app works offline.

   IMPORTANT: when you change any file, raise the VERSION number.
   That tells phones "there is a new copy, download it again".
   ========================================================= */
const VERSION = 'techbasics-v1';

// Every file the app needs. If you add a new unit JSON file, add it here too.
const FILES = [
  './', './index.html', './manifest.json', './css/styles.css',
  './js/app.js', './js/db.js', './js/content.js', './js/jargon.js', './js/quiz.js', './js/util.js',
  './js/views/home.js', './js/views/path.js', './js/views/lesson.js',
  './js/views/dictionary.js', './js/views/review.js', './js/views/settings.js',
  './data/units.json', './data/dictionary.json',
  './data/unit1.json', './data/unit3.json',
  './icons/icon.svg', './icons/apple-touch-icon.png', './icons/icon-192.png',
  './icons/icon-512.png', './icons/icon-512-maskable.png'
];

// 1. INSTALL: download and save all files.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 2. ACTIVATE: delete caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 3. FETCH: every time the app asks for a file.
//    "Cache first, then network": answer from the cache right away (fast + offline);
//    if a file isn't saved yet, fetch it from the internet and save it for next time.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((saved) => {
      if (saved) return saved;
      return fetch(event.request).then((res) => {
        if (res.ok && new URL(event.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(event.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html')); // offline and unknown → show the app
    })
  );
});
