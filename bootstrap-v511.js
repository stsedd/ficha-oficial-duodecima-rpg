(async () => {
  'use strict';
  try { await window.DUODECIMA_CORE_READY; } catch (_) {}
  const script = document.createElement('script');
  script.src = `app-v511.js?v=5.14.0-theme-api-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
  script.defer = false;
  document.body.appendChild(script);
})();
