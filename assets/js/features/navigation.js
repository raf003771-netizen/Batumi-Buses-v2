BusApp.navigation = (()=>{
  const S=BusApp.state;
  function setReady(){const b=document.getElementById('mobileSearchBtn'),t=document.getElementById('mobileSearchBtnText');b.classList.add('route-ready');t.textContent='В путь';}
  function resetReady(){const b=document.getElementById('mobileSearchBtn'),t=document.getElementById('mobileSearchBtnText');b.classList.remove('route-ready');t.textContent='Куда едем?';}
  async function start(){if(!S.routeReady||!S.selectedRouteId)return;await BusApp.gps.enableOrientation();S.journeyActive=true;S.followUser=true;document.getElementById('appSidebar').classList.remove('open');document.getElementById('journeyRouteLabel').textContent=`🚌 Маршрут ${S.selectedRouteName}`;document.getElementById('journeyBar').hidden=false;document.getElementById('returnFollowBtn').hidden=true;document.getElementById('mobileSearchBtn').hidden=true;BusApp.gps.start(true);}
  function finish(){BusApp.routes.clear({preserveGps:true});BusApp.gps.keepAfterRoute();document.getElementById('journeyBar').hidden=true;document.getElementById('returnFollowBtn').hidden=true;document.getElementById('mobileSearchBtn').hidden=false;document.getElementById('appSidebar').classList.remove('open');resetReady();}
  function pauseFollow(){if(!S.journeyActive||!S.followUser)return;S.followUser=false;document.getElementById('returnFollowBtn').hidden=false;}
  function resumeFollow(){if(!S.journeyActive||!S.lastPosition)return;S.followUser=true;document.getElementById('returnFollowBtn').hidden=true;BusApp.mapApi.smartCenter(S.lastPosition.lon,S.lastPosition.lat,17);}
  function mobileButton(){if(S.routeReady)start();else document.getElementById('appSidebar').classList.toggle('open');}
  return {setReady,resetReady,start,finish,pauseFollow,resumeFollow,mobileButton};
})();
