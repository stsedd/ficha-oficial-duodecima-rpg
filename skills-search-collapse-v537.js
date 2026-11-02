/* Duodécima v5.37: busca local em fichas já renderizadas e recolhimento opcional.
   Não grava dados do personagem, não modifica regras ou IDs de campos. */
(() => {
 'use strict';
 const SHEET='sheetView';
 const PANES={status:'Visão geral',combat:'Combate & Poderes',inventory:'Inventário',familiars:'Familiares',roma:'Roma',magic:'Magia',history:'História',notes:'Notas'};
 const FOLDS=[
  {selector:'.overview-talents',label:'Talentos e escolhas',id:'talents'},
  {selector:'.overview-quick',label:'Informações complementares',id:'quick'},
  {selector:'.inventory-toolbar-card',label:'Adicionar novos itens',id:'new-items'},
  {selector:'.lineage-config-visible',label:'Configurações de linhagem',id:'lineage'}
 ];
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const root=()=>document.getElementById(SHEET);
 const sheetReady=()=>{const x=root();return x&&!x.classList.contains('hidden')};
 const sessionKey=id=>'duo-v537-fold-'+String(window.DUODECIMA_CHARACTER_STORAGE_KEY||'legacy')+':'+id;
 const originalState=id=>{try{return sessionStorage.getItem(sessionKey(id))==='closed'}catch(_){return false}};
 const saveFold=(id,collapsed)=>{try{sessionStorage.setItem(sessionKey(id),collapsed?'closed':'open')}catch(_){}};
 let dialog,input,list,entries=[],filtered=[],active=-1,scheduled=false;
 function setFold(el,collapsed,remember){
  el.classList.toggle('duo-is-collapsed',collapsed);
  [...el.children].forEach(child=>{if(!child.classList.contains('duo-collapse-toggle'))child.hidden=collapsed});
  const btn=el.querySelector(':scope > .duo-collapse-toggle');
  btn?.setAttribute('aria-expanded',String(!collapsed));
  if(remember)saveFold(el.dataset.duoFold,collapsed);
 }
 function decorateFolds(){
  const host=root();if(!host)return;
  for(const cfg of FOLDS){
   host.querySelectorAll(cfg.selector).forEach(container=>{
    if(container.dataset.duoFold)return;
    const content=[...container.children];if(!content.length)return;
    container.dataset.duoFold=cfg.id;
    container.classList.add('duo-optional-collapsible');
    const button=document.createElement('button');
    button.type='button';button.className='duo-collapse-toggle';
    const title=document.createElement('span'),chevron=document.createElement('span');
    title.textContent=cfg.label;chevron.className='duo-collapse-chevron';chevron.textContent='▾';chevron.setAttribute('aria-hidden','true');
    button.append(title,chevron);
    button.setAttribute('aria-label','Mostrar ou recolher '+cfg.label);
    const controlled=content.map((child,index)=>{if(!child.id)child.id='duo-v537-fold-'+cfg.id+'-'+index;return child.id});
    button.setAttribute('aria-controls',controlled.join(' '));
    container.prepend(button);
    button.addEventListener('click',()=>setFold(container,!container.classList.contains('duo-is-collapsed'),true));
    setFold(container,originalState(cfg.id),false);
   });
  }
 }
 function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;decorateFolds()});
 }
 const target=(selector,attr,value)=>{
  const h=root();if(!h)return null;
  return [...h.querySelectorAll(selector)].find(el=>attr?(el.getAttribute(attr)===value):true)||null;
 };
 function index(){
  const host=root();if(!host)return [];
  const out=[],seen=new Set();
  function add(category,tab,label,selector,attribute,value,extra=''){
   label=String(label||'').trim();if(!label)return;
   const key=category+'|'+tab+'|'+value;
   if(seen.has(key))return;seen.add(key);
   out.push({category,tab,label,selector,attribute,value,extra,search:norm(label+' '+category+' '+extra)});
  }
  host.querySelectorAll('.skill-ledger-row[data-skill-name]').forEach(el=>{
   add('Perícia','status',el.getAttribute('data-skill-name'),'.skill-ledger-row','data-skill-name',el.getAttribute('data-skill-name'),'atributos perícias');
  });
  host.querySelectorAll('[data-ability-key]').forEach(el=>{
   const name=el.querySelector('.ability-title-row b')?.textContent||el.querySelector('.ability-head b')?.textContent;
   add('Habilidade','combat',name,'[data-ability-key]','data-ability-key',el.getAttribute('data-ability-key'),'poderes combate');
  });
  host.querySelectorAll('[data-item-card]').forEach(el=>{
   const name=el.querySelector('input[data-item-field$=":name"]')?.value||el.getAttribute('data-inventory-name');
   add('Item','inventory',name,'[data-item-card]','data-item-card',el.getAttribute('data-item-card'),'inventário equipamento');
  });
  host.querySelectorAll('[data-weapon-card]').forEach(el=>{
   const name=el.querySelector('input[data-weapon-field$=":name"]')?.value||el.getAttribute('data-inventory-name');
   add('Arma','inventory',name,'[data-weapon-card]','data-weapon-card',el.getAttribute('data-weapon-card'),'equipamento inventário');
  });
  for(const [id,name] of [['armorEditor','Armadura'],['shieldEditor','Escudo']]){
   const el=document.getElementById(id);
   if(el&&host.contains(el))add('Equipamento','inventory',document.getElementById(id==='armorEditor'?'armorName':'shieldName')?.value||name,'#'+id,'',id,'inventário');
  }
  host.querySelectorAll('.familiar-card[data-familiar-id]').forEach(el=>{
   const name=el.querySelector('input[data-familiar-field$=":name"]')?.value;
   add('Familiar','familiars',name,'.familiar-card','data-familiar-id',el.getAttribute('data-familiar-id'),'companheiros montarias');
  });
  host.querySelectorAll('.spell-card[data-spell-id]').forEach(el=>{
   const name=el.querySelector('input[data-spell-field$=":name"]')?.value||el.querySelector('.row b')?.textContent;
   add('Magia','magic',name,'.spell-card','data-spell-id',el.getAttribute('data-spell-id'),'feitiço círculo');
  });
  host.querySelectorAll('.talent-compact-item').forEach((el,i)=>{
   const label=el.querySelector('b')?.textContent;
   add('Talento','status',label,'.talent-compact-item','data-duo-search-id','talent-'+i,'talentos');
   el.setAttribute('data-duo-search-id','talent-'+i);
  });
  return out;
 }
 function makeDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.className='duo-global-search-dialog';
  dialog.id='duoGlobalSearchDialog';dialog.setAttribute('aria-labelledby','duoGlobalSearchHeading');
  dialog.innerHTML=[
   '<div class="duo-global-search-card">',
    '<div class="duo-global-search-head"><strong id="duoGlobalSearchHeading">Busca rápida</strong><button type="button" data-search-close aria-label="Fechar busca">×</button></div>',
    '<input id="duoGlobalSearchInput" class="duo-global-search-input" type="search" autocomplete="off" placeholder="Perícia, habilidade, item, familiar..." aria-label="Buscar na ficha" aria-controls="duoGlobalSearchResults">',
    '<div id="duoGlobalSearchResults" class="duo-global-search-list" role="listbox" aria-label="Resultados da busca"></div>',
    '<p class="duo-global-search-hint">Pesquise por nome. Enter abre o resultado · ↑↓ navegam · Esc fecha. No PC: Ctrl + K.</p>',
   '</div>'
  ].join('');
  document.body.appendChild(dialog);
  input=dialog.querySelector('#duoGlobalSearchInput');list=dialog.querySelector('#duoGlobalSearchResults');
  dialog.querySelector('[data-search-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  input.addEventListener('input',()=>filter(input.value));
  input.addEventListener('keydown',e=>{
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();focusResult(e.key==='ArrowDown'?1:-1)}
   if(e.key==='Enter'&&filtered.length){e.preventDefault();openResult(filtered[Math.max(0,active)])}
  });
  list.addEventListener('click',event=>{
   const button=event.target.closest('[data-search-result]');
   if(button)openResult(filtered[Number(button.dataset.searchResult)]);
  });
  list.addEventListener('keydown',event=>{
   if(!['ArrowDown','ArrowUp'].includes(event.key))return;
   event.preventDefault();
   focusResult(event.key==='ArrowDown'?1:-1);
  });
  return dialog;
 }
 function focusResult(direction){
  if(!filtered.length)return;
  active=active<0?0:(active+direction+filtered.length)%filtered.length;
  const button=list.querySelector('[data-search-result="'+active+'"]');
  if(button){button.focus();button.scrollIntoView({block:'nearest'})}
 }
 function filter(query){
  const search=norm(query);
  filtered=(search?entries.filter(e=>e.search.includes(search)):entries).slice(0,40);
  active=-1;list.replaceChildren();
  if(!filtered.length){const msg=document.createElement('p');msg.className='duo-global-search-empty';msg.textContent='Nenhum resultado encontrado nesta ficha.';list.append(msg);return}
  filtered.forEach((entry,i)=>{
   const button=document.createElement('button');
   button.type='button';button.className='duo-global-search-result';button.dataset.searchResult=String(i);
   button.setAttribute('role','option');button.setAttribute('aria-label',entry.category+': '+entry.label+', '+PANES[entry.tab]);
   const label=document.createElement('b'),meta=document.createElement('small');
   label.textContent=entry.label;meta.textContent=entry.category+' · '+PANES[entry.tab];
   button.append(label,meta);list.append(button);
  });
 }
 function expandParents(element){
  let node=element;
  while(node&&node!==root()){
   if(node.matches?.('.duo-optional-collapsible.duo-is-collapsed'))setFold(node,false,true);
   if(node.tagName==='DETAILS'&&!node.open)node.open=true;
   node=node.parentElement;
  }
 }
 function openResult(entry){
  if(!entry)return;
  if(dialog.open)dialog.close();
  const selected=root()?.querySelector('[data-tab].active')?.dataset.tab;
  if(selected!==entry.tab){
   root()?.querySelector('[data-tab="'+entry.tab+'"]')?.click();
  }
  // A troca de aba pode acionar renderSheet(), portanto recupere o nó pelo ID original.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const el=target(entry.selector,entry.attribute,entry.value);
   if(!el)return;
   expandParents(el);
   const hadTabindex=el.hasAttribute('tabindex');
   if(!hadTabindex)el.setAttribute('tabindex','-1');
   el.classList.add('duo-search-highlight');
   el.focus?.({preventScroll:true});
   el.scrollIntoView({block:'center',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth'});
   window.setTimeout(()=>{
    if(!el.isConnected)return;
    el.classList.remove('duo-search-highlight');
    if(!hadTabindex)el.removeAttribute('tabindex');
   },1700);
  }));
 }
 function openSearch(){
  if(!sheetReady())return;
  makeDialog();
  entries=index();filter('');
  if(dialog.open){input.focus();return}
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
  input.value='';filter('');input.focus();
 }
 function init(){
  const host=root();
  if(host)new MutationObserver(schedule).observe(host,{childList:true});
  schedule();
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-global-search]')){e.preventDefault();openSearch()}});
  document.addEventListener('keydown',event=>{
   if(event.key.toLowerCase()==='k'&&(event.ctrlKey||event.metaKey)&&!event.altKey&&sheetReady()){
    event.preventDefault();openSearch();
   }
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
