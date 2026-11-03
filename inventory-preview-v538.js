(function armamentariumPreviewV538(){
  'use strict';
  if(window.__DUO_ARMAMENTARIUM_MINIMAL_V538__)return;
  window.__DUO_ARMAMENTARIUM_MINIMAL_V538__=true;
  const modeKey='duo-preview-armamentarium-mode';
  const state={mode:(()=>{try{return sessionStorage.getItem(modeKey)||'all'}catch(_){return 'all'}})(),selected:'',query:'',filter:'all',searchOpen:false,filtersOpen:false,adding:false,mobileDetails:false,editing:false};
  let scheduled=false;
  const ICONS={
    sword:'<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    armor:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 3v17"/>',
    bow:'<circle cx="12" cy="12" r="9"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2"/>',
    potion:'<path d="M9 2h6M10 2v7l-6 10a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V2"/><path d="M7 16h10"/>',
    gem:'<path d="M6 3h12l4 6-10 12L2 9l4-6Z"/><path d="M2 9h20M10 3 8 9l4 12 4-12-2-6"/>',
    package:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/>',
    ammo:'<path d="m4 20 16-16M14 4h6v6"/><path d="m4 12 8 8M4 16l4 4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    check:'<path d="M9 12l2 2 4-4"/><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>',
    edit:'<path d="m16 4 4 4-11 11-5 1 1-5L16 4Z"/><path d="m14 6 4 4"/>',
    cards:'<rect x="6" y="4" width="15" height="17" rx="2"/><path d="M3 8v12a2 2 0 0 0 2 2h11M9 8h8M9 12h5"/>',
    right:'<path d="m9 18 6-6-6-6"/>',
    left:'<path d="m15 18-6-6 6-6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    chevron:'<path d="m6 9 6 6 6-6"/>'
  };
  const ico=(type,extra='')=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.classList.add('am-icon');
    if(extra)svg.classList.add(extra);
    svg.innerHTML=ICONS[type]||ICONS.package;
    return svg;
  };
  const el=(tag,cls,text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined&&text!==null)node.textContent=String(text);
    return node;
  };
  const button=(cls,iconName,label,click)=>{
    const btn=el('button',cls);
    btn.type='button';
    if(iconName)btn.append(ico(iconName));
    if(label)btn.append(el('span','',label));
    if(click)btn.addEventListener('click',click);
    return btn;
  };
  const v=(node,query)=>node.querySelector(query)?.value?.trim()||'';
  const checked=(node,query)=>!!node.querySelector(query)?.checked;
  const txt=(node,query)=>node.querySelector(query)?.textContent.replace(/\s+/g,' ').trim()||'';
  const cap=(value,max)=>value.length>max?value.slice(0,max-1).trim()+'…':value;
  const nativeSelected=(node,query)=>node.querySelector(query)?.selectedOptions?.[0]?.textContent.trim()||'';
  const imageOf=card=>card.querySelector('.inventory-image-preview img')?.getAttribute('src')||'';
  const controlsFor=(card,kind)=>{
    if(kind==='weapon')return {equipped:card.querySelector('[data-weapon-equipped]')};
    if(kind==='armor')return {equipped:card.querySelector('#armorEquipped')};
    if(kind==='shield')return {equipped:card.querySelector('#shieldEquipped')};
    return {pin:card.querySelector('[data-item-deck]'),consume:card.querySelector('[data-consume-item]')};
  };
  function readCard(card,kind){
    const c=controlsFor(card,kind),common={kind,card,equipped:!!c.equipped?.checked,pinned:!!c.pin?.checked,
      image:imageOf(card),heritage:false,quantity:1,material:'',notes:'',short:'',stats:'',type:'',name:'',icon:'package',category:'',placeholder:false};
    if(kind==='weapon'){
      const ranged=v(card,'[data-weapon-field$=":type"]')==='distancia';
      const stats=[...card.querySelectorAll('.weapon-results .pill')].slice(0,2).map(n=>n.textContent.trim()).filter(Boolean);
      return {...common,key:'weapon:'+card.dataset.weaponCard,name:v(card,'[data-weapon-field$=":name"]')||'Arma',type:ranged?'Arma à distância':'Arma',
        icon:ranged?'bow':'sword',material:nativeSelected(card,'[data-weapon-field$=":material"]')||'',
        heritage:checked(card,'[data-weapon-heritage]'),notes:v(card,'[data-weapon-field$=":notes"]'),
        stats:stats.join(' · '),short:txt(card,'.row.between .muted.compact'),category:'weapons'};
    }
    if(kind==='armor'||kind==='shield'){
      const shield=kind==='shield';
      const cardName=v(card,shield?'#shieldName':'#armorName');
      const emptyName=!cardName||cardName===(shield?'Escudo':'Armadura');
      const placeholder=emptyName&&!common.equipped&&!common.image;
      const rawStats=txt(card,'.subcard.compact');
      const armorMatch=rawStats.match(/\+(\d+)\s+Defesa\s*·\s*(\d+)\s+redução de dano/i);
      const shieldMatch=rawStats.match(/Defesa:\s*\+(\d+)/i);
      const compactStats=shield?(shieldMatch?'Defesa +'+shieldMatch[1]:cap(rawStats,90)):(armorMatch?'Defesa +'+armorMatch[1]+' · RD '+armorMatch[2]:cap(rawStats,90));
      return {...common,placeholder,key:kind,name:cardName||(shield?'Escudo':'Armadura'),type:shield?'Escudo':'Armadura',icon:shield?'shield':'armor',
        material:nativeSelected(card,shield?'#shieldMaterial':'#armorMaterial'),
        heritage:checked(card,'[data-equipment-heritage]'),stats:compactStats,short:txt(card,'.row.between span'),
        category:'equipment'};
    }
    const category=v(card,'[data-item-field$=":category"]')||'outro';
    const label=txt(card,'.inventory-kind-kicker')||'Item';
    const qty=Math.max(0,Number(v(card,'[data-item-field$=":qty"]'))||0);
    const effect=v(card,'[data-item-field$=":effect"]');
    const type=category==='consumivel'?'Consumível':category==='item-magico'?'Item mágico':category==='municao'?'Munição':
      category==='arma-corpo'?'Arma':category==='arma-distancia'?'Arma à distância':label;
    const icon=category==='consumivel'?'potion':category==='item-magico'?'gem':category==='municao'?'ammo':
      category==='arma-corpo'?'sword':category==='arma-distancia'?'bow':'package';
    const heritage=checked(card,'[data-item-check$=":isHeritage"]');
    return {...common,key:'item:'+card.dataset.itemCard,name:v(card,'[data-item-field$=":name"]')||'Item',type,icon,quantity:qty,
      material:v(card,'[data-item-field$=":material"]'),notes:v(card,'[data-item-field$=":notes"]'),
      stats:effect||'',short:effect,heritage,category};
  }
  function itemsFrom(pane){
    const result=[];
    const armor=pane.querySelector('#armorEditor');
    const shield=pane.querySelector('#shieldEditor');
    const weapons=[...pane.querySelectorAll('.weapon-list [data-weapon-card]')].map(card=>readCard(card,'weapon'));
    // Os itens em uso vêm primeiro; os guardados aparecem logo depois.
    result.push(...weapons.filter(item=>item.equipped));
    if(armor&&checked(armor,'#armorEquipped'))result.push(readCard(armor,'armor'));
    if(shield&&checked(shield,'#shieldEquipped'))result.push(readCard(shield,'shield'));
    result.push(...weapons.filter(item=>!item.equipped));
    if(armor&&!checked(armor,'#armorEquipped'))result.push(readCard(armor,'armor'));
    if(shield&&!checked(shield,'#shieldEquipped'))result.push(readCard(shield,'shield'));
    pane.querySelectorAll('.inventory-grid-large [data-item-card]').forEach(card=>result.push(readCard(card,'item')));
    return result;
  }
  function available(records){
    return records.filter(record=>{
      if(record.placeholder&&state.selected!==record.key)return false;
      if(state.mode==='equipment'&&record.kind==='item')return false;
      if(state.mode==='bag'&&(record.kind!=='item'||record.heritage))return false;
      if(state.mode==='heritage'&&!record.heritage)return false;
      if(state.filter==='equipped'&&!record.equipped)return false;
      if(state.filter==='pinned'&&!record.pinned&&!record.equipped)return false;
      if(['consumivel','item-magico','municao','outro'].includes(state.filter)&&record.category!==state.filter)return false;
      if(state.query){
        const normalized=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        if(!normalized([record.name,record.type,record.material,record.notes,record.short].join(' ')).includes(normalized(state.query)))return false;
      }
      return true;
    });
  }
  function cardThumbnail(item,large=false){
    const block=el('span',large?'am-image am-image-large':'am-image am-image-small');
    if(item.image){
      const image=document.createElement('img');
      image.src=item.image;image.alt='';
      image.loading='lazy';block.append(image);
    }else block.append(ico(item.icon));
    return block;
  }
  const equipmentStatus=record=>record.equipped?'Equipada':'Guardada';
  const statusFor=record=>record.heritage?'Herança':record.kind==='item'?
    (record.quantity===0?'Esgotado':record.pinned?'No baralho':'Disponível'):equipmentStatus(record);
  function mount(pane){
    if(pane.dataset.amReady)return;
    const toolbar=pane.querySelector('.inventory-toolbar-card');
    const ledger=pane.querySelector('.inventory-ledger');
    const protection=pane.querySelector('[data-inventory-kind="protection"]')?.closest('.mechanics-section');
    const weapons=pane.querySelector('[data-inventory-kind="weapons"]');
    const inventory=pane.querySelector('.inventory-grid-large')?.closest('.mechanics-section');
    if(!toolbar||!ledger||!protection||!weapons||!inventory)return;
    // Referências aos campos originais. Só os componentes visuais mudam.
    const records=itemsFrom(pane);
    const stash=el('div','am-originals');
    stash.hidden=true;
    stash.append(ledger,protection,weapons,inventory);
    const shell=el('section','am-shell');
    const used=el('section','am-used');
    const usedHeader=el('div','am-used-header');
    usedHeader.append(el('strong','','Em uso'),ico('check'));
    used.append(usedHeader);
    const chips=el('div','am-chips');
    used.append(chips);
    const tabs=el('div','am-tabs');
    tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Categorias do inventário');
    const tabChoices=[['all','Tudo'],['equipment','Equipamentos'],['bag','Bolsa'],['heritage','Heranças']];
    const tabButtons=tabChoices.map(([name,label])=>{
      const btn=button('am-tab','',label,()=>{state.mode=name;state.mobileDetails=false;state.editing=false;
        try{sessionStorage.setItem(modeKey,name)}catch(_){}
        refresh();});
      btn.dataset.amMode=name;tabs.append(btn);return btn;
    });
    const toolbarRow=el('div','am-toolbar');
    toolbarRow.append(tabs);
    const actionRow=el('div','am-toolbar-actions');
    const searchButton=button('am-icon-button','search','',()=>{
      state.searchOpen=!state.searchOpen;searchPanel.hidden=!state.searchOpen;
      searchButton.setAttribute('aria-expanded',String(state.searchOpen));
      if(state.searchOpen)searchInput.focus();
    });
    searchButton.setAttribute('aria-label','Buscar no inventário');
    searchButton.setAttribute('aria-expanded',String(state.searchOpen));
    const filterButton=button('am-icon-button','filter','',()=>{
      state.filtersOpen=!state.filtersOpen;filterPanel.hidden=!state.filtersOpen;
      filterButton.setAttribute('aria-expanded',String(state.filtersOpen));
    });
    filterButton.setAttribute('aria-label','Filtrar itens');
    filterButton.setAttribute('aria-expanded',String(state.filtersOpen));
    const addButton=button('am-icon-button','plus','',()=>{
      state.adding=!state.adding;addPanel.hidden=!state.adding;
      addButton.setAttribute('aria-expanded',String(state.adding));
      if(state.adding)addPanel.scrollIntoView({behavior:'auto',block:'nearest'});
    });
    addButton.title='Adicionar item';addButton.setAttribute('aria-label','Adicionar item');
    addButton.setAttribute('aria-expanded',String(state.adding));
    actionRow.append(searchButton,filterButton,addButton);
    toolbarRow.append(actionRow);
    const searchPanel=el('div','am-search-panel');
    searchPanel.hidden=!state.searchOpen;
    const searchInput=el('input','am-input');
    searchInput.type='search';searchInput.placeholder='Buscar pelo nome ou descrição...';
    searchInput.setAttribute('aria-label','Buscar itens');
    searchInput.value=state.query;
    searchInput.addEventListener('input',()=>{state.query=searchInput.value;refresh()});
    searchPanel.append(searchInput);
    const filterPanel=el('div','am-search-panel am-filter-panel');
    filterPanel.hidden=!state.filtersOpen;
    const filterSelect=el('select','am-input');
    filterSelect.setAttribute('aria-label','Filtrar por tipo ou situação');
    for(const [id,label] of [['all','Todos os tipos'],['equipped','Em uso'],['pinned','No baralho'],['consumivel','Consumíveis'],['item-magico','Itens mágicos'],['municao','Munições'],['outro','Outros']]){
      const option=el('option','',label);option.value=id;filterSelect.append(option);
    }
    filterSelect.value=state.filter;
    filterSelect.addEventListener('change',()=>{state.filter=filterSelect.value;refresh()});
    filterPanel.append(filterSelect);
    const upper=el('div','am-results-header');
    const count=el('span','am-results-count');
    upper.append(count);
    const content=el('div','am-content');
    const left=el('div','am-left');
    const list=el('div','am-list');
    left.append(list);
    const right=el('aside','am-detail');
    right.setAttribute('aria-live','polite');
    content.append(left,right);
    const addPanel=el('section','am-add-panel');
    addPanel.hidden=!state.adding;
    addPanel.append(toolbar);
    const notesPanel=el('details','am-extra-notes');
    const notesLabel=el('summary','','Notas gerais do inventário');
    notesPanel.append(notesLabel);
    const notesOriginal=stash.querySelector('#inventoryNotes')?.closest('label');
    if(notesOriginal)notesPanel.append(notesOriginal);
    shell.append(used,toolbarRow,searchPanel,filterPanel,upper,content,addPanel,notesPanel);
    pane.append(stash);
    pane.prepend(shell);
    pane.classList.add('duo-inventory-preview','am-minimal-pane');
    pane.dataset.amReady='true';
    const restore=typeof window.DUODECIMA_PREVIEW_RESTORE_DEMO==='function';
    if(restore){
      const demo=button('am-reset','','Restaurar exemplo',()=>window.DUODECIMA_PREVIEW_RESTORE_DEMO());
      demo.title='Reiniciar os itens fictícios desta prévia';
      const low=el('div','am-demo-footer');
      low.append(el('span','','Versão experimental · alterações somente nesta demonstração'),demo);
      shell.append(low);
    }
    function renderChips(){
      chips.replaceChildren();
      const usedWeapons=records.filter(x=>x.kind==='weapon'&&x.equipped);
      const armor=records.find(x=>x.kind==='armor');
      const shield=records.find(x=>x.kind==='shield');
      const chip=(item,text,iconName)=>{
        const b=button('am-chip',iconName,text,()=>{
          if(!item){state.mode='equipment';state.query='';searchInput.value='';state.filter='all';filterSelect.value='all';refresh();return}
          state.mode='all';state.query='';searchInput.value='';state.filter='all';filterSelect.value='all';
          state.selected=item.key;state.mobileDetails=true;refresh();
        });
        chips.append(b);
      };
      if(usedWeapons.length)usedWeapons.forEach(x=>chip(x,cap(x.name,25),x.icon));
      else chip(records.find(x=>x.kind==='weapon'),'Sem arma','sword');
      if(armor?.equipped)chip(armor,cap(armor.name,25),'armor');
      else chip(armor,'Sem armadura','armor');
      if(shield?.equipped)chip(shield,cap(shield.name,25),'shield');
      else chip(shield,'Sem escudo','shield');
    }
    function renderRows(filtered){
      list.replaceChildren();
      if(!filtered.length){
        list.append(el('div','am-empty-list','Nenhum item encontrado. Tente outra categoria ou filtro.'));
        return;
      }
      filtered.forEach(record=>{
        const row=button('am-item-row','',null,()=>{
          state.selected=record.key;state.editing=false;state.mobileDetails=true;
          refresh();
          if(window.matchMedia('(max-width:760px)').matches){
            requestAnimationFrame(()=>right.scrollIntoView({behavior:'auto',block:'start'}));
          }
        });
        row.dataset.amItem=record.key;
        row.setAttribute('aria-label','Ver detalhes de '+record.name);
        row.classList.toggle('am-selected',record.key===state.selected);
        row.append(cardThumbnail(record));
        const copy=el('span','am-item-copy');
        copy.append(el('strong','',record.name));
        const descriptor=record.heritage?'Herança':record.type;
        const status=statusFor(record);
        copy.append(el('small','',descriptor+' · '+status));
        row.append(copy);
        const countVal=record.kind==='item'?'×'+record.quantity:'×1';
        row.append(el('span','am-qty',countVal),ico('right','am-row-chevron'));
        list.append(row);
      });
    }
    function showDetail(record){
      // Se um editor estava aberto, devolve seu DOM ao armazenamento oculto.
      const oldEditor=right.querySelector('.am-editor-native > [data-item-card],.am-editor-native > [data-weapon-card],.am-editor-native > #armorEditor,.am-editor-native > #shieldEditor');
      if(oldEditor)stash.append(oldEditor);
      right.replaceChildren();
      if(!record){
        right.append(el('p','am-detail-empty','Selecione um item à esquerda para ver os detalhes.'));
        return;
      }
      const back=button('am-mobile-back','left','Voltar aos itens',()=>{state.mobileDetails=false;state.editing=false;refresh()});
      right.append(back);
      const read=el('div','am-detail-read');
      const hero=el('div','am-detail-image');
      hero.append(cardThumbnail(record,true));
      read.append(hero);
      read.append(el('span','am-detail-type',record.heritage?'HERANÇA · '+record.type:record.type.toUpperCase()));
      read.append(el('h3','am-detail-name',record.name));
      if(record.material)read.append(el('p','am-detail-material',record.material));
      const details=el('div','am-properties');
      const propHeader=el('div','am-prop-header');
      propHeader.append(el('span','','Propriedades'),el('span','am-prop-status',record.kind==='item'?
        (record.pinned?'No baralho':'Guardado'):record.equipped?'Equipado':'Guardado'));
      details.append(propHeader);
      const brief=record.stats||record.short|| (record.kind==='item'?'Quantidade: '+record.quantity:'Nenhum bônus específico');
      details.append(el('strong','am-property-value',cap(brief,250)));
      if(record.kind==='item')details.append(el('small','am-property-support','Quantidade: '+record.quantity));
      else if(record.short&&record.stats!==record.short)details.append(el('small','am-property-support',cap(record.short,130)));
      read.append(details);
      const description=el('div','am-description');
      description.append(el('span','','Descrição'),el('p','',record.notes||record.short||'Nenhuma descrição registrada.'));
      read.append(description);
      const actions=el('div','am-detail-actions');
      const editBtn=button('am-primary','edit','Editar',()=>openEdit());
      actions.append(editBtn);
      if(record.kind==='item'){
        const pinBtn=button('am-secondary','cards',record.pinned?'Remover do baralho':'Baralho',()=>{
          const c=controlsFor(record.card,record.kind);
          if(c.pin)c.pin.click();
        });
        pinBtn.setAttribute('aria-pressed',String(record.pinned));
        pinBtn.title=record.pinned?'Remover a carta do baralho':'Adicionar a carta ao baralho';
        actions.append(pinBtn);
        const c=controlsFor(record.card,record.kind);
        if(c.consume){
          const consume=button('am-text-action','potion','Consumir 1',()=>c.consume.click());
          consume.disabled=record.quantity<=0;
          read.append(actions,consume);
        }else read.append(actions);
      }else{
        const equip=button('am-secondary','check',record.equipped?'Desequipar':'Equipar',()=>{
          const c=controlsFor(record.card,record.kind);
          if(c.equipped)c.equipped.click();
        });
        actions.append(equip);
        read.append(actions);
        if(record.equipped){
          const viewDeck=button('am-text-action','cards','Ver no baralho de combate',()=>{
            document.querySelector('#sheetView [data-tab="combat"]')?.click();
          });
          read.append(viewDeck);
        }
      }
      const editor=el('div','am-edit-view');
      editor.hidden=true;
      const editHeader=el('div','am-edit-header');
      editHeader.append(el('strong','','Editar '+record.name));
      editHeader.append(button('am-icon-button','x','',()=>{
        state.editing=false;showDetail(readCard(record.card,record.kind));
      }));
      const stage=el('div','am-editor-native');
      editor.append(editHeader,stage);
      right.append(read,editor);
      function openEdit(){
        state.editing=true;
        read.hidden=true;
        editor.hidden=false;
        stage.append(record.card);
        record.card.classList.remove('hidden');
        record.card.classList.add('am-native-editing');
        // Não duplicamos inputs; os mesmos controles do site continuam ativos.
        const nameInput=stage.querySelector('input[id$="Name"],[data-weapon-field$=":name"],[data-item-field$=":name"]');
        if(nameInput)nameInput.focus({preventScroll:true});
      }
      const update=()=>{
        if(!right.isConnected)return;
        const fresh=readCard(record.card,record.kind);
        if(!state.editing){
          state.selected=fresh.key;showDetail(fresh);
          const itemRow=list.querySelector('[data-am-item="'+CSS.escape(fresh.key)+'"]');
          if(itemRow){
            itemRow.querySelector('.am-item-copy strong').textContent=fresh.name;
          }
        }
      };
      record.card.addEventListener('change',update,{once:true});
      // Text is committed to original inputs by existing handlers.
    }
    function refresh(){
      const visible=available(records);
      if(!visible.some(x=>x.key===state.selected))state.selected=visible[0]?.key||'';
      for(const tab of tabButtons){
        const on=tab.dataset.amMode===state.mode;
        tab.classList.toggle('am-current',on);
        tab.setAttribute('aria-pressed',String(on));
      }
      count.textContent=visible.length+' registro'+(visible.length===1?'':'s');
      pane.dataset.amScreen=state.mobileDetails?'detail':'list';
      renderChips();
      renderRows(visible);
      const record=visible.find(x=>x.key===state.selected);
      showDetail(record);
    }
    refresh();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      const pane=document.querySelector('#sheetView [data-pane="inventory"]');
      if(pane&&!pane.dataset.amReady)mount(pane);
    });
  }
  function initialize(){
    const root=document.getElementById('sheetView');
    if(!root)return;
    new MutationObserver(schedule).observe(root,{childList:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
