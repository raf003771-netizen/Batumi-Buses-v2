function searchPlaces(query) {
            clearTimeout(searchTimeout);
            const resultsContainer = document.getElementById('placesResultsContainer');
            const resultsList = document.getElementById('placesResultsList');

            if (!query || query.trim().length < 2) {
                resultsContainer.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Батуми')}&limit=5`);
                    if (!res.ok) throw new Error();
                    const items = await res.json();
                    lastSearchResults = items;

                    if (items.length === 0) {
                        resultsList.innerHTML = '<div class="dd-msg">Ничего не найдено</div>';
                        resultsContainer.style.display = 'block';
                        return;
                    }

                    let html = '';
                    items.forEach((item, index) => {
                        html += `<button type="button" class="place-item" onclick="selectSearchResult(${index})">📍 ${item.display_name}</button>`;
                    });
                    resultsList.innerHTML = html;
                    resultsContainer.style.display = 'block';
                } catch (err) {
                    console.error('Ошибка поиска:', err);
                }
            }, 300);
        }

function selectSearchResult(index) {
            const item = lastSearchResults[index];
            if (!item) return;

            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const shortName = item.display_name.split(',')[0];

            toCoords = { lat, lon };
            document.getElementById('toInput').value = shortName;
            document.getElementById('placesResultsContainer').style.display = 'none';
            setDestinationMarker(lat, lon, shortName);
        }

function setDestinationMarker(lat, lon, name) {
            toCoords = { lat, lon };
            if (!destMarker) {
                const destIcon = L.divIcon({
                    className: 'dest-pos-marker',
                    html: `<div style="background: #e74c3c; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4); font-size: 12px; color: white;">🏁</div>`,
                    iconSize: [24, 24], iconAnchor: [12, 12]
                });
                destMarker = L.marker([lat, lon], { icon: destIcon, draggable: true }).addTo(map);
                destMarker.bindPopup(`<b>Пункт назначения:</b><br>${name}`).openPopup();
                destMarker.on('dragend', () => {
                    const pos = destMarker.getLatLng();
                    toCoords = { lat: pos.lat, lon: pos.lng };
                });
            } else {
                destMarker.setLatLng([lat, lon]);
                destMarker.setPopupContent(`<b>Пункт назначения:</b><br>${name}`).openPopup();
            }
            map.setView([lat, lon], 15);
        }

function clearRoutePoints() {
            if (destMarker) { destMarker.remove(); destMarker = null; }
            if (userMarker) { userMarker.remove(); userMarker = null; }
            if (userAccuracyCircle) { userAccuracyCircle.remove(); userAccuracyCircle = null; }
            pedestrianLayer.clearLayers();
            fromCoords = null; toCoords = null;
            document.getElementById('fromInput').value = '';
            document.getElementById('toInput').value = '';
            document.getElementById('transitResultsContainer').style.display = 'none';
        }
