(async () => {
  'use strict';
  try { await window.DUODECIMA_CORE_READY; } catch (_) {}
  const script = document.createElement('script');
  script.src = `app-v594.js?v=5.9.4-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
  script.defer = false;
  document.body.appendChild(script);
})();
