const map = L.map('map', { zoomControl: false }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  maxZoom: 19, subdomains: 'abcd',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);
stopLayer = L.layerGroup().addTo(map);
pedestrianLayer = L.layerGroup().addTo(map);

map.on('click', (e) => {
  const lat = e.latlng.lat; const lon = e.latlng.lng;
  if (isManualPicking) {
    setUserLocationMarker(lat, lon, null, false); isManualPicking = false;
    map.getContainer().classList.remove('crosshair-cursor-enabled');
  } else if (isFromManualPicking) {
    fromCoords = { lat, lon }; setUserLocationMarker(lat, lon, null, false);
    document.getElementById('fromInput').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    isFromManualPicking = false; map.getContainer().classList.remove('crosshair-cursor-enabled'); closeSidebar();
  } else if (isDestManualPicking) {
    setDestinationMarker(lat, lon, 'Точка на карте');
    document.getElementById('toInput').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    isDestManualPicking = false; map.getContainer().classList.remove('crosshair-cursor-enabled'); openSidebar();
  }
});

map.on('dragstart zoomstart', () => {
  if (navigationActive) { autoFollowEnabled = false; userMovedMap = true; updateFollowButton(); }
});
