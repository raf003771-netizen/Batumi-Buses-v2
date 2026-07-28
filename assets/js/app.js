document.addEventListener('DOMContentLoaded', () => {
  initDb();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
});
