BusApp.ui = (()=>{
  const S=BusApp.state;
  function toggleSidebar(){document.getElementById('appSidebar').classList.toggle('open');}
  function pick(mode){S.pickMode=mode;document.getElementById('appSidebar').classList.remove('open');BusApp.mapApi.map.getCanvas().style.cursor='crosshair';}
  function clearPoints(){BusApp.places.clearDestination();BusApp.mapApi.clearSource('pedestrian-lines');S.toCoords=null;S.fromCoords=S.lastPosition?{lat:S.lastPosition.lat,lon:S.lastPosition.lon}:null;document.getElementById('fromInput').value=S.lastPosition?'Мое GPS положение':'';document.getElementById('toInput').value='';document.getElementById('transitResultsContainer').style.display='none';if(S.selectedRouteId)BusApp.routes.clear({preserveGps:true});BusApp.navigation.resetReady();}
  function bind(){
    document.getElementById('sidebarToggle').onclick=toggleSidebar;document.getElementById('sidebarClose').onclick=toggleSidebar;
    document.getElementById('mobileSearchBtn').onclick=BusApp.navigation.mobileButton;
    document.getElementById('finishRouteBtn').onclick=BusApp.navigation.finish;document.getElementById('returnFollowBtn').onclick=BusApp.navigation.resumeFollow;
    document.getElementById('liveRouteResetBtn').onclick=BusApp.routes.clearLiveRoute;
    document.getElementById('fromInput').onclick=()=>pick('from');document.getElementById('pickToBtn').onclick=()=>pick('to');
    document.getElementById('toInput').oninput=e=>BusApp.places.search(e.target.value);
    document.getElementById('placesResultsList').onclick=e=>{const b=e.target.closest('[data-place-index]');if(b)BusApp.places.select(+b.dataset.placeIndex);};
    document.getElementById('myGpsBtn').onclick=()=>{BusApp.gps.start(true);document.getElementById('fromInput').value='Мое GPS положение';};
    document.getElementById('findTransitBtn').onclick=BusApp.routes.findTransit;document.getElementById('clearPointsBtn').onclick=clearPoints;
    document.getElementById('searchInput').oninput=e=>BusApp.routes.filter(e.target.value);document.getElementById('clearSearchBtn').onclick=()=>{document.getElementById('searchInput').value='';BusApp.routes.renderList(S.allRoutes);};
    document.getElementById('dropdownBody').onclick=e=>{const b=e.target.closest('[data-route-id]');if(b)BusApp.routes.select(b.dataset.routeId);};
    document.getElementById('transitResultsList').onclick=e=>{const c=e.target.closest('[data-transit-index]');if(c)BusApp.routes.selectTransit(+c.dataset.transitIndex);};
    document.getElementById('geoBtn').onclick=()=>{const m=document.getElementById('geoDropdownMenu');m.style.display=m.style.display==='flex'?'none':'flex';};
    document.getElementById('gpsOptionBtn').onclick=()=>{document.getElementById('geoDropdownMenu').style.display='none';BusApp.gps.start(true);};
    document.getElementById('manualOptionBtn').onclick=()=>{document.getElementById('geoDropdownMenu').style.display='none';pick('manual');};
    document.addEventListener('click',e=>{const box=document.getElementById('placesResultsContainer');if(!e.target.closest('#toInput')&&!e.target.closest('#placesResultsContainer'))box.style.display='none';});
  }
  function bindMap(){
    const map=BusApp.mapApi.map;
    map.on('click',e=>{
      if(S.pickMode){const {lng,lat}=e.lngLat;if(S.pickMode==='to'){BusApp.places.setDestination(lng,lat,'Точка на карте');document.getElementById('toInput').value=`${lat.toFixed(4)}, ${lng.toFixed(4)}`;}else{BusApp.gps.setManualLocation(lng,lat);S.fromCoords={lat,lon:lng};document.getElementById('fromInput').value=`${lat.toFixed(4)}, ${lng.toFixed(4)}`;}S.pickMode=null;map.getCanvas().style.cursor='';document.getElementById('appSidebar').classList.add('open');return;}
      const f=map.queryRenderedFeatures(e.point,{layers:['route-stops-layer']})[0];if(f)showStopPopup(f,e.lngLat);
    });
    ['dragstart','zoomstart','rotatestart','pitchstart'].forEach(ev=>map.on(ev,e=>{if(e.originalEvent)BusApp.navigation.pauseFollow();}));
  }
  async function showStopPopup(feature,lngLat){
    const p=feature.properties||{},name=p.BusStopNameKA||p.BusStopNameGeoGps||'Остановка';
    const popup=new maplibregl.Popup({offset:10}).setLngLat(lngLat).setHTML(`<div style="min-width:190px"><b>${name}</b><br><span style="font-size:11px;color:#718096">Остановка №${p.BusStopNumber||''}</span><div style="margin-top:7px;font-size:12px;font-weight:700">Прибытие автобусов:</div><div id="stopArrival">Загрузка...</div></div>`).addTo(BusApp.mapApi.map);
    try{const r=await fetch(`${BusApp.config.API_BASE}/api/getBusLocsOnRoute?routeId=${encodeURIComponent(S.selectedRouteId)}`),j=await r.json(),buses=j.data||j||[];let text='Автобусы не на линии';if(buses.length){let min=Infinity;for(const b of buses){const dx=(+b.Lat-+p.BusStopLatitude)*111000,dy=(+b.Lon-+p.BusStopLongitude)*83000;min=Math.min(min,Math.hypot(dx,dy));}text=`~${Math.max(1,Math.round(min/250))} мин (${Math.round(min)} м)`;}const el=document.getElementById('stopArrival');if(el)el.innerHTML=`<b>🚌 ${S.selectedRouteName}</b> — ${text}`;}catch{const el=document.getElementById('stopArrival');if(el)el.textContent='Ошибка связи';}
  }
  return {bind,bindMap,toggleSidebar};
})();
