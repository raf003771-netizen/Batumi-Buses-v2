BusApp.ui = (()=>{
  const S=BusApp.state, t=k=>BusApp.i18n.t(k);
  function updateFollowButtonPosition(){
    const button=document.getElementById('returnFollowBtn');
    if(!button)return;
    const margin=12, base=innerWidth<=768?166:176;
    let bottom=base;
    const candidates=[];
    const sidebar=document.getElementById('appSidebar');
    if(sidebar?.classList.contains('open'))candidates.push(sidebar);
    const geoMenu=document.getElementById('geoDropdownMenu');
    if(geoMenu&&getComputedStyle(geoMenu).display!=='none')candidates.push(geoMenu);
    const journey=document.getElementById('journeyBar');
    if(journey&&!journey.hidden)candidates.push(journey);
    for(const el of candidates){
      const rect=el.getBoundingClientRect();
      if(rect.width&&rect.height)bottom=Math.max(bottom,innerHeight-rect.top+margin);
    }
    document.documentElement.style.setProperty('--follow-bottom',`${Math.round(bottom)}px`);
  }
  function toggleSidebar(){document.getElementById('appSidebar').classList.toggle('open');requestAnimationFrame(updateFollowButtonPosition);}
  function pick(mode){S.pickMode=mode;document.getElementById('appSidebar').classList.remove('open');BusApp.mapApi.map.getCanvas().style.cursor='crosshair';}
  function clearPoints(){BusApp.places.clearDestination();BusApp.mapApi.clearSource('pedestrian-lines');S.toCoords=null;S.fromCoords=S.lastPosition?{lat:S.lastPosition.lat,lon:S.lastPosition.lon}:null;document.getElementById('fromInput').value=S.lastPosition?t('gpsPosition'):'';document.getElementById('toInput').value='';document.getElementById('transitResultsContainer').style.display='none';if(S.selectedRouteId)BusApp.routes.clear({preserveGps:true});BusApp.navigation.resetReady();}
  function bind(){
    document.getElementById('languageSelect').onchange=e=>BusApp.i18n.setLanguage(e.target.value);
    document.getElementById('sidebarToggle').onclick=toggleSidebar;document.getElementById('sidebarClose').onclick=toggleSidebar;
    document.getElementById('mobileSearchBtn').onclick=BusApp.navigation.mobileButton;
    document.getElementById('finishRouteBtn').onclick=BusApp.navigation.finish;document.getElementById('journeyRouteLabel').onclick=BusApp.navigation.openJourneyPanel;document.getElementById('returnFollowBtn').onclick=BusApp.navigation.resumeFollow;
    document.getElementById('liveRouteResetBtn').onclick=BusApp.routes.clearLiveRoute;
    document.getElementById('fromInput').onclick=()=>pick('from');document.getElementById('pickToBtn').onclick=()=>pick('to');
    document.getElementById('toInput').oninput=e=>{if(S.pickMode==='to-auto'){S.pickMode=null;BusApp.mapApi.map.getCanvas().style.cursor='';}BusApp.places.search(e.target.value);};
    document.getElementById('placesResultsList').onclick=e=>{const b=e.target.closest('[data-place-index]');if(b)BusApp.places.select(+b.dataset.placeIndex);};
    document.getElementById('myGpsBtn').onclick=()=>{BusApp.gps.start(true);document.getElementById('fromInput').value=t('gpsPosition');};
    document.getElementById('findTransitBtn').onclick=BusApp.routes.findTransit;document.getElementById('clearPointsBtn').onclick=clearPoints;
    document.getElementById('searchInput').oninput=e=>BusApp.routes.filter(e.target.value);document.getElementById('clearSearchBtn').onclick=()=>{document.getElementById('searchInput').value='';BusApp.routes.renderList(S.allRoutes);};
    document.getElementById('dropdownBody').onclick=e=>{const b=e.target.closest('[data-route-id]');if(b)BusApp.routes.select(b.dataset.routeId);};
    document.getElementById('transitResultsList').onclick=e=>{const c=e.target.closest('[data-transit-index]');if(c)BusApp.routes.selectTransit(+c.dataset.transitIndex);};
    document.getElementById('geoBtn').onclick=()=>{const m=document.getElementById('geoDropdownMenu');m.style.display=m.style.display==='flex'?'none':'flex';requestAnimationFrame(updateFollowButtonPosition);};
    document.getElementById('gpsOptionBtn').onclick=()=>{document.getElementById('geoDropdownMenu').style.display='none';updateFollowButtonPosition();BusApp.gps.start(true);};
    document.getElementById('manualOptionBtn').onclick=()=>{document.getElementById('geoDropdownMenu').style.display='none';updateFollowButtonPosition();pick('manual');};
    document.addEventListener('click',e=>{const box=document.getElementById('placesResultsContainer');if(!e.target.closest('#toInput')&&!e.target.closest('#placesResultsContainer'))box.style.display='none';});
    addEventListener('resize',updateFollowButtonPosition,{passive:true});
    new MutationObserver(updateFollowButtonPosition).observe(document.getElementById('appSidebar'),{attributes:true,attributeFilter:['class']});
    updateFollowButtonPosition();
  }
  function bindMap(){
    const map=BusApp.mapApi.map;
    map.on('click',e=>{
      if(S.pickMode){const {lng,lat}=e.lngLat;const mode=S.pickMode;if(mode==='to'||mode==='to-auto'){BusApp.places.setDestination(lng,lat,t('pointOnMap'));document.getElementById('toInput').value=`${lat.toFixed(4)}, ${lng.toFixed(4)}`;}else{BusApp.gps.setManualLocation(lng,lat);S.fromCoords={lat,lon:lng};document.getElementById('fromInput').value=`${lat.toFixed(4)}, ${lng.toFixed(4)}`;}S.pickMode=null;map.getCanvas().style.cursor='';if(mode!=='to-auto')document.getElementById('appSidebar').classList.add('open');}
    });
    ['dragstart','zoomstart','rotatestart','pitchstart'].forEach(ev=>map.on(ev,e=>{if(e.originalEvent)BusApp.navigation.pauseFollow();}));
  }
  return {bind,bindMap,toggleSidebar,updateFollowButtonPosition};
})();
