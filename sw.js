const CACHE_NAME='batumi-buses-final-fixed-20260729';
const APP_SHELL=[
  './index.html','./manifest.json',
  './assets/styles/base.css','./assets/styles/legacy.css','./assets/styles/components.css',
  './assets/js/core/config.js','./assets/js/core/state.js','./assets/js/core/i18n.js','./assets/js/core/map.js',
  './assets/js/services/gps.js','./assets/js/services/places.js',
  './assets/js/features/buses.js','./assets/js/features/stop-board.js','./assets/js/features/routes.js','./assets/js/features/navigation.js',
  './assets/js/ui/ui.js','./assets/js/app.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/geolocation.png','./assets/icons/map-pick.png',
  './assets/icons/from-pin.png','./assets/icons/destination-flag.png','./assets/icons/search.png','./assets/icons/close.png',
  './assets/icons/menu.png','./assets/icons/bus.png','./assets/icons/manual-pick.png','./assets/icons/return-follow.png',
  './assets/icons/walk.png','./assets/icons/transfer.png','./assets/icons/chevron-right.png'
];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME);await Promise.allSettled(APP_SHELL.map(url=>cache.add(url)));await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));await self.clients.claim();})()));
async function networkFirst(request){try{const response=await fetch(request,{cache:'no-store'});if(response&&response.ok){const cache=await caches.open(CACHE_NAME);await cache.put('./index.html',response.clone());}return response;}catch(_){return(await caches.match('./index.html'))||Response.error();}}
async function staleWhileRevalidate(request){const cached=await caches.match(request);const network=fetch(request).then(async response=>{if(response&&response.ok&&response.type==='basic'){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}return response;}).catch(()=>null);return cached||(await network)||Response.error();}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(request.mode==='navigate'){event.respondWith(networkFirst(request));return;}event.respondWith(staleWhileRevalidate(request));});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
