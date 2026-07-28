const CACHE='batumi-buses-v3-maplibre-3';
const APP=[
  './','./index.html','./manifest.json',
  './assets/styles/base.css','./assets/styles/legacy.css','./assets/styles/components.css',
  './assets/js/core/config.js','./assets/js/core/state.js','./assets/js/core/map.js',
  './assets/js/services/gps.js','./assets/js/services/places.js',
  './assets/js/features/buses.js','./assets/js/features/routes.js','./assets/js/features/navigation.js',
  './assets/js/ui/ui.js','./assets/js/app.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/geolocation.svg','./assets/icons/map-pick.svg'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP.filter(Boolean))).catch(()=>{})).then(()=>self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))).then(()=>self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin){e.respondWith(fetch(e.request));return;}
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
