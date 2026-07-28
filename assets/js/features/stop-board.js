BusApp.stopBoard = (() => {
  const S = BusApp.state;
  let popup = null;
  const REFRESH_MS = 15000;

  const routeLabel = route => BusApp.routes.label(route);
  const stopName = stop => stop?.BusStopNameKA || stop?.BusStopNameGeoGps || stop?.BusStopNameEN || 'Остановка';

  function distanceMeters(aLat,aLon,bLat,bLon){
    const R=6371000,p=Math.PI/180;
    const x=(bLat-aLat)*p,y=(bLon-aLon)*p;
    const z=Math.sin(x/2)**2+Math.cos(aLat*p)*Math.cos(bLat*p)*Math.sin(y/2)**2;
    return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));
  }

  function routeIdsForStop(stop){
    const keys = Object.keys(stop?.routes || {});
    const result=[];
    for(const r of S.allRoutes){
      if(keys.includes(String(r._realId)) || keys.includes(String(r.RouteIdGeoGps))) result.push(r);
    }
    if(!result.length && S.selectedRouteId){
      const selected=S.allRoutes.find(r=>String(r._realId)===String(S.selectedRouteId));
      if(selected) result.push(selected);
    }
    return result.slice(0,8);
  }

  function busEta(bus, stop){
    const lat=Number(bus.Lat),lon=Number(bus.Lon);
    const sLat=Number(stop.BusStopLatitude),sLon=Number(stop.BusStopLongitude);
    if(!Number.isFinite(lat+lon+sLat+sLon)) return null;
    const meters=distanceMeters(lat,lon,sLat,sLon);
    // Городская средняя скорость с учётом остановок: около 16 км/ч.
    const minutes=Math.max(1,Math.round(meters/267));
    return {minutes,meters,name:bus.Name||bus.BusId||'Автобус',status:bus.Status};
  }

  async function loadRouteArrivals(route,stop){
    const id=route._realId;
    try{
      const response=await fetch(`${BusApp.config.API_BASE}/api/getBusLocsOnRoute?routeId=${encodeURIComponent(id)}`);
      if(!response.ok) throw new Error('HTTP '+response.status);
      const json=await response.json();
      const buses=json.data||json||[];
      return buses.map(bus=>busEta(bus,stop)).filter(Boolean).sort((a,b)=>a.minutes-b.minutes).slice(0,3);
    }catch(error){
      console.warn('Не удалось загрузить прибытия',id,error);
      return [];
    }
  }

  function shell(stop){
    return `<div class="stop-board" role="dialog" aria-label="Прибытие автобусов">
      <div class="stop-board-head">
        <div><div class="stop-board-kicker">Остановка</div><div class="stop-board-title">${escapeHtml(stopName(stop))}</div></div>
        <button class="stop-board-close" type="button" aria-label="Закрыть">×</button>
      </div>
      <div class="stop-board-status"><span class="stop-board-spinner"></span> Загружаем автобусы…</div>
    </div>`;
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function row(route,arrivals){
    const times=arrivals.length
      ? arrivals.map((x,index)=>`<span class="arrival-chip ${index===0?'next':''}">${x.minutes<=1?'сейчас':`${x.minutes} мин`}</span>`).join('')
      : '<span class="arrival-empty">нет данных</span>';
    return `<div class="stop-board-row"><span class="stop-route-number">${escapeHtml(routeLabel(route))}</span><div class="stop-arrivals">${times}</div></div>`;
  }

  async function refresh(stop){
    if(!popup || String(S.activeStopId)!==String(stop.BusStopId||stop._id)) return;
    const routes=routeIdsForStop(stop);
    const content=popup.getElement()?.querySelector('.stop-board-status');
    if(!content) return;
    if(!routes.length){ content.innerHTML='<div class="arrival-empty-block">Для этой остановки маршруты не найдены</div>'; return; }
    const all=await Promise.all(routes.map(async route=>({route,arrivals:await loadRouteArrivals(route,stop)})));
    if(!popup || String(S.activeStopId)!==String(stop.BusStopId||stop._id)) return;
    content.innerHTML=`<div class="stop-board-list">${all.map(x=>row(x.route,x.arrivals)).join('')}</div><div class="stop-board-note">Примерное прибытие по текущему GPS автобусов</div>`;
  }

  function open(stop){
    close();
    S.activeStopId=String(stop.BusStopId||stop._id||'');
    popup=new maplibregl.Popup({closeButton:false,closeOnClick:false,offset:16,maxWidth:'330px',className:'stop-board-popup'})
      .setLngLat([Number(stop.BusStopLongitude),Number(stop.BusStopLatitude)])
      .setHTML(shell(stop))
      .addTo(BusApp.mapApi.map);
    popup.getElement()?.querySelector('.stop-board-close')?.addEventListener('click',close);
    popup.on('close',()=>{ if(popup){popup=null;} clearTimer(); S.activeStopId=null; });
    refresh(stop);
    S.stopBoardTimer=setInterval(()=>refresh(stop),REFRESH_MS);
  }

  function clearTimer(){ if(S.stopBoardTimer){clearInterval(S.stopBoardTimer);S.stopBoardTimer=null;} }
  function close(){ clearTimer(); if(popup){const p=popup;popup=null;p.remove();} S.activeStopId=null; }

  function bind(){
    BusApp.mapApi.map.on('click','route-stops-layer',event=>{
      event.originalEvent?.stopPropagation?.();
      const index=Number(event.features?.[0]?.properties?.stopIndex);
      const stop=S.currentStops[index];
      if(stop) open(stop);
    });
  }

  return {bind,open,close};
})();
