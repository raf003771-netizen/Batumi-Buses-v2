BusApp.navigation = (()=>{
  const S=BusApp.state,t=k=>BusApp.i18n.t(k);
  function setReady(){const b=document.getElementById('mobileSearchBtn'),x=document.getElementById('mobileSearchBtnText');b.classList.add('route-ready');x.textContent=t('go');}
  function resetReady(){const b=document.getElementById('mobileSearchBtn'),x=document.getElementById('mobileSearchBtnText');b.classList.remove('route-ready');x.textContent=t('whereGo');}
  function refreshLabels(){S.routeReady?setReady():resetReady();if(S.journeyActive)document.getElementById('journeyRouteLabel').innerHTML=`<img src="assets/icons/bus.png" alt="${t('bus')}"><span>${t('route')} ${S.selectedRouteName}</span>`;}
  async function start(){if(!S.routeReady||!S.selectedRouteId)return;await BusApp.gps.enableOrientation();S.journeyActive=true;S.followUser=true;document.getElementById('appSidebar').classList.remove('open');refreshLabels();document.getElementById('journeyBar').hidden=false;BusApp.ui?.updateFollowButtonPosition?.();document.getElementById('returnFollowBtn').hidden=true;document.getElementById('mobileSearchBtn').hidden=true;BusApp.gps.start(true);}
  function finish(){BusApp.routes.clear({preserveGps:true});BusApp.mapApi.clearSource('pedestrian-lines');BusApp.gps.keepAfterRoute();document.getElementById('journeyBar').hidden=true;document.getElementById('returnFollowBtn').hidden=true;document.getElementById('mobileSearchBtn').hidden=false;document.getElementById('appSidebar').classList.remove('open');resetReady();}
  function pauseFollow(){if(S.gpsWatchId===null||!S.lastPosition)return;S.followUser=false;document.getElementById('returnFollowBtn').hidden=false;BusApp.ui?.updateFollowButtonPosition?.();}
  function resumeFollow(){if(!S.lastPosition)return;S.followUser=true;document.getElementById('returnFollowBtn').hidden=true;BusApp.mapApi.smartCenter(S.lastPosition.lon,S.lastPosition.lat,17,true);}
  function mobileButton(){if(S.routeReady){start();return;}const sheet=document.getElementById('appSidebar'),opening=!sheet.classList.contains('open');sheet.classList.toggle('open');if(opening&&S.lastPosition){S.pickMode='to-auto';BusApp.mapApi.map.getCanvas().style.cursor='crosshair';}else if(!opening&&S.pickMode==='to-auto'){S.pickMode=null;BusApp.mapApi.map.getCanvas().style.cursor='';}}
  function openJourneyPanel(){document.getElementById('appSidebar').classList.add('open');}
  return {setReady,resetReady,refreshLabels,start,finish,pauseFollow,resumeFollow,mobileButton,openJourneyPanel};
})();
