async function loadBuses() {
            if (!selectedRouteId) return;

            try {
                // Передаем точный 24-значный MongoDB ID в запрос к API
                const res = await fetch(`${API_BASE}/api/getBusLocsOnRoute?routeId=${selectedRouteId}`);
                if (!res.ok) throw new Error();
                const json = await res.json();
                const busesData = json.data || json || [];

                window.latestBusesData = busesData;
                updateBusInterpolation(busesData);
                highlightNearestBus();

                const badge = document.getElementById('sidebarBusCount');
                badge.innerText = busesData.length;
            } catch (err) {
                console.error('Ошибка загрузки автобусов', err);
            }
        }

function updateBusInterpolation(busesData) {
            const seen = new Set();
            const now = performance.now();
            const ANIMATION_DURATION = 4000;

            busesData.forEach(b => {
                const key = b.Name || b.BusId || (b.Lat + '_' + b.Lon);
                seen.add(key);
                const newLat = b.Lat;
                const newLon = b.Lon;
                const color = b.Status === 1 ? '#2ecc71' : '#e74c3c';

                const icon = L.divIcon({
                    className: 'bus-icon-marker',
                    html: `<div style="background: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); font-size: 13px;">🚌</div>`,
                    iconSize: [28, 28], iconAnchor: [14, 14]
                });

                let busObj = busDataMap.get(key);

                if (!busObj) {
                    const marker = L.marker([newLat, newLon], { icon })
                        .bindPopup(`<b>${b.Name || 'Автобус'}</b><br>${b.Status === 1 ? 'Направление: Туда' : 'Направление: Обратно'}`)
                        .addTo(map);

                    busDataMap.set(key, {
                        marker, startLat: newLat, startLon: newLon,
                        targetLat: newLat, targetLon: newLon,
                        startTime: now, duration: ANIMATION_DURATION, status: b.Status
                    });
                } else {
                    const currentLatLng = busObj.marker.getLatLng();
                    busObj.startLat = currentLatLng.lat;
                    busObj.startLon = currentLatLng.lng;
                    busObj.targetLat = newLat;
                    busObj.targetLon = newLon;
                    busObj.startTime = now;
                    busObj.duration = ANIMATION_DURATION;

                    if (busObj.status !== b.Status) {
                        busObj.status = b.Status;
                        busObj.marker.setIcon(icon);
                    }
                    busObj.marker.setPopupContent(`<b>${b.Name || 'Автобус'}</b><br>${b.Status === 1 ? 'Направление: Туда' : 'Направление: Обратно'}`);
                }
            });

            busDataMap.forEach((busObj, key) => {
                if (!seen.has(key)) {
                    busObj.marker.remove();
                    busDataMap.delete(key);
                }
            });
        }

function startAnimationLoop() {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            function step(timestamp) {
                busDataMap.forEach(busObj => {
                    const elapsed = timestamp - busObj.startTime;
                    const progress = Math.min(elapsed / busObj.duration, 1);
                    const lat = busObj.startLat + (busObj.targetLat - busObj.startLat) * progress;
                    const lon = busObj.startLon + (busObj.targetLon - busObj.startLon) * progress;
                    busObj.marker.setLatLng([lat, lon]);
                });
                animationFrameId = requestAnimationFrame(step);
            }
            animationFrameId = requestAnimationFrame(step);
        }
