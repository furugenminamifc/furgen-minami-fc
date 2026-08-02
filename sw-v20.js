const CACHE='furugen-v22-22.3-20260802';
const BUILD='22.3-20260802';
const CORE=['./','./index.html?build='+BUILD,'./manifest.webmanifest?build='+BUILD,'./assets/css/app-v20.css','./assets/js/app-v20.js','./assets/css/live-match-v223.css?build='+BUILD,'./assets/js/live-match-v223.js?build='+BUILD];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(x=>c.add(x).catch(()=>null))))) });
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r&&r.ok){const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));}return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html?build='+BUILD))));});
