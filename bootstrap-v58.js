(async () => {
  'use strict';
  try { await window.DUODECIMA_CORE_READY; } catch (_) {}
  const script = document.createElement('script');
  script.src = `app-v58.js?v=5.8.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
  script.defer = false;
  document.body.appendChild(script);
})();
