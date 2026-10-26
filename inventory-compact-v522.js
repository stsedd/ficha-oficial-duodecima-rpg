/* Inventário compacto · camada progressiva; não altera nem migra os dados da ficha. */
(function(){
'use strict';
let busy=false;
function refresh(){
 if(busy)return;busy=true;
 try{
 const pane=document.querySelector('[data-pane="inventory"]');if(!pane)return;
 const options=pane.querySelectorAll('#inventoryLibrarySelect option');
 const metal={ 'ferro-aco':'Ferro / Aço',mithril:'Mithril','bronze-celestial':'Bronze Celestial',uro:'Uro','ouro-imperial':'Ouro Imperial','ferro-estigio':'Ferro Estígio'};
 options.forEach(opt=>{
  const id=opt.value||'';if(!id.startsWith('weapon-'))return;
  const k=Object.keys(metal).find(key=>id.endsWith('-'+key));
  if(k&&!opt.textContent.includes(metal[k]))opt.textContent=opt.textContent.replace(/ · arma$/,'')+' · '+metal[k];
 });
 const toolbar=pane.querySelector('.inventory-toolbar-card');
 const ledger=pane.querySelector('.inventory-ledger');
 if(toolbar&&ledger&&!toolbar.querySelector('.inventory-help-inline')){
  const cards=ledger.querySelectorAll(':scope > article');
  if(cards.length>1){
   const help=document.createElement('div');help.className='inventory-help-inline';
   const details=document.createElement('details');details.innerHTML='<summary>Como o inventário funciona · Notas gerais</summary>';
   const content=document.createElement('div');
   const text=cards[1].querySelector('p.muted');
   const notes=cards[1].querySelector('label');
   if(text)content.appendChild(text);
   if(notes)content.appendChild(notes);
   details.appendChild(content);help.appendChild(details);toolbar.appendChild(help);
  }
 }
 for(const [kind,label] of [['armor','armadura'],['shield','escudo']]){
  const card=pane.querySelector('#'+kind+'Editor');if(!card)continue;
  const header=card.querySelector('.row.between');if(!header||header.querySelector('.equipment-collapse'))continue;
  const toggle=document.createElement('button');toggle.type='button';toggle.className='equipment-collapse ghost';
  const key='duodecima-ui-collapsed-'+kind;
  let collapsed=false;try{collapsed=localStorage.getItem(key)==='1'}catch(_){}
  function sync(){card.classList.toggle('is-collapsed',collapsed);toggle.textContent=collapsed?'Mostrar '+label:'Recolher';toggle.setAttribute('aria-expanded',String(!collapsed))}
  toggle.addEventListener('click',()=>{collapsed=!collapsed;try{localStorage.setItem(key,collapsed?'1':'0')}catch(_){}sync()});
  header.appendChild(toggle);sync();
 }
 }finally{busy=false}
}
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})});
function start(){observer.observe(document.body,{childList:true,subtree:true});refresh()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();