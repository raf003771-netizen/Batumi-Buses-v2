BusApp.mapApi = (() => {
  let map;
  const sourceIds = ['route-line','pedestrian-lines','route-stops','accuracy-circle'];

  function emptyCollection() { return { type:'FeatureCollection', features:[] }; }

  function init() {
    map = new maplibregl.Map({
      container: 'map',
      center: BusApp.config.MAP_CENTER,
      zoom: BusApp.config.MAP_ZOOM,
      maxZoom: 19,
      attributionControl: true,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [BusApp.config.OSM_TILES],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id:'osm', type:'raster', source:'osm' }]
      }
    });
    map.on('load', installLayers);
    return map;
  }

  function installLayers() {
    map.addSource('route-line', {type:'geojson', data:emptyCollection()});
    map.addLayer({id:'route-line-layer', type:'line', source:'route-line', paint:{'line-color':'#11a37a','line-width':4,'line-opacity':0.82}});

    map.addSource('pedestrian-lines', {type:'geojson', data:emptyCollection()});
    map.addLayer({id:'pedestrian-lines-layer', type:'line', source:'pedestrian-lines', paint:{'line-color':'#e67e22','line-width':3,'line-dasharray':[2,3],'line-opacity':0.85}});

    map.addSource('route-stops', {type:'geojson', data:emptyCollection()});
    map.addLayer({id:'route-stops-layer', type:'circle', source:'route-stops', paint:{'circle-radius':5,'circle-color':'#fff','circle-stroke-color':'#11a37a','circle-stroke-width':2}});

    map.addSource('accuracy-circle', {type:'geojson', data:emptyCollection()});
    map.addLayer({id:'accuracy-circle-layer', type:'fill', source:'accuracy-circle', paint:{'fill-color':'#3498db','fill-opacity':0.12}});
  }

  function whenReady(fn) {
    if (map.getSource('route-line') || map.isStyleLoaded()) { fn(); return; }
    map.once('load', fn);
  }
  function setData(id, data) { whenReady(() => map.getSource(id)?.setData(data)); }
  function clearSource(id) { setData(id, emptyCollection()); }

  function setRouteLine(coords) { setRouteLines(coords?.length ? [coords] : []); }
  function setRouteLines(lines) {
    setData('route-line', {type:'FeatureCollection',features:(lines||[]).filter(x=>x?.length).map(coords=>({type:'Feature',geometry:{type:'LineString',coordinates:coords.map(c=>Array.isArray(c)?[Number(c[0]),Number(c[1])]:[Number(c.lon),Number(c.lat)])},properties:{}}))});
  }
  function setPedestrianLines(lines) {
    setData('pedestrian-lines', {type:'FeatureCollection',features:(lines||[]).map(coords=>({type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{}}))});
  }
  function setStops(stops) {
    setData('route-stops', {type:'FeatureCollection',features:(stops||[]).map(s=>({type:'Feature',geometry:{type:'Point',coordinates:[Number(s.BusStopLongitude),Number(s.BusStopLatitude)]},properties:{...s,_raw:undefined}}))});
  }

  function circlePolygon(lon, lat, radiusMeters, points=48) {
    const coords=[]; const earth=6378137;
    const latRad=lat*Math.PI/180;
    for(let i=0;i<=points;i++){
      const a=i/points*2*Math.PI;
      const dx=Math.cos(a)*radiusMeters, dy=Math.sin(a)*radiusMeters;
      coords.push([lon+(dx/(earth*Math.cos(latRad)))*180/Math.PI, lat+(dy/earth)*180/Math.PI]);
    }
    return {type:'Feature',geometry:{type:'Polygon',coordinates:[coords]},properties:{}};
  }
  function setAccuracy(lon,lat,radius){ setData('accuracy-circle', radius ? circlePolygon(lon,lat,Math.min(radius,250)) : emptyCollection()); }

  function isMobileSheetOpen() { return innerWidth<=768 && document.getElementById('appSidebar')?.classList.contains('open'); }
  function smartCenter(lon,lat,zoom=16,animate=true) {
    const offset = isMobileSheetOpen() ? [0,-document.getElementById('appSidebar').offsetHeight/4] : [0,0];
    map.easeTo({center:[lon,lat],zoom,duration:animate?550:0,offset});
  }
  function fitCoordinates(coords) {
    if(!coords?.length) return;
    const b=new maplibregl.LngLatBounds(); coords.forEach(c=>b.extend([Number(c.lon),Number(c.lat)]));
    const bottom=isMobileSheetOpen()?document.getElementById('appSidebar').offsetHeight+20:45;
    map.fitBounds(b,{padding:{top:55,left:35,right:35,bottom},duration:650,maxZoom:16});
  }

  function clearLiveRouteVisuals(){ clearSource('route-line'); clearSource('route-stops'); }
  function clearRouteVisuals(){ clearLiveRouteVisuals(); clearSource('pedestrian-lines'); }
  return {init,get map(){return map;},setRouteLine,setRouteLines,setPedestrianLines,setStops,setAccuracy,smartCenter,fitCoordinates,clearLiveRouteVisuals,clearRouteVisuals,clearSource};
})();
