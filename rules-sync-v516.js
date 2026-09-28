(()=>{
  'use strict';
  const STORAGE_KEY='duodecima_universal_stage4_v24';
  const ATTRS=['for','des','con','int','fe','car'];
  function read(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(_){return null}}
  function write(data){if(!data)return;data.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
  function signedText(value){const s=String(value||'').trim();return /^[+−-]/.test(s)?s:`+${s}`}

  function patchInitiative(){
    const agi=document.querySelector('#sheetView [data-skill-name="Agilidade"]');
    if(!agi?.classList.contains('trained'))return;
    const value=agi.querySelector('.skill-roll-value')?.textContent?.trim();if(!value)return;
    document.querySelectorAll('#sheetView .quick-fact-list > div, #sheetView .combat-quick-values > div').forEach(row=>{
      if((row.querySelector('span')?.textContent||'').trim()!=='Iniciativa')return;
      const out=row.querySelector('b');if(out){out.textContent=`1d20 ${signedText(value)}`;out.title='Iniciativa usa Agilidade quando a perícia é treinada.'}
    });
  }

  function patchCombatReference(){
    const pane=document.querySelector('#sheetView [data-pane="combat"]');if(!pane||pane.querySelector('.combat-general-rules-card'))return;
    const anchor=pane.querySelector('.combat-command-grid');if(!anchor)return;
    const card=document.createElement('article');card.className='card mechanics-section combat-general-rules-card';
    card.innerHTML=`<div class="section-title"><div><p class="eyebrow">REGRAS GERAIS</p><h3>Seu turno</h3></div><a class="pill" href="https://stsedd.github.io/Guia-da-Duodecima/#page:combate" target="_blank" rel="noopener noreferrer">Abrir guia ↗</a></div><div class="combat-general-rules-grid"><div><b>2 ações</b><small>ataque, habilidade ou ação geral</small></div><div><b>10 m</b><small>deslocamento, divisível no turno</small></div><div><b>1 ação livre</b><small>objeto simples ou poção em si</small></div></div><p class="muted compact"><strong>Disparada:</strong> +10 m · <strong>Defender:</strong> ataques contra você com desvantagem · <strong>Ajudar:</strong> vantagem no próximo teste relacionado · <strong>Preparar:</strong> declare gatilho + ação de custo 1.</p>`;
    anchor.before(card);
  }

  function patchSuccessorDiagnostics(){
    const data=read();if(!data?.roma?.successorOfRebento)return;
    const list=document.querySelector('#sheetView .diagnostic-list');if(!list)return;
    const falseWarnings=[...list.querySelectorAll('.diagnostic')].filter(el=>/Atributos-base somam\s+9\/8/i.test(el.textContent||''));
    if(!falseWarnings.length)return;
    falseWarnings.forEach(el=>el.remove());
    const section=list.closest('.card,article');if(!section)return;
    const remaining=[...list.querySelectorAll('.diagnostic')],errors=remaining.filter(x=>x.classList.contains('error')).length,warns=remaining.filter(x=>x.classList.contains('warn')).length;
    const pill=section.querySelector('.section-title .pill');if(pill){pill.textContent=errors?`${errors} erro(s)`:warns?`${warns} aviso(s)`:'Tudo consistente';pill.classList.toggle('good',!errors&&!warns);pill.classList.toggle('warn',!!errors||!!warns)}
    if(!remaining.length){list.innerHTML='<div class="notice success-note">Nenhuma inconsistência estrutural detectada. O sucessor possui 9/9 pontos iniciais corretamente.</div>'}
  }

  function patchRomaRebentoHint(){
    const rb=document.querySelector('#sheetView #rebentoApproved');if(!rb||!rb.checked)return;
    const label=rb.closest('label');if(!label||label.parentElement?.querySelector('.rebento-roma-hint'))return;
    const hint=document.createElement('p');hint.className='muted compact rebento-roma-hint';hint.textContent='Os dois +1 de Rebento são configurados no selo do perfil à esquerda.';label.after(hint);
  }

  function removeRebentoBonusesAfterRomaDisable(){
    const data=read();if(!data||data.roma?.rebentoApproved)return;
    const selected=Array.isArray(data.roma?.rebentoAttributes)?data.roma.rebentoAttributes.filter(k=>ATTRS.includes(k)).slice(0,2):[];
    if(!selected.length)return;
    data.attributeExtras=data.attributeExtras||{};
    for(const k of selected)data.attributeExtras[k]=(Number(data.attributeExtras[k])||0)-1;
    data.roma.rebentoAttributes=[];data.currentHp=null;data.currentEnergy=null;write(data);location.reload();
  }

  function patchAll(){patchInitiative();patchCombatReference();patchSuccessorDiagnostics();patchRomaRebentoHint()}
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchAll()})};
  function init(){
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});queue();
    document.addEventListener('change',e=>{if(e.target?.id==='rebentoApproved'&&!e.target.checked)setTimeout(removeRebentoBonusesAfterRomaDisable,0)},false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
