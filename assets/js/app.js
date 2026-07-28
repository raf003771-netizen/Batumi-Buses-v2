(()=>{
  BusApp.mapApi.init();
  BusApp.ui.bind();
  BusApp.mapApi.map.on('load',()=>BusApp.ui.bindMap());
  BusApp.routes.initDb();
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
})();
