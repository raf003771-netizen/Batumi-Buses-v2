(()=>{
  BusApp.mapApi.init();
  BusApp.ui.bind();
  BusApp.i18n.apply();
  BusApp.mapApi.map.on('load',()=>{BusApp.ui.bindMap();BusApp.stopBoard.bind();});
  BusApp.routes.initDb();
  if('serviceWorker' in navigator){
    window.addEventListener('load',async()=>{
      try{
        const registration=await navigator.serviceWorker.register('./sw.js?v=final-fixed-20260729',{scope:'./',updateViaCache:'none'});
        registration.update().catch(()=>{});
        if(registration.waiting)registration.waiting.postMessage('SKIP_WAITING');
      }catch(error){console.warn('Service Worker registration failed:',error);}
    });
  }
})();
