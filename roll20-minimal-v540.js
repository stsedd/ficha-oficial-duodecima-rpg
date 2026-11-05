(function duodecimaRoll20MinimalV540(){
  'use strict';
  if(window.__DUO_ROLL20_MINIMAL_V540__)return;
  window.__DUO_ROLL20_MINIMAL_V540__=true;
  const powerSelectionKey='duo-roll20-minimal-v540-selected-power';
  let scheduled=false,profileMounted=false;
  const node=(tag,cls,text)=>{
    const n=document.createElement(tag);if(cls)n.className=cls;
    if(text!==undefined)n.textContent=String(text);
    return n;
  };
  const button=(text,cls,onClick)=>{
    const b=node('button',cls,text);b.type='button';
    if(onClick)b.addEventListener('click',onClick);
    return b;
  };
  const text=(e,selector)=>e?.querySelector(selector)?.textContent.trim()||'';
  const savedPower=()=>{try{return sessionStorage.getItem(powerSelectionKey)||''}catch(_){return ''}};
  const savePower=value=>{try{sessionStorage.setItem(powerSelectionKey,value)}catch(_){}};
  const word=(n,one,many)=>`${n} ${n===1?one:many}`;
  function header(sheet){
    if(sheet.querySelector('.r20-character-header'))return;
    const main=sheet.querySelector('.sheet-main'),rail=sheet.querySelector('.character-rail');
    const tabs=main?.querySelector('.sheet-tabs');
    if(!main||!rail||!tabs)return;
    const h=node('header','r20-character-header');
    const brand=node('div','r20-brand','LEGIO XII · FULMINATA');
    const identity=node('div','r20-identity');
    const title=node('strong','r20-character-name',text(rail,'.rail-identity h2')||'Personagem');
    const lineage=node('span','r20-god-name',text(rail,'.rail-identity .eyebrow')||'');
    identity.append(title,lineage);
    const headFacts=node('div','r20-head-facts');
    const lvl=rail.querySelector('#levelOrbInput')?.value||'1';
    const bp=text(rail,'.rail-orb-bp strong')||'—';
    for(const [label,value] of [['NÍVEL',lvl],['BP',bp]]){
      const box=node('div','r20-head-fact');
      box.append(node('small','',label),node('strong','',value));
      headFacts.append(box);
    }
    const profile=node('details','r20-profile-popup');
    profile.append(node('summary','','Perfil e ajustes'));
    profile.append(rail);
    const toolbar=document.querySelector('main.shell > .archive-toolbar');
    if(toolbar)profile.append(toolbar);
    // Mantém a barra de personagens inteira: suas integrações inserem controles
    // ao lado de .appearance-top-actions e dependem desse mesmo parentElement.
    const archiveBrand=document.querySelector('main.shell > .archive-brandbar');
    if(archiveBrand)profile.append(archiveBrand);
    const left=node('div','r20-head-left');left.append(brand,identity);
    h.append(left,headFacts,profile);
    main.insertBefore(h,tabs);
    for(const entry of [['status','Ficha'],['combat','Poderes']]){
      const tab=tabs.querySelector(`[data-tab="${entry[0]}"]`);
      if(!tab)continue;
      const textNode=[...tab.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
      if(textNode)textNode.textContent=entry[1];
      else tab.append(document.createTextNode(entry[1]));
    }
    tabs.classList.add('r20-main-nav');
  }
  function detailsPanel(title,content,{open=false,cls=''}={}){
    const d=node('details','r20-reveal '+cls);
    d.open=open;d.append(node('summary','',title));d.append(content);
    return d;
  }
  function status(pane){
    if(!pane||pane.dataset.r20StatusReady==='1')return;
    const skills=pane.querySelector('.overview-skills');
    const grid=pane.querySelector('.overview-grid');
    if(!skills||!grid)return;
    pane.dataset.r20StatusReady='1';
    const strip=pane.querySelector('.status-core-strip');
    strip?.classList.add('r20-vitals');
    const intro=node('div','r20-pane-heading');
    intro.append(node('h2','','Ficha'),node('p','','Atributos, perícias e recursos do personagem'));
    pane.insertBefore(intro,strip||grid);
    const aux=pane.querySelector('.overview-aux');
    if(aux){
      const count=text(aux,'.talents-compact-card .pill');
      const addon=detailsPanel('Talentos, referência e ajustes'+(count?' · '+count:''),aux,{cls:'r20-addons'});
      grid.after(addon);
    }
    const lineage=pane.querySelector('.lineage-config-visible');
    if(lineage){
      const addon=detailsPanel('Linhagem e configuração de origem',lineage,{cls:'r20-addons'});
      const prev=pane.querySelector('.r20-addons:last-of-type');
      (prev||grid).after(addon);
    }
  }
  function powerItems(wrap){
    const cards=[...wrap.querySelectorAll('.ability-card[data-ability-key]')];
    return cards.map((card,i)=>{
      const key=card.getAttribute('data-ability-key')||String(i);
      const name=text(card,'.ability-title-row b')||'Poder';
      const kind=card.getAttribute('data-ability-type')||'passive';
      const meta=text(card,'.ability-meta');
      const stake=text(card,'.stake-compact .row b')||'';
      const pinned=!!card.querySelector('.ability-deck-toggle.active');
      return {card,key,name,kind,meta,stake,pinned,locked:card.classList.contains('ability-locked'),parent:card.parentElement};
    });
  }
  function powers(pane){
    if(!pane||pane.dataset.r20PowersReady==='1')return;
    const dock=pane.querySelector('.combat-resource-dock');
    const abilities=pane.querySelector('.abilities-wrap');
    if(!dock)return;
    pane.dataset.r20PowersReady='1';
    dock.classList.add('r20-vitals','r20-combat-vitals');
    const intro=node('div','r20-pane-heading');
    intro.append(node('h2','','Poderes'),node('p','','Habilidades divinas e acesso rápido às regras'));
    pane.insertBefore(intro,dock);
    const extras=node('div','r20-combat-addons');
    const nativeTargets=[...pane.children].filter(e=>e.classList?.contains('target-resource-zone')||e.classList?.contains('combat-command-grid'));
    // O módulo de descansos/sanidade usa insertBefore com esses anchors diretos;
    // movê-los para dentro de <details> quebraria os cálculos/atualizações.
    const targets=[...pane.children].filter(e=>e!==intro&&e!==dock&&e!==abilities&&e.classList?.contains('mechanics-section')&&!nativeTargets.includes(e));
    const mortality=pane.querySelector('.mortal-power-empty')?.closest('.mechanics-section');
    if(mortality&&!targets.includes(mortality)&&!nativeTargets.includes(mortality))targets.push(mortality);
    for(const block of targets)extras.append(block);
    const extrasAcc=detailsPanel('Combate, descansos, condições e baralhos',extras,{cls:'r20-addons r20-combat-disclosure'});
    extrasAcc.addEventListener('toggle',()=>{pane.dataset.r20ExtrasOpen=String(extrasAcc.open)});
    pane.dataset.r20ExtrasOpen='false';
    pane.append(extrasAcc);
    for(const anchor of nativeTargets){
      anchor.classList.add('r20-native-combat-extra');
      pane.append(anchor); // continua filho DIRETO de [data-pane=combat]
    }
    if(!abilities){
      const empty=node('div','r20-no-powers','Este personagem não possui poderes divinos para consultar.');
      dock.after(empty);
      return;
    }
    const items=powerItems(abilities);
    const board=node('section','r20-power-board');
    const toolbox=node('div','r20-power-toolbar');
    const title=node('strong','','Lista de habilidades');
    const count=node('span','r20-power-count',word(items.length,'poder','poderes'));
    const search=node('input','r20-power-search');
    search.type='search';
    search.placeholder='Buscar habilidade…';
    search.setAttribute('aria-label','Buscar habilidades');
    const filters=node('div','r20-power-filters');
    filters.setAttribute('role','group');
    filters.setAttribute('aria-label','Tipo de poder');
    const choices=[['all','Todas'],['active','Ativas'],['passive','Passivas'],['pinned','Favoritas']];
    let kind='all',query='',selected=savedPower(),mobileScreen='list';
    const list=node('div','r20-power-list');
    const paneDetail=node('article','r20-power-detail');
    const detailContent=node('div','r20-power-detail-content');
    const back=button('← Voltar às habilidades','r20-power-back',()=>{
      mobileScreen='list';refreshScreen();
    });
    const detailTop=node('div','r20-power-detail-top');
    const detailTitle=node('h3','','Escolha um poder');
    const detailSub=node('small','');
    detailTop.append(detailTitle,detailSub);
    paneDetail.append(back,detailTop,detailContent);
    const columns=node('div','r20-power-columns');
    columns.append(list,paneDetail);
    const toolbarTop=node('div','r20-power-toolbar-top');
    toolbarTop.append(title,count);
    toolbox.append(toolbarTop,search,filters);
    board.append(toolbox,columns);
    dock.after(board);
    // Preserva o conteúdo e os event handlers reais no DOM, sem duplicar a lógica.
    const hidden=node('div','r20-powers-stash');
    hidden.hidden=true;
    hidden.append(abilities);
    pane.append(hidden);
    const controls=[];
    for(const [value,label] of choices){
      const b=button(label,'r20-filter',()=>{kind=value;refresh()});
      b.dataset.filter=value;
      filters.append(b);controls.push(b);
    }
    const normalize=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const matches=item=>(kind==='all'||(kind==='pinned'?item.pinned:kind===item.kind))&&normalize(item.name+' '+item.meta).includes(normalize(query));
    const sourceCard=item=>{
      if(item.card.parentElement!==item.parent)item.parent.append(item.card);
    };
    function refreshScreen(){
      pane.dataset.r20PowerScreen=mobileScreen;
      const active=list.querySelector('.r20-power-row[aria-current="true"]');
      if(active)active.scrollIntoView({block:'nearest'});
    }
    function select(key,fromUser=false){
      const item=items.find(x=>x.key===key);
      if(!item)return;
      const previous=items.find(x=>x.card.parentElement===detailContent);
      if(previous&&previous!==item)sourceCard(previous);
      selected=key;savePower(key);
      detailContent.append(item.card);
      item.card.classList.add('r20-ability-selected');
      detailTitle.textContent=item.name;
      detailSub.textContent=(item.kind==='active'?'ATIVA':'PASSIVA')+(item.meta?' · '+item.meta:'');
      for(const b of list.querySelectorAll('[data-power-key]'))b.setAttribute('aria-current',String(b.dataset.powerKey===key));
      if(fromUser)mobileScreen='detail';
      refreshScreen();
    }
    function redraw(){
      list.replaceChildren();
      for(const item of items){
        if(!matches(item))continue;
        const row=button('','r20-power-row',()=>select(item.key,true));
        row.dataset.powerKey=item.key;
        row.setAttribute('aria-label','Ver '+item.name);
        const marker=node('span','r20-power-type',item.kind==='active'?'A':'P');
        const copy=node('span','r20-power-row-copy');
        copy.append(node('strong','',item.name),node('small','',item.meta||item.kind));
        const rhs=node('span','r20-power-row-tail');
        if(item.stake)rhs.append(node('small','',item.stake));
        if(item.pinned)rhs.append(node('b','r20-power-favorite','★'));
        if(item.locked)rhs.append(node('b','r20-power-lock','◌'));
        row.append(marker,copy,rhs);
        row.setAttribute('aria-current',String(item.key===selected));
        list.append(row);
      }
      if(!list.childElementCount){
        list.append(node('p','r20-power-empty','Nenhuma habilidade encontrada.'));
        const active=items.find(x=>x.card.parentElement===detailContent);
        if(active)sourceCard(active);
        detailContent.replaceChildren();
        detailTitle.textContent='Nenhuma habilidade';
        detailSub.textContent='Tente outro filtro.';
        return;
      }
      const visible=items.filter(matches);
      if(!visible.some(x=>x.key===selected))selected=visible[0].key;
      select(selected,false);
    }
    function refresh(){
      controls.forEach(b=>{
        const active=b.dataset.filter===kind;
        b.classList.toggle('r20-selected',active);
        b.setAttribute('aria-pressed',String(active));
      });
      redraw();
    }
    search.addEventListener('input',()=>{query=search.value;refresh()});
    refresh();
  }
  function setup(){
    const sheet=document.getElementById('sheetView');
    if(!sheet||sheet.classList.contains('hidden')||!sheet.querySelector('.sheet-frame'))return;
    document.body.classList.add('duo-roll20-minimal');
    header(sheet);
    status(sheet.querySelector('[data-pane="status"]'));
    powers(sheet.querySelector('[data-pane="combat"]'));
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;setup()});
  }
  function init(){
    const root=document.getElementById('sheetView');if(!root)return;
    new MutationObserver(schedule).observe(root,{childList:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
