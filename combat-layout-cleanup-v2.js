(function installCombatCleanupPreview(){
  'use strict';
  if(window.__DUO_COMBAT_CLEANUP_V2__)return;
  window.__DUO_COMBAT_CLEANUP_V2__=true;
  const ROOT_ID='sheetView';
  let scheduled=false;
  const make=(tag,cls,text)=>{
    const x=document.createElement(tag);
    if(cls)x.className=cls;
    if(text!==undefined)x.textContent=String(text);
    return x;
  };
  function moveAdvancedControls(combat,status){
    const reference=combat.querySelector('.combat-essentials-card');
    const rest=combat.querySelector('.combat-rest-card');
    if(!reference||!rest)return;
    let holder=status.querySelector('.duo-status-support');
    if(!holder){
      holder=make('section','duo-status-support');
      holder.setAttribute('aria-label','Exaustão e ajustes secundários');
      const exhaustion=make('div','duo-status-exhaustion');
      exhaustion.append(make('strong','','Exaustão'));
      const advanced=make('details','duo-status-advanced');
      advanced.append(make('summary','','Ajustes excepcionais'));
      const wrap=make('div','duo-status-advanced-fields');
      const text=make('p','duo-status-advanced-note',
        'Controles ocasionais. Os valores de Defesa e RD continuam calculados normalmente na ficha.');
      wrap.append(text);advanced.append(wrap);
      holder.append(exhaustion,advanced);
      const overview=status.querySelector(':scope > .overview-grid');
      if(overview)overview.before(holder);else status.append(holder);
    }
    const exhaustionControl=rest.querySelector('#combatExhaustionSelect')||
      holder.querySelector('#combatExhaustionSelect');
    if(exhaustionControl){
      const label=exhaustionControl.closest('label');
      if(label&&label.parentElement!==holder.querySelector('.duo-status-exhaustion')){
        holder.querySelector('.duo-status-exhaustion').append(label);
      }
      const num=Number(exhaustionControl.value)||0;
      holder.dataset.duoExhausted=num?'true':'false';
    }
    const advanced=holder.querySelector('.duo-status-advanced-fields');
    for(const [id,container] of [
      ['tempDefense',reference],
      ['tempReduction',rest]
    ]){
      const ctrl=container?.querySelector('#'+id)||holder.querySelector('#'+id);
      const label=ctrl?.closest('label');
      if(label&&label.parentElement!==advanced)advanced.append(label);
    }
    const reset=rest.querySelector('#resetAbilityUses')||holder.querySelector('#resetAbilityUses');
    if(reset&&reset.parentElement!==advanced){
      reset.classList.add('duo-hidden-uses-reset');
      advanced.append(reset);
    }
    // Mesmos inputs e botões — os handlers originais permanecem associados aos nós.
    reference.classList.add('duo-unused-combat-card');
    rest.classList.add('duo-unused-combat-card');
    const grid=combat.querySelector('.combat-command-grid');
    grid?.classList.add('duo-compact-command-grid');
  }
  function conditions(combat){
    const card=combat.querySelector('.compact-conditions-card');
    if(!card)return;
    if(card.dataset.duoCompactReady!=='true'){
      card.dataset.duoCompactReady='true';
      card.classList.add('duo-compact-conditions');
      const title=card.querySelector('.section-title h3');
      if(title)title.textContent='Condições';
      const list=card.querySelector('.active-condition-list');
      const controls=card.querySelector('.condition-adder');
      if(!controls)return;
      controls.id='duo-conditions-editor';
      const button=make('button','duo-add-condition','+ Adicionar condição');
      button.type='button';
      button.setAttribute('aria-controls',controls.id);
      button.setAttribute('aria-expanded','false');
      card.querySelector('.section-title')?.append(button);
      card.classList.toggle('duo-conditions-empty',!list?.querySelector('.active-condition-item'));
      if(!list?.querySelector('.active-condition-item')){
        const notice=list?.querySelector('.notice');
        if(notice)notice.textContent='Nenhuma condição ativa';
      }
      button.addEventListener('click',()=>{
        const open=card.dataset.duoEditorOpen!=='true';
        card.dataset.duoEditorOpen=String(open);
        button.setAttribute('aria-expanded',String(open));
        button.textContent=open?'Fechar':' + Adicionar condição';
        if(open)controls.querySelector('select')?.focus();
      });
    }
    card.dataset.duoSection='quick';
    const quick=combat.querySelector(':scope > .ability-quick-deck');
    if(quick&&card.nextElementSibling!==quick)quick.before(card);
  }
  function rules(combat){
    const old=combat.querySelector('.combat-general-rules-card');
    if(!old||old.dataset.duoTurnReady==='true')return;
    old.dataset.duoTurnReady='true';
    old.dataset.duoSection='quick';
    old.classList.add('duo-turn-rules-small');
    const details=make('details','duo-turn-rules-details');
    const summary=make('summary','','Regras de turno · consultar');
    details.append(summary);
    while(old.firstChild)details.append(old.firstChild);
    old.append(details);
    // O script original procura esta mesma classe para não duplicar a referência.
    // A regra completa e o link do Guia continuam disponíveis sob demanda.
    const equipment=combat.querySelector('.equipment-summary-card')?.closest('.mechanics-section');
    if(equipment&&old.previousElementSibling!==equipment)equipment.after(old);
  }
  function setup(){
    const view=document.getElementById(ROOT_ID);
    if(!view||view.classList.contains('hidden'))return;
    const main=view.querySelector('.sheet-main');
    const combat=main?.querySelector(':scope > [data-pane="combat"]');
    const status=main?.querySelector(':scope > [data-pane="status"]');
    if(!combat||!status)return;
    moveAdvancedControls(combat,status);
    conditions(combat);
    rules(combat);
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;setup()});
  }
  function init(){
    const root=document.getElementById(ROOT_ID);
    if(!root)return;
    // Algumas referências e descansos são injetados por scripts do próprio site;
    // observar apenas nós inseridos evita alterar cálculo ou provocar rerenders.
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();