/* Duodécima v5.35 — ordenar baralhos por arraste, mouse, toque longo e teclado.
   A ordem é gravada na ficha JSON pelo app principal; as regras não mudam. */
(() => {
 'use strict';
 const TYPES=[
  {type:'equipment',deck:'.equipment-deck.upgraded-equipment-deck',card:'.equipment-card[data-equipment-key]',key:'equipmentKey'},
  {type:'abilities',deck:'.ability-quick-track',card:'.ability-quick-card[data-open-ability]',key:'openAbility'}
 ];
 const HOLD_MS=1000;
 let current=null,ignoreClickUntil=0,scheduled=false;
 const announcer=document.createElement('div');
 announcer.className='deck-reorder-announcer';
 announcer.setAttribute('role','status');
 announcer.setAttribute('aria-live','polite');
 announcer.setAttribute('aria-atomic','true');
 function cards(deck,cfg){return [...deck.querySelectorAll(':scope > '+cfg.card)]}
 function message(msg){announcer.textContent='';requestAnimationFrame(()=>{announcer.textContent=msg})}
 function isInteractive(target){return !!target.closest?.('button,input,textarea,select,a,label,summary,[contenteditable="true"]')}
 function identify(card,cfg){return card.dataset[cfg.key]||''}
 function commit(deck,cfg,before){
  const order=cards(deck,cfg).map(x=>identify(x,cfg));
  if(!window.DUODECIMA_REORDER_DECK?.(cfg.type,order)){
   before.forEach(el=>deck.appendChild(el));
   message('Não foi possível salvar a ordem. As cartas voltaram à posição original.');
   return false;
  }
  message('Nova ordem das cartas salva na ficha.');
  return true;
 }
 function reorderByKeyboard(deck,cfg,card,direction){
  const list=cards(deck,cfg),index=list.indexOf(card),next=index+direction;
  if(index<0||next<0||next>=list.length)return;
  const sibling=list[next];
  if(direction<0)deck.insertBefore(card,sibling);
  else deck.insertBefore(sibling,card);
  if(!commit(deck,cfg,list))return;
  card.querySelector('.deck-reorder-handle')?.focus();
 }
 function decorate(deck,cfg){
  if(deck.dataset.deckReorderBound==='1')return;
  deck.dataset.deckReorderBound='1';
  deck.dataset.deckReorderType=cfg.type;
  const list=cards(deck,cfg);
  if(list.length<2)return;
  deck.classList.add('deck-reorderable');
  list.forEach(card=>{
   if(card.querySelector('.deck-reorder-handle'))return;
   const handle=document.createElement('button');
   handle.type='button';handle.className='deck-reorder-handle';
   handle.textContent='⠿';
   handle.setAttribute('aria-label','Mover carta: use as setas esquerda e direita');
   handle.title='Arrastar carta · no celular, segure por 1 segundo · pelo teclado, use as setas';
   card.prepend(handle);
  });
  const hint=document.createElement('p');
  hint.className='deck-reorder-hint';
  hint.textContent=cfg.type==='equipment'
   ?'Organize os itens arrastando as cartas. No celular, segure por 1 segundo antes de arrastar.'
   :'Arraste para reorganizar as habilidades. No celular, segure por 1 segundo.';
  deck.before(hint);
  deck.addEventListener('mousedown',event=>{
   if(event.button!==0||current)return;
   const card=event.target.closest(cfg.card);
   if(!card||card.parentElement!==deck||isInteractive(event.target)&&!event.target.closest('.deck-reorder-handle'))return;
   current={deck,cfg,card,method:'mouse',startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false,original:cards(deck,cfg),timer:null};
  });
  deck.addEventListener('touchstart',event=>{
   if(current||event.touches.length!==1)return;
   const card=event.target.closest(cfg.card);
   if(!card||card.parentElement!==deck||isInteractive(event.target)&&!event.target.closest('.deck-reorder-handle'))return;
   const t=event.touches[0];
   current={deck,cfg,card,method:'touch',startX:t.clientX,startY:t.clientY,x:t.clientX,y:t.clientY,active:false,original:cards(deck,cfg),timer:null};
   const pending=current;
   pending.timer=window.setTimeout(()=>{if(current===pending)activate(pending)},HOLD_MS);
  },{passive:true});
  deck.addEventListener('keydown',event=>{
   const handle=event.target.closest('.deck-reorder-handle');
   if(!handle||!deck.contains(handle))return;
   const direction=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:event.key==='ArrowRight'||event.key==='ArrowDown'?1:0;
   if(!direction)return;
   event.preventDefault();event.stopPropagation();
   const card=handle.closest(cfg.card);
   if(card)reorderByKeyboard(deck,cfg,card,direction);
  });
  deck.addEventListener('click',event=>{
   if(!event.target.closest('.deck-reorder-handle'))return;
   event.preventDefault();event.stopPropagation();
  },true);
 }
 function activate(drag){
  if(drag.active||current!==drag)return;
  drag.active=true;
  drag.deck.classList.add('deck-reorder-active');
  drag.card.classList.add('deck-reorder-source');
  drag.card.setAttribute('aria-grabbed','true');
  const rect=drag.card.getBoundingClientRect();
  drag.dx=drag.x-rect.left;drag.dy=drag.y-rect.top;
  const ghost=drag.card.cloneNode(true);
  ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  ghost.removeAttribute('id');
  ghost.classList.add('deck-reorder-ghost');
  ghost.classList.remove('deck-reorder-source');
  ghost.setAttribute('aria-hidden','true');
  ghost.style.width=Math.round(rect.width)+'px';
  ghost.style.height=Math.round(rect.height)+'px';
  document.body.appendChild(ghost);
  drag.ghost=ghost;
  moveGhost(drag);
  ignoreClickUntil=Date.now()+600;
  drag.raf=requestAnimationFrame(function autoscroll(){
   if(current!==drag||!drag.active)return;
   const deck=drag.deck,rect=deck.getBoundingClientRect();
   if(deck.scrollWidth>deck.clientWidth+3){
    let step=0;
    if(drag.x<rect.left+52)step=-17;
    else if(drag.x>rect.right-52)step=17;
    if(step&&drag.y>=rect.top&&drag.y<=rect.bottom){
     const old=deck.scrollLeft;deck.scrollLeft+=step;
     if(deck.scrollLeft!==old)reposition(drag);
    }
   }
   drag.raf=requestAnimationFrame(autoscroll);
  });
 }
 function moveGhost(drag){
  if(!drag.ghost)return;
  drag.ghost.style.left=Math.round(drag.x-drag.dx)+'px';
  drag.ghost.style.top=Math.round(drag.y-drag.dy)+'px';
 }
 function reposition(drag){
  const deck=drag.deck,card=drag.card;
  const hit=document.elementFromPoint(drag.x,drag.y)?.closest(drag.cfg.card);
  if(!hit||hit===card||hit.parentElement!==deck)return;
  const rect=hit.getBoundingClientRect();
  const before=drag.x<rect.left+rect.width/2;
  if(before&&card.nextElementSibling!==hit)deck.insertBefore(card,hit);
  else if(!before&&hit.nextElementSibling!==card)deck.insertBefore(card,hit.nextElementSibling);
 }
 function update(x,y,kind,event){
  const drag=current;
  if(!drag||drag.method!==kind)return;
  drag.x=x;drag.y=y;
  if(!drag.active){
   const distance=Math.hypot(x-drag.startX,y-drag.startY);
   if(kind==='touch'){if(distance>12)cancel();return}
   if(distance<8)return;
   activate(drag);
  }
  if(kind==='touch'&&event?.cancelable)event.preventDefault();
  moveGhost(drag);reposition(drag);
 }
 function cancel(){
  if(!current)return;
  if(current.timer)clearTimeout(current.timer);
  if(current.raf)cancelAnimationFrame(current.raf);
  current.ghost?.remove();
  current.card.classList.remove('deck-reorder-source');
  current.card.removeAttribute('aria-grabbed');
  current.deck.classList.remove('deck-reorder-active');
  current=null;
 }
 function finish(){
  const drag=current;
  if(!drag)return;
  const changed=drag.active&&cards(drag.deck,drag.cfg).some((node,index)=>drag.original[index]!==node);
  if(changed)commit(drag.deck,drag.cfg,drag.original);
  if(drag.active)ignoreClickUntil=Date.now()+650;
  cancel();
 }
 function rescan(){
  const root=document.getElementById('sheetView');
  if(!root)return;
  for(const cfg of TYPES)root.querySelectorAll(cfg.deck).forEach(deck=>decorate(deck,cfg));
 }
 function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;rescan()});
 }
 function init(){
  document.body.appendChild(announcer);
  const root=document.getElementById('sheetView');
  if(root)new MutationObserver(schedule).observe(root,{childList:true});
  schedule();
  document.addEventListener('mousemove',e=>update(e.clientX,e.clientY,'mouse'));
  document.addEventListener('mouseup',()=>{if(current?.method==='mouse')finish()});
  document.addEventListener('touchmove',e=>{
   if(current?.method!=='touch')return;
   const touch=e.touches[0];
   if(touch)update(touch.clientX,touch.clientY,'touch',e);
  },{passive:false});
  document.addEventListener('touchend',()=>{if(current?.method==='touch')finish()},{passive:true});
  document.addEventListener('touchcancel',()=>{if(current?.method==='touch')cancel()},{passive:true});
  window.addEventListener('blur',cancel);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current){cancel();e.preventDefault()}});
  document.addEventListener('click',e=>{
   if(Date.now()>ignoreClickUntil)return;
   if(e.target.closest?.('.equipment-card,.ability-quick-card')){
    e.preventDefault();e.stopImmediatePropagation();
   }
  },true);
  document.addEventListener('contextmenu',e=>{
   if(current?.method==='touch'&&(current.active||current.timer)&&current.card.contains(e.target))e.preventDefault();
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
