(()=>{
  'use strict';
  const STORAGE_KEY='duodecima_universal_stage4_v24';
  const PREF_KEY='duodecima_successor_creation_pref_v1';
  const rules=()=>window.DUODECIMA_CORE_DATA?.system?.rebentos?.successor||window.DUODECIMA_SYSTEM?.rebentos?.successor||{startingAttributePoints:9,energyBaseBonus:25,energyBaseTotal:125};
  const read=()=>{try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):null}catch(_){return null}};
  const pref=()=>{try{return localStorage.getItem(PREF_KEY)==='1'}catch(_){return false}};
  const setPref=value=>{try{value?localStorage.setItem(PREF_KEY,'1'):localStorage.removeItem(PREF_KEY)}catch(_){}};
  const save=data=>{try{data.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true}catch(_){return false}};

  // Em uma ficha completamente nova o app-base ainda não gravou estado algum.
  // A preferência temporária permite que o bônus de Energia exista antes do primeiro save.
  if(pref()&&!read()&&window.DUODECIMA_SYSTEM?.energy&&!window.DUODECIMA_SYSTEM.energy._rebentoBaseApplied){
    const r=rules();
    window.DUODECIMA_SYSTEM.energy.base=Number(window.DUODECIMA_SYSTEM.energy.base??100)+Number(r.energyBaseBonus??25);
    window.DUODECIMA_SYSTEM.energy._rebentoBaseApplied=true;
    window.DUODECIMA_SYSTEM.energy.successorBonus=Number(r.energyBaseBonus??25);
  }

  function promotePreference(){
    const data=read();
    if(!data||!pref()||data?.roma?.successorOfRebento)return false;
    data.roma=data.roma&&typeof data.roma==='object'?data.roma:{};
    data.roma.successorOfRebento=true;
    data.currentEnergy=null;
    if(save(data)){
      setPref(false);
      location.reload();
      return true;
    }
    return false;
  }

  function patchPristineCreation(){
    if(promotePreference())return;
    if(read())return; // O patch principal cuida de qualquer estado já persistido.
    const root=document.querySelector('#creationView');
    if(!root||root.classList.contains('hidden'))return;
    const first=root.querySelector('article.card.stack');
    if(!first)return;
    const r=rules(),active=pref(),limit=Number(r.startingAttributePoints||9),bonus=Number(r.energyBaseBonus||25);
    let box=first.querySelector('.rebento-successor-creation');
    if(!box){
      box=document.createElement('div');
      box.className='subcard rebento-successor-creation';
      first.querySelector('.section-title')?.after(box);
    }
    box.innerHTML=`<label class="rebento-toggle-line"><span><b>Sucessor de Rebento</b><small>Personagem criado após um Rebento de Roma. Começa com ${limit} pontos de atributo e +${bonus} de Energia máxima permanente.</small></span><input id="rebentoSuccessorToggle" type="checkbox" ${active?'checked':''}></label>${active?'<p class="muted compact">O teto de atributos continua 5 até que este personagem também se torne um Rebento.</p>':''}`;
    box.querySelector('#rebentoSuccessorToggle').onchange=e=>{setPref(e.target.checked);location.reload()};

    if(active){
      const pointsLabel=[...first.querySelectorAll('.row.between .label')].find(x=>/8 pontos de atributos/i.test(x.textContent||''));
      if(pointsLabel){
        pointsLabel.textContent=`${limit} pontos de atributos`;
        const sibling=pointsLabel.parentElement?.querySelector('b');if(sibling)sibling.textContent=`${limit} restante(s)`;
        const bar=pointsLabel.closest('div')?.parentElement?.querySelector('.progress i');if(bar)bar.style.width='0%';
      }
      const notice=root.querySelector('#finishBtn')?.parentElement?.querySelector('.notice');
      if(notice)notice.innerHTML=notice.innerHTML.replace('exatamente 8 pontos',`exatamente ${limit} pontos`);
    }
  }

  function init(){
    let queued=false;
    const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchPristineCreation()})};
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target?.closest?.('#resetBtn'))setPref(false)},true);
    queue();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
