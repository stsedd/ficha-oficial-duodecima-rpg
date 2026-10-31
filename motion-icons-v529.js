/* Duodécima v5.29 — ícones próprios, animações leves, sem dependências externas.
   Camada exclusivamente visual: mantém IDs, inputs e listeners da ficha. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const shapes={
    palette:'<path d="M12 22a10 10 0 1 1 10-10 4 4 0 0 1-4 4h-1.7a2 2 0 0 0-1.8 2.9A2 2 0 0 1 12 22Z"/><circle cx="7.5" cy="11.5" r=".9"/><circle cx="10" cy="7.3" r=".9"/><circle cx="15.2" cy="7.6" r=".9"/><circle cx="17" cy="12" r=".9"/>',
    banner:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5.5-5 3.5 3 4-5 5 5"/>',
    folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2"/><path d="M3.8 10H21l-2.3 10H5.3L3 11.2A1 1 0 0 1 3.8 10Z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M10.5 2h3l.6 2.5c.5.2 1 .4 1.5.7L18 4l2 2-1.2 2.4c.3.5.5 1 .7 1.5l2.5.6v3l-2.5.6c-.2.5-.4 1-.7 1.5L20 18l-2 2-2.4-1.2c-.5.3-1 .5-1.5.7l-.6 2.5h-3l-.6-2.5c-.5-.2-1-.4-1.5-.7L6 20l-2-2 1.2-2.4c-.3-.5-.5-1-.7-1.5L2 13.5v-3l2.5-.6c.2-.5.4-1 .7-1.5L4 6l2-2 2.4 1.2c.5-.3 1-.5 1.5-.7L10.5 2Z"/>',
    'user-plus':'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 8v6m-3-3h6"/>',
    'file-up':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 3-3 3 3M12 12v7"/>',
    'file-down':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 16 3 3 3-3M12 12v7"/>',
    history:'<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    help:'<circle cx="12" cy="12" r="10"/><path d="M9.6 9a2.6 2.6 0 1 1 4.5 1.7c-.9.8-2.1 1.3-2.1 2.8"/><path d="M12 17h.01"/>',
    pencil:'<path d="m16 4 4 4-12 12-5 1 1-5L16 4Z"/><path d="m14 6 4 4"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6"/><path d="M10 10v7m4-7v7"/>',
    reset:'<path d="M3 11a9 9 0 1 1 2.2 6"/><path d="M3 4v7h7"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    overview:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    swords:'<path d="m14.5 17.5 3-3L6 3H3v3l11.5 11.5ZM13 19l6-6"/><path d="m9.5 17.5-3-3L18 3h3v3L9.5 17.5ZM11 19l-6-6"/><path d="m14 19 2 2m-6-2-2 2"/>',
    backpack:'<rect x="4" y="7" width="16" height="15" rx="3"/><path d="M8 7V5a4 4 0 0 1 8 0v2M8 13h8v5H8zM4 12H2m20 0h-2"/>',
    paw:'<ellipse cx="12" cy="16.7" rx="5" ry="3.6"/><ellipse cx="5.5" cy="9" rx="1.4" ry="2"/><ellipse cx="10" cy="6" rx="1.4" ry="2"/><ellipse cx="15" cy="6" rx="1.4" ry="2"/><ellipse cx="19.5" cy="9" rx="1.4" ry="2"/>',
    landmark:'<path d="m3 9 9-6 9 6M4 10h16M5 20h14M3 22h18M7 10v10m5-10v10m5-10v10"/>',
    book:'<path d="M12 7c-2.5-2-5.5-2.5-9-2v14c3.5-.5 6.5 0 9 2 2.5-2 5.5-2.5 9-2V5c-3.5-.5-6.5 0-9 2Zm0 0v14"/>',
    scroll:'<path d="M8 21H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1h10v1a3 3 0 0 0 3 3"/><path d="M8 7h8M8 11h6"/>',
    notes:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M12 8h5m-5 4h5m-5 4h3"/>'
  };
  const tabs={status:'overview',combat:'swords',inventory:'backpack',familiars:'paw',roma:'landmark',magic:'book',history:'scroll',notes:'notes'};
  function svg(kind){
    const result=document.createElementNS(NS,'svg');
    result.setAttribute('viewBox','0 0 24 24');
    result.setAttribute('fill','none');
    result.setAttribute('stroke','currentColor');
    result.setAttribute('stroke-width','1.8');
    result.setAttribute('stroke-linecap','round');
    result.setAttribute('stroke-linejoin','round');
    result.setAttribute('aria-hidden','true');
    result.setAttribute('focusable','false');
    result.classList.add('duo-motion-icon');
    result.innerHTML=shapes[kind]||shapes.plus;
    return result;
  }
  function decorateButton(el,kind){
    if(!el||el.classList.contains('duo-motion-hit'))return;
    el.classList.add('duo-motion-hit');
    el.dataset.motion=kind;
    el.insertBefore(svg(kind),el.firstChild);
  }
  function header(){
    const titles={Aparência:'palette',Arquivo:'folder',Banner:'banner'};
    document.querySelectorAll('.unified-menu>summary').forEach(summary=>{
      if(summary.classList.contains('duo-motion-hit'))return;
      const title=summary.textContent.trim();
      const kind=titles[title]||'folder';
      const copy=document.createElement('span');
      copy.className='duo-motion-text';
      copy.textContent=title;
      summary.replaceChildren(svg(kind),copy);
      summary.dataset.motion=kind;
      summary.classList.add('duo-motion-hit');
    });
    const gear=document.querySelector('.multi-character-actions>summary');
    if(gear&&!gear.classList.contains('duo-motion-hit')){
      gear.replaceChildren(svg('settings'));
      gear.dataset.motion='settings';
      gear.classList.add('duo-motion-hit');
      gear.setAttribute('aria-label','Configurações do personagem');
      gear.setAttribute('title','Configurações do personagem');
    }
    const newChar=document.querySelector('.multi-character-bar [data-multi="new"]');
    if(newChar&&!newChar.classList.contains('duo-motion-hit')){
      newChar.textContent='Nova';
      decorateButton(newChar,'user-plus');
    }
    [
      ['#exportBtn','file-up'],
      ['#importInput','file-down'],
      ['#backupsBtn','history'],
      ['#helpBtn','help'],
      ['#resetBtn','reset'],
      ['#bannerBtn','banner'],
      ['#editBannerBtn','pencil'],
      ['#clearBannerBtn','trash'],
      ['.multi-character-menu [data-multi="copy"]','copy'],
      ['.multi-character-menu [data-multi="export"]','file-up'],
      ['.multi-character-menu [data-multi="delete"]','trash'],
      ['#backupNowBtn','history']
    ].forEach(([selector,kind])=>{
      let el=document.querySelector(selector);
      if(selector==='#importInput')el=el?.closest('label');
      decorateButton(el,kind);
    });
  }
  function sheet(){
    const root=document.getElementById('sheetView');
    if(!root)return;
    root.querySelectorAll('.sheet-tab-scroll [data-tab]').forEach(button=>{
      if(button.classList.contains('duo-motion-hit'))return;
      const kind=tabs[button.dataset.tab];
      if(!kind)return;
      const index=button.querySelector(':scope > span');
      if(index){index.classList.add('duo-motion-tab-index');index.setAttribute('aria-hidden','true')}
      decorateButton(button,kind);
      button.classList.add('duo-motion-tab');
    });
    [
      ['#addInventoryFromLibrary','plus'],
      ['#addInventoryByKind','plus']
    ].forEach(([selector,kind])=>decorateButton(root.querySelector(selector),kind));
  }
  let scheduled=false;
  function queue(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;sheet()});
  }
  function init(){
    header();sheet();
    const root=document.getElementById('sheetView');
    if(root)new MutationObserver(queue).observe(root,{childList:true});
    document.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse')return;
      const hit=event.target.closest?.('.duo-motion-hit');
      if(!hit)return;
      hit.classList.remove('duo-motion-tap');
      // Restart after a second touch, without disturbing the button's native click.
      void hit.offsetWidth;
      hit.classList.add('duo-motion-tap');
      window.setTimeout(()=>hit.classList.remove('duo-motion-tap'),620);
    },{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
