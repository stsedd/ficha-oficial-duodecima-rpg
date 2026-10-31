/* Duodécima v5.26 · keep header menus inside narrow viewports */
(() => {
  'use strict';
  function menus(){return [...document.querySelectorAll('.unified-menu')]}
  function positionMenu(detail){
    if(!detail.open)return;
    const panel=detail.querySelector('.unified-menu-content');
    const summary=detail.querySelector('summary');
    if(!panel||!summary)return;
    if(!window.matchMedia('(max-width:620px)').matches){
      panel.style.removeProperty('left');
      panel.style.removeProperty('top');
      return;
    }
    const pad=12, vw=window.innerWidth, vh=window.innerHeight;
    const width=Math.min(340,Math.max(0,vw-2*pad));
    const rect=summary.getBoundingClientRect();
    const left=Math.min(Math.max(pad,rect.right-width),Math.max(pad,vw-pad-width));
    panel.style.left=Math.round(left)+'px';
    const height=Math.min(panel.scrollHeight,Math.max(100,vh-2*pad));
    const below=rect.bottom+6;
    const top=below+height+pad<=vh?below:Math.max(pad,vh-height-pad);
    panel.style.top=Math.round(top)+'px';
  }
  function sync(){menus().forEach(positionMenu)}
  function init(){
    const controls=menus();if(!controls.length)return;
    controls.forEach(d=>d.addEventListener('toggle',()=>requestAnimationFrame(sync)));
    window.addEventListener('resize',sync,{passive:true});
    window.addEventListener('scroll',sync,{passive:true,capture:true});
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape')return;
      const opened=controls.find(d=>d.open);
      if(opened){opened.open=false;opened.querySelector('summary')?.focus()}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
