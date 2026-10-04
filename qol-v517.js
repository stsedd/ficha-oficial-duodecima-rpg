(()=>{
  'use strict';

  const STORAGE_PREFIX='duodecima_universal_';
  const STORAGE_KEY='duodecima_universal_stage4_v24';
  let refreshQueued=false;

  function escapeHtml(value=''){
    return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function readSheet(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||{}}catch(_){return {}}
  }

  function sanityInfo(value){
    const s=Math.max(0,Math.min(100,Number(value)||0));
    if(s===0)return {key:'insane',name:'Louco',range:'0',tone:'danger',automatic:'',text:'Perda permanente do personagem.'};
    if(s<=20)return {key:'brink',name:'À Beira da Loucura',range:'20–1',tone:'danger',automatic:'INT −5 · CAR −5 · FÉ −3',text:'Falha automática contra ficar Abalado ou Apavorado. No início do turno, faça um teste de Fé DT 15; em falha, não pode agir. Mantém as penalidades mentais do estágio Abalado.'};
    if(s<=40)return {key:'shaken',name:'Abalado',range:'40–21',tone:'orange',automatic:'INT −5 · CAR −5 · FÉ −3',text:'−5 em Inteligência e Carisma; −3 em testes de Fé. Ataques que explorem medo causam dano dobrado à Sanidade.'};
    if(s<=70)return {key:'unstable',name:'Instável',range:'70–41',tone:'warn',automatic:'INT −2 · CAR −2',text:'−2 em Inteligência, Carisma e testes ligados à lógica ou concentração.'};
    return {key:'stable',name:'Estável',range:'100–71',tone:'good',automatic:'',text:'Sem penalidades.'};
  }

  function installStyles(){
    if(document.querySelector('#qol-v517-styles'))return;
    const style=document.createElement('style');
    style.id='qol-v517-styles';
    style.textContent=`
      .qol-rest-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;margin:0 0 12px;border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--accent) 4%,var(--panel));box-shadow:none}
      .qol-rest-copy{display:flex;align-items:baseline;gap:8px;min-width:0}.qol-rest-copy b{font-size:12px}.qol-rest-copy small{color:var(--muted);font-size:10px;white-space:nowrap}
      .qol-rest-actions{display:flex;gap:7px;flex-wrap:wrap}.qol-rest-actions button{min-height:30px;padding:6px 10px;font-size:11px}
      .qol-sanity-card{display:grid;grid-template-columns:minmax(150px,.48fr) minmax(0,1.52fr);gap:12px;align-items:center;padding:11px 13px;margin:0 0 12px;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;background:var(--panel)}
      .qol-sanity-card[data-tone="good"]{border-left-color:#4bc46b}.qol-sanity-card[data-tone="warn"]{border-left-color:#e0b43e}.qol-sanity-card[data-tone="orange"]{border-left-color:#ed802f}.qol-sanity-card[data-tone="danger"]{border-left-color:#e23a50}
      .qol-sanity-head{display:flex;align-items:center;gap:9px;min-width:0}.qol-sanity-value{font:800 20px/1 system-ui,sans-serif}.qol-sanity-name{display:flex;flex-direction:column;min-width:0}.qol-sanity-name b{font-size:12px}.qol-sanity-name small{font-size:9px;color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
      .qol-sanity-effect{font-size:11px;line-height:1.45;color:var(--text)}.qol-sanity-effect small{display:block;margin-top:3px;color:var(--muted);font-size:9px}.qol-sanity-auto{display:inline-block;margin-right:6px;padding:2px 6px;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:999px;font-size:9px;font-weight:800;color:var(--text);background:color-mix(in srgb,var(--accent) 7%,transparent)}
      .qol-effective-attr{color:var(--accent)!important}.qol-effective-attr:after{content:' SAN';margin-left:4px;font-size:7px;vertical-align:top;color:var(--muted);letter-spacing:.08em}
      .qol-reset-dialog{width:min(500px,calc(100vw - 28px));padding:0;border:1px solid var(--line);border-radius:16px;background:var(--panel);color:var(--text);box-shadow:0 26px 90px #000a}.qol-reset-dialog::backdrop{background:#000b;backdrop-filter:blur(3px)}
      .qol-reset-card{padding:20px}.qol-reset-card h2{margin:2px 0 8px}.qol-reset-warning{margin:14px 0;padding:12px;border:1px solid color-mix(in srgb,#e0b43e 36%,var(--line));border-radius:10px;background:color-mix(in srgb,#e0b43e 8%,transparent);font-size:12px;line-height:1.5}.qol-reset-card .qol-reset-question{font-weight:800;margin:14px 0 4px}.qol-reset-actions{display:flex;justify-content:space-between;gap:8px;margin-top:18px;flex-wrap:wrap}.qol-reset-actions .qol-reset-final{margin-left:auto}
      @media(max-width:680px){.qol-rest-strip{align-items:flex-start;flex-direction:column}.qol-rest-copy{flex-direction:column;gap:2px}.qol-rest-copy small{white-space:normal}.qol-sanity-card{grid-template-columns:1fr}.qol-reset-actions{flex-direction:column}.qol-reset-actions button{width:100%}.qol-reset-actions .qol-reset-final{margin-left:0}}
    `;
    document.head.appendChild(style);
  }

  function ensureResetDialog(){
    let dialog=document.querySelector('#qolResetDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='qolResetDialog';dialog.className='qol-reset-dialog';
    dialog.innerHTML=`<div class="qol-reset-card"><p class="eyebrow">NOVA FICHA</p><h2>Resetar ficha</h2><div class="qol-reset-warning"><b>Salve seu personagem antes de continuar.</b><br>Antes de resetar a ficha, recomendamos exportar o JSON atual. Assim, você poderá importar este personagem novamente no futuro sem perder os dados.</div><p class="qol-reset-question">Tem certeza de que deseja resetar a ficha?</p><p class="muted compact">Esta ação limpa os dados da ficha atual para você criar um novo personagem. Os backups automáticos não serão apagados.</p><div class="qol-reset-actions"><button type="button" class="ghost" data-qol-export>Exportar JSON agora</button><button type="button" class="ghost" data-qol-reset-cancel>Cancelar</button><button type="button" class="danger qol-reset-final" data-qol-reset-confirm>Sim, resetar</button></div></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('[data-qol-reset-cancel]').onclick=()=>dialog.close();
    dialog.querySelector('[data-qol-export]').onclick=()=>document.querySelector('#exportBtn')?.click();
    dialog.querySelector('[data-qol-reset-confirm]').onclick=()=>{
      try{
        const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
        keys.filter(k=>k&&k.startsWith(STORAGE_PREFIX)).forEach(k=>localStorage.removeItem(k));
      }catch(err){console.warn('[Ficha] Não foi possível limpar o armazenamento local.',err)}
      dialog.close();
      location.reload();
    };
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    return dialog;
  }

  function installResetIntercept(){
    if(document.documentElement.dataset.qolResetIntercept==='1')return;
    document.documentElement.dataset.qolResetIntercept='1';
    document.addEventListener('click',event=>{
      const button=event.target?.closest?.('#resetBtn');if(!button)return;
      event.preventDefault();event.stopImmediatePropagation();
      const dialog=ensureResetDialog();
      if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    },true);
  }

  function relocateRests(){
    const status=document.querySelector('[data-pane="status"]');
    const combat=document.querySelector('[data-pane="combat"]');
    if(!status||!combat)return;
    const shortBtn=combat.querySelector('#shortRest'),longBtn=combat.querySelector('#longRest');
    if(!shortBtn||!longBtn)return;
    let strip=status.querySelector('.qol-rest-strip');
    if(!strip){
      strip=document.createElement('article');strip.className='qol-rest-strip';
      strip.innerHTML='<div class="qol-rest-copy"><b>Descansos</b><small>Curto: +25 HP / +150 EN · Longo: HP e EN completos</small></div><div class="qol-rest-actions"></div>';
      const anchor=status.querySelector('.overview-grid')||status.firstElementChild;
      if(anchor)status.insertBefore(strip,anchor);else status.prepend(strip);
    }
    const actions=strip.querySelector('.qol-rest-actions');actions.append(shortBtn,longBtn);
    const restCard=combat.querySelector('.combat-rest-card');
    if(restCard){
      const eyebrow=restCard.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='MODS DE COMBATE';
      const info=restCard.querySelector('.subcard.compact');if(info)info.remove();
    }
  }

  function makeSanityCard(scope,info,sanity){
    const card=document.createElement('article');
    card.className='qol-sanity-card';card.dataset.qolSanity=scope;card.dataset.tone=info.tone;
    const auto=info.automatic?`<span class="qol-sanity-auto">automático · ${escapeHtml(info.automatic)}</span>`:'';
    card.innerHTML=`<div class="qol-sanity-head"><strong class="qol-sanity-value">${sanity}</strong><div class="qol-sanity-name"><b>${escapeHtml(info.name)}</b><small>${escapeHtml(info.range)} de Sanidade</small></div></div><div class="qol-sanity-effect">${auto}${escapeHtml(info.text)}<small>As penalidades numéricas de atributos são aplicadas automaticamente aos cálculos da ficha.</small></div>`;
    return card;
  }

  function updateSanityCards(){
    const state=readSheet();const sanity=Math.max(0,Math.min(100,Number(state.currentSanity??100)));const info=sanityInfo(sanity);
    const status=document.querySelector('[data-pane="status"]'),combat=document.querySelector('[data-pane="combat"]');
    for(const [scope,pane] of [['status',status],['combat',combat]]){
      if(!pane)continue;
      let card=pane.querySelector(`.qol-sanity-card[data-qol-sanity="${scope}"]`);
      const replacement=makeSanityCard(scope,info,sanity);
      if(card)card.replaceWith(replacement);else{
        const rest=scope==='status'?pane.querySelector('.qol-rest-strip'):null;
        const anchor=rest?.nextElementSibling||pane.querySelector(scope==='status'?'.overview-grid':'.target-resource-zone, .combat-command-grid');
        if(anchor)pane.insertBefore(replacement,anchor);else pane.prepend(replacement);
      }
    }
    document.querySelectorAll('.core-san .core-stat-caption').forEach(el=>el.textContent=info.name);
    document.querySelectorAll('.combat-quick-values>div').forEach(row=>{if(row.querySelector('span')?.textContent?.trim()==='Sanidade'){const value=row.querySelector('b');if(value)value.textContent=info.name}});
    document.querySelectorAll('.attr').forEach(card=>{
      const breakdown=card.querySelector('.attr-break')?.textContent||'';
      const match=breakdown.match(/efetivo\s+([−-]?\d+)/i);const total=card.querySelector('.attr-total');
      if(match&&total){total.textContent=match[1].replace('−','-');total.classList.add('qol-effective-attr');}
    });
  }

  function refresh(){
    installStyles();ensureResetDialog();relocateRests();updateSanityCards();
  }

  function queueRefresh(){
    if(refreshQueued)return;refreshQueued=true;
    requestAnimationFrame(()=>{refreshQueued=false;refresh()});
  }

  function init(){
    installStyles();installResetIntercept();refresh();
    const root=document.querySelector('#sheetView')||document.body;
    new MutationObserver(queueRefresh).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',queueRefresh);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
