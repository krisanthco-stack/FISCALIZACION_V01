const CACHE='fiscalizacion-bi-l26-manual-20260829-croquis-proportional-v1-year-filter-v1-integridad-recuperacion-v1-internal-web-reader-v1-requested-updates-v1-conformidad-v1-windows-desktop-launch-v1-desktop-bridge-fallback-v2-pdf-compat-v1-compact-districts-v1-android-offline-pdf-ocr-v1-rebuild-reader-v2-metro-protocol-handoff-v1-folio-dedupe-posesoria-v1-global-backup-historical-consolidation-v1-metro-formula-links-v1-web-fallback-v1-alarm-filter-v1-alarm-date-hotfix-v1-release-27.3.9';
const CORE=['./','./index.html','./app/index.html','./app/assets/import_rules.js','./app/assets/l26_integrity_core.js','./app/assets/l26_management_core.js','./app/assets/l26_territory_core.js','./app/assets/l26_reader_apply_core.js','./app/assets/l26_excel_import_core.js','./app/assets/l26_croquis_core.js','./app/assets/l26_filter_core.js','./app/assets/l26_pdf_reader.js','./manifest.webmanifest','./favicon-48.png','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-192.png','./icon-maskable-512.png'];
const PDFJS_CACHE='l26-pdfjs-4.10.38-legacy-v2';
const PDFJS_ASSETS=['./app/assets/vendor/pdfjs-4.10.38-legacy/pdf.min.mjs','./app/assets/vendor/pdfjs-4.10.38-legacy/pdf.worker.min.mjs'];
async function prewarmPdfJs(){
  try{
    const cache=await caches.open(PDFJS_CACHE);
    await Promise.all(PDFJS_ASSETS.map(async url=>{
      if(await cache.match(url))return;
      try{
        const response=await fetch(url,{cache:'reload'});
        if(response?.ok)await cache.put(url,response.clone());
      }catch(error){console.warn('Motor PDF pendiente de precarga:',url,error?.message||error)}
    }));
  }catch(error){console.warn('No se pudo preparar el lector PDF offline:',error?.message||error)}
}
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(CORE);await prewarmPdfJs();await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE&&key!==PDFJS_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>{
    if(cached)return cached;
    return fetch(event.request).then(response=>{if(response&&response.ok&&new URL(event.request.url).origin===self.location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{})}return response}).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):undefined);
  }));
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
