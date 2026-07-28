function getRouteLabel(r) {
            return r.RouteNameKA || r.RouteNameGeoGps || r.RouteNameEN || r.RouteIdGeoGps || 'Маршрут';
        }

async function initDb() {
            try {
                const res = await fetch(`${API_BASE}/api/getDbData`);
                if (!res.ok) throw new Error('Ошибка сети');
                const json = await res.json();
                db = json.data || json;

                if (db && db.routesNames) {
                    allRoutesArray = [];
                    // Корректно извлекаем 24-значные ID MongoDB из ключей или объектов
                    for (const [key, routeObj] of Object.entries(db.routesNames)) {
                        const item = { ...routeObj };
                        item._realId = routeObj._id || routeObj.RouteId || key;
                        allRoutesArray.push(item);
                    }
                    allRoutesArray.sort((a, b) => (a.RouteSortOrder ?? 0) - (b.RouteSortOrder ?? 0));
                    renderRouteList(allRoutesArray);
                }
            } catch (err) {
                console.error('Ошибка загрузки базы:', err);
                document.getElementById('dropdownBody').innerHTML = '<div class="dd-msg">Не удалось загрузить маршруты</div>';
            }
        }

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
            const R = 6371000;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

function getClosestStopForRoute(nearStops, routeObj) {
            let best = null;
            let minDist = Infinity;
            const realId = routeObj._realId;
            const geoGpsId = routeObj.RouteIdGeoGps;

            nearStops.forEach(item => {
                if (item.stop.routes && (item.stop.routes[realId] || item.stop.routes[geoGpsId])) {
                    if (item.dist < minDist) {
                        minDist = item.dist;
                        best = { stop: item.stop, dist: item.dist };
                    }
                }
            });
            return best;
        }

function findTransitRoutes() {
            if (!fromCoords || !toCoords) {
                alert('Пожалуйста, укажите точку отправления ("Откуда") и назначения ("Куда")');
                return;
            }
            if (!db || !db.busStops) {
                alert('База данных остановок еще не загружена');
                return;
            }

            let nearFromStops = [];
            let nearToStops = [];

            Object.values(db.busStops).forEach(stop => {
                const distFrom = getDistanceFromLatLonInMeters(fromCoords.lat, fromCoords.lon, stop.BusStopLatitude, stop.BusStopLongitude);
                const distTo = getDistanceFromLatLonInMeters(toCoords.lat, toCoords.lon, stop.BusStopLatitude, stop.BusStopLongitude);

                if (distFrom <= 800) nearFromStops.push({ stop, dist: distFrom });
                if (distTo <= 800) nearToStops.push({ stop, dist: distTo });
            });

            if (nearFromStops.length === 0 || nearToStops.length === 0) {
                alert('Рядом с указанными точками не найдены автобусные остановки (в радиусе 800 м).');
                return;
            }

            let foundVariants = [];

            allRoutesArray.forEach(routeObj => {
                const startInfo = getClosestStopForRoute(nearFromStops, routeObj);
                const endInfo = getClosestStopForRoute(nearToStops, routeObj);

                if (startInfo && endInfo) {
                    const walkDist1 = Math.round(startInfo.dist);
                    const walkTime1 = Math.max(1, Math.round(walkDist1 / 80));
                    const walkDist2 = Math.round(endInfo.dist);
                    const walkTime2 = Math.max(1, Math.round(walkDist2 / 80));
                    const totalWalkTime = walkTime1 + walkTime2;

                    const straightDist = getDistanceFromLatLonInMeters(startInfo.stop.BusStopLatitude, startInfo.stop.BusStopLongitude, endInfo.stop.BusStopLatitude, endInfo.stop.BusStopLongitude);
                    const estBusTime = Math.max(5, Math.round(straightDist / 250) + 3);

                    foundVariants.push({
                        routeIds: [routeObj._realId],
                        routeNames: [getRouteLabel(routeObj)],
                        transfers: 0,
                        estimatedTime: totalWalkTime + estBusTime,
                        startStop: startInfo.stop,
                        endStop: endInfo.stop,
                        walkDist1, walkTime1, walkDist2, walkTime2,
                    });
                }
            });

            foundVariants.sort((a, b) => a.estimatedTime - b.estimatedTime);
            renderTransitResults(foundVariants);
        }

function renderTransitResults(variants) {
            const container = document.getElementById('transitResultsContainer');
            const listEl = document.getElementById('transitResultsList');

            if (variants.length === 0) {
                listEl.innerHTML = '<div class="dd-msg">Не удалось найти прямых маршрутов. Попробуйте сместить точки на карте.</div>';
                container.style.display = 'block';
                return;
            }

            let html = '';
            variants.forEach((v, idx) => {
                let routesHtml = v.routeNames.map((rn) => `<span class="badge-route">Маршрут ${rn}</span>`).join(' ➔ ');

                html += `
                    <div class="transit-card" onclick="selectTransitVariant(${idx})">
                        <div class="transit-header">
                            <div class="transit-badges">
                                ${routesHtml}
                                <span class="badge-transfer">Прямой</span>
                            </div>
                            <span class="transit-time">~${v.estimatedTime} мин</span>
                        </div>
                        <div class="transit-details">🚶 Пешком до остановки: ${v.walkDist1} м (~${v.walkTime1} мин)</div>
                        <div class="transit-details">🚶 Пешком от остановки: ${v.walkDist2} м (~${v.walkTime2} мин)</div>
                    </div>
                `;
            });

            window._currentTransitVariants = variants;
            listEl.innerHTML = html;
            container.style.display = 'block';
        }

function selectTransitVariant(index) {
            const variant = window._currentTransitVariants[index];
            if (!variant || !variant.routeIds || variant.routeIds.length === 0) return;

            pedestrianLayer.clearLayers();
            if (fromCoords && variant.startStop) {
                L.polyline([[fromCoords.lat, fromCoords.lon], [variant.startStop.BusStopLatitude, variant.startStop.BusStopLongitude]], {
                    color: '#e67e22', weight: 3, dashArray: '5, 10', opacity: 0.8
                }).addTo(pedestrianLayer);
            }
            if (toCoords && variant.endStop) {
                L.polyline([[variant.endStop.BusStopLatitude, variant.endStop.BusStopLongitude], [toCoords.lat, toCoords.lon]], {
                    color: '#e67e22', weight: 3, dashArray: '5, 10', opacity: 0.8
                }).addTo(pedestrianLayer);
            }

            selectRoute(variant.routeIds[0]);
        }

function selectRoute(realId) {
            selectedRouteId = realId;
            const routeObj = allRoutesArray.find(r => r._realId === realId) || db.routesNames[realId];
            const routeName = routeObj ? getRouteLabel(routeObj) : 'Маршрут';
            selectedRouteName = routeName;

            document.getElementById('activeRouteStatusContainer').style.display = 'block';
            document.getElementById('activeRouteNameDisplay').innerText = `Маршрут ${routeName}`;
            
            document.getElementById('liveBadge').style.display = 'flex';
            document.getElementById('legendBox').style.display = 'block';

            renderRouteDetails(realId, routeObj);
            loadBuses();

            clearInterval(refreshTimer);
            refreshTimer = setInterval(loadBuses, BUS_REFRESH_MS);
            startAnimationLoop();
            renderRouteList(allRoutesArray);
        }

function cancelLiveRoute() {
            selectedRouteId = null;
            clearInterval(refreshTimer);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            document.getElementById('activeRouteStatusContainer').style.display = 'none';
            document.getElementById('navigationPanel').classList.remove('visible');
            navigationActive = false; autoFollowEnabled = false; updateFollowButton();
            document.getElementById('liveBadge').style.display = 'none';
            document.getElementById('legendBox').style.display = 'none';

            stopLayer.clearLayers();
            pedestrianLayer.clearLayers();
            if (routeLine) { routeLine.remove(); routeLine = null; }
            busDataMap.forEach(item => item.marker.remove());
            busDataMap.clear();

            renderRouteList(allRoutesArray);
        }

function renderRouteDetails(realId, routeObj) {
            stopLayer.clearLayers();
            if (routeLine) { routeLine.remove(); routeLine = null; }
            busDataMap.forEach(item => item.marker.remove());
            busDataMap.clear();

            if (!db) return;

            const geoGpsId = routeObj ? routeObj.RouteIdGeoGps : null;
            const coords = db.routeCoordinatesGrouped[realId] || (geoGpsId ? db.routeCoordinatesGrouped[geoGpsId] : null);

            if (coords && coords.length > 0) {
                routeLine = L.polyline(coords.map(c => [c.lat, c.lon]), {
                    color: '#11a37a', weight: 4, opacity: 0.8
                }).addTo(map);
                map.fitBounds(routeLine.getBounds().pad(0.1));
            }

            if (db.busStops) {
                Object.values(db.busStops).forEach(stop => {
                    if (stop.routes && (stop.routes[realId] || (geoGpsId && stop.routes[geoGpsId]))) {
                        const stopMarker = L.circleMarker([stop.BusStopLatitude, stop.BusStopLongitude], {
                            radius: 5, fillColor: '#ffffff', color: '#11a37a', weight: 2, fillOpacity: 1
                        }).addTo(stopLayer);

                        stopMarker.on('click', async () => {
                            const stopName = stop.BusStopNameKA || stop.BusStopNameGeoGps || 'Остановка';
                            const uniqueId = 'stop_popup_' + (stop.BusStopId || Math.floor(Math.random() * 10000));
                            
                            stopMarker.bindPopup(`<div style="min-width: 200px; font-family: sans-serif;">
                                <b>${stopName}</b><br>
                                <span style="font-size: 11px; color: #718096;">Остановка №${stop.BusStopNumber || ''}</span>
                                <div style="margin-top: 8px; font-size: 12px; font-weight: bold; color: #2c3e50;">Прибытие автобусов:</div>
                                <div id="${uniqueId}" style="margin-top: 6px; font-size: 12px; color: #718096;">Загрузка...</div>
                            </div>`).openPopup();

                            let arrivalText = 'Нет данных';
                            try {
                                const res = await fetch(`${API_BASE}/api/getBusLocsOnRoute?routeId=${realId}`);
                                if (res.ok) {
                                    const json = await res.json();
                                    const buses = json.data || json || [];
                                    if (buses.length > 0) {
                                        let minDist = Infinity;
                                        buses.forEach(b => {
                                            const dist = getDistanceFromLatLonInMeters(stop.BusStopLatitude, stop.BusStopLongitude, b.Lat, b.Lon);
                                            if (dist < minDist) minDist = dist;
                                        });
                                        if (minDist !== Infinity) {
                                            const mins = Math.max(1, Math.round(minDist / 250));
                                            arrivalText = `~${mins} мин (${Math.round(minDist)} м)`;
                                        }
                                    } else {
                                        arrivalText = 'Автобусы не на линии';
                                    }
                                }
                            } catch (err) {
                                arrivalText = 'Ошибка связи';
                            }

                            const el = document.getElementById(uniqueId);
                            if (el) {
                                const rName = routeObj ? getRouteLabel(routeObj) : 'Маршрут';
                                el.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                                    <span style="background: #11a37a; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">🚌 ${rName}</span>
                                    <span style="color: #2d3748; font-weight: 600; font-size: 11px;">${arrivalText}</span>
                                </div>`;
                            }
                        });
                    }
                });
            }
        }
