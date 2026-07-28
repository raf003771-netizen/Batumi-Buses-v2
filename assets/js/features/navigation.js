function startNavigation(){
  if(!selectedRouteId){ alert('Сначала выберите маршрут'); return; }
  navigationActive=true; autoFollowEnabled=true; userMovedMap=false;
  closeSidebar();
  document.getElementById('navigationRouteName').textContent=`🚌 Маршрут ${selectedRouteName}`;
  document.getElementById('navigationPanel').classList.add('visible');
  updateFollowButton();
  startGpsTracking(false);
  fitNavigationView();
}
function fitNavigationView(){
  const points=[];
  if(fromCoords) points.push([fromCoords.lat,fromCoords.lon]);
  if(toCoords) points.push([toCoords.lat,toCoords.lon]);
  if(points.length>=2) map.fitBounds(points,{padding:[55,55],maxZoom:16});
  else if(points.length===1) map.setView(points[0],16,{animate:true});
}
function resumeAutoFollow(){
  autoFollowEnabled=true; userMovedMap=false; updateFollowButton();
  if(fromCoords) map.setView([fromCoords.lat,fromCoords.lon],Math.max(map.getZoom(),16),{animate:true});
}
function updateFollowButton(){
  document.getElementById('returnFollowBtn').classList.toggle('visible',navigationActive&&!autoFollowEnabled);
}
function highlightNearestBus(){
  let nearestKey=null, min=Infinity;
  if(fromCoords){
    busDataMap.forEach((obj,key)=>{ const p=obj.marker.getLatLng(); const d=getDistanceFromLatLonInMeters(fromCoords.lat,fromCoords.lon,p.lat,p.lng); if(d<min){min=d;nearestKey=key;} });
  }
  busDataMap.forEach((obj,key)=>{ const el=obj.marker.getElement(); if(el) el.classList.toggle('nearest-bus-marker',key===nearestKey); });
}
function resetApplication(){
  stopGpsTracking(); cancelLiveRoute(); clearRoutePoints();
  selectedRouteName=''; navigationActive=false; autoFollowEnabled=false; userMovedMap=false;
  document.getElementById('navigationPanel').classList.remove('visible'); updateFollowButton();
  document.getElementById('searchInput').value=''; renderRouteList(allRoutesArray);
  map.setView(DEFAULT_CENTER,DEFAULT_ZOOM);
}
