(function previewInventoryV538(){
  'use strict';
  if(window.__DUODECIMA_INV_PREVIEW_V538__)return;
  window.__DUODECIMA_INV_PREVIEW_V538__=true;
  const STORAGE_KEY='duodecima-preview-inventory-view-v538';
  const EXPANDED=new Set();
  let scheduled=false;
  const storageRead=()=>{try{return sessionStorage.getItem(STORAGE_KEY)||'equipment'}catch(_){return 'equipment'}};
  const storageWrite=v=>{try{sessionStorage.setItem(STORAGE_KEY,v)}catch(_){}};
  const html=(tag,cls,text)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!=null)el.textContent=String(text);
    return el;
  };
  const attr=(el,a)=>el?.getAttribute(a)||'';
  const inputValue=(element,selector)=>element.querySelector(selector)?.value?.trim()||'';
  function safeKey(card,kind){
    return kind+':'+(card.dataset.itemCard||card.dataset.weaponCard||card.id);
  }
  function summaryData(editor,kind){
    if(kind==='weapon'){
      const name=inputValue(editor,'[data-weapon-field$=":name"]')||'Arma';
      const ranged=inputValue(editor,'[data-weapon-field$=":type"]')==='distancia';
      const stats=[...editor.querySelectorAll('.weapon-results .pill')].slice(0,2).map(el=>el.textContent.trim());
      const durable=editor.querySelector('.row.between .muted.compact')?.textContent.trim()||'';
      return {name,type:ranged?'Arma à distância':'Arma corpo a corpo',meta:stats.join('  ·  '),
        secondary:durable,status:editor.querySelector('[data-weapon-equipped]')?.checked?'Equipada':'Guardada',
        heritage:!!editor.querySelector('[data-weapon-heritage]')?.checked,quantity:''};
    }
    if(kind==='armor'||kind==='shield'){
      const shield=kind==='shield',name=inputValue(editor,'#'+kind+'Name')||(shield?'Escudo':'Armadura');
      const description=editor.querySelector('.subcard.compact')?.textContent.replace(/\s+/g,' ').trim()||'';
      const durability=editor.querySelector('.row.between span')?.textContent.replace(/\s+/g,' ').trim()||'';
      return {name,type:shield?'Escudo':'Armadura',meta:description,secondary:durability,
        status:editor.querySelector('#'+kind+'Equipped')?.checked?'Em uso':'Guardado',
        heritage:false,quantity:''};
    }
    const name=inputValue(editor,'[data-item-field$=":name"]')||'Item';
    const cat=editor.querySelector('.inventory-kind-kicker')?.textContent.trim()||'Item';
    const qty=Number(inputValue(editor,'[data-item-field$=":qty"]')||0);
    const effect=inputValue(editor,'[data-item-field$=":effect"]');
    const composition=inputValue(editor,'[data-item-field$=":material"]');
    const onDeck=!!editor.querySelector('[data-item-deck]')?.checked;
    return {name,type:cat,meta:effect||composition||'Sem efeito curto registrado',
      secondary:composition&&(effect?'Material: '+composition:'')||'',
      status:qty<=0?'Esgotado':onDeck?'No baralho':'Guardado',
      heritage:!!editor.querySelector('[data-item-check$=":isHeritage"]')?.checked,
      quantity:'Qtd. '+Math.max(0,qty)};
  }
  function compactCard(card,kind){
    if(card.dataset.duoPreviewCard)return;
    card.dataset.duoPreviewCard=kind;
    card.classList.add('duo-preview-card');
    const key=safeKey(card,kind);
    const editor=html('div','duo-preview-card-editor');
    while(card.firstChild)editor.appendChild(card.firstChild);
    const header=html('div','duo-preview-card-head');
    const photo=html('div','duo-preview-card-photo');
    const originalPhoto=editor.querySelector('.inventory-image-preview');
    if(originalPhoto){
      const image=originalPhoto.querySelector('img');
      if(image)photo.append(image.cloneNode(true));
      else photo.append(html('span','duo-preview-photo-empty',kind==='weapon'?'⚔':kind==='shield'?'⬡':kind==='armor'?'♜':'✧'));
    }else photo.append(html('span','duo-preview-photo-empty','✧'));
    const textArea=html('div','duo-preview-card-copy');
    const topLine=html('div','duo-preview-card-title-row');
    const kindEl=html('span','duo-preview-kind');
    const badge=html('span','duo-preview-item-status');
    topLine.append(kindEl,badge);
    const title=html('strong','duo-preview-item-title');
    const stats=html('div','duo-preview-item-stats');
    const info=html('div','duo-preview-item-info');
    const controls=html('div','duo-preview-item-actions');
    const flags=html('div','duo-preview-item-flags');
    const toggle=html('button','duo-preview-expand');
    toggle.type='button';
    toggle.textContent='Detalhes e edição';
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Mostrar informações completas e editar este item');
    const chevron=html('span','duo-preview-chevron','⌄');
    chevron.setAttribute('aria-hidden','true');
    toggle.append(chevron);
    controls.append(flags,toggle);
    textArea.append(topLine,title,stats,info,controls);
    header.append(photo,textArea);
    card.append(header,editor);
    // Mantemos os próprios controles do app. Mover nós preserva seus event handlers.
    const equipped=kind==='item'?null:editor.querySelector(kind==='weapon'?'[data-weapon-equipped]':kind==='armor'?'#armorEquipped':'#shieldEquipped');
    if(equipped){
      const label=equipped.closest('label');
      if(label){
        label.classList.add('duo-preview-inline-toggle');
        flags.append(label);
      }
    }
    if(kind==='item'){
      const consume=editor.querySelector('[data-consume-item]');
      if(consume){
        consume.classList.add('duo-preview-consume');
        flags.append(consume);
      }
    }
    function refresh(){
      const d=summaryData(editor,kind);
      kindEl.textContent=d.type;
      title.textContent=d.name;
      stats.textContent=d.meta;
      info.textContent=d.secondary||'';
      badge.textContent=d.heritage?'✦ Herança':d.quantity||d.status;
      badge.dataset.state=d.heritage?'heritage':d.status==='Esgotado'?'empty':d.status==='Equipada'||d.status==='Em uso'?'active':'normal';
      if(d.heritage&&d.quantity)info.textContent=[d.secondary,d.quantity].filter(Boolean).join(' · ');
    }
    function setOpen(open){
      editor.hidden=!open;
      card.classList.toggle('duo-preview-expanded',open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.firstChild.textContent=open?'Ocultar edição':'Detalhes e edição';
      if(open)EXPANDED.add(key);else EXPANDED.delete(key);
    }
    toggle.addEventListener('click',()=>setOpen(editor.hidden));
    editor.addEventListener('input',refresh);
    editor.addEventListener('change',refresh);
    refresh();
    setOpen(EXPANDED.has(key));
  }
  function titleCard(){
    const bar=html('div','duo-preview-banner');
    const icon=html('span','duo-preview-banner-icon','XII');
    const copy=html('div','duo-preview-banner-text');
    copy.append(html('span','duo-preview-eyebrow','ARMAMENTARIUM · PROTÓTIPO V5.38'),html('h2','duo-preview-banner-title','Inventário'));
    const caption=html('p','duo-preview-banner-caption','Teste visual independente · os jogadores continuam na versão atual.');
    copy.append(caption);
    bar.append(icon,copy);
    return bar;
  }
  function sectionHeader(name,description){
    const wrap=html('div','duo-preview-section-heading');
    const copy=html('div','');
    copy.append(html('span','duo-preview-eyebrow','EQUIPAMENTOS DA LEGIÃO'),html('h3','',name));
    if(description)copy.append(html('p','',description));
    wrap.append(copy);
    return wrap;
  }
  function enhance(pane){
    if(!pane||pane.dataset.duoInventoryPreviewReady)return;
    const toolbar=pane.querySelector('.inventory-toolbar-card');
    const protection=pane.querySelector('[data-inventory-kind="protection"]')?.closest('.mechanics-section');
    const weapons=pane.querySelector('[data-inventory-kind="weapons"]');
    const items=pane.querySelector('.inventory-grid-large')?.closest('.mechanics-section');
    const search=toolbar?.querySelector('#inventorySearch');
    const filter=toolbar?.querySelector('#inventoryFilter');
    if(!toolbar||!protection||!weapons||!items||!search||!filter)return;
    pane.dataset.duoInventoryPreviewReady='1';
    pane.classList.add('duo-inventory-preview');
    const banner=titleCard();
    const tools=html('div','duo-preview-controls');
    const tabs=html('div','duo-preview-tabs');
    tabs.setAttribute('role','group');
    tabs.setAttribute('aria-label','Visualização do inventário');
    const modes=[['equipment','Equipamentos'],['items','Itens'],['heritage','Heranças']];
    const buttons=modes.map(([value,label])=>{
      const b=html('button','duo-preview-tab',label);
      b.type='button';b.dataset.previewMode=value;
      tabs.append(b);return b;
    });
    const searchWrap=html('div','duo-preview-search-row');
    searchWrap.append(toolbar.querySelector('.inventory-filter-row'));
    const actions=html('div','duo-preview-actions');
    const addButton=html('button','primary duo-preview-add','+ Adicionar item');
    addButton.type='button';addButton.setAttribute('aria-expanded','false');
    addButton.setAttribute('aria-controls','duoPreviewAddPanel');
    toolbar.id='duoPreviewAddPanel';toolbar.classList.add('duo-preview-add-panel');
    toolbar.hidden=true;
    addButton.addEventListener('click',()=>{
      toolbar.hidden=!toolbar.hidden;
      addButton.setAttribute('aria-expanded',String(!toolbar.hidden));
      addButton.textContent=toolbar.hidden?'+ Adicionar item':'− Fechar adição';
    });
    actions.append(addButton);
    tools.append(tabs,searchWrap,actions);
    pane.insertBefore(banner,toolbar);
    pane.insertBefore(tools,toolbar);
    const equipGroup=html('div','duo-preview-equipment-group');
    const itemsGroup=html('div','duo-preview-items-group');
    pane.insertBefore(equipGroup,protection);
    equipGroup.append(protection,weapons);
    pane.insertBefore(itemsGroup,items);
    itemsGroup.append(items);
    // Os cards existentes e seus manipuladores permanecem intactos, apenas
    // apresentados como modo leitura + editor recolhível.
    [pane.querySelector('#armorEditor'),pane.querySelector('#shieldEditor')].forEach((card,i)=>{if(card)compactCard(card,i===0?'armor':'shield')});
    pane.querySelectorAll('[data-weapon-card]').forEach(card=>compactCard(card,'weapon'));
    pane.querySelectorAll('[data-item-card]').forEach(card=>compactCard(card,'item'));
    const filterSelect=filter;
    const setMode=(mode,remember=true)=>{
      if(!modes.some(([k])=>k===mode))mode='equipment';
      pane.dataset.previewMode=mode;
      buttons.forEach(b=>{const active=b.dataset.previewMode===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
      if(remember)storageWrite(mode);
      const filterValue=mode==='heritage'?'heritage':'all';
      if(filterSelect.value!==filterValue){filterSelect.value=filterValue;filterSelect.dispatchEvent(new Event('change',{bubbles:true}))}
      else search.dispatchEvent(new Event('input',{bubbles:true}));
    };
    buttons.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.previewMode)));
    // Se filtrar por uma categoria de item, abra a visualização adequada.
    filterSelect.addEventListener('change',()=>{
      if(!pane.isConnected)return;
      const val=filterSelect.value;
      if(val==='heritage'&&pane.dataset.previewMode!=='heritage')setMode('heritage');
      else if(val!=='all'&&val!=='weapons'&&val!=='heritage'&&pane.dataset.previewMode!=='items')setMode('items');
    });
    setMode(storageRead(),false);
    const existingHelp=pane.querySelector('.inventory-help-inline');
    if(existingHelp)toolbar.append(existingHelp);
    const label=toolbar.querySelector(':scope > div:first-child h2');
    if(label)label.textContent='Adicionar um item ao inventário';
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      enhance(document.querySelector('#sheetView [data-pane="inventory"]'));
    });
  }
  function init(){
    const root=document.getElementById('sheetView');
    if(!root)return;
    new MutationObserver(schedule).observe(root,{childList:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
