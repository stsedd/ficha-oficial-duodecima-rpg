(async () => {
  'use strict';
  try { await window.DUODECIMA_CORE_READY; } catch (_) {}

  try {
    await new Promise((resolve,reject)=>{
      const patch=document.createElement('script');
      patch.src=`lineage-creation-v515.js?v=5.15.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
      patch.onload=resolve;
      patch.onerror=()=>reject(new Error('Falha ao carregar automação de Legados'));
      document.body.appendChild(patch);
    });
    try { await window.DUODECIMA_LINEAGE_CREATION_READY; } catch (_) {}
  } catch (err) {
    console.warn('[Ficha] Automação de Legados indisponível; carregando ficha base.',err);
  }

  const script = document.createElement('script');
  script.src = `app-v511.js?v=5.15.0-lineage-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
  script.defer = false;
  document.body.appendChild(script);
})();
