// Service worker for r3ai.dev. It makes the site installable and lets pages you have already
// opened, and games you chose to save, work with no connection. The network always wins when
// it is available, so a published change shows up on the next visit.
const PAGES = 'r3-pages-v2';   // copies of what you have visited
const SAVED = 'r3-saved';      // games saved on purpose from the games page; never cleared here
const SHELL = ['/offline/', '/styles.css', '/site.js', '/favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(PAGES).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(names => Promise.all(names.filter(n => n !== PAGES && n !== SAVED).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/api/')) return; // the form, the counter and Ask always need the network
    if (request.destination === 'video' || request.headers.has('range')) return; // videos stream in pieces; leave them to the browser
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(PAGES).then(cache => cache.put(request, copy)); }
      return response;
    }).catch(async () => (await caches.match(request, { ignoreSearch: true }))
      || (request.mode === 'navigate' ? caches.match('/offline/') : Response.error())));
    return;
  }
  // fonts and the game libraries from other sites: use the saved copy first, since they never change
  if (['font', 'style', 'script'].includes(request.destination)) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      const copy = response.clone(); caches.open(PAGES).then(cache => cache.put(request, copy));
      return response;
    })));
  }
});
