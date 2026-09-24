(()=>{
  'use strict';

  const EXPECTED={
    startingPoints:8,
    normalMax:5,
    attributeIncreaseLevels:[20,40,60,80,100],
    maxLevel:100
  };

  const sameArray=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>Number(x)===Number(b[i]));

  function audit(){
    const system=window.DUODECIMA_SYSTEM||{};
    const attrs=system.attributes||{};
    const issues=[];
    if(Number(attrs.startingPoints)!==EXPECTED.startingPoints)issues.push(`pontos iniciais: Core ${attrs.startingPoints}, Ficha ${EXPECTED.startingPoints}`);
    if(Number(attrs.normalMax)!==EXPECTED.normalMax)issues.push(`limite normal de atributo: Core ${attrs.normalMax}, Ficha ${EXPECTED.normalMax}`);
    const levels=attrs.increaseLevels||system.attributeIncreaseLevels||[];
    if(!sameArray(levels,EXPECTED.attributeIncreaseLevels))issues.push(`níveis de atributo: Core [${levels.join(', ')}], Ficha [${EXPECTED.attributeIncreaseLevels.join(', ')}]`);
    if(Number(system.levels?.max)!==EXPECTED.maxLevel)issues.push(`nível máximo: Core ${system.levels?.max}, Ficha ${EXPECTED.maxLevel}`);
    window.DUODECIMA_CONTRACT_STATUS={ok:issues.length===0,issues,coreVersion:window.DUODECIMA_CORE_STATE?.version||'fallback'};
    return issues;
  }

  function renderWarning(issues){
    document.querySelector('.core-contract-warning')?.remove();
    if(!issues.length)return;
    const box=document.createElement('div');
    box.className='core-contract-warning';
    box.setAttribute('role','alert');
    box.style.cssText='margin:10px 0;padding:11px 13px;border:1px solid #9b5b20;border-radius:9px;background:#2a1909;color:#ffe1b8;font:600 12px/1.45 system-ui,sans-serif';
    box.innerHTML=`<b>Contrato do Core mudou.</b> A ficha foi bloqueada para criação até o consumidor ser atualizado.<br><small>${issues.map(x=>x.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))).join(' · ')}</small>`;
    const toolbar=document.querySelector('.archive-toolbar');
    (toolbar?.parentElement||document.querySelector('main')||document.body).insertBefore(box,toolbar?.nextSibling||null);
  }

  function enforce(){
    const issues=audit();
    renderWarning(issues);
    const finish=document.querySelector('#finishBtn');
    if(finish&&issues.length){finish.disabled=true;finish.title='A criação está bloqueada porque o contrato do Core mudou.';}
  }

  async function init(){
    try{await window.DUODECIMA_CORE_READY}catch(_){ }
    enforce();
    const root=document.querySelector('#creationView')||document.body;
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;queued=true;
      queueMicrotask(()=>{queued=false;enforce()});
    }).observe(root,{childList:true,subtree:true});
  }

  window.DUODECIMA_CONTRACT_GUARD_READY=init();
})();
