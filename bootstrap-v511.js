(async () => {
  'use strict';
  try { await window.DUODECIMA_CORE_READY; } catch (_) {}

  // v5.15.2 · camada visual tardia para garantir legibilidade das habilidades
  // e da progressão por estacas sem misturar regra mecânica com CSS.
  if(!document.querySelector('link[data-duodecima-polish="5.15.2"]')){
    const polish=document.createElement('link');
    polish.rel='stylesheet';
    polish.href='polish-v5152.css?v=5.15.2';
    polish.dataset.duodecimaPolish='5.15.2';
    document.head.appendChild(polish);
  }

  async function syncMagicRules(){
    const fallback=window.DUODECIMA_MAGIC||{};
    const state=window.DUODECIMA_CORE_STATE||{};
    const base=String(state.base||'https://stsedd.github.io/duodecima-core/').replace(/\/+$/,'')+'/';
    const version=encodeURIComponent(state.version||'current');
    try{
      const response=await fetch(`${base}data/magia.json?v=${version}`,{cache:'default'});
      if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
      const magic=await response.json();
      const awakening=magic.awakening||{};
      window.DUODECIMA_MAGIC={
        ...fallback,
        ...magic,
        sacrificeEnergyEach:Number(awakening.sacrificeEnergyEach??fallback.sacrificeEnergyEach??25),
        maxSacrifices:Number(awakening.maxSacrifices??fallback.maxSacrifices??3),
        sacrificialAttributes:[...(awakening.sacrificialAttributes||fallback.sacrificialAttributes||['for','des','con'])],
        sacrificeCanGoBelowZero:awakening.canReduceBelowZero!==false,
        divineBonusesSacrificable:awakening.divineBonusesSacrificable===true,
        hpProgressionPenalty:Number(awakening.hpProgressionPenalty??fallback.hpProgressionPenalty??2),
        highCircleUses:{...(fallback.highCircleUses||{}),...(magic.highCircleUses||{})}
      };
    }catch(err){
      console.warn('[Ficha] Regras estruturadas de Magia indisponíveis; mantendo cópia local sincronizada.',err);
    }
  }
  await syncMagicRules();

  try{
    await new Promise((resolve,reject)=>{
      const guard=document.createElement('script');
      guard.src=`contract-guard-v516.js?v=5.15.3-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
      guard.onload=resolve;
      guard.onerror=()=>reject(new Error('Falha ao carregar guarda de contrato do Core'));
      document.body.appendChild(guard);
    });
    try{await window.DUODECIMA_CONTRACT_GUARD_READY}catch(_){ }
  }catch(err){
    console.warn('[Ficha] Guarda de contrato do Core indisponível; seguindo com as regras empacotadas.',err);
  }

  try {
    await new Promise((resolve,reject)=>{
      const patch=document.createElement('script');
      patch.src=`lineage-creation-v515.js?v=v5.15.10-lineage-semantics-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
      patch.onload=resolve;
      patch.onerror=()=>reject(new Error('Falha ao carregar automação de Legados'));
      document.body.appendChild(patch);
    });
    try { await window.DUODECIMA_LINEAGE_CREATION_READY; } catch (_) {}
  } catch (err) {
    console.warn('[Ficha] Automação de Legados indisponível; carregando ficha base.',err);
  }

  const script = document.createElement('script');
  script.src = `app-v511.js?v=v5.15.10-lineage-semantics-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
  script.defer = false;
  script.onload=async()=>{
    try{
      await new Promise((resolve,reject)=>{
        const patch=document.createElement('script');
        patch.src=`magic-sacrifice-sync-v5153.js?v=5.15.3-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
        patch.onload=resolve;
        patch.onerror=()=>reject(new Error('Falha ao carregar sincronização do sacrifício mágico'));
        document.body.appendChild(patch);
      });
    }catch(err){console.warn('[Ficha] Sincronização visual do sacrifício mágico indisponível.',err)}

    try{
      await new Promise((resolve,reject)=>{
        const patch=document.createElement('script');
        patch.src=`stabilization-v516.js?v=v5.15.7-image-storage-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
        patch.onload=resolve;
        patch.onerror=()=>reject(new Error('Falha ao carregar camada de estabilização'));
        document.body.appendChild(patch);
      });
      try{await window.DUODECIMA_STABILIZATION_READY}catch(_){ }
    }catch(err){console.warn('[Ficha] Camada de estabilização indisponível.',err)}
  };
  document.body.appendChild(script);
})();
