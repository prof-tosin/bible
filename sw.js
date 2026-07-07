const SHELL = 'bibeli-shell-v2';
const DATA  = 'bibeli-data-v2';
const STATIC = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k!==SHELL && k!==DATA).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(url.hostname === 'raw.githubusercontent.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(DATA).then(async cache => {
      const hit = await cache.match(e.request);
      if(hit) return hit;
      try {
        const resp = await fetch(e.request);
        if(resp.ok) cache.put(e.request, resp.clone());
        return resp;
      } catch { return new Response('{"offline":true}',{headers:{'Content-Type':'application/json'}}); }
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html'))));
});
