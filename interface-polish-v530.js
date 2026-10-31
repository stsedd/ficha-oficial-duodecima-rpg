/* Duodécima v5.30 — acessibilidade e comportamento dos menus.
   Apenas elementos de interface; não lê ou altera os dados dos personagens. */
(() => {
  'use strict';
  const labels={palette:'Aparência',folder:'Arquivo',banner:'Banner'};
  function summaries(){
    return Array.from(document.querySelectorAll('.unified-menu>summary'));
  }
  function updateSummary(summary){
    const detail=summary.parentElement;
    if(!detail)return;
    const label=labels[summary.dataset.motion]||
      summary.querySelector('.duo-motion-text')?.textContent?.trim()||
      summary.textContent.trim()||'Menu';
    summary.title=label;
    summary.setAttribute('aria-label',(detail.open?'Fechar':'Abrir')+' menu '+label);
    summary.setAttribute('aria-expanded',String(Boolean(detail.open)));
    if(detail.open){
      detail.querySelectorAll('.unified-menu-content button, .unified-menu-content label').forEach(el=>{
        if(!el.getAttribute('title')){
          const t=el.textContent?.trim();
          if(t)el.title=t.slice(0,75);
        }
      });
    }
  }
  function closeMenus(restoreFocus=false){
    const open=Array.from(document.querySelectorAll('.unified-menu[open], .multi-character-actions[open]'));
    open.forEach(detail=>{
      detail.open=false;
      if(restoreFocus)detail.querySelector(':scope > summary')?.focus();
    });
  }
  function init(){
    const menuSummaries=summaries();
    if(!menuSummaries.length)return;
    const all=Array.from(document.querySelectorAll('.unified-menu, .multi-character-actions'));
    for(const detail of all){
      const summary=detail.querySelector(':scope > summary');
      if(!summary)continue;
      if(detail.classList.contains('unified-menu')){
        updateSummary(summary);
        detail.addEventListener('toggle',()=>{
          updateSummary(summary);
          if(detail.open){
            const characterMenu=document.querySelector('.multi-character-actions[open]');
            if(characterMenu)characterMenu.open=false;
          }
        });
        const panel=detail.querySelector('.unified-menu-content');
        panel?.addEventListener('click',event=>{
          const button=event.target.closest?.('button');
          if(!button||!panel.contains(button))return;
          // Aguarda o acionamento nativo; não interfere em inputs, downloads ou modais.
          window.setTimeout(()=>{if(detail.open)detail.open=false},0);
        });
      }else{
        summary.title='Configurações do personagem';
        summary.setAttribute('aria-expanded',String(Boolean(detail.open)));
        detail.addEventListener('toggle',()=>{
          summary.setAttribute('aria-expanded',String(Boolean(detail.open)));
          if(detail.open){
            document.querySelectorAll('.unified-menu[open]').forEach(x=>x.open=false);
          }
        });
      }
    }
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      if(document.querySelector('dialog[open]'))return;
      const open=all.filter(d=>d.open);
      if(!open.length)return;
      event.preventDefault();
      closeMenus(true);
    });
    document.addEventListener('click',event=>{
      const menu=document.querySelector('.multi-character-actions[open]');
      if(menu&&!menu.contains(event.target))menu.open=false;
    });
    const toast=document.getElementById('toast');
    if(toast){
      toast.setAttribute('role','status');
      toast.setAttribute('aria-live','polite');
      toast.setAttribute('aria-atomic','true');
    }
    // O script anterior injeta os ícones nas abas a cada render. Não recriá-los.
    document.documentElement.dataset.uiVersion='5.30';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
