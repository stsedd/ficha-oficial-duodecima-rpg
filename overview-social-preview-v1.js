/* Ficha de testes: novo perfil social e limpeza da Visão Geral.
   Preserva nós originais, cálculos, handlers, campos e exportação. */
(function(){
'use strict';
if(window.__DUO_OVERVIEW_SOCIAL_V1__)return;
window.__DUO_OVERVIEW_SOCIAL_V1__=true;
let queued=false;
const node=(tag,cls,value)=>{
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(value!==undefined)el.textContent=String(value);
  return el;
};
const key=()=> 'duo-overview-test-v1:'+String(window.DUODECIMA_CHARACTER_STORAGE_KEY||'preview-original');
const preferences=()=>{try{return JSON.parse(localStorage.getItem(key())||'{}')}catch{return {}}};
const store=(name,value)=>{try{localStorage.setItem(key(),JSON.stringify({...preferences(),[name]:value}))}catch{}};

function syncBanner(){
  const cover=document.querySelector('#sheetView .duo-profile-cover');
  const image=cover?.querySelector('.duo-profile-cover-image');
  const original=document.getElementById('siteBannerImage');
  if(!cover||!image)return;
  const src=original?.getAttribute('src')||'';
  if(src&&src!==image.getAttribute('src'))image.setAttribute('src',src);
  if(!src)image.removeAttribute('src');
  image.hidden=!src;
  cover.classList.toggle('duo-cover-has-image',!!src);
  if(original?.style.objectPosition)image.style.objectPosition=original.style.objectPosition;
  if(original?.style.transform)image.style.transform=original.style.transform;
}
function profile(rail){
  if(!rail)return;
  rail.classList.add('duo-social-profile');
  // A antiga versão mobile esconde o conteúdo atrás de “Ver perfil completo”.
  // O perfil social substitui esse resumo e mantém seus controles acessíveis.
  if(rail.dataset.mobileExpanded!=='true')rail.dataset.mobileExpanded='true';
  const avatar=rail.querySelector(':scope > .rail-portrait-wrap');
  const identity=rail.querySelector(':scope > .rail-identity');
  if(!avatar||!identity)return;
  if(!rail.querySelector(':scope > .duo-profile-cover')){
    const cover=node('div','duo-profile-cover');
    const image=node('img','duo-profile-cover-image');
    image.alt='';image.hidden=true;
    const legend=node('span','duo-profile-cover-caption','LEGIO XII · FULMINATA');
    const edit=node('button','duo-profile-cover-edit','✎');
    edit.type='button';edit.title='Trocar capa';
    edit.setAttribute('aria-label','Trocar capa do personagem');
    edit.addEventListener('click',()=>{
      const input=document.getElementById('bannerUploadInput');
      if(input)input.click();else document.getElementById('bannerBtn')?.click();
    });
    cover.append(image,legend,edit);
    avatar.before(cover);
  }
  const picture=avatar.querySelector('.rail-portrait');
  if(picture)picture.setAttribute('role','img');
  const photo=avatar.querySelector('#heroPortraitUploadBtn');
  if(photo){if(photo.textContent!=='✎')photo.textContent='✎';photo.title='Trocar retrato';photo.setAttribute('aria-label','Trocar retrato')}
  let orbs=rail.querySelector(':scope > .duo-profile-orbs');
  if(!orbs){orbs=node('div','duo-profile-orbs');identity.after(orbs)}
  const controls=avatar.querySelector('.rail-portrait-badges');
  if(controls)orbs.append(controls);
  if(!identity.querySelector('.duo-profile-kind')){
    const god=identity.querySelector('.eyebrow')?.textContent?.trim()||'Personagem';
    identity.querySelector('h2')?.after(node('div','duo-profile-kind',god));
  }
  const active=rail.querySelector('.rebento-profile-toggle')?.getAttribute('aria-pressed')==='true';
  let badge=identity.querySelector('.duo-profile-rebento-badge');
  if(active&&!badge){
    badge=node('span','duo-profile-rebento-badge','✦ Rebento de Roma');
    identity.querySelector('.rail-meta')?.append(badge);
  }else if(!active&&badge)badge.remove();
  let extra=rail.querySelector(':scope > .duo-profile-extras');
  if(!extra){extra=node('details','duo-profile-extras');extra.append(node('summary','','Bênçãos e opções do perfil'));rail.append(extra)}
  for(const selector of ['#fortunaBlessingToggle','#backCreation']){
    const control=rail.querySelector(selector);
    if(control&&control.parentElement!==extra)extra.append(control);
  }
  syncBanner();
}
function disclosure(title,cls,content,keyName,anchor){
  if(!content||!anchor)return null;
  let parent=content.closest('details.'+cls);
  if(!parent){
    parent=node('details',cls);
    parent.append(node('summary','',title));
    anchor.after(parent);
    parent.append(content);
    parent.open=!!preferences()[keyName];
    parent.addEventListener('toggle',()=>store(keyName,parent.open));
  }
  return parent;
}
function overview(pane){
  const heading=pane?.querySelector('.attribute-sidebar .section-title h3');
  if(heading&&heading.textContent!=='Atributos')heading.textContent='Atributos';
  const skills=pane?.querySelector('.skills-ledger-head');
  if(skills&&!skills.querySelector('.duo-skill-legend'))
    skills.append(node('span','duo-skill-legend','P = Proficiência · E = Expertise'));
  const grid=pane?.querySelector(':scope > .overview-grid');
  if(!grid)return;
  const aux=grid.querySelector(':scope > .overview-aux')||
      pane.querySelector('.duo-overview-secondary .overview-aux');
  const additional=disclosure('Talentos, referência e ajustes','duo-overview-secondary',aux,'secondaryOpen',grid);
  if(additional){
    const count=aux.querySelector('.talents-compact-card .pill')?.textContent?.trim();
    const caption='Talentos, referência e ajustes'+(count?' · '+count:'');
    const summary=additional.querySelector('summary');
    if(summary&&summary.textContent!==caption)summary.textContent=caption;
  }
  const lineage=pane.querySelector(':scope > .lineage-config-visible')||
      pane.querySelector('.duo-overview-lineage .lineage-config-visible');
  disclosure('Linhagem e escolhas de origem','duo-overview-lineage',lineage,'lineageOpen',additional||grid);
}
function romaPanel(rail,roma){
  const original=rail?.querySelector('.rebento-profile-control');
  if(!original||!roma)return;
  let panel=roma.querySelector(':scope > .duo-roma-rebento-card');
  if(!panel){
    panel=node('section','card duo-roma-rebento-card');
    const head=node('div','duo-roma-rebento-heading');
    head.append(node('h3','','Rebento de Roma'),node('p','','Progressão e bênçãos romanas'));
    panel.append(head);
    const first=roma.querySelector(':scope > .grid');
    if(first)first.after(panel);else roma.prepend(panel);
  }
  const signature=original.dataset.rebentoSignature||'';
  const current=panel.querySelector('.rebento-profile-control');
  if(!current||panel.dataset.signature!==signature){
    current?.remove();
    const copy=original.cloneNode(true);
    copy.classList.add('duo-roma-rebento-controls');
    panel.append(copy);
    panel.dataset.signature=signature;
  }
  const core=roma.querySelector('#rebentoApproved')?.closest('label');
  if(core)core.classList.add('duo-rebento-original-approval');
}
function setup(){
  const root=document.querySelector('#sheetView:not(.hidden)');
  const rail=root?.querySelector('.character-rail');
  const status=root?.querySelector('[data-pane="status"]');
  if(!rail||!status)return;
  document.body.classList.add('duo-overview-test');
  profile(rail);
  overview(status);
  romaPanel(rail,root.querySelector('[data-pane="roma"]'));
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;setup()});
}
function init(){
  const root=document.getElementById('sheetView');
  if(!root)return;
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  const banner=document.getElementById('siteBannerImage');
  if(banner)new MutationObserver(syncBanner).observe(banner,{attributes:true,attributeFilter:['src','style','class']});
  schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();