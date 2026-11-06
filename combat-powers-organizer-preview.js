(function installCombatPowersOrganizer(){
  'use strict';
  if(window.__DUO_COMBAT_ORGANIZER_PREVIEW__)return;
  window.__DUO_COMBAT_ORGANIZER_PREVIEW__=true;
  const STORAGE_PREFIX='duo-test-combat-powers-v1:';
  const state={pane:null,view:'quick',filter:'all',query:'',expanded:{}};
  let frame=0;
  const root=()=>document.getElementById('sheetView');
  const currentId=()=>String(window.DUODECIMA_CHARACTER_STORAGE_KEY||'preview-original');
  const key=()=>STORAGE_PREFIX+currentId();
  const simple=(x)=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const read=()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(key())||'{}');
      state.view=saved.view==='powers'?'powers':'quick';
      state.expanded=saved.expanded&&typeof saved.expanded==='object'&&!Array.isArray(saved.expanded)?saved.expanded:{};
    }catch(_){state.view='quick';state.expanded={}}
  };
  const save=()=>{
    try{localStorage.setItem(key(),JSON.stringify({view:state.view,expanded:state.expanded}))}catch(_){}
  };
  const element=(tag,cls,label)=>{
    const x=document.createElement(tag);if(cls)x.className=cls;
    if(label!==undefined)x.textContent=String(label);
    return x;
  };
  const button=(cls,label,onClick)=>{
    const b=element('button',cls,label);b.type='button';
    if(onClick)b.addEventListener('click',onClick);
    return b;
  };
  const cards=()=>[...state.pane?.querySelectorAll('.abilities-wrap .ability-card[data-ability-key]')||[]];
  const favorite=c=>c.querySelector('[data-ability-deck-toggle]')?.getAttribute('aria-pressed')==='true';
  const explicit=c=>Object.prototype.hasOwnProperty.call(state.expanded,c.dataset.abilityKey);
  const isExpanded=c=>explicit(c)?state.expanded[c.dataset.abilityKey]===true:favorite(c);
  const visibleCard=c=>{
    const kind=c.dataset.abilityType||'passive';
    if(state.filter==='active'&&kind!=='active')return false;
    if(state.filter==='passive'&&kind!=='passive')return false;
    if(state.filter==='favorite'&&!favorite(c))return false;
    if(state.query){
      const n=simple([c.querySelector('.ability-title-row b')?.textContent,c.querySelector('.ability-meta')?.textContent,c.dataset.abilitySource].join(' '));
      if(!n.includes(simple(state.query)))return false;
    }
    return true;
  };
  function flexHeight(){
    requestAnimationFrame(()=>{
      if(state.pane?.isConnected)window.dispatchEvent(new Event('resize'));
    });
  }
  function updateCard(c,expandOverride){
    const expanded=(expandOverride===undefined?isExpanded(c):expandOverride);
    c.classList.toggle('duo-power-minimized',!expanded);
    c.classList.toggle('duo-power-open',expanded);
    const toggle=c.querySelector('.duo-power-toggle');
    if(toggle){
      toggle.setAttribute('aria-expanded',String(expanded));
      toggle.setAttribute('aria-label',(expanded?'Recolher':'Expandir')+' detalhes de '+(c.querySelector('.ability-title-row b')?.textContent?.trim()||'habilidade'));
      toggle.title=expanded?'Minimizar habilidade':'Mostrar detalhes completos';
      toggle.textContent=expanded?'⌃':'⌄';
    }
  }
  function remember(c,expanded){
    state.expanded[c.dataset.abilityKey]=!!expanded;
    save();updateCard(c);flexHeight();
  }
  function compactText(card){
    const tier=card.querySelector('.ability-tier.current');
    const progress=card.querySelector('.stake-compact .row.between b')?.textContent?.trim();
    const summary=(tier?.querySelector('.ability-tier-copy')?.textContent?.trim()
      ||card.querySelector('.ability-summary')?.textContent?.trim()
      ||card.querySelector('.core-description')?.textContent?.trim()
      ||card.querySelector('.ability-tier-copy')?.textContent?.trim()
      ||'Detalhes disponíveis ao expandir.');
    const clean=summary.replace(/\s+/g,' ').trim();
    return {tier:progress?`Estacas ${progress}`:'',description:clean.length>168?clean.slice(0,165).trim()+'…':clean};
  }
  function decorateCard(card){
    if(card.dataset.duoPowerReady==='1')return;
    card.dataset.duoPowerReady='1';
    const header=card.querySelector(':scope > .ability-head');
    if(!header)return;
    const toggle=button('duo-power-toggle','⌄',()=>remember(card,!isExpanded(card)));
    toggle.dataset.duoExpandPower=card.dataset.abilityKey;
    const preview=element('div','duo-power-compact');
    const data=compactText(card);
    if(data.tier)preview.append(element('span','duo-power-tier',data.tier));
    preview.append(element('p','',data.description));
    header.append(toggle);
    header.after(preview);
    updateCard(card);
  }
  function applyFilters(){
    let visible=0;
    const all=cards();
    for(const c of all){
      const show=visibleCard(c);
      c.classList.toggle('duo-power-filtered',!show);
      c.setAttribute('data-duo-visible',show?'true':'false');
      if(show)visible++;
      if(state.query&&show)updateCard(c,true);
      else updateCard(c);
    }
    const count=state.pane?.querySelector('.duo-power-count');
    if(count)count.textContent=`${visible} de ${all.length} habilidades`;
    const empty=state.pane?.querySelector('.duo-power-empty-result');
    if(empty)empty.hidden=visible!==0;
    for(const group of state.pane?.querySelectorAll('.ability-group')||[]){
      const n=group.querySelectorAll('.ability-card[data-duo-visible="true"]').length;
      group.classList.toggle('duo-power-group-empty',!n);
    }
    for(const b of state.pane?.querySelectorAll('[data-duo-power-filter]')||[]){
      const sel=b.dataset.duoPowerFilter===state.filter;
      b.classList.toggle('selected',sel);
      b.setAttribute('aria-pressed',String(sel));
    }
    flexHeight();
  }
  function applyView(){
    if(!state.pane)return;
    state.pane.dataset.duoCombatView=state.view;
    for(const b of state.pane.querySelectorAll('[data-duo-combat-view]')){
      const active=b.dataset.duoCombatView===state.view;
      b.classList.toggle('selected',active);
      b.setAttribute('aria-selected',String(active));
      b.setAttribute('tabindex',active?'0':'-1');
    }
    for(const child of state.pane.children){
      if(child.classList.contains('duo-combat-nav'))continue;
      if(child.classList.contains('duo-power-tools'))continue;
      if(child.classList.contains('combat-resource-dock'))continue;
      if(child.classList.contains('ability-quick-deck')){child.dataset.duoSection='shared';continue}
      if(child.classList.contains('abilities-wrap')||child.querySelector?.('.mortal-power-empty')){
        child.dataset.duoSection='powers';continue;
      }
      child.dataset.duoSection='quick';
    }
    const toolbar=state.pane.querySelector('.duo-power-tools');
    if(toolbar)toolbar.hidden=state.view!=='powers';
    const quick=state.pane.querySelector('.ability-quick-deck');
    if(quick)quick.classList.toggle('duo-quick-empty-powers',state.view==='powers'&&quick.classList.contains('is-empty'));
    flexHeight();
  }
  function selectView(view,persist=true){
    state.view=view==='powers'?'powers':'quick';
    if(persist)save();
    applyView();
  }
  function bulk(type){
    for(const c of cards()){
      if(type==='favorites')delete state.expanded[c.dataset.abilityKey];
      else state.expanded[c.dataset.abilityKey]=type==='expand';
    }
    save();applyFilters();
  }
  function toolbar(pane){
    const nav=element('div','duo-combat-nav');
    nav.setAttribute('role','tablist');
    nav.setAttribute('aria-label','Organização de Combate e Poderes');
    const title=element('div','duo-combat-nav-heading');
    title.append(element('strong','','COMBATE & PODERES'),
      element('small','','Ações rápidas ou consulta de habilidades'));
    const picks=element('div','duo-combat-nav-buttons');
    const combat=button('duo-combat-choice','⚔ Combate rápido',()=>selectView('quick'));
    combat.dataset.duoCombatView='quick';combat.setAttribute('role','tab');
    const powers=button('duo-combat-choice','✦ Poderes',()=>selectView('powers'));
    powers.dataset.duoCombatView='powers';powers.setAttribute('role','tab');
    const n=cards().length;
    const count=element('span','duo-combat-number',n);
    powers.append(count);
    picks.append(combat,powers);
    nav.append(title,picks);
    nav.addEventListener('keydown',e=>{
      if(!e.target.closest('.duo-combat-choice'))return;
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();
      const next=(e.key==='Home'||e.key==='ArrowLeft')?'quick':'powers';
      selectView(next);
      nav.querySelector('[data-duo-combat-view="'+next+'"]')?.focus();
    });
    const dock=pane.querySelector('.combat-resource-dock');
    if(dock)dock.after(nav);else pane.prepend(nav);
    // Barra de consulta: antes dos poderes, depois do baralho de acesso rápido.
    const controls=element('section','duo-power-tools');
    controls.append(element('h3','','Consultar habilidades'));
    const help=element('p','duo-power-guidance','Mantenha abertas as habilidades frequentes e recolha as situacionais. As cartas do baralho já ficam em destaque.');
    controls.append(help);
    const row=element('div','duo-power-controls');
    const search=element('input','duo-power-search');
    search.type='search';search.placeholder='Buscar poder pelo nome…';
    search.setAttribute('aria-label','Buscar habilidades por nome');
    search.addEventListener('input',()=>{state.query=search.value;applyFilters()});
    const filters=element('div','duo-power-filter-bar');
    for(const [value,label] of [['all','Todas'],['active','Ativas'],['passive','Passivas'],['favorite','No baralho']]){
      const b=button('duo-power-filter',label,()=>{
        state.filter=value;applyFilters();
      });
      b.dataset.duoPowerFilter=value;b.setAttribute('aria-pressed',String(value==='all'));filters.append(b);
    }
    row.append(search,filters);
    const row2=element('div','duo-power-controls-more');
    const nItems=element('span','duo-power-count','');
    const actions=element('div','duo-power-mass-actions');
    actions.append(button('duo-power-action','Só destaques abertos',()=>bulk('favorites')),
      button('duo-power-action','Recolher todos',()=>bulk('collapse')),
      button('duo-power-action','Expandir todos',()=>bulk('expand')));
    row2.append(nItems,actions);
    controls.append(row,row2);
    const empty=element('p','duo-power-empty-result','Nenhuma habilidade encontrada com estes filtros.');
    empty.hidden=true;controls.append(empty);
    const abilityWrap=pane.querySelector(':scope > .abilities-wrap');
    if(abilityWrap)abilityWrap.before(controls);
    else pane.append(controls);
    return controls;
  }
  function setup(){
    const view=root(),pane=view?.querySelector('.sheet-main > [data-pane="combat"]');
    if(!pane||view.classList.contains('hidden'))return;
    if(pane===state.pane&&pane.dataset.duoCombatReady==='1')return;
    if(state.pane!==pane){
      read();state.filter='all';state.query='';
    }
    state.pane=pane;
    pane.dataset.duoCombatReady='1';
    pane.classList.add('duo-combat-organized');
    for(const c of cards())decorateCard(c);
    toolbar(pane);
    applyView();
    applyFilters();
  }
  function queue(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{frame=0;setup()});
  }
  function revealAbility(k){
    const pane=state.pane;
    if(!pane)return;
    const card=cards().find(c=>c.dataset.abilityKey===k);
    if(!card)return;
    selectView('powers');
    state.filter='all';state.query='';
    const input=pane.querySelector('.duo-power-search');if(input)input.value='';
    state.expanded[k]=true;save();applyFilters();
    card.classList.remove('duo-power-filtered');
    requestAnimationFrame(()=>{if(card.isConnected){card.scrollIntoView({block:'center',behavior:'auto'});card.classList.add('duo-power-focus');setTimeout(()=>card.classList.remove('duo-power-focus'),1400)}});
  }
  function navigate(e){
    const link=e.target.closest?.('[data-open-ability-button],[data-open-ability]');
    if(link&&state.pane?.contains(link)){
      const id=link.dataset.openAbilityButton||link.dataset.openAbility;
      if(id)revealAbility(id);
      return;
    }
    // A busca global já fornece o nome da habilidade; mostra a seção antes do
    // comportamento original que encontra, foca e rola para a carta.
    const result=e.target.closest?.('.duo-global-search-result');
    if(result){
      const name=result.querySelector('b')?.textContent?.trim();
      const target=cards().find(c=>c.querySelector('.ability-title-row b')?.textContent?.trim()===name);
      if(target)revealAbility(target.dataset.abilityKey);
    }
  }
  function init(){
    const view=root();if(!view)return;
    new MutationObserver(queue).observe(view,{childList:true});
    document.addEventListener('click',navigate,true);
    // As mudanças de abas não substituem o DOM; o estado permanece até o próximo render.
    queue();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
