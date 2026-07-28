document.addEventListener('DOMContentLoaded', async () => {
  I18N.init();
  UI.init();
  GPS.init();
  Routes.init();
  Navigation.init();

  if (!('serviceWorker' in navigator)) return;

  try {
    // The version query guarantees that browsers detect this final worker.
    const registration = await navigator.serviceWorker.register('./sw.js?v=final-v8-20260729', {
      scope: './',
      updateViaCache: 'none'
    });

    await registration.update();

    if (registration.waiting) {
      registration.waiting.postMessage('SKIP_WAITING');
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage('SKIP_WAITING');
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const reloadKey = 'batumi-sw-final-reloaded';
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    });
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
  }
});
