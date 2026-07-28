BusApp.buses = (()=>{
  const S=BusApp.state;
  function makeElement(status){const el=document.createElement('div');el.className='bus-marker';el.style.background=status===1?'#2ecc71':'#e74c3c';el.textContent='🚌';return el;}
  async function load(){
    if(!S.selectedRouteId)return;
    try{
      const r=await fetch(`${BusApp.config.API_BASE}/api/getBusLocsOnRoute?routeId=${encodeURIComponent(S.selectedRouteId)}`);if(!r.ok)throw new Error();
      const j=await r.json(),data=j.data||j||[];update(data);document.getElementById('sidebarBusCount').textContent=data.length;
    }catch(e){console.error('Ошибка загрузки автобусов',e);}
  }
  function update(data){
    const seen=new Set(),now=performance.now(),duration=BusApp.config.BUS_REFRESH_MS;
    data.forEach(b=>{
      const key=String(b.Name||b.BusId||`${b.Lat}_${b.Lon}`),lat=+b.Lat,lon=+b.Lon;seen.add(key);let obj=S.busMarkers.get(key);
      if(!obj){
        const el=makeElement(b.Status);const marker=new maplibregl.Marker({element:el,anchor:'center',subpixelPositioning:true}).setLngLat([lon,lat]).setPopup(new maplibregl.Popup({offset:18}).setHTML(`<b>${b.Name||'Автобус'}</b><br>${b.Status===1?'Направление: Туда':'Направление: Обратно'}`)).addTo(BusApp.mapApi.map);
        obj={marker,el,startLat:lat,startLon:lon,targetLat:lat,targetLon:lon,startTime:now,duration,status:b.Status};S.busMarkers.set(key,obj);
      }else{
        const p=obj.marker.getLngLat();obj.startLat=p.lat;obj.startLon=p.lng;obj.targetLat=lat;obj.targetLon=lon;obj.startTime=now;obj.duration=duration;
        if(obj.status!==b.Status){obj.status=b.Status;obj.el.style.background=b.Status===1?'#2ecc71':'#e74c3c';}
        obj.marker.getPopup()?.setHTML(`<b>${b.Name||'Автобус'}</b><br>${b.Status===1?'Направление: Туда':'Направление: Обратно'}`);
      }
    });
    for(const [k,o] of S.busMarkers){if(!seen.has(k)){o.marker.remove();S.busMarkers.delete(k);}}
  }
  function animate(t){for(const o of S.busMarkers.values()){const p=Math.min((t-o.startTime)/o.duration,1);o.marker.setLngLat([o.startLon+(o.targetLon-o.startLon)*p,o.startLat+(o.targetLat-o.startLat)*p]);}S.animationFrame=requestAnimationFrame(animate);}
  function start(){stopTimer();load();S.refreshTimer=setInterval(load,BusApp.config.BUS_REFRESH_MS);if(!S.animationFrame)S.animationFrame=requestAnimationFrame(animate);}
  function stopTimer(){if(S.refreshTimer){clearInterval(S.refreshTimer);S.refreshTimer=null;}}
  function clear(){stopTimer();for(const o of S.busMarkers.values())o.marker.remove();S.busMarkers.clear();document.getElementById('sidebarBusCount').textContent='0';}
  return {start,load,clear};
})();
