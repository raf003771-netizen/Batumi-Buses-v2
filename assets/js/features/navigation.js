BusApp.navigation = (()=>{
  const S=BusApp.state;
  function setReady(){const b=document.getElementById('mobileSearchBtn'),t=document.getElementById('mobileSearchBtnText');b.classList.add('route-ready');t.textContent='В путь';}
  function resetReady(){const b=document.getElementById('mobileSearchBtn'),t=document.getElementById('mobileSearchBtnText');b.classList.remove('route-ready');t.textContent='Куда едем?';}
  async function start(){if(!S.routeReady||!S.selectedRouteId)return;await BusApp.gps.enableOrientation();S.journeyActive=true;S.followUser=true;document.getElementById('appSidebar').classList.remove('open');document.getElementById('journeyRouteLabel').innerHTML=`<img src="assets/icons/bus.png" alt="Автобус"><span>Маршрут ${S.selectedRouteName}</span>`;document.getElementById('journeyBar').hidden=false;document.getElementById('returnFollowBtn').hidden=true;document.getElementById('mobileSearchBtn').hidden=true;BusApp.gps.start(true);}
  function finish(){BusApp.routes.clear({preserveGps:true});BusApp.mapApi.clearSource('pedestrian-lines');BusApp.gps.keepAfterRoute();document.getElementById('journeyBar').hidden=true;document.getElementById('returnFollowBtn').hidden=true;document.getElementById('mobileSearchBtn').hidden=false;document.getElementById('appSidebar').classList.remove('open');resetReady();}
  function pauseFollow(){if(!S.journeyActive||!S.followUser)return;S.followUser=false;document.getElementById('returnFollowBtn').hidden=false;}
  function resumeFollow(){if(!S.journeyActive||!S.lastPosition)return;S.followUser=true;document.getElementById('returnFollowBtn').hidden=true;BusApp.mapApi.smartCenter(S.lastPosition.lon,S.lastPosition.lat,17);}
  function mobileButton(){
    if(S.routeReady){start();return;}
    const sheet=document.getElementById('appSidebar');
    const opening=!sheet.classList.contains('open');
    sheet.classList.toggle('open');
    if(opening&&S.lastPosition){
      S.pickMode='to-auto';
      BusApp.mapApi.map.getCanvas().style.cursor='crosshair';
    } else if(!opening&&S.pickMode==='to-auto'){
      S.pickMode=null;
      BusApp.mapApi.map.getCanvas().style.cursor='';
    }
  }
  function openJourneyPanel(){document.getElementById('appSidebar').classList.add('open');}
  return {setReady,resetReady,start,finish,pauseFollow,resumeFollow,mobileButton,openJourneyPanel};
})();
