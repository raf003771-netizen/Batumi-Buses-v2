function locateUserForRoute() {
  startGpsTracking(true);
}
function locateUser() {
  startGpsTracking(true);
}
function startGpsTracking(centerNow = false) {
  if (!navigator.geolocation) { alert('Геолокация не поддерживается вашим браузером'); return; }
  if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
  gpsWatchId = navigator.geolocation.watchPosition(position => {
    const { latitude: lat, longitude: lon, accuracy, heading } = position.coords;
    fromCoords = { lat, lon };
    if (Number.isFinite(heading)) deviceHeading = heading;
    setUserLocationMarker(lat, lon, accuracy, true);
    const input=document.getElementById('fromInput'); if(input) input.value='Мое GPS положение';
    if ((centerNow || autoFollowEnabled) && !userMovedMap) map.setView([lat, lon], Math.max(map.getZoom(), 16), { animate: true });
    centerNow = false;
    highlightNearestBus();
  }, () => alert('Доступ к GPS заблокирован. Вы можете указать позицию вручную.'),
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 });
  requestHeadingPermission();
}
function stopGpsTracking(){ if(gpsWatchId!==null){ navigator.geolocation.clearWatch(gpsWatchId); gpsWatchId=null; } }
function createUserIcon(){
  return L.divIcon({ className:'user-heading-marker', iconSize:[36,36], iconAnchor:[18,18],
    html:`<div class="user-heading-wrap"><div class="user-heading-arrow" style="transform:rotate(${deviceHeading}deg)"></div><div class="user-heading-dot"></div></div>` });
}
function setUserLocationMarker(lat, lon, accuracy = null, isGps = false) {
  fromCoords={lat,lon};
  if(!userMarker){
    userMarker=L.marker([lat,lon],{icon:createUserIcon(),draggable:!isGps}).addTo(map);
    userMarker.bindPopup(isGps?'Ваше GPS-положение':'Начальная точка');
    userMarker.on('dragend',()=>{const p=userMarker.getLatLng();fromCoords={lat:p.lat,lon:p.lng};});
  } else { userMarker.setLatLng([lat,lon]); userMarker.setIcon(createUserIcon()); userMarker.setPopupContent(isGps?'Ваше GPS-положение':'Начальная точка'); }
  if(isGps&&accuracy!==null){
    if(!userAccuracyCircle) userAccuracyCircle=L.circle([lat,lon],{radius:accuracy,color:'#3498db',fillColor:'#3498db',fillOpacity:.15,weight:1}).addTo(map);
    else { userAccuracyCircle.setLatLng([lat,lon]); userAccuracyCircle.setRadius(accuracy); }
  } else if(userAccuracyCircle){ userAccuracyCircle.remove(); userAccuracyCircle=null; }
}
async function requestHeadingPermission(){
  if(headingPermissionRequested) return; headingPermissionRequested=true;
  try {
    if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function')
      await DeviceOrientationEvent.requestPermission();
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  } catch(e){ console.warn('Компас недоступен',e); }
}
function handleOrientation(e){
  let h = Number.isFinite(e.webkitCompassHeading) ? e.webkitCompassHeading : (Number.isFinite(e.alpha) ? 360-e.alpha : null);
  if(h===null) return; deviceHeading=(h+360)%360; if(userMarker) userMarker.setIcon(createUserIcon());
}
