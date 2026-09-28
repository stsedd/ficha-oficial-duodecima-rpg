(async () => {
  'use strict';

  // v5.16.0 · Rebentos de Roma, sucessores e regras canônicas do Core.
  try {
    await new Promise((resolve,reject)=>{
      const io=document.createElement('script');
      io.src='io-recovery-v51515.js?v=5.16.0-io';
      io.onload=resolve;
      io.onerror=()=>reject(new Error('Falha ao carregar recuperação de importação/exportação'));
      document.body.appendChild(io);
    });
  } catch (err) {
    console.warn('[Ficha] Camada de recuperação de I/O indisponível.',err);
  }

  try { await window.DUODECIMA_CORE_READY; } catch (_) {}

  if(!document.querySelector('link[data-duodecima-polish="5.15.2"]')){
    const polish=document.createElement('link');
    polish.rel='stylesheet';
    polish.href='polish-v5152.css?v=5.15.2';
    polish.dataset.duodecimaPolish='5.15.2';
    document.head.appendChild(polish);
  }

  if(!document.querySelector('link[data-duodecima-rebento="5.16.0"]')){
    const rebentoCss=document.createElement('link');
    rebentoCss.rel='stylesheet';
    rebentoCss.href='rebento-mechanics-v516.css?v=5.16.0';
    rebentoCss.dataset.duodecimaRebento='5.16.0';
    document.head.appendChild(rebentoCss);
  }
  if(!document.querySelector('link[data-duodecima-rules="5.16.0"]')){
    const rulesCss=document.createElement('link');
    rulesCss.rel='stylesheet';
    rulesCss.href='rules-sync-v516.css?v=5.16.0';
    rulesCss.dataset.duodecimaRules='5.16.0';
    document.head.appendChild(rulesCss);
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
        ...fallback,...magic,
        sacrificeEnergyEach:Number(awakening.sacrificeEnergyEach??fallback.sacrificeEnergyEach??25),
        maxSacrifices:Number(awakening.maxSacrifices??fallback.maxSacrifices??3),
        sacrificialAttributes:[...(awakening.sacrificialAttributes||fallback.sacrificialAttributes||['for','des','con'])],
        sacrificeCanGoBelowZero:awakening.canReduceBelowZero!==false,
        divineBonusesSacrificable:awakening.divineBonusesSacrificable===true,
        rebentoBonusesSacrificable:awakening.rebentoBonusesSacrificable===true,
        protectedBonusSources:[...(awakening.protectedBonusSources||fallback.protectedBonusSources||['divine','rebento'])],
        hpProgressionPenalty:Number(awakening.hpProgressionPenalty??fallback.hpProgressionPenalty??2),
        highCircleUses:{...(fallback.highCircleUses||{}),...(magic.highCircleUses||{})}
      };
    }catch(err){console.warn('[Ficha] Regras estruturadas de Magia indisponíveis; mantendo cópia local sincronizada.',err)}
  }
  await syncMagicRules();

  try{
    await new Promise((resolve,reject)=>{
      const guard=document.createElement('script');
      guard.src=`contract-guard-v516.js?v=5.16.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
      guard.onload=resolve;guard.onerror=()=>reject(new Error('Falha ao carregar guarda de contrato do Core'));
      document.body.appendChild(guard);
    });
    try{await window.DUODECIMA_CONTRACT_GUARD_READY}catch(_){}
  }catch(err){console.warn('[Ficha] Guarda de contrato do Core indisponível; seguindo com as regras empacotadas.',err)}

  try {
    await new Promise((resolve,reject)=>{
      const patch=document.createElement('script');
      patch.src=`lineage-creation-v515.js?v=5.16.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
      patch.onload=resolve;patch.onerror=()=>reject(new Error('Falha ao carregar automação de Legados'));
      document.body.appendChild(patch);
    });
    try { await window.DUODECIMA_LINEAGE_CREATION_READY; } catch (_) {}
  } catch (err) {console.warn('[Ficha] Automação de Legados indisponível; carregando ficha base.',err)}

  // Precisa rodar antes do app principal para o sucessor ajustar a Energia base
  // antes de rawEnergyMax() capturar o sistema do Core.
  try{
    await new Promise((resolve,reject)=>{
      const patch=document.createElement('script');
      patch.src=`rebento-mechanics-v516.js?v=5.16.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
      patch.onload=resolve;patch.onerror=()=>reject(new Error('Falha ao carregar mecânicas de Rebento'));
      document.body.appendChild(patch);
    });
  }catch(err){console.warn('[Ficha] Mecânicas de Rebento indisponíveis; carregando ficha base.',err)}

  const script=document.createElement('script');
  script.src=`app-v511.js?v=5.16.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
  script.defer=false;
  script.onload=async()=>{
    try{
      await new Promise((resolve,reject)=>{
        const patch=document.createElement('script');
        patch.src=`rules-sync-v516.js?v=5.16.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
        patch.onload=resolve;patch.onerror=()=>reject(new Error('Falha ao carregar sincronização das regras de combate'));
        document.body.appendChild(patch);
      });
    }catch(err){console.warn('[Ficha] Sincronização das regras de combate indisponível.',err)}
    try{
      await new Promise((resolve,reject)=>{
        const patch=document.createElement('script');
        patch.src=`magic-sacrifice-sync-v5153.js?v=5.16.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
        patch.onload=resolve;patch.onerror=()=>reject(new Error('Falha ao carregar sincronização do sacrifício mágico'));
        document.body.appendChild(patch);
      });
    }catch(err){console.warn('[Ficha] Sincronização visual do sacrifício mágico indisponível.',err)}
    try{
      await new Promise((resolve,reject)=>{
        const patch=document.createElement('script');
        patch.src=`stabilization-v516.js?v=5.16.0-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;
        patch.onload=resolve;patch.onerror=()=>reject(new Error('Falha ao carregar camada de estabilização'));
        document.body.appendChild(patch);
      });
      try{await window.DUODECIMA_STABILIZATION_READY}catch(_){}
    }catch(err){console.warn('[Ficha] Camada de estabilização indisponível.',err)}
  };
  document.body.appendChild(script);
})();