const CACHE='furugen-v22-22.6-20260803';
const BUILD='22.6-20260803';
const CORE=[
  './',
  './index.html?build='+BUILD,
  './manifest.webmanifest?build='+BUILD,
  './assets/css/app-v20.css?build='+BUILD,
  './assets/js/app-v20.js?build='+BUILD,
  './assets/css/live-match-v226.css?build='+BUILD,
  './assets/js/live-match-v226.js?build='+BUILD
];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
    return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html?build='+BUILD))));
});
