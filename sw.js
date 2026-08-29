const CACHE='fiscalizacion-bi-l26-manual-20260829-croquis-proportional-v1';
const CORE=['./','./index.html','./app/index.html','./app/assets/import_rules.js','./app/assets/l26_excel_import_core.js','./app/assets/l26_croquis_core.js','./app/assets/l26_pdf_reader.js','./manifest.webmanifest','./favicon-48.png','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>{
    if(cached)return cached;
    return fetch(event.request).then(response=>{if(response&&response.ok&&new URL(event.request.url).origin===self.location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{})}return response}).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):undefined);
  }));
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
