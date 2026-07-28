BusApp.routes = (()=>{
  const S=BusApp.state;
  const label=r=>r?.RouteNameKA||r?.RouteNameGeoGps||r?.RouteNameEN||r?.RouteIdGeoGps||'Маршрут';
  const dist=(a,b,c,d)=>{const R=6371000,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,z=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));};
  async function initDb(){try{const r=await fetch(`${BusApp.config.API_BASE}/api/getDbData`);if(!r.ok)throw new Error();const j=await r.json();S.db=j.data||j;S.allRoutes=Object.entries(S.db.routesNames||{}).map(([k,v])=>({...v,_realId:v._id||v.RouteId||k})).sort((a,b)=>(a.RouteSortOrder??0)-(b.RouteSortOrder??0));renderList(S.allRoutes);}catch(e){console.error(e);document.getElementById('dropdownBody').innerHTML='<div class="dd-msg">Не удалось загрузить маршруты</div>';}}
  function renderList(list){const el=document.getElementById('dropdownBody');el.innerHTML=list.length?list.map(r=>`<li><button class="route-item ${S.selectedRouteId===r._realId?'active':''}" data-route-id="${r._realId}"><span class="route-item-icon"><img src="assets/icons/bus.png" alt="Автобус"></span><span class="route-item-label">Маршрут </span><span class="route-item-number">${label(r)}</span><span class="route-item-arrow"><img src="assets/icons/chevron-right.png" alt="Открыть"></span></button></li>`).join(''):'<div class="dd-msg">Ничего не найдено</div>';}
  function filter(q){q=q.trim().toLowerCase();renderList(q?S.allRoutes.filter(r=>label(r).toLowerCase().includes(q)):S.allRoutes);}
  function stopsFor(route){if(!route)return[];const id=route._realId,g=route.RouteIdGeoGps;return Object.values(S.db?.busStops||{}).filter(s=>s.routes&&(s.routes[id]||(g&&s.routes[g])));}
  function routeObj(id){return S.allRoutes.find(r=>r._realId===id)||S.db?.routesNames?.[id];}
  function routeCoords(id){const r=routeObj(id),g=r?.RouteIdGeoGps;return S.db?.routeCoordinatesGrouped?.[id]||(g?S.db?.routeCoordinatesGrouped?.[g]:null)||[];}
  function showSelectedRoute(ids){
    const lines=(ids||[]).map(routeCoords).filter(x=>x.length);
    BusApp.mapApi.setRouteLines(lines);
    const first=routeObj(ids?.[0]);
    BusApp.mapApi.setStops(stopsFor(first));
    if(lines.length) BusApp.mapApi.fitCoordinates(lines.flat());
  }
  function select(id,{fit=true}={}){
    S.selectedRouteId=id;const r=routeObj(id);S.selectedRouteName=label(r);S.routeReady=true;
    document.getElementById('activeRouteStatusContainer').style.display='block';document.getElementById('activeRouteNameDisplay').textContent=`Маршрут ${S.selectedRouteName}`;document.getElementById('liveBadge').style.display='flex';document.getElementById('legendBox').style.display='block';
    const coords=routeCoords(id);BusApp.mapApi.setRouteLine(coords);BusApp.mapApi.setStops(stopsFor(r));if(fit&&coords.length)BusApp.mapApi.fitCoordinates(coords);
    BusApp.buses.start();renderList(S.allRoutes);BusApp.navigation.setReady();
  }
  function closest(near,r){const ids=[r._realId,r.RouteIdGeoGps];let best=null;for(const x of near){if(x.stop.routes&&(x.stop.routes[ids[0]]||x.stop.routes[ids[1]])&&(!best||x.d<best.d))best=x;}return best;}
  function findTransit(){
    if(!S.fromCoords||!S.toCoords){alert('Укажите точку отправления и назначения');return;}if(!S.db?.busStops){alert('Остановки еще загружаются');return;}
    const nearA=[],nearB=[];for(const stop of Object.values(S.db.busStops)){const a=dist(S.fromCoords.lat,S.fromCoords.lon,+stop.BusStopLatitude,+stop.BusStopLongitude),b=dist(S.toCoords.lat,S.toCoords.lon,+stop.BusStopLatitude,+stop.BusStopLongitude);if(a<=800)nearA.push({stop,d:a});if(b<=800)nearB.push({stop,d:b});}
    const direct=[];for(const r of S.allRoutes){const a=closest(nearA,r),b=closest(nearB,r);if(a&&b){const w1=Math.round(a.d),w2=Math.round(b.d),t1=Math.max(1,Math.round(w1/80)),t2=Math.max(1,Math.round(w2/80)),bus=Math.max(5,Math.round(dist(+a.stop.BusStopLatitude,+a.stop.BusStopLongitude,+b.stop.BusStopLatitude,+b.stop.BusStopLongitude)/250)+3);direct.push({routeIds:[r._realId],routeNames:[label(r)],transfers:0,estimatedTime:t1+t2+bus,startStop:a.stop,endStop:b.stop,walkDist1:w1,walkTime1:t1,walkDist2:w2,walkTime2:t2});}}
    const by=new Map(S.allRoutes.map(r=>[r._realId,stopsFor(r)])),transfer=[];
    for(const aR of S.allRoutes){const a=closest(nearA,aR);if(!a)continue;const aStops=by.get(aR._realId)||[];for(const bR of S.allRoutes){if(aR._realId===bR._realId)continue;const b=closest(nearB,bR);if(!b)continue;const bIds=new Set((by.get(bR._realId)||[]).map(x=>x.BusStopId));const tr=aStops.find(x=>bIds.has(x.BusStopId));if(!tr)continue;const w1=Math.round(a.d),w2=Math.round(b.d),t1=Math.max(1,Math.round(w1/80)),t2=Math.max(1,Math.round(w2/80));transfer.push({routeIds:[aR._realId,bR._realId],routeNames:[label(aR),label(bR)],transfers:1,estimatedTime:t1+t2+12,startStop:a.stop,endStop:b.stop,transferStop:tr,walkDist1:w1,walkTime1:t1,walkDist2:w2,walkTime2:t2});}}
    renderTransit(direct.sort((a,b)=>a.estimatedTime-b.estimatedTime).concat(transfer.sort((a,b)=>a.estimatedTime-b.estimatedTime).slice(0,5)));
  }
  function renderTransit(v){const c=document.getElementById('transitResultsContainer'),l=document.getElementById('transitResultsList');window._transit=v;l.innerHTML=v.length?v.map((x,i)=>`<div class="transit-card" data-transit-index="${i}"><div class="transit-header"><div class="transit-badges">${x.routeNames.map(n=>`<span class="badge-route">Маршрут ${n}</span>`).join(' ➔ ')}<span class="badge-transfer ${x.transfers?'trans-1':''}">${x.transfers?'С пересадкой':'Прямой'}</span></div><span class="transit-time">~${x.estimatedTime} мин</span></div><div class="transit-details"><img class="text-icon" src="assets/icons/walk.png" alt="Пешком"> До остановки: ${x.walkDist1} м (~${x.walkTime1} мин)</div>${x.transfers?`<div class="transit-details"><img class="text-icon" src="assets/icons/transfer.png" alt="Пересадка"> Пересадка: ${x.transferStop.BusStopNameKA||x.transferStop.BusStopNameGeoGps||'остановка'}</div>`:''}<div class="transit-details"><img class="text-icon" src="assets/icons/walk.png" alt="Пешком"> После остановки: ${x.walkDist2} м (~${x.walkTime2} мин)</div></div>`).join(''):'<div class="dd-msg">Маршруты не найдены</div>';c.style.display='block';}
  function selectTransit(i){
    const v=window._transit?.[i];if(!v)return;
    S.selectedTransitVariant=v;
    select(v.routeIds[0],{fit:false});
    showSelectedRoute(v.routeIds);
    const lines=[];
    if(S.fromCoords)lines.push([[S.fromCoords.lon,S.fromCoords.lat],[+v.startStop.BusStopLongitude,+v.startStop.BusStopLatitude]]);
    if(S.toCoords)lines.push([[+v.endStop.BusStopLongitude,+v.endStop.BusStopLatitude],[S.toCoords.lon,S.toCoords.lat]]);
    BusApp.mapApi.setPedestrianLines(lines);
    BusApp.navigation.setReady();
  }
  function clearLiveRoute(){
    S.selectedRouteId=null;S.selectedRouteName='';S.routeReady=false;
    BusApp.buses.clear();BusApp.mapApi.clearLiveRouteVisuals();
    document.getElementById('activeRouteStatusContainer').style.display='none';document.getElementById('liveBadge').style.display='none';document.getElementById('legendBox').style.display='none';
    renderList(S.allRoutes);BusApp.navigation.resetReady();
  }
  function clear({preserveGps=true}={}){
    S.selectedRouteId=null;S.selectedRouteName='';S.routeReady=false;S.journeyActive=false;S.followUser=false;S.selectedTransitVariant=null;
    BusApp.buses.clear();BusApp.mapApi.clearRouteVisuals();BusApp.places.clearDestination();
    S.fromCoords=preserveGps&&S.lastPosition?{lat:S.lastPosition.lat,lon:S.lastPosition.lon}:null;S.toCoords=null;
    document.getElementById('fromInput').value=preserveGps&&S.lastPosition?'Мое GPS положение':'';document.getElementById('toInput').value='';document.getElementById('transitResultsContainer').style.display='none';document.getElementById('transitResultsList').innerHTML='';
    document.getElementById('activeRouteStatusContainer').style.display='none';document.getElementById('liveBadge').style.display='none';document.getElementById('legendBox').style.display='none';
    renderList(S.allRoutes);
  }
  return {initDb,renderList,filter,select,findTransit,selectTransit,clearLiveRoute,clear,label};
})();
