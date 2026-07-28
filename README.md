# Batumi Buses

Версия с нижней мобильной шторкой, MapLibre GL JS и тайлами OpenStreetMap.

## Структура
- `assets/js/core/map.js` — карта MapLibre и слои OpenStreetMap
- `assets/js/services/gps.js` — постоянная геолокация и сглаженная стрелка компаса
- `assets/js/features/routes.js` — маршруты, остановки, прямые варианты и пересадки
- `assets/js/features/buses.js` — автобусы и плавная интерполяция
- `assets/js/features/navigation.js` — «В путь», слежение и завершение маршрута
- `assets/js/ui/ui.js` — кнопки, нижняя шторка и события

Перед загрузкой на GitHub положите `icon-192.png` и `icon-512.png` в `assets/icons/`.
