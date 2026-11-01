/* Duodécima v5.32 · viewport mobile e teclado virtual */
(() => {
 'use strict';
 const root=document.documentElement;
 let pending=false;
 function update(){
   pending=false;
   const viewport=window.visualViewport;
   root.style.setProperty('--duo-vv-height',Math.max(160,Math.round(viewport?.height||window.innerHeight))+'px');
   root.style.setProperty('--duo-vv-top',Math.round(viewport?.offsetTop||0)+'px');
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(update)}
 function focusAdjust(){
   if(!window.matchMedia('(max-width:620px)').matches)return;
   const active=document.activeElement;
   if(!active?.matches?.('input,textarea,select'))return;
   // Ajuste somente quando o teclado reduzir de fato a área visível.
   if(!window.visualViewport||window.visualViewport.height>window.innerHeight-110)return;
   requestAnimationFrame(()=>{
     if(document.activeElement===active)active.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'auto'});
   });
 }
 function init(){
   update();
   window.addEventListener('resize',schedule,{passive:true});
   window.addEventListener('orientationchange',schedule,{passive:true});
   window.visualViewport?.addEventListener('resize',()=>{schedule();focusAdjust()},{passive:true});
   window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
   document.addEventListener('focusin',()=>window.setTimeout(focusAdjust,160),{passive:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
