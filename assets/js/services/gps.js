BusApp.gps = (() => {
  const S=BusApp.state;
  let arrowEl=null;

  function normalize(a){ return ((a%360)+360)%360; }
  function shortestDelta(from,to){ return ((to-from+540)%360)-180; }
  function smoothHeading(raw){
    raw=normalize(raw);
    if(!S.headingReady){S.heading=raw;S.headingReady=true;return raw;}
    const d=shortestDelta(S.heading,raw);
    if(Math.abs(d)<3) return S.heading;
    const limited=Math.max(-18,Math.min(18,d));
    S.heading=normalize(S.heading+limited*0.16);
    return S.heading;
  }
  function applyHeading(raw){
    if(!Number.isFinite(raw)) return;
    const h=smoothHeading(raw); S.lastHeadingAt=Date.now();
    if(arrowEl) arrowEl.style.transform=`translateX(-50%) rotate(${h.toFixed(1)}deg)`;
  }
  function orientationValue(e){
    if(Number.isFinite(e.webkitCompassHeading)) return e.webkitCompassHeading;
    if(e.absolute===true && Number.isFinite(e.alpha)) return 360-e.alpha;
    return null;
  }
  function onOrientation(e){ const h=orientationValue(e); if(h!==null) applyHeading(h); }
  async function enableOrientation(){
    if(S.orientationStarted) return;
    try{
      if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
        const result=await DeviceOrientationEvent.requestPermission(); if(result!=='granted') return;
      }
      addEventListener('deviceorientationabsolute',onOrientation,true);
      addEventListener('deviceorientation',onOrientation,true);
      S.orientationStarted=true;
    }catch(err){ console.warn('Компас недоступен',err); }
  }
  function createUserMarker(){
    const el=document.createElement('div'); el.className='user-location-marker';
    el.innerHTML='<div class="user-heading-arrow"></div><div class="user-location-dot"></div>';
    arrowEl=el.querySelector('.user-heading-arrow');
    S.userMarker=new maplibregl.Marker({element:el,anchor:'center',subpixelPositioning:true}).setLngLat([0,0]).addTo(BusApp.mapApi.map);
  }
  function updatePosition(pos){
    const {latitude:lat,longitude:lon,accuracy,heading,speed}=pos.coords;
    S.lastPosition={lat,lon,accuracy};
    if(!S.fromCoords || S.journeyActive) S.fromCoords={lat,lon};
    if(!S.userMarker) createUserMarker();
    S.userMarker.setLngLat([lon,lat]);
    BusApp.mapApi.setAccuracy(lon,lat,accuracy);
    if(Date.now()-S.lastHeadingAt>2200 && Number.isFinite(heading) && (speed||0)>1.2) applyHeading(heading);

    if(S.gpsCenterOnNextFix){
      S.gpsCenterOnNextFix=false;
      BusApp.mapApi.smartCenter(lon,lat,17,true);
    } else if(S.journeyActive && S.followUser){
      BusApp.mapApi.smartCenter(lon,lat,17,true);
    }
  }
  function onError(err){ console.warn('GPS:',err.message); }
  function start(center=false){
    if(!navigator.geolocation){alert(BusApp.i18n.t('geolocationUnsupported'));return;}
    enableOrientation();
    if(center){S.gpsCenterOnNextFix=true;S.followUser=true;document.getElementById('returnFollowBtn').hidden=true;}
    if(S.gpsWatchId===null){
      S.gpsWatchId=navigator.geolocation.watchPosition(updatePosition,onError,{enableHighAccuracy:true,maximumAge:1000,timeout:15000});
    } else if(S.lastPosition && center){
      S.gpsCenterOnNextFix=false;
      BusApp.mapApi.smartCenter(S.lastPosition.lon,S.lastPosition.lat,17,true);
    }
  }
  function keepAfterRoute(){ S.followUser=false; S.gpsCenterOnNextFix=false; }
  function setManualLocation(lon,lat){
    S.fromCoords={lat,lon}; S.lastPosition={lat,lon,accuracy:null}; S.followUser=true;
    if(!S.userMarker) createUserMarker();
    S.userMarker.setLngLat([lon,lat]);
    BusApp.mapApi.setAccuracy(lon,lat,0);
  }
  return {start,enableOrientation,keepAfterRoute,setManualLocation,applyHeading};
})();
