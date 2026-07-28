BusApp.places = (() => {
  const S=BusApp.state;
  function setDestination(lon,lat,name='Точка на карте'){
    S.toCoords={lat,lon};
    if(!S.destinationMarker){
      const el=document.createElement('div'); el.className='dest-marker'; el.textContent='🏁';
      S.destinationMarker=new maplibregl.Marker({element:el,draggable:true,anchor:'center'}).setLngLat([lon,lat]).addTo(BusApp.mapApi.map);
      S.destinationMarker.on('dragend',()=>{const p=S.destinationMarker.getLngLat();S.toCoords={lat:p.lat,lon:p.lng};});
    } else S.destinationMarker.setLngLat([lon,lat]);
    S.destinationMarker.setPopup(new maplibregl.Popup({offset:18}).setHTML(`<b>Пункт назначения:</b><br>${name}`));
    BusApp.mapApi.smartCenter(lon,lat,15);
  }
  function search(query){
    clearTimeout(S.searchTimer); const box=document.getElementById('placesResultsContainer'), list=document.getElementById('placesResultsList');
    if(!query.trim()||query.trim().length<2){box.style.display='none';return;}
    S.searchTimer=setTimeout(async()=>{
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query+', Батуми')}&limit=5&accept-language=ru`);
        if(!r.ok) throw new Error(); S.searchResults=await r.json();
        list.innerHTML=S.searchResults.length?S.searchResults.map((x,i)=>`<button type="button" class="place-item" data-place-index="${i}">📍 ${x.display_name}</button>`).join(''):'<div class="dd-msg">Ничего не найдено</div>';
        box.style.display='block';
      }catch(e){console.error('Ошибка поиска мест',e);}
    },350);
  }
  function select(index){const x=S.searchResults[index];if(!x)return;const lat=+x.lat,lon=+x.lon;document.getElementById('toInput').value=x.display_name.split(',')[0];document.getElementById('placesResultsContainer').style.display='none';setDestination(lon,lat,x.display_name.split(',')[0]);}
  function clearDestination(){if(S.destinationMarker){S.destinationMarker.remove();S.destinationMarker=null;}S.toCoords=null;}
  return {search,select,setDestination,clearDestination};
})();
