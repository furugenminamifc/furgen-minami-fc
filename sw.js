const C='furugen-ver1821-cache-18.2.1';
const CORE=[
 './','./index.html','./config.js','./manifest.webmanifest',
 './assets/css/app.css','./assets/js/app.js',
 './assets/icons/icon-192.png','./assets/icons/icon-512.png'
];
self.addEventListener('install',event=>{
 self.skipWaiting();
 event.waitUntil(caches.open(C).then(cache=>cache.addAll(CORE)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==C).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(
   fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(C).then(cache=>cache.put('./index.html',copy));return response;
   }).catch(()=>caches.match('./index.html'))
  );
  return;
 }
 event.respondWith(
  caches.match(event.request).then(cached=>{
   const network=fetch(event.request).then(response=>{
    if(response&&response.status===200){
     const copy=response.clone();caches.open(C).then(cache=>cache.put(event.request,copy));
    }
    return response;
   }).catch(()=>cached);
   return cached||network;
  })
 );
});
self.addEventListener('message',event=>{
 if(event.data==='SKIP_WAITING')self.skipWaiting();
});
