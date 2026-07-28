# Batumi Buses

Статический сайт для GitHub Pages. Сборка, npm и сервер не требуются.

## Структура

- `index.html` — HTML-разметка приложения.
- `manifest.json` — настройки установки PWA.
- `sw.js` — офлайн-кэш и обновление PWA.
- `assets/icons/` — иконки приложения.
- `assets/styles/base.css` — базовые стили страницы и карты.
- `assets/styles/components.css` — панели, кнопки, карточки и маркеры.
- `assets/styles/responsive.css` — адаптация под телефоны.
- `assets/js/core/config.js` — адрес API и константы.
- `assets/js/core/state.js` — общее состояние приложения.
- `assets/js/core/map.js` — карта Leaflet и события карты.
- `assets/js/services/places.js` — поиск мест и выбор точек.
- `assets/js/services/gps.js` — GPS, watchPosition и направление.
- `assets/js/features/routes.js` — маршруты, остановки и варианты проезда.
- `assets/js/features/buses.js` — загрузка и анимация автобусов.
- `assets/js/features/navigation.js` — режим «В путь» и автослежение.
- `assets/js/ui/ui.js` — боковая панель и элементы интерфейса.
- `assets/js/app.js` — запуск приложения и Service Worker.

## Публикация на GitHub Pages

1. Скопируйте `icon-192.png` и `icon-512.png` в `assets/icons/`.
2. Загрузите **содержимое этой папки** в корень репозитория GitHub.
3. В репозитории откройте `Settings → Pages`.
4. Выберите `Deploy from a branch`, ветку `main` и папку `/ (root)`.
5. После публикации обновите страницу сайта.

При обновлении PWA иногда требуется полностью закрыть установленное приложение и открыть снова.
