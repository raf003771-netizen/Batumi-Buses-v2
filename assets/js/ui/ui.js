function openSidebar(){ document.getElementById('appSidebar').classList.add('open'); }
function closeSidebar(){ document.getElementById('appSidebar').classList.remove('open'); }
function toggleSidebar() {
            document.getElementById('appSidebar').classList.toggle('open');
        }

function toggleGeoDropdown() {
            const menu = document.getElementById('geoDropdownMenu');
            menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        }

function selectRoutePoint(type) {
            if (type === 'from') {
                isFromManualPicking = true; isDestManualPicking = false; isManualPicking = false;
                map.getContainer().classList.add('crosshair-cursor-enabled');
                toggleSidebar();
            } else if (type === 'to') {
                isDestManualPicking = true; isFromManualPicking = false; isManualPicking = false;
                map.getContainer().classList.add('crosshair-cursor-enabled');
                toggleSidebar();
            }
        }

function selectGeoOption(type) {
            document.getElementById('geoDropdownMenu').style.display = 'none';
            if (type === 'gps') {
                isManualPicking = false;
                map.getContainer().classList.remove('crosshair-cursor-enabled');
                locateUser();
            } else if (type === 'manual') {
                isManualPicking = true;
                map.getContainer().classList.add('crosshair-cursor-enabled');
            }
        }

function filterRoutes(query) {
            const q = query.trim().toLowerCase();
            if (!q) {
                renderRouteList(allRoutesArray);
                return;
            }
            const filtered = allRoutesArray.filter(r => getRouteLabel(r).toLowerCase().includes(q));
            renderRouteList(filtered);
        }

function clearSearch() {
            document.getElementById('searchInput').value = '';
            renderRouteList(allRoutesArray);
        }

function renderRouteList(list) {
            const body = document.getElementById('dropdownBody');
            if (list.length === 0) {
                body.innerHTML = '<div class="dd-msg">Ничего не найдено</div>';
                return;
            }

            let html = '';
            list.forEach(r => {
                const realId = r._realId;
                const name = getRouteLabel(r);
                const isActive = selectedRouteId === realId ? 'active' : '';
                html += `<li><button class="route-item ${isActive}" onclick="selectRoute('${realId}')"><span>🚌 Маршрут ${name}</span><span>›</span></button></li>`;
            });
            body.innerHTML = html;
        }

document.addEventListener('click', (e) => {
 const c=document.getElementById('placesResultsContainer'), i=document.getElementById('toInput');
 if(i&&c&&!i.contains(e.target)&&!c.contains(e.target)) c.style.display='none';
});
