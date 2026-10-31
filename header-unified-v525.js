/* Duodécima v5.25 · header unificado, preservando IDs e eventos originais. */
(function(){
'use strict';
function init(){
 const brand=document.querySelector('.archive-brandbar'), toolbar=document.querySelector('.archive-toolbar');
 const actions=toolbar?.querySelector('.archive-actions'),appearance=brand?.querySelector('.appearance-top-actions');
 if(!brand||!toolbar||!actions||!appearance||brand.querySelector('.unified-top-controls'))return;
 const controls=document.createElement('div');controls.className='unified-top-controls';
 const menu=(name)=>{const d=document.createElement('details');d.className='unified-menu';const s=document.createElement('summary');s.textContent=name;s.setAttribute('aria-label','Abrir menu '+name);const body=document.createElement('div');body.className='unified-menu-content';d.append(s,body);controls.appendChild(d);return body};
 const theme=menu('Aparência'),archive=menu('Arquivo'),banner=menu('Banner');
 const palette=document.querySelector('#themePaletteBtn'),special=document.querySelector('#themeSpecialBtn');
 if(palette)theme.appendChild(palette);if(special)theme.appendChild(special);
 for(const id of ['exportBtn','importInput','backupsBtn','helpBtn','resetBtn']){
  let el=id==='importInput'?document.querySelector('#importInput')?.closest('label'):document.getElementById(id);if(el)archive.appendChild(el);
 }
 for(const id of ['bannerBtn','editBannerBtn','clearBannerBtn','bannerUploadInput']){const el=document.getElementById(id);if(el)banner.appendChild(el)}
 appearance.appendChild(controls);
 toolbar.classList.add('unified-toolbar');
 // Retain storage status; hide only redundant toolbar placement.
 document.querySelectorAll('.unified-menu').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.unified-menu').forEach(o=>{if(o!==d)o.open=false})}));
 document.addEventListener('click',e=>{if(!e.target.closest?.('.unified-menu'))document.querySelectorAll('.unified-menu[open]').forEach(o=>o.open=false)});
 const marker=toolbar.querySelector('.version-chip');if(marker)marker.textContent='v5.29 · microinterações';
 const footer=document.querySelector('footer p');if(footer)footer.textContent=footer.textContent.replace(/v5\.21\.1-ability-deck-polish/,'v5.29');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();