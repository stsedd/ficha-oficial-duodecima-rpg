(()=>{
  'use strict';

  const STORAGE_KEY='duodecima_universal_stage4_v24';
  const ATTRS=[['for','FOR','Força'],['des','DES','Destreza'],['con','CON','Constituição'],['int','INT','Inteligência'],['fe','FÉ','Fé'],['car','CAR','Carisma']];
  const rebentoRules=()=>window.DUODECIMA_CORE_DATA?.system?.rebentos||window.DUODECIMA_SYSTEM?.rebentos||{
    attributeRewards:{total:2,mustUseDifferentAttributes:true,maxAttribute:6,sacrificableByMagic:false},
    successor:{startingAttributePoints:9,normalAttributeMax:5,energyBaseBonus:25,energyBaseTotal:125,bonusIsPermanent:true}
  };

  function readState(){
    try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):null}catch(_){return null}
  }
  function writeState(data){
    if(!data)return false;
    try{data.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true}catch(_){return false}
  }
  function attrsObject(value=0){return {for:value,des:value,con:value,int:value,fe:value,car:value}}
  function ensureRoma(data){data.roma=data.roma&&typeof data.roma==='object'?data.roma:{};return data.roma}
  function rebentoSelections(data){const roma=ensureRoma(data);return Array.isArray(roma.rebentoAttributes)?roma.rebentoAttributes.filter(k=>ATTRS.some(a=>a[0]===k)).slice(0,2):[]}
  function isSuccessor(data){return !!data?.roma?.successorOfRebento}
  function isRebento(data){return !!data?.roma?.rebentoApproved}
  function spentBase(data){return Object.values(data?.baseAttributes||{}).reduce((t,v)=>t+(Number(v)||0),0)}
  function godBonus(data,k){return Number((window.DUODECIMA_GODS||[]).find(g=>g.id===data?.godId)?.bonuses?.[k])||0}
  function baseCanIncrease(data,k,limit){return spentBase(data)<limit&&((Number(data?.baseAttributes?.[k])||0)+godBonus(data,k))<5}
  function reload(){location.reload()}
  function notify(text){
    const toast=document.querySelector('#toast');
    if(toast){toast.textContent=text;toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),3000)}else alert(text);
  }

  // Deve acontecer antes do app principal capturar DUODECIMA_SYSTEM.
  function applySuccessorEnergyBeforeApp(){
    const data=readState();
    if(!data||!isSuccessor(data)||!window.DUODECIMA_SYSTEM?.energy)return;
    const r=rebentoRules().successor||{};
    const bonus=Number(r.energyBaseBonus??25);
    const normal=Number(window.DUODECIMA_SYSTEM.energy.base??100);
    if(!window.DUODECIMA_SYSTEM.energy._rebentoBaseApplied){
      window.DUODECIMA_SYSTEM.energy.base=normal+bonus;
      window.DUODECIMA_SYSTEM.energy._rebentoBaseApplied=true;
      window.DUODECIMA_SYSTEM.energy.successorBonus=bonus;
    }
  }
  applySuccessorEnergyBeforeApp();

  function creationReady(data){
    const limit=Number(rebentoRules().successor?.startingAttributePoints||9);
    if(spentBase(data)!==limit)return false;
    const intBase=Number(data?.baseAttributes?.int)||0;
    if((data.initialSkills||[]).length!==2+intBase)return false;
    const divine=document.querySelector('#divineSkillChoice');if(divine&&!divine.value)return false;
    const type=document.querySelector('#creationLineageType')?.value||data?.lineage?.type||'normal';
    if(type!=='normal'&&!document.querySelector('#creationSecondaryGod')?.value)return false;
    return true;
  }

  function patchCreation(){
    const root=document.querySelector('#creationView');
    if(!root||root.classList.contains('hidden'))return;
    const data=readState();if(!data)return;
    const first=root.querySelector('article.card.stack');if(!first)return;
    const successor=isSuccessor(data),rules=rebentoRules().successor||{},limit=Number(rules.startingAttributePoints||9);
    let box=first.querySelector('.rebento-successor-creation');
    if(!box){
      box=document.createElement('div');box.className='subcard rebento-successor-creation';
      const head=first.querySelector('.section-title');head?.after(box);
    }
    box.innerHTML=`<label class="rebento-toggle-line"><span><b>Sucessor de Rebento</b><small>Personagem criado após um Rebento de Roma. Começa com ${limit} pontos de atributo e +${Number(rules.energyBaseBonus||25)} de Energia máxima permanente.</small></span><input id="rebentoSuccessorToggle" type="checkbox" ${successor?'checked':''}></label>${successor?'<p class="muted compact">O teto de atributos continua 5 até que este personagem também se torne um Rebento.</p>':''}`;
    const toggle=box.querySelector('#rebentoSuccessorToggle');
    toggle.onchange=()=>{
      const fresh=readState();if(!fresh)return;
      if(!toggle.checked&&spentBase(fresh)>8){toggle.checked=true;notify('Reduza os atributos da criação para 8 pontos antes de desativar Sucessor de Rebento.');return}
      ensureRoma(fresh).successorOfRebento=toggle.checked;
      fresh.currentEnergy=null;
      writeState(fresh);reload();
    };
    if(!successor)return;

    // Corrige o resumo visual hardcoded em 8 sem alterar a ficha-base.
    const spent=spentBase(data),left=limit-spent;
    const labels=[...first.querySelectorAll('.row.between .label')];
    const pointsLabel=labels.find(x=>/8 pontos de atributos/i.test(x.textContent||''));
    if(pointsLabel){pointsLabel.textContent=`${limit} pontos de atributos`;const sibling=pointsLabel.parentElement?.querySelector('b');if(sibling)sibling.textContent=`${left} restante(s)`;const bar=pointsLabel.closest('div')?.parentElement?.querySelector('.progress i');if(bar)bar.style.width=`${Math.max(0,Math.min(100,spent/limit*100))}%`}
    first.querySelectorAll('[data-base-inc]').forEach(btn=>{const k=btn.dataset.baseInc;btn.disabled=!baseCanIncrease(data,k,limit)});

    // O app-base trava o 9º ponto em 8; o patch captura apenas esse caso.
    if(!root.dataset.rebentoCapture){
      root.dataset.rebentoCapture='1';
      root.addEventListener('click',e=>{
        const btn=e.target.closest?.('[data-base-inc]');if(!btn)return;
        const fresh=readState();if(!fresh||!isSuccessor(fresh))return;
        const lim=Number(rebentoRules().successor?.startingAttributePoints||9),sum=spentBase(fresh);
        if(sum<8||sum>=lim)return;
        e.preventDefault();e.stopImmediatePropagation();
        const k=btn.dataset.baseInc;if(!baseCanIncrease(fresh,k,lim))return;
        fresh.baseAttributes=fresh.baseAttributes||attrsObject();fresh.baseAttributes[k]=(Number(fresh.baseAttributes[k])||0)+1;fresh.currentEnergy=null;writeState(fresh);reload();
      },true);
    }

    const finish=root.querySelector('#finishBtn');
    if(finish&&!finish.dataset.rebentoReplacement){
      const clone=finish.cloneNode(true);clone.dataset.rebentoReplacement='1';finish.replaceWith(clone);
    }
    const custom=root.querySelector('#finishBtn[data-rebento-replacement="1"]');
    if(custom){
      const ok=creationReady(data);custom.disabled=!ok;
      custom.onclick=()=>{
        const fresh=readState();if(!fresh||!isSuccessor(fresh)||!creationReady(fresh))return;
        fresh.isCreated=true;fresh.createdAt=fresh.createdAt||new Date().toISOString();fresh.currentEnergy=null;writeState(fresh);reload();
      };
      const notice=custom.parentElement?.querySelector('.notice');if(notice&&!ok)notice.innerHTML=`Para concluir: distribua exatamente <b>${limit} pontos</b>, escolha ${2+(Number(data.baseAttributes?.int)||0)} perícias por INT e preencha a escolha divina quando o kit exigir.`;else if(notice&&ok)notice.remove();
    }
  }

  function currentAttrTotal(k){
    const card=[...document.querySelectorAll('#sheetView .attr')].find(x=>(x.querySelector('.attr-name')?.textContent||'').trim().startsWith(`${ATTRS.find(a=>a[0]===k)?.[1]} ·`));
    const n=Number(card?.querySelector('.attr-total')?.textContent);return Number.isFinite(n)?n:null;
  }
  function syncRebentoExtra(fresh,oldSelections,newSelections){
    fresh.attributeExtras=fresh.attributeExtras||attrsObject();
    for(const k of oldSelections)if(!newSelections.includes(k))fresh.attributeExtras[k]=(Number(fresh.attributeExtras[k])||0)-1;
    for(const k of newSelections)if(!oldSelections.includes(k))fresh.attributeExtras[k]=(Number(fresh.attributeExtras[k])||0)+1;
    ensureRoma(fresh).rebentoAttributes=[...newSelections];
  }
  function changeRebentoSelection(slot,value){
    const fresh=readState();if(!fresh||!isRebento(fresh))return;
    const old=rebentoSelections(fresh),next=[old[0]||'',old[1]||''];
    const previous=next[slot]||'';next[slot]=value||'';
    const clean=next.filter(Boolean);
    if(new Set(clean).size!==clean.length){notify('Os dois bônus de Rebento precisam estar em atributos diferentes.');return}
    if(value&&value!==previous){
      let total=currentAttrTotal(value);
      if(old.includes(value)&&total!=null)total-=1;
      if(total!=null&&total>=6){notify('Este atributo já está em 6 e não pode receber outro +1 de Rebento.');return}
    }
    syncRebentoExtra(fresh,old,clean);writeState(fresh);reload();
  }

  function patchRebentoProfile(){
    const rail=document.querySelector('#sheetView .character-rail');if(!rail)return;
    const data=readState();if(!data)return;
    const active=isRebento(data),selected=rebentoSelections(data),max=Number(rebentoRules().attributeRewards?.maxAttribute||6);
    let box=rail.querySelector('.rebento-profile-control');
    if(!box){box=document.createElement('section');box.className='rebento-profile-control';const identity=rail.querySelector('.rail-identity');identity?.after(box)}
    const options=(slot)=>`<option value="">Escolha…</option>${ATTRS.map(([k,abbr,label])=>`<option value="${k}" ${selected[slot]===k?'selected':''} ${selected[1-slot]===k?'disabled':''}>${abbr} · ${label}</option>`).join('')}`;
    box.innerHTML=`<button type="button" class="rebento-profile-toggle ${active?'active':''}" aria-pressed="${active?'true':'false'}"><span>${active?'✦':'○'}</span><b>${active?'Rebento de Roma':'Marcar como Rebento de Roma'}</b><small>${active?`Teto especial ${max} · ${selected.length}/2 bônus escolhidos`:'Libera dois +1 em atributos diferentes e o teto especial de 6.'}</small></button>${active?`<div class="rebento-bonus-selectors"><label><span>1º +1 de Rebento</span><select data-rebento-slot="0">${options(0)}</select></label><label><span>2º +1 de Rebento</span><select data-rebento-slot="1">${options(1)}</select></label></div><p class="rebento-rule-note">Os +1 de Rebento são protegidos e não podem ser sacrificados pelo despertar da magia.</p>`:''}`;
    box.querySelector('.rebento-profile-toggle').onclick=()=>{
      const fresh=readState();if(!fresh)return;const roma=ensureRoma(fresh),was=!!roma.rebentoApproved;
      if(was){const old=rebentoSelections(fresh);syncRebentoExtra(fresh,old,[]);roma.rebentoApproved=false}else{roma.rebentoApproved=true;roma.rebentoAttributes=Array.isArray(roma.rebentoAttributes)?roma.rebentoAttributes:[]}
      fresh.currentHp=null;fresh.currentEnergy=null;writeState(fresh);reload();
    };
    box.querySelectorAll('[data-rebento-slot]').forEach(sel=>sel.onchange=()=>changeRebentoSelection(Number(sel.dataset.rebentoSlot),sel.value));
    document.querySelectorAll('#sheetView .attr').forEach(card=>{
      const text=card.querySelector('.attr-name')?.textContent||'',k=ATTRS.find(a=>text.trim().startsWith(`${a[1]} ·`))?.[0];if(!k)return;
      card.classList.toggle('has-rebento-bonus',selected.includes(k));
      card.querySelector('.rebento-attr-badge')?.remove();
      if(selected.includes(k)){const badge=document.createElement('span');badge.className='rebento-attr-badge';badge.textContent='REBENTO +1';card.appendChild(badge)}
    });
  }

  function patchSuccessorBadge(){
    const data=readState();if(!data?.isCreated||!isSuccessor(data))return;
    const rail=document.querySelector('#sheetView .character-rail');if(!rail||rail.querySelector('.rebento-successor-badge'))return;
    const badge=document.createElement('div');badge.className='rebento-successor-badge';badge.innerHTML='<span>HERANÇA</span><b>Sucessor de Rebento</b><small>+1 ponto inicial · +25 Energia máxima permanente</small>';
    rail.querySelector('.rail-identity')?.appendChild(badge);
  }

  function patchAll(){patchCreation();patchRebentoProfile();patchSuccessorBadge()}
  function initObserver(){
    let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchAll()})};
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});queue();
    document.addEventListener('change',e=>{if(e.target?.id==='importInput')setTimeout(reload,900)},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#resetBtn'))setTimeout(reload,250)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initObserver,{once:true});else initObserver();
})();
