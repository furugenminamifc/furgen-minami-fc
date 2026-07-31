const CACHE_NAME='furugen-ai-coach-v18.2.2';
const CORE=[
  './',
  './index.html?v=18.2.2',
  './config.js?v=18.2.2',
  './manifest.webmanifest?v=18.2.2',
  './assets/css/app.css?v=18.2.2',
  './assets/js/app.js?v=18.2.2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './cache-reset.html?v=18.2.2'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.map(k=>caches.delete(k))))
      .then(()=>caches.open(CACHE_NAME))
      .then(cache=>cache.addAll(CORE))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
          return response;
        })
        .catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html?v=18.2.2')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING') self.skipWaiting();
  if(event.data==='CLEAR_ALL_CACHES'){
    event.waitUntil(
      caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))
    );
  }
});
