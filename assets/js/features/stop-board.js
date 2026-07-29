BusApp.stopBoard = (()=>{
  const S=BusApp.state,t=k=>BusApp.i18n.t(k);let popup=null;const REFRESH_MS=15000,FETCH_TIMEOUT_MS=5500;
  const routeLabel=route=>BusApp.routes.label(route);
  function stopName(stop){const lang=BusApp.i18n.getLanguage();if(lang==='ka')return stop?.BusStopNameKA||stop?.BusStopNameGeoGps||stop?.BusStopNameEN||t('stopTitle');if(lang==='en'||lang==='uk')return stop?.BusStopNameEN||stop?.BusStopNameGeoGps||stop?.BusStopNameKA||t('stopTitle');return stop?.BusStopNameGeoGps||stop?.BusStopNameEN||stop?.BusStopNameKA||t('stopTitle');}
  function distanceMeters(aLat,aLon,bLat,bLon){const R=6371000,p=Math.PI/180,x=(bLat-aLat)*p,y=(bLon-aLon)*p,z=Math.sin(x/2)**2+Math.cos(aLat*p)*Math.cos(bLat*p)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));}
  function routeIdsForStop(stop){
    const keys=Object.keys(stop?.routes||{}).map(String),result=[];
    for(const key of keys){
      const route=S.allRoutes.find(r=>String(r._realId)===key||String(r.RouteIdGeoGps)===key);
      if(route&&!result.includes(route))result.push(route);
    }
    if(!result.length&&S.selectedRouteId){const selected=S.allRoutes.find(r=>String(r._realId)===String(S.selectedRouteId));if(selected)result.push(selected);}
    return result.slice(0,8);
  }
  function coordsOf(bus){
    const lat=Number(bus?.Lat??bus?.lat??bus?.Latitude??bus?.latitude??bus?.BusLatitude);
    const lon=Number(bus?.Lon??bus?.lon??bus?.Lng??bus?.lng??bus?.Longitude??bus?.longitude??bus?.BusLongitude);
    return {lat,lon};
  }
  function busEta(bus,stop){
    const {lat,lon}=coordsOf(bus),sLat=Number(stop.BusStopLatitude),sLon=Number(stop.BusStopLongitude);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(sLat)||!Number.isFinite(sLon))return null;
    const meters=distanceMeters(lat,lon,sLat,sLon);
    /* Средняя городская скорость с остановками: около 16 км/ч. */
    const minutes=Math.max(1,Math.min(180,Math.round(meters/267)));
    return{minutes,meters};
  }
  async function loadRouteArrivals(route,stop){
    const ids=[route?._realId,route?.RouteIdGeoGps].filter(Boolean);
    for(const id of ids){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
      try{
        const response=await fetch(`${BusApp.config.API_BASE}/api/getBusLocsOnRoute?routeId=${encodeURIComponent(id)}`,{signal:controller.signal,cache:'no-store'});
        if(!response.ok)continue;
        const json=await response.json(),raw=json?.data??json?.buses??json??[];
        const buses=Array.isArray(raw)?raw:Object.values(raw||{});
        const arrivals=buses.map(bus=>busEta(bus,stop)).filter(Boolean).sort((a,b)=>a.minutes-b.minutes).slice(0,3);
        if(arrivals.length)return arrivals;
      }catch(error){if(error?.name!=='AbortError')console.warn('Arrival load failed',id,error);}finally{clearTimeout(timer);}
    }
    return[];
  }
  const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  function shell(stop){return `<div class="stop-board" role="dialog" aria-label="${t('arrivals')}"><div class="stop-board-head"><div><div class="stop-board-kicker">${t('stopTitle')}</div><div class="stop-board-title">${esc(stopName(stop))}</div></div><button class="stop-board-close" type="button" aria-label="${t('close')}">×</button></div><div class="stop-board-status"><span class="stop-board-spinner"></span> ${t('calculatingArrivals')}</div></div>`;}
  function row(route,arrivals){const times=arrivals.length?arrivals.map((x,i)=>`<span class="arrival-chip ${i===0?'next':''}">${x.minutes<=1?t('now'):`${x.minutes} ${t('min')}`}</span>`).join(''):`<span class="arrival-empty">${t('noBusesNearby')}</span>`;return `<div class="stop-board-row"><span class="stop-route-number">${esc(routeLabel(route))}</span><div class="stop-arrivals">${times}</div></div>`;}
  async function refresh(stop){
    if(!popup||String(S.activeStopId)!==String(stop.BusStopId||stop._id))return;
    const routes=routeIdsForStop(stop),content=popup.getElement()?.querySelector('.stop-board-status');if(!content)return;
    if(!routes.length){content.innerHTML=`<div class="arrival-empty-block">${t('noRoutesStop')}</div>`;return;}
    const all=await Promise.all(routes.map(async route=>({route,arrivals:await loadRouteArrivals(route,stop)})));
    if(!popup||String(S.activeStopId)!==String(stop.BusStopId||stop._id))return;
    content.innerHTML=`<div class="stop-board-list">${all.map(x=>row(x.route,x.arrivals)).join('')}</div><div class="stop-board-note">${t('etaNote')}</div>`;
  }
  function open(stop){close();S.activeStop=stop;S.activeStopId=String(stop.BusStopId||stop._id||'');popup=new maplibregl.Popup({closeButton:false,closeOnClick:false,offset:16,maxWidth:'330px',className:'stop-board-popup'}).setLngLat([Number(stop.BusStopLongitude),Number(stop.BusStopLatitude)]).setHTML(shell(stop)).addTo(BusApp.mapApi.map);popup.getElement()?.querySelector('.stop-board-close')?.addEventListener('click',close);popup.on('close',()=>{if(popup)popup=null;clearTimer();S.activeStopId=null;S.activeStop=null;});refresh(stop);S.stopBoardTimer=setInterval(()=>refresh(stop),REFRESH_MS);}
  function refreshActive(){if(S.activeStop&&popup){const stop=S.activeStop;popup.setHTML(shell(stop));popup.getElement()?.querySelector('.stop-board-close')?.addEventListener('click',close);refresh(stop);}}
  function clearTimer(){if(S.stopBoardTimer){clearInterval(S.stopBoardTimer);S.stopBoardTimer=null;}}
  function close(){clearTimer();if(popup){const p=popup;popup=null;p.remove();}S.activeStopId=null;S.activeStop=null;}
  function bind(){BusApp.mapApi.map.on('click','route-stops-layer',event=>{event.originalEvent?.stopPropagation?.();const index=Number(event.features?.[0]?.properties?.stopIndex),stop=S.currentStops[index];if(stop)open(stop);});}
  return{bind,open,close,refreshActive};
})();
